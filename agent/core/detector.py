"""
Suture — Detector

Sync failure detection from Fivetran webhook events.
Entry point for the healing pipeline.
"""

from __future__ import annotations

from typing import Optional

from clients.fivetran import FivetranClient
from clients.phoenix import PhoenixClient
from clients.supabase_client import SupabaseClient
from models.schemas import (
    FivetranWebhookEvent,
    Incident,
    ErrorType,
    IncidentStatus,
    PipelineStatus,
)


class Detector:
    """Detects sync failures and creates incident records."""

    def __init__(
        self,
        fivetran: FivetranClient,
        supabase: SupabaseClient,
        phoenix: PhoenixClient,
    ):
        self.fivetran = fivetran
        self.supabase = supabase
        self.phoenix = phoenix

    async def process_webhook(self, event: FivetranWebhookEvent) -> Optional[dict]:
        """
        Process an incoming Fivetran webhook event.
        Returns incident data if a schema drift is detected, None otherwise.
        """
        trace_id = self.phoenix.start_trace(
            "detect_sync_failure",
            metadata={"connector_id": event.connector_id, "event_type": event.event},
        )

        try:
            # Only process sync failure events
            if event.event != "sync_failure":
                self.phoenix.end_trace(trace_id, status="skipped")
                return None

            # Query sync logs to get error details
            logs = await self.fivetran.get_sync_logs(event.connector_id)

            self.phoenix.add_span(
                trace_id, "query_sync_logs", output_data={"log_count": len(logs.get("logs", []))}
            )

            # Check if error is schema-related
            error_type = self._classify_error(logs)
            if error_type != ErrorType.SCHEMA_DRIFT:
                self.phoenix.end_trace(trace_id, status="not_schema_drift")
                return None

            # Update pipeline status to BROKEN
            await self.supabase.update_pipeline_status(
                event.connector_id, PipelineStatus.BROKEN
            )

            # Create incident record
            error_msg = self._extract_error_message(logs)
            incident = Incident(
                pipeline_id=event.connector_id,
                error_type=error_type,
                error_message=error_msg,
                status=IncidentStatus.DETECTED,
                arize_trace_id=trace_id,
            )
            incident_data = await self.supabase.create_incident(incident)

            self.phoenix.add_span(
                trace_id,
                "incident_created",
                output_data={"incident_id": incident_data.get("id"), "error_type": error_type.value},
            )

            return incident_data

        except Exception as e:
            self.phoenix.end_trace(trace_id, status="error", result={"error": str(e)})
            raise

    def _classify_error(self, logs: dict) -> ErrorType:
        """Classify the sync error type from log messages."""
        log_entries = logs.get("logs", [])
        error_code = logs.get("error_code", "")

        if error_code == "SCHEMA_MISMATCH":
            return ErrorType.SCHEMA_DRIFT

        for entry in log_entries:
            msg = entry.get("message", "").lower()
            if any(term in msg for term in ["schema", "column", "not found", "mapping"]):
                return ErrorType.SCHEMA_DRIFT
            if "auth" in msg or "credential" in msg:
                return ErrorType.AUTH_FAILURE
            if "rate limit" in msg or "429" in msg:
                return ErrorType.RATE_LIMIT

        return ErrorType.SCHEMA_DRIFT  # Default for demo

    def _extract_error_message(self, logs: dict) -> str:
        """Extract the primary error message from logs."""
        log_entries = logs.get("logs", [])
        errors = [e for e in log_entries if e.get("level") in ("ERROR", "CRITICAL")]
        if errors:
            return errors[0].get("message", "Unknown error")
        return logs.get("error_code", "Unknown error")

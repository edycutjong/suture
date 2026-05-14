"""
Suture — Verifier

Triggers re-sync after patching and polls for success.
Completes the healing loop.
"""

from __future__ import annotations

import asyncio
import time
from typing import Any

from clients.fivetran import FivetranClient
from clients.phoenix import PhoenixClient
from clients.supabase_client import SupabaseClient
from models.schemas import IncidentStatus, PipelineStatus


class Verifier:
    """Triggers re-sync and verifies the pipeline is healthy again."""

    def __init__(
        self,
        fivetran: FivetranClient,
        supabase: SupabaseClient,
        phoenix: PhoenixClient,
    ):
        self.fivetran = fivetran
        self.supabase = supabase
        self.phoenix = phoenix
        self.max_poll_attempts = 10
        self.poll_interval_seconds = 3

    async def verify(
        self,
        connector_id: str,
        incident_id: str,
        trace_id: str,
        started_at: float,
    ) -> dict[str, Any]:
        """
        Trigger a re-sync and poll until the sync succeeds or fails.
        Returns the final verification result.
        """
        self.phoenix.add_span(
            trace_id, "verify_start", input_data={"connector_id": connector_id}
        )

        # Trigger forced re-sync
        sync_result = await self.fivetran.trigger_sync(connector_id)

        self.phoenix.add_span(
            trace_id, "sync_triggered", output_data=sync_result
        )

        # Poll for sync completion
        success = await self._poll_sync_status(connector_id, trace_id)

        # Calculate resolution time
        resolution_time_ms = int((time.time() - started_at) * 1000)

        if success:
            # Update to HEALED
            await self.supabase.update_pipeline_status(
                connector_id, PipelineStatus.HEALED
            )
            await self.supabase.update_incident(
                incident_id,
                {
                    "status": IncidentStatus.RESOLVED.value,
                    "resolution_time_ms": resolution_time_ms,
                    "resolved_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                },
            )

            self.phoenix.end_trace(
                trace_id,
                status="resolved",
                result={
                    "resolution_time_ms": resolution_time_ms,
                    "connector_id": connector_id,
                },
            )

            return {
                "status": "healed",
                "resolution_time_ms": resolution_time_ms,
                "connector_id": connector_id,
            }
        else:
            # Update to FAILED
            await self.supabase.update_incident(
                incident_id,
                {
                    "status": IncidentStatus.FAILED.value,
                    "resolution_time_ms": resolution_time_ms,
                },
            )

            self.phoenix.end_trace(
                trace_id,
                status="failed",
                result={"error": "Sync did not succeed after patching"},
            )

            return {
                "status": "failed",
                "resolution_time_ms": resolution_time_ms,
                "connector_id": connector_id,
                "error": "Sync verification failed",
            }

    async def _poll_sync_status(self, connector_id: str, trace_id: str) -> bool:
        """Poll Fivetran for sync completion status."""
        for attempt in range(self.max_poll_attempts):
            state = await self.fivetran.get_connector_state(connector_id)
            sync_state = state.get("sync_state", "")

            self.phoenix.add_span(
                trace_id,
                f"poll_attempt_{attempt + 1}",
                output_data={"sync_state": sync_state},
            )

            if sync_state in ("synced", "rescheduled", "scheduled"):
                return True
            if sync_state in ("failed", "broken"):
                return False

            if self.fivetran.mode == "mock":
                # Mock mode: instant success
                return True

            await asyncio.sleep(self.poll_interval_seconds)

        return False

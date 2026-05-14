"""
Suture — Supabase Client

Database client for pipeline state and incident history.
"""

from __future__ import annotations

import os
from typing import Any, Optional

from models.schemas import Pipeline, Incident, PipelineStatus, IncidentStatus


class SupabaseClient:
    """Supabase database client for pipeline state management."""

    def __init__(self):
        self.url = os.getenv("SUPABASE_URL", "")
        self.service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
        self._client = None

        # In-memory store for mock mode
        self._mock_pipelines: dict[str, dict] = {}
        self._mock_incidents: list[dict] = []

    def _get_client(self):
        """Lazy-initialize the Supabase client."""
        if self._client is None and self.url and self.service_key:
            try:
                from supabase import create_client
                self._client = create_client(self.url, self.service_key)
            except (ImportError, Exception):
                self._client = None
        return self._client

    # ── Pipelines ─────────────────────────────────────────────

    async def upsert_pipeline(self, pipeline: Pipeline) -> dict[str, Any]:
        """Insert or update a pipeline record."""
        data = pipeline.model_dump(exclude_none=True)
        if pipeline.last_schema_diff:
            data["last_schema_diff"] = pipeline.last_schema_diff.model_dump()

        client = self._get_client()
        if client:
            result = client.table("suture_pipelines").upsert(
                data, on_conflict="fivetran_connector_id"
            ).execute()
            return result.data[0] if result.data else {}

        # Mock mode
        self._mock_pipelines[pipeline.fivetran_connector_id] = data
        return data

    async def get_pipeline(self, connector_id: str) -> Optional[dict]:
        """Get a pipeline by Fivetran connector ID."""
        client = self._get_client()
        if client:
            result = (
                client.table("suture_pipelines")
                .select("*")
                .eq("fivetran_connector_id", connector_id)
                .single()
                .execute()
            )
            return result.data

        return self._mock_pipelines.get(connector_id)

    async def list_pipelines(self) -> list[dict]:
        """List all pipelines."""
        client = self._get_client()
        if client:
            result = client.table("suture_pipelines").select("*").execute()
            return result.data or []

        return list(self._mock_pipelines.values())

    async def update_pipeline_status(
        self, connector_id: str, status: PipelineStatus
    ) -> dict[str, Any]:
        """Update a pipeline's status."""
        client = self._get_client()
        if client:
            result = (
                client.table("suture_pipelines")
                .update({"status": status.value})
                .eq("fivetran_connector_id", connector_id)
                .execute()
            )
            return result.data[0] if result.data else {}

        if connector_id in self._mock_pipelines:
            self._mock_pipelines[connector_id]["status"] = status.value
            return self._mock_pipelines[connector_id]
        return {}

    # ── Incidents ─────────────────────────────────────────────

    async def create_incident(self, incident: Incident) -> dict[str, Any]:
        """Create a new incident record."""
        data = incident.model_dump(exclude_none=True)
        if incident.source_schema:
            data["source_schema"] = incident.source_schema.model_dump()
        if incident.destination_schema:
            data["destination_schema"] = incident.destination_schema.model_dump()

        client = self._get_client()
        if client:
            result = client.table("suture_incidents").insert(data).execute()
            return result.data[0] if result.data else {}

        # Mock mode
        import uuid
        data["id"] = str(uuid.uuid4())
        self._mock_incidents.append(data)
        return data

    async def update_incident(
        self, incident_id: str, updates: dict[str, Any]
    ) -> dict[str, Any]:
        """Update an incident record."""
        client = self._get_client()
        if client:
            result = (
                client.table("suture_incidents")
                .update(updates)
                .eq("id", incident_id)
                .execute()
            )
            return result.data[0] if result.data else {}

        for inc in self._mock_incidents:
            if inc.get("id") == incident_id:
                inc.update(updates)
                return inc
        return {}

    async def list_incidents(self, limit: int = 50) -> list[dict]:
        """List recent incidents."""
        client = self._get_client()
        if client:
            result = (
                client.table("suture_incidents")
                .select("*")
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
            return result.data or []

        return self._mock_incidents[-limit:]

    async def get_incident(self, incident_id: str) -> Optional[dict]:
        """Get a single incident by ID."""
        client = self._get_client()
        if client:
            result = (
                client.table("suture_incidents")
                .select("*")
                .eq("id", incident_id)
                .single()
                .execute()
            )
            return result.data

        for inc in self._mock_incidents:
            if inc.get("id") == incident_id:
                return inc
        return None

    # ── Stats ─────────────────────────────────────────────────

    async def get_stats(self) -> dict[str, Any]:
        """Get aggregate statistics."""
        pipelines = await self.list_pipelines()
        incidents = await self.list_incidents(limit=1000)

        resolved = [i for i in incidents if i.get("status") == IncidentStatus.RESOLVED.value]
        resolution_times = [i.get("resolution_time_ms", 0) for i in resolved if i.get("resolution_time_ms")]
        avg_time = sum(resolution_times) / len(resolution_times) if resolution_times else None

        return {
            "total_pipelines": len(pipelines),
            "total_incidents": len(incidents),
            "incidents_resolved": len(resolved),
            "avg_resolution_time_ms": avg_time,
        }

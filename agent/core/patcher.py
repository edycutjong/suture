"""
Suture — Patcher

Executes Fivetran API mutations to fix connector schemas.
Applies the AI-generated column mappings.
"""

from __future__ import annotations

from typing import Any

from clients.fivetran import FivetranClient
from clients.phoenix import PhoenixClient
from clients.supabase_client import SupabaseClient
from models.schemas import ColumnMapping, IncidentStatus, PipelineStatus


class Patcher:
    """Applies schema patches to Fivetran connectors."""

    def __init__(
        self,
        fivetran: FivetranClient,
        supabase: SupabaseClient,
        phoenix: PhoenixClient,
    ):
        self.fivetran = fivetran
        self.supabase = supabase
        self.phoenix = phoenix

    async def apply_patch(
        self,
        connector_id: str,
        mappings: list[ColumnMapping],
        new_columns: list[str],
        incident_id: str,
        trace_id: str,
    ) -> dict[str, Any]:
        """
        Apply schema mappings to the Fivetran connector.
        1. Remap renamed columns
        2. Enable new columns
        3. Update pipeline status to HEALING
        """
        # Update statuses
        await self.supabase.update_incident(
            incident_id, {"status": IncidentStatus.PATCHING.value}
        )
        await self.supabase.update_pipeline_status(
            connector_id, PipelineStatus.HEALING
        )

        self.phoenix.add_span(
            trace_id,
            "patching_start",
            input_data={
                "mappings": [m.model_dump() for m in mappings],
                "new_columns": new_columns,
            },
        )

        # Build the patch payload
        patch = self._build_patch(mappings, new_columns)

        # Apply the patch via Fivetran API
        result = await self.fivetran.modify_schema(connector_id, patch)

        self.phoenix.add_span(
            trace_id,
            "patch_applied",
            output_data={"result": result},
        )

        # Store the applied patch in the incident
        await self.supabase.update_incident(
            incident_id, {"applied_patch": patch}
        )

        return result

    def _build_patch(
        self, mappings: list[ColumnMapping], new_columns: list[str]
    ) -> dict[str, Any]:
        """Build the Fivetran schema modification payload."""
        column_updates = {}

        # Map renamed columns
        for mapping in mappings:
            column_updates[mapping.source_column] = {
                "enabled": True,
                "hashed": False,
                "name_in_destination": mapping.destination_column,
            }

        # Enable new columns
        for col in new_columns:
            if col not in column_updates:
                column_updates[col] = {
                    "enabled": True,
                    "hashed": False,
                }

        return {
            "schemas": {
                "schema_updates": {
                    "columns": column_updates,
                }
            }
        }

"""
Suture — Diagnoser

Log analysis and schema diffing.
Compares source vs destination schemas to identify drifted columns.
"""

from __future__ import annotations

from clients.fivetran import FivetranClient
from clients.phoenix import PhoenixClient
from clients.supabase_client import SupabaseClient
from models.schemas import SchemaDiff, TableSchema, IncidentStatus


class Diagnoser:
    """Analyzes sync failures by diffing source and destination schemas."""

    def __init__(
        self,
        fivetran: FivetranClient,
        supabase: SupabaseClient,
        phoenix: PhoenixClient,
    ):
        self.fivetran = fivetran
        self.supabase = supabase
        self.phoenix = phoenix

    async def diagnose(
        self, connector_id: str, incident_id: str, trace_id: str
    ) -> SchemaDiff:
        """
        Diagnose a sync failure by comparing source and destination schemas.
        Returns a SchemaDiff with missing, new, and matched columns.
        """
        self.phoenix.add_span(
            trace_id, "diagnose_start", input_data={"connector_id": connector_id}
        )

        # Update incident status
        await self.supabase.update_incident(
            incident_id, {"status": IncidentStatus.DIAGNOSING.value}
        )

        # Get current source schema (with drift)
        source_schema = await self.fivetran.discover_schema(connector_id)

        self.phoenix.add_span(
            trace_id,
            "schema_discovered",
            output_data={"columns": [c.name for c in source_schema.columns]},
        )

        # Get destination schema (what Fivetran expects)
        # In mock mode, we use the "before" fixture as destination
        destination_schema = await self._get_destination_schema(connector_id)

        # Compute diff
        diff = self._compute_diff(source_schema, destination_schema)

        self.phoenix.add_span(
            trace_id,
            "schema_diffed",
            output_data={
                "missing": diff.missing_columns,
                "new": diff.new_columns,
                "matched": len(diff.matched_columns),
            },
        )

        # Store schemas in incident
        await self.supabase.update_incident(
            incident_id,
            {
                "source_schema": source_schema.model_dump(),
                "destination_schema": destination_schema.model_dump(),
            },
        )

        return diff

    async def _get_destination_schema(self, connector_id: str) -> TableSchema:
        """
        Get the destination schema (what the connector was configured for).
        In live mode, this queries the actual destination.
        In mock mode, uses the 'before' fixture.
        """
        if self.fivetran.mode == "mock":
            # Temporarily reset to get the "before" schema
            original_state = self.fivetran._mock_schema_state
            self.fivetran._mock_schema_state = "before"
            schema = await self.fivetran.discover_schema(connector_id)
            self.fivetran._mock_schema_state = original_state
            return schema

        # In live mode, query the destination schema
        return await self.fivetran.discover_schema(connector_id)

    def _compute_diff(
        self, source: TableSchema, destination: TableSchema
    ) -> SchemaDiff:
        """Compare source and destination schemas to find differences."""
        source_cols = {c.name for c in source.columns}
        dest_cols = {c.name for c in destination.columns}

        return SchemaDiff(
            missing_columns=sorted(dest_cols - source_cols),
            new_columns=sorted(source_cols - dest_cols),
            matched_columns=sorted(source_cols & dest_cols),
        )

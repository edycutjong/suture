"""
Suture — Mapper

Gemini 3 semantic reasoning on schema diffs.
Deduces column mappings with confidence scores.
"""

from __future__ import annotations

from clients.gemini import GeminiClient
from clients.phoenix import PhoenixClient
from clients.supabase_client import SupabaseClient
from models.schemas import SchemaDiff, ColumnMapping


class Mapper:
    """Uses Gemini 3 to reason through schema diffs and produce mappings."""

    def __init__(
        self,
        gemini: GeminiClient,
        supabase: SupabaseClient,
        phoenix: PhoenixClient,
    ):
        self.gemini = gemini
        self.supabase = supabase
        self.phoenix = phoenix

    async def map_schema_diff(
        self,
        diff: SchemaDiff,
        table_name: str,
        incident_id: str,
        trace_id: str,
    ) -> list[ColumnMapping]:
        """
        Use AI to reason through the schema diff and produce mappings.
        Returns a list of ColumnMapping with confidence scores.
        """
        self.phoenix.add_span(
            trace_id,
            "ai_reasoning_start",
            input_data={
                "missing": diff.missing_columns,
                "new": diff.new_columns,
                "table": table_name,
            },
        )

        # Call Gemini for semantic reasoning
        mappings = await self.gemini.reason_schema_diff(
            missing_columns=diff.missing_columns,
            new_columns=diff.new_columns,
            table_name=table_name,
        )

        # Build reasoning summary
        reasoning_text = self._format_reasoning(mappings, diff)

        self.phoenix.add_span(
            trace_id,
            "ai_reasoning_complete",
            output_data={
                "mappings_found": len(mappings),
                "confidences": [m.confidence for m in mappings],
            },
        )

        # Store AI reasoning in incident
        await self.supabase.update_incident(
            incident_id,
            {
                "ai_reasoning": reasoning_text,
                "confidence_score": (
                    max(m.confidence for m in mappings) if mappings else 0.0
                ),
            },
        )

        # Update diff with mappings
        diff.mappings = mappings

        return mappings

    def _format_reasoning(
        self, mappings: list[ColumnMapping], diff: SchemaDiff
    ) -> str:
        """Format the AI reasoning into a human-readable summary."""
        lines = ["## Schema Drift Analysis\n"]

        if diff.missing_columns:
            lines.append(f"**Removed columns:** {', '.join(diff.missing_columns)}")
        if diff.new_columns:
            lines.append(f"**Added columns:** {', '.join(diff.new_columns)}")

        lines.append(f"\n**Matched columns:** {len(diff.matched_columns)}")

        if mappings:
            lines.append("\n### AI-Generated Mappings\n")
            for m in mappings:
                lines.append(
                    f"- `{m.source_column}` → `{m.destination_column}` "
                    f"(confidence: {m.confidence:.2f})"
                )
                lines.append(f"  *{m.reasoning}*\n")
        else:
            lines.append("\n*No semantic mappings found. Columns may be genuinely new/removed.*")

        return "\n".join(lines)

"""
Suture — Gemini 3 Client

Wrapper for Google Gemini 3 Pro via Vertex AI / google-genai SDK.
Handles semantic schema reasoning with structured output.
"""

from __future__ import annotations

import os
from typing import Optional

from models.schemas import ColumnMapping


class GeminiClient:
    """Gemini 3 Pro client for schema drift reasoning."""

    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "")
        self.model_name = os.getenv("GEMINI_MODEL", "gemini-3-pro")
        self._client = None

    def _get_client(self):
        """Lazy-initialize the Gemini client."""
        if self._client is not None:
            return self._client
        if os.getenv("AGENT_MODE", "mock") == "mock":
            return None
        try:
            from google import genai
            if not self.api_key:
                return None
            self._client = genai.Client(api_key=self.api_key)
        except ImportError:
            # Fallback for mock mode
            self._client = None
        return self._client

    async def reason_schema_diff(
        self,
        missing_columns: list[str],
        new_columns: list[str],
        table_name: str,
        source_context: Optional[str] = None,
    ) -> list[ColumnMapping]:
        """
        Use Gemini 3 to reason through a schema diff and produce
        semantic column mappings with confidence scores.
        """
        client = self._get_client()

        prompt = self._build_reasoning_prompt(
            missing_columns, new_columns, table_name, source_context
        )

        if client is None:
            # Mock mode: return deterministic mappings
            return self._mock_reasoning(missing_columns, new_columns)

        response = client.models.generate_content(
            model=self.model_name,
            contents=prompt,
        )

        return self._parse_reasoning_response(response.text)

    def _build_reasoning_prompt(
        self,
        missing_columns: list[str],
        new_columns: list[str],
        table_name: str,
        source_context: Optional[str] = None,
    ) -> str:
        """Construct the reasoning prompt for Gemini."""
        context = f"\nSource system context: {source_context}" if source_context else ""

        return f"""You are a data engineering expert analyzing schema drift in a {table_name} table.

The following columns were REMOVED from the source schema:
{', '.join(missing_columns)}

The following columns were ADDED to the source schema:
{', '.join(new_columns)}
{context}

For each removed column, determine if any of the new columns is a RENAME of that column.
Consider:
1. Semantic similarity (e.g., "revenue" → "annual_revenue")
2. Data type compatibility
3. Common naming conventions in {table_name} tables
4. Business context

Respond in this exact JSON format:
[
  {{
    "source_column": "<new_column_name>",
    "destination_column": "<old_column_name>",
    "confidence": <0.0-1.0>,
    "reasoning": "<explanation>"
  }}
]

Only include mappings where confidence >= 0.7. If no mapping is found, return an empty array."""

    def _parse_reasoning_response(self, response_text: str) -> list[ColumnMapping]:
        """Parse Gemini's JSON response into ColumnMapping objects."""
        import json

        # Extract JSON from potential markdown code blocks
        text = response_text.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(lines[1:-1])

        try:
            mappings_data = json.loads(text)
            return [ColumnMapping(**m) for m in mappings_data]
        except (json.JSONDecodeError, Exception):
            return []

    def _mock_reasoning(
        self, missing_columns: list[str], new_columns: list[str]
    ) -> list[ColumnMapping]:
        """Deterministic mock reasoning for demo mode."""
        mappings = []

        # Known mapping: revenue → annual_revenue
        if "revenue" in missing_columns and "annual_revenue" in new_columns:
            mappings.append(
                ColumnMapping(
                    source_column="annual_revenue",
                    destination_column="revenue",
                    confidence=0.94,
                    reasoning=(
                        "Column 'revenue' was dropped and 'annual_revenue' was added. "
                        "Semantic analysis indicates this is a rename — 'annual_revenue' "
                        "is the annualized version of the same metric. The data type "
                        "(FLOAT) is identical, confirming this is a column rename "
                        "rather than a new field."
                    ),
                )
            )

        return mappings

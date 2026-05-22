"""
Suture — Fivetran REST API Client

Dual-mode client supporting both 'mock' (fixture-based) and 'live' (real API) modes.
Implements 7 distinct Fivetran API methods for schema management and sync control.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Optional

import httpx

from models.schemas import TableSchema, SchemaColumn


# Path to fixture data
FIXTURES_DIR = Path(__file__).parent.parent / "data" / "fixtures"


class FivetranClient:
    """Fivetran REST API client with mock and live modes."""

    def __init__(self, mode: Optional[str] = None):
        self.mode = mode or os.getenv("AGENT_MODE", "mock")
        self.api_key = os.getenv("FIVETRAN_API_KEY", "")
        self.api_secret = os.getenv("FIVETRAN_API_SECRET", "")
        self.base_url = "https://api.fivetran.com/v1"

        # Mock state for demo
        self._mock_schema_state = "before"  # 'before' or 'after'
        self._mock_sync_status = "healthy"

    def _auth(self) -> tuple[str, str]:
        return (self.api_key, self.api_secret)

    def _load_fixture(self, filename: str) -> dict:
        filepath = FIXTURES_DIR / filename
        with open(filepath) as f:
            return json.load(f)

    # ── Method 1: List Connectors ─────────────────────────────

    async def list_connectors(self) -> list[dict[str, Any]]:
        """GET /v1/connectors — Enumerate all monitored pipelines."""
        if self.mode == "mock":
            return [
                {
                    "id": "connector_sf_001",
                    "service": "salesforce",
                    "schema": "salesforce_prod",
                    "connected_by": "suture_agent",
                    "status": {
                        "setup_state": "connected",
                        "sync_state": "scheduled" if self._mock_sync_status == "healthy" else "failed",
                    },
                }
            ]

        async with httpx.AsyncClient(auth=self._auth()) as client:
            resp = await client.get(f"{self.base_url}/connectors")
            resp.raise_for_status()
            return resp.json().get("data", {}).get("items", [])

    # ── Method 2: Get Connector Details ───────────────────────

    async def get_connector_details(self, connector_id: str) -> dict[str, Any]:
        """GET /v1/connectors/{id} — Get connector config and status."""
        if self.mode == "mock":
            return {
                "id": connector_id,
                "service": "salesforce",
                "schema": "salesforce_prod",
                "status": {
                    "setup_state": "connected",
                    "sync_state": "scheduled" if self._mock_sync_status == "healthy" else "failed",
                    "update_state": "on_schedule",
                },
                "config": {"domain": "mycompany.salesforce.com"},
            }

        async with httpx.AsyncClient(auth=self._auth()) as client:
            resp = await client.get(f"{self.base_url}/connectors/{connector_id}")
            resp.raise_for_status()
            return resp.json().get("data", {})

    # ── Method 3: Discover Schema ─────────────────────────────

    async def discover_schema(self, connector_id: str) -> TableSchema:
        """GET /v1/connectors/{id}/schemas — Retrieve current source schema."""
        if self.mode == "mock":
            fixture_file = (
                "salesforce_schema_after.json"
                if self._mock_schema_state == "after"
                else "salesforce_schema_before.json"
            )
            data = self._load_fixture(fixture_file)
            return TableSchema(**data)

        async with httpx.AsyncClient(auth=self._auth()) as client:
            resp = await client.get(
                f"{self.base_url}/connectors/{connector_id}/schemas"
            )
            resp.raise_for_status()
            schema_data = resp.json().get("data", {})
            # Transform Fivetran schema format to our model
            tables = schema_data.get("schemas", {})
            first_table: dict[str, Any] = next(iter(tables.values()), {})
            columns = [
                SchemaColumn(name=name, type=col.get("type", "STRING"), enabled=col.get("enabled", True))
                for name, col in first_table.get("tables", {}).get("columns", {}).items()
            ]
            return TableSchema(table=first_table.get("name_in_source", "unknown"), columns=columns)

    # ── Method 4: Modify Schema ───────────────────────────────

    async def modify_schema(
        self, connector_id: str, patch: dict[str, Any]
    ) -> dict[str, Any]:
        """PATCH /v1/connectors/{id}/schemas — Apply schema mapping fix."""
        if self.mode == "mock":
            self._mock_schema_state = "before"  # Reset to healthy
            self._mock_sync_status = "healthy"
            return {"status": "success", "patch_applied": patch}

        async with httpx.AsyncClient(auth=self._auth()) as client:
            resp = await client.patch(
                f"{self.base_url}/connectors/{connector_id}/schemas",
                json=patch,
            )
            resp.raise_for_status()
            return resp.json().get("data", {})

    # ── Method 5: Trigger Sync ────────────────────────────────

    async def trigger_sync(self, connector_id: str) -> dict[str, Any]:
        """POST /v1/connectors/{id}/force — Force a re-sync after patching."""
        if self.mode == "mock":
            self._mock_sync_status = "healthy"
            return {"status": "success", "sync_triggered": True}

        async with httpx.AsyncClient(auth=self._auth()) as client:
            resp = await client.post(
                f"{self.base_url}/connectors/{connector_id}/force"
            )
            resp.raise_for_status()
            return resp.json().get("data", {})

    # ── Method 6: Get Sync Logs ───────────────────────────────

    async def get_sync_logs(self, connector_id: str) -> dict[str, Any]:
        """GET /v1/connectors/{id}/logs — Query sync failure error messages."""
        if self.mode == "mock":
            return self._load_fixture("mock_sync_logs.json")

        async with httpx.AsyncClient(auth=self._auth()) as client:
            resp = await client.get(
                f"{self.base_url}/connectors/{connector_id}/logs"
            )
            resp.raise_for_status()
            return resp.json().get("data", {})

    # ── Method 7: Get Connector State ─────────────────────────

    async def get_connector_state(self, connector_id: str) -> dict[str, Any]:
        """GET /v1/connectors/{id}/state — Check sync completion status."""
        if self.mode == "mock":
            return {
                "connector_id": connector_id,
                "sync_state": "synced" if self._mock_sync_status == "healthy" else "failed",
                "last_successful_sync": "2026-05-14T03:05:00Z",
            }

        async with httpx.AsyncClient(auth=self._auth()) as client:
            resp = await client.get(
                f"{self.base_url}/connectors/{connector_id}/state"
            )
            resp.raise_for_status()
            return resp.json().get("data", {})

    # ── Mock Helpers ──────────────────────────────────────────

    def mock_break_schema(self):
        """Simulate schema drift for demo."""
        self._mock_schema_state = "after"
        self._mock_sync_status = "failed"

    def mock_reset(self):
        """Reset mock state to healthy."""
        self._mock_schema_state = "before"
        self._mock_sync_status = "healthy"

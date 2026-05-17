"""Tests for FivetranClient mock mode."""

import pytest

from clients.fivetran import FivetranClient
from models.schemas import TableSchema


@pytest.fixture
def client():
    return FivetranClient(mode="mock")


class TestFivetranClientInit:
    def test_default_mode_is_mock(self, monkeypatch):
        monkeypatch.delenv("AGENT_MODE", raising=False)
        c = FivetranClient()
        assert c.mode == "mock"

    def test_explicit_mock_mode(self):
        c = FivetranClient(mode="mock")
        assert c.mode == "mock"

    def test_initial_schema_state(self, client):
        assert client._mock_schema_state == "before"

    def test_initial_sync_status(self, client):
        assert client._mock_sync_status == "healthy"


class TestListConnectors:
    @pytest.mark.asyncio
    async def test_returns_list(self, client):
        result = await client.list_connectors()
        assert isinstance(result, list)

    @pytest.mark.asyncio
    async def test_returns_at_least_one_connector(self, client):
        result = await client.list_connectors()
        assert len(result) >= 1

    @pytest.mark.asyncio
    async def test_connector_has_id(self, client):
        result = await client.list_connectors()
        assert "id" in result[0]

    @pytest.mark.asyncio
    async def test_connector_has_status(self, client):
        result = await client.list_connectors()
        assert "status" in result[0]

    @pytest.mark.asyncio
    async def test_healthy_sync_state(self, client):
        result = await client.list_connectors()
        assert result[0]["status"]["sync_state"] == "scheduled"

    @pytest.mark.asyncio
    async def test_broken_sync_state_after_break(self, client):
        client.mock_break_schema()
        result = await client.list_connectors()
        assert result[0]["status"]["sync_state"] == "failed"


class TestGetConnectorDetails:
    @pytest.mark.asyncio
    async def test_returns_dict(self, client):
        result = await client.get_connector_details("connector_sf_001")
        assert isinstance(result, dict)

    @pytest.mark.asyncio
    async def test_returns_correct_id(self, client):
        result = await client.get_connector_details("connector_sf_001")
        assert result["id"] == "connector_sf_001"

    @pytest.mark.asyncio
    async def test_has_service_field(self, client):
        result = await client.get_connector_details("connector_sf_001")
        assert "service" in result

    @pytest.mark.asyncio
    async def test_has_status_field(self, client):
        result = await client.get_connector_details("connector_sf_001")
        assert "status" in result


class TestDiscoverSchema:
    @pytest.mark.asyncio
    async def test_returns_table_schema(self, client):
        schema = await client.discover_schema("connector_sf_001")
        assert isinstance(schema, TableSchema)

    @pytest.mark.asyncio
    async def test_before_state_has_revenue(self, client):
        client._mock_schema_state = "before"
        schema = await client.discover_schema("connector_sf_001")
        col_names = [c.name for c in schema.columns]
        assert "revenue" in col_names

    @pytest.mark.asyncio
    async def test_after_state_has_annual_revenue(self, client):
        client._mock_schema_state = "after"
        schema = await client.discover_schema("connector_sf_001")
        col_names = [c.name for c in schema.columns]
        assert "annual_revenue" in col_names

    @pytest.mark.asyncio
    async def test_after_state_missing_revenue(self, client):
        client._mock_schema_state = "after"
        schema = await client.discover_schema("connector_sf_001")
        col_names = [c.name for c in schema.columns]
        assert "revenue" not in col_names

    @pytest.mark.asyncio
    async def test_schema_has_columns(self, client):
        schema = await client.discover_schema("connector_sf_001")
        assert len(schema.columns) > 0

    @pytest.mark.asyncio
    async def test_table_name_is_opportunity(self, client):
        schema = await client.discover_schema("connector_sf_001")
        assert schema.table == "Opportunity"


class TestModifySchema:
    @pytest.mark.asyncio
    async def test_returns_success(self, client):
        patch = {"schemas": {"schema_updates": {"columns": {}}}}
        result = await client.modify_schema("connector_sf_001", patch)
        assert result["status"] == "success"

    @pytest.mark.asyncio
    async def test_resets_schema_state(self, client):
        client._mock_schema_state = "after"
        patch = {"schemas": {"schema_updates": {"columns": {}}}}
        await client.modify_schema("connector_sf_001", patch)
        assert client._mock_schema_state == "before"

    @pytest.mark.asyncio
    async def test_resets_sync_status(self, client):
        client._mock_sync_status = "failed"
        patch = {}
        await client.modify_schema("connector_sf_001", patch)
        assert client._mock_sync_status == "healthy"


class TestTriggerSync:
    @pytest.mark.asyncio
    async def test_returns_success(self, client):
        result = await client.trigger_sync("connector_sf_001")
        assert result["status"] == "success"

    @pytest.mark.asyncio
    async def test_sync_triggered_true(self, client):
        result = await client.trigger_sync("connector_sf_001")
        assert result["sync_triggered"] is True


class TestGetSyncLogs:
    @pytest.mark.asyncio
    async def test_returns_dict(self, client):
        result = await client.get_sync_logs("connector_sf_001")
        assert isinstance(result, dict)

    @pytest.mark.asyncio
    async def test_has_error_code(self, client):
        result = await client.get_sync_logs("connector_sf_001")
        assert "error_code" in result

    @pytest.mark.asyncio
    async def test_has_logs_list(self, client):
        result = await client.get_sync_logs("connector_sf_001")
        assert "logs" in result
        assert isinstance(result["logs"], list)


class TestGetConnectorState:
    @pytest.mark.asyncio
    async def test_returns_dict(self, client):
        result = await client.get_connector_state("connector_sf_001")
        assert isinstance(result, dict)

    @pytest.mark.asyncio
    async def test_healthy_sync_state(self, client):
        result = await client.get_connector_state("connector_sf_001")
        assert result["sync_state"] == "synced"

    @pytest.mark.asyncio
    async def test_failed_sync_state_after_break(self, client):
        client._mock_sync_status = "failed"
        result = await client.get_connector_state("connector_sf_001")
        assert result["sync_state"] == "failed"


class TestMockHelpers:
    def test_mock_break_schema(self, client):
        client.mock_break_schema()
        assert client._mock_schema_state == "after"
        assert client._mock_sync_status == "failed"

    def test_mock_reset(self, client):
        client.mock_break_schema()
        client.mock_reset()
        assert client._mock_schema_state == "before"
        assert client._mock_sync_status == "healthy"

    def test_break_then_reset_cycle(self, client):
        client.mock_break_schema()
        assert client._mock_schema_state == "after"
        client.mock_reset()
        assert client._mock_schema_state == "before"

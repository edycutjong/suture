import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from clients.fivetran import FivetranClient
import httpx

@pytest.fixture
def live_client():
    return FivetranClient(mode="live")

class AsyncMockContext:
    def __init__(self, mock_client):
        self.mock_client = mock_client
    async def __aenter__(self):
        return self.mock_client
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass

@pytest.fixture
def httpx_mock():
    mock_client = AsyncMock()
    with patch('httpx.AsyncClient', return_value=AsyncMockContext(mock_client)) as mock:
        yield mock_client

@pytest.mark.asyncio
async def test_live_list_connectors(live_client, httpx_mock):
    mock_resp = MagicMock()
    mock_resp.json.return_value = {"data": {"items": [{"id": "conn1"}]}}
    httpx_mock.get.return_value = mock_resp
    res = await live_client.list_connectors()
    assert res == [{"id": "conn1"}]
    httpx_mock.get.assert_called_with("https://api.fivetran.com/v1/connectors")
    mock_resp.raise_for_status.assert_called_once()

@pytest.mark.asyncio
async def test_live_get_connector_details(live_client, httpx_mock):
    mock_resp = MagicMock()
    mock_resp.json.return_value = {"data": {"id": "conn1"}}
    httpx_mock.get.return_value = mock_resp
    res = await live_client.get_connector_details("conn1")
    assert res == {"id": "conn1"}
    httpx_mock.get.assert_called_with("https://api.fivetran.com/v1/connectors/conn1")

@pytest.mark.asyncio
async def test_live_discover_schema(live_client, httpx_mock):
    mock_resp = MagicMock()
    mock_resp.json.return_value = {
        "data": {
            "schemas": {
                "schema1": {
                    "name_in_source": "test_table",
                    "tables": {
                        "columns": {
                            "col1": {"type": "STRING", "enabled": True}
                        }
                    }
                }
            }
        }
    }
    httpx_mock.get.return_value = mock_resp
    res = await live_client.discover_schema("conn1")
    assert res.table == "test_table"
    assert res.columns[0].name == "col1"

@pytest.mark.asyncio
async def test_live_modify_schema(live_client, httpx_mock):
    mock_resp = MagicMock()
    mock_resp.json.return_value = {"data": {"status": "patched"}}
    httpx_mock.patch.return_value = mock_resp
    res = await live_client.modify_schema("conn1", {"patch": "data"})
    assert res == {"status": "patched"}
    httpx_mock.patch.assert_called_with("https://api.fivetran.com/v1/connectors/conn1/schemas", json={"patch": "data"})

@pytest.mark.asyncio
async def test_live_trigger_sync(live_client, httpx_mock):
    mock_resp = MagicMock()
    mock_resp.json.return_value = {"data": {"status": "syncing"}}
    httpx_mock.post.return_value = mock_resp
    res = await live_client.trigger_sync("conn1")
    assert res == {"status": "syncing"}
    httpx_mock.post.assert_called_with("https://api.fivetran.com/v1/connectors/conn1/force")

@pytest.mark.asyncio
async def test_live_get_sync_logs(live_client, httpx_mock):
    mock_resp = MagicMock()
    mock_resp.json.return_value = {"data": {"logs": []}}
    httpx_mock.get.return_value = mock_resp
    res = await live_client.get_sync_logs("conn1")
    assert res == {"logs": []}
    httpx_mock.get.assert_called_with("https://api.fivetran.com/v1/connectors/conn1/logs")

@pytest.mark.asyncio
async def test_live_get_connector_state(live_client, httpx_mock):
    mock_resp = MagicMock()
    mock_resp.json.return_value = {"data": {"sync_state": "synced"}}
    httpx_mock.get.return_value = mock_resp
    res = await live_client.get_connector_state("conn1")
    assert res == {"sync_state": "synced"}
    httpx_mock.get.assert_called_with("https://api.fivetran.com/v1/connectors/conn1/state")

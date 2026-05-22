import pytest
from unittest.mock import AsyncMock, MagicMock
from core.verifier import Verifier
from models.schemas import PipelineStatus

@pytest.fixture
def fivetran_mock():
    mock = AsyncMock()
    mock.mode = "mock"
    return mock

@pytest.fixture
def supabase_mock():
    return AsyncMock()

@pytest.fixture
def phoenix_mock():
    return MagicMock()

@pytest.fixture
def verifier(fivetran_mock, supabase_mock, phoenix_mock):
    return Verifier(fivetran_mock, supabase_mock, phoenix_mock)

@pytest.mark.asyncio
async def test_verify_success(verifier, fivetran_mock, supabase_mock, phoenix_mock):
    fivetran_mock.trigger_sync.return_value = {"status": "ok"}
    fivetran_mock.get_connector_state.return_value = {"sync_state": "synced"}
    
    res = await verifier.verify("conn_1", "inc_1", "trace_1", 1000.0)
    
    assert res["status"] == "healed"
    assert res["connector_id"] == "conn_1"
    
    phoenix_mock.add_span.assert_called()
    phoenix_mock.end_trace.assert_called()
    
    supabase_mock.update_pipeline_status.assert_called_with("conn_1", PipelineStatus.HEALED)
    supabase_mock.update_incident.assert_called()

@pytest.mark.asyncio
async def test_verify_failed(verifier, fivetran_mock, supabase_mock, phoenix_mock):
    fivetran_mock.trigger_sync.return_value = {"status": "ok"}
    fivetran_mock.get_connector_state.return_value = {"sync_state": "failed"}
    
    res = await verifier.verify("conn_1", "inc_1", "trace_1", 1000.0)
    
    assert res["status"] == "failed"
    
    supabase_mock.update_incident.assert_called()

@pytest.mark.asyncio
async def test_poll_sync_status_mock_mode_default(verifier, fivetran_mock):
    fivetran_mock.get_connector_state.return_value = {"sync_state": "unknown"}
    fivetran_mock.mode = "mock"
    # Even if unknown, mock mode defaults to True
    res = await verifier._poll_sync_status("conn_1", "trace_1")
    assert res is True

@pytest.mark.asyncio
async def test_poll_sync_status_timeout(verifier, fivetran_mock):
    fivetran_mock.get_connector_state.return_value = {"sync_state": "unknown"}
    fivetran_mock.mode = "live"
    verifier.max_poll_attempts = 1
    verifier.poll_interval_seconds = 0
    res = await verifier._poll_sync_status("conn_1", "trace_1")
    assert res is False

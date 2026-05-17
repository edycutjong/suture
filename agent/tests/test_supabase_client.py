import pytest
from unittest.mock import patch, MagicMock
from clients.supabase_client import SupabaseClient
from models.schemas import Pipeline, Incident, PipelineStatus, IncidentStatus, ErrorType

@pytest.fixture
def supabase_client(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "http://fake")
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "fake_key")
    return SupabaseClient()

def test_init(supabase_client):
    assert supabase_client.url == "http://fake"

def test_get_client_success(supabase_client):
    with patch.dict('sys.modules', {'supabase': MagicMock()}):
        import sys
        sys.modules['supabase'].create_client = MagicMock(return_value="mock_client")
        client = supabase_client._get_client()
        assert client == "mock_client"

def test_get_client_import_error(supabase_client):
    with patch.dict('sys.modules', {'supabase': None}):
        client = supabase_client._get_client()
        assert client is None

# --- Mock mode tests ---
@pytest.mark.asyncio
async def test_upsert_pipeline_mock(supabase_client):
    supabase_client._client = None
    from models.schemas import SchemaDiff
    pipe = Pipeline(fivetran_connector_id="c1", connector_name="test", source_type="pg", destination_type="pg", status=PipelineStatus.HEALTHY, last_schema_diff=SchemaDiff(missing_columns=[], new_columns=[], matched_columns=[]))
    res = await supabase_client.upsert_pipeline(pipe)
    assert res["fivetran_connector_id"] == "c1"
    assert supabase_client._mock_pipelines["c1"] == res

@pytest.mark.asyncio
async def test_get_pipeline_mock(supabase_client):
    supabase_client._mock_pipelines["c1"] = {"id": "c1"}
    res = await supabase_client.get_pipeline("c1")
    assert res == {"id": "c1"}

@pytest.mark.asyncio
async def test_list_pipelines_mock(supabase_client):
    supabase_client._mock_pipelines["c1"] = {"id": "c1"}
    res = await supabase_client.list_pipelines()
    assert res == [{"id": "c1"}]

@pytest.mark.asyncio
async def test_update_pipeline_status_mock(supabase_client):
    supabase_client._mock_pipelines["c1"] = {"id": "c1", "status": "unknown"}
    res = await supabase_client.update_pipeline_status("c1", PipelineStatus.BROKEN)
    assert res["status"] == "broken"
    assert supabase_client._mock_pipelines["c1"]["status"] == "broken"
    res2 = await supabase_client.update_pipeline_status("fake", PipelineStatus.BROKEN)
    assert res2 == {}

@pytest.mark.asyncio
async def test_create_incident_mock(supabase_client):
    from models.schemas import TableSchema
    inc = Incident(pipeline_id="p1", error_type=ErrorType.SCHEMA_DRIFT, status=IncidentStatus.DETECTED, source_schema=TableSchema(table="test", columns=[]), destination_schema=TableSchema(table="test", columns=[]))
    res = await supabase_client.create_incident(inc)
    assert "id" in res
    assert len(supabase_client._mock_incidents) == 1

@pytest.mark.asyncio
async def test_update_incident_mock(supabase_client):
    supabase_client._mock_incidents = [{"id": "inc1", "status": "unknown"}]
    res = await supabase_client.update_incident("inc1", {"status": "resolved"})
    assert res["status"] == "resolved"
    assert supabase_client._mock_incidents[0]["status"] == "resolved"
    res2 = await supabase_client.update_incident("fake", {"status": "resolved"})
    assert res2 == {}

@pytest.mark.asyncio
async def test_list_incidents_mock(supabase_client):
    supabase_client._mock_incidents = [{"id": "inc1"}]
    res = await supabase_client.list_incidents()
    assert res == [{"id": "inc1"}]

@pytest.mark.asyncio
async def test_get_incident_mock(supabase_client):
    supabase_client._mock_incidents = [{"id": "inc1"}]
    res = await supabase_client.get_incident("inc1")
    assert res == {"id": "inc1"}
    assert await supabase_client.get_incident("fake") is None

@pytest.mark.asyncio
async def test_get_stats_mock(supabase_client):
    supabase_client._mock_pipelines = {"c1": {}}
    supabase_client._mock_incidents = [{"id": "inc1", "status": "resolved", "resolution_time_ms": 1000}]
    stats = await supabase_client.get_stats()
    assert stats["total_pipelines"] == 1
    assert stats["total_incidents"] == 1
    assert stats["incidents_resolved"] == 1
    assert stats["avg_resolution_time_ms"] == 1000.0

# --- Live mode tests (mocked client) ---
@pytest.fixture
def live_sb(supabase_client):
    mock = MagicMock()
    supabase_client._get_client = MagicMock(return_value=mock)
    return supabase_client, mock

@pytest.mark.asyncio
async def test_upsert_pipeline_live(live_sb):
    client, mock = live_sb
    mock.table().upsert().execute.return_value.data = [{"status": "ok"}]
    pipe = Pipeline(fivetran_connector_id="c1", connector_name="test", source_type="pg", destination_type="pg", status=PipelineStatus.HEALTHY)
    res = await client.upsert_pipeline(pipe)
    assert res == {"status": "ok"}
    mock.table().upsert().execute.return_value.data = []
    res2 = await client.upsert_pipeline(pipe)
    assert res2 == {}

@pytest.mark.asyncio
async def test_get_pipeline_live(live_sb):
    client, mock = live_sb
    mock.table().select().eq().single().execute.return_value.data = {"status": "ok"}
    res = await client.get_pipeline("c1")
    assert res == {"status": "ok"}

@pytest.mark.asyncio
async def test_list_pipelines_live(live_sb):
    client, mock = live_sb
    mock.table().select().execute.return_value.data = [{"status": "ok"}]
    res = await client.list_pipelines()
    assert res == [{"status": "ok"}]

@pytest.mark.asyncio
async def test_update_pipeline_status_live(live_sb):
    client, mock = live_sb
    mock.table().update().eq().execute.return_value.data = [{"status": "ok"}]
    res = await client.update_pipeline_status("c1", PipelineStatus.BROKEN)
    assert res == {"status": "ok"}
    mock.table().update().eq().execute.return_value.data = []
    res2 = await client.update_pipeline_status("c1", PipelineStatus.BROKEN)
    assert res2 == {}

@pytest.mark.asyncio
async def test_create_incident_live(live_sb):
    client, mock = live_sb
    mock.table().insert().execute.return_value.data = [{"status": "ok"}]
    inc = Incident(pipeline_id="p1", error_type=ErrorType.SCHEMA_DRIFT, status=IncidentStatus.DETECTED)
    res = await client.create_incident(inc)
    assert res == {"status": "ok"}
    mock.table().insert().execute.return_value.data = []
    res2 = await client.create_incident(inc)
    assert res2 == {}

@pytest.mark.asyncio
async def test_update_incident_live(live_sb):
    client, mock = live_sb
    mock.table().update().eq().execute.return_value.data = [{"status": "ok"}]
    res = await client.update_incident("inc1", {"st": "val"})
    assert res == {"status": "ok"}
    mock.table().update().eq().execute.return_value.data = []
    res2 = await client.update_incident("inc1", {})
    assert res2 == {}

@pytest.mark.asyncio
async def test_list_incidents_live(live_sb):
    client, mock = live_sb
    mock.table().select().order().limit().execute.return_value.data = [{"status": "ok"}]
    res = await client.list_incidents()
    assert res == [{"status": "ok"}]

@pytest.mark.asyncio
async def test_get_incident_live(live_sb):
    client, mock = live_sb
    mock.table().select().eq().single().execute.return_value.data = {"status": "ok"}
    res = await client.get_incident("inc1")
    assert res == {"status": "ok"}


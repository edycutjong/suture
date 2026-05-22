"""Tests for the main FastAPI agent application endpoints."""

import pytest
import time
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient

import main
from models.schemas import (
    ColumnMapping,
    FivetranWebhookEvent,
    Pipeline,
    PipelineStatus,
    SchemaDiff,
)

# Use the FastAPI TestClient
client = TestClient(main.app)


def test_health():
    """Test the agent health check endpoint."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["version"] == "1.0.0"
    assert "uptime_seconds" in data
    assert "mode" in data


@pytest.mark.asyncio
async def test_webhook_fivetran_ignored():
    """Test webhook with non-schema-drift failure event."""
    with patch.object(main.detector, "process_webhook", new_callable=AsyncMock) as mock_detect:
        mock_detect.return_value = None

        payload = {"event": "sync_failure", "connector_id": "connector_sf_001"}
        response = client.post("/webhook/fivetran", json=payload)
        assert response.status_code == 200
        assert response.json() == {
            "status": "ignored",
            "reason": "Not a schema drift event",
        }
        mock_detect.assert_called_once()


@pytest.mark.asyncio
async def test_webhook_fivetran_no_drift():
    """Test webhook when no schema drift is found by diagnoser."""
    with patch.object(main.detector, "process_webhook", new_callable=AsyncMock) as mock_detect, \
         patch.object(main.diagnoser, "diagnose", new_callable=AsyncMock) as mock_diagnose:
        
        mock_detect.return_value = {"id": "inc-001", "arize_trace_id": "trace-001"}
        mock_diagnose.return_value = SchemaDiff(
            missing_columns=[],
            new_columns=[],
            matched_columns=["id", "name"],
        )

        payload = {"event": "sync_failure", "connector_id": "connector_sf_001"}
        response = client.post("/webhook/fivetran", json=payload)
        assert response.status_code == 200
        assert response.json() == {"status": "no_drift", "incident_id": "inc-001"}
        
        mock_detect.assert_called_once()
        mock_diagnose.assert_called_once_with("connector_sf_001", "inc-001", "trace-001")


@pytest.mark.asyncio
async def test_webhook_fivetran_success():
    """Test successful schema healing execution via webhook."""
    with patch.object(main.detector, "process_webhook", new_callable=AsyncMock) as mock_detect, \
         patch.object(main.diagnoser, "diagnose", new_callable=AsyncMock) as mock_diagnose, \
         patch.object(main.mapper, "map_schema_diff", new_callable=AsyncMock) as mock_map, \
         patch.object(main.patcher, "apply_patch", new_callable=AsyncMock) as mock_patch, \
         patch.object(main.verifier, "verify", new_callable=AsyncMock) as mock_verify:
        
        mock_detect.return_value = {"id": "inc-001", "arize_trace_id": "trace-001"}
        mock_diagnose.return_value = SchemaDiff(
            missing_columns=["revenue"],
            new_columns=["annual_revenue", "extra_col"],
            matched_columns=["id"],
        )
        
        mapping = ColumnMapping(
            source_column="annual_revenue",
            destination_column="revenue",
            confidence=0.95,
            reasoning="Field renamed from revenue to annual_revenue",
        )
        mock_map.return_value = [mapping]
        mock_patch.return_value = None
        mock_verify.return_value = {
            "status": "healed",
            "resolution_time_ms": 1500,
        }

        payload = {"event": "sync_failure", "connector_id": "connector_sf_001"}
        response = client.post("/webhook/fivetran", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healed"
        assert data["incident_id"] == "inc-001"
        assert data["resolution_time_ms"] == 1500
        assert len(data["mappings"]) == 1
        assert data["mappings"][0]["source_column"] == "annual_revenue"
        assert data["mappings"][0]["destination_column"] == "revenue"

        mock_detect.assert_called_once()
        mock_diagnose.assert_called_once()
        mock_map.assert_called_once()
        mock_patch.assert_called_once()
        mock_verify.assert_called_once()


@pytest.mark.asyncio
async def test_manual_heal():
    """Test manual heal API endpoint."""
    with patch.object(main.detector, "process_webhook", new_callable=AsyncMock) as mock_detect:
        mock_detect.return_value = None

        response = client.post("/api/heal/connector_sf_001")
        assert response.status_code == 200
        assert response.json() == {
            "status": "ignored",
            "reason": "Not a schema drift event",
        }
        mock_detect.assert_called_once()


@pytest.mark.asyncio
async def test_list_pipelines():
    """Test listing all pipelines."""
    with patch.object(main.supabase, "list_pipelines", new_callable=AsyncMock) as mock_list:
        mock_list.return_value = [
            {"fivetran_connector_id": "c1", "status": "healthy"}
        ]
        
        response = client.get("/api/pipelines")
        assert response.status_code == 200
        assert response.json() == {
            "data": [{"fivetran_connector_id": "c1", "status": "healthy"}]
        }
        mock_list.assert_called_once()


@pytest.mark.asyncio
async def test_get_pipeline_success():
    """Test retrieving pipeline details successfully."""
    with patch.object(main.supabase, "get_pipeline", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = {"fivetran_connector_id": "c1", "status": "healthy"}
        
        response = client.get("/api/pipelines/c1")
        assert response.status_code == 200
        assert response.json() == {
            "data": {"fivetran_connector_id": "c1", "status": "healthy"}
        }
        mock_get.assert_called_once_with("c1")


@pytest.mark.asyncio
async def test_get_pipeline_404():
    """Test retrieving non-existent pipeline returns 404."""
    with patch.object(main.supabase, "get_pipeline", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = None
        
        response = client.get("/api/pipelines/non_existent")
        assert response.status_code == 404
        assert response.json() == {"detail": "Pipeline not found"}
        mock_get.assert_called_once_with("non_existent")


@pytest.mark.asyncio
async def test_list_incidents():
    """Test listing all incidents."""
    with patch.object(main.supabase, "list_incidents", new_callable=AsyncMock) as mock_list:
        mock_list.return_value = [{"id": "inc-001", "status": "resolved"}]
        
        response = client.get("/api/incidents")
        assert response.status_code == 200
        assert response.json() == {
            "data": [{"id": "inc-001", "status": "resolved"}]
        }
        mock_list.assert_called_once()


@pytest.mark.asyncio
async def test_get_incident_success():
    """Test retrieving incident details successfully."""
    with patch.object(main.supabase, "get_incident", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = {"id": "inc-001", "status": "resolved"}
        
        response = client.get("/api/incidents/inc-001")
        assert response.status_code == 200
        assert response.json() == {
            "data": {"id": "inc-001", "status": "resolved"}
        }
        mock_get.assert_called_once_with("inc-001")


@pytest.mark.asyncio
async def test_get_incident_404():
    """Test retrieving non-existent incident returns 404."""
    with patch.object(main.supabase, "get_incident", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = None
        
        response = client.get("/api/incidents/non_existent")
        assert response.status_code == 404
        assert response.json() == {"detail": "Incident not found"}
        mock_get.assert_called_once_with("non_existent")


@pytest.mark.asyncio
async def test_get_stats():
    """Test retrieving dashboard stats."""
    with patch.object(main.supabase, "get_stats", new_callable=AsyncMock) as mock_stats:
        mock_stats.return_value = {
            "total_pipelines": 5,
            "total_incidents": 10,
            "incidents_resolved": 8,
            "avg_resolution_time_ms": 2500.0,
        }
        
        response = client.get("/api/stats")
        assert response.status_code == 200
        data = response.json()
        assert data["total_pipelines"] == 5
        assert data["total_incidents"] == 10
        assert data["incidents_resolved"] == 8
        assert data["avg_resolution_time_ms"] == 2500.0
        assert "agent_uptime_seconds" in data
        mock_stats.assert_called_once()


def test_get_traces():
    """Test retrieving reasoning traces."""
    with patch.object(main.phoenix, "get_all_traces") as mock_traces:
        mock_traces.return_value = [{"id": "t-1", "name": "healing_flow"}]
        
        response = client.get("/api/traces")
        assert response.status_code == 200
        assert response.json() == {
            "data": [{"id": "t-1", "name": "healing_flow"}]
        }
        mock_traces.assert_called_once()


@pytest.mark.asyncio
async def test_seed_pipeline():
    """Test seeding a demo pipeline."""
    with patch.object(main.supabase, "upsert_pipeline", new_callable=AsyncMock) as mock_upsert, \
         patch.object(main.fivetran, "mock_reset") as mock_reset:
        
        mock_upsert.return_value = {"fivetran_connector_id": "connector_sf_001"}
        
        response = client.post("/api/seed")
        assert response.status_code == 200
        assert response.json() == {
            "status": "seeded",
            "data": {"fivetran_connector_id": "connector_sf_001"},
        }
        mock_upsert.assert_called_once()
        mock_reset.assert_called_once()


@pytest.mark.asyncio
async def test_break_pipeline():
    """Test introducing schema drift to break a demo pipeline."""
    with patch.object(main.supabase, "update_pipeline_status", new_callable=AsyncMock) as mock_update, \
         patch.object(main.fivetran, "mock_break_schema") as mock_break:
        
        mock_update.return_value = {"fivetran_connector_id": "connector_sf_001", "status": "broken"}
        
        response = client.post("/api/break")
        assert response.status_code == 200
        assert response.json() == {
            "status": "broken",
            "message": "Schema drift introduced — revenue → annual_revenue",
        }
        mock_break.assert_called_once()
        mock_update.assert_called_once_with("connector_sf_001", PipelineStatus.BROKEN)

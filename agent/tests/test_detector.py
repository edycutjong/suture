"""Tests for the Detector pipeline stage."""

import pytest
from unittest.mock import AsyncMock, MagicMock

from core.detector import Detector
from models.schemas import ErrorType, FivetranWebhookEvent


@pytest.fixture
def mock_fivetran():
    client = MagicMock()
    client.get_sync_logs = AsyncMock(return_value={
        "error_code": "SCHEMA_MISMATCH",
        "logs": [
            {"level": "ERROR", "message": "column 'revenue' not found in schema mapping"},
        ],
    })
    return client


@pytest.fixture
def mock_supabase():
    supabase = MagicMock()
    supabase.update_pipeline_status = AsyncMock()
    supabase.create_incident = AsyncMock(return_value={"id": "inc-test-001"})
    supabase.update_incident = AsyncMock()
    return supabase


@pytest.fixture
def mock_phoenix():
    phoenix = MagicMock()
    phoenix.start_trace = MagicMock(return_value="trace-001")
    phoenix.add_span = MagicMock()
    phoenix.end_trace = MagicMock()
    return phoenix


@pytest.fixture
def detector(mock_fivetran, mock_supabase, mock_phoenix):
    return Detector(mock_fivetran, mock_supabase, mock_phoenix)


class TestClassifyError:
    def test_schema_mismatch_error_code(self, detector):
        logs = {"error_code": "SCHEMA_MISMATCH", "logs": []}
        result = detector._classify_error(logs)
        assert result == ErrorType.SCHEMA_DRIFT

    def test_schema_keyword_in_log(self, detector):
        logs = {
            "error_code": "",
            "logs": [{"message": "schema column not found"}],
        }
        result = detector._classify_error(logs)
        assert result == ErrorType.SCHEMA_DRIFT

    def test_column_keyword_in_log(self, detector):
        logs = {
            "error_code": "",
            "logs": [{"message": "column missing in destination"}],
        }
        result = detector._classify_error(logs)
        assert result == ErrorType.SCHEMA_DRIFT

    def test_auth_keyword_in_log(self, detector):
        logs = {
            "error_code": "",
            "logs": [{"message": "auth failure: invalid credentials"}],
        }
        result = detector._classify_error(logs)
        assert result == ErrorType.AUTH_FAILURE

    def test_credential_keyword_in_log(self, detector):
        logs = {
            "error_code": "",
            "logs": [{"message": "credential expired"}],
        }
        result = detector._classify_error(logs)
        assert result == ErrorType.AUTH_FAILURE

    def test_rate_limit_keyword(self, detector):
        logs = {
            "error_code": "",
            "logs": [{"message": "rate limit exceeded"}],
        }
        result = detector._classify_error(logs)
        assert result == ErrorType.RATE_LIMIT

    def test_429_keyword(self, detector):
        logs = {
            "error_code": "",
            "logs": [{"message": "HTTP 429 Too Many Requests"}],
        }
        result = detector._classify_error(logs)
        assert result == ErrorType.RATE_LIMIT

    def test_empty_logs_defaults_schema_drift(self, detector):
        logs = {"error_code": "", "logs": []}
        result = detector._classify_error(logs)
        assert result == ErrorType.SCHEMA_DRIFT


class TestExtractErrorMessage:
    def test_extracts_error_level_message(self, detector):
        logs = {
            "logs": [
                {"level": "INFO", "message": "sync started"},
                {"level": "ERROR", "message": "column 'revenue' missing"},
            ]
        }
        result = detector._extract_error_message(logs)
        assert result == "column 'revenue' missing"

    def test_extracts_critical_level(self, detector):
        logs = {
            "logs": [{"level": "CRITICAL", "message": "fatal schema error"}]
        }
        result = detector._extract_error_message(logs)
        assert result == "fatal schema error"

    def test_falls_back_to_error_code(self, detector):
        logs = {"logs": [], "error_code": "SCHEMA_MISMATCH"}
        result = detector._extract_error_message(logs)
        assert result == "SCHEMA_MISMATCH"

    def test_unknown_when_no_info(self, detector):
        logs = {"logs": []}
        result = detector._extract_error_message(logs)
        assert result == "Unknown error"


class TestProcessWebhook:
    @pytest.mark.asyncio
    async def test_skips_non_failure_events(self, detector, mock_phoenix):
        event = FivetranWebhookEvent(
            event="sync_success", connector_id="connector_sf_001"
        )
        result = await detector.process_webhook(event)
        assert result is None
        mock_phoenix.end_trace.assert_called_once_with("trace-001", status="skipped")

    @pytest.mark.asyncio
    async def test_processes_sync_failure_event(self, detector):
        event = FivetranWebhookEvent(
            event="sync_failure", connector_id="connector_sf_001"
        )
        result = await detector.process_webhook(event)
        assert result is not None

    @pytest.mark.asyncio
    async def test_process_webhook_exception(self, detector, mock_phoenix):
        event = FivetranWebhookEvent(
            event="sync_failure", connector_id="connector_sf_001"
        )
        # Mock fivetran to raise an exception
        detector.fivetran.get_sync_logs.side_effect = Exception("API Error")
        
        with pytest.raises(Exception, match="API Error"):
            await detector.process_webhook(event)
            
        mock_phoenix.end_trace.assert_called_once_with("trace-001", status="error", result={"error": "API Error"})

    @pytest.mark.asyncio
    async def test_creates_incident_on_schema_drift(self, detector, mock_supabase):
        event = FivetranWebhookEvent(
            event="sync_failure", connector_id="connector_sf_001"
        )
        await detector.process_webhook(event)
        mock_supabase.create_incident.assert_called_once()

    @pytest.mark.asyncio
    async def test_updates_pipeline_status_to_broken(self, detector, mock_supabase):
        event = FivetranWebhookEvent(
            event="sync_failure", connector_id="connector_sf_001"
        )
        await detector.process_webhook(event)
        mock_supabase.update_pipeline_status.assert_called_once()

    @pytest.mark.asyncio
    async def test_starts_phoenix_trace(self, detector, mock_phoenix):
        event = FivetranWebhookEvent(
            event="sync_failure", connector_id="connector_sf_001"
        )
        await detector.process_webhook(event)
        mock_phoenix.start_trace.assert_called_once()

    @pytest.mark.asyncio
    async def test_non_schema_drift_returns_none(self, detector, mock_fivetran):
        mock_fivetran.get_sync_logs = AsyncMock(return_value={
            "error_code": "",
            "logs": [{"message": "auth failure"}],
        })
        event = FivetranWebhookEvent(
            event="sync_failure", connector_id="connector_sf_001"
        )
        result = await detector.process_webhook(event)
        assert result is None

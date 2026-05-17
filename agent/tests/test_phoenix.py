import pytest
from unittest.mock import patch, MagicMock
from clients.phoenix import PhoenixClient

@pytest.fixture
def phoenix_client():
    return PhoenixClient()

def test_init(phoenix_client):
    assert phoenix_client._initialized is False
    assert phoenix_client._traces == []

def test_initialize_success(phoenix_client):
    with patch.dict('sys.modules', {'phoenix': MagicMock(), 'openinference.instrumentation': MagicMock()}):
        phoenix_client.initialize()
        assert phoenix_client._initialized is True
        
        # Calling again should return early
        phoenix_client.initialize()
        assert phoenix_client._initialized is True

def test_initialize_import_error(phoenix_client):
    with patch.dict('sys.modules', {'phoenix': None}):
        phoenix_client.initialize()
        assert phoenix_client._initialized is False

def test_start_trace(phoenix_client):
    trace_id = phoenix_client.start_trace("test_op", {"meta": "data"})
    assert isinstance(trace_id, str)
    trace = phoenix_client.get_trace(trace_id)
    assert trace["operation"] == "test_op"
    assert trace["metadata"] == {"meta": "data"}

def test_add_span(phoenix_client):
    trace_id = phoenix_client.start_trace("test_op")
    phoenix_client.add_span(trace_id, "test_span", {"in": 1}, {"out": 2})
    
    trace = phoenix_client.get_trace(trace_id)
    assert len(trace["spans"]) == 1
    assert trace["spans"][0]["name"] == "test_span"
    assert trace["spans"][0]["input"] == {"in": 1}

def test_add_span_non_existent(phoenix_client):
    # Should not crash
    phoenix_client.add_span("fake", "test")

def test_end_trace(phoenix_client):
    trace_id = phoenix_client.start_trace("test_op")
    phoenix_client.end_trace(trace_id, "done", {"res": "ok"})
    
    trace = phoenix_client.get_trace(trace_id)
    assert trace["status"] == "done"
    assert trace["result"] == {"res": "ok"}
    assert "duration_ms" in trace

def test_end_trace_non_existent(phoenix_client):
    # Should not crash
    phoenix_client.end_trace("fake")

def test_get_trace_not_found(phoenix_client):
    assert phoenix_client.get_trace("fake") is None

def test_get_all_traces(phoenix_client):
    phoenix_client.start_trace("t1")
    phoenix_client.start_trace("t2")
    assert len(phoenix_client.get_all_traces()) == 2

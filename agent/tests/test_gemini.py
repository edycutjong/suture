import pytest
from unittest.mock import patch, MagicMock
from clients.gemini import GeminiClient

@pytest.fixture
def gemini_client(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test_key")
    return GeminiClient()

def test_init(gemini_client):
    assert gemini_client.api_key == "test_key"
    assert gemini_client.model_name == "gemini-3-pro"
    assert gemini_client._client is None

def test_get_client_success(gemini_client):
    with patch.dict('sys.modules', {'google.genai': MagicMock()}):
        import sys
        sys.modules['google.genai'].Client = MagicMock(return_value="mock_genai_client")
        client = gemini_client._get_client()
        assert client == "mock_genai_client"

def test_get_client_import_error(gemini_client):
    with patch.dict('sys.modules', {'google': None}):
        client = gemini_client._get_client()
        assert client is None

@pytest.mark.asyncio
async def test_reason_schema_diff_mock(gemini_client):
    # When client is None, it uses mock reasoning
    with patch.object(gemini_client, "_get_client", return_value=None):
        res = await gemini_client.reason_schema_diff(["revenue"], ["annual_revenue"], "Opportunity")
    assert len(res) == 1
    assert res[0].source_column == "annual_revenue"

@pytest.mark.asyncio
async def test_reason_schema_diff_live(gemini_client):
    mock_client = MagicMock()
    mock_resp = MagicMock()
    mock_resp.text = '[{"source_column": "new_c", "destination_column": "old_c", "confidence": 0.9, "reasoning": "test"}]'
    mock_client.models.generate_content.return_value = mock_resp
    gemini_client._client = mock_client
    
    res = await gemini_client.reason_schema_diff(["old_c"], ["new_c"], "test_table", "test context")
    assert len(res) == 1
    assert res[0].source_column == "new_c"
    mock_client.models.generate_content.assert_called_once()

def test_parse_reasoning_response_code_block(gemini_client):
    text = "```json\n[{\"source_column\": \"a\", \"destination_column\": \"b\", \"confidence\": 0.8, \"reasoning\": \"x\"}]\n```"
    res = gemini_client._parse_reasoning_response(text)
    assert len(res) == 1
    assert res[0].source_column == "a"

def test_parse_reasoning_response_invalid(gemini_client):
    res = gemini_client._parse_reasoning_response("not json")
    assert res == []

def test_mock_reasoning_empty(gemini_client):
    res = gemini_client._mock_reasoning(["a"], ["b"])
    assert res == []

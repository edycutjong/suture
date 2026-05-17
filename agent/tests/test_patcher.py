"""Tests for the Patcher pipeline stage."""

import pytest
from unittest.mock import MagicMock

from core.patcher import Patcher
from models.schemas import ColumnMapping


def make_mapping(src: str, dst: str, conf: float = 0.9) -> ColumnMapping:
    return ColumnMapping(
        source_column=src,
        destination_column=dst,
        confidence=conf,
        reasoning="test",
    )


@pytest.fixture
def patcher():
    return Patcher(MagicMock(), MagicMock(), MagicMock())


class TestApplyPatch:
    @pytest.fixture
    def mock_deps(self):
        from unittest.mock import AsyncMock, MagicMock
        fivetran = AsyncMock()
        supabase = AsyncMock()
        phoenix = MagicMock()
        return fivetran, supabase, phoenix

    @pytest.fixture
    def patcher(self, mock_deps):
        fivetran, supabase, phoenix = mock_deps
        return Patcher(fivetran, supabase, phoenix)

    @pytest.mark.asyncio
    async def test_apply_patch(self, patcher, mock_deps):
        fivetran, supabase, phoenix = mock_deps
        mappings = [make_mapping("annual_revenue", "revenue")]
        new_columns = ["new_field"]
        fivetran.modify_schema.return_value = {"success": True}
        
        result = await patcher.apply_patch("conn_1", mappings, new_columns, "inc_1", "trace_1")
        
        assert result == {"success": True}
        fivetran.modify_schema.assert_called_once()
        supabase.update_incident.assert_called()
        supabase.update_pipeline_status.assert_called_once()
        phoenix.add_span.assert_called()

class TestBuildPatch:
    def test_single_mapping(self, patcher):
        mappings = [make_mapping("annual_revenue", "revenue")]
        patch = patcher._build_patch(mappings, [])
        cols = patch["schemas"]["schema_updates"]["columns"]
        assert "annual_revenue" in cols
        assert cols["annual_revenue"]["name_in_destination"] == "revenue"

    def test_mapping_enables_column(self, patcher):
        mappings = [make_mapping("annual_revenue", "revenue")]
        patch = patcher._build_patch(mappings, [])
        cols = patch["schemas"]["schema_updates"]["columns"]
        assert cols["annual_revenue"]["enabled"] is True

    def test_new_columns_enabled(self, patcher):
        patch = patcher._build_patch([], ["new_field"])
        cols = patch["schemas"]["schema_updates"]["columns"]
        assert "new_field" in cols
        assert cols["new_field"]["enabled"] is True

    def test_multiple_mappings(self, patcher):
        mappings = [
            make_mapping("annual_revenue", "revenue"),
            make_mapping("quarterly_revenue", "q_rev"),
        ]
        patch = patcher._build_patch(mappings, [])
        cols = patch["schemas"]["schema_updates"]["columns"]
        assert "annual_revenue" in cols
        assert "quarterly_revenue" in cols

    def test_no_duplicate_new_columns(self, patcher):
        mappings = [make_mapping("annual_revenue", "revenue")]
        new_cols = ["annual_revenue", "extra_field"]
        patch = patcher._build_patch(mappings, new_cols)
        cols = patch["schemas"]["schema_updates"]["columns"]
        assert len([k for k in cols if k == "annual_revenue"]) == 1

    def test_empty_inputs(self, patcher):
        patch = patcher._build_patch([], [])
        cols = patch["schemas"]["schema_updates"]["columns"]
        assert cols == {}

    def test_patch_structure(self, patcher):
        patch = patcher._build_patch([], [])
        assert "schemas" in patch
        assert "schema_updates" in patch["schemas"]
        assert "columns" in patch["schemas"]["schema_updates"]

    def test_hashed_false_for_mappings(self, patcher):
        mappings = [make_mapping("annual_revenue", "revenue")]
        patch = patcher._build_patch(mappings, [])
        cols = patch["schemas"]["schema_updates"]["columns"]
        assert cols["annual_revenue"]["hashed"] is False

    def test_salesforce_scenario(self, patcher):
        mappings = [make_mapping("annual_revenue", "revenue", 0.94)]
        new_cols = ["quarterly_revenue"]
        patch = patcher._build_patch(mappings, new_cols)
        cols = patch["schemas"]["schema_updates"]["columns"]
        assert cols["annual_revenue"]["name_in_destination"] == "revenue"
        assert cols["quarterly_revenue"]["enabled"] is True

"""Tests for the Diagnoser pipeline stage."""

import pytest

from core.diagnoser import Diagnoser
from models.schemas import SchemaColumn, SchemaDiff, TableSchema


def make_schema(table: str, col_names: list[str]) -> TableSchema:
    return TableSchema(
        table=table,
        columns=[SchemaColumn(name=n, type="STRING") for n in col_names],
    )


def make_diff(missing=None, new=None, matched=None):
    return SchemaDiff(
        missing_columns=missing or [],
        new_columns=new or [],
        matched_columns=matched or [],
    )


class TestDiagnose:
    @pytest.fixture
    def mock_deps(self):
        from unittest.mock import AsyncMock, MagicMock
        fivetran = AsyncMock()
        fivetran.mode = "live"
        supabase = AsyncMock()
        phoenix = MagicMock()
        return fivetran, supabase, phoenix

    @pytest.fixture
    def diagnoser(self, mock_deps):
        fivetran, supabase, phoenix = mock_deps
        return Diagnoser(fivetran, supabase, phoenix)

    @pytest.mark.asyncio
    async def test_diagnose(self, diagnoser, mock_deps):
        fivetran, supabase, phoenix = mock_deps
        source_schema = make_schema("T", ["id", "new_col"])
        dest_schema = make_schema("T", ["id", "old_col"])
        fivetran.discover_schema.side_effect = [source_schema, dest_schema]
        
        diff = await diagnoser.diagnose("conn_1", "inc_1", "trace_1")
        
        assert "old_col" in diff.missing_columns
        assert "new_col" in diff.new_columns
        supabase.update_incident.assert_called()
        phoenix.add_span.assert_called()

    @pytest.mark.asyncio
    async def test_get_destination_schema_live(self, diagnoser, mock_deps):
        fivetran, _, _ = mock_deps
        fivetran.mode = "live"
        schema = make_schema("T", ["id"])
        fivetran.discover_schema.return_value = schema
        
        result = await diagnoser._get_destination_schema("conn_1")
        assert result == schema
        fivetran.discover_schema.assert_called_once_with("conn_1")

    @pytest.mark.asyncio
    async def test_get_destination_schema_mock(self, diagnoser, mock_deps):
        fivetran, _, _ = mock_deps
        fivetran.mode = "mock"
        fivetran._mock_schema_state = "after"
        schema = make_schema("T", ["id"])
        fivetran.discover_schema.return_value = schema
        
        result = await diagnoser._get_destination_schema("conn_1")
        assert result == schema
        fivetran.discover_schema.assert_called_once_with("conn_1")
        assert fivetran._mock_schema_state == "after"  # restored

class TestComputeDiff:
    @pytest.fixture
    def diagnoser(self):
        from unittest.mock import MagicMock
        return Diagnoser(MagicMock(), MagicMock(), MagicMock())

    def test_identical_schemas_no_diff(self, diagnoser):
        source = make_schema("T", ["id", "name", "revenue"])
        dest = make_schema("T", ["id", "name", "revenue"])
        diff = diagnoser._compute_diff(source, dest)
        assert diff.missing_columns == []
        assert diff.new_columns == []
        assert sorted(diff.matched_columns) == ["id", "name", "revenue"]

    def test_renamed_column_detected(self, diagnoser):
        source = make_schema("T", ["id", "name", "annual_revenue"])
        dest = make_schema("T", ["id", "name", "revenue"])
        diff = diagnoser._compute_diff(source, dest)
        assert "revenue" in diff.missing_columns
        assert "annual_revenue" in diff.new_columns
        assert "id" in diff.matched_columns
        assert "name" in diff.matched_columns

    def test_added_column_detected(self, diagnoser):
        source = make_schema("T", ["id", "name", "revenue", "new_field"])
        dest = make_schema("T", ["id", "name", "revenue"])
        diff = diagnoser._compute_diff(source, dest)
        assert "new_field" in diff.new_columns
        assert diff.missing_columns == []

    def test_removed_column_detected(self, diagnoser):
        source = make_schema("T", ["id", "name"])
        dest = make_schema("T", ["id", "name", "revenue"])
        diff = diagnoser._compute_diff(source, dest)
        assert "revenue" in diff.missing_columns
        assert diff.new_columns == []

    def test_multiple_changes(self, diagnoser):
        source = make_schema("T", ["id", "annual_revenue", "new_col"])
        dest = make_schema("T", ["id", "revenue", "old_col"])
        diff = diagnoser._compute_diff(source, dest)
        assert "revenue" in diff.missing_columns
        assert "old_col" in diff.missing_columns
        assert "annual_revenue" in diff.new_columns
        assert "new_col" in diff.new_columns
        assert "id" in diff.matched_columns

    def test_diff_results_are_sorted(self, diagnoser):
        source = make_schema("T", ["z_col", "a_col"])
        dest = make_schema("T", ["b_col", "m_col"])
        diff = diagnoser._compute_diff(source, dest)
        assert diff.missing_columns == sorted(diff.missing_columns)
        assert diff.new_columns == sorted(diff.new_columns)

    def test_empty_source(self, diagnoser):
        source = make_schema("T", [])
        dest = make_schema("T", ["id", "revenue"])
        diff = diagnoser._compute_diff(source, dest)
        assert set(diff.missing_columns) == {"id", "revenue"}
        assert diff.new_columns == []
        assert diff.matched_columns == []

    def test_empty_destination(self, diagnoser):
        source = make_schema("T", ["id", "revenue"])
        dest = make_schema("T", [])
        diff = diagnoser._compute_diff(source, dest)
        assert diff.missing_columns == []
        assert set(diff.new_columns) == {"id", "revenue"}

    def test_returns_schema_diff_type(self, diagnoser):
        diff = diagnoser._compute_diff(
            make_schema("T", ["a"]), make_schema("T", ["b"])
        )
        assert isinstance(diff, SchemaDiff)

    def test_salesforce_scenario(self, diagnoser):
        before = make_schema("Opportunity", ["id", "name", "revenue", "stage", "close_date", "owner_id"])
        after = make_schema("Opportunity", ["id", "name", "annual_revenue", "quarterly_revenue", "stage", "close_date", "owner_id"])
        diff = diagnoser._compute_diff(after, before)
        assert "revenue" in diff.missing_columns
        assert "annual_revenue" in diff.new_columns
        assert "quarterly_revenue" in diff.new_columns
        assert "id" in diff.matched_columns

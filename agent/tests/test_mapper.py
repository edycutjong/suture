"""Tests for the Mapper pipeline stage."""

import pytest
from unittest.mock import MagicMock

from core.mapper import Mapper
from models.schemas import ColumnMapping, SchemaDiff


def make_diff(missing=None, new=None, matched=None):
    return SchemaDiff(
        missing_columns=missing or [],
        new_columns=new or [],
        matched_columns=matched or [],
    )


def make_mapping(src: str, dst: str, conf: float = 0.9) -> ColumnMapping:
    return ColumnMapping(
        source_column=src,
        destination_column=dst,
        confidence=conf,
        reasoning=f"{src} → {dst}",
    )


@pytest.fixture
def mapper():
    return Mapper(MagicMock(), MagicMock(), MagicMock())


class TestFormatReasoning:
    def test_shows_missing_columns(self, mapper):
        diff = make_diff(missing=["revenue"], new=["annual_revenue"])
        mappings = [make_mapping("annual_revenue", "revenue")]
        text = mapper._format_reasoning(mappings, diff)
        assert "revenue" in text

    def test_shows_new_columns(self, mapper):
        diff = make_diff(missing=["revenue"], new=["annual_revenue"])
        mappings = [make_mapping("annual_revenue", "revenue")]
        text = mapper._format_reasoning(mappings, diff)
        assert "annual_revenue" in text

    def test_shows_mapping_arrow(self, mapper):
        diff = make_diff(missing=["revenue"], new=["annual_revenue"])
        mappings = [make_mapping("annual_revenue", "revenue", 0.94)]
        text = mapper._format_reasoning(mappings, diff)
        assert "→" in text

    def test_shows_confidence_score(self, mapper):
        diff = make_diff(missing=["revenue"], new=["annual_revenue"])
        mappings = [make_mapping("annual_revenue", "revenue", 0.94)]
        text = mapper._format_reasoning(mappings, diff)
        assert "0.94" in text

    def test_empty_mappings_note(self, mapper):
        diff = make_diff()
        text = mapper._format_reasoning([], diff)
        assert "No semantic mappings" in text

    def test_includes_matched_count(self, mapper):
        diff = make_diff(matched=["id", "name", "stage"])
        text = mapper._format_reasoning([], diff)
        assert "3" in text

    def test_multiple_mappings(self, mapper):
        diff = make_diff(
            missing=["rev", "qty"],
            new=["annual_rev", "quarterly_rev"],
        )
        mappings = [
            make_mapping("annual_rev", "rev", 0.92),
            make_mapping("quarterly_rev", "qty", 0.88),
        ]
        text = mapper._format_reasoning(mappings, diff)
        assert "annual_rev" in text
        assert "quarterly_rev" in text

    def test_returns_string(self, mapper):
        diff = make_diff()
        result = mapper._format_reasoning([], diff)
        assert isinstance(result, str)

    def test_reasoning_in_output(self, mapper):
        diff = make_diff(missing=["a"], new=["b"])
        mapping = ColumnMapping(
            source_column="b",
            destination_column="a",
            confidence=0.9,
            reasoning="Column was renamed in v2 API",
        )
        text = mapper._format_reasoning([mapping], diff)
        assert "Column was renamed in v2 API" in text

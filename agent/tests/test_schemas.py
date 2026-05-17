"""Tests for Pydantic data models."""

import pytest
from pydantic import ValidationError

from models.schemas import (
    ColumnMapping,
    ErrorType,
    FivetranWebhookEvent,
    Incident,
    IncidentStatus,
    Pipeline,
    PipelineStatus,
    SchemaDiff,
    SchemaColumn,
    TableSchema,
)


# ── PipelineStatus ────────────────────────────────────────────

class TestPipelineStatus:
    def test_healthy_value(self):
        assert PipelineStatus.HEALTHY == "healthy"

    def test_broken_value(self):
        assert PipelineStatus.BROKEN == "broken"

    def test_healing_value(self):
        assert PipelineStatus.HEALING == "healing"

    def test_healed_value(self):
        assert PipelineStatus.HEALED == "healed"

    def test_all_values(self):
        values = {s.value for s in PipelineStatus}
        assert values == {"healthy", "broken", "healing", "healed"}


# ── IncidentStatus ────────────────────────────────────────────

class TestIncidentStatus:
    def test_detected_value(self):
        assert IncidentStatus.DETECTED == "detected"

    def test_resolved_value(self):
        assert IncidentStatus.RESOLVED == "resolved"

    def test_failed_value(self):
        assert IncidentStatus.FAILED == "failed"

    def test_all_statuses_present(self):
        statuses = {s.value for s in IncidentStatus}
        assert "diagnosing" in statuses
        assert "patching" in statuses


# ── ErrorType ─────────────────────────────────────────────────

class TestErrorType:
    def test_schema_drift_value(self):
        assert ErrorType.SCHEMA_DRIFT == "schema_drift"

    def test_auth_failure_value(self):
        assert ErrorType.AUTH_FAILURE == "auth_failure"

    def test_rate_limit_value(self):
        assert ErrorType.RATE_LIMIT == "rate_limit"


# ── SchemaColumn ──────────────────────────────────────────────

class TestSchemaColumn:
    def test_basic_creation(self):
        col = SchemaColumn(name="revenue", type="FLOAT")
        assert col.name == "revenue"
        assert col.type == "FLOAT"
        assert col.enabled is True

    def test_disabled_column(self):
        col = SchemaColumn(name="old_col", type="STRING", enabled=False)
        assert col.enabled is False

    def test_name_required(self):
        with pytest.raises(ValidationError):
            SchemaColumn(type="STRING")

    def test_type_required(self):
        with pytest.raises(ValidationError):
            SchemaColumn(name="col")


# ── TableSchema ───────────────────────────────────────────────

class TestTableSchema:
    def test_basic_creation(self):
        schema = TableSchema(
            table="Opportunity",
            columns=[SchemaColumn(name="id", type="STRING")],
        )
        assert schema.table == "Opportunity"
        assert len(schema.columns) == 1

    def test_empty_columns_allowed(self):
        schema = TableSchema(table="Empty", columns=[])
        assert schema.columns == []

    def test_optional_hash(self):
        schema = TableSchema(table="T", columns=[])
        assert schema.schema_hash is None

    def test_with_hash(self):
        schema = TableSchema(table="T", columns=[], schema_hash="abc123")
        assert schema.schema_hash == "abc123"

    def test_multiple_columns(self):
        cols = [
            SchemaColumn(name="id", type="STRING"),
            SchemaColumn(name="revenue", type="FLOAT"),
            SchemaColumn(name="stage", type="STRING"),
        ]
        schema = TableSchema(table="Opportunity", columns=cols)
        assert len(schema.columns) == 3


# ── ColumnMapping ─────────────────────────────────────────────

class TestColumnMapping:
    def test_basic_creation(self):
        mapping = ColumnMapping(
            source_column="annual_revenue",
            destination_column="revenue",
            confidence=0.94,
            reasoning="Field was renamed",
        )
        assert mapping.source_column == "annual_revenue"
        assert mapping.destination_column == "revenue"
        assert mapping.confidence == 0.94

    def test_confidence_zero(self):
        mapping = ColumnMapping(
            source_column="a", destination_column="b", confidence=0.0, reasoning="r"
        )
        assert mapping.confidence == 0.0

    def test_confidence_one(self):
        mapping = ColumnMapping(
            source_column="a", destination_column="b", confidence=1.0, reasoning="r"
        )
        assert mapping.confidence == 1.0

    def test_confidence_below_zero_rejected(self):
        with pytest.raises(ValidationError):
            ColumnMapping(
                source_column="a", destination_column="b", confidence=-0.1, reasoning="r"
            )

    def test_confidence_above_one_rejected(self):
        with pytest.raises(ValidationError):
            ColumnMapping(
                source_column="a", destination_column="b", confidence=1.1, reasoning="r"
            )


# ── SchemaDiff ────────────────────────────────────────────────

class TestSchemaDiff:
    def test_basic_diff(self):
        diff = SchemaDiff(
            missing_columns=["revenue"],
            new_columns=["annual_revenue"],
            matched_columns=["id", "name"],
        )
        assert "revenue" in diff.missing_columns
        assert "annual_revenue" in diff.new_columns
        assert len(diff.matched_columns) == 2

    def test_empty_diff(self):
        diff = SchemaDiff(missing_columns=[], new_columns=[], matched_columns=[])
        assert diff.mappings == []

    def test_mappings_default_empty(self):
        diff = SchemaDiff(missing_columns=[], new_columns=[], matched_columns=[])
        assert diff.mappings == []

    def test_with_mappings(self):
        mapping = ColumnMapping(
            source_column="annual_revenue",
            destination_column="revenue",
            confidence=0.94,
            reasoning="Renamed",
        )
        diff = SchemaDiff(
            missing_columns=["revenue"],
            new_columns=["annual_revenue"],
            matched_columns=["id"],
            mappings=[mapping],
        )
        assert len(diff.mappings) == 1


# ── Pipeline ──────────────────────────────────────────────────

class TestPipeline:
    def test_basic_creation(self):
        pipeline = Pipeline(
            fivetran_connector_id="conn_001",
            connector_name="Salesforce → BigQuery",
            source_type="salesforce",
            destination_type="bigquery",
        )
        assert pipeline.status == PipelineStatus.HEALTHY
        assert pipeline.id is None

    def test_default_status(self):
        pipeline = Pipeline(
            fivetran_connector_id="c",
            connector_name="n",
            source_type="s",
            destination_type="d",
        )
        assert pipeline.status == PipelineStatus.HEALTHY


# ── Incident ──────────────────────────────────────────────────

class TestIncident:
    def test_basic_creation(self):
        incident = Incident(
            pipeline_id="connector_sf_001",
            error_type=ErrorType.SCHEMA_DRIFT,
        )
        assert incident.status == IncidentStatus.DETECTED
        assert incident.id is None
        assert incident.confidence_score is None

    def test_default_status_is_detected(self):
        incident = Incident(
            pipeline_id="p", error_type=ErrorType.AUTH_FAILURE
        )
        assert incident.status == IncidentStatus.DETECTED


# ── FivetranWebhookEvent ──────────────────────────────────────

class TestFivetranWebhookEvent:
    def test_sync_failure_event(self):
        event = FivetranWebhookEvent(
            event="sync_failure",
            connector_id="connector_sf_001",
        )
        assert event.event == "sync_failure"
        assert event.connector_id == "connector_sf_001"

    def test_optional_fields_default_none(self):
        event = FivetranWebhookEvent(event="sync_success", connector_id="c")
        assert event.connector_name is None
        assert event.data is None

    def test_with_data(self):
        event = FivetranWebhookEvent(
            event="sync_failure",
            connector_id="c",
            data={"error": "schema mismatch"},
        )
        assert event.data["error"] == "schema mismatch"

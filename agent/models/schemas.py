"""
Suture — Pydantic Models

Data models for pipelines, incidents, schema diffs, and API responses.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ── Enums ──────────────────────────────────────────────────────

class PipelineStatus(str, Enum):
    HEALTHY = "healthy"
    BROKEN = "broken"
    HEALING = "healing"
    HEALED = "healed"


class IncidentStatus(str, Enum):
    DETECTED = "detected"
    DIAGNOSING = "diagnosing"
    PATCHING = "patching"
    RESOLVED = "resolved"
    FAILED = "failed"


class ErrorType(str, Enum):
    SCHEMA_DRIFT = "schema_drift"
    AUTH_FAILURE = "auth_failure"
    RATE_LIMIT = "rate_limit"


# ── Schema Models ─────────────────────────────────────────────

class SchemaColumn(BaseModel):
    name: str
    type: str
    enabled: bool = True


class TableSchema(BaseModel):
    table: str
    columns: list[SchemaColumn]
    schema_hash: Optional[str] = None
    last_synced_at: Optional[str] = None


class ColumnMapping(BaseModel):
    """AI-generated mapping between old and new column names."""
    source_column: str
    destination_column: str
    confidence: float = Field(ge=0.0, le=1.0)
    reasoning: str


class SchemaDiff(BaseModel):
    """Result of comparing source vs destination schemas."""
    missing_columns: list[str]  # In destination but not in source
    new_columns: list[str]      # In source but not in destination
    matched_columns: list[str]  # Present in both
    mappings: list[ColumnMapping] = []  # AI-generated mappings


# ── Pipeline Models ───────────────────────────────────────────

class Pipeline(BaseModel):
    id: Optional[str] = None
    fivetran_connector_id: str
    connector_name: str
    source_type: str
    destination_type: str
    status: PipelineStatus = PipelineStatus.HEALTHY
    last_sync_at: Optional[datetime] = None
    last_schema_diff: Optional[SchemaDiff] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ── Incident Models ───────────────────────────────────────────

class Incident(BaseModel):
    id: Optional[str] = None
    pipeline_id: str
    error_type: ErrorType
    error_message: Optional[str] = None
    source_schema: Optional[TableSchema] = None
    destination_schema: Optional[TableSchema] = None
    ai_reasoning: Optional[str] = None
    applied_patch: Optional[dict] = None
    confidence_score: Optional[float] = None
    resolution_time_ms: Optional[int] = None
    status: IncidentStatus = IncidentStatus.DETECTED
    arize_trace_id: Optional[str] = None
    created_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None


# ── Webhook Models ────────────────────────────────────────────

class FivetranWebhookEvent(BaseModel):
    """Incoming Fivetran webhook event payload."""
    event: str  # 'sync_failure', 'sync_success', etc.
    connector_id: str
    connector_name: Optional[str] = None
    created: Optional[str] = None
    data: Optional[dict] = None


# ── API Response Models ───────────────────────────────────────

class StatsResponse(BaseModel):
    total_pipelines: int
    total_incidents: int
    incidents_resolved: int
    avg_resolution_time_ms: Optional[float] = None
    agent_uptime_seconds: float


class HealthResponse(BaseModel):
    status: str = "online"
    version: str = "1.0.0"
    mode: str = "mock"
    uptime_seconds: float = 0.0

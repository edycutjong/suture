/**
 * Suture — TypeScript Types
 *
 * Shared type definitions for pipelines, incidents, and schema diffs.
 */

// ── Enums ──────────────────────────────────────────────────

export type PipelineStatus = 'healthy' | 'broken' | 'healing' | 'healed';
export type IncidentStatus = 'detected' | 'diagnosing' | 'patching' | 'resolved' | 'failed';
export type ErrorType = 'schema_drift' | 'auth_failure' | 'rate_limit';

// ── Schema ─────────────────────────────────────────────────

export interface SchemaColumn {
  name: string;
  type: string;
  enabled: boolean;
}

export interface TableSchema {
  table: string;
  columns: SchemaColumn[];
  schema_hash?: string;
  last_synced_at?: string;
}

export interface ColumnMapping {
  source_column: string;
  destination_column: string;
  confidence: number;
  reasoning: string;
}

export interface SchemaDiff {
  missing_columns: string[];
  new_columns: string[];
  matched_columns: string[];
  mappings: ColumnMapping[];
}

// ── Pipeline ───────────────────────────────────────────────

export interface Pipeline {
  id: string;
  fivetran_connector_id: string;
  connector_name: string;
  source_type: string;
  destination_type: string;
  status: PipelineStatus;
  last_sync_at?: string;
  last_schema_diff?: SchemaDiff;
  created_at: string;
  updated_at: string;
}

// ── Incident ───────────────────────────────────────────────

export interface Incident {
  id: string;
  pipeline_id: string;
  error_type: ErrorType;
  error_message?: string;
  source_schema?: TableSchema;
  destination_schema?: TableSchema;
  ai_reasoning?: string;
  applied_patch?: Record<string, unknown>;
  confidence_score?: number;
  resolution_time_ms?: number;
  status: IncidentStatus;
  arize_trace_id?: string;
  created_at: string;
  resolved_at?: string;
}

// ── Stats ──────────────────────────────────────────────────

export interface Stats {
  total_pipelines: number;
  total_incidents: number;
  incidents_resolved: number;
  avg_resolution_time_ms?: number;
  agent_uptime_seconds: number;
}

// ── Agent Log Entry ────────────────────────────────────────

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  message: string;
  details?: string;
}

/**
 * Suture — Mock Data
 *
 * Deterministic mock data generators for development without the agent running.
 */

import type { Pipeline, Incident, LogEntry, Stats } from './types';

export const MOCK_PIPELINES: Pipeline[] = [
  {
    id: '1',
    fivetran_connector_id: 'connector_sf_001',
    connector_name: 'Salesforce → BigQuery (Opportunities)',
    source_type: 'salesforce',
    destination_type: 'bigquery',
    status: 'healed',
    last_sync_at: '2026-05-14T03:05:00Z',
    created_at: '2026-05-10T10:00:00Z',
    updated_at: '2026-05-14T03:05:00Z',
  },
  {
    id: '2',
    fivetran_connector_id: 'connector_hb_001',
    connector_name: 'HubSpot → Snowflake (Contacts)',
    source_type: 'hubspot',
    destination_type: 'snowflake',
    status: 'healthy',
    last_sync_at: '2026-05-14T02:00:00Z',
    created_at: '2026-05-09T14:00:00Z',
    updated_at: '2026-05-14T02:00:00Z',
  },
  {
    id: '3',
    fivetran_connector_id: 'connector_st_001',
    connector_name: 'Stripe → BigQuery (Charges)',
    source_type: 'stripe',
    destination_type: 'bigquery',
    status: 'broken',
    last_sync_at: '2026-05-14T01:30:00Z',
    created_at: '2026-05-08T08:00:00Z',
    updated_at: '2026-05-14T01:30:00Z',
  },
  {
    id: '4',
    fivetran_connector_id: 'connector_zd_001',
    connector_name: 'Zendesk → Snowflake (Tickets)',
    source_type: 'zendesk',
    destination_type: 'snowflake',
    status: 'healing',
    last_sync_at: '2026-05-14T03:02:00Z',
    created_at: '2026-05-11T16:00:00Z',
    updated_at: '2026-05-14T03:02:00Z',
  },
];

export const MOCK_INCIDENTS: Incident[] = [
  {
    id: 'inc-001',
    pipeline_id: 'connector_sf_001',
    error_type: 'schema_drift',
    error_message: "Schema mapping error: column 'revenue' not found in source",
    ai_reasoning:
      "Column 'revenue' was dropped and 'annual_revenue' was added. Semantic analysis indicates this is a rename — 'annual_revenue' is the annualized version of the same metric. Confidence: 0.94.",
    confidence_score: 0.94,
    resolution_time_ms: 1823,
    status: 'resolved',
    arize_trace_id: 'trace-abc-123',
    created_at: '2026-05-14T03:00:12Z',
    resolved_at: '2026-05-14T03:00:14Z',
    source_schema: {
      table: 'Opportunity',
      columns: [
        { name: 'id', type: 'STRING', enabled: true },
        { name: 'name', type: 'STRING', enabled: true },
        { name: 'annual_revenue', type: 'FLOAT', enabled: true },
        { name: 'quarterly_revenue', type: 'FLOAT', enabled: true },
        { name: 'stage', type: 'STRING', enabled: true },
        { name: 'close_date', type: 'DATE', enabled: true },
        { name: 'owner_id', type: 'STRING', enabled: true },
      ],
    },
    destination_schema: {
      table: 'Opportunity',
      columns: [
        { name: 'id', type: 'STRING', enabled: true },
        { name: 'name', type: 'STRING', enabled: true },
        { name: 'revenue', type: 'FLOAT', enabled: true },
        { name: 'stage', type: 'STRING', enabled: true },
        { name: 'close_date', type: 'DATE', enabled: true },
        { name: 'owner_id', type: 'STRING', enabled: true },
      ],
    },
  },
  {
    id: 'inc-002',
    pipeline_id: 'connector_st_001',
    error_type: 'schema_drift',
    error_message: "Schema mapping error: column 'amount_cents' not found",
    confidence_score: 0.88,
    resolution_time_ms: 2450,
    status: 'detected',
    created_at: '2026-05-14T01:30:00Z',
  },
];

export const MOCK_LOG_ENTRIES: LogEntry[] = [
  { timestamp: '2026-05-14T03:00:05', level: 'info', message: 'Webhook received: sync_failure for connector_sf_001' },
  { timestamp: '2026-05-14T03:00:06', level: 'info', message: 'Querying sync logs...' },
  { timestamp: '2026-05-14T03:00:07', level: 'warning', message: 'Schema drift detected: column \'revenue\' missing' },
  { timestamp: '2026-05-14T03:00:08', level: 'info', message: 'Discovering source schema...' },
  { timestamp: '2026-05-14T03:00:09', level: 'info', message: 'Computing schema diff: 1 missing, 2 new columns' },
  { timestamp: '2026-05-14T03:00:10', level: 'info', message: 'Invoking Gemini 3 for semantic reasoning...' },
  { timestamp: '2026-05-14T03:00:11', level: 'success', message: 'AI mapping: annual_revenue → revenue (0.94 confidence)' },
  { timestamp: '2026-05-14T03:00:12', level: 'info', message: 'Patching Fivetran connector schema...' },
  { timestamp: '2026-05-14T03:00:13', level: 'info', message: 'Triggering re-sync...' },
  { timestamp: '2026-05-14T03:00:14', level: 'success', message: 'Pipeline HEALED — resolved in 1.8s' },
];

export const MOCK_STATS: Stats = {
  total_pipelines: 12,
  total_incidents: 3,
  incidents_resolved: 2,
  avg_resolution_time_ms: 1823,
  agent_uptime_seconds: 86400,
};

-- ============================================
-- Suture — Supabase Database Schema
-- ============================================
-- Autonomous Fivetran schema drift healer
-- Tables: suture_pipelines, suture_incidents, suture_config

-- Pipeline state tracking
CREATE TABLE suture_pipelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fivetran_connector_id TEXT NOT NULL UNIQUE,
    connector_name TEXT NOT NULL,
    source_type TEXT NOT NULL,         -- 'salesforce', 'hubspot', 'stripe', etc.
    destination_type TEXT NOT NULL,     -- 'bigquery', 'snowflake', etc.
    status TEXT NOT NULL DEFAULT 'healthy', -- 'healthy', 'broken', 'healing', 'healed'
    last_sync_at TIMESTAMPTZ,
    last_schema_diff JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Incident history
CREATE TABLE suture_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_id UUID REFERENCES suture_pipelines(id) ON DELETE CASCADE,
    error_type TEXT NOT NULL,          -- 'schema_drift', 'auth_failure', 'rate_limit'
    error_message TEXT,
    source_schema JSONB,               -- schema snapshot at time of failure
    destination_schema JSONB,          -- schema snapshot at time of failure
    ai_reasoning TEXT,                 -- Gemini's full reasoning chain
    applied_patch JSONB,               -- the schema modification applied
    confidence_score FLOAT,            -- AI confidence in the mapping (0-1)
    resolution_time_ms INTEGER,        -- time from detection to green
    status TEXT NOT NULL DEFAULT 'detected', -- 'detected', 'diagnosing', 'patching', 'resolved', 'failed'
    arize_trace_id TEXT,               -- link to Phoenix trace
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Agent configuration (key-value store)
CREATE TABLE suture_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================
ALTER TABLE suture_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE suture_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE suture_config ENABLE ROW LEVEL SECURITY;

-- Public read access (dashboard reads via anon key)
CREATE POLICY "Allow public read on pipelines" ON suture_pipelines FOR SELECT USING (true);
CREATE POLICY "Allow public read on incidents" ON suture_incidents FOR SELECT USING (true);

-- Service role write access (agent writes via service_role key)
CREATE POLICY "Allow service write on pipelines" ON suture_pipelines FOR ALL USING (true);
CREATE POLICY "Allow service write on incidents" ON suture_incidents FOR ALL USING (true);
CREATE POLICY "Allow service write on config" ON suture_config FOR ALL USING (true);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_pipelines_status ON suture_pipelines(status);
CREATE INDEX idx_incidents_pipeline ON suture_incidents(pipeline_id);
CREATE INDEX idx_incidents_status ON suture_incidents(status);
CREATE INDEX idx_incidents_created ON suture_incidents(created_at DESC);

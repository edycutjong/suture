"""
Suture — FastAPI Agent

Main entry point for the autonomous schema drift healing agent.
Exposes webhook listener, REST API, and health checks.
"""

from __future__ import annotations

import time

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from clients.fivetran import FivetranClient
from clients.gemini import GeminiClient
from clients.phoenix import PhoenixClient
from clients.supabase_client import SupabaseClient
from core.detector import Detector
from core.diagnoser import Diagnoser
from core.mapper import Mapper
from core.patcher import Patcher
from core.verifier import Verifier
from models.schemas import (
    FivetranWebhookEvent,
    HealthResponse,
    Pipeline,
    PipelineStatus,
    StatsResponse,
)

# ── Load Environment ──────────────────────────────────────────
load_dotenv()

# ── Initialize App ────────────────────────────────────────────
app = FastAPI(
    title="Suture",
    description="Autonomous Fivetran schema drift healer",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Initialize Clients ───────────────────────────────────────
fivetran = FivetranClient()
gemini = GeminiClient()
phoenix = PhoenixClient()
supabase = SupabaseClient()

# ── Initialize Core Pipeline ─────────────────────────────────
detector = Detector(fivetran, supabase, phoenix)
diagnoser = Diagnoser(fivetran, supabase, phoenix)
mapper = Mapper(gemini, supabase, phoenix)
patcher = Patcher(fivetran, supabase, phoenix)
verifier = Verifier(fivetran, supabase, phoenix)

# ── App State ─────────────────────────────────────────────────
START_TIME = time.time()


# ══════════════════════════════════════════════════════════════
# ENDPOINTS
# ══════════════════════════════════════════════════════════════


@app.get("/api/health")
async def health() -> HealthResponse:
    """Agent health check."""
    return HealthResponse(
        status="online",
        version="1.0.0",
        mode=fivetran.mode,
        uptime_seconds=time.time() - START_TIME,
    )


@app.post("/webhook/fivetran")
async def webhook_fivetran(event: FivetranWebhookEvent):
    """
    Receive Fivetran sync failure webhook events.
    Triggers the full healing pipeline: detect → diagnose → reason → patch → verify.
    """
    # Step 1: Detect
    incident_data = await detector.process_webhook(event)
    if not incident_data:
        return {"status": "ignored", "reason": "Not a schema drift event"}

    incident_id = incident_data.get("id", "unknown")
    trace_id = incident_data.get("arize_trace_id", "")
    started_at = time.time()

    # Step 2: Diagnose
    diff = await diagnoser.diagnose(event.connector_id, incident_id, trace_id)

    if not diff.missing_columns and not diff.new_columns:
        return {"status": "no_drift", "incident_id": incident_id}

    # Step 3: Reason (AI mapping)
    mappings = await mapper.map_schema_diff(
        diff=diff,
        table_name="Opportunity",
        incident_id=incident_id,
        trace_id=trace_id,
    )

    # Step 4: Patch
    await patcher.apply_patch(
        connector_id=event.connector_id,
        mappings=mappings,
        new_columns=[c for c in diff.new_columns if c not in [m.source_column for m in mappings]],
        incident_id=incident_id,
        trace_id=trace_id,
    )

    # Step 5: Verify
    result = await verifier.verify(
        connector_id=event.connector_id,
        incident_id=incident_id,
        trace_id=trace_id,
        started_at=started_at,
    )

    return {
        "status": result["status"],
        "incident_id": incident_id,
        "resolution_time_ms": result.get("resolution_time_ms"),
        "mappings": [m.model_dump() for m in mappings],
    }


@app.post("/api/heal/{connector_id}")
async def manual_heal(connector_id: str):
    """Manually trigger a heal for a specific pipeline."""
    event = FivetranWebhookEvent(
        event="sync_failure",
        connector_id=connector_id,
    )
    return await webhook_fivetran(event)


@app.get("/api/pipelines")
async def list_pipelines():
    """List all monitored pipelines with status."""
    pipelines = await supabase.list_pipelines()
    return {"data": pipelines}


@app.get("/api/pipelines/{connector_id}")
async def get_pipeline(connector_id: str):
    """Get pipeline details + incident history."""
    pipeline = await supabase.get_pipeline(connector_id)
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    return {"data": pipeline}


@app.get("/api/incidents")
async def list_incidents():
    """List all incidents with resolution details."""
    incidents = await supabase.list_incidents()
    return {"data": incidents}


@app.get("/api/incidents/{incident_id}")
async def get_incident(incident_id: str):
    """Get incident detail including AI reasoning."""
    incident = await supabase.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return {"data": incident}


@app.get("/api/stats")
async def get_stats() -> StatsResponse:
    """Dashboard stats (total healed, avg resolution time)."""
    stats = await supabase.get_stats()
    return StatsResponse(
        **stats,
        agent_uptime_seconds=time.time() - START_TIME,
    )


@app.get("/api/traces")
async def get_traces():
    """Get all agent reasoning traces."""
    traces = phoenix.get_all_traces()
    return {"data": traces}


# ── Seed endpoint (demo only) ────────────────────────────────

@app.post("/api/seed")
async def seed_pipeline():
    """Seed a demo pipeline for testing."""
    pipeline = Pipeline(
        fivetran_connector_id="connector_sf_001",
        connector_name="Salesforce → BigQuery (Opportunities)",
        source_type="salesforce",
        destination_type="bigquery",
        status=PipelineStatus.HEALTHY,
    )
    result = await supabase.upsert_pipeline(pipeline)
    fivetran.mock_reset()
    return {"status": "seeded", "data": result}


@app.post("/api/break")
async def break_pipeline():
    """Break the demo pipeline with schema drift."""
    fivetran.mock_break_schema()
    await supabase.update_pipeline_status("connector_sf_001", PipelineStatus.BROKEN)
    return {"status": "broken", "message": "Schema drift introduced — revenue → annual_revenue"}

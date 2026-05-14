# 🩺 Suture

> **Your pipelines heal themselves.**

Autonomous AI agent that detects broken Fivetran syncs caused by schema drift, reasons through the diff with Gemini 3, and self-heals the pipeline in under 60 seconds.

## The Problem

Schema drift is the #1 cause of data pipeline failures. When an upstream source changes its API schema — renaming columns, adding fields, or deprecating endpoints — downstream Fivetran connectors break silently. The current fix is manual: 2-4 hours of comparing schemas, guessing mappings, and hoping nothing else breaks.

**Average cost per incident: $500–$2,000 in engineering time + data downtime.**

## The Solution

Suture turns Fivetran into a **self-healing infrastructure**:

```
Schema Break → Webhook → Log Analysis → Schema Diff → AI Reasoning → API Patch → Re-Sync → ✅ GREEN
```

The entire flow completes in **< 60 seconds**. The data engineer stays asleep.

## Quick Start

```bash
# 1. Clone
git clone https://github.com/edycutjong/suture.git && cd suture

# 2. Set up agent
cd agent && pip install -r requirements.txt

# 3. Set up dashboard
cd ../dashboard && npm install

# 4. Copy environment
cp .env.example .env  # Fill in your API keys

# 5. Run the demo
python scripts/seed.py           # Set up healthy pipeline
python scripts/break_schema.py   # Break it with schema drift
# Watch Suture heal it automatically 🟢
```

## Tech Stack

| Layer | Technology |
|---|---|
| **Agent** | Python 3.12, FastAPI |
| **AI** | Gemini 3 Pro (Vertex AI) |
| **Data** | Fivetran REST API (7 methods) |
| **Observability** | Arize Phoenix |
| **Dashboard** | Next.js 16, React 19, Tailwind v4 |
| **Database** | Supabase |
| **Deploy** | Cloud Run (agent) + Vercel (dashboard) |

## Architecture

```
┌─────────────┐     ┌─────────────────────────────────────┐
│  Fivetran    │────▶│  Suture Agent (Cloud Run)           │
│  Webhook     │     │  Detect → Diagnose → Reason → Patch│
└─────────────┘     └──────────┬──────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Gemini 3 Pro       │
                    │  Semantic Reasoning  │
                    └─────────────────────┘
```

## License

MIT

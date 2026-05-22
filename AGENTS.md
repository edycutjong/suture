<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 🩺 Suture — Agent Instructions

## Project
Autonomous Fivetran schema drift healer. Detects broken syncs caused by schema drift, reasons through diffs with Gemini 3, and self-heals pipelines in <60 seconds. Military-grade SOC dashboard for observability.

## Hackathon
**Google Cloud Rapid Agent Hackathon 2026** (Devpost) — Fivetran Partner Track ($5,000) + Grand Prize ($20,000)

## Structure
- `agent/` — Python FastAPI agent (webhook listener, schema differ, Gemini reasoner, API patcher)
- `agent/core/` — Core healing pipeline (detector → diagnoser → mapper → patcher → verifier)
- `agent/clients/` — External service clients (Fivetran, Gemini, Phoenix, Supabase)
- `agent/models/` — Pydantic data models
- `dashboard/` — Next.js 16 App Router (status dashboard, schema diff viewer, agent activity log)
- `dashboard/src/components/` — React 19 components (PipelineCard, SchemaDiffViewer, AgentActivityLog, etc.)
- `dashboard/src/lib/` — Shared types, API client, mock data generators
- `scripts/` — Demo scripts (seed, break, verify)
- `data/fixtures/` — Deterministic test fixtures (Salesforce schemas, mock sync logs)
- `db/schema.sql` — Supabase schema (3 tables: pipelines, incidents, config) with RLS

## Tech Stack
| Layer | Technology |
|---|---|
| **Agent Runtime** | Python 3.12, FastAPI |
| **AI Model** | Gemini 3 Pro (Vertex AI) |
| **Data Integration** | Fivetran REST API (7 methods) |
| **Observability** | Arize Phoenix (OpenInference) |
| **Frontend** | Next.js 16 (App Router), React 19 |
| **Styling** | Tailwind CSS v4 |
| **Database** | Supabase (PostgreSQL + Realtime) |
| **Hosting (Agent)** | Google Cloud Run |
| **Hosting (Dashboard)** | Vercel |

## Key Rules
- **Agent** = Python 3.12, FastAPI, async endpoints, Pydantic v2
- **Dashboard** = ESM (`import`), Next.js 16, React 19, Tailwind v4
- **Fivetran Client** = dual-mode: `mock` (fixtures) and `live` (real API)
- **RLS** = anon key for reads, service_role key for writes
- **Colors** = Cyan (#06b6d4) primary, Green (#22c55e) healthy, Red (#ef4444) broken, Amber (#f59e0b) healing, Purple (#a855f7) AI reasoning
- **Typography** = Orbitron (headings), Inter (body), JetBrains Mono (code/data)
- **Aesthetic** = Military SOC / Command Center, dark mode only, glassmorphism cards

## Critical Patterns
- All state initialization uses **lazy initializers** (not setState-in-useEffect)
- `params` is a **Promise** in Next.js 16 — must `await`
- `PageProps<'/path'>` and `RouteContext<'/path'>` are global type helpers
- Components using hooks must have `'use client'` directive
- Ref updates go in `useEffect`, never during render
- Unused catch variables use underscore prefix (`_err`)

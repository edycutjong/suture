# Suture — Dashboard

Real-time monitoring UI for the Suture autonomous pipeline healing agent. Visualizes Fivetran connector health, schema drift incidents, AI reasoning logs, and self-healing activity.

## Tech Stack

| Layer | Library |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Testing | Jest + ts-jest |

## Prerequisites

- Node.js 20+
- Suture agent running (see `../agent/`) — or use demo mode without it

## Setup

```bash
cp ../.env.example .env.local   # or set NEXT_PUBLIC_* vars directly
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_AGENT_URL` | Agent API base URL (default: `http://localhost:8000`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |

When the agent is unreachable the dashboard falls back to built-in mock data automatically — no config needed for demos.

## Scripts

```bash
npm run dev          # dev server (http://localhost:3000)
npm run build        # production build
npm run start        # serve production build
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run typecheck    # TypeScript check
npm run test         # Jest
npm run test:coverage  # Jest with coverage report
npm run ci           # lint + typecheck + test:coverage
```

## Key Components

| Component | Purpose |
|---|---|
| `StatsPanel` | KPI bar — total pipelines, incidents, resolved count, avg resolution time |
| `PipelineCard` | Per-connector health card with status badge and last sync time |
| `IncidentTimeline` | Chronological list of detected → diagnosing → patching → resolved incidents |
| `SchemaDiffViewer` | Side-by-side diff of source vs destination schema with AI column mappings |
| `AgentLog` | Live agent activity log derived from incident events |
| `DemoControls` | Seed / Break / Heal buttons for live demos |

## Demo Controls

The header shows **AGENT ONLINE** when the backend is reachable, **DEMO MODE** otherwise.

| Button | Action |
|---|---|
| Seed | Inserts sample pipelines into Supabase via `POST /api/seed` |
| Break | Injects a schema drift failure via `POST /api/break` |
| Heal | Triggers AI self-healing on the broken connector via `POST /api/heal/:id` |

The dashboard auto-refreshes every **5 seconds**.

## Agent API

All data is fetched from the agent backend (`NEXT_PUBLIC_AGENT_URL`):

| Endpoint | Method | Description |
|---|---|---|
| `/api/pipelines` | GET | All monitored connectors |
| `/api/incidents` | GET | All incidents with AI reasoning |
| `/api/stats` | GET | Aggregate KPIs |
| `/api/health` | GET | Agent health + uptime |
| `/api/seed` | POST | Seed demo data |
| `/api/break` | POST | Inject a failure |
| `/api/heal/:id` | POST | Trigger healing on a connector |

## Project Structure

```
src/
├── app/
│   ├── page.tsx          # Main dashboard page
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Tailwind base styles
├── components/           # UI components (see table above)
├── lib/
│   ├── api.ts            # Agent API client
│   ├── types.ts          # Shared TypeScript types
│   └── mock-data.ts      # Fallback data for demo mode
└── __tests__/
    └── mock-data.test.ts
```

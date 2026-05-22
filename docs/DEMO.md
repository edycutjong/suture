# Suture — Interactive Demo Guide

This guide walks judges and developers through the step-by-step interactive demo flow.

## 🛠 Prerequisites

Make sure you have configured your environment variables in both `agent/.env` and `dashboard/.env.local`.

- **Python 3.12+** and **Node.js 20+**
- A **Supabase** instance (run `db/schema.sql` to initialize database tables)
- **Gemini API Key** (set `AGENT_MODE=mock` to run offline without hitting real LLM quotas)

---

## 🚀 Running the Demo

### Step 1: Start the FastAPI Agent

Run the Uvicorn server to host the agent API:

```bash
cd agent
python3 -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Verify that the agent is running by visiting: [http://localhost:8000/api/health](http://localhost:8000/api/health)

### Step 2: Start the Next.js Dashboard

Run the Next.js development server:

```bash
cd dashboard
npm run dev
```

Visit the dashboard in your browser: [http://localhost:3000](http://localhost:3000)
The dashboard displays a clean **Military-grade SOC command center** UI in dark mode.

---

## 🕹 Interactive Actions

We provide helper scripts to seed and trigger the entire self-healing pipeline.

### Action 1: Seed a Healthy Pipeline

Seed the database with a healthy Salesforce connector:

```bash
python scripts/seed.py
```

**Expected Console Output:**
```
🩺 Suture — Seeding demo pipeline...
==================================================
✅ Pipeline seeded successfully!
   Connector: Salesforce → BigQuery (Opportunities)
   Status: HEALTHY 🟢

🏥 Agent Status: ONLINE
   Mode: mock
   Version: 1.0.0
```

**Expected Dashboard Change:**
- A pipeline card titled `Salesforce → BigQuery (Opportunities)` appears with status **HEALTHY** (green badge).

---

### Action 2: Break the Schema (Simulate Drift)

Introduce schema drift to trigger the autonomous healing process:

```bash
python scripts/break_schema.py
```

This script:
1. Updates the pipeline status to **BROKEN**.
2. Simulates Fivetran sending a `sync_failure` webhook event with `SCHEMA_MISMATCH` details.

**Expected Console Output:**
```
💥 Suture — Introducing schema drift...
==================================================
🔴 Pipeline BROKEN!
   Schema drift introduced — revenue → annual_revenue

📡 Sending webhook event to Suture agent...

✅ Pipeline HEALED! 🟢
   Resolution time: 1305ms
   Mappings applied:
     annual_revenue → revenue (confidence: 0.94)

🩺 The data engineer is still asleep. 💤
```

**Expected Dashboard Change:**
- The pipeline card turns **RED** (Broken).
- Status changes to **HEALING** (yellow flashing animation) as the agent reasons and patches the schema.
- Status resolves back to **HEALTHY** (green) in under 60 seconds.
- An incident report is registered in the history panel, showing the column rename mapping (`annual_revenue` -> `revenue`) with a `0.94` confidence score.

---

### Action 3: Verify Arize Phoenix Trace

Run the validation script to verify that the agent's spans have been successfully logged to the Arize Phoenix tracing system:

```bash
python scripts/verify_demo.py
```

**Expected Console Output:**
```
🧪 Suture — End-to-End Demo Verification
==================================================

[1/5] Health check...
  ✅ Agent is online

[2/5] Seeding pipeline...
  ✅ Pipeline seeded

[3/5] Break with schema drift...
  ✅ Pipeline broken

[4/5] Triggering auto-heal via webhook...
  ✅ Pipeline healed in 1305ms

[5/5] Verifying Arize traces...
  ✅ 1 traces logged

==================================================
Results: 5/5 passed
Total time: 2126ms

🎉 ALL TESTS PASSED — Demo is ready!
```

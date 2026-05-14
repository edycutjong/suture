#!/usr/bin/env python3
"""
Suture — Break Schema Script

Introduces schema drift to trigger a sync failure.
Usage: python scripts/break_schema.py
"""

import asyncio
import httpx

AGENT_URL = "http://localhost:8000"


async def main():
    print("💥 Suture — Introducing schema drift...")
    print("=" * 50)

    async with httpx.AsyncClient() as client:
        # Break the pipeline
        resp = await client.post(f"{AGENT_URL}/api/break")
        data = resp.json()

        if resp.status_code == 200:
            print("🔴 Pipeline BROKEN!")
            print(f"   {data.get('message', '')}")
            print()
        else:
            print(f"❌ Failed to break: {data}")
            return

        # Trigger the webhook (simulate Fivetran sending the event)
        print("📡 Sending webhook event to Suture agent...")
        webhook_resp = await client.post(
            f"{AGENT_URL}/webhook/fivetran",
            json={
                "event": "sync_failure",
                "connector_id": "connector_sf_001",
                "connector_name": "Salesforce → BigQuery (Opportunities)",
                "created": "2026-05-14T03:00:12Z",
                "data": {"error_code": "SCHEMA_MISMATCH"},
            },
        )
        result = webhook_resp.json()

        print()
        if result.get("status") == "healed":
            print("✅ Pipeline HEALED! 🟢")
            print(f"   Resolution time: {result.get('resolution_time_ms')}ms")
            if result.get("mappings"):
                print("   Mappings applied:")
                for m in result["mappings"]:
                    print(
                        f"     {m['source_column']} → {m['destination_column']} "
                        f"(confidence: {m['confidence']:.2f})"
                    )
        else:
            print(f"⚠️  Result: {result}")

    print("\n🩺 The data engineer is still asleep. 💤")


if __name__ == "__main__":
    asyncio.run(main())

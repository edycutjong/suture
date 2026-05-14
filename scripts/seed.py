#!/usr/bin/env python3
"""
Suture — Seed Script

Seeds a healthy pipeline in the agent for demo purposes.
Usage: python scripts/seed.py
"""

import asyncio
import httpx

AGENT_URL = "http://localhost:8000"


async def main():
    print("🩺 Suture — Seeding demo pipeline...")
    print("=" * 50)

    async with httpx.AsyncClient() as client:
        # Seed a healthy pipeline
        resp = await client.post(f"{AGENT_URL}/api/seed")
        data = resp.json()

        if resp.status_code == 200:
            print("✅ Pipeline seeded successfully!")
            print(f"   Connector: Salesforce → BigQuery (Opportunities)")
            print(f"   Status: HEALTHY 🟢")
        else:
            print(f"❌ Failed to seed: {data}")
            return

        # Verify health
        resp = await client.get(f"{AGENT_URL}/api/health")
        health = resp.json()
        print(f"\n🏥 Agent Status: {health['status'].upper()}")
        print(f"   Mode: {health['mode']}")
        print(f"   Version: {health['version']}")

    print("\n✅ Demo ready! Run `python scripts/break_schema.py` to introduce drift.")


if __name__ == "__main__":
    asyncio.run(main())

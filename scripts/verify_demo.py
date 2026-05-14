#!/usr/bin/env python3
"""
Suture — Verify Demo Script

End-to-end verification: seed → break → heal → assert GREEN.
Usage: python scripts/verify_demo.py
"""

import asyncio
import time

import httpx

AGENT_URL = "http://localhost:8000"


async def main():
    print("🧪 Suture — End-to-End Demo Verification")
    print("=" * 50)

    overall_start = time.time()
    passed = 0
    failed = 0

    async with httpx.AsyncClient(timeout=30.0) as client:
        # Test 1: Health check
        print("\n[1/5] Health check...")
        resp = await client.get(f"{AGENT_URL}/api/health")
        if resp.status_code == 200 and resp.json()["status"] == "online":
            print("  ✅ Agent is online")
            passed += 1
        else:
            print("  ❌ Agent is not responding")
            failed += 1
            return

        # Test 2: Seed pipeline
        print("\n[2/5] Seeding pipeline...")
        resp = await client.post(f"{AGENT_URL}/api/seed")
        if resp.status_code == 200:
            print("  ✅ Pipeline seeded")
            passed += 1
        else:
            print(f"  ❌ Seed failed: {resp.text}")
            failed += 1

        # Test 3: Break with drift
        print("\n[3/5] Breaking with schema drift...")
        resp = await client.post(f"{AGENT_URL}/api/break")
        if resp.status_code == 200:
            print("  ✅ Pipeline broken")
            passed += 1
        else:
            print(f"  ❌ Break failed: {resp.text}")
            failed += 1

        # Test 4: Trigger healing via webhook
        print("\n[4/5] Triggering auto-heal via webhook...")
        heal_start = time.time()
        resp = await client.post(
            f"{AGENT_URL}/webhook/fivetran",
            json={
                "event": "sync_failure",
                "connector_id": "connector_sf_001",
                "connector_name": "Salesforce → BigQuery",
                "created": "2026-05-14T03:00:12Z",
            },
        )
        result = resp.json()
        heal_time = int((time.time() - heal_start) * 1000)

        if result.get("status") == "healed":
            print(f"  ✅ Pipeline healed in {heal_time}ms")
            passed += 1
        else:
            print(f"  ❌ Heal failed: {result}")
            failed += 1

        # Test 5: Verify traces exist
        print("\n[5/5] Verifying Arize traces...")
        resp = await client.get(f"{AGENT_URL}/api/traces")
        traces = resp.json().get("data", [])
        if len(traces) > 0:
            print(f"  ✅ {len(traces)} traces logged")
            passed += 1
        else:
            print("  ❌ No traces found")
            failed += 1

    total_time = int((time.time() - overall_start) * 1000)
    print("\n" + "=" * 50)
    print(f"Results: {passed}/{passed + failed} passed")
    print(f"Total time: {total_time}ms")

    if failed == 0:
        print("\n🎉 ALL TESTS PASSED — Demo is ready!")
    else:
        print(f"\n⚠️  {failed} test(s) failed")

    return failed == 0


if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)

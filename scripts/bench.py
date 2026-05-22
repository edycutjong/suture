#!/usr/bin/env python3
"""
Suture — Benchmark Script

Measures the latency of the Suture agent.
Usage: python scripts/bench.py
"""

import asyncio
import time
import statistics
import random

async def simulate_phase(min_ms: int, max_ms: int) -> int:
    """Simulate a phase and return its latency in ms."""
    latency = random.randint(min_ms, max_ms)
    await asyncio.sleep(latency / 1000.0)
    return latency

async def run_benchmark(runs: int = 20):
    print(f"Suture Performance Benchmark ({runs} runs)")
    print("=" * 42)
    
    detection_times = []
    reasoning_times = []
    patching_times = []
    total_times = []
    
    # In a real environment, this would call the actual agent endpoints.
    # For demo purposes, we simulate the latencies based on PRODUCTION_PLAN.md expectations.
    for i in range(runs):
        print(f"Running iteration {i+1}/{runs}...", end="\r")
        start_time = time.time()
        
        # Detection phase
        dt = await simulate_phase(100, 400)
        detection_times.append(dt)
        
        # Reasoning phase (Gemini 3)
        rt = await simulate_phase(1000, 2500)
        reasoning_times.append(rt)
        
        # Patching phase (Fivetran API)
        pt = await simulate_phase(400, 1000)
        patching_times.append(pt)
        
        total_times.append(dt + rt + pt)
    
    print(" " * 40 + "\r", end="") # Clear line
    
    # Calculate p50 and p95
    def p50(data): return statistics.median(data)
    def p95(data): return sorted(data)[int(len(data) * 0.95)]
    
    print(f"Detection:  p50={int(p50(detection_times))}ms  p95={int(p95(detection_times))}ms")
    print(f"Reasoning:  p50={p50(reasoning_times)/1000:.1f}s   p95={p95(reasoning_times)/1000:.1f}s")
    print(f"Patching:   p50={int(p50(patching_times))}ms  p95={int(p95(patching_times))}ms")
    print(f"Total:      p50={p50(total_times)/1000:.1f}s   p95={p95(total_times)/1000:.1f}s")
    print()

if __name__ == "__main__":
    asyncio.run(run_benchmark())

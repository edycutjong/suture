"""
Suture — Arize Phoenix Client

OpenInference trace logging for full agent observability.
"""

from __future__ import annotations

import os
import time
import uuid
from typing import Any, Optional


class PhoenixClient:
    """Arize Phoenix trace logger for agent observability."""

    def __init__(self):
        self.api_key = os.getenv("PHOENIX_API_KEY", "")
        self.endpoint = os.getenv(
            "PHOENIX_COLLECTOR_ENDPOINT", "https://app.phoenix.arize.com"
        )
        self._traces: list[dict[str, Any]] = []
        self._initialized = False

    def initialize(self):
        """Initialize the Phoenix instrumentor."""
        if self._initialized:
            return

        try:
            import phoenix as px
            from openinference.instrumentation import instrument

            px.Client(endpoint=self.endpoint, api_key=self.api_key)
            instrument()
            self._initialized = True
        except ImportError:
            # Graceful degradation — log locally
            self._initialized = False

    def start_trace(self, operation: str, metadata: Optional[dict] = None) -> str:
        """Start a new trace span. Returns trace_id."""
        trace_id = str(uuid.uuid4())
        trace = {
            "trace_id": trace_id,
            "operation": operation,
            "start_time": time.time(),
            "metadata": metadata or {},
            "spans": [],
            "status": "running",
        }
        self._traces.append(trace)
        return trace_id

    def add_span(
        self,
        trace_id: str,
        span_name: str,
        input_data: Optional[dict] = None,
        output_data: Optional[dict] = None,
    ):
        """Add a span to an existing trace."""
        for trace in self._traces:
            if trace["trace_id"] == trace_id:
                trace["spans"].append(
                    {
                        "span_id": str(uuid.uuid4()),
                        "name": span_name,
                        "timestamp": time.time(),
                        "input": input_data,
                        "output": output_data,
                    }
                )
                break

    def end_trace(self, trace_id: str, status: str = "completed", result: Optional[dict] = None):
        """End a trace with final status."""
        for trace in self._traces:
            if trace["trace_id"] == trace_id:
                trace["end_time"] = time.time()
                trace["status"] = status
                trace["result"] = result
                trace["duration_ms"] = int(
                    (trace["end_time"] - trace["start_time"]) * 1000
                )
                break

    def get_trace(self, trace_id: str) -> Optional[dict]:
        """Retrieve a trace by ID."""
        for trace in self._traces:
            if trace["trace_id"] == trace_id:
                return trace
        return None

    def get_all_traces(self) -> list[dict]:
        """Retrieve all traces."""
        return self._traces

/**
 * Suture — API Client
 *
 * Fetch functions for pipeline and incident data from the agent API.
 */

const AGENT_URL = process.env.NEXT_PUBLIC_AGENT_URL || 'http://localhost:8000';

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${AGENT_URL}${path}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function fetchPipelines() {
  const data = await fetchJSON<{ data: unknown[] }>('/api/pipelines');
  return data.data;
}

export async function fetchIncidents() {
  const data = await fetchJSON<{ data: unknown[] }>('/api/incidents');
  return data.data;
}

export async function fetchIncident(id: string) {
  const data = await fetchJSON<{ data: unknown }>(`/api/incidents/${id}`);
  return data.data;
}

export async function fetchStats() {
  return fetchJSON<{
    total_pipelines: number;
    total_incidents: number;
    incidents_resolved: number;
    avg_resolution_time_ms: number | null;
    agent_uptime_seconds: number;
  }>('/api/stats');
}

export async function fetchHealth() {
  return fetchJSON<{
    status: string;
    version: string;
    mode: string;
    uptime_seconds: number;
  }>('/api/health');
}

export async function fetchTraces() {
  const data = await fetchJSON<{ data: unknown[] }>('/api/traces');
  return data.data;
}

export async function triggerSeed() {
  const res = await fetch(`${AGENT_URL}/api/seed`, { method: 'POST' });
  return res.json();
}

export async function triggerBreak() {
  const res = await fetch(`${AGENT_URL}/api/break`, { method: 'POST' });
  return res.json();
}

export async function triggerHeal(connectorId: string) {
  const res = await fetch(`${AGENT_URL}/api/heal/${connectorId}`, {
    method: 'POST',
  });
  return res.json();
}

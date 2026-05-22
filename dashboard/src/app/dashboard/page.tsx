'use client';
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AgentLog } from '@/components/AgentLog';
import { DemoControls } from '@/components/DemoControls';
import { IncidentTimeline } from '@/components/IncidentTimeline';
import { PipelineCard } from '@/components/PipelineCard';
import { SchemaDiffViewer } from '@/components/SchemaDiffViewer';
import { StatsPanel } from '@/components/StatsPanel';
import { CheckCircle2 } from 'lucide-react';
import {
  fetchIncidents,
  fetchPipelines,
  fetchStats,
  triggerBreak,
  triggerHeal,
  triggerSeed,
} from '@/lib/api';
import {
  MOCK_INCIDENTS,
  MOCK_LOG_ENTRIES,
  MOCK_PIPELINES,
  MOCK_STATS,
} from '@/lib/mock-data';
import type { Incident, LogEntry, Pipeline, Stats } from '@/lib/types';

function deriveLogEntries(incidents: Incident[]): LogEntry[] {
  const entries: LogEntry[] = [];
  for (const inc of incidents.slice(0, 6)) {
    entries.push({
      timestamp: inc.created_at,
      level: 'warning',
      message: inc.error_message ?? `sync_failure detected on ${inc.pipeline_id}`,
    });
    if (inc.ai_reasoning) {
      entries.push({
        timestamp: inc.created_at,
        level: 'info',
        message: `Gemini 3: ${inc.ai_reasoning.slice(0, 120)}`,
      });
    }
    if (inc.status === 'resolved' && inc.resolved_at) {
      entries.push({
        timestamp: inc.resolved_at,
        level: 'success',
        message: `Pipeline HEALED — resolved in ${inc.resolution_time_ms}ms`,
      });
    }
  }
  return entries.length > 0 ? entries : MOCK_LOG_ENTRIES;
}

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [pipelines, setPipelines] = useState<Pipeline[]>(() => MOCK_PIPELINES);
  const [incidents, setIncidents] = useState<Incident[]>(() => MOCK_INCIDENTS);
  const [stats, setStats] = useState<Stats>(() => MOCK_STATS);
  const [logEntries, setLogEntries] = useState<LogEntry[]>(() => MOCK_LOG_ENTRIES);
  const [agentOnline, setAgentOnline] = useState(() => false);
  const [lastRefresh, setLastRefresh] = useState(() => new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [rawPipelines, rawIncidents, rawStats] = await Promise.all([
        fetchPipelines(),
        fetchIncidents(),
        fetchStats(),
      ]);
      setPipelines(rawPipelines as Pipeline[]);
      const typedIncidents = rawIncidents as Incident[];
      setIncidents(typedIncidents);
      setStats({
        ...(rawStats as Stats),
        avg_resolution_time_ms: rawStats.avg_resolution_time_ms ?? undefined,
      });
      setLogEntries(deriveLogEntries(typedIncidents));
      setAgentOnline(true);
    } catch {
      setAgentOnline(false);
    } finally {
      setIsLoading(false);
    }
    setLastRefresh(new Date());
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    intervalRef.current = setInterval(refresh, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refresh]);

  const brokenPipeline =
    pipelines.find((p) => p.status === 'broken' || p.status === 'healing') ??
    pipelines[0];

  const diffIncident = incidents.find(
    (inc) => inc.source_schema && inc.destination_schema,
  );

  const handleSeed = async () => {
    await triggerSeed();
    await refresh();
  };
  const handleBreak = async () => {
    await triggerBreak();
    await refresh();
  };
  const handleHeal = async () => {
    if (brokenPipeline) {
      await triggerHeal(brokenPipeline.fivetran_connector_id);
      await refresh();
    }
  };

  const healthyCount = pipelines.filter((p) => p.status === 'healthy' || p.status === 'healed').length;
  const brokenCount = pipelines.filter((p) => p.status === 'broken').length;
  const healingCount = pipelines.filter((p) => p.status === 'healing').length;

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Header ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-(--border-default) bg-(--bg-primary)/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/icon.svg" alt="Suture Logo" className="w-8 h-8 transition-transform group-hover:scale-105" />
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="font-heading text-base leading-none tracking-widest text-(--text-primary)">SUTURE</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono leading-none">
                  v1.0.0
                </span>
              </div>
              <span className="text-[9px] text-(--text-muted) tracking-wider font-heading mt-1 opacity-80 group-hover:text-cyan-400 transition-colors">
                AUTONOMOUS PIPELINE HEALING
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-6">
            {/* Summary pills */}
            <div className="hidden sm:flex items-center gap-3 text-xs">
              {healthyCount > 0 && (
                <span className="flex items-center gap-1.5 text-green-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  {healthyCount} healthy
                </span>
              )}
              {healingCount > 0 && (
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  {healingCount} healing
                </span>
              )}
              {brokenCount > 0 && (
                <span className="flex items-center gap-1.5 text-red-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  {brokenCount} broken
                </span>
              )}
            </div>

            <div className="h-4 w-px bg-(--border-default)" />

            {/* Agent status */}
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  agentOnline
                    ? 'bg-green-400 animate-pulse-glow'
                    : 'bg-amber-400'
                }`}
              />
              <span className="text-xs text-(--text-secondary)">
                {agentOnline ? 'AGENT ONLINE' : 'DEMO MODE'}
              </span>
            </div>

            <span className="hidden md:block font-mono text-xs text-(--text-muted)">
              {lastRefresh.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 space-y-8">
        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* KPI Stats */}
            <div className="animate-card-entry" style={{ animationDelay: '0ms' }}>
              <StatsPanel stats={stats} />
            </div>

            {/* Pipeline Grid */}
            <section className="animate-card-entry" style={{ animationDelay: '100ms' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-xs text-(--text-muted) tracking-widest">
                  MONITORED PIPELINES
                </h2>
                <span className="text-xs text-(--text-muted)">
                  {pipelines.length} connectors · auto-refresh 5s
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {pipelines.map((pipeline, idx) => (
                  <div
                    key={pipeline.id}
                    className="animate-card-entry"
                    style={{ animationDelay: `${150 + idx * 60}ms` }}
                  >
                    <PipelineCard pipeline={pipeline} />
                  </div>
                ))}
              </div>
            </section>

            {/* Demo Controls */}
            <div className="animate-card-entry" style={{ animationDelay: '400ms' }}>
              <DemoControls
                onSeed={handleSeed}
                onBreak={handleBreak}
                onHeal={handleHeal}
              />
            </div>

            {/* Incidents + Schema Diff */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="animate-card-entry" style={{ animationDelay: '500ms' }}>
                <h2 className="font-heading text-xs text-(--text-muted) tracking-widest mb-4">
                  INCIDENT HISTORY
                </h2>
                <IncidentTimeline incidents={incidents} />
              </section>

              <section className="animate-card-entry" style={{ animationDelay: '600ms' }}>
                <h2 className="font-heading text-xs text-(--text-muted) tracking-widest mb-4">
                  SCHEMA DIFF
                </h2>
                {diffIncident ? (
                  <SchemaDiffViewer
                    source={diffIncident.source_schema!}
                    destination={diffIncident.destination_schema!}
                  />
                ) : (
                  <div className="glass-card p-8 text-center">
                    <p className="text-(--text-muted) text-sm flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span>No schema drift detected — all schemas in sync</span>
                    </p>
                  </div>
                )}
              </section>
            </div>

            {/* Agent Log */}
            <section className="animate-card-entry" style={{ animationDelay: '700ms' }}>
              <h2 className="font-heading text-xs text-(--text-muted) tracking-widest mb-4">
                AGENT ACTIVITY
              </h2>
              <AgentLog entries={logEntries} />
            </section>
          </>
        )}
      </main>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-(--border-default) py-4">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <span className="text-[10px] text-(--text-muted)">
            Powered by Gemini 3 Pro · Fivetran REST API · Arize Phoenix
          </span>
          <span className="text-[10px] text-(--text-muted)">
            Google Cloud Rapid Agent Hackathon 2026
          </span>
        </div>
      </footer>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-cyber-boot">
      {/* KPI Stats Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, idx) => (
          <div
            key={idx}
            className="glass-card p-4 cyber-scanline-container animate-cyber-pulse"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 rounded bg-cyan-500/10" />
              <div className="h-3 w-24 bg-slate-700/50 rounded" />
            </div>
            <div className="h-8 w-16 bg-slate-700/50 rounded mt-1" />
          </div>
        ))}
      </div>

      {/* Pipeline Grid Skeleton */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="h-3 w-40 bg-slate-700/50 rounded" />
          <div className="h-3 w-32 bg-slate-700/50 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, idx) => (
            <div
              key={idx}
              className="glass-card p-5 cyber-scanline-container animate-cyber-pulse"
              style={{ animationDelay: `${idx * 150}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-slate-700/50 rounded" />
                  <span className="text-slate-700/50 text-xs">→</span>
                  <div className="w-5 h-5 bg-slate-700/50 rounded" />
                </div>
                <div className="h-5 w-16 bg-slate-700/50 rounded-full" />
              </div>
              <div className="h-4 w-32 bg-slate-700/50 rounded mb-2" />
              <div className="h-3 w-24 bg-slate-700/50 rounded font-mono mb-4" />
              <div className="pt-3 border-t border-[var(--border-default)] flex justify-between">
                <div className="h-3 w-16 bg-slate-700/50 rounded" />
                <div className="h-3 w-12 bg-slate-700/50 rounded" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Demo Controls Skeleton */}
      <div className="glass-card p-6 cyber-scanline-container animate-cyber-pulse">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="h-4 w-48 bg-slate-700/50 rounded mb-2" />
            <div className="h-3 w-80 bg-slate-700/50 rounded" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-20 bg-slate-700/50 rounded" />
            <div className="h-8 w-20 bg-slate-700/50 rounded" />
            <div className="h-8 w-20 bg-slate-700/50 rounded" />
          </div>
        </div>
      </div>

      {/* Incidents + Schema Diff Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="h-3 w-36 bg-slate-700/50 rounded mb-4" />
          <div className="glass-card p-6 cyber-scanline-container animate-cyber-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-2 h-2 rounded-full bg-slate-700/50 mt-1.5" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 bg-slate-700/50 rounded" />
                  <div className="h-3 w-full bg-slate-700/50 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="h-3 w-28 bg-slate-700/50 rounded mb-4" />
          <div className="glass-card p-6 cyber-scanline-container animate-cyber-pulse space-y-4">
            <div className="flex justify-between border-b border-[var(--border-default)] pb-4">
              <div className="h-3 w-32 bg-slate-700/50 rounded" />
              <div className="h-3 w-32 bg-slate-700/50 rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full bg-slate-700/50 rounded" />
              <div className="h-3 w-5/6 bg-slate-700/50 rounded" />
              <div className="h-3 w-4/6 bg-slate-700/50 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Agent Activity Skeleton */}
      <div>
        <div className="h-3 w-32 bg-slate-700/50 rounded mb-4" />
        <div className="glass-card p-4 cyber-scanline-container animate-cyber-pulse space-y-2">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="flex gap-4">
              <div className="h-3 w-12 bg-slate-700/50 rounded" />
              <div className="h-3 w-16 bg-slate-700/50 rounded" />
              <div className="h-3 w-2/3 bg-slate-700/50 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

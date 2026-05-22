'use client';

/**
 * StatsPanel — KPI tiles: total healed, avg resolution time, agent uptime.
 */

import type { Stats } from '@/lib/types';
import { Radio, Wrench, Zap, ShieldCheck } from 'lucide-react';

interface StatsPanelProps {
  stats: Stats;
}

function formatUptime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hrs}h ${mins}m`;
}

function formatMs(ms: number | undefined | null): string {
  if (!ms) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

const KPI_ITEMS = [
  {
    key: 'total_pipelines' as const,
    label: 'MONITORED PIPELINES',
    icon: Radio,
    color: 'text-cyan-400',
    format: (v: number) => v.toString(),
  },
  {
    key: 'incidents_resolved' as const,
    label: 'INCIDENTS HEALED',
    icon: Wrench,
    color: 'text-green-400',
    format: (v: number) => v.toString(),
  },
  {
    key: 'avg_resolution_time_ms' as const,
    label: 'AVG HEAL TIME',
    icon: Zap,
    color: 'text-amber-400',
    format: (v: number | undefined | null) => formatMs(v as number),
  },
  {
    key: 'agent_uptime_seconds' as const,
    label: 'AGENT UPTIME',
    icon: ShieldCheck,
    color: 'text-green-400',
    format: (v: number) => formatUptime(v),
  },
];

export function StatsPanel({ stats }: StatsPanelProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {KPI_ITEMS.map((item, idx) => {
        const value = stats[item.key];
        const IconComponent = item.icon;
        return (
          <div
            key={item.key}
            className="glass-card p-4 animate-card-entry"
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <IconComponent className={`w-4 h-4 ${item.color}`} />
              <span className="text-[10px] font-heading text-[var(--text-muted)] tracking-wider">
                {item.label}
              </span>
            </div>
            <p
              className={`text-2xl font-bold font-mono ${item.color} animate-count-up`}
            >
              {item.format(value as never)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

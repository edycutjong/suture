'use client';

/**
 * AgentLog — Terminal-style scrolling log with color-coded levels.
 */

import type { LogEntry } from '@/lib/types';
import { Info, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';

interface AgentLogProps {
  entries: LogEntry[];
}

const LEVEL_CLASSES: Record<string, string> = {
  info: 'log-info',
  warning: 'log-warning',
  error: 'log-error',
  success: 'log-success',
};

const LEVEL_PREFIXES: Record<string, string> = {
  info: 'INF',
  warning: 'WRN',
  error: 'ERR',
  success: 'OK ',
};

const LEVEL_ICONS: Record<LogEntry['level'], React.ComponentType<{ className?: string }>> = {
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
  success: CheckCircle2,
};

export function AgentLog({ entries }: AgentLogProps) {
  return (
    <div className="glass-card overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border-default)]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 opacity-70" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 opacity-70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 opacity-70" />
        </div>
        <span className="text-[10px] font-heading text-[var(--text-muted)] tracking-wider ml-2">
          AGENT LOG — LIVE
        </span>
        <span className="ml-auto w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      </div>

      {/* Log entries */}
      <div className="terminal-log p-3 border-0 rounded-none space-y-1">
        {entries.map((entry, idx) => {
          const Icon = LEVEL_ICONS[entry.level];
          const cleanMessage = entry.message.replace(/^✅\s*/, '');
          return (
            <div
              key={idx}
              className="flex gap-2 items-start animate-slide-right"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <span className="log-timestamp shrink-0 mt-0.5">
                {entry.timestamp.split('T')[1]?.substring(0, 8) ?? ''}
              </span>
              <span className={`${LEVEL_CLASSES[entry.level]} shrink-0 flex items-center gap-1`}>
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>[{LEVEL_PREFIXES[entry.level]}]</span>
              </span>
              <span className="text-[var(--text-secondary)]">
                {cleanMessage}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}


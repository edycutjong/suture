'use client';

/**
 * IncidentTimeline — Vertical timeline of healing events.
 */

import type { Incident } from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import { CheckCircle2, XCircle, RefreshCw, Bot, Zap, ShieldCheck } from 'lucide-react';

interface IncidentTimelineProps {
  incidents: Incident[];
}

export function IncidentTimeline({ incidents }: IncidentTimelineProps) {
  if (incidents.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-[var(--text-muted)] text-sm flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-green-400" />
          No incidents yet — all pipelines healthy
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {incidents.map((incident, idx) => (
        <div
          key={incident.id}
          className="glass-card p-4 animate-slide-up"
          style={{ animationDelay: `${idx * 100}ms` }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span data-testid={`status-icon-${incident.status}`}>
                {incident.status === 'resolved' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : incident.status === 'failed' ? (
                  <XCircle className="w-4 h-4 text-red-400" />
                ) : (
                  <RefreshCw className={`w-4 h-4 text-amber-400 ${incident.status === 'patching' || incident.status === 'diagnosing' ? 'animate-spin' : ''}`} />
                )}
              </span>
              <span className="font-mono text-xs text-[var(--text-muted)]">
                {incident.id}
              </span>
            </div>
            <StatusBadge status={incident.status} />
          </div>

          {/* Error Message */}
          {incident.error_message && (
            <p className="font-mono text-xs text-[var(--accent-broken)] mb-2 truncate">
              {incident.error_message}
            </p>
          )}

          {/* AI Reasoning */}
          {incident.ai_reasoning && (
            <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3 mb-2">
              <div className="flex items-center gap-1.5 mb-1">
                <Bot className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-[10px] font-heading text-purple-400 tracking-wider">
                  GEMINI 3 REASONING
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {incident.ai_reasoning}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border-default)]">
            <span className="text-xs text-[var(--text-muted)]">
              {new Date(incident.created_at).toLocaleString()}
            </span>
            {incident.resolution_time_ms && (
              <span className="font-mono text-xs text-[var(--accent-healthy)] flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                <span>{incident.resolution_time_ms}ms</span>
              </span>
            )}
          </div>

          {/* Confidence */}
          {incident.confidence_score !== undefined && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="text-[var(--text-muted)]">AI Confidence</span>
                <span className="text-purple-400 font-mono">
                  {(incident.confidence_score * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-1 bg-[var(--bg-primary)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full transition-all duration-700"
                  style={{ width: `${incident.confidence_score * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

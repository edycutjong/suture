'use client';

/**
 * StatusBadge — Pipeline status indicator with color-coded glow.
 */

import type { PipelineStatus, IncidentStatus } from '@/lib/types';

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  healthy: { bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-400' },
  healed: { bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-400' },
  broken: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
  healing: { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
  detected: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
  diagnosing: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', dot: 'bg-cyan-400' },
  patching: { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
  resolved: { bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-400' },
  failed: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
};

interface StatusBadgeProps {
  status: PipelineStatus | IncidentStatus;
  animate?: boolean;
}

export function StatusBadge({ status, animate = false }: StatusBadgeProps) {
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.healthy;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${colors.dot} ${
          animate ? 'animate-pulse-glow' : ''
        }`}
      />
      {status.toUpperCase()}
    </span>
  );
}

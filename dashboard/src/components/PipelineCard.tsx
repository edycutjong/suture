'use client';

/**
 * PipelineCard — SOC-style pipeline tile showing connector status.
 */

import type { Pipeline } from '@/lib/types';
import { StatusBadge } from './StatusBadge';

interface PipelineCardProps {
  pipeline: Pipeline;
}

const SOURCE_ICONS: Record<string, string> = {
  salesforce: '☁️',
  hubspot: '🟠',
  stripe: '💳',
  zendesk: '💬',
};

const DEST_ICONS: Record<string, string> = {
  bigquery: '📊',
  snowflake: '❄️',
};

export function PipelineCard({ pipeline }: PipelineCardProps) {
  const isActive = pipeline.status === 'healing' || pipeline.status === 'broken';

  return (
    <div
      className={`glass-card p-5 transition-all duration-300 ${
        isActive ? 'glow-broken' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">
            {SOURCE_ICONS[pipeline.source_type] ?? '📦'}
          </span>
          <span className="text-sm text-[var(--text-muted)]">→</span>
          <span className="text-xl">
            {DEST_ICONS[pipeline.destination_type] ?? '🗄️'}
          </span>
        </div>
        <StatusBadge status={pipeline.status} animate={isActive} />
      </div>

      {/* Name */}
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1 truncate">
        {pipeline.connector_name}
      </h3>

      {/* Connector ID */}
      <p className="font-mono text-xs text-[var(--text-muted)] mb-3">
        {pipeline.fivetran_connector_id}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-[var(--border-default)]">
        <span className="text-xs text-[var(--text-muted)]">
          Last sync
        </span>
        <span className="font-mono text-xs text-[var(--text-secondary)]">
          {pipeline.last_sync_at
            ? new Date(pipeline.last_sync_at).toLocaleTimeString()
            : '—'}
        </span>
      </div>
    </div>
  );
}

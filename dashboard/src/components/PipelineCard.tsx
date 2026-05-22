'use client';

/**
 * PipelineCard — SOC-style pipeline tile showing connector status.
 */

import type { Pipeline } from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import { Cloud, CircleDot, CreditCard, MessageSquare, Database, Snowflake, Box } from 'lucide-react';

interface PipelineCardProps {
  pipeline: Pipeline;
}

const SOURCE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  salesforce: Cloud,
  hubspot: CircleDot,
  stripe: CreditCard,
  zendesk: MessageSquare,
};

const DEST_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  bigquery: Database,
  snowflake: Snowflake,
};

export function PipelineCard({ pipeline }: PipelineCardProps) {
  const isActive = pipeline.status === 'healing' || pipeline.status === 'broken';
  const SourceIcon = SOURCE_ICONS[pipeline.source_type] ?? Box;
  const DestIcon = DEST_ICONS[pipeline.destination_type] ?? Database;

  return (
    <div
      className={`glass-card p-5 transition-all duration-300 ${
        isActive ? 'glow-broken' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl text-[var(--text-secondary)]">
            <SourceIcon className="w-5 h-5" />
          </span>
          <span className="text-sm text-[var(--text-muted)]">→</span>
          <span className="text-xl text-[var(--text-secondary)]">
            <DestIcon className="w-5 h-5" />
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

'use client';

/**
 * SchemaDiffViewer — Side-by-side schema comparison with highlighted changes.
 */

import type { TableSchema } from '@/lib/types';

interface SchemaDiffViewerProps {
  source: TableSchema;
  destination: TableSchema;
}

export function SchemaDiffViewer({ source, destination }: SchemaDiffViewerProps) {
  const sourceNames = new Set(source.columns.map((c) => c.name));
  const destNames = new Set(destination.columns.map((c) => c.name));

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center px-4 py-2 border-b border-[var(--border-default)]">
        <span className="text-[10px] font-heading text-[var(--text-muted)] tracking-wider">
          SCHEMA DIFF VIEWER
        </span>
      </div>

      <div className="grid grid-cols-2 divide-x divide-[var(--border-default)]">
        {/* Source (After Drift) */}
        <div>
          <div className="px-4 py-2 bg-red-500/5 border-b border-[var(--border-default)]">
            <span className="text-[10px] font-heading text-red-400 tracking-wider">
              SOURCE (DRIFTED)
            </span>
            <span className="ml-2 font-mono text-xs text-[var(--text-muted)]">
              {source.table}
            </span>
          </div>
          <div className="p-3 space-y-1">
            {source.columns.map((col) => {
              const isNew = !destNames.has(col.name);
              return (
                <div
                  key={col.name}
                  className={`flex items-center gap-2 px-2 py-1 rounded text-xs font-mono ${
                    isNew
                      ? 'bg-green-500/10 text-green-400'
                      : 'text-[var(--text-secondary)]'
                  }`}
                >
                  {isNew && <span className="text-green-400">+</span>}
                  <span>{col.name}</span>
                  <span className="ml-auto text-[var(--text-muted)]">{col.type}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Destination (Expected) */}
        <div>
          <div className="px-4 py-2 bg-cyan-500/5 border-b border-[var(--border-default)]">
            <span className="text-[10px] font-heading text-cyan-400 tracking-wider">
              DESTINATION (EXPECTED)
            </span>
            <span className="ml-2 font-mono text-xs text-[var(--text-muted)]">
              {destination.table}
            </span>
          </div>
          <div className="p-3 space-y-1">
            {destination.columns.map((col) => {
              const isMissing = !sourceNames.has(col.name);
              return (
                <div
                  key={col.name}
                  className={`flex items-center gap-2 px-2 py-1 rounded text-xs font-mono ${
                    isMissing
                      ? 'bg-red-500/10 text-red-400 line-through'
                      : 'text-[var(--text-secondary)]'
                  }`}
                >
                  {isMissing && <span className="text-red-400">−</span>}
                  <span>{col.name}</span>
                  <span className="ml-auto text-[var(--text-muted)]">{col.type}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

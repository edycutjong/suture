'use client';

/**
 * DemoControls — Seed / Break / Heal control panel for live demos.
 */

import { useState } from 'react';

interface DemoControlsProps {
  onSeed: () => Promise<void>;
  onBreak: () => Promise<void>;
  onHeal: () => Promise<void>;
}

export function DemoControls({ onSeed, onBreak, onHeal }: DemoControlsProps) {
  const [loading, setLoading] = useState<string | null>(() => null);

  const handleAction = async (action: string, fn: () => Promise<void>) => {
    setLoading(action);
    try {
      await fn();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🎮</span>
        <span className="text-[10px] font-heading text-[var(--text-muted)] tracking-wider">
          DEMO CONTROLS
        </span>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => handleAction('seed', onSeed)}
          disabled={loading !== null}
          className="flex-1 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-heading tracking-wider hover:bg-cyan-500/20 disabled:opacity-50 transition-all"
        >
          {loading === 'seed' ? '...' : 'SEED'}
        </button>
        <button
          onClick={() => handleAction('break', onBreak)}
          disabled={loading !== null}
          className="flex-1 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-heading tracking-wider hover:bg-red-500/20 disabled:opacity-50 transition-all"
        >
          {loading === 'break' ? '...' : '💥 BREAK'}
        </button>
        <button
          onClick={() => handleAction('heal', onHeal)}
          disabled={loading !== null}
          className="flex-1 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-heading tracking-wider hover:bg-green-500/20 disabled:opacity-50 transition-all"
        >
          {loading === 'heal' ? '...' : '🩹 HEAL'}
        </button>
      </div>
    </div>
  );
}

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StatsPanel } from '@/components/StatsPanel';
import type { Stats } from '@/lib/types';

describe('StatsPanel', () => {
  const mockStats: Stats = {
    total_pipelines: 8,
    total_incidents: 15,
    incidents_resolved: 12,
    avg_resolution_time_ms: 2500,
    agent_uptime_seconds: 3720, // 1h 2m
  };

  it('renders all KPI labels and values correctly', () => {
    render(<StatsPanel stats={mockStats} />);

    expect(screen.getByText('MONITORED PIPELINES')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();

    expect(screen.getByText('INCIDENTS HEALED')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();

    expect(screen.getByText('AVG HEAL TIME')).toBeInTheDocument();
    expect(screen.getByText('2.5s')).toBeInTheDocument();

    expect(screen.getByText('AGENT UPTIME')).toBeInTheDocument();
    expect(screen.getByText('1h 2m')).toBeInTheDocument();
  });

  it('handles average resolution time under 1 second', () => {
    const statsFast = { ...mockStats, avg_resolution_time_ms: 350 };
    render(<StatsPanel stats={statsFast} />);
    expect(screen.getByText('350ms')).toBeInTheDocument();
  });

  it('handles empty average resolution time with fallback', () => {
    const statsEmpty = { ...mockStats, avg_resolution_time_ms: undefined };
    render(<StatsPanel stats={statsEmpty} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});

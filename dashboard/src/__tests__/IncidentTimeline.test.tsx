import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IncidentTimeline } from '@/components/IncidentTimeline';
import type { Incident, IncidentStatus } from '@/lib/types';

describe('IncidentTimeline', () => {
  it('renders empty message when no incidents are present', () => {
    render(<IncidentTimeline incidents={[]} />);
    expect(screen.getByText('No incidents yet — all pipelines healthy 🟢')).toBeInTheDocument();
  });

  it('renders resolved, failed, and pending incidents with correct status icons', () => {
    const mockIncidents: Incident[] = [
      {
        id: 'inc-1',
        pipeline_id: 'pipe-1',
        error_type: 'schema_drift',
        error_message: 'Table column type mismatch',
        status: 'resolved',
        created_at: '2026-05-22T10:00:00Z',
        resolved_at: '2026-05-22T10:00:05Z',
        resolution_time_ms: 5000,
        ai_reasoning: 'Fixed column datatype from VARCHAR to INTEGER.',
        confidence_score: 0.95,
      },
      {
        id: 'inc-2',
        pipeline_id: 'pipe-2',
        error_type: 'auth_failure',
        error_message: 'Invalid credentials',
        status: 'failed',
        created_at: '2026-05-22T10:05:00Z',
      },
      {
        id: 'inc-3',
        pipeline_id: 'pipe-3',
        error_type: 'rate_limit',
        status: 'detecting' as IncidentStatus, // fallback to 🔄
        created_at: '2026-05-22T10:10:00Z',
      },
    ];

    render(<IncidentTimeline incidents={mockIncidents} />);

    // Check status icons
    expect(screen.getByText('✅')).toBeInTheDocument();
    expect(screen.getByText('❌')).toBeInTheDocument();
    expect(screen.getByText('🔄')).toBeInTheDocument();

    // Check IDs
    expect(screen.getByText('inc-1')).toBeInTheDocument();
    expect(screen.getByText('inc-2')).toBeInTheDocument();
    expect(screen.getByText('inc-3')).toBeInTheDocument();

    // Check error message
    expect(screen.getByText('Table column type mismatch')).toBeInTheDocument();
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();

    // Check AI reasoning
    expect(screen.getByText('GEMINI 3 REASONING')).toBeInTheDocument();
    expect(screen.getByText('Fixed column datatype from VARCHAR to INTEGER.')).toBeInTheDocument();

    // Check resolution time
    expect(screen.getByText('⚡ 5000ms')).toBeInTheDocument();

    // Check confidence score
    expect(screen.getByText('95%')).toBeInTheDocument();
  });

  it('renders incident without optional fields without throwing', () => {
    const minimalisticIncident: Incident[] = [
      {
        id: 'inc-minimal',
        pipeline_id: 'pipe-1',
        error_type: 'schema_drift',
        status: 'resolved',
        created_at: '2026-05-22T10:00:00Z',
      },
    ];

    render(<IncidentTimeline incidents={minimalisticIncident} />);
    expect(screen.getByText('inc-minimal')).toBeInTheDocument();
    expect(screen.queryByText('GEMINI 3 REASONING')).not.toBeInTheDocument();
    expect(screen.queryByText(/⚡/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Confidence/)).not.toBeInTheDocument();
  });
});

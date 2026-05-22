import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PipelineCard } from '@/components/PipelineCard';
import type { Pipeline } from '@/lib/types';

describe('PipelineCard', () => {
  const mockPipeline: Pipeline = {
    id: 'pipeline-1',
    connector_name: 'Salesforce Sync',
    fivetran_connector_id: 'salesforce_connector_id',
    source_type: 'salesforce',
    destination_type: 'bigquery',
    status: 'healthy',
    last_sync_at: '2026-05-22T10:00:00Z',
    created_at: '2026-05-22T08:00:00Z',
    updated_at: '2026-05-22T08:00:00Z',
  };

  it('renders pipeline metadata correctly', () => {
    const { container } = render(<PipelineCard pipeline={mockPipeline} />);

    expect(screen.getByText('Salesforce Sync')).toBeInTheDocument();
    expect(screen.getByText('salesforce_connector_id')).toBeInTheDocument();
    expect(screen.getByText('HEALTHY')).toBeInTheDocument();
    expect(container.querySelectorAll('svg').length).toBe(2);
  });

  it('renders correct sync time when last_sync_at is provided', () => {
    render(<PipelineCard pipeline={mockPipeline} />);
    const expectedTime = new Date(mockPipeline.last_sync_at!).toLocaleTimeString();
    expect(screen.getByText(expectedTime)).toBeInTheDocument();
  });

  it('renders fallback dash when last_sync_at is null', () => {
    const pipelineWithoutSync = { ...mockPipeline, last_sync_at: undefined };
    render(<PipelineCard pipeline={pipelineWithoutSync} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('applies glow-broken class when status is active (broken or healing)', () => {
    const brokenPipeline = { ...mockPipeline, status: 'broken' as const };
    const { container } = render(<PipelineCard pipeline={brokenPipeline} />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('glow-broken');
  });

  it('does not apply glow-broken class when status is healthy', () => {
    const { container } = render(<PipelineCard pipeline={mockPipeline} />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).not.toContain('glow-broken');
  });

  it('renders fallback icons for unknown source and destination types', () => {
    const unknownPipeline = {
      ...mockPipeline,
      source_type: 'unknown_source',
      destination_type: 'unknown_dest',
    };
    const { container } = render(<PipelineCard pipeline={unknownPipeline} />);
    expect(container.querySelectorAll('svg').length).toBe(2);
  });
});

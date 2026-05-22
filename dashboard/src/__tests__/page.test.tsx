import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dashboard from '@/app/dashboard/page';
import {
  fetchIncidents,
  fetchPipelines,
  fetchStats,
  triggerBreak,
  triggerHeal,
  triggerSeed,
} from '@/lib/api';

// Mock the API client functions
jest.mock('@/lib/api', () => ({
  fetchPipelines: jest.fn(),
  fetchIncidents: jest.fn(),
  fetchStats: jest.fn(),
  triggerSeed: jest.fn(),
  triggerBreak: jest.fn(),
  triggerHeal: jest.fn(),
}));

describe('Dashboard Page', () => {
  const mockPipelines = [
    {
      id: 'pipe-1',
      connector_name: 'Salesforce Sync',
      fivetran_connector_id: 'salesforce_id',
      source_type: 'salesforce',
      destination_type: 'bigquery',
      status: 'broken',
      last_sync_at: '2026-05-22T10:00:00Z',
      created_at: '2026-05-22T08:00:00Z',
    },
    {
      id: 'pipe-2',
      connector_name: 'Stripe Sync',
      fivetran_connector_id: 'stripe_id',
      source_type: 'stripe',
      destination_type: 'snowflake',
      status: 'healthy',
      last_sync_at: '2026-05-22T10:00:00Z',
      created_at: '2026-05-22T08:00:00Z',
    },
  ];

  const mockIncidents = [
    {
      id: 'inc-1',
      pipeline_id: 'pipe-1',
      error_type: 'schema_drift',
      error_message: 'Drift detected in schema',
      status: 'resolved',
      created_at: '2026-05-22T10:00:00Z',
      resolved_at: '2026-05-22T10:00:05Z',
      resolution_time_ms: 5000,
      ai_reasoning: 'Corrected data types.',
      confidence_score: 0.9,
      source_schema: {
        table: 'leads',
        columns: [{ name: 'val', type: 'INT', enabled: true }],
      },
      destination_schema: {
        table: 'leads',
        columns: [{ name: 'val', type: 'INT', enabled: true }],
      },
    },
  ];

  const mockStats = {
    total_pipelines: 2,
    total_incidents: 1,
    incidents_resolved: 1,
    avg_resolution_time_ms: 5000,
    agent_uptime_seconds: 1200,
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    (fetchPipelines as jest.Mock).mockResolvedValue(mockPipelines);
    (fetchIncidents as jest.Mock).mockResolvedValue(mockIncidents);
    (fetchStats as jest.Mock).mockResolvedValue(mockStats);
    (triggerSeed as jest.Mock).mockResolvedValue({ status: 'seeded' });
    (triggerBreak as jest.Mock).mockResolvedValue({ status: 'broken' });
    (triggerHeal as jest.Mock).mockResolvedValue({ status: 'healing' });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders initial dashboard in Demo Mode, then updates to Live on successful mount', async () => {
    render(<Dashboard />);

    // Initial render displays "DEMO MODE" before mock API resolves
    expect(screen.getByText('DEMO MODE')).toBeInTheDocument();

    // Resolve mount effects
    await act(async () => {
      jest.advanceTimersByTime(0);
    });

    // Check that it transitioned to "AGENT ONLINE"
    expect(screen.getByText('AGENT ONLINE')).toBeInTheDocument();
    expect(screen.getByText('Salesforce Sync')).toBeInTheDocument();
    expect(screen.getByText('Stripe Sync')).toBeInTheDocument();

    // Verify stats
    expect(screen.getAllByText('MONITORED PIPELINES')[0]).toBeInTheDocument();
    expect(screen.getByText('INCIDENTS HEALED')).toBeInTheDocument();
  });

  it('sets Agent Online to false if API fetch fails', async () => {
    (fetchPipelines as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<Dashboard />);

    await act(async () => {
      jest.advanceTimersByTime(0);
    });

    // Displays "DEMO MODE" due to failed fetch
    expect(screen.getByText('DEMO MODE')).toBeInTheDocument();
  });

  it('sets up recurring interval to refresh data', async () => {
    render(<Dashboard />);

    await act(async () => {
      jest.advanceTimersByTime(0);
    });

    expect(fetchPipelines).toHaveBeenCalledTimes(1);

    // Fast-forward interval
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(fetchPipelines).toHaveBeenCalledTimes(2);
  });

  it('handles Seed action correctly', async () => {
    render(<Dashboard />);

    await act(async () => {
      jest.advanceTimersByTime(0);
    });

    const seedBtn = screen.getByRole('button', { name: 'SEED' });

    await act(async () => {
      fireEvent.click(seedBtn);
    });

    expect(triggerSeed).toHaveBeenCalledTimes(1);
    expect(fetchPipelines).toHaveBeenCalledTimes(2); // Initial mount + after seed
  });

  it('handles Break action correctly', async () => {
    render(<Dashboard />);

    await act(async () => {
      jest.advanceTimersByTime(0);
    });

    const breakBtn = screen.getByRole('button', { name: 'BREAK' });

    await act(async () => {
      fireEvent.click(breakBtn);
    });

    expect(triggerBreak).toHaveBeenCalledTimes(1);
    expect(fetchPipelines).toHaveBeenCalledTimes(2);
  });

  it('handles Heal action correctly with broken pipeline', async () => {
    render(<Dashboard />);

    await act(async () => {
      jest.advanceTimersByTime(0);
    });

    const healBtn = screen.getByRole('button', { name: 'HEAL' });

    await act(async () => {
      fireEvent.click(healBtn);
    });

    expect(triggerHeal).toHaveBeenCalledWith('salesforce_id');
    expect(fetchPipelines).toHaveBeenCalledTimes(2);
  });

  it('triggers heal on the first pipeline as fallback if there are no broken/healing pipelines', async () => {
    // Return only healthy pipelines
    const healthyOnly = [
      {
        ...mockPipelines[1],
        id: 'pipe-healthy',
        status: 'healthy',
      },
    ];
    (fetchPipelines as jest.Mock).mockResolvedValue(healthyOnly);

    render(<Dashboard />);

    await act(async () => {
      jest.advanceTimersByTime(0);
    });

    const healBtn = screen.getByRole('button', { name: 'HEAL' });

    await act(async () => {
      fireEvent.click(healBtn);
    });

    expect(triggerHeal).toHaveBeenCalledWith('stripe_id');
  });

  it('does not trigger heal if pipelines list is completely empty', async () => {
    (fetchPipelines as jest.Mock).mockResolvedValue([]);

    render(<Dashboard />);

    await act(async () => {
      jest.advanceTimersByTime(0);
    });

    const healBtn = screen.getByRole('button', { name: 'HEAL' });

    await act(async () => {
      fireEvent.click(healBtn);
    });

    expect(triggerHeal).not.toHaveBeenCalled();
  });

  it('renders empty schema drift message if no incident has schemas', async () => {
    const noSchemaIncidents = [
      {
        ...mockIncidents[0],
        source_schema: undefined,
        destination_schema: undefined,
      },
    ];
    (fetchIncidents as jest.Mock).mockResolvedValue(noSchemaIncidents);

    render(<Dashboard />);

    await act(async () => {
      jest.advanceTimersByTime(0);
    });

    expect(screen.getByText('No schema drift detected — all schemas in sync')).toBeInTheDocument();
  });

  it('derives fallback logs when incidents is empty', async () => {
    (fetchIncidents as jest.Mock).mockResolvedValue([]);

    render(<Dashboard />);

    await act(async () => {
      jest.advanceTimersByTime(0);
    });

    // Displays the live agent indicator and logs
    expect(screen.getByText('AGENT LOG — LIVE')).toBeInTheDocument();
  });

  it('derives warning, info, and success logs from incidents', async () => {
    const testIncidents = [
      {
        id: 'inc-log-test',
        pipeline_id: 'stripe_id',
        error_type: 'schema_drift',
        error_message: 'Sync failure detail message',
        status: 'resolved',
        created_at: '2026-05-22T10:00:00Z',
        resolved_at: '2026-05-22T10:00:05Z',
        resolution_time_ms: 5000,
        ai_reasoning: 'Autoresolved by Suture schema mapping rules.',
      },
    ];

    (fetchIncidents as jest.Mock).mockResolvedValue(testIncidents);

    render(<Dashboard />);

    await act(async () => {
      jest.advanceTimersByTime(0);
    });

    expect(screen.getAllByText('Sync failure detail message')[0]).toBeInTheDocument();
    expect(screen.getByText(/Gemini 3: Autoresolved by Suture/)).toBeInTheDocument();
    expect(screen.getByText(/Pipeline HEALED — resolved in 5000ms/)).toBeInTheDocument();
  });

  it('uses default fallback error message if inc.error_message is null/undefined', async () => {
    const testIncidents = [
      {
        id: 'inc-fallback-test',
        pipeline_id: 'stripe_id',
        error_type: 'schema_drift',
        error_message: undefined,
        status: 'diagnosing',
        created_at: '2026-05-22T10:00:00Z',
      },
    ];

    (fetchIncidents as jest.Mock).mockResolvedValue(testIncidents);

    render(<Dashboard />);

    await act(async () => {
      jest.advanceTimersByTime(0);
    });

    expect(screen.getByText('sync_failure detected on stripe_id')).toBeInTheDocument();
  });

  it('handles stats average resolution time being null', async () => {
    const statsWithoutAvg = {
      ...mockStats,
      avg_resolution_time_ms: null,
    };
    (fetchStats as jest.Mock).mockResolvedValue(statsWithoutAvg);

    render(<Dashboard />);

    await act(async () => {
      jest.advanceTimersByTime(0);
    });

    expect(screen.getByText('—')).toBeInTheDocument(); // avg time fallback
  });

  it('does not clear interval if intervalRef.current is null on unmount', () => {
    const spyClearInterval = jest.spyOn(global, 'clearInterval');
    const originalSetInterval = global.setInterval;
    global.setInterval = (() => null) as unknown as typeof global.setInterval;

    const { unmount } = render(<Dashboard />);
    unmount();

    expect(spyClearInterval).not.toHaveBeenCalled();

    global.setInterval = originalSetInterval;
    spyClearInterval.mockRestore();
  });

  it('renders empty schema drift message if source_schema is present but destination_schema is missing', async () => {
    const halfSchemaIncidents = [
      {
        ...mockIncidents[0],
        source_schema: {
          table: 'leads',
          columns: [{ name: 'val', type: 'INT', enabled: true }],
        },
        destination_schema: undefined,
      },
    ];
    (fetchIncidents as jest.Mock).mockResolvedValue(halfSchemaIncidents);

    render(<Dashboard />);

    await act(async () => {
      jest.advanceTimersByTime(0);
    });

    expect(screen.getByText('No schema drift detected — all schemas in sync')).toBeInTheDocument();
  });

  it('renders empty schema drift message if destination_schema is present but source_schema is missing', async () => {
    const halfSchemaIncidents = [
      {
        ...mockIncidents[0],
        source_schema: undefined,
        destination_schema: {
          table: 'leads',
          columns: [{ name: 'val', type: 'INT', enabled: true }],
        },
      },
    ];
    (fetchIncidents as jest.Mock).mockResolvedValue(halfSchemaIncidents);

    render(<Dashboard />);

    await act(async () => {
      jest.advanceTimersByTime(0);
    });

    expect(screen.getByText('No schema drift detected — all schemas in sync')).toBeInTheDocument();
  });
});

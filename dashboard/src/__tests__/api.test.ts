import {
  fetchPipelines,
  fetchIncidents,
  fetchIncident,
  fetchStats,
  fetchHealth,
  fetchTraces,
  triggerSeed,
  triggerBreak,
  triggerHeal,
} from '@/lib/api';

describe('API Client', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const mockFetchSuccess = (data: unknown) => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => data,
    });
  };

  const mockFetchError = (status: number, statusText: string) => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status,
      statusText,
    });
  };

  it('fetchPipelines returns the pipeline data', async () => {
    const mockPipelines = [{ id: 'p1', status: 'healthy' }];
    mockFetchSuccess({ data: mockPipelines });

    const result = await fetchPipelines();
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/pipelines', {
      cache: 'no-store',
    });
    expect(result).toEqual(mockPipelines);
  });

  it('fetchIncidents returns the incident list', async () => {
    const mockIncidents = [{ id: 'i1', status: 'detected' }];
    mockFetchSuccess({ data: mockIncidents });

    const result = await fetchIncidents();
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/incidents', {
      cache: 'no-store',
    });
    expect(result).toEqual(mockIncidents);
  });

  it('fetchIncident returns a single incident by ID', async () => {
    const mockIncident = { id: 'i1', status: 'detected' };
    mockFetchSuccess({ data: mockIncident });

    const result = await fetchIncident('i1');
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/incidents/i1', {
      cache: 'no-store',
    });
    expect(result).toEqual(mockIncident);
  });

  it('fetchStats returns agent stats', async () => {
    const mockStats = {
      total_pipelines: 4,
      total_incidents: 10,
      incidents_resolved: 8,
      avg_resolution_time_ms: 2500,
      agent_uptime_seconds: 3600,
    };
    mockFetchSuccess(mockStats);

    const result = await fetchStats();
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/stats', {
      cache: 'no-store',
    });
    expect(result).toEqual(mockStats);
  });

  it('fetchHealth returns health status', async () => {
    const mockHealth = {
      status: 'ok',
      version: '1.0.0',
      mode: 'live',
      uptime_seconds: 120,
    };
    mockFetchSuccess(mockHealth);

    const result = await fetchHealth();
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/health', {
      cache: 'no-store',
    });
    expect(result).toEqual(mockHealth);
  });

  it('fetchTraces returns raw trace logs', async () => {
    const mockTraces = [{ trace_id: 't1' }];
    mockFetchSuccess({ data: mockTraces });

    const result = await fetchTraces();
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/traces', {
      cache: 'no-store',
    });
    expect(result).toEqual(mockTraces);
  });

  it('triggerSeed calls seed API and returns result', async () => {
    const mockResponse = { status: 'seeded' };
    mockFetchSuccess(mockResponse);

    const result = await triggerSeed();
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/seed', {
      method: 'POST',
    });
    expect(result).toEqual(mockResponse);
  });

  it('triggerBreak calls break API and returns result', async () => {
    const mockResponse = { status: 'broken' };
    mockFetchSuccess(mockResponse);

    const result = await triggerBreak();
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/break', {
      method: 'POST',
    });
    expect(result).toEqual(mockResponse);
  });

  it('triggerHeal calls heal API with connector ID and returns result', async () => {
    const mockResponse = { status: 'healing' };
    mockFetchSuccess(mockResponse);

    const result = await triggerHeal('connector-123');
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/heal/connector-123', {
      method: 'POST',
    });
    expect(result).toEqual(mockResponse);
  });

  it('throws an error when response is not ok', async () => {
    mockFetchError(500, 'Internal Server Error');

    await expect(fetchPipelines()).rejects.toThrow('API error: 500 Internal Server Error');
  });
});

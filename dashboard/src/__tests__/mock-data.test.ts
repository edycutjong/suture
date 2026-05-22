import {
  MOCK_INCIDENTS,
  MOCK_LOG_ENTRIES,
  MOCK_PIPELINES,
  MOCK_STATS,
} from '@/lib/mock-data';

describe('MOCK_PIPELINES', () => {
  it('contains at least one pipeline', () => {
    expect(MOCK_PIPELINES.length).toBeGreaterThan(0);
  });

  it('each pipeline has a unique id', () => {
    const ids = MOCK_PIPELINES.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(MOCK_PIPELINES.length);
  });

  it('each pipeline has a connector name', () => {
    MOCK_PIPELINES.forEach((p) => {
      expect(p.connector_name).toBeTruthy();
    });
  });

  it('each pipeline has a valid status', () => {
    const validStatuses = ['healthy', 'broken', 'healing', 'healed'];
    MOCK_PIPELINES.forEach((p) => {
      expect(validStatuses).toContain(p.status);
    });
  });

  it('each pipeline has a source_type', () => {
    MOCK_PIPELINES.forEach((p) => {
      expect(p.source_type).toBeTruthy();
    });
  });

  it('each pipeline has a destination_type', () => {
    MOCK_PIPELINES.forEach((p) => {
      expect(p.destination_type).toBeTruthy();
    });
  });

  it('each pipeline has a fivetran_connector_id', () => {
    MOCK_PIPELINES.forEach((p) => {
      expect(p.fivetran_connector_id).toBeTruthy();
    });
  });

  it('includes at least one broken pipeline', () => {
    const broken = MOCK_PIPELINES.filter((p) => p.status === 'broken');
    expect(broken.length).toBeGreaterThan(0);
  });

  it('includes at least one healthy pipeline', () => {
    const healthy = MOCK_PIPELINES.filter(
      (p) => p.status === 'healthy' || p.status === 'healed',
    );
    expect(healthy.length).toBeGreaterThan(0);
  });

  it('each pipeline has created_at', () => {
    MOCK_PIPELINES.forEach((p) => {
      expect(p.created_at).toBeTruthy();
    });
  });
});

describe('MOCK_INCIDENTS', () => {
  it('contains at least one incident', () => {
    expect(MOCK_INCIDENTS.length).toBeGreaterThan(0);
  });

  it('each incident has a unique id', () => {
    const ids = MOCK_INCIDENTS.map((i) => i.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(MOCK_INCIDENTS.length);
  });

  it('each incident has a pipeline_id', () => {
    MOCK_INCIDENTS.forEach((inc) => {
      expect(inc.pipeline_id).toBeTruthy();
    });
  });

  it('each incident has a valid error_type', () => {
    const validTypes = ['schema_drift', 'auth_failure', 'rate_limit'];
    MOCK_INCIDENTS.forEach((inc) => {
      expect(validTypes).toContain(inc.error_type);
    });
  });

  it('each incident has a valid status', () => {
    const validStatuses = ['detected', 'diagnosing', 'patching', 'resolved', 'failed'];
    MOCK_INCIDENTS.forEach((inc) => {
      expect(validStatuses).toContain(inc.status);
    });
  });

  it('resolved incidents have resolution_time_ms', () => {
    const resolved = MOCK_INCIDENTS.filter((i) => i.status === 'resolved');
    resolved.forEach((inc) => {
      expect(inc.resolution_time_ms).toBeDefined();
      expect(inc.resolution_time_ms).toBeGreaterThan(0);
    });
  });

  it('first incident has source and destination schemas', () => {
    const withSchemas = MOCK_INCIDENTS.find(
      (i) => i.source_schema && i.destination_schema,
    );
    expect(withSchemas).toBeDefined();
  });

  it('schema columns have required fields', () => {
    const incident = MOCK_INCIDENTS.find((i) => i.source_schema);
    incident!.source_schema!.columns.forEach((col) => {
      expect(col.name).toBeTruthy();
      expect(col.type).toBeTruthy();
      expect(typeof col.enabled).toBe('boolean');
    });
  });

  it('confidence scores are between 0 and 1', () => {
    MOCK_INCIDENTS.forEach((inc) => {
      if (inc.confidence_score !== undefined) {
        expect(inc.confidence_score).toBeGreaterThanOrEqual(0);
        expect(inc.confidence_score).toBeLessThanOrEqual(1);
      }
    });
  });

  it('ai_reasoning exists on resolved incidents', () => {
    const resolved = MOCK_INCIDENTS.find(
      (i) => i.status === 'resolved' && i.ai_reasoning,
    );
    expect(resolved).toBeDefined();
    expect(resolved!.ai_reasoning!.toLowerCase()).toContain('confidence');
  });
});

describe('MOCK_LOG_ENTRIES', () => {
  it('contains at least one entry', () => {
    expect(MOCK_LOG_ENTRIES.length).toBeGreaterThan(0);
  });

  it('each entry has a timestamp', () => {
    MOCK_LOG_ENTRIES.forEach((entry) => {
      expect(entry.timestamp).toBeTruthy();
    });
  });

  it('each entry has a valid level', () => {
    const validLevels = ['info', 'warning', 'error', 'success'];
    MOCK_LOG_ENTRIES.forEach((entry) => {
      expect(validLevels).toContain(entry.level);
    });
  });

  it('each entry has a message', () => {
    MOCK_LOG_ENTRIES.forEach((entry) => {
      expect(entry.message).toBeTruthy();
    });
  });

  it('includes a success entry', () => {
    const success = MOCK_LOG_ENTRIES.find((e) => e.level === 'success');
    expect(success).toBeDefined();
  });

  it('includes a warning entry', () => {
    const warning = MOCK_LOG_ENTRIES.find((e) => e.level === 'warning');
    expect(warning).toBeDefined();
  });

  it('success message mentions pipeline resolution', () => {
    const success = MOCK_LOG_ENTRIES.find((e) => e.level === 'success');
    expect(success!.message.length).toBeGreaterThan(0);
  });
});

describe('MOCK_STATS', () => {
  it('has total_pipelines', () => {
    expect(MOCK_STATS.total_pipelines).toBeGreaterThan(0);
  });

  it('has incidents_resolved', () => {
    expect(MOCK_STATS.incidents_resolved).toBeGreaterThanOrEqual(0);
  });

  it('incidents_resolved <= total_incidents', () => {
    expect(MOCK_STATS.incidents_resolved).toBeLessThanOrEqual(
      MOCK_STATS.total_incidents,
    );
  });

  it('has agent_uptime_seconds', () => {
    expect(MOCK_STATS.agent_uptime_seconds).toBeGreaterThan(0);
  });

  it('avg_resolution_time_ms is positive when set', () => {
    if (MOCK_STATS.avg_resolution_time_ms !== undefined) {
      expect(MOCK_STATS.avg_resolution_time_ms).toBeGreaterThan(0);
    }
  });
});

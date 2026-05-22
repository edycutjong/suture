import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AgentLog } from '@/components/AgentLog';
import type { LogEntry } from '@/lib/types';

describe('AgentLog', () => {
  const mockEntries: LogEntry[] = [
    {
      timestamp: '2026-05-22T10:15:30Z',
      level: 'info',
      message: 'Agent initialized successfully.',
    },
    {
      timestamp: '2026-05-22T10:16:00Z',
      level: 'warning',
      message: 'Database connection delay.',
    },
    {
      timestamp: '2026-05-22T10:16:45Z',
      level: 'error',
      message: 'Failed to sync Salesforce connector.',
    },
    {
      timestamp: '2026-05-22T10:17:10Z',
      level: 'success',
      message: 'Pipeline resolved.',
    },
  ];

  it('renders title and live indicator', () => {
    render(<AgentLog entries={mockEntries} />);
    expect(screen.getByText('AGENT LOG — LIVE')).toBeInTheDocument();
  });

  it('renders log entries with correct level prefixes and messages', () => {
    render(<AgentLog entries={mockEntries} />);

    expect(screen.getByText('[INF]')).toBeInTheDocument();
    expect(screen.getByText('Agent initialized successfully.')).toBeInTheDocument();

    expect(screen.getByText('[WRN]')).toBeInTheDocument();
    expect(screen.getByText('Database connection delay.')).toBeInTheDocument();

    expect(screen.getByText('[ERR]')).toBeInTheDocument();
    expect(screen.getByText('Failed to sync Salesforce connector.')).toBeInTheDocument();

    expect(screen.getByText('[OK ]')).toBeInTheDocument();
    expect(screen.getByText('Pipeline resolved.')).toBeInTheDocument();
  });

  it('formats timestamps correctly', () => {
    render(<AgentLog entries={mockEntries} />);
    expect(screen.getByText('10:15:30')).toBeInTheDocument();
    expect(screen.getByText('10:16:00')).toBeInTheDocument();
    expect(screen.getByText('10:16:45')).toBeInTheDocument();
    expect(screen.getByText('10:17:10')).toBeInTheDocument();
  });

  it('handles malformed timestamps gracefully', () => {
    const malformedEntries: LogEntry[] = [
      {
        timestamp: 'no_t_in_date',
        level: 'info',
        message: 'Info log.',
      },
    ];
    const { container } = render(<AgentLog entries={malformedEntries} />);
    const timestampSpan = container.querySelector('.log-timestamp');
    expect(timestampSpan?.textContent).toBe('');
  });

  it('assigns correct css classes for log levels', () => {
    const { container } = render(<AgentLog entries={mockEntries} />);
    const logSpans = container.querySelectorAll('.terminal-log > div');

    expect(logSpans[0].querySelector('.log-info')).toBeInTheDocument();
    expect(logSpans[1].querySelector('.log-warning')).toBeInTheDocument();
    expect(logSpans[2].querySelector('.log-error')).toBeInTheDocument();
    expect(logSpans[3].querySelector('.log-success')).toBeInTheDocument();
  });
});

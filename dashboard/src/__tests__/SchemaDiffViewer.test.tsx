import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SchemaDiffViewer } from '@/components/SchemaDiffViewer';
import type { TableSchema } from '@/lib/types';

describe('SchemaDiffViewer', () => {
  const mockSource: TableSchema = {
    table: 'users',
    columns: [
      { name: 'id', type: 'INTEGER', enabled: true },
      { name: 'name', type: 'VARCHAR', enabled: true },
      { name: 'added_col', type: 'TIMESTAMP', enabled: true }, // new column (not in destination)
    ],
  };

  const mockDestination: TableSchema = {
    table: 'users',
    columns: [
      { name: 'id', type: 'INTEGER', enabled: true },
      { name: 'name', type: 'VARCHAR', enabled: true },
      { name: 'missing_col', type: 'INTEGER', enabled: true }, // missing column (not in source)
    ],
  };

  it('renders tables titles and diff comparison', () => {
    render(<SchemaDiffViewer source={mockSource} destination={mockDestination} />);

    expect(screen.getByText('SCHEMA DIFF VIEWER')).toBeInTheDocument();
    expect(screen.getByText('SOURCE (DRIFTED)')).toBeInTheDocument();
    expect(screen.getByText('DESTINATION (EXPECTED)')).toBeInTheDocument();
  });

  it('shows new column in source with + prefix and green styling', () => {
    render(
      <SchemaDiffViewer source={mockSource} destination={mockDestination} />,
    );

    expect(screen.getByText('added_col')).toBeInTheDocument();
    expect(screen.getByText('+')).toBeInTheDocument();

    const addedColWrapper = screen.getByText('added_col').closest('div');
    expect(addedColWrapper?.className).toContain('bg-green-500/10');
    expect(addedColWrapper?.className).toContain('text-green-400');
  });

  it('shows missing column in destination with - prefix and red line-through styling', () => {
    render(
      <SchemaDiffViewer source={mockSource} destination={mockDestination} />,
    );

    expect(screen.getByText('missing_col')).toBeInTheDocument();
    expect(screen.getByText('−')).toBeInTheDocument();

    const missingColWrapper = screen.getByText('missing_col').closest('div');
    expect(missingColWrapper?.className).toContain('bg-red-500/10');
    expect(missingColWrapper?.className).toContain('text-red-400');
    expect(missingColWrapper?.className).toContain('line-through');
  });

  it('renders matched columns with standard styling', () => {
    render(<SchemaDiffViewer source={mockSource} destination={mockDestination} />);

    const idElements = screen.getAllByText('id');
    expect(idElements.length).toBe(2); // one in source, one in destination

    idElements.forEach((el) => {
      const wrapper = el.closest('div');
      expect(wrapper?.className).toContain('text-[var(--text-secondary)]');
      expect(wrapper?.className).not.toContain('bg-green-500/10');
      expect(wrapper?.className).not.toContain('bg-red-500/10');
    });
  });
});

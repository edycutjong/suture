import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StatusBadge } from '@/components/StatusBadge';

describe('StatusBadge', () => {
  it('renders status text in uppercase', () => {
    render(<StatusBadge status="healthy" />);
    expect(screen.getByText('HEALTHY')).toBeInTheDocument();
  });

  it('applies correct classes for healthy status', () => {
    const { container } = render(<StatusBadge status="healthy" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('bg-green-500/10');
    expect(badge.className).toContain('text-green-400');

    const dot = badge.firstChild as HTMLElement;
    expect(dot.className).toContain('bg-green-400');
    expect(dot.className).not.toContain('animate-pulse-glow');
  });

  it('applies correct classes for broken status', () => {
    const { container } = render(<StatusBadge status="broken" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('bg-red-500/10');
    expect(badge.className).toContain('text-red-400');

    const dot = badge.firstChild as HTMLElement;
    expect(dot.className).toContain('bg-red-400');
  });

  it('enables animation when animate prop is true', () => {
    const { container } = render(<StatusBadge status="healing" animate={true} />);
    const badge = container.firstChild as HTMLElement;
    const dot = badge.firstChild as HTMLElement;
    expect(dot.className).toContain('animate-pulse-glow');
  });

  it('falls back to healthy styling for unknown status', () => {
    // Cast to any to test fallback
    const { container } = render(<StatusBadge status={'unknown' as import('@/lib/types').PipelineStatus} />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('bg-green-500/10');
    expect(badge.className).toContain('text-green-400');
  });
});

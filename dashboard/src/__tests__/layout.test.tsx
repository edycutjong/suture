import React from 'react';
import '@testing-library/jest-dom';
import RootLayout, { metadata } from '@/app/layout';

// Mock next/font/google
jest.mock('next/font/google', () => ({
  Geist: () => ({ variable: 'mock-geist-sans' }),
  Geist_Mono: () => ({ variable: 'mock-geist-mono' }),
  Orbitron: () => ({ variable: 'mock-orbitron' }),
}));

describe('RootLayout', () => {
  it('renders children correctly and sets font variables on html element', () => {
    const result = RootLayout({
      children: <div data-testid="child-element">Hello World</div>,
    });

    // Verify root is html tag
    expect(result.type).toBe('html');
    expect(result.props.lang).toBe('en');
    expect(result.props.className).toContain('mock-geist-sans');
    expect(result.props.className).toContain('mock-geist-mono');
    expect(result.props.className).toContain('mock-orbitron');
    expect(result.props.className).toContain('h-full');
    expect(result.props.className).toContain('antialiased');

    // Verify body element exists
    const body = result.props.children;
    expect(body.type).toBe('body');
    expect(body.props.className).toContain('min-h-full');
    expect(body.props.className).toContain('flex');
    expect(body.props.className).toContain('flex-col');

    // Verify children are passed inside body
    const child = body.props.children;
    expect(child.props['data-testid']).toBe('child-element');
  });

  it('exports correct metadata configuration', () => {
    expect((metadata.title as { default: string }).default).toBe('Suture — Your pipelines heal themselves');
    expect((metadata.title as { template: string }).template).toBe('%s | Suture');
    expect(metadata.description).toBe(
      'Autonomous AI agent that detects broken Fivetran syncs caused by schema drift and self-heals in under 60 seconds.',
    );
    expect(metadata.openGraph?.title).toBe('Suture — Your pipelines heal themselves');
    expect((metadata.twitter as { card?: string })?.card).toBe('summary_large_image');
  });
});

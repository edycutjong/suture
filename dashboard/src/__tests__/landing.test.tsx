import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import LandingPage from '@/app/page';

// Mock next/link to avoid router errors
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
  MockLink.displayName = 'MockLink';
  return MockLink;
});

describe('Landing Page', () => {
  let scrollIntoViewMock: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    scrollIntoViewMock = jest.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('renders landing page with headline and description', () => {
    render(<LandingPage />);
    expect(screen.getByText(/Your pipelines/)).toBeInTheDocument();
    expect(screen.getByText(/heal themselves/)).toBeInTheDocument();
    expect(screen.getByText(/Zero-Touch Pipeline Healing Architecture/)).toBeInTheDocument();
  });

  it('scrolls to simulator on "Watch Demo" click', () => {
    render(<LandingPage />);
    const watchDemoBtn = screen.getByRole('button', { name: 'Watch Demo' });
    fireEvent.click(watchDemoBtn);
    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('runs schema drift simulation step-by-step with timers', () => {
    render(<LandingPage />);
    
    // Check initial state
    expect(screen.getByText('Pipeline Healthy')).toBeInTheDocument();
    
    const triggerBtn = screen.getByRole('button', { name: 'TRIGGER SCHEMA DRIFT' });
    
    // Start simulation
    act(() => {
      fireEvent.click(triggerBtn);
    });

    // Step 1 check
    expect(screen.getByText('Schema Drift Detected!')).toBeInTheDocument();
    expect(screen.getByText(/ALERT/)).toBeInTheDocument();
    
    // Advance to Step 2
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(screen.getByText('Gemini Reasoning...')).toBeInTheDocument();
    expect(screen.getByText(/RESOLVE/)).toBeInTheDocument();

    // Advance to Step 3
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(screen.getByText('Applying API Patch')).toBeInTheDocument();
    expect(screen.getByText(/MUTATE/)).toBeInTheDocument();

    // Advance to Step 4
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(screen.getByText('Pipeline Restored!')).toBeInTheDocument();
    expect(screen.getByText(/SUCCESS/)).toBeInTheDocument();

    // Advance to simulation end (7.5s total)
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    // Trigger button should be enabled again
    expect(triggerBtn).not.toBeDisabled();
  });

  it('prevents starting simulation if already in progress', () => {
    render(<LandingPage />);
    const triggerBtn = screen.getByRole('button', { name: 'TRIGGER SCHEMA DRIFT' });
    
    act(() => {
      fireEvent.click(triggerBtn);
    });
    
    // Try clicking again - should be disabled or have no effect
    expect(triggerBtn).toBeDisabled();
  });

  it('resets the simulation correctly', () => {
    render(<LandingPage />);
    const triggerBtn = screen.getByRole('button', { name: 'TRIGGER SCHEMA DRIFT' });
    
    act(() => {
      fireEvent.click(triggerBtn);
    });
    
    // Step 1 active
    expect(screen.getByText('Schema Drift Detected!')).toBeInTheDocument();
    
    const resetBtn = screen.getByRole('button', { name: 'Reset' });
    act(() => {
      fireEvent.click(resetBtn);
    });
    
    // Back to Step 0
    expect(screen.getByText('Pipeline Healthy')).toBeInTheDocument();
  });

  it('covers the isSimulating check in startSimulation', () => {
    render(<LandingPage />);
    const triggerBtn = screen.getByRole('button', { name: 'TRIGGER SCHEMA DRIFT' });
    
    // First click to start simulation
    act(() => {
      fireEvent.click(triggerBtn);
    });
    
    // Directly retrieve the React onClick handler to bypass disabled check
    const reactPropsKey = Object.keys(triggerBtn).find(k => k.startsWith('__reactProps'));
    if (reactPropsKey) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const onClick = (triggerBtn as any)[reactPropsKey].onClick;
      act(() => {
        onClick();
      });
    }
    
    expect(screen.getByText('Schema Drift Detected!')).toBeInTheDocument();
  });

  it('handles smooth scroll when element is missing', () => {
    render(<LandingPage />);
    const watchDemoBtn = screen.getByRole('button', { name: 'Watch Demo' });
    
    const originalGetElementById = document.getElementById;
    document.getElementById = jest.fn().mockReturnValue(null);
    
    fireEvent.click(watchDemoBtn);
    
    expect(scrollIntoViewMock).not.toHaveBeenCalled();
    
    document.getElementById = originalGetElementById;
  });
});


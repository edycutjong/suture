import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DemoControls } from '@/components/DemoControls';

describe('DemoControls', () => {
  let onSeed: jest.Mock<Promise<void>, []>;
  let onBreak: jest.Mock<Promise<void>, []>;
  let onHeal: jest.Mock<Promise<void>, []>;

  beforeEach(() => {
    onSeed = jest.fn().mockImplementation(() => Promise.resolve());
    onBreak = jest.fn().mockImplementation(() => Promise.resolve());
    onHeal = jest.fn().mockImplementation(() => Promise.resolve());
  });

  it('renders all control buttons', () => {
    render(<DemoControls onSeed={onSeed} onBreak={onBreak} onHeal={onHeal} />);

    expect(screen.getByRole('button', { name: 'SEED' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '💥 BREAK' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '🩹 HEAL' })).toBeInTheDocument();
  });

  it('triggers onSeed and handles loading state', async () => {
    let resolvePromise!: () => void;
    const promise = new Promise<void>((resolve) => {
      resolvePromise = resolve;
    });
    onSeed.mockReturnValueOnce(promise);

    render(<DemoControls onSeed={onSeed} onBreak={onBreak} onHeal={onHeal} />);
    const seedBtn = screen.getByRole('button', { name: 'SEED' });
    const breakBtn = screen.getByRole('button', { name: '💥 BREAK' });
    const healBtn = screen.getByRole('button', { name: '🩹 HEAL' });

    // Click seed
    fireEvent.click(seedBtn);

    // Verify it is loading
    expect(seedBtn).toHaveTextContent('...');
    expect(seedBtn).toBeDisabled();
    expect(breakBtn).toBeDisabled();
    expect(healBtn).toBeDisabled();
    expect(onSeed).toHaveBeenCalledTimes(1);

    // Resolve promise
    await act(async () => {
      resolvePromise();
      await promise;
    });

    // Check loading reset
    expect(seedBtn).toHaveTextContent('SEED');
    expect(seedBtn).not.toBeDisabled();
    expect(breakBtn).not.toBeDisabled();
    expect(healBtn).not.toBeDisabled();
  });

  it('triggers onBreak and handles loading state', async () => {
    let resolvePromise!: () => void;
    const promise = new Promise<void>((resolve) => {
      resolvePromise = resolve;
    });
    onBreak.mockReturnValueOnce(promise);

    render(<DemoControls onSeed={onSeed} onBreak={onBreak} onHeal={onHeal} />);
    const breakBtn = screen.getByRole('button', { name: '💥 BREAK' });

    fireEvent.click(breakBtn);
    expect(breakBtn).toHaveTextContent('...');
    expect(onBreak).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolvePromise();
      await promise;
    });
    expect(breakBtn).toHaveTextContent('💥 BREAK');
  });

  it('triggers onHeal and handles loading state', async () => {
    let resolvePromise!: () => void;
    const promise = new Promise<void>((resolve) => {
      resolvePromise = resolve;
    });
    onHeal.mockReturnValueOnce(promise);

    render(<DemoControls onSeed={onSeed} onBreak={onBreak} onHeal={onHeal} />);
    const healBtn = screen.getByRole('button', { name: '🩹 HEAL' });

    fireEvent.click(healBtn);
    expect(healBtn).toHaveTextContent('...');
    expect(onHeal).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolvePromise();
      await promise;
    });
    expect(healBtn).toHaveTextContent('🩹 HEAL');
  });
});

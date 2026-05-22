import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PitchPage, { metadata } from '@/app/pitch/page';

describe('PitchPage', () => {
  it('renders iframe with correct props', () => {
    render(<PitchPage />);
    const iframe = screen.getByTitle('Suture Pitch Deck');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('src', '/deck/');
    expect(iframe).toHaveAttribute('class', 'w-full border-none');
    expect(iframe).toHaveStyle('height: 100dvh');
  });

  it('exports correct metadata', () => {
    expect(metadata.title).toBe('Pitch Deck');
    expect(metadata.description).toBe(
      'Suture pitch deck — Google Cloud Rapid Agent 2026, Fivetran Partner Track.',
    );
  });
});

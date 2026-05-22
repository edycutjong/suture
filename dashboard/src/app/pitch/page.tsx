import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pitch Deck',
  description: 'Suture pitch deck — Google Cloud Rapid Agent 2026, Fivetran Partner Track.',
};

export default function PitchPage() {
  return (
    <iframe
      src="/deck/"
      className="w-full border-none"
      style={{ height: '100dvh' }}
      title="Suture Pitch Deck"
      allowFullScreen
    />
  );
}

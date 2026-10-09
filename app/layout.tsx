// app/layout.tsx - Root Layout for PersonaPulse Elite Editorial Edition
import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PersonaPulse Elite — Synthetic Website Research',
  description: 'Explore landing-page copy with 50 fictional personas, reproducible heuristic scores, and plain-language editorial suggestions.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


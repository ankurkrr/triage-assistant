import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Request Triage Assistant',
  description: 'A triage assistant for incoming business requests.',
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

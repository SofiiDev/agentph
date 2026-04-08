import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Regulatory Evidence Copilot',
  description: 'SaaS privado para asistencia regulatoria farmacéutica'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

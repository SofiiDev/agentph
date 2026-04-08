import { QueryPanel } from '@/components/query-panel';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-8">
      <header>
        <h1 className="text-2xl font-bold">Regulatory Evidence Copilot</h1>
        <p className="text-slate-700">Separación estricta entre respuestas con evidencia y borradores regulatorios.</p>
      </header>
      <QueryPanel />
    </main>
  );
}

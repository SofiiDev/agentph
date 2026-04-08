import { DashboardPlaceholder } from '@/components/dashboard-placeholder';
import { LoginPlaceholder } from '@/components/login-placeholder';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-8">
      <header>
        <h1 className="text-2xl font-bold">Regulatory Evidence Copilot</h1>
        <p className="text-slate-700">Base segura: frontend + API privada + Supabase RLS-first.</p>
      </header>
      <LoginPlaceholder />
      <DashboardPlaceholder />
    </main>
  );
}

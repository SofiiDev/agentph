import { DashboardPlaceholder } from '@/components/dashboard-placeholder';
import { LoginPlaceholder } from '@/components/login-placeholder';
import { UploadPanel } from '@/components/documents/upload-panel';
import { SearchPanel } from '@/components/documents/search-panel';
import { AskPanel } from '@/components/documents/ask-panel';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-8">
      <header>
        <h1 className="text-2xl font-bold">Regulatory Evidence Copilot</h1>
        <p className="text-slate-700">Fase 5: carga e ingesta documental con trazabilidad y estados.</p>
      </header>
      <LoginPlaceholder />
      <UploadPanel />
      <SearchPanel />
      <AskPanel />
      <DashboardPlaceholder />
    </main>
  );
}

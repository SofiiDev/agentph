'use client';

import { useState } from 'react';

type EvidenceResponse = {
  status: 'ok' | 'insufficient_evidence';
  answer: string;
  citations: Array<{
    document_id: string;
    document_version: string;
    section: string;
    page_or_chunk: string;
    quote: string;
  }>;
};

export function QueryPanel() {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<EvidenceResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setResult(null);

    const response = await fetch('/.netlify/functions/query-evidence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: question })
    });

    const payload = (await response.json()) as EvidenceResponse;
    setResult(payload);
    setLoading(false);
  };

  return (
    <section className="rounded-lg bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">Respuesta con evidencia</h2>
      <form className="space-y-3" onSubmit={onSubmit}>
        <textarea
          required
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          className="min-h-28 w-full rounded border border-slate-300 p-2"
          placeholder="Haz una pregunta regulatoria"
        />
        <button className="rounded bg-slate-900 px-4 py-2 text-white" disabled={loading}>
          {loading ? 'Consultando...' : 'Consultar'}
        </button>
      </form>

      {result ? (
        <div className="mt-5 space-y-3 rounded bg-slate-50 p-4">
          <p className="font-medium">{result.answer}</p>
          <ul className="space-y-2 text-sm">
            {result.citations.map((citation, index) => (
              <li key={`${citation.document_id}-${index}`}>
                {citation.document_id} v{citation.document_version} | {citation.section} | {citation.page_or_chunk}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

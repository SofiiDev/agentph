'use client';

import { useState } from 'react';

type AskResponse = {
  answer: string;
  confidence: 'low' | 'medium' | 'high';
  needs_human_review: boolean;
  unsupported_claims: string[];
  citations: Array<{
    document_id: string;
    document_name: string;
    version: string;
    page_number: number | null;
    section_ref: string | null;
    chunk_id: string;
    support_level: 'direct' | 'partial';
  }>;
};

export function AskPanel() {
  const [token, setToken] = useState('');
  const [question, setQuestion] = useState('¿Cuál es el requisito principal de estabilidad?');
  const [response, setResponse] = useState<AskResponse | null>(null);
  const [error, setError] = useState('');

  const ask = async () => {
    setError('');
    const res = await fetch('/api/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ question, onlyApproved: true, topK: 8 })
    });
    const payload = await res.json();

    if (!payload.ok) {
      setError(payload.error?.message ?? 'Error');
      setResponse(null);
      return;
    }

    setResponse(payload.data as AskResponse);
  };

  return (
    <section className="rounded-lg bg-white p-6 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">Consulta regulatoria</h2>

      <input className="mb-2 w-full rounded border p-2" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Token" />
      <textarea className="mb-2 w-full rounded border p-2" value={question} onChange={(e) => setQuestion(e.target.value)} rows={3} />
      <button className="rounded bg-slate-900 px-4 py-2 text-white" onClick={ask}>Preguntar</button>

      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}

      {response ? (
        <div className="mt-4 grid gap-4 md:grid-cols-[2fr,1fr]">
          <div className="rounded border p-3">
            <div className="mb-2 text-sm text-slate-600">Confianza: <strong>{response.confidence}</strong></div>
            <div className="mb-2 text-sm text-slate-600">Revisión humana: {response.needs_human_review ? 'Sí' : 'No'}</div>
            <p>{response.answer}</p>
            {response.unsupported_claims.length > 0 ? (
              <ul className="mt-2 list-disc pl-5 text-sm text-amber-700">
                {response.unsupported_claims.map((claim) => (
                  <li key={claim}>{claim}</li>
                ))}
              </ul>
            ) : null}
          </div>
          <aside className="rounded border p-3">
            <h3 className="mb-2 font-medium">Evidencia</h3>
            <ul className="space-y-2 text-xs">
              {response.citations.map((citation) => (
                <li key={citation.chunk_id} className="rounded bg-slate-50 p-2">
                  <div>{citation.document_name} ({citation.version})</div>
                  <div>chunk {citation.chunk_id.slice(0, 8)} · p{citation.page_number ?? '-'} · {citation.section_ref ?? '-'}</div>
                  <div>soporte: {citation.support_level}</div>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      ) : null}
    </section>
  );
}

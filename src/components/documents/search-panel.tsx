'use client';

import { useState } from 'react';

type SearchRow = {
  chunk_id: string;
  score: number;
  content: string;
  document_id: string;
  document_name: string;
  document_version: string;
  page_number: number | null;
  section_ref: string | null;
  status: string;
};

export function SearchPanel() {
  const [token, setToken] = useState('');
  const [query, setQuery] = useState('stability protocol');
  const [onlyApproved, setOnlyApproved] = useState(true);
  const [documentType, setDocumentType] = useState('');
  const [rows, setRows] = useState<SearchRow[]>([]);
  const [error, setError] = useState('');

  const onSearch = async () => {
    setError('');
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        query,
        filters: {
          onlyApproved,
          documentType: documentType || undefined,
          topK: 8
        }
      })
    });

    const payload = await response.json();
    if (!payload.ok) {
      setError(payload.error?.message ?? 'Error de búsqueda');
      setRows([]);
      return;
    }

    setRows(payload.data.results as SearchRow[]);
  };

  return (
    <section className="rounded-lg bg-white p-6 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">Búsqueda documental (RAG privado)</h2>
      <div className="grid gap-2">
        <input className="rounded border p-2" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Bearer token placeholder" />
        <input className="rounded border p-2" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Consulta" />
        <input className="rounded border p-2" value={documentType} onChange={(e) => setDocumentType(e.target.value)} placeholder="Filtro tipo documento (opcional)" />
        <label className="text-sm">
          <input type="checkbox" checked={onlyApproved} onChange={(e) => setOnlyApproved(e.target.checked)} /> Solo aprobados
        </label>
        <button className="rounded bg-slate-900 px-4 py-2 text-white" onClick={onSearch}>
          Buscar
        </button>
      </div>

      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}

      <ul className="mt-4 space-y-2 text-sm">
        {rows.map((row) => (
          <li key={row.chunk_id} className="rounded border p-2">
            <div className="font-medium">{row.document_name} ({row.document_version}) · score {row.score.toFixed(3)}</div>
            <div className="text-slate-600">{row.status} · p{row.page_number ?? '-'} · {row.section_ref ?? '-'}</div>
            <p>{row.content.slice(0, 240)}...</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

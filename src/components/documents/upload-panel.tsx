'use client';

import { useEffect, useState } from 'react';

type Row = {
  id: string;
  version: string;
  status: string;
  processing_status: 'uploading' | 'processing' | 'ready' | 'failed';
  source_file_path: string;
  created_at: string;
};

export function UploadPanel() {
  const [token, setToken] = useState('');
  const [items, setItems] = useState<Row[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchDocuments = async () => {
    const response = await fetch('/api/documents', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const payload = await response.json();
    if (payload.ok) setItems(payload.data.items as Row[]);
  };

  useEffect(() => {
    void fetchDocuments();
  }, []);

  const onFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    const fileBase64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

    setLoading(true);
    const response = await fetch('/api/documents/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type || 'text/plain',
        fileBase64,
        dedupeByChecksum: true
      })
    });

    const payload = await response.json();
    setMessage(payload.ok ? 'Documento recibido para procesamiento' : payload.error?.message ?? 'Error');
    await fetchDocuments();
    setLoading(false);
  };

  return (
    <section className="rounded-lg bg-white p-6 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">Carga documental</h2>
      <p className="mb-3 text-sm text-slate-600">Tipos permitidos: PDF, DOCX, TXT.</p>

      <label className="mb-2 block text-sm font-medium">Token JWT</label>
      <input value={token} onChange={(e) => setToken(e.target.value)} className="mb-3 w-full rounded border p-2" />

      <input type="file" onChange={onFile} className="mb-3" />
      <div className="text-sm text-slate-700">{loading ? 'Subiendo...' : message}</div>

      <table className="mt-4 w-full text-left text-sm">
        <thead>
          <tr>
            <th>ID</th>
            <th>Versión</th>
            <th>Estado</th>
            <th>Path</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.id.slice(0, 8)}...</td>
              <td>{item.version}</td>
              <td>{item.processing_status}</td>
              <td>{item.source_file_path}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

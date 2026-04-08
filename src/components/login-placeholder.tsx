'use client';

import { useState } from 'react';

export function LoginPlaceholder() {
  const [email, setEmail] = useState('');

  return (
    <section className="rounded-lg bg-white p-6 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold">Login (placeholder)</h2>
      <p className="mb-4 text-sm text-slate-600">Fase 1: UI de autenticación sin lógica real todavía.</p>
      <form className="space-y-3">
        <input
          className="w-full rounded border border-slate-300 p-2"
          type="email"
          placeholder="usuario@laboratorio.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="rounded bg-slate-900 px-4 py-2 text-white" type="button">
          Continuar
        </button>
      </form>
    </section>
  );
}

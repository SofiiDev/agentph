# Regulatory Evidence Copilot (SaaS privado)

Aplicación base para asistencia regulatoria farmacéutica con arquitectura segura y multi-tenant.

## Stack
- Next.js + TypeScript
- Netlify Functions + Background Functions
- Supabase (Auth, Postgres, Storage)
- pgvector
- OpenAI Responses API con Structured Outputs (JSON Schema estricto)
- Zod + Vitest

## Requisitos
1. Node.js 20+
2. Variables de entorno en servidor:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`

## Desarrollo local
```bash
npm install
npm run dev
```

## Calidad
```bash
npm run typecheck
npm run test
```

## Deploy en Netlify
- Configurado con `netlify.toml`.
- Frontend con plugin oficial `@netlify/plugin-nextjs`.
- Backend en `netlify/functions`.

## Seguridad implementada (fase base)
- El cliente nunca llama al LLM directamente.
- Claves sensibles solo en backend por variables de entorno.
- RLS en tablas de negocio (documentos, chunks, auditoría, membresías).
- Trazabilidad completa por `audit_logs`.
- Respuesta de insuficiencia de evidencia obligatoria.

# Regulatory Evidence Copilot — Fase 5 (consulta fundamentada segura)

## Qué se implementó
- `POST /api/ask` con auth obligatoria, rate limit y validación Zod.
- Motor `askRegulatoryQuestion` que:
  - usa solo `retrieved_context`
  - exige Structured Outputs (JSON schema estricto)
  - valida JSON server-side
  - valida integridad de citas (no acepta chunk fuera del contexto recuperado)
  - guarda `query_logs` y `audit_logs`
- Respuesta exacta de rechazo cuando no hay evidencia:
  - `No tengo evidencia suficiente en los documentos provistos.`
- UI mínima con:
  - caja de pregunta
  - panel de respuesta
  - panel lateral de evidencia
  - indicador de confianza

## Seguridad aplicada
- Ningún secreto en frontend.
- Llamadas LLM solo backend (`src/server/ask.ts`, `src/server/embeddings.ts`).
- Env vars de servidor en `src/server/env.ts`.
- Auth JWT HS256 real (sin placeholders) en `src/server/auth.ts`.
- RLS en Supabase desde migraciones previas.
- `SUPABASE_SERVICE_ROLE_KEY` solo en módulos server-only (`src/server/supabase-admin.ts`).
- Rate limiting (`src/server/rate-limit.ts`).
- Validación Zod en payload de endpoints sensibles (`src/server/api-schemas.ts`).
- Logs de auditoría (`query_logs`, `audit_logs`).
- Errores JSON sin stack trace ni secretos (`withApiHandler`).
- Storage privado configurado en migración de fase 3.
- Signed URLs temporales: no necesarias para fase actual (no descarga pública de archivo).

## Verificación manual
1. Configura `.env` con variables de servidor.
2. Aplica migraciones Supabase.
3. Inicia app (`npm run dev`) y Netlify functions.
4. Genera JWT HS256 con claims:
   - `sub` (user id)
   - `org_id` (tenant)
   - `exp`
5. En UI:
   - sube documento
   - espera estado `ready`
   - ejecuta búsqueda
   - ejecuta pregunta en panel Ask
6. Caso sin evidencia: debe responder exactamente
   - `No tengo evidencia suficiente en los documentos provistos.`
7. Caso con evidencia:
   - respuesta con `citations[]`
   - `confidence`
   - `needs_human_review`
   - `unsupported_claims[]` si aplica

## Endpoints
- `POST /api/ask`
- `POST /api/search`
- `POST /api/documents/upload`
- `GET /api/documents`
- `GET /api/health`
- `GET /api/auth-check`

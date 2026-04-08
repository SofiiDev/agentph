# Regulatory Evidence Copilot — Fase 1

Esqueleto base seguro para SaaS regulatorio privado.

## ✅ Incluye en esta fase
- Frontend Next.js con:
  - Login placeholder
  - Dashboard vacío
- API privada en Netlify Functions bajo `/api/*`
  - `GET /api/health`
  - `GET /api/auth-check`
  - `GET /api/private/dashboard`
- Separación cliente/servidor (capa `server-only` en `src/server/*`).
- Validación fail-fast de variables de entorno en backend.
- Logging estructurado mínimo para auditoría técnica.
- Diseño RLS-first en Supabase + política de ejemplo por usuario.
- Rate limiting básico por IP.
- Tests unitarios + smoke e2e.

## Estructura
```txt
src/
  app/
  components/
  lib/                 # cliente público (sin secretos)
  server/              # server-only: env, auth, errores, logger, rate-limit
netlify/functions/     # API privada
supabase/
  config.toml
  migrations/
tests/e2e/
```

## Variables de entorno
Copia `.env.example` a `.env.local` (dev) y configura las mismas en Netlify para producción.

## Scripts
```bash
npm install
npm run dev
npm run build
npm run typecheck
npm run test
npm run test:unit
npm run test:e2e
```

## Seguridad
- El frontend solo usa variables `NEXT_PUBLIC_*`.
- `OPENAI_API_KEY` y `SUPABASE_SERVICE_ROLE_KEY` solo en servidor.
- Endpoints protegidos requieren `Authorization: Bearer`.
- RLS habilitado y política de ejemplo para acceso por usuario.

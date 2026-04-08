# Regulatory Evidence Copilot — Fase 2 (Esquema de datos)

Implementación de base de datos multi-tenant para regulación farmacéutica privada.

## Entregables de Fase 2
- Migración SQL completa con tablas/relaciones solicitadas.
- Índices + restricciones de integridad.
- Políticas RLS por organización (aislamiento tenant).
- Seeds mínimos de prueba.
- Helper TypeScript tipado para acceso al esquema.
- Suite de tests SQL de criterios funcionales.

## Tablas implementadas
- `organizations`
- `app_users` + `organization_memberships`
- `projects`
- `regulatory_documents`
- `document_versions`
- `document_chunks`
- `document_embeddings`
- `document_tags`
- `document_approvals`
- `query_logs`
- `generation_logs`
- `audit_logs`
- `templates`
- `generated_documents`

## Reglas clave de negocio
- Solo usuarios de la misma organización pueden ver/escribir datos (RLS en todas las tablas principales).
- Visibilidad por defecto sin obsoletos mediante `v_active_document_versions`.
- Solo una versión vigente por documento con índice único parcial en `document_versions(is_current=true)`.
- Aprobaciones QA/RA/legal preparadas vía `document_approvals`.

## Archivos relevantes
- Migración: `supabase/migrations/20260408120000_phase2_regulatory_schema.sql`
- Seeds: `supabase/seeds_phase2.sql`
- Tests SQL: `supabase/tests/phase2_schema_tests.sql`
- Helper tipado TS: `src/server/db/schema.ts`

## Ejecución sugerida
```bash
# 1) aplicar migraciones (según tu flujo de Supabase CLI)
supabase db reset

# 2) cargar seeds
psql "$SUPABASE_DB_URL" -f supabase/seeds_phase2.sql

# 3) ejecutar tests SQL
psql "$SUPABASE_DB_URL" -f supabase/tests/phase2_schema_tests.sql
```

## Decisiones de diseño
1. **RLS-first real**: todas las tablas de dominio se filtran por `organization_id` usando `same_org()`.
2. **Modelo versionado explícito**: documento lógico (`regulatory_documents`) separado de revisiones (`document_versions`).
3. **Escalabilidad de aprobación**: una tabla por etapas (`qa`, `ra`, `legal`) con decisión por versión.
4. **Auditoría separada por tipo**: `query_logs`, `generation_logs` y `audit_logs` para trazabilidad fina.
5. **Búsqueda segura por defecto**: vista activa excluye obsoletos sin depender de lógica de aplicación.

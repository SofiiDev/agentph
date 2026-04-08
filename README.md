# Regulatory Evidence Copilot — Fase 3 (Carga e ingesta documental)

## Alcance
Pipeline de carga/ingesta sin embeddings ni chat.

### Soporte de archivos
- PDF
- DOCX
- TXT

## Flujo implementado
1. Usuario autenticado sube archivo (`POST /api/documents/upload`).
2. Archivo se almacena en bucket privado Supabase Storage.
3. Se crea documento + versión + job de ingesta.
4. Background Function procesa job.
5. Parser extrae texto.
6. Chunking con overlap configurable.
7. Se conserva trazabilidad mínima por página (cuando aplica).
8. Se guardan chunks ordenados.
9. Se calcula checksum SHA-256.
10. UI muestra estado (`uploading | processing | ready | failed`).

## Endpoints
- `GET /api/health`
- `GET /api/auth-check`
- `GET /api/documents`
- `POST /api/documents/upload`
- Background: `/.netlify/functions/api-process-document-background-background`

## Variables de entorno nuevas
- `MAX_UPLOAD_BYTES`
- `CHUNK_SIZE_WORDS`
- `CHUNK_OVERLAP_WORDS`
- `APP_BASE_URL` (opcional)

## Archivos clave
- Migración fase 3: `supabase/migrations/20260408140000_phase3_ingestion_pipeline.sql`
- Servicio ingesta: `src/server/ingestion/service.ts`
- Parser/chunking/validación: `src/server/ingestion/*`
- UI upload + tabla estado: `src/components/documents/upload-panel.tsx`

## Pruebas
- Unitarias de validación mime/auth/chunking/errores parser.
- Integración básica de handlers de upload/list.

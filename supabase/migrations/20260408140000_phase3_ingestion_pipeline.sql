create type if not exists public.ingestion_status as enum ('uploading', 'processing', 'ready', 'failed');

alter table public.document_versions
  add column if not exists mime_type text,
  add column if not exists file_size_bytes bigint,
  add column if not exists processing_status public.ingestion_status not null default 'uploading';

create table if not exists public.document_ingestion_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_version_id uuid not null references public.document_versions(id) on delete cascade,
  status public.ingestion_status not null default 'uploading',
  attempt_count integer not null default 0,
  chunk_count integer,
  last_error text,
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  created_by uuid not null references public.app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_ingestion_jobs_org_status
  on public.document_ingestion_jobs(organization_id, status, created_at desc);
create index if not exists idx_ingestion_jobs_version
  on public.document_ingestion_jobs(document_version_id);

alter table public.document_ingestion_jobs enable row level security;

create policy "org data access ingestion jobs"
on public.document_ingestion_jobs for all
using (public.same_org(organization_id))
with check (public.same_org(organization_id));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'regulatory-private-documents',
  'regulatory-private-documents',
  false,
  10485760,
  array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
)
on conflict (id) do nothing;

create policy "tenant access private docs"
on storage.objects for all
using (
  bucket_id = 'regulatory-private-documents'
  and public.same_org((storage.foldername(name))[1]::uuid)
)
with check (
  bucket_id = 'regulatory-private-documents'
  and public.same_org((storage.foldername(name))[1]::uuid)
);

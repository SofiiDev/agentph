create extension if not exists vector;

create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists tenant_members (
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','reviewer','writer','reader')),
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  code text not null,
  title text not null,
  version text not null,
  status text not null check (status in ('vigente','obsoleto','borrador','aprobado')),
  storage_path text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (tenant_id, code, version)
);

create table if not exists document_chunks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  chunk_order int not null,
  section text not null,
  page_or_chunk text not null,
  content text not null,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

create index if not exists idx_document_chunks_tenant_doc on document_chunks(tenant_id, document_id);
create index if not exists idx_document_chunks_embedding on document_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade,
  user_id uuid references auth.users(id),
  action_type text not null check (action_type in ('evidence_answer','draft_generation','document_ingest','document_status_change')),
  prompt text,
  used_documents jsonb not null default '[]'::jsonb,
  used_chunks jsonb not null default '[]'::jsonb,
  response_payload jsonb not null,
  review_status text not null check (review_status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create or replace function is_tenant_member(target_tenant uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from tenant_members tm
    where tm.tenant_id = target_tenant and tm.user_id = auth.uid()
  );
$$;

alter table tenants enable row level security;
alter table tenant_members enable row level security;
alter table documents enable row level security;
alter table document_chunks enable row level security;
alter table audit_logs enable row level security;

create policy "members can view tenant"
on tenants for select
using (is_tenant_member(id));

create policy "members can view memberships"
on tenant_members for select
using (is_tenant_member(tenant_id));

create policy "owner manages memberships"
on tenant_members for all
using (
  exists (
    select 1 from tenant_members tm
    where tm.tenant_id = tenant_members.tenant_id
      and tm.user_id = auth.uid()
      and tm.role = 'owner'
  )
)
with check (
  exists (
    select 1 from tenant_members tm
    where tm.tenant_id = tenant_members.tenant_id
      and tm.user_id = auth.uid()
      and tm.role = 'owner'
  )
);

create policy "members can view documents"
on documents for select
using (is_tenant_member(tenant_id));

create policy "writers and owners can modify documents"
on documents for all
using (
  exists (
    select 1 from tenant_members tm
    where tm.tenant_id = documents.tenant_id
      and tm.user_id = auth.uid()
      and tm.role in ('owner', 'writer')
  )
)
with check (
  exists (
    select 1 from tenant_members tm
    where tm.tenant_id = documents.tenant_id
      and tm.user_id = auth.uid()
      and tm.role in ('owner', 'writer')
  )
);

create policy "members can view chunks"
on document_chunks for select
using (is_tenant_member(tenant_id));

create policy "writers and owners can modify chunks"
on document_chunks for all
using (
  exists (
    select 1 from tenant_members tm
    where tm.tenant_id = document_chunks.tenant_id
      and tm.user_id = auth.uid()
      and tm.role in ('owner', 'writer')
  )
)
with check (
  exists (
    select 1 from tenant_members tm
    where tm.tenant_id = document_chunks.tenant_id
      and tm.user_id = auth.uid()
      and tm.role in ('owner', 'writer')
  )
);

create policy "members can view audit logs"
on audit_logs for select
using (is_tenant_member(tenant_id));

create policy "service writes audit logs"
on audit_logs for insert
with check (true);

create or replace function match_document_chunks(
  query_embedding vector(1536),
  tenant_id_param uuid,
  match_count int default 10
)
returns table (
  chunk_id uuid,
  document_id uuid,
  document_version text,
  section text,
  page_or_chunk text,
  status text,
  content text,
  similarity float
)
language sql
security definer
set search_path = public
as $$
  select
    dc.id as chunk_id,
    dc.document_id,
    d.version as document_version,
    dc.section,
    dc.page_or_chunk,
    d.status,
    dc.content,
    1 - (dc.embedding <=> query_embedding) as similarity
  from document_chunks dc
  join documents d on d.id = dc.document_id
  where dc.tenant_id = tenant_id_param
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;

-- Phase 2: Regulatory private multi-tenant schema
create extension if not exists pgcrypto;
create extension if not exists vector;

create type public.membership_role as enum ('owner', 'admin', 'qa', 'ra', 'writer', 'reader');
create type public.document_status as enum ('draft', 'in_review', 'approved', 'obsolete');
create type public.approval_decision as enum ('pending', 'approved', 'rejected');
create type public.approval_type as enum ('qa', 'ra', 'legal');
create type public.log_kind as enum ('query', 'generation', 'audit');

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_users (
  id uuid primary key,
  email text not null,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.app_users(id) on delete cascade,
  role membership_role not null,
  is_active boolean not null default true,
  created_by uuid references public.app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  created_by uuid not null references public.app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table if not exists public.regulatory_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  code text not null,
  title text not null,
  document_type text,
  default_status document_status not null default 'draft',
  created_by uuid not null references public.app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table if not exists public.document_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  regulatory_document_id uuid not null references public.regulatory_documents(id) on delete cascade,
  version text not null,
  status document_status not null default 'draft',
  is_current boolean not null default false,
  effective_date date not null,
  expiry_date date,
  source_file_path text not null,
  checksum text not null,
  created_by uuid not null references public.app_users(id),
  approved_by uuid references public.app_users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (regulatory_document_id, version),
  check (expiry_date is null or expiry_date >= effective_date)
);

create unique index if not exists uq_document_versions_current_per_doc
  on public.document_versions(regulatory_document_id)
  where is_current = true;

create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_version_id uuid not null references public.document_versions(id) on delete cascade,
  chunk_index integer not null,
  page_number integer,
  section_ref text,
  content text not null,
  checksum text not null,
  created_by uuid not null references public.app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_version_id, chunk_index)
);

create table if not exists public.document_embeddings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_chunk_id uuid not null references public.document_chunks(id) on delete cascade,
  embedding vector(1536) not null,
  model text not null,
  created_at timestamptz not null default now(),
  unique (document_chunk_id, model)
);

create index if not exists idx_document_embeddings_vector
  on public.document_embeddings
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create table if not exists public.document_tags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_version_id uuid not null references public.document_versions(id) on delete cascade,
  tag text not null,
  created_by uuid not null references public.app_users(id),
  created_at timestamptz not null default now(),
  unique (document_version_id, tag)
);

create table if not exists public.document_approvals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  document_version_id uuid not null references public.document_versions(id) on delete cascade,
  approval_stage approval_type not null,
  decision approval_decision not null default 'pending',
  comments text,
  approved_by uuid references public.app_users(id),
  decided_at timestamptz,
  created_by uuid not null references public.app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_version_id, approval_stage)
);

create table if not exists public.query_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references public.app_users(id),
  project_id uuid references public.projects(id),
  query_text text not null,
  filters jsonb not null default '{}'::jsonb,
  result_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.generation_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references public.app_users(id),
  project_id uuid references public.projects(id),
  template_id uuid,
  prompt text not null,
  output_summary text,
  status text not null default 'completed',
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references public.app_users(id),
  entity_name text not null,
  entity_id uuid,
  action text not null,
  previous_data jsonb,
  next_data jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  body text not null,
  is_active boolean not null default true,
  created_by uuid not null references public.app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table if not exists public.generated_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid references public.projects(id),
  template_id uuid references public.templates(id),
  generation_log_id uuid references public.generation_logs(id),
  title text not null,
  content text not null,
  status document_status not null default 'draft',
  source_file_path text,
  checksum text,
  created_by uuid not null references public.app_users(id),
  approved_by uuid references public.app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.generation_logs
  add constraint fk_generation_logs_template
  foreign key (template_id) references public.templates(id) on delete set null;

-- indexes
create index if not exists idx_memberships_user on public.organization_memberships(user_id, organization_id);
create index if not exists idx_projects_org on public.projects(organization_id);
create index if not exists idx_reg_docs_org on public.regulatory_documents(organization_id, code);
create index if not exists idx_doc_versions_doc on public.document_versions(regulatory_document_id, status, effective_date desc);
create index if not exists idx_doc_versions_org_status on public.document_versions(organization_id, status);
create index if not exists idx_doc_chunks_version on public.document_chunks(document_version_id, chunk_index);
create index if not exists idx_doc_tags_org on public.document_tags(organization_id, tag);
create index if not exists idx_doc_approvals_org on public.document_approvals(organization_id, approval_stage, decision);
create index if not exists idx_query_logs_org_created on public.query_logs(organization_id, created_at desc);
create index if not exists idx_generation_logs_org_created on public.generation_logs(organization_id, created_at desc);
create index if not exists idx_audit_logs_org_created on public.audit_logs(organization_id, created_at desc);
create index if not exists idx_templates_org_active on public.templates(organization_id, is_active);
create index if not exists idx_generated_documents_org_status on public.generated_documents(organization_id, status);

-- helpers
create or replace function public.current_user_org_ids()
returns setof uuid
language sql
stable
as $$
  select organization_id
  from public.organization_memberships
  where user_id = auth.uid() and is_active = true;
$$;

create or replace function public.same_org(org_id uuid)
returns boolean
language sql
stable
as $$
  select exists (select 1 from public.current_user_org_ids() o where o = org_id);
$$;

-- default document visibility excludes obsolete
create or replace view public.v_active_document_versions as
select dv.*
from public.document_versions dv
where dv.status <> 'obsolete';

-- RLS enable
alter table public.organizations enable row level security;
alter table public.app_users enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.projects enable row level security;
alter table public.regulatory_documents enable row level security;
alter table public.document_versions enable row level security;
alter table public.document_chunks enable row level security;
alter table public.document_embeddings enable row level security;
alter table public.document_tags enable row level security;
alter table public.document_approvals enable row level security;
alter table public.query_logs enable row level security;
alter table public.generation_logs enable row level security;
alter table public.audit_logs enable row level security;
alter table public.templates enable row level security;
alter table public.generated_documents enable row level security;

-- RLS policies
create policy "users read own profile"
on public.app_users for select
using (id = auth.uid());

create policy "users update own profile"
on public.app_users for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "members view organizations"
on public.organizations for select
using (public.same_org(id));

create policy "members view memberships"
on public.organization_memberships for select
using (public.same_org(organization_id));

create policy "admins manage memberships"
on public.organization_memberships for all
using (
  exists (
    select 1 from public.organization_memberships om
    where om.organization_id = organization_memberships.organization_id
      and om.user_id = auth.uid()
      and om.role in ('owner', 'admin')
      and om.is_active = true
  )
)
with check (
  exists (
    select 1 from public.organization_memberships om
    where om.organization_id = organization_memberships.organization_id
      and om.user_id = auth.uid()
      and om.role in ('owner', 'admin')
      and om.is_active = true
  )
);

create policy "org data access projects"
on public.projects for all
using (public.same_org(organization_id))
with check (public.same_org(organization_id));

create policy "org data access docs"
on public.regulatory_documents for all
using (public.same_org(organization_id))
with check (public.same_org(organization_id));

create policy "org data access doc versions"
on public.document_versions for all
using (public.same_org(organization_id))
with check (public.same_org(organization_id));

create policy "org data access chunks"
on public.document_chunks for all
using (public.same_org(organization_id))
with check (public.same_org(organization_id));

create policy "org data access embeddings"
on public.document_embeddings for all
using (public.same_org(organization_id))
with check (public.same_org(organization_id));

create policy "org data access tags"
on public.document_tags for all
using (public.same_org(organization_id))
with check (public.same_org(organization_id));

create policy "org data access approvals"
on public.document_approvals for all
using (public.same_org(organization_id))
with check (public.same_org(organization_id));

create policy "org data access query logs"
on public.query_logs for all
using (public.same_org(organization_id))
with check (public.same_org(organization_id));

create policy "org data access generation logs"
on public.generation_logs for all
using (public.same_org(organization_id))
with check (public.same_org(organization_id));

create policy "org data access audit logs"
on public.audit_logs for all
using (public.same_org(organization_id))
with check (public.same_org(organization_id));

create policy "org data access templates"
on public.templates for all
using (public.same_org(organization_id))
with check (public.same_org(organization_id));

create policy "org data access generated docs"
on public.generated_documents for all
using (public.same_org(organization_id))
with check (public.same_org(organization_id));

-- Minimal phase 2 seeds
insert into public.organizations (id, slug, name)
values
  ('11111111-1111-1111-1111-111111111111', 'org-a', 'Organization A'),
  ('22222222-2222-2222-2222-222222222222', 'org-b', 'Organization B')
on conflict (id) do nothing;

insert into public.app_users (id, email, full_name)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'alice@orga.test', 'Alice A'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bob@orgb.test', 'Bob B')
on conflict (id) do nothing;

insert into public.organization_memberships (organization_id, user_id, role, is_active)
values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'owner', true),
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'owner', true)
on conflict (organization_id, user_id) do nothing;

insert into public.projects (id, organization_id, code, name, created_by)
values
  ('31111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'CTD', 'CTD Core', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
on conflict (id) do nothing;

insert into public.regulatory_documents (id, organization_id, project_id, code, title, created_by)
values
  ('41111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '31111111-1111-1111-1111-111111111111', 'SOP-001', 'SOP Stability', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
on conflict (id) do nothing;

insert into public.document_versions (
  id, organization_id, regulatory_document_id, version, status, is_current, effective_date,
  source_file_path, checksum, created_by, approved_by, approved_at
)
values
  (
    '51111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '41111111-1111-1111-1111-111111111111',
    'v1.0',
    'approved',
    true,
    '2026-01-01',
    'org-a/sop-001/v1.pdf',
    'sha256-seed-v1',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    now()
  ),
  (
    '51111111-1111-1111-1111-111111111112',
    '11111111-1111-1111-1111-111111111111',
    '41111111-1111-1111-1111-111111111111',
    'v0.9',
    'obsolete',
    false,
    '2025-01-01',
    'org-a/sop-001/v0_9.pdf',
    'sha256-seed-v0_9',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    null,
    null
  )
on conflict (id) do nothing;

insert into public.document_chunks (
  id, organization_id, document_version_id, chunk_index, page_number, section_ref, content, checksum, created_by
)
values
  (
    '61111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    '51111111-1111-1111-1111-111111111111',
    0,
    1,
    '1.1',
    'Stability protocol requirements',
    'sha256-chunk-0',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  )
on conflict (document_version_id, chunk_index) do nothing;

insert into public.templates (id, organization_id, name, body, created_by)
values
  ('71111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'RA Memo', 'Template body', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
on conflict (id) do nothing;

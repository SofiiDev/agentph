-- Phase 2 required tests (run after migrations + seeds)
-- 1) user org A cannot read org B data
begin;
set local role authenticated;
set local "request.jwt.claim.sub" = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

do $$
declare
  visible_count integer;
begin
  select count(*) into visible_count
  from public.regulatory_documents
  where organization_id = '22222222-2222-2222-2222-222222222222';

  if visible_count <> 0 then
    raise exception 'Test 1 failed: org A can read org B documents';
  end if;
end $$;
rollback;

-- 2) obsolete documents are excluded by default view
begin;
do $$
declare
  c integer;
begin
  select count(*) into c
  from public.v_active_document_versions
  where status = 'obsolete';

  if c <> 0 then
    raise exception 'Test 2 failed: obsolete versions visible in default view';
  end if;
end $$;
rollback;

-- 3) only one current version per document
begin;
do $$
begin
  begin
    insert into public.document_versions (
      organization_id, regulatory_document_id, version, status, is_current, effective_date,
      source_file_path, checksum, created_by
    ) values (
      '11111111-1111-1111-1111-111111111111',
      '41111111-1111-1111-1111-111111111111',
      'v1.1',
      'approved',
      true,
      '2026-02-01',
      'org-a/sop-001/v1_1.pdf',
      'sha256-v1_1',
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    );

    raise exception 'Test 3 failed: allowed two current versions';
  exception
    when unique_violation then
      null;
  end;
end $$;
rollback;

-- 4) invalid inserts fail
begin;
do $$
begin
  begin
    insert into public.document_versions (
      organization_id, regulatory_document_id, version, status, is_current, effective_date,
      expiry_date, source_file_path, checksum, created_by
    ) values (
      '11111111-1111-1111-1111-111111111111',
      '41111111-1111-1111-1111-111111111111',
      'v_invalid',
      'draft',
      false,
      '2026-05-01',
      '2026-01-01',
      'org-a/sop-001/bad.pdf',
      'sha256-bad',
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    );

    raise exception 'Test 4 failed: invalid expiry/effective allowed';
  exception
    when check_violation then
      null;
  end;
end $$;
rollback;

-- 5) seeds loaded correctly
begin;
do $$
declare
  org_count integer;
  user_count integer;
  version_count integer;
begin
  select count(*) into org_count from public.organizations;
  select count(*) into user_count from public.app_users;
  select count(*) into version_count from public.document_versions;

  if org_count < 2 or user_count < 2 or version_count < 2 then
    raise exception 'Test 5 failed: seeds missing required baseline data';
  end if;
end $$;
rollback;

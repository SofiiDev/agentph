import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { ACTIVE_DOCUMENT_FILTER, buildDefaultDocumentVersionsQuery } from '@/server/db/schema';

describe('phase2 schema helpers', () => {
  it('default filter excludes obsolete', () => {
    expect(ACTIVE_DOCUMENT_FILTER).toContain("status <> 'obsolete'");
    const query = buildDefaultDocumentVersionsQuery('org-id');
    expect(query.filters.status_not).toBe('obsolete');
  });

  it('migration enforces one current version', () => {
    const migration = readFileSync('supabase/migrations/20260408120000_phase2_regulatory_schema.sql', 'utf8');
    expect(migration).toContain('uq_document_versions_current_per_doc');
    expect(migration).toContain('where is_current = true');
  });
});

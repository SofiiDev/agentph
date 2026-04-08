import { describe, expect, it } from 'vitest';
import { buildListFilters } from '../ingestion/listing';

describe('api-documents-list filters', () => {
  it('otro tenant no ve archivos (filtro por organization_id)', () => {
    const filters = buildListFilters('org-tenant-a');
    expect(filters.organization_id).toBe('eq.org-tenant-a');
  });
});

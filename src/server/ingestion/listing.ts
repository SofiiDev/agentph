export const buildListFilters = (tenantId: string) => ({
  select: 'id,version,status,processing_status,source_file_path,created_at,organization_id',
  organization_id: `eq.${tenantId}`,
  order: 'created_at.desc'
});

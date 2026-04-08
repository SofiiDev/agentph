export type DocumentStatus = 'draft' | 'in_review' | 'approved' | 'obsolete';
export type MembershipRole = 'owner' | 'admin' | 'qa' | 'ra' | 'writer' | 'reader';
export type ApprovalDecision = 'pending' | 'approved' | 'rejected';
export type ApprovalType = 'qa' | 'ra' | 'legal';

export interface OrganizationRow {
  id: string;
  slug: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RegulatoryDocumentRow {
  id: string;
  organization_id: string;
  project_id: string | null;
  code: string;
  title: string;
  document_type: string | null;
  default_status: DocumentStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentVersionRow {
  id: string;
  organization_id: string;
  regulatory_document_id: string;
  version: string;
  status: DocumentStatus;
  is_current: boolean;
  effective_date: string;
  expiry_date: string | null;
  source_file_path: string;
  checksum: string;
  created_by: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export type DbTableMap = {
  organizations: OrganizationRow;
  regulatory_documents: RegulatoryDocumentRow;
  document_versions: DocumentVersionRow;
};

export const ACTIVE_DOCUMENT_FILTER = `status <> 'obsolete'`;

export const buildDefaultDocumentVersionsQuery = (organizationId: string) => {
  return {
    table: 'document_versions' as const,
    select: '*',
    filters: {
      organization_id: organizationId,
      status_not: 'obsolete' as DocumentStatus
    }
  };
};

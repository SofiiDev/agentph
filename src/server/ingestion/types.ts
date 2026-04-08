export type AllowedMime = 'application/pdf' | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' | 'text/plain';

export type UploadInput = {
  fileName: string;
  mimeType: string;
  fileBase64: string;
  projectId?: string;
  dedupeByChecksum?: boolean;
};

export type IngestionStatus = 'uploading' | 'processing' | 'ready' | 'failed';

export type ParsedDocument = {
  fullText: string;
  pageMap: Array<{ pageNumber: number; text: string }>;
};

export type ChunkRow = {
  chunkIndex: number;
  pageNumber: number | null;
  sectionRef: string | null;
  content: string;
  checksum: string;
};

import { AppError } from '../errors';
import type { ParsedDocument } from './types';

const normalize = (value: string) => value.replace(/\u0000/g, ' ').replace(/\s+/g, ' ').trim();

const parseTxt = (buffer: Buffer): ParsedDocument => {
  const text = normalize(buffer.toString('utf8'));
  return { fullText: text, pageMap: [{ pageNumber: 1, text }] };
};

const parsePdfHeuristic = (buffer: Buffer): ParsedDocument => {
  const ascii = buffer.toString('latin1');
  const text = normalize(ascii.replace(/[^\x20-\x7E\n\r\t]/g, ' '));
  if (!text) {
    throw new AppError('PARSING_ERROR', 'No se pudo extraer texto de PDF', 422);
  }
  return { fullText: text, pageMap: [{ pageNumber: 1, text }] };
};

const parseDocxHeuristic = (buffer: Buffer): ParsedDocument => {
  const ascii = buffer.toString('latin1');
  const text = normalize(ascii.replace(/[^\x20-\x7E\n\r\t]/g, ' '));
  if (!text) {
    throw new AppError('PARSING_ERROR', 'No se pudo extraer texto de DOCX', 422);
  }
  return { fullText: text, pageMap: [{ pageNumber: 1, text }] };
};

export const parseDocumentByMime = (mimeType: string, buffer: Buffer): ParsedDocument => {
  if (mimeType === 'text/plain') {
    return parseTxt(buffer);
  }

  if (mimeType === 'application/pdf') {
    return parsePdfHeuristic(buffer);
  }

  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return parseDocxHeuristic(buffer);
  }

  throw new AppError('UNSUPPORTED_FILE_TYPE', 'Tipo de archivo no soportado para parser', 400);
};

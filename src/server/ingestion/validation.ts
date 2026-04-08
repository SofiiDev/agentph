import { AppError } from '../errors';
import { getServerEnv } from '../env';
import type { AllowedMime, UploadInput } from './types';

const allowedMimes: AllowedMime[] = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain'
];

export const validateUploadInput = (input: UploadInput) => {
  const env = getServerEnv();

  if (!allowedMimes.includes(input.mimeType as AllowedMime)) {
    throw new AppError('UNSUPPORTED_FILE_TYPE', 'Tipo de archivo no permitido', 400, {
      mimeType: input.mimeType,
      allowedMimes
    });
  }

  const fileBuffer = Buffer.from(input.fileBase64, 'base64');
  if (fileBuffer.byteLength > env.MAX_UPLOAD_BYTES) {
    throw new AppError('FILE_TOO_LARGE', 'Archivo excede límite permitido', 400, {
      maxBytes: env.MAX_UPLOAD_BYTES,
      size: fileBuffer.byteLength
    });
  }

  return fileBuffer;
};

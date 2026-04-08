import { assertEnvLoaded } from '../../src/server/env';
import { withApiHandler } from '../../src/server/handler';
import { getAuthUserFromEvent } from '../../src/server/auth';
import { enforceRateLimit } from '../../src/server/rate-limit';
import { jsonOk } from '../../src/server/json-response';
import { createUpload } from '../../src/server/ingestion/service';
import { uploadRequestSchema } from '../../src/server/api-schemas';
import { AppError } from '../../src/server/errors';

assertEnvLoaded();

export const handler = withApiHandler(async (event, requestId) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ ok: false, requestId }), headers: { 'Content-Type': 'application/json' } };
  }

  const user = getAuthUserFromEvent(event);
  enforceRateLimit(`upload:${event.headers?.['x-forwarded-for'] ?? user.userId}`);

  const parsed = uploadRequestSchema.safeParse(JSON.parse(event.body ?? '{}'));
  if (!parsed.success) {
    throw new AppError('INVALID_REQUEST', 'Payload inválido', 400, parsed.error.flatten());
  }

  const upload = await createUpload(user.tenantId, user.userId, parsed.data);

  return jsonOk(requestId, upload, 202);
});

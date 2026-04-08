import { assertEnvLoaded } from '../../src/server/env';
import { withApiHandler } from '../../src/server/handler';
import { getAuthUserFromEvent } from '../../src/server/auth';
import { enforceRateLimit } from '../../src/server/rate-limit';
import { jsonOk } from '../../src/server/json-response';
import { createUpload } from '../../src/server/ingestion/service';

assertEnvLoaded();

export const handler = withApiHandler(async (event, requestId) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ ok: false, requestId }), headers: { 'Content-Type': 'application/json' } };
  }

  const user = getAuthUserFromEvent(event);
  enforceRateLimit(`upload:${event.headers?.['x-forwarded-for'] ?? user.userId}`);

  const payload = JSON.parse(event.body ?? '{}') as {
    fileName: string;
    mimeType: string;
    fileBase64: string;
    projectId?: string;
    dedupeByChecksum?: boolean;
  };

  const upload = await createUpload(user.tenantId, user.userId, payload);

  return jsonOk(requestId, upload, 202);
});

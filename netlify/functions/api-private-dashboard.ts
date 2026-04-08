import { assertEnvLoaded } from '../../src/server/env';
import { withApiHandler } from '../../src/server/handler';
import { jsonOk } from '../../src/server/json-response';
import { MethodNotAllowedError } from '../../src/server/errors';
import { getAuthUserFromEvent } from '../../src/server/auth';
import { enforceRateLimit } from '../../src/server/rate-limit';

assertEnvLoaded();

export const handler = withApiHandler(async (event, requestId) => {
  if (event.httpMethod !== 'GET') {
    throw new MethodNotAllowedError();
  }

  const ip = event.headers?.['x-forwarded-for'] ?? 'unknown';
  enforceRateLimit(`private-dashboard:${ip}`);

  const user = getAuthUserFromEvent(event);

  return jsonOk(requestId, {
    tenantId: user.tenantId,
    cards: []
  });
});

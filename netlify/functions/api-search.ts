import { assertEnvLoaded } from '../../src/server/env';
import { withApiHandler } from '../../src/server/handler';
import { getAuthUserFromEvent } from '../../src/server/auth';
import { jsonOk } from '../../src/server/json-response';
import { enforceRateLimit } from '../../src/server/rate-limit';
import { searchRelevantChunks } from '../../src/server/search';
import { searchRequestSchema } from '../../src/server/api-schemas';
import { AppError } from '../../src/server/errors';

assertEnvLoaded();

export const handler = withApiHandler(async (event, requestId) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ ok: false, requestId }), headers: { 'Content-Type': 'application/json' } };
  }

  const user = getAuthUserFromEvent(event);
  enforceRateLimit(`search:${event.headers?.['x-forwarded-for'] ?? user.userId}`);

  const parsed = searchRequestSchema.safeParse(JSON.parse(event.body ?? '{}'));
  if (!parsed.success) {
    throw new AppError('INVALID_REQUEST', 'Payload inválido', 400, parsed.error.flatten());
  }

  const results = await searchRelevantChunks(parsed.data.query, {
    organizationId: user.tenantId,
    ...parsed.data.filters
  });

  return jsonOk(requestId, { results });
});

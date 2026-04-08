import { assertEnvLoaded } from '../../src/server/env';
import { withApiHandler } from '../../src/server/handler';
import { getAuthUserFromEvent } from '../../src/server/auth';
import { enforceRateLimit } from '../../src/server/rate-limit';
import { jsonOk } from '../../src/server/json-response';
import { askRegulatoryQuestion } from '../../src/server/ask';
import { askRequestSchema } from '../../src/server/api-schemas';
import { AppError } from '../../src/server/errors';

assertEnvLoaded();

export const handler = withApiHandler(async (event, requestId) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ ok: false, requestId }), headers: { 'Content-Type': 'application/json' } };
  }

  const user = getAuthUserFromEvent(event);
  enforceRateLimit(`ask:${event.headers?.['x-forwarded-for'] ?? user.userId}`);

  const parsed = askRequestSchema.safeParse(JSON.parse(event.body ?? '{}'));
  if (!parsed.success) {
    throw new AppError('INVALID_REQUEST', 'Payload inválido', 400, parsed.error.flatten());
  }

  const result = await askRegulatoryQuestion({
    organizationId: user.tenantId,
    userId: user.userId,
    question: parsed.data.question,
    topK: parsed.data.topK,
    onlyApproved: parsed.data.onlyApproved
  });

  return jsonOk(requestId, result);
});

import { assertEnvLoaded } from '../../src/server/env';
import { withApiHandler } from '../../src/server/handler';
import { jsonOk } from '../../src/server/json-response';

assertEnvLoaded();

export const handler = withApiHandler(async (_event, requestId) => {
  return jsonOk(requestId, {
    service: 'regulatory-evidence-copilot',
    status: 'ok'
  });
});

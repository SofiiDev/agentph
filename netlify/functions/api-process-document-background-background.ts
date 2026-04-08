import { withApiHandler } from '../../src/server/handler';
import { processIngestionJob } from '../../src/server/ingestion/service';
import { jsonOk } from '../../src/server/json-response';

export const handler = withApiHandler(async (event, requestId) => {
  const payload = JSON.parse(event.body ?? '{}') as { jobId: string };
  const result = await processIngestionJob(payload.jobId);
  return jsonOk(requestId, result, 202);
});

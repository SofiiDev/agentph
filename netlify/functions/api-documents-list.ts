import { assertEnvLoaded } from '../../src/server/env';
import { withApiHandler } from '../../src/server/handler';
import { getAuthUserFromEvent } from '../../src/server/auth';
import { jsonOk } from '../../src/server/json-response';
import { getSupabaseAdminClient } from '../../src/server/supabase-admin';
import { buildListFilters } from '../../src/server/ingestion/listing';

assertEnvLoaded();

export const handler = withApiHandler(async (event, requestId) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ ok: false, requestId }), headers: { 'Content-Type': 'application/json' } };
  }

  const user = getAuthUserFromEvent(event);
  const supabase = getSupabaseAdminClient();

  const rows = await supabase.select('document_versions', buildListFilters(user.tenantId));

  return jsonOk(requestId, { items: rows });
});

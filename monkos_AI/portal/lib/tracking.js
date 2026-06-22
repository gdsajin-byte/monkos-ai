import { BigQuery } from '@google-cloud/bigquery';
import { log } from './shared/config.js';

const PROJECT_ID = process.env.PROJECT_ID || 'monkos';
const bq = new BigQuery({ projectId: PROJECT_ID });
const dataset = bq.dataset('monkos_tracking');
const eventsTable = dataset.table('events');
const identityTable = dataset.table('identity_map');

export async function trackEvent({ eventName, userId, sessionId, pagePath, lang, region, service, referer, userAgent, ipCountry, params }) {
  const now = new Date();
  const row = {
    event_id: crypto.randomUUID(),
    event_name: eventName,
    event_timestamp: now.toISOString(),
    event_date: now.toISOString().slice(0, 10),
    user_id: userId || null,
    session_id: sessionId || null,
    page_path: pagePath || null,
    lang: lang || null,
    region: region || null,
    service: service || 'portal',
    referer: referer || null,
    user_agent: userAgent || null,
    ip_country: ipCountry || null,
    params: params ? JSON.stringify(params) : null,
  };

  try {
    await eventsTable.insert([row]);
  } catch (err) {
    log(`[BQ] 이벤트 적재 실패: ${err.message}`, 'WARNING');
  }
}

export async function linkIdentity(sessionId, userId) {
  try {
    await identityTable.insert([{
      session_id: sessionId,
      user_id: userId,
      linked_at: new Date().toISOString(),
    }]);
  } catch (err) {
    log(`[BQ] identity 매핑 실패: ${err.message}`, 'WARNING');
  }
}

export { bq, dataset };

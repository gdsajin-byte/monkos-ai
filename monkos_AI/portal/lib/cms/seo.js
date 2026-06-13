/**
 * SEO 유틸 — Google Indexing API
 */
import { GoogleAuth } from 'google-auth-library';
import { log } from '../shared/config.js';

let indexingCount = 0;
let indexingCountDate = new Date().toISOString().substring(0, 10);

export async function requestIndexing(url) {
  const today = new Date().toISOString().substring(0, 10);
  if (today !== indexingCountDate) {
    indexingCount = 0;
    indexingCountDate = today;
  }
  indexingCount++;
  if (indexingCount >= 180) {
    log(`[SEO] Indexing 쿼터 근접 ${indexingCount}/200`, 'WARN');
  }

  try {
    const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/indexing'] });
    const client = await auth.getClient();
    const res = await client.request({
      url: 'https://indexing.googleapis.com/v3/urlNotifications:publish',
      method: 'POST',
      data: { url, type: 'URL_UPDATED' },
    });
    log(`[SEO] Indexing API 성공 (${indexingCount}/200): ${url} → ${res.status}`);
  } catch (e) {
    const status = e.response?.status || e.code;
    if (status === 403) {
      log(`[SEO] Indexing 권한거부(403): ${url} — ${e.message}`, 'ERROR');
    } else if (status === 429) {
      log(`[SEO] Indexing 쿼터초과(429): ${url} — ${e.message}`, 'WARN');
    } else {
      log(`[SEO] Indexing API 실패(${status || 'unknown'}): ${url} — ${e.message}`, 'WARN');
    }
  }
}

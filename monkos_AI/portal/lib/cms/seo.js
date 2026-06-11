/**
 * SEO 유틸 — Google Indexing API + Sitemap ping
 */
import { GoogleAuth } from 'google-auth-library';
import { log } from '../shared/config.js';

export async function requestIndexing(url) {
  try {
    const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/indexing'] });
    const client = await auth.getClient();
    const res = await client.request({
      url: 'https://indexing.googleapis.com/v3/urlNotifications:publish',
      method: 'POST',
      data: { url, type: 'URL_UPDATED' },
    });
    log(`[SEO] Indexing API 성공: ${url} → ${res.status}`);
  } catch (e) {
    log(`[SEO] Indexing API 실패: ${url} — ${e.message}`, 'WARN');
  }
}

export function pingSitemap() {
  fetch('https://www.google.com/ping?sitemap=https://monkos.ai/sitemap.xml').catch(() => {});
}

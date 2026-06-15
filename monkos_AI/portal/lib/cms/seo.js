/**
 * SEO 유틸 — Google Indexing API + IndexNow
 *
 * Google Indexing API: 공식적으로 JobPosting/BroadcastEvent 전용.
 * 블로그·specs 등 비대상 URL에는 실질 효과 미확인이나 병행 유지.
 * IndexNow: 네이버·빙·얀덱스·Seznam·Yep 5개 엔진 동시 통지.
 */
import { GoogleAuth } from 'google-auth-library';
import { log } from '../shared/config.js';

const INDEXNOW_KEY = '4d5a87a9-af3e-44ee-a08c-0d9d63e5ac4e';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

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

/**
 * IndexNow — 네이버·빙·얀덱스·Seznam·Yep 동시 통지
 * @param {string|string[]} urls - 단일 URL 또는 URL 배열 (최대 10,000)
 */
export async function requestIndexNow(urls) {
  const urlList = Array.isArray(urls) ? urls : [urls];
  if (urlList.length === 0) return;

  const host = new URL(urlList[0]).host;
  const keyLocation = `https://${host}/${INDEXNOW_KEY}.txt`;

  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host,
        key: INDEXNOW_KEY,
        keyLocation,
        urlList,
      }),
    });

    if (res.ok || res.status === 202) {
      log(`[SEO] IndexNow 성공 (${urlList.length}건): ${urlList[0]}${urlList.length > 1 ? ` 외 ${urlList.length - 1}건` : ''} → ${res.status}`);
    } else {
      const body = await res.text().catch(() => '');
      log(`[SEO] IndexNow 실패(${res.status}): ${urlList[0]} — ${body}`, 'WARN');
    }
  } catch (e) {
    log(`[SEO] IndexNow 에러: ${urlList[0]} — ${e.message}`, 'WARN');
  }
}

/**
 * 검색엔진 통합 통지 — Google Indexing API + IndexNow 병렬 호출
 * @param {string|string[]} urls - 단일 URL 또는 URL 배열
 */
export async function notifySearchEngines(urls) {
  const urlList = Array.isArray(urls) ? urls : [urls];
  await Promise.allSettled([
    ...urlList.map(u => requestIndexing(u)),
    requestIndexNow(urlList),
  ]);
}

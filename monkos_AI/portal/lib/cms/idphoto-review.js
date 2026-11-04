import { Storage } from '@google-cloud/storage';
import { firestore, log } from '../shared/config.js';
import { requireAdmin } from './admin-auth.js';
import { resolveCreditSource } from '../credit-source.js';
import { isTestGeneration } from '../gen-origin.js';

/** 탭·테스트 필터 (순수 함수 — 테스트 대상) */
export function keepGeneration(d, { service, includeTest }) {
  if (!includeTest && isTestGeneration(d)) return false;
  if (service === 'kr') return !d.slug || d.slug.startsWith('kr-');
  if (service === 'jp') return !!d.slug && d.slug.startsWith('jp-');
  return true;
}

/**
 * createdAt 내림차순 원 쿼리를 묶음으로 읽으며 keep을 통과한 문서를 limit개까지 모은다.
 * hasMore = 보이는 문서가 limit을 넘었거나, 원 쿼리가 끝나지 않았는데 라운드 상한에 걸림.
 * 커서는 클라이언트가 마지막 반환 문서의 createdAt을 넘긴다 — 그 뒤 숨김 문서는 다음 쪽에서 다시 걸러진다.
 */
export async function collectVisible({ fetchPage, after, limit, keep, batch = Math.max(limit * 3, 60), maxRounds = 5 }) {
  const out = [];
  let cursor = after || null, hiddenTest = 0, exhausted = false, rounds = 0;
  while (out.length <= limit && rounds < maxRounds) {
    rounds++;
    const page = await fetchPage(cursor, batch);
    for (const d of page) {
      if (keep(d)) { out.push(d); if (out.length > limit) break; }
      else if (isTestGeneration(d)) hiddenTest++;
    }
    if (page.length < batch) { exhausted = true; break; }
    cursor = page[page.length - 1].createdAt;
  }
  return { docs: out.slice(0, limit), hasMore: out.length > limit || !exhausted, hiddenTest };
}

const CUSTOMER_GCS_BUCKET = process.env.CUSTOMER_GCS_BUCKET || 'monk-customer-photos';
const storage = new Storage();
const customerBucket = storage.bucket(CUSTOMER_GCS_BUCKET);

const gensCol = firestore.collection('generations');
const SIGNED_URL_TTL = 60 * 60 * 1000;

export async function handleIdphotoResults(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  const url = new URL(req.url, `http://${req.headers.host}`);
  const service = url.searchParams.get('service') || 'kr';
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '40', 10) || 40, 1), 200);
  const after = url.searchParams.get('after') || null;

  // 테스트 딱지 (ORDER_20261105): 기본 숨김, includeTest=1이면 포함. 필드 없는 과거 문서는 고객 기록으로 본다.
  const includeTest = url.searchParams.get('includeTest') === '1';

  try {
    let base;
    if (service === 'headshot') base = gensCol.where('service', '==', 'headshot');
    else if (service === 'all') base = gensCol;
    else base = gensCol.where('service', '==', 'idphoto');
    // 복합 색인 없이(기존 service+createdAt 그대로) 서버에서 거른다 — 숨김으로 모자라면 다음 묶음을 더 읽는다
    const { docs: visible, hasMore, hiddenTest } = await collectVisible({
      fetchPage: async (cursor, n) => {
        let q = base.orderBy('createdAt', 'desc');
        if (cursor) q = q.startAfter(cursor);
        return (await q.limit(n).get()).docs.map((d) => d.data());
      },
      after, limit, keep: (d) => keepGeneration(d, { service, includeTest }),
    });
    const sliced = visible;
    const results = await Promise.all(sliced.map(async (doc) => {
      const [originalUrl, generatedUrl, creditSource] = await Promise.all([
        signUrl(doc.gcsOriginal),
        signUrl(doc.gcsGenerated),
        // 기록 시점 스냅샷 우선. 09-26 이전 기록은 생성 시각 기준으로 읽기 시 판정(소급 없음)
        doc.gate === 'credits'
          ? (doc.creditSource || resolveCreditSource(doc.userId, doc.createdAt || null))
          : Promise.resolve(null),
      ]);
      return {
        userId: doc.userId || 'unknown',
        style: doc.style || '',
        slug: doc.slug || '',
        channel: doc.channel || '',
        created: doc.createdAt || '',
        gate: doc.gate || null,
        creditSource: creditSource || null,
        authenticated: !!doc.authenticated,
        sessionId: doc.sessionId || null,
        originalUrl,
        generatedUrl,
        hasT1: !!doc.gcsT1Raw,
        complete: !!(originalUrl && generatedUrl),
        originService: doc.originService || null,
        isTest: isTestGeneration(doc),
        testReason: doc.testReason || (isTestGeneration(doc) ? 'dev_service' : null),
      };
    }));

    log(`[ADMIN] idphoto 리뷰: ${service} ${results.length}건 (테스트 ${includeTest ? '포함' : `숨김 ${hiddenTest}`}) (agent=${admin.isAgent ? admin.userId : 'cookie'})`);
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    });
    res.end(JSON.stringify({ service, count: results.length, hasMore, includeTest, hiddenTest, results }));
  } catch (err) {
    log(`[ADMIN] idphoto 리뷰 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

async function signUrl(gcsPath) {
  if (!gcsPath) return null;
  try {
    const [u] = await customerBucket.file(gcsPath).getSignedUrl({
      action: 'read',
      expires: Date.now() + SIGNED_URL_TTL,
    });
    return u;
  } catch {
    return null;
  }
}

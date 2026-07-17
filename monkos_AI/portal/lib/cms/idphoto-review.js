import { Storage } from '@google-cloud/storage';
import { firestore, log } from '../shared/config.js';
import { requireAdmin } from './admin-auth.js';

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

  try {
    let query;

    if (service === 'headshot') {
      query = gensCol.where('service', '==', 'headshot');
    } else if (service === 'all') {
      query = gensCol;
    } else {
      query = gensCol.where('service', '==', 'idphoto');
    }

    query = query.orderBy('createdAt', 'desc');

    if (after) {
      query = query.startAfter(after);
    }

    const fetchLimit = (service === 'kr' || service === 'jp') ? limit * 3 : limit + 1;
    query = query.limit(fetchLimit);

    const snap = await query.get();
    let docs = snap.docs.map(d => d.data());

    if (service === 'kr') {
      docs = docs.filter(d => !d.slug || d.slug.startsWith('kr-'));
    } else if (service === 'jp') {
      docs = docs.filter(d => d.slug && d.slug.startsWith('jp-'));
    }

    const hasMore = docs.length > limit;
    const sliced = docs.slice(0, limit);

    const results = await Promise.all(sliced.map(async (doc) => {
      const [originalUrl, generatedUrl] = await Promise.all([
        signUrl(doc.gcsOriginal),
        signUrl(doc.gcsGenerated),
      ]);
      return {
        userId: doc.userId || 'unknown',
        style: doc.style || '',
        slug: doc.slug || '',
        channel: doc.channel || '',
        created: doc.createdAt || '',
        originalUrl,
        generatedUrl,
        hasT1: !!doc.gcsT1Raw,
        complete: !!(originalUrl && generatedUrl),
      };
    }));

    log(`[ADMIN] idphoto 리뷰: ${service} ${results.length}건 (agent=${admin.isAgent ? admin.userId : 'cookie'})`);
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    });
    res.end(JSON.stringify({ service, count: results.length, hasMore, results }));
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

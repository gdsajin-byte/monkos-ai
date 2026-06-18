/**
 * 어드민 — idphoto 결과물 리뷰 핸들러
 * 버킷(monk-ai-images)의 원본↔결과물을 짝지어 Signed URL로 반환한다.
 * 경로 규약: service/idphoto/{kr|jp}/{userId}/{timestamp}_{original|generated}.{ext}
 *   (idphoto-kr/jp 의 gcs-save.js saveImages() 와 동일 규약)
 *
 * 용도: 버킷 직접 열람의 번거로움 해소 + 프리뷰 품질(정체성 보존) 내부 QA.
 * 접근: 어드민 전용 (requireAdmin). 고객 얼굴 원본이므로 인증 뒤에만 노출.
 */
import { Storage } from '@google-cloud/storage';
import { GCS_BUCKET, log } from '../shared/config.js';
import { requireAdmin } from './admin-auth.js';

const storage = new Storage();
const bucket = storage.bucket(GCS_BUCKET);

const SERVICE_PREFIX = {
  kr: 'service/idphoto/kr/',
  jp: 'service/idphoto/jp/',
};

// Signed URL 만료 — 리뷰 1세션용 짧게 (1시간)
const SIGNED_URL_TTL = 60 * 60 * 1000;

// 파일명: {timestamp}_{kind}.{ext} — timestamp 에는 '_' 가 없으므로 비탐욕 매칭 안전
const NAME_RE = /^service\/idphoto\/(?:kr|jp)\/([^/]+)\/(.+?)_(original|generated)\.(?:jpg|jpeg|png|webp)$/i;

export async function handleIdphotoResults(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  const url = new URL(req.url, `http://${req.headers.host}`);
  const service = url.searchParams.get('service') === 'jp' ? 'jp' : 'kr';
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '40', 10) || 40, 1), 200);

  try {
    const [files] = await bucket.getFiles({ prefix: SERVICE_PREFIX[service] });

    // userId + timestamp 프리픽스로 원본↔결과물 짝맞춤
    const pairs = new Map(); // key: `${userId}/${timestamp}`
    for (const f of files) {
      const m = f.name.match(NAME_RE);
      if (!m) continue;
      const [, userId, ts, kind] = m;
      const key = `${userId}/${ts}`;
      if (!pairs.has(key)) {
        pairs.set(key, { userId, timestamp: ts, original: null, generated: null, created: f.metadata.timeCreated });
      }
      const entry = pairs.get(key);
      entry[kind] = f;
      // 원본 생성시각(가장 이른 값)을 대표 시각으로
      if (f.metadata.timeCreated < entry.created) entry.created = f.metadata.timeCreated;
    }

    // 최신순 → limit 컷 (Signed URL 발급은 컷 이후에만, 비용/속도)
    const sorted = [...pairs.values()]
      .sort((a, b) => new Date(b.created) - new Date(a.created))
      .slice(0, limit);

    const signed = async (file) => {
      if (!file) return null;
      const [u] = await file.getSignedUrl({ action: 'read', expires: Date.now() + SIGNED_URL_TTL });
      return u;
    };

    const results = await Promise.all(sorted.map(async (p) => {
      const [originalUrl, generatedUrl] = await Promise.all([signed(p.original), signed(p.generated)]);
      return {
        userId: p.userId,
        timestamp: p.timestamp,
        created: p.created,
        originalUrl,
        generatedUrl,
        complete: !!(originalUrl && generatedUrl),
      };
    }));

    log(`[ADMIN] idphoto 리뷰: ${service} ${results.length}쌍 (agent=${admin.isAgent ? admin.userId : 'cookie'})`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ service, count: results.length, results }));
  } catch (err) {
    log(`[ADMIN] idphoto 리뷰 목록 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

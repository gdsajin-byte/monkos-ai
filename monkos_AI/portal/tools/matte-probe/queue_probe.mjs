// 줄 세우기 실측 — runMatteChain 정본을 N건 동시 호출해 폴백 건수·최장 대기를 잰다.
// 시크릿은 stdin 3줄(MATTE_SECRET / RUNPOD_API_KEY / AUTH_SECRET). 값 출력 금지.
// 사용: { secret.sh get ...; } | node queue_probe.mjs [N]
import { readFileSync } from 'fs';
import sharp from 'sharp';

const [s1, s2, s3] = readFileSync(0, 'utf8').split('\n');
process.env.MATTE_SECRET = (s1 || '').trim();
process.env.MATTE_API_KEY = (s2 || '').trim();
process.env.AUTH_SECRET = (s3 || '').trim();
process.env.MATTE_API_URLS = 'https://matte.monkos.ai,https://api.runpod.ai/v2/di9upymdumei34';
process.env.PROJECT_ID = 'monkos';
process.env.LOCATION = 'us-central1';
process.env.GCS_BUCKET = 'monk-ai-images';

const N = Number(process.argv[2] || 16);
const { runMatteChain } = await import('../../lib/matte.js');

const crop = await sharp({
  create: { width: 1200, height: 1600, channels: 3, background: { r: 200, g: 205, b: 215 } },
}).jpeg({ quality: 92 }).toBuffer();
const cropB64 = crop.toString('base64');

const t0 = Date.now();
const results = await Promise.all(
  Array.from({ length: N }, async (_, i) => {
    const s = Date.now();
    const r = await runMatteChain(cropB64, '#FFFFFF', `queue-probe-${i}`);
    return { i, ms: Date.now() - s, via: r?.via ?? null, ok: !!r };
  }),
);
const wall = Date.now() - t0;

const viaCount = {};
for (const r of results) viaCount[r.via ?? 'FAIL'] = (viaCount[r.via ?? 'FAIL'] || 0) + 1;
const times = results.map((r) => r.ms).sort((a, b) => a - b);
console.log(JSON.stringify({
  n: N,
  wall_ms: wall,
  via: viaCount,
  fallback_to_runpod: viaCount.runpod || 0,
  failed: viaCount.FAIL || 0,
  per_request_ms: { min: times[0], median: times[Math.floor(times.length / 2)], max: times[times.length - 1] },
  all_ms: times,
}, null, 2));

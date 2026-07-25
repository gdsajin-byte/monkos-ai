// 폴백 실측 — runMatteChain 정본을 그대로 태워 4060 503 → RunPod 성공 시간을 잰다.
// 시크릿은 stdin 2줄로만 받는다 (1줄=MATTE_SECRET, 2줄=RUNPOD_API_KEY). 값 출력 금지.
import { readFileSync } from 'fs';
import sharp from 'sharp';

const [s1, s2, s3] = readFileSync(0, 'utf8').split('\n');
process.env.MATTE_SECRET = (s1 || '').trim();
process.env.MATTE_API_KEY = (s2 || '').trim();
process.env.MATTE_API_URLS = 'https://matte.monkos.ai,https://api.runpod.ai/v2/di9upymdumei34';
process.env.AUTH_SECRET = (s3 || '').trim();
process.env.PROJECT_ID = 'monkos';
process.env.LOCATION = 'us-central1';
process.env.GCS_BUCKET = 'monk-ai-images';

const { runMatteChain } = await import('../../lib/matte.js');

const crop = await sharp({
  create: { width: 1200, height: 1600, channels: 3, background: { r: 200, g: 205, b: 215 } },
}).jpeg({ quality: 92 }).toBuffer();
const cropB64 = crop.toString('base64');

const t0 = Date.now();
const res = await runMatteChain(cropB64, '#FFFFFF', 'probe-4060-guard');
const ms = Date.now() - t0;
console.log(JSON.stringify({
  total_ms: ms,
  via: res?.via ?? null,
  matteSec: res?.matteSec ?? null,
  ok: !!res,
}));

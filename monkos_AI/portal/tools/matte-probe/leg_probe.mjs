// 4060 레그 단독 계측 — 포화 상태에서 isAlive(/health) + 503 + 재시도 503 의 소요.
// 시크릿은 stdin 1줄(MATTE_SECRET). 값 출력 금지.
import { readFileSync } from 'fs';
import sharp from 'sharp';

const secret = readFileSync(0, 'utf8').split('\n')[0].trim();
const BASE = 'https://matte.monkos.ai';

const crop = await sharp({
  create: { width: 1200, height: 1600, channels: 3, background: { r: 200, g: 205, b: 215 } },
}).jpeg({ quality: 92 }).toBuffer();
const body = JSON.stringify({ image: crop.toString('base64'), bgColor: '#FFFFFF' });

async function timed(fn) {
  const t = Date.now();
  const r = await fn();
  return { ms: Date.now() - t, ...r };
}

const health = await timed(async () => {
  const res = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(2500) });
  return { status: res.status };
});
const call1 = await timed(async () => {
  const res = await fetch(`${BASE}/api/matte`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Matte-Secret': secret }, body,
  });
  return { status: res.status };
});
const call2 = await timed(async () => {
  const res = await fetch(`${BASE}/api/matte`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Matte-Secret': secret }, body,
  });
  return { status: res.status };
});

console.log(JSON.stringify({
  health, call1, call2,
  leg_4060_total_ms: health.ms + call1.ms + call2.ms,
}));

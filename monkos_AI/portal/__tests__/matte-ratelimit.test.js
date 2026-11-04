/**
 * matte 체인 429(요청 과다) 백오프 테스트 — ORDER_20261104 RunPod429백오프
 * fetch 목만 사용 (RunPod 실호출·키 접촉 없음). env를 import 전에 주입해야 하므로 별도 스위트.
 * 체인 = 자체 서버(http://matte.test) → RunPod(api.runpod.ai). 큐 예산은 테스트용 3000ms.
 */

import { jest } from '@jest/globals';
import sharp from 'sharp';

const PRIMARY = 'http://matte.test';
const RUNPOD = 'https://api.runpod.ai/v2/test-endpoint';
process.env.MATTE_API_URLS = `${PRIMARY},${RUNPOD}`;
process.env.MATTE_QUEUE_WAIT_MS = '3000';

const log = jest.fn();
jest.unstable_mockModule('../lib/shared/config.js', () => ({
  log,
  sendTelegramMessage: jest.fn(() => Promise.resolve()),
  TELEGRAM_TEAM_API: '',
  TEAM_CHAT_ID: '',
}));

const { runMatteChain, parseRetryAfterMs, rateLimitDelayMs } = await import('../lib/matte.js');

const PNG_B64 = (await sharp({ create: { width: 2, height: 2, channels: 3, background: '#FFFFFF' } }).png().toBuffer()).toString('base64');

const okRunpod = () => new Response(JSON.stringify({ status: 'COMPLETED', output: { success: true, image: PNG_B64, meta: { elapsedSec: 0.3 } } }), { status: 200 });
const okPrimary = () => new Response(JSON.stringify({ success: true, image: PNG_B64, meta: { elapsedSec: 0.3 } }), { status: 200 });
const tooMany = (headers = {}) => new Response('Too Many Requests', { status: 429, headers });

/** routes: { health, primary: [], runpod: [] } — 호출 순서대로 응답 소비 */
function mockFetch({ health = false, primary = [], runpod = [] }) {
  const calls = { primary: 0, runpod: 0, cancel: 0 };
  global.fetch = jest.fn(async (url) => {
    if (url === `${PRIMARY}/health`) return new Response('', { status: health ? 200 : 500 });
    if (url === `${PRIMARY}/api/matte`) { const r = primary[calls.primary++]; return r(); }
    if (url === `${RUNPOD}/runsync`) { const r = runpod[calls.runpod++]; return r(); }
    if (url.startsWith(`${RUNPOD}/cancel/`)) { calls.cancel++; return new Response('{}'); }
    throw new Error(`unexpected fetch ${url}`);
  });
  return calls;
}

const logged = (re) => log.mock.calls.some(([m]) => re.test(m));

beforeEach(() => { log.mockClear(); });
afterEach(() => { jest.restoreAllMocks(); });

describe('parseRetryAfterMs — 초·HTTP-date', () => {
  test('초 정수 → ms', () => {
    expect(parseRetryAfterMs('3')).toBe(3000);
    expect(parseRetryAfterMs('0')).toBe(0);
  });
  test('HTTP-date → 남은 ms, 과거면 0', () => {
    const now = Date.parse('Wed, 04 Nov 2026 10:00:00 GMT');
    expect(parseRetryAfterMs('Wed, 04 Nov 2026 10:00:05 GMT', now)).toBe(5000);
    expect(parseRetryAfterMs('Wed, 04 Nov 2026 09:59:00 GMT', now)).toBe(0);
  });
  test('없음·해석 불가 → null', () => {
    expect(parseRetryAfterMs(null)).toBeNull();
    expect(parseRetryAfterMs('')).toBeNull();
    expect(parseRetryAfterMs('soon')).toBeNull();
    expect(parseRetryAfterMs('-1')).toBeNull();
  });
});

describe('rateLimitDelayMs — Retry-After 우선, 없으면 지수 백오프+지터', () => {
  test('Retry-After 그대로', () => {
    expect(rateLimitDelayMs(1, 1234)).toBe(1234);
  });
  test('지수 증가·상한(예산 절반, 최소 노크 간격)·지터 범위', () => {
    // 예산 3000 → 상한 max(2000, 1500)=2000
    expect(rateLimitDelayMs(1, null, () => 0)).toBe(1000);
    expect(rateLimitDelayMs(1, null, () => 1)).toBe(2000);
    expect(rateLimitDelayMs(5, null, () => 1)).toBe(2000);
  });
});

describe('runMatteChain — 429 경로', () => {
  test('체인 끝 429 + Retry-After(초) → 대기 후 성공', async () => {
    const calls = mockFetch({ health: false, runpod: [() => tooMany({ 'Retry-After': '1' }), okRunpod] });
    const t0 = Date.now();
    const r = await runMatteChain(PNG_B64, '#FFFFFF', 'kr-passport');
    expect(r?.via).toBe('runpod');
    expect(calls.runpod).toBe(2);
    expect(Date.now() - t0).toBeGreaterThanOrEqual(950);
    expect(logged(/요청 과다\(429\) — 1번째, 1000ms 대기 \(Retry-After/)).toBe(true);
    expect(logged(/줄서기 성공 — 노크 0회·429 1회/)).toBe(true);
  });

  test('체인 끝 429 + Retry-After(HTTP-date) → 대기 후 성공', async () => {
    const at = new Date(Date.now() + 2000).toUTCString(); // 초 절삭 → 1~2s
    const calls = mockFetch({ health: false, runpod: [() => tooMany({ 'Retry-After': at }), okRunpod] });
    const r = await runMatteChain(PNG_B64, '#FFFFFF', 'kr-passport');
    expect(r?.via).toBe('runpod');
    expect(calls.runpod).toBe(2);
    expect(logged(/요청 과다\(429\) — 1번째, \d+ms 대기 \(Retry-After/)).toBe(true);
  });

  test('체인 끝 429 헤더 없음 → 지수 백오프로 재노크 후 성공', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const calls = mockFetch({ health: false, runpod: [() => tooMany(), () => tooMany(), okRunpod] });
    const r = await runMatteChain(PNG_B64, '#FFFFFF', 'kr-passport');
    expect(r?.via).toBe('runpod');
    expect(calls.runpod).toBe(3);
    expect(logged(/429\) — 1번째, 1000ms 대기 \(백오프/)).toBe(true);
    expect(logged(/429\) — 2번째, 1000ms 대기 \(백오프, 체인 누적 1000ms/)).toBe(true);
  });

  test('예산 소진 → 대기 없이 명시 실패(null) + WARNING·ERROR 로그에 원인', async () => {
    const calls = mockFetch({ health: false, runpod: [() => tooMany({ 'Retry-After': '10' })] });
    const t0 = Date.now();
    const r = await runMatteChain(PNG_B64, '#FFFFFF', 'kr-passport');
    expect(r).toBeNull();
    expect(calls.runpod).toBe(1);
    expect(Date.now() - t0).toBeLessThan(500); // 예산 넘는 Retry-After는 기다리지 않는다
    expect(log.mock.calls.some(([m, lv]) => /\[Matte\].*429 예산 소진/.test(m) && lv === 'WARNING')).toBe(true);
    expect(log.mock.calls.some(([m, lv]) => /전 엔드포인트 실패 \(429 예산 소진/.test(m) && lv === 'ERROR')).toBe(true);
  });

  test('체인 중간 429 → 대기 없이 다음 엔드포인트(RunPod)로 즉시 이월', async () => {
    const calls = mockFetch({ health: true, primary: [() => tooMany({ 'Retry-After': '10' })], runpod: [okRunpod] });
    const t0 = Date.now();
    const r = await runMatteChain(PNG_B64, '#FFFFFF', 'kr-passport');
    expect(r?.via).toBe('runpod');
    expect(calls.primary).toBe(1);
    expect(calls.runpod).toBe(1);
    expect(Date.now() - t0).toBeLessThan(500);
    expect(logged(/요청 과다\(429\) — 뒤 엔드포인트 있음 → 대기 없이 다음/)).toBe(true);
  });

  test('회귀: 503 포화 노크는 기존대로, 그 대기가 429 예산에 합산된다', async () => {
    const calls = mockFetch({
      health: true,
      primary: [() => new Response('{}', { status: 503, headers: { 'Retry-After': '2' } }), () => new Response('{}', { status: 503, headers: { 'Retry-After': '2' } })],
      runpod: [() => tooMany({ 'Retry-After': '2' })],
    });
    const r = await runMatteChain(PNG_B64, '#FFFFFF', 'kr-passport');
    // 503 노크 2000ms 1회 → 두 번째 노크는 예산 초과로 다음 → RunPod 429 2000ms는 누적 4000 > 3000 → 명시 실패
    expect(r).toBeNull();
    expect(calls.primary).toBe(2);
    expect(calls.runpod).toBe(1);
    expect(logged(/포화 대기 상한 초과/)).toBe(true);
    expect(logged(/429 예산 소진 — 429 1회, 누적 대기 2000ms \+ 다음 2000ms > 3000ms/)).toBe(true);
  });
});

/**
 * 정수리 실측 — 상단 접촉 판정 경계 (ORDER_20261102 정수리게이트_실측전환)
 */
import sharp from 'sharp';
import { measureTopContact, checkCrownContact, CROWN_CONTACT_RATIO, resolveHairPlacement, hairPlacementApplies } from '../lib/hair-measure.js';

const BG = '#00FF00';
const W = 100, H = 100;

/** 배경 위에 검은 사각형을 얹은 합성본 */
async function img(left, top, width, height) {
  const base = sharp({ create: { width: W, height: H, channels: 3, background: BG } });
  if (!width || !height) return base.png().toBuffer();
  const rect = await sharp({ create: { width, height, channels: 3, background: '#000000' } }).png().toBuffer();
  return base.composite([{ input: rect, left, top }]).png().toBuffer();
}

describe('measureTopContact', () => {
  test('위 여백이 있으면 미접촉 + 머리끝 비율', async () => {
    const r = await measureTopContact(await img(30, 5, 40, 60), BG);
    expect(r.touched).toBe(false);
    expect(r.contactRatio).toBe(0);
    expect(r.hairTopRatio).toBe(0.05);
  });

  test('최상단에 넓게 닿으면 접촉', async () => {
    const r = await measureTopContact(await img(30, 0, 40, 60), BG);
    expect(r.touched).toBe(true);
    expect(r.contactRatio).toBe(0.4);
    expect(r.hairTopRatio).toBe(0);
  });

  test('경계 — 접촉 폭이 임계와 같으면 접촉, 1픽셀 모자라면 미접촉', async () => {
    const w = Math.round(W * CROWN_CONTACT_RATIO);
    expect((await measureTopContact(await img(30, 0, w, 60), BG)).touched).toBe(true);
    expect((await measureTopContact(await img(30, 0, w - 1, 60), BG)).touched).toBe(false);
  });

  test('경계 — 맨 위 행 바로 아래부터 시작하면 미접촉', async () => {
    const r = await measureTopContact(await img(30, 1, 40, 60), BG);
    expect(r.touched).toBe(false);
    expect(r.hairTopRatio).toBe(0.01);
  });

  test('열 범위 밖 접촉(양옆 잔여물)은 무시', async () => {
    const r = await measureTopContact(await img(0, 0, 20, 60), BG, 0.3, 0.7);
    expect(r.touched).toBe(false);
  });

  test('전경 없음 → hairTopRatio null', async () => {
    const r = await measureTopContact(await img(0, 0, 0, 0), BG);
    expect(r).toEqual({ hairTopRatio: null, contactRatio: 0, rowContacts: [0, 0, 0, 0, 0], touched: false });
  });
});

describe('머리끝 행 — 반투명 경계 제외', () => {
  test('옅은 번짐 줄은 머리끝이 아니고, 맨 위 접촉 판정은 그대로 민감하다', async () => {
    const halo = await sharp({ create: { width: 40, height: 10, channels: 3, background: '#30D030' } }).png().toBuffer();
    const solid = await sharp({ create: { width: 40, height: 50, channels: 3, background: '#000000' } }).png().toBuffer();
    const buf = await sharp({ create: { width: W, height: H, channels: 3, background: BG } })
      .composite([{ input: halo, left: 30, top: 0 }, { input: solid, left: 30, top: 10 }]).png().toBuffer();
    const r = await measureTopContact(buf, BG);
    expect(r.hairTopRatio).toBe(0.1);
    expect(r.touched).toBe(true);
  });
});

describe('checkCrownContact', () => {
  const faceBox = { x: 0.3, y: 0.2, w: 0.4, h: 0.5 };
  const run = async (runMatte, extra = {}) => {
    const warns = [];
    const r = await checkCrownContact({ imageBuf: await img(30, 5, 40, 60), faceBox, slug: 't', engineState: 'primary', runMatte, warn: (m) => warns.push(m), ...extra });
    return { r, warns };
  };
  const matted = async (buf) => ({ image: buf.toString('base64') });

  test('머리가 맨 위에 넓게 닿으면 touched', async () => {
    const b = await img(30, 0, 40, 60);
    const { r, warns } = await run(() => matted(b));
    expect(r.status).toBe('measured');
    expect(r.touched).toBe(true);
    expect(warns).toEqual([]);
  });

  test('위 여백이 있으면 통과', async () => {
    const b = await img(30, 5, 40, 60);
    const { r } = await run(() => matted(b));
    expect(r.touched).toBe(false);
    expect(r.hairTopRatio).toBe(0.05);
  });

  test('체인 실패(null) → 판정 없이 통과 + WARNING', async () => {
    const { r, warns } = await run(async () => null);
    expect(r.status).toBe('failed');
    expect(r.touched).toBeUndefined();
    expect(warns[0]).toMatch('정수리 실측 실패');
  });

  test('체인 예외 → 판정 없이 통과 + WARNING', async () => {
    const { r, warns } = await run(async () => { throw new Error('boom'); });
    expect(r.status).toBe('failed');
    expect(warns[0]).toMatch('boom');
  });

  test('타임아웃 → 판정 없이 통과 + WARNING', async () => {
    const { r, warns } = await run(() => new Promise(() => {}), { timeoutMs: 30 });
    expect(r.status).toBe('failed');
    expect(warns[0]).toMatch('타임아웃');
  });

  test('자체 서버 불통 → 체인 호출 없이 통과 + WARNING', async () => {
    let called = 0;
    const { r, warns } = await run(async () => { called++; return null; }, { engineState: 'backup' });
    expect(r.status).toBe('skipped_backup');
    expect(called).toBe(0);
    expect(warns[0]).toMatch('생략');
  });
});

describe('resolveHairPlacement — 눈 48%·여백 0.5mm 경계', () => {
  // 프레임 높이 450px = 45mm(1px = 0.1mm), 프레임 y=100, 눈은 프레임 상단에서 43%
  const frame = { x: 0, y: 100, w: 350, h: 450 };
  const lines = { eyeY: 100 + 450 * 0.43, chinY: 100 + 450 * 0.86 };
  const place = (hairY) => resolveHairPlacement({ frame, lines, hairTopRatio: hairY / 1000, imageHeight: 1000, frameHmm: 45 });

  test('여백 충분 → 그대로', () => {
    const r = place(130);
    expect(r.verdict).toBe('pass');
    expect(r.frame).toBe(frame);
    expect(r.marginAfterMm).toBe(3);
  });

  test('여백 정확히 0.5mm → 그대로 / 0.1mm 부족 → 이동', () => {
    expect(place(105).verdict).toBe('pass');
    const r = place(104);
    expect(r.verdict).toBe('moved');
    expect(r.frame.y).toBeCloseTo(99);
    expect(r.marginAfterMm).toBe(0.5);
    expect(r.eyeAfterPct).toBeCloseTo(43.22, 1);
  });

  test('머리가 틀 밖 → 틀을 올려 여백 0.5mm, 크기 불변', () => {
    const r = place(90);
    expect(r.verdict).toBe('moved');
    expect(r.marginBeforeMm).toBe(-1);
    expect(r.frame.y).toBeCloseTo(85);
    expect(r.frame.h).toBe(450);
  });

  test('눈 정확히 48% → 채택 / 넘으면 no_room·프레임 유지', () => {
    // 눈 48% = y 77.5, 머리끝 = 77.5 + 5 = 82.5
    const at = place(82.5);
    expect(at.verdict).toBe('moved');
    expect(at.eyeAfterPct).toBeCloseTo(48, 5);
    const over = place(82);
    expect(over.verdict).toBe('no_room');
    expect(over.frame).toBe(frame);
    expect(over.eyeAfterPct).toBe(43);
  });

  test('적용 범위 — kr·jp 여권, 유효 비율만', () => {
    expect(hairPlacementApplies('kr-passport', 0.1)).toBe(true);
    expect(hairPlacementApplies('jp-passport', 0)).toBe(true);
    expect(hairPlacementApplies('us-visa', 0.1)).toBe(false);
    expect(hairPlacementApplies('kr-passport', null)).toBe(false);
    expect(hairPlacementApplies('kr-passport', 1.5)).toBe(false);
  });
});

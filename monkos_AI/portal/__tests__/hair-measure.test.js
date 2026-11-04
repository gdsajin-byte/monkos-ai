/**
 * 정수리 실측 — 상단 접촉 판정 경계 (ORDER_20261102 정수리게이트_실측전환)
 */
import sharp from 'sharp';
import { measureTopContact, checkCrownContact, CROWN_CONTACT_RATIO, resolveHairPlacement, resolveHeadPlacement, hairPlacementApplies, crownMatteRowPx } from '../lib/hair-measure.js';

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
    expect(r).toEqual({ hairTopRatio: null, hairTopRawRatio: null, contactRatio: 0, rowContacts: [0, 0, 0, 0, 0], touched: false, matteRows: 100 });
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

describe('머리 덩어리 머리끝 — 잔머리 제외 (ORDER_20261104)', () => {
  /** 덩어리(검은 사각형) 위에 1px 폭 세로 가닥을 띄엄띄엄 세운 합성본 */
  async function strands({ lumpTop = 20, strandTop = 10, strandXs = [], strandW = 1 } = {}) {
    const parts = [{ input: await sharp({ create: { width: 40, height: 60, channels: 3, background: '#000000' } }).png().toBuffer(), left: 30, top: lumpTop }];
    for (const x of strandXs) {
      parts.push({ input: await sharp({ create: { width: strandW, height: lumpTop - strandTop, channels: 3, background: '#000000' } }).png().toBuffer(), left: x, top: strandTop });
    }
    return sharp({ create: { width: W, height: H, channels: 3, background: BG } }).composite(parts).png().toBuffer();
  }

  test('가는 가닥 여러 개(총합은 2% 이상) → 덩어리 머리끝, 맨 위 전경은 따로 기록', async () => {
    const r = await measureTopContact(await strands({ strandXs: [35, 40, 45, 50, 55] }), BG);
    expect(r.hairTopRawRatio).toBe(0.1);
    expect(r.hairTopRatio).toBe(0.2);
  });

  test('가닥 없음 → 두 값이 같다', async () => {
    const r = await measureTopContact(await strands(), BG);
    expect(r.hairTopRatio).toBe(0.2);
    expect(r.hairTopRawRatio).toBe(0.2);
  });

  test('넓은 뭉치(연속 8px 이상)가 3행 이상이면 덩어리로 본다', async () => {
    const r = await measureTopContact(await strands({ strandXs: [40], strandW: 10 }), BG);
    expect(r.hairTopRatio).toBe(0.1);
  });

  test('가로로 누운 가닥 1~2행은 덩어리가 아니다', async () => {
    const line = await sharp({ create: { width: 30, height: 2, channels: 3, background: '#000000' } }).png().toBuffer();
    const lump = await sharp({ create: { width: 40, height: 60, channels: 3, background: '#000000' } }).png().toBuffer();
    const buf = await sharp({ create: { width: W, height: H, channels: 3, background: BG } })
      .composite([{ input: line, left: 35, top: 12 }, { input: lump, left: 30, top: 20 }]).png().toBuffer();
    const r = await measureTopContact(buf, BG);
    expect(r.hairTopRawRatio).toBe(0.12);
    expect(r.hairTopRatio).toBe(0.2);
  });

  test('1px 구멍(매팅 노이즈)은 이어 본다', async () => {
    const hole = await sharp({ create: { width: 1, height: 60, channels: 3, background: BG } }).png().toBuffer();
    const lump = await sharp({ create: { width: 40, height: 60, channels: 3, background: '#000000' } }).png().toBuffer();
    const parts = [{ input: lump, left: 30, top: 20 }];
    for (let x = 32; x < 70; x += 2) parts.push({ input: hole, left: x, top: 20 });
    const buf = await sharp({ create: { width: W, height: H, channels: 3, background: BG } }).composite(parts).png().toBuffer();
    expect((await measureTopContact(buf, BG)).hairTopRatio).toBe(0.2);
  });
});

describe('resolveHeadPlacement — 실측 두상 33mm 재배율 (ORDER_20261104)', () => {
  // 원 프레임: 450px = 45mm(0.1mm/px), 거울상 두상 33mm(330px), 눈 43%.
  const frame = { x: 0, y: 100, w: 350, h: 450 };
  const eyeY = 100 + 450 * 0.43;               // 293.5
  const lines = { eyeY, chinY: eyeY + 165, crownY: eyeY - 165, eyeCenterX: 175 };
  const spec = { frameHmm: 45, headTargetMm: 33, headMinMm: 32, headMaxMm: 36 };
  const place = (hairY) => resolveHeadPlacement({ frame, lines, hairTopRatio: hairY / 1000, imageHeight: 1000, ...spec });

  test('실측 머리끝 = 거울상 정수리 → 프레임 그대로 (재배율 0)', () => {
    const r = place(lines.crownY);
    expect(r.verdict).toBe('pass');
    expect(r.frame.h).toBeCloseTo(450);
    expect(r.frame.y).toBeCloseTo(100);
    expect(r.headMeasuredMm).toBe(33);
    expect(r.scaleRatio).toBeCloseTo(1, 3);
  });

  test('머리 볼륨 1mm → 실측 두상 33mm로 축소, 눈 43% 유지', () => {
    const r = place(lines.crownY - 10); // 실측 34mm
    expect(r.verdict).toBe('pass');
    expect(r.headMeasuredOrigMm).toBe(34);
    expect(r.headMeasuredMm).toBe(33);
    expect(r.headMirrorMm).toBeCloseTo(32.03, 1);
    expect(r.headGuard).toBe(null);
    expect(r.eyeAfterPct).toBeCloseTo(43, 1);
    expect(r.frame.w / r.frame.h).toBeCloseTo(350 / 450, 6);
    expect(r.frame.x + r.frame.w / 2).toBeCloseTo(175); // 눈 중심 = 수평 중앙
  });

  test('얼굴 하한 가드 — 거울상 32mm 밑으로 안 줄이고 나머지는 위로 이동', () => {
    const r = place(lines.crownY - 30); // 실측 36mm → 33mm면 거울상 30.25mm < 32
    expect(r.headGuard).toBe('face_min');
    expect(r.headMirrorMm).toBe(32);
    expect(r.headMeasuredMm).toBeCloseTo(34.9, 1);
    // 눈 43%(19.35mm)에서 머리끝 = 눈 위 34.9−16 = 18.9mm → 여백 0.45mm < 0.5 → 위로 이동
    expect(r.verdict).toBe('moved');
    expect(r.marginAfterMm).toBe(0.5);
    expect(r.eyeAfterPct).toBeCloseTo(43.11, 1);
  });

  test('재현(Jemison형): 원 프레임 기준 실측 37.7mm·여백 −1.9mm → no_room 아님', () => {
    // 원 프레임에서 머리끝이 틀 위 1.89mm, 실측 두상 37.7mm
    const r = place(100 - 18.9);
    expect(r.marginOrigMm).toBeCloseTo(-1.89, 1);
    expect(r.headMeasuredOrigMm).toBeCloseTo(37.7, 0);
    expect(r.verdict).not.toBe('no_room');
    expect(r.headGuard).toBe('face_min');
    expect(r.marginAfterMm).toBeGreaterThanOrEqual(0.5);
    expect(r.eyeAfterPct).toBeLessThanOrEqual(48);
  });

  test('볼륨이 극단이면 가드 후에도 no_room — 원 프레임 유지', () => {
    const r = place(lines.crownY - 60); // 실측 39mm
    expect(r.verdict).toBe('no_room');
    expect(r.frame).toBe(frame);
    expect(r.rescaled).toBe(false);
  });

  test('대머리(실측 < 거울상) → 얼굴 확대, 상한 가드 36mm', () => {
    const r = place(lines.crownY + 20); // 실측 31mm → 33mm면 거울상 35.1mm
    expect(r.headGuard).toBe(null);
    expect(r.headMeasuredMm).toBe(33);
    expect(r.headMirrorMm).toBeCloseTo(35.13, 1);
    const big = place(lines.crownY + 40); // 실측 29mm → 거울상 37.6 > 36
    expect(big.headGuard).toBe('face_max');
    expect(big.headMirrorMm).toBe(36);
  });

  test('입력 무효(머리끝이 턱 아래) → null', () => {
    expect(place(lines.chinY + 5)).toBe(null);
  });
});

describe('측정 정밀도 보정 — 배치 목표 = 0.5mm + 매팅 2행 (쌍아 11-04)', () => {
  const frame = { x: 0, y: 100, w: 350, h: 450 }; // 0.1mm/px
  const lines = { eyeY: 100 + 450 * 0.43, chinY: 100 + 450 * 0.86 };
  const place = (hairY, slackPx) => resolveHairPlacement({ frame, lines, hairTopRatio: hairY / 1000, imageHeight: 1000, frameHmm: 45, slackPx });

  test('보정 3px(0.3mm) → 목표 0.8mm: 0.8 통과 / 0.7 이동', () => {
    expect(place(108, 3).verdict).toBe('pass');
    const r = place(107, 3);
    expect(r.verdict).toBe('moved');
    expect(r.marginAfterMm).toBe(0.8);
    expect(r.marginTargetMm).toBe(0.8);
    expect(r.slackMm).toBe(0.3);
  });

  test('보정 0이면 11-03 동작 그대로', () => {
    expect(place(105, 0).verdict).toBe('pass');
    expect(place(105).marginTargetMm).toBe(0.5);
  });

  test('매팅 행 높이 — 긴 변 512 축소 기준, 확대 없음', () => {
    expect(crownMatteRowPx(1280, 1600)).toBeCloseTo(1600 / 512);
    expect(crownMatteRowPx(1600, 1280)).toBeCloseTo(1280 / 410);
    expect(crownMatteRowPx(400, 300)).toBe(1);
  });
});

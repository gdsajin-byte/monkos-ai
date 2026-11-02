/**
 * 정수리 실측 — 상단 접촉 판정 경계 (ORDER_20261102 정수리게이트_실측전환)
 */
import sharp from 'sharp';
import { measureTopContact, CROWN_CONTACT_RATIO } from '../lib/hair-measure.js';

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

  test('경계 — 검사 구간 바로 아래 행은 미접촉', async () => {
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
    expect(r).toEqual({ hairTopRatio: null, contactRatio: 0, rowContacts: [0], touched: false });
  });
});

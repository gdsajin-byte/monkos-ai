/**
 * BiRefNet matte 파이프라인 테스트 (2026-07-07, ORDER_20260707 Task A-3)
 * - 배경색 매핑: 428건 전수 유효 hex + 유색 대표 규격 수치
 * - 안전 스위치: MATTE_API_URL 미설정 시 신경로 무동작 (현행 Gemini 경로 보존)
 */

import { jest } from '@jest/globals';

jest.unstable_mockModule('../lib/shared/config.js', () => ({
  log: jest.fn(),
  sendTelegramMessage: jest.fn(),
  TELEGRAM_TEAM_API: '',
  TEAM_CHAT_ID: '',
}));

const { getSpecBgColor, matteEnabled, matteSpecPipeline } = await import('../lib/matte.js');
const { createRequire } = await import('module');
const SPECS_DATA = createRequire(import.meta.url)('../lib/cms/specs-data.json');

describe('규격 배경색 매핑', () => {
  test('흰색 정본: kr-passport → #FFFFFF', () => {
    expect(getSpecBgColor('kr-passport')).toBe('#FFFFFF');
  });

  test('밝은 회색: fr-passport·uk-visa·au-passport → #F0F0F0', () => {
    for (const slug of ['fr-passport', 'uk-visa', 'au-passport']) {
      expect(getSpecBgColor(slug)).toBe('#F0F0F0');
    }
  });

  test('파란색: kw-passport·om-visa → #438EDB', () => {
    for (const slug of ['kw-passport', 'om-visa']) {
      expect(getSpecBgColor(slug)).toBe('#438EDB');
    }
  });

  test('빨간색: id-passport → #FF0000', () => {
    expect(getSpecBgColor('id-passport')).toBe('#FF0000');
  });

  test('모호 표기는 흰색 보수 폴백: usa-headshot(단색)·cn-resume(흰색·파란)·uk-passport(크림 또는 연회색)', () => {
    expect(getSpecBgColor('usa-headshot')).toBe('#FFFFFF');
    expect(getSpecBgColor('cn-resume')).toBe('#FFFFFF'); // "흰색·파란 배경" — 흰 우선
    expect(getSpecBgColor('uk-passport')).toBe('#F0F0F0'); // "크림 또는 연회색" — 연회색 매핑
  });

  test('전수 커버리지: 428건 전부 유효 #RRGGBB 산출, 미등록 슬러그도 흰색', () => {
    const slugs = Object.keys(SPECS_DATA);
    expect(slugs.length).toBeGreaterThanOrEqual(428);
    for (const s of slugs) {
      expect(getSpecBgColor(s)).toMatch(/^#[0-9A-F]{6}$/);
    }
    expect(getSpecBgColor('no-such-slug')).toBe('#FFFFFF');
  });
});

describe('안전 스위치 (MATTE_API_URL 미설정)', () => {
  test('matteEnabled → false, matteSpecPipeline → null (Gemini 경로 보존)', async () => {
    expect(matteEnabled()).toBe(false);
    await expect(matteSpecPipeline('aGVsbG8=', 'kr-passport')).resolves.toBeNull();
  });
});

describe('stripDataUri — 프론트 데이터 URI 정규화 (카나리 1호 버그)', () => {
  test('프리픽스 제거 + 순수 base64 무변', async () => {
    const { stripDataUri } = await import('../lib/matte.js');
    expect(stripDataUri('data:image/png;base64,iVBORw0K')).toBe('iVBORw0K');
    expect(stripDataUri('iVBORw0K')).toBe('iVBORw0K');
    expect(stripDataUri('')).toBe('');
  });
});

describe('규격 안착 가드 (배치 복원 후 warn-only 캘리브레이션 대기)', () => {
  test('전 범위 warn-only (캘리브레이션 완료 후 재활성화 예정)', async () => {
    const { cropMetaWithinSpec } = await import('../lib/matte.js');
    expect(cropMetaWithinSpec({ crownMarginMM: '5.4', eyePositionPercent: '40.0' })).toBe(true);
    expect(cropMetaWithinSpec({ crownMarginMM: '5.7', eyePositionPercent: '48.0' })).toBe(true);
    expect(cropMetaWithinSpec({ crownMarginMM: '2.8', eyePositionPercent: '44.4' })).toBe(true);
    expect(cropMetaWithinSpec({ crownMarginMM: '5.4', eyePositionPercent: '39.7' })).toBe(true);  // warn-only
    expect(cropMetaWithinSpec({ crownMarginMM: '16.7', eyePositionPercent: '72.4' })).toBe(true);  // warn-only
    expect(cropMetaWithinSpec({})).toBe(true);
  });
});

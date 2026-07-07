/**
 * matte 카나리 게이트 테스트 — MATTE_SLUGS 설정 시 지정 슬러그만 신경로 (2026-07-07 파일럿)
 * env를 import 전에 주입해야 하므로 별도 스위트.
 */

import { jest } from '@jest/globals';

process.env.MATTE_SLUGS = 'kr-passport';

jest.unstable_mockModule('../lib/shared/config.js', () => ({
  log: jest.fn(),
  sendTelegramMessage: jest.fn(),
  TELEGRAM_TEAM_API: '',
  TEAM_CHAT_ID: '',
}));

const { matteSlugAllowed, matteSpecPipeline } = await import('../lib/matte.js');

describe('카나리 게이트 (MATTE_SLUGS=kr-passport)', () => {
  test('kr-passport만 허용, 나머지는 차단', () => {
    expect(matteSlugAllowed('kr-passport')).toBe(true);
    expect(matteSlugAllowed('us-visa')).toBe(false);
    expect(matteSlugAllowed('jp-passport')).toBe(false);
  });

  test('카나리 밖 슬러그 → 파이프라인 null (Gemini 경로 보존)', async () => {
    await expect(matteSpecPipeline('aGVsbG8=', 'us-visa')).resolves.toBeNull();
  });
});

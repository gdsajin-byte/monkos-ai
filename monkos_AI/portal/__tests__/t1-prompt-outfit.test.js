/**
 * T1 프롬프트 [OUTFIT] 분기 — 성인·아기 × attireDesc 유무 4케이스 (ORDER_20261103 막내2 §2-4)
 * - 성인 무선택 = 정장 폴백 (동작 불변)
 * - 아기 무선택 = 지금 옷 유지 (정장 폴백 버그 수정)
 * - attireDesc 있으면 나이 무관 그 문구
 */
import { jest } from '@jest/globals';

// config.js는 기동 시 환경변수를 강제 — 프롬프트 조립에는 log만 쓰이므로 모킹
jest.unstable_mockModule('../lib/shared/config.js', () => ({ log: () => {} }));
jest.unstable_mockModule('@google/genai', () => ({ GoogleGenAI: class {} }));
const { buildT1Prompt } = await import('../lib/idphoto-generate.js');

const SUIT = "[OUTFIT] Replace current clothing with neat, professional dark business attire matching the person's gender presentation in the original photo (e.g., a dark suit with a plain light top, or an equivalent blouse/jacket). Clothing should look natural and properly fitted.";
const KEEP = '[OUTFIT] Keep current clothing as-is. Only ensure it looks neat and tidy.';
const DESC = 'Recolor the existing top to soft ivory';

const outfitLine = (prompt) => prompt.split('\n').find((l) => l.startsWith('[OUTFIT]'));

describe('buildT1Prompt [OUTFIT]', () => {
  test.each([
    ['성인 + attireDesc 없음 → 정장', null, 'adult', SUIT],
    ['성인 + attireDesc 있음 → 그 문구', DESC, 'adult', `[OUTFIT] ${DESC}`],
    ['아기 + attireDesc 없음 → 지금 옷 유지', null, 'baby', KEEP],
    ['아기 + attireDesc 있음 → 그 문구', DESC, 'baby', `[OUTFIT] ${DESC}`],
  ])('%s', (_name, attireDesc, age, expected) => {
    const prompt = buildT1Prompt(attireDesc, { gender: 'f', age });
    expect(outfitLine(prompt)).toBe(expected);
    expect(prompt).toMatchSnapshot();
  });

  test('age 미지정은 성인 취급 (기존 동작)', () => {
    expect(outfitLine(buildT1Prompt(null, {}))).toBe(SUIT);
  });

  test('아기 무선택 프롬프트에 정장 지시가 없다', () => {
    expect(buildT1Prompt(null, { gender: 'm', age: 'baby' })).not.toMatch(/business attire|dark suit/);
  });
});

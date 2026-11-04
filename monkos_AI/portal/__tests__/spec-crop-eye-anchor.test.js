/**
 * 유료 크롭 눈 앵커 주입 (ORDER_20261104 유료크롭_눈45정합)
 * - crop-spec 요청 spec에 kr·jp 여권만 eyeAnchor(정본 HEAD_PLACEMENT_EYE_ANCHOR)를 합성
 * - getSpecCropParams 반환값 불변 (fit-spec·무료 가이드가 같은 spec을 쓴다)
 * - 35×45 다른 규격은 요청 spec이 이전과 같다 (필드 없음 → 엔진 기본 0.43)
 */
import { jest } from '@jest/globals';

jest.unstable_mockModule('../lib/shared/config.js', () => ({
  log: jest.fn(), sendTelegramMessage: jest.fn().mockResolvedValue(), TELEGRAM_TEAM_API: '', TEAM_CHAT_ID: '',
}));
process.env.CROP_ENGINE_URL = 'http://127.0.0.1:1'; // 모듈 상수 — import 전에 설정 (fetch는 아래에서 가로챈다)
const { getSpecCropParams, cropToSpec, cropSpecRequest } = await import('../lib/spec-crop.js');
const { HEAD_PLACEMENT_EYE_ANCHOR } = await import('../lib/hair-measure.js');
const SPECS_DATA = (await import('module')).createRequire(import.meta.url)('../lib/cms/specs-data.json');

const sent = [];
beforeEach(() => {
  sent.length = 0;
  global.fetch = jest.fn(async (url, opts) => {
    sent.push(JSON.parse(opts.body));
    return { ok: true, json: async () => ({ success: true, cropped: 'Y3JvcA==', fallback: false, meta: { eyeAnchorTarget: 0.45, eyeAnchorSource: 'spec' } }) };
  });
});

describe('crop-spec 요청 spec — eyeAnchor 합성', () => {
  test('kr·jp 여권: eyeAnchor = 정본 0.45, 나머지 필드는 getSpecCropParams 그대로', async () => {
    for (const slug of ['kr-passport', 'jp-passport']) {
      const before = JSON.stringify(getSpecCropParams(slug));
      const out = await cropToSpec('aW1n', slug);
      expect(out.cropped).toBe(true);
      const body = sent.at(-1);
      expect(body.spec.eyeAnchor).toBe(HEAD_PLACEMENT_EYE_ANCHOR[slug]);
      expect(body.spec.eyeAnchor).toBe(0.45);
      const { eyeAnchor, ...rest } = body.spec;
      expect(rest).toEqual(getSpecCropParams(slug));
      expect(JSON.stringify(getSpecCropParams(slug))).toBe(before); // 반환값 불변(합성은 사본)
      expect(getSpecCropParams(slug).eyeAnchor).toBeUndefined();
    }
  });

  test('35×45(프레임 45mm) 다른 규격 전수: 요청 spec = getSpecCropParams (eyeAnchor 없음)', () => {
    const slugs = Object.keys(SPECS_DATA).filter((s) => getSpecCropParams(s)?.frameHmm === 45 && !HEAD_PLACEMENT_EYE_ANCHOR[s]);
    expect(slugs.length).toBeGreaterThan(100);
    for (const s of slugs) {
      const p = getSpecCropParams(s);
      expect(cropSpecRequest(p, s)).toBe(p); // 같은 객체 그대로 — 직렬화 바이트 동일
    }
  });

  test('비여권·다른 프레임 규격도 필드 없음', async () => {
    await cropToSpec('aW1n', 'us-passport');
    expect(sent.at(-1).spec).toEqual(getSpecCropParams('us-passport'));
    expect('eyeAnchor' in sent.at(-1).spec).toBe(false);
  });
});

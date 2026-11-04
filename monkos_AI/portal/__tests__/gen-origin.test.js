/**
 * 생성 기록 테스트 딱지 (ORDER_20261105 생성기록_테스트딱지)
 * - isTest 판정 4가지: dev 서비스 / prod+인증+표시 / prod+표시만 / prod 일반
 * - 어드민 목록: 기본 숨김·포함 토글·과거 문서(필드 없음)는 고객 기록·숨김으로 모자라면 다음 묶음
 */
import { jest } from '@jest/globals';

jest.unstable_mockModule('../lib/shared/config.js', () => ({
  firestore: { collection: () => ({ where: () => ({}), orderBy: () => ({}) }) },
  log: jest.fn(), parseCookies: () => ({}), verifyAuthToken: () => null, ADMIN_UIDS: [], AGENT_API_KEYS: [],
  generateAuthToken: () => ({}), parseJsonBody: async () => ({}),
}));
jest.unstable_mockModule('@google-cloud/storage', () => ({ Storage: class { bucket() { return { file: () => ({}) }; } } }));

const { generationOrigin, isTestGeneration, isDevService, TEST_RUN_HEADER } = await import('../lib/gen-origin.js');
const { keepGeneration, collectVisible } = await import('../lib/cms/idphoto-review.js');

const req = (headers = {}) => ({ headers });
const admin = () => ({ userId: 'agent_makne', isAdmin: true });
const nobody = () => null;

describe('isTest 판정', () => {
  test('① dev 서비스 → isTest(dev_service), 인증·표시 무관', () => {
    expect(generationOrigin(req(), { kService: 'monkos-portal-dev', getAdmin: nobody }))
      .toEqual({ originService: 'monkos-portal-dev', isTest: true, testReason: 'dev_service' });
  });
  test('② prod + 관리자 인증 + 표시 → isTest(admin_marked)', () => {
    expect(generationOrigin(req({ [TEST_RUN_HEADER]: '1' }), { kService: 'monkos-portal', getAdmin: admin }))
      .toEqual({ originService: 'monkos-portal', isTest: true, testReason: 'admin_marked' });
  });
  test('③ prod + 표시만(인증 없음) → 무시, 고객 기록', () => {
    expect(generationOrigin(req({ [TEST_RUN_HEADER]: '1' }), { kService: 'monkos-portal', getAdmin: nobody }))
      .toEqual({ originService: 'monkos-portal', isTest: false, testReason: null });
    // 판정 함수 미전달·예외도 무시
    expect(generationOrigin(req({ [TEST_RUN_HEADER]: '1' }), { kService: 'monkos-portal' }).isTest).toBe(false);
    expect(generationOrigin(req({ [TEST_RUN_HEADER]: '1' }), { kService: 'monkos-portal', getAdmin: () => { throw new Error('x'); } }).isTest).toBe(false);
  });
  test('④ prod 일반(관리자여도 표시 없으면) → isTest false', () => {
    expect(generationOrigin(req(), { kService: 'monkos-portal', getAdmin: admin }).isTest).toBe(false);
    expect(generationOrigin(req({ [TEST_RUN_HEADER]: 'true' }), { kService: 'monkos-portal', getAdmin: admin }).isTest).toBe(false); // 값은 '1'만
  });
  test('로컬(K_SERVICE 없음) → originService null, isTest false', () => {
    expect(generationOrigin(req(), { kService: undefined, getAdmin: nobody })).toEqual({ originService: null, isTest: false, testReason: null });
  });
  test('isDevService / isTestGeneration', () => {
    expect(isDevService('monkos-portal-dev')).toBe(true);
    expect(isDevService('monkos-portal')).toBe(false);
    expect(isDevService(null)).toBe(false);
    expect(isTestGeneration({ isTest: true })).toBe(true);
    expect(isTestGeneration({ originService: 'monkos-portal-dev' })).toBe(true);
    expect(isTestGeneration({})).toBe(false); // 필드 없는 과거 문서 = 고객 기록
  });
});

describe('어드민 목록 필터', () => {
  const T = (i, extra = {}) => ({ createdAt: `2026-11-05T00:00:${String(99 - i).padStart(2, '0')}Z`, slug: 'kr-passport', ...extra });
  test('기본 숨김·포함 토글·탭 필터', () => {
    expect(keepGeneration(T(0, { isTest: true }), { service: 'kr', includeTest: false })).toBe(false);
    expect(keepGeneration(T(0, { isTest: true }), { service: 'kr', includeTest: true })).toBe(true);
    expect(keepGeneration(T(0), { service: 'kr', includeTest: false })).toBe(true);
    expect(keepGeneration(T(0, { slug: 'jp-passport' }), { service: 'kr', includeTest: true })).toBe(false);
  });

  // 원 쿼리 흉내: createdAt 내림차순 배열을 커서 뒤부터 n개
  const pager = (all) => async (cursor, n) => {
    const start = cursor ? all.findIndex((d) => d.createdAt === cursor) + 1 : 0;
    return all.slice(start, start + n);
  };
  test('숨김으로 모자라면 다음 묶음을 더 읽어 limit을 채운다', async () => {
    const all = [...Array(10)].map((_, i) => T(i, { isTest: true })).concat([...Array(5)].map((_, i) => T(10 + i)));
    const r = await collectVisible({ fetchPage: pager(all), limit: 3, batch: 4, keep: (d) => keepGeneration(d, { service: 'kr', includeTest: false }) });
    expect(r.docs.map((d) => d.createdAt)).toEqual([all[10], all[11], all[12]].map((d) => d.createdAt));
    expect(r.hasMore).toBe(true);
    expect(r.hiddenTest).toBe(10);
  });
  test('끝까지 읽으면 hasMore false', async () => {
    const all = [T(0), T(1, { isTest: true }), T(2)];
    const r = await collectVisible({ fetchPage: pager(all), limit: 5, batch: 10, keep: (d) => keepGeneration(d, { service: 'kr', includeTest: false }) });
    expect(r.docs.length).toBe(2);
    expect(r.hasMore).toBe(false);
  });
  test('커서 이어 읽기 — 마지막 반환 문서 뒤부터, 중복·누락 없음', async () => {
    const all = [...Array(9)].map((_, i) => T(i, i % 3 === 0 ? { isTest: true } : {}));
    const keep = (d) => keepGeneration(d, { service: 'kr', includeTest: false });
    const p1 = await collectVisible({ fetchPage: pager(all), limit: 3, batch: 2, keep });
    const p2 = await collectVisible({ fetchPage: pager(all), after: p1.docs.at(-1).createdAt, limit: 3, batch: 2, keep });
    const seen = [...p1.docs, ...p2.docs].map((d) => d.createdAt);
    expect(seen).toEqual(all.filter(keep).map((d) => d.createdAt));
    expect(p2.hasMore).toBe(false);
  });
});

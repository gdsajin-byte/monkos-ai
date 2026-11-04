/**
 * 생성 기록 출처·시험 딱지 (ORDER_20261105 생성기록_테스트딱지, 작가님 11-05 04:34 "테스트 딱지 붙이는건 찬성")
 *
 * dev·prod 포털이 같은 Firestore generations를 쓴다 → 저장 시 출처 서비스와 시험 여부를 남긴다.
 * isTest = (a) 실행 서비스(K_SERVICE)가 '-dev'로 끝남
 *       OR (b) 요청 헤더 X-Test-Run: 1 + 관리자 인증 통과(getAdminUser — requireAdmin과 같은 쿠키 ADMIN_UIDS·Bearer AGENT_ 체계)
 * 인증 없는 표시는 무시한다 — 고객이 자기 기록을 숨기는 통로가 되면 안 된다.
 *
 * 표시 이름 근거: X-Monkos-* 는 엣지 워커가 쓰는 신뢰 헤더 이름공간(edge-trust.js)이라 피했다.
 * 엣지(edge/worker.mjs)는 요청 헤더를 그대로 넘기므로(hop 헤더만 제거) 일반 헤더가 오리진까지 도달한다.
 * 바디가 아닌 헤더 — 생성 라우트(idphoto·headshot) 바디 스키마를 건드리지 않고 같은 방식으로 붙는다.
 */
export const TEST_RUN_HEADER = 'x-test-run';

/** 서비스 이름이 dev 계열인가 */
export const isDevService = (name) => typeof name === 'string' && name.endsWith('-dev');

/**
 * @param req - node http 요청(헤더만 읽는다). 없으면 (b) 판정 없음
 * @param opts.kService - 실행 서비스명(기본 process.env.K_SERVICE)
 * @param opts.getAdmin - 관리자 판정 함수(기본: 호출부가 넘긴다 — 순환 import 회피·테스트 주입)
 * @returns {{ originService: string|null, isTest: boolean, testReason: 'dev_service'|'admin_marked'|null }}
 */
export function generationOrigin(req, { kService = process.env.K_SERVICE, getAdmin } = {}) {
  const originService = kService || null;
  if (isDevService(originService)) return { originService, isTest: true, testReason: 'dev_service' };
  const marked = String(req?.headers?.[TEST_RUN_HEADER] ?? '').trim() === '1';
  if (marked && typeof getAdmin === 'function') {
    let admin = null;
    try { admin = getAdmin(req); } catch { admin = null; }
    if (admin) return { originService, isTest: true, testReason: 'admin_marked' };
  }
  return { originService, isTest: false, testReason: null };
}

/** 어드민 표시·필터용 — 필드가 없는 과거 문서는 originService로만 판정(없으면 고객 기록으로 본다) */
export const isTestGeneration = (doc) => doc?.isTest === true || isDevService(doc?.originService);

/**
 * GA4 부트스트랩 — idphoto-kr 전 페이지 공통 (2026-11-06 민아, ORDER_20261105 GA4계측강화)
 * 측정 ID 정본: .claude/rules/references.md §GA4 (G-JPZWSJ3323). 변경 전 관리 UI/Admin API 실측 필수.
 *
 * 하는 일
 *  1. 내부·개발 트래픽 표식: traffic_type=internal + debug_mode
 *     - 자동: localhost · 127.0.0.1 · Cloud Run dev 호스트(-dev-)
 *     - 수동: 아무 페이지나 ?monk_internal=1 로 1회 열면 이 브라우저는 계속 internal (해제 ?monk_internal=0)
 *     - GA4 관리 → 데이터 필터 'Internal Traffic'(traffic_type=internal)·'Developer Traffic'(debug_mode)을 Active로 두면 보고서에서 제외
 *  2. 결제·로그인 복귀 리퍼러 무시: 토스(*.tosspayments.com)·카카오/네이버/구글/애플 **로그인 호스트**에서 돌아온 page_view만 새 유입원으로 세지 않는다 (ignore_referrer). 검색·공유 유입은 건드리지 않는다
 *  3. AI 엔진 유입 랜딩 이벤트(ai_referral_landing)를 index 전용에서 전 페이지로 확장
 *  4. 첫 랜딩 리퍼러·URL을 sessionStorage에 보존(기존 index 로직 유지)
 *
 * ⚠️ 이벤트 파라미터는 GA4 커스텀 측정기준으로 등록돼야 보고서에서 조회된다 (등록 현황은 COMPLETION_20261106 참조)
 */
(function () {
  var ID = 'G-JPZWSJ3323';
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  gtag('js', new Date());

  var host = (location.hostname || '').toLowerCase();
  var cfg = {};

  // 1. 내부·개발 트래픽
  var internal = false;
  try {
    var m = /[?&]monk_internal=([01])/.exec(location.search || '');
    if (m) { if (m[1] === '1') localStorage.setItem('monk_internal', '1'); else localStorage.removeItem('monk_internal'); }
    internal = localStorage.getItem('monk_internal') === '1';
  } catch (e) {}
  if (host === 'localhost' || host === '127.0.0.1' || host.indexOf('-dev-') !== -1) internal = true;
  if (internal) { cfg.traffic_type = 'internal'; cfg.debug_mode = true; }

  // 2. 결제·로그인 복귀 리퍼러 무시 (결제창 왕복이 세션 유입원을 'tosspayments / referral'로 덮어쓰던 문제)
  var ref = document.referrer || '';
  var refHost = '';
  try { refHost = ref ? new URL(ref).hostname.toLowerCase() : ''; } catch (e) {}
  // ⚠️ 로그인·결제 복귀 호스트만 정확 일치. 도메인 접미사(naver.com·kakao.com)로 넓히면 네이버 검색(search.naver.com)·카카오톡 공유 유입까지 지워진다 (쌍아 검토 2026-11-06 00:20)
  var bounceExact = ['nid.naver.com', 'kauth.kakao.com', 'accounts.kakao.com', 'accounts.google.com', 'appleid.apple.com'];
  var bounceSuffix = ['tosspayments.com'];
  var isBounce = !!refHost && (bounceExact.indexOf(refHost) !== -1 || bounceSuffix.some(function (h) { return refHost === h || refHost.slice(-(h.length + 1)) === '.' + h; }));
  if (isBounce) cfg.ignore_referrer = true;

  gtag('config', ID, cfg);

  // 3. AI 엔진 유입 랜딩
  var ai = ['chatgpt.com', 'perplexity', 'claude.ai', 'gemini.google', 'copilot'];
  if (ai.some(function (s) { return ref.indexOf(s) !== -1; })) {
    var e = ref.indexOf('chatgpt') !== -1 ? 'chatgpt' : ref.indexOf('perplexity') !== -1 ? 'perplexity' : ref.indexOf('claude.ai') !== -1 ? 'claude' : ref.indexOf('gemini.google') !== -1 ? 'gemini' : ref.indexOf('copilot') !== -1 ? 'copilot' : 'other_ai';
    gtag('event', 'ai_referral_landing', { ai_engine: e, landing_page: location.pathname, service: 'idphoto-kr' });
  }

  // 4. 첫 랜딩 보존
  try {
    if (!sessionStorage.getItem('landing_referrer')) {
      sessionStorage.setItem('landing_referrer', ref || 'direct');
      sessionStorage.setItem('landing_url', location.href);
    }
  } catch (e) {}

  window.__monkGaInternal = internal;
})();

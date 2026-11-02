/**
 * 실행 환경 판별 — K_SERVICE가 -dev로 끝나면 dev 서비스 (Cloud Run 주입값, 호출 시점에 읽는다)
 */
export function isDevService() {
  return /-dev$/.test(process.env.K_SERVICE || '');
}

/** dev 서비스 알림 본문 앞에 [dev] 태그. 이미 붙어 있으면 그대로 */
export function withEnvTag(text) {
  if (!isDevService()) return text;
  const s = String(text ?? '');
  return s.startsWith('[dev] ') ? s : `[dev] ${s}`;
}

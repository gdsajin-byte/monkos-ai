/**
 * CMS 관리자 인증 미들웨어
 * 기존 monkos_session 쿠키 + ADMIN_UIDS 화이트리스트
 */
import { parseCookies, verifyAuthToken, ADMIN_UIDS, log } from '../shared/config.js';

export function getAdminUser(req) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies.monkos_session;
  if (!token) return null;

  const payload = verifyAuthToken(token);
  if (!payload) return null;

  // ADMIN_UIDS 환경변수에 userId가 포함되어야 관리자
  if (ADMIN_UIDS.length > 0 && !ADMIN_UIDS.includes(payload.userId)) return null;

  return payload; // { userId, expires }
}

export function requireAdmin(req, res) {
  const admin = getAdminUser(req);
  if (!admin) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return null;
  }
  return admin;
}

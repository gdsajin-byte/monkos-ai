/**
 * CMS 관리자 인증 미들웨어
 * 기존 monkos_session 쿠키 + ADMIN_UIDS 화이트리스트
 * + 에이전트 API 키 Bearer 폴백 (민아/코웍이 등)
 */
import { timingSafeEqual } from 'crypto';
import { parseCookies, verifyAuthToken, ADMIN_UIDS, AGENT_API_KEYS, generateAuthToken, parseJsonBody, log } from '../shared/config.js';

function safeCompareKey(input, registered) {
  const a = Buffer.from(input);
  const b = Buffer.from(registered);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function matchAgentKey(apiKey) {
  return AGENT_API_KEYS.some(k => safeCompareKey(apiKey, k));
}

export function getAdminUser(req) {
  // 1. 기존 쿠키 인증 시도 (현행 유지)
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies.monkos_session;
  if (token) {
    const payload = verifyAuthToken(token);
    if (payload && ADMIN_UIDS.length > 0 && ADMIN_UIDS.includes(payload.userId)) {
      return payload; // { userId, expires }
    }
  }

  // 2. Bearer 토큰 폴백 (에이전트 API 키)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer AGENT_') && AGENT_API_KEYS.length > 0) {
    const apiKey = authHeader.slice(7);
    if (matchAgentKey(apiKey)) {
      const parts = apiKey.split('_');
      const agentName = parts.length >= 2 ? parts[1].toLowerCase() : 'unknown';
      log(`[AGENT] 에이전트 인증 성공: agent_${agentName} (Bearer)`, 'INFO');
      return { userId: `agent_${agentName}`, isAdmin: true, isAgent: true };
    }
  }

  return null;
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

/**
 * POST /auth/agent — 에이전트 세션 쿠키 발급
 * Body: { "key": "AGENT_MINA_xxxxx" }
 * Response: Set-Cookie: monkos_session={token} + { success, agent }
 */
export async function handleAgentAuth(req, res) {
  try {
    const { key } = await parseJsonBody(req);
    if (!key || AGENT_API_KEYS.length === 0 || !matchAgentKey(key)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid agent key' }));
      return;
    }

    const parts = key.split('_');
    const agentName = parts.length >= 2 ? parts[1].toLowerCase() : 'unknown';
    const userId = `agent_${agentName}`;

    // 24시간 세션 토큰 발급
    const { token } = generateAuthToken(userId, 24 * 60 * 60 * 1000);

    log(`[AGENT] 에이전트 세션 발급: ${userId} (POST /auth/agent)`, 'INFO');

    res.setHeader('Set-Cookie',
      `monkos_session=${token}; Domain=.monkos.ai; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=86400`
    );
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, agent: agentName }));
  } catch (err) {
    log(`[AGENT] 에이전트 인증 실패: ${err.message}`, 'WARNING');
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Bad request' }));
  }
}

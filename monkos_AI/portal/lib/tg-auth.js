/**
 * tg-auth.js — Telegram Mini App initData HMAC-SHA256 서버측 검증
 * POST /api/tg/verify-init
 */

import { createHmac } from 'crypto';
import { firestore, usersCollection, log, parseJsonBody, TELEGRAM_BOT_TOKEN } from './shared/config.js';

/**
 * Telegram WebApp initData 검증
 * @param {string} initData - Telegram.WebApp.initData 문자열
 * @returns {{ valid: boolean, user?: object, error?: string }}
 */
export function verifyInitData(initData) {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return { valid: false, error: 'hash 누락' };

    // hash 제외 후 알파벳순 정렬
    params.delete('hash');
    const entries = [...params.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n');

    // HMAC-SHA256 key = HMAC-SHA256("WebAppData", BOT_TOKEN)
    const secretKey = createHmac('sha256', 'WebAppData').update(TELEGRAM_BOT_TOKEN).digest();
    const computedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (computedHash !== hash) return { valid: false, error: '서명 불일치' };

    // auth_date 5분 이내 확인
    const authDate = parseInt(params.get('auth_date') || '0', 10);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 300) return { valid: false, error: 'auth_date 만료 (5분 초과)' };

    // user 정보 파싱
    const userStr = params.get('user');
    const user = userStr ? JSON.parse(userStr) : null;

    return { valid: true, user };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

/**
 * POST /api/tg/verify-init — Mini App 인증 엔드포인트
 */
export async function handleVerifyInit(req, res) {
  try {
    const { initData } = await parseJsonBody(req);
    if (!initData) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'initData 필수' }));
      return;
    }

    const result = verifyInitData(initData);
    if (!result.valid) {
      log(`[TG-Auth] 검증 실패: ${result.error}`);
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: result.error, linked: false }));
      return;
    }

    const telegramId = String(result.user?.id || '');
    if (!telegramId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'telegramId 추출 불가', linked: false }));
      return;
    }

    // telegram_links에서 userId 조회 (chatId 기반)
    const linksSnap = await firestore.collection('telegram_links')
      .where('telegramId', '==', telegramId)
      .limit(1)
      .get();

    if (linksSnap.empty) {
      log(`[TG-Auth] 미연동 사용자: telegramId=${telegramId}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ linked: false, telegramId }));
      return;
    }

    const linkData = linksSnap.docs[0].data();
    const userId = linkData.userId;

    // users 컬렉션에서 추가 정보 조회
    const userDoc = await usersCollection.doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : {};

    log(`[TG-Auth] 인증 성공: telegramId=${telegramId} → userId=${userId}`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      linked: true,
      userId,
      telegramId,
      credits: userData.credits ?? 0,
      consentSigned: userData.snsConsentSigned || false,
      missionBonusClaimed: userData.missionBonusClaimed || false,
      missionImageReceived: userData.missionImageReceived || false,
      channelJoined: !!(userData.events?.telegram_join),
    }));
  } catch (err) {
    log(`[TG-Auth] 에러: ${err.message}`, 'ERROR');
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}

/**
 * MONKOS Portal — monkos.ai
 *
 * 메인 포털 서비스
 *   a) 국가/언어 자동 감지 (navigator.language 기반, 클라이언트)
 *   b) Gemini 2.0 Flash 챗봇 (REST, 텍스트 모드)
 *   c) 국가별 서비스 분기 (JP/KR/EN)
 *
 * 인증: Vertex AI ADC (API Key 불필요)
 * Cloud Run 배포용 (HTTP — SSL은 Cloud Run 처리)
 * 포트: 8080 (Cloud Run 기본)
 */

import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { createHmac } from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { Firestore } from '@google-cloud/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '8080', 10);

// === 환경변수 ===
const PROJECT_ID = process.env.PROJECT_ID || 'monkos';
const LOCATION = process.env.LOCATION || 'us-central1';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '933456016842-clagcrpo1juvukjif1m454jq811bd2rq.apps.googleusercontent.com';

// === Lemon Squeezy ===
const LEMONSQUEEZY_API_KEY = process.env.LEMONSQUEEZY_API_KEY || '';
const LEMONSQUEEZY_WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || '';
const LEMONSQUEEZY_STORE_ID = '290457';

// Variant ID → 크레딧 매핑
const VARIANT_CREDITS = {
  '1297524': 10,  // MONKOS 10 Credits — $10
  '1297532': 30,  // MONKOS 30 Credits — $25
  '1297531': 50,  // MONKOS 50 Credits — $40
};

// === Firestore 초기화 ===
const firestore = new Firestore({
  projectId: PROJECT_ID,
});
const usersCollection = firestore.collection('users');

function log(msg) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}`);
}

// === Vertex AI ADC ===
const ai = new GoogleGenAI({
  vertexai: true,
  project: PROJECT_ID,
  location: LOCATION,
});

log('[Vertex AI] ADC 클라이언트 초기화 (Gemini 2.0 Flash 챗봇)');

// === 챗봇 시스템 프롬프트 ===
const SYSTEM_PROMPT = `あなたはMONKOSの公式AIアシスタントです。MONKOSはイメージ専門AIプラットフォームです。

[MONKOSについて]
- イメージ/写真に特化したAIサービスプラットフォーム
- 現在のサービス: AI証明写真（無料）
- 技術: Gemini AI + Imagen（Google最新AI）
- ブランド: MONK.KR（韓国発のクリエイティブAIプラットフォーム）

[サービス案内]
- AI証明写真（日本語）: https://idphoto-jp.monkos.ai/app
  - 完全無料、AIコーチング付き、プロ品質
  - パスポート、履歴書、マイナンバーカード対応
- 韓国語サービス: 準備中
- その他: 英語対応予定

[応答ルール]
- ユーザーの言語に合わせて応答（日本語/韓国語/英語）
- 簡潔で親しみやすいトーン
- MONKOSサービスの案内を自然に行う
- 証明写真サービスを積極的に推薦
- 技術的な質問にも対応可能
- 3文以内で回答`;

// === 대화 히스토리 (인메모리, 세션별) ===
const chatHistories = new Map();
const HISTORY_TTL = 30 * 60 * 1000; // 30분

function cleanupHistories() {
  const now = Date.now();
  for (const [key, val] of chatHistories) {
    if (now - val.lastAccess > HISTORY_TTL) chatHistories.delete(key);
  }
}
setInterval(cleanupHistories, 5 * 60 * 1000);

// === Gemini 챗봇 API ===
async function chatWithGemini(sessionId, userMessage, lang = 'ja') {
  let history = chatHistories.get(sessionId);
  if (!history) {
    history = { messages: [], lastAccess: Date.now() };
    chatHistories.set(sessionId, history);
  }
  history.lastAccess = Date.now();

  // 히스토리에 유저 메시지 추가
  history.messages.push({ role: 'user', parts: [{ text: userMessage }] });

  // 최근 10개만 유지
  if (history.messages.length > 20) {
    history.messages = history.messages.slice(-20);
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: history.messages,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      maxOutputTokens: 300,
      temperature: 0.7,
    },
  });

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // 히스토리에 응답 추가
  history.messages.push({ role: 'model', parts: [{ text }] });

  return text;
}

// === MIME 타입 ===
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// === HTTP 서버 ===
const httpServer = createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 헬스체크
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      service: 'monkos-portal',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      auth: 'Vertex AI ADC',
      chatbot: 'gemini-2.0-flash',
    }));
    return;
  }

  // === 가입자 통계 API ===
  if (req.url === '/api/stats' && req.method === 'GET') {
    try {
      const snapshot = await usersCollection.count().get();
      const totalUsers = snapshot.data().count;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        totalUsers,
        timestamp: new Date().toISOString(),
      }));
    } catch (err) {
      log(`[Stats] 에러: ${err.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // === Google 로그인 API ===
  if (req.url === '/api/auth/google' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { credential } = JSON.parse(body);
        if (!credential) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'credential 필드 필수' }));
          return;
        }

        // Google 토큰 검증
        const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`;
        const verifyRes = await fetch(verifyUrl);
        const tokenInfo = await verifyRes.json();

        if (tokenInfo.error || tokenInfo.aud !== GOOGLE_CLIENT_ID) {
          log(`[Auth] 토큰 검증 실패: ${tokenInfo.error || 'aud 불일치'}`);
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '토큰 검증 실패' }));
          return;
        }

        // Firestore에서 기존 사용자 확인
        const userRef = usersCollection.doc(tokenInfo.sub);
        const userDoc = await userRef.get();
        const isNewUser = !userDoc.exists;

        // 사용자 정보 저장/업데이트
        const user = {
          id: tokenInfo.sub,
          email: tokenInfo.email,
          name: tokenInfo.name,
          picture: tokenInfo.picture,
          lastLogin: new Date().toISOString(),
          ...(isNewUser ? {
            createdAt: new Date().toISOString(),
            credits: 12,  // 가입 보너스 12 크레딧
          } : {}),
        };

        await userRef.set(user, { merge: true });
        log(`[Auth] ${isNewUser ? '신규 가입 (12c 지급)' : '로그인'}: ${user.email}`);

        // 현재 크레딧 조회
        const updatedDoc = await userRef.get();
        const credits = updatedDoc.data()?.credits ?? 0;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          isNewUser,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            picture: user.picture,
            credits,
          }
        }));
      } catch (err) {
        log(`[Auth] 에러: ${err.message}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // === 크레딧 조회 API ===
  if (req.url?.startsWith('/api/credits') && req.method === 'GET') {
    const urlParams = new URL(req.url, `http://${req.headers.host}`);
    const userId = urlParams.searchParams.get('userId');

    if (!userId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'userId 파라미터 필수' }));
      return;
    }

    try {
      const userRef = usersCollection.doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '사용자 없음' }));
        return;
      }

      const credits = userDoc.data()?.credits ?? 0;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ credits, userId }));
    } catch (err) {
      log(`[Credits] 조회 에러: ${err.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // === 크레딧 사용 API ===
  // type: 'generate' (-1c) | 'download' (-10c)
  if (req.url === '/api/credits/use' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { userId, type } = JSON.parse(body);
        if (!userId || !type) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'userId, type 필드 필수' }));
          return;
        }

        const cost = type === 'generate' ? 1 : type === 'download' ? 10 : 0;
        if (cost === 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'type은 generate 또는 download' }));
          return;
        }

        const userRef = usersCollection.doc(userId);

        // 트랜잭션으로 원자적 차감
        const result = await firestore.runTransaction(async (tx) => {
          const userDoc = await tx.get(userRef);
          if (!userDoc.exists) {
            throw new Error('사용자 없음');
          }

          const currentCredits = userDoc.data()?.credits ?? 0;
          if (currentCredits < cost) {
            return { success: false, error: '크레딧 부족', credits: currentCredits, required: cost };
          }

          const newCredits = currentCredits - cost;
          tx.update(userRef, { credits: newCredits });
          return { success: true, credits: newCredits, used: cost, type };
        });

        if (!result.success) {
          log(`[Credits] 부족: ${userId} (${result.credits}c < ${result.required}c)`);
          res.writeHead(402, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
          return;
        }

        log(`[Credits] 사용: ${userId} -${cost}c (${type}) → ${result.credits}c`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        log(`[Credits] 사용 에러: ${err.message}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // === 공유 보너스 API ===
  // 공유 조건 달성 시 +10c 지급
  if (req.url === '/api/credits/share-bonus' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { userId, platform } = JSON.parse(body);
        if (!userId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'userId 필드 필수' }));
          return;
        }

        const userRef = usersCollection.doc(userId);
        const bonus = 10;

        const result = await firestore.runTransaction(async (tx) => {
          const userDoc = await tx.get(userRef);
          if (!userDoc.exists) {
            throw new Error('사용자 없음');
          }

          const currentCredits = userDoc.data()?.credits ?? 0;
          const newCredits = currentCredits + bonus;
          tx.update(userRef, { credits: newCredits });
          return { success: true, credits: newCredits, bonus, platform };
        });

        log(`[Credits] 공유 보너스: ${userId} +${bonus}c (${platform || 'unknown'}) → ${result.credits}c`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        log(`[Credits] 공유 보너스 에러: ${err.message}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // === 크레딧 환불 API ===
  // 생성 실패 등으로 차감된 크레딧을 환불
  if (req.url === '/api/credits/refund' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { userId, type } = JSON.parse(body);
        if (!userId || !type) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'userId, type 필드 필수' }));
          return;
        }

        const refund = type === 'generate' ? 1 : type === 'download' ? 10 : 0;
        if (refund === 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'type은 generate 또는 download' }));
          return;
        }

        const userRef = usersCollection.doc(userId);
        const result = await firestore.runTransaction(async (tx) => {
          const userDoc = await tx.get(userRef);
          if (!userDoc.exists) throw new Error('사용자 없음');
          const current = userDoc.data()?.credits ?? 0;
          const newCredits = current + refund;
          tx.update(userRef, { credits: newCredits });
          return { success: true, credits: newCredits, refunded: refund, type };
        });

        log(`[Credits] 환불: ${userId} +${refund}c (${type}) → ${result.credits}c`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        log(`[Credits] 환불 에러: ${err.message}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // === 크로스 도메인 인증 토큰 생성 ===
  if (req.url === '/api/auth/token' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { userId } = JSON.parse(body);
        if (!userId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'userId 필수' }));
          return;
        }

        // 5분 만료 HMAC 토큰
        const expires = Date.now() + 5 * 60 * 1000;
        const payload = `${userId}:${expires}`;
        const secret = LEMONSQUEEZY_WEBHOOK_SECRET || 'monkos-default-secret';
        const hmac = createHmac('sha256', secret);
        hmac.update(payload);
        const sig = hmac.digest('hex');
        const token = Buffer.from(`${payload}:${sig}`).toString('base64url');

        log(`[Auth] 토큰 생성: ${userId} (만료: ${new Date(expires).toISOString()})`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ token, expires }));
      } catch (err) {
        log(`[Auth] 토큰 생성 에러: ${err.message}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // === 크로스 도메인 인증 토큰 검증 ===
  if (req.url?.startsWith('/api/auth/verify') && req.method === 'GET') {
    const urlParams = new URL(req.url, `http://${req.headers.host}`);
    const token = urlParams.searchParams.get('token');

    if (!token) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'token 파라미터 필수' }));
      return;
    }

    try {
      const decoded = Buffer.from(token, 'base64url').toString();
      const parts = decoded.split(':');
      if (parts.length !== 3) throw new Error('토큰 형식 오류');

      const [userId, expiresStr, sig] = parts;
      const expires = parseInt(expiresStr, 10);

      // 만료 체크
      if (Date.now() > expires) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '토큰 만료' }));
        return;
      }

      // 서명 검증
      const secret = LEMONSQUEEZY_WEBHOOK_SECRET || 'monkos-default-secret';
      const hmac = createHmac('sha256', secret);
      hmac.update(`${userId}:${expiresStr}`);
      const expectedSig = hmac.digest('hex');

      if (sig !== expectedSig) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '토큰 검증 실패' }));
        return;
      }

      // Firestore에서 사용자 정보 조회
      const userRef = usersCollection.doc(userId);
      const userDoc = await userRef.get();
      if (!userDoc.exists) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '사용자 없음' }));
        return;
      }

      const userData = userDoc.data();
      log(`[Auth] 토큰 검증 성공: ${userId}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        user: {
          id: userId,
          email: userData.email,
          name: userData.name,
          picture: userData.picture,
          credits: userData.credits ?? 0,
        }
      }));
    } catch (err) {
      log(`[Auth] 토큰 검증 에러: ${err.message}`);
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // === Lemon Squeezy 체크아웃 URL 생성 ===
  if (req.url === '/api/checkout' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { variantId, userId, email } = JSON.parse(body);
        if (!variantId || !userId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'variantId, userId 필수' }));
          return;
        }

        const checkoutRes = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LEMONSQUEEZY_API_KEY}`,
            'Accept': 'application/vnd.api+json',
            'Content-Type': 'application/vnd.api+json',
          },
          body: JSON.stringify({
            data: {
              type: 'checkouts',
              attributes: {
                checkout_data: {
                  custom: { user_id: userId },
                  email: email || undefined,
                },
              },
              relationships: {
                store: { data: { type: 'stores', id: LEMONSQUEEZY_STORE_ID } },
                variant: { data: { type: 'variants', id: String(variantId) } },
              },
            },
          }),
        });

        const checkoutData = await checkoutRes.json();

        if (!checkoutRes.ok) {
          log(`[Checkout] 에러: ${JSON.stringify(checkoutData)}`);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '체크아웃 생성 실패' }));
          return;
        }

        const checkoutUrl = checkoutData.data?.attributes?.url;
        log(`[Checkout] 생성: ${userId} → variant ${variantId}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ url: checkoutUrl }));
      } catch (err) {
        log(`[Checkout] 에러: ${err.message}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // === Lemon Squeezy 웹훅 ===
  if (req.url === '/api/webhooks/lemonsqueezy' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        // 서명 검증
        const signature = req.headers['x-signature'];
        if (LEMONSQUEEZY_WEBHOOK_SECRET && signature) {
          const hmac = createHmac('sha256', LEMONSQUEEZY_WEBHOOK_SECRET);
          hmac.update(body);
          const digest = hmac.digest('hex');
          if (digest !== signature) {
            log('[Webhook] 서명 검증 실패');
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '서명 불일치' }));
            return;
          }
        }

        const payload = JSON.parse(body);
        const eventName = payload.meta?.event_name;
        log(`[Webhook] 이벤트: ${eventName}`);

        // 주문 완료 → 크레딧 지급
        if (eventName === 'order_created') {
          const attrs = payload.data?.attributes;
          const userId = payload.meta?.custom_data?.user_id;
          const variantId = attrs?.first_order_item?.variant_id?.toString();
          const credits = VARIANT_CREDITS[variantId] || 0;

          if (!userId || credits === 0) {
            log(`[Webhook] 크레딧 지급 불가: userId=${userId}, variantId=${variantId}`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ received: true, action: 'skipped' }));
            return;
          }

          // Firestore 크레딧 추가
          const userRef = usersCollection.doc(userId);
          await firestore.runTransaction(async (tx) => {
            const userDoc = await tx.get(userRef);
            if (!userDoc.exists) {
              log(`[Webhook] 사용자 없음: ${userId}`);
              return;
            }
            const current = userDoc.data()?.credits ?? 0;
            tx.update(userRef, {
              credits: current + credits,
              lastPurchase: new Date().toISOString(),
            });
          });

          log(`[Webhook] 크레딧 지급: ${userId} +${credits}c (variant ${variantId}, $${attrs?.total_formatted || '?'})`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ received: true, action: 'credits_added', credits }));
          return;
        }

        // 환불 → 크레딧 회수
        if (eventName === 'order_refunded') {
          const userId = payload.meta?.custom_data?.user_id;
          const variantId = payload.data?.attributes?.first_order_item?.variant_id?.toString();
          const credits = VARIANT_CREDITS[variantId] || 0;

          if (userId && credits > 0) {
            const userRef = usersCollection.doc(userId);
            await firestore.runTransaction(async (tx) => {
              const userDoc = await tx.get(userRef);
              if (!userDoc.exists) return;
              const current = userDoc.data()?.credits ?? 0;
              tx.update(userRef, { credits: Math.max(0, current - credits) });
            });
            log(`[Webhook] 환불 크레딧 회수: ${userId} -${credits}c`);
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ received: true, action: 'credits_revoked' }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ received: true }));
      } catch (err) {
        log(`[Webhook] 에러: ${err.message}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 챗봇 API
  if (req.url === '/api/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { message, sessionId, lang } = JSON.parse(body);
        if (!message) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'message 필드 필수' }));
          return;
        }
        const sid = sessionId || `anon_${Date.now()}`;
        log(`[Chat][${sid}] ${message.substring(0, 100)}`);

        const reply = await chatWithGemini(sid, message, lang);
        log(`[Chat][${sid}] → ${reply.substring(0, 100)}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ reply, sessionId: sid }));
      } catch (err) {
        log(`[Chat] 에러: ${err.message}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 정적 파일
  let filePath = req.url === '/' ? '/index.html' : req.url;
  // 쿼리스트링 제거
  filePath = filePath.split('?')[0];
  const fullPath = join(__dirname, 'public', filePath);
  const ext = extname(filePath);

  try {
    const content = readFileSync(fullPath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(content);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// === 서버 시작 ===
httpServer.listen(PORT, '0.0.0.0', () => {
  log('='.repeat(60));
  log('MONKOS Portal — monkos.ai 서버 시작');
  log('='.repeat(60));
  log(`포트: ${PORT}`);
  log(`프로젝트: ${PROJECT_ID}`);
  log(`리전: ${LOCATION}`);
  log(`인증: Vertex AI ADC`);
  log(`챗봇: gemini-2.0-flash`);
  log(`DB: Firestore`);
  log('='.repeat(60));
  log('엔드포인트:');
  log('  GET  /health               — 헬스체크');
  log('  GET  /api/stats            — 가입자 통계');
  log('  POST /api/auth/google      — Google 가입/로그인 (+12c 보너스)');
  log('  GET  /api/credits          — 크레딧 조회');
  log('  POST /api/credits/use      — 크레딧 사용 (generate:-1c, download:-10c)');
  log('  POST /api/credits/refund   — 크레딧 환불');
  log('  POST /api/credits/share-bonus — 공유 보너스 (+10c)');
  log('  POST /api/auth/token       — 크로스 도메인 토큰 생성');
  log('  GET  /api/auth/verify      — 토큰 검증');
  log('  POST /api/checkout         — Lemon Squeezy 체크아웃 생성');
  log('  POST /api/webhooks/lemonsqueezy — 결제 웹훅');
  log('  POST /api/chat             — Gemini 챗봇');
  log('  GET  /                     — 메인 포털');
  log(`Google Client ID: ${GOOGLE_CLIENT_ID ? '설정됨' : '미설정'}`);
  log(`Lemon Squeezy: ${LEMONSQUEEZY_API_KEY ? '설정됨' : '미설정'}`);
  log('='.repeat(60));
});

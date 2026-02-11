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

// === Lemon Squeezy (JP/글로벌) ===
const LEMONSQUEEZY_API_KEY = process.env.LEMONSQUEEZY_API_KEY || '';
const LEMONSQUEEZY_WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || '';
const LEMONSQUEEZY_STORE_ID = '290457';

// === 토스페이먼츠 (KR 전용) ===
const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || '';

// Variant ID → 크레딧 매핑 (Lemon Squeezy)
const VARIANT_CREDITS = {
  '1297524': 10,  // MONKOS 10 Credits — $10
  '1297532': 30,  // MONKOS 30 Credits — $25
  '1297531': 50,  // MONKOS 50 Credits — $40
};

// 토스 금액(KRW) → 크레딧 매핑
const TOSS_AMOUNT_CREDITS = {
  12900: 10,   // 10 크레딧 — ₩12,900
  29900: 30,   // 30 크레딧 — ₩29,900
  45900: 50,   // 50 크레딧 — ₩45,900
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
const SYSTEM_PROMPT = `あなたはMONKOS AIの公式アシスタント「モンコス」です。

[MONKOSについて]
- MONK STUDIO が運営するAI写真プラットフォーム
- 技術: Gemini AI + Imagen（Google最新AI）によるリアルタイムコーチング＆高品質証明写真生成
- サイト: https://monkos.ai

[サービス一覧]
1. AI証明写真（日本語）: https://idphoto-jp.monkos.ai/app
   - AIリアルタイム撮影コーチング → AI写真生成 → AI品質検証(QC)
   - パスポート、履歴書、マイナンバーカード対応
2. AI증명사진（韓国語）: https://idphoto-kr.monkos.ai/app
   - AI 실시간 촬영 코칭 → AI 사진 생성 → AI 품질 검증(QC)
   - 여권, 이력서, 주민등록증 대응

[クレジットシステム]
- 毎日先着30名: アンケート回答で12クレジット無料（正午リセット）
- 生成: 1回 = 1クレジット消費
- ダウンロード: 1回 = 10クレジット消費
- SNS共有ボーナス: SNSで共有 or Googleレビュー → 10クレジット獲得
- クレジット購入: 10c/$10 | 30c/$25（おすすめ） | 50c/$40
- 決済: Lemon Squeezy経由（クレジットカード、PayPal、Apple Pay、Google Pay）

[SNS共有ボーナス案内 — 言語別に切り替えること]
- 日本語ユーザー → X(Twitter)での共有を優先案内
  「撮った写真をXでシェアすると10クレジットもらえます！」
- 韓国語ユーザー → Instagramでの共有を優先案内
  「촬영한 사진을 인스타그램에 공유하면 10크레딧을 받을 수 있어요!」
- 英語ユーザー → X or Instagram どちらでもOKと案内

[法的ページ]
- 利用規約: https://monkos.ai/terms.html
- プライバシーポリシー: https://monkos.ai/privacy.html
- 返金ポリシー: https://monkos.ai/refund.html
- 返金条件: 購入後7日以内・完全未使用 → 全額返金 / 1回でも使用 → 返金不可

[応答ポリシー — 3段階]
1. MONKOSサービス関連（証明写真、クレジット、料金、使い方、QC等）
   → 積極的・丁寧に案内。具体的なURL・手順を提示。
2. 写真・画像の一般質問（撮影テクニック、構図、照明、レタッチ等）
   → 親切に回答しつつ「MONKOSならAIが自動でやってくれますよ！」と自然に誘導。
3. 無関係な質問（天気、料理、雑談、プログラミング等）
   → 「すみません、私はMONKOS AI写真の専門アシスタントです😊 写真のことならお任せください！」と丁寧にお断り。

[応答ルール]
- ユーザーの言語に合わせて応答（日本語/韓国語/英語）
- 簡潔で親しみやすいトーン（3文以内）
- SNS案内は必ず言語に合わせて切り替える（日本語→X、韓国語→Instagram）
- 問い合わせ先: gdsajin@gmail.com`;

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
            credits: 0,  // 가입 시 0c (설문 이벤트로 지급)
          } : {}),
        };

        await userRef.set(user, { merge: true });
        log(`[Auth] ${isNewUser ? '신규 가입 (0c)' : '로그인'}: ${user.email}`);

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

          const data = userDoc.data();
          if (data.shareBonusClaimed) {
            const currentCredits = data.credits ?? 0;
            return { success: false, error: '이미 공유 보너스를 받았습니다', credits: currentCredits, alreadyClaimed: true };
          }

          const currentCredits = data.credits ?? 0;
          const newCredits = currentCredits + bonus;
          tx.update(userRef, { credits: newCredits, shareBonusClaimed: true });
          return { success: true, credits: newCredits, bonus, platform };
        });

        if (!result.success) {
          log(`[Credits] 공유 보너스 중복: ${userId} (이미 수령)`);
          res.writeHead(409, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
          return;
        }

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

  // === 설문 이벤트: 일일 선착순 30명 12c 지급 ===
  const SURVEY_DAILY_LIMIT = 30;
  const SURVEY_BONUS = 12;

  // 오늘 날짜 키 (KST 정오 기준)
  function getSurveyDateKey() {
    const now = new Date();
    const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    // 정오 이전이면 전날 키
    if (kst.getUTCHours() < 3) { // UTC 3시 = KST 정오
      kst.setUTCDate(kst.getUTCDate() - 1);
    }
    return kst.toISOString().slice(0, 10); // YYYY-MM-DD
  }

  // 설문 상태 조회
  if (req.url?.startsWith('/api/survey/status') && req.method === 'GET') {
    try {
      const dateKey = getSurveyDateKey();
      const docRef = firestore.collection('daily_survey').doc(dateKey);
      const doc = await docRef.get();
      const count = doc.exists ? (doc.data()?.count ?? 0) : 0;
      const remaining = Math.max(0, SURVEY_DAILY_LIMIT - count);

      // 로그인 유저가 이미 참여했는지 확인
      const urlParams = new URL(req.url, `http://${req.headers.host}`);
      const userId = urlParams.searchParams.get('userId');
      let alreadyDone = false;
      if (userId && doc.exists) {
        const participants = doc.data()?.participants || [];
        alreadyDone = participants.includes(userId);
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ remaining, total: SURVEY_DAILY_LIMIT, count, alreadyDone, dateKey }));
    } catch (err) {
      log(`[Survey] 상태 조회 에러: ${err.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 설문 제출 + 크레딧 지급
  if (req.url === '/api/survey' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { userId, answers } = JSON.parse(body);
        if (!userId || !answers) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'userId, answers 필수' }));
          return;
        }

        const dateKey = getSurveyDateKey();
        const docRef = firestore.collection('daily_survey').doc(dateKey);
        const userRef = usersCollection.doc(userId);

        const result = await firestore.runTransaction(async (tx) => {
          const surveyDoc = await tx.get(docRef);
          const surveyData = surveyDoc.exists ? surveyDoc.data() : { count: 0, participants: [] };
          const count = surveyData.count ?? 0;
          const participants = surveyData.participants || [];

          // 이미 참여했는지 체크
          if (participants.includes(userId)) {
            return { success: false, error: '이미 참여하셨습니다', alreadyDone: true };
          }

          // 선착순 마감 체크
          if (count >= SURVEY_DAILY_LIMIT) {
            return { success: false, error: '오늘 선착순 마감', soldOut: true };
          }

          // 유저 크레딧 추가
          const userDoc = await tx.get(userRef);
          if (!userDoc.exists) {
            return { success: false, error: '사용자 없음' };
          }
          const currentCredits = userDoc.data()?.credits ?? 0;
          const newCredits = currentCredits + SURVEY_BONUS;
          tx.update(userRef, { credits: newCredits, surveyCompleted: dateKey });

          // 카운터 업데이트
          tx.set(docRef, {
            count: count + 1,
            participants: [...participants, userId],
            updatedAt: new Date().toISOString(),
          }, { merge: true });

          // 설문 응답 저장
          const surveyRef = firestore.collection('survey_responses').doc(`${dateKey}_${userId}`);
          tx.set(surveyRef, {
            userId,
            answers,
            dateKey,
            createdAt: new Date().toISOString(),
          });

          return {
            success: true,
            credits: newCredits,
            bonus: SURVEY_BONUS,
            remaining: SURVEY_DAILY_LIMIT - count - 1,
          };
        });

        if (result.success) {
          log(`[Survey] 설문 완료: ${userId} +${SURVEY_BONUS}c → ${result.credits}c (잔여 ${result.remaining}명)`);
        } else {
          log(`[Survey] 거부: ${userId} — ${result.error}`);
        }

        res.writeHead(result.success ? 200 : 409, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        log(`[Survey] 에러: ${err.message}`);
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

  // === 토스페이먼츠 결제 확인 (KR 전용) ===
  if (req.url === '/api/payments/toss/confirm' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { paymentKey, orderId, amount, userId } = JSON.parse(body);
        if (!paymentKey || !orderId || !amount || !userId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'paymentKey, orderId, amount, userId 필수' }));
          return;
        }

        const credits = TOSS_AMOUNT_CREDITS[amount];
        if (!credits) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `유효하지 않은 결제 금액: ${amount}` }));
          return;
        }

        // 토스 API로 결제 승인
        const secretKey = TOSS_SECRET_KEY;
        const authHeader = 'Basic ' + Buffer.from(secretKey + ':').toString('base64');

        const tossRes = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ paymentKey, orderId, amount }),
        });

        const tossData = await tossRes.json();

        if (!tossRes.ok) {
          log(`[Toss] 결제 승인 실패: ${tossData.code} - ${tossData.message}`);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: tossData.message || '결제 승인 실패' }));
          return;
        }

        // Firestore 크레딧 추가
        const userRef = usersCollection.doc(userId);
        const result = await firestore.runTransaction(async (tx) => {
          const userDoc = await tx.get(userRef);
          if (!userDoc.exists) throw new Error('사용자 없음');
          const current = userDoc.data()?.credits ?? 0;
          const newCredits = current + credits;
          tx.update(userRef, {
            credits: newCredits,
            lastPurchase: new Date().toISOString(),
          });
          return newCredits;
        });

        log(`[Toss] 결제 완료: ${userId} +${credits}c (₩${amount}, orderId: ${orderId})`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          credits: result,
          creditsAdded: credits,
          orderId,
        }));
      } catch (err) {
        log(`[Toss] 에러: ${err.message}`);
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
  log('  POST /api/checkout         — Lemon Squeezy 체크아웃 (JP/글로벌)');
  log('  POST /api/webhooks/lemonsqueezy — LS 결제 웹훅');
  log('  POST /api/payments/toss/confirm — 토스페이먼츠 결제 확인 (KR)');
  log('  GET  /api/survey/status    — 설문 이벤트 상태');
  log('  POST /api/survey           — 설문 제출 (+12c, 일일 30명)');
  log('  POST /api/chat             — Gemini 챗봇');
  log('  GET  /                     — 메인 포털');
  log(`Google Client ID: ${GOOGLE_CLIENT_ID ? '설정됨' : '미설정'}`);
  log(`Lemon Squeezy: ${LEMONSQUEEZY_API_KEY ? '설정됨' : '미설정'}`);
  log(`Toss Payments: ${TOSS_SECRET_KEY ? '설정됨' : '미설정'}`);
  log('='.repeat(60));
});

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
import { GoogleGenAI } from '@google/genai';
import { Firestore } from '@google-cloud/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '8080', 10);

// === 환경변수 ===
const PROJECT_ID = process.env.PROJECT_ID || 'monkos';
const LOCATION = process.env.LOCATION || 'us-central1';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '933456016842-clagcrpo1juvukjif1m454jq811bd2rq.apps.googleusercontent.com';

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
          ...(isNewUser ? { createdAt: new Date().toISOString() } : {}),
        };

        await userRef.set(user, { merge: true });
        log(`[Auth] ${isNewUser ? '신규 가입' : '로그인'}: ${user.email}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          isNewUser,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            picture: user.picture,
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
  log('  GET  /health          — 헬스체크');
  log('  GET  /api/stats       — 가입자 통계');
  log('  POST /api/auth/google — Google 가입/로그인');
  log('  POST /api/chat        — Gemini 챗봇');
  log('  GET  /                — 메인 포털');
  log(`Google Client ID: ${GOOGLE_CLIENT_ID ? '설정됨' : '미설정'}`);
  log('='.repeat(60));
});

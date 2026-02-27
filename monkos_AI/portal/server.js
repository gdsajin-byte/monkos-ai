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
import { createHmac, randomBytes } from 'crypto';
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

// === Telegram CS Bot (@monkos_support_bot) ===
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
// === Telegram Event Bot (@monkos_event_bot) ===
const TELEGRAM_EVENT_BOT_TOKEN = process.env.TELEGRAM_EVENT_BOT_TOKEN || '';
// === Telegram Team Bot (@monkos_team_bot) ===
const TELEGRAM_TEAM_BOT_TOKEN = process.env.TELEGRAM_TEAM_BOT_TOKEN || '';
const TEAM_CHAT_ID = process.env.TEAM_CHAT_ID || '';
// === Telegram 채널 (게이트 가입 검증용) ===
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '';
const TEAM_NOTIFY_SECRET = process.env.TEAM_NOTIFY_SECRET || 'monkos-internal';

// === 카카오 로그인 (KR) ===
const KAKAO_REST_API_KEY = process.env.KAKAO_REST_API_KEY || '';
const KAKAO_REDIRECT_URI = process.env.KAKAO_REDIRECT_URI || 'https://monkos.ai/auth/kakao/callback';
const KAKAO_CHANNEL_ID = process.env.KAKAO_CHANNEL_ID || '';

// === LINE 로그인 (JP) ===
const LINE_CHANNEL_ID = process.env.LINE_CHANNEL_ID || '';
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET || '';
const LINE_REDIRECT_URI = process.env.LINE_REDIRECT_URI || 'https://monkos.ai/auth/line/callback';
const pendingLineStates = new Map();

// === 팝업 OAuth 허용 오리진 ===
const ALLOWED_POPUP_ORIGINS = [
  'https://idphoto-kr.monkos.ai',
  'https://idphoto-jp.monkos.ai',
  'https://monkos.ai',
];

/**
 * JSON을 <script> 태그 내에 안전하게 삽입하기 위한 이스케이프
 * </script> 인젝션 방지
 */
function safeJsonForScript(obj) {
  return JSON.stringify(obj).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}

/**
 * HMAC 토큰 생성 (크로스 도메인 인증용)
 * @param {string} userId - 사용자 ID
 * @param {number} ttlMs - 만료 시간 (밀리초)
 * @returns {{ token: string, expires: number }}
 */
function generateAuthToken(userId, ttlMs = 5 * 60 * 1000) {
  const expires = Date.now() + ttlMs;
  const payload = `${userId}:${expires}`;
  const secret = LEMONSQUEEZY_WEBHOOK_SECRET || 'monkos-default-secret';
  const hmac = createHmac('sha256', secret);
  hmac.update(payload);
  const sig = hmac.digest('hex');
  const token = Buffer.from(`${payload}:${sig}`).toString('base64url');
  return { token, expires };
}

/**
 * HMAC 토큰 검증
 * @param {string} token - 검증할 토큰
 * @param {{ allowExpired?: boolean, maxAgeMs?: number }} opts - 옵션
 * @returns {{ userId: string, expires: number } | null}
 */
function verifyAuthToken(token, opts = {}) {
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    const parts = decoded.split(':');
    if (parts.length !== 3) return null;

    const [userId, expiresStr, sig] = parts;
    const expires = parseInt(expiresStr, 10);

    // 서명 검증
    const secret = LEMONSQUEEZY_WEBHOOK_SECRET || 'monkos-default-secret';
    const hmac = createHmac('sha256', secret);
    hmac.update(`${userId}:${expiresStr}`);
    const expectedSig = hmac.digest('hex');
    if (sig !== expectedSig) return null;

    // 만료 검증
    if (!opts.allowExpired && Date.now() > expires) return null;
    if (opts.allowExpired && opts.maxAgeMs) {
      const createdAt = expires - (opts.maxAgeMs > 30 * 24 * 60 * 60 * 1000 ? opts.maxAgeMs : 5 * 60 * 1000);
      // maxAgeMs 이상 오래된 토큰은 거부
      if (Date.now() - expires > opts.maxAgeMs) return null;
    }

    return { userId, expires };
  } catch {
    return null;
  }
}

// === D1 거래 원장 (monk.kr Pages Function) ===
const TX_API_URL = process.env.TX_API_URL || 'https://monk.kr/api/tx';
const TX_API_KEY = process.env.TX_API_KEY || '';

/**
 * D1 거래 원장에 비동기 기록 (fire-and-forget)
 * 실패해도 Firestore 크레딧 작업에 영향 없음
 */
function logTransaction({ userId, amount, type, service = 'portal', provider = 'system', balanceAfter, description, referenceId, metadata }) {
  if (!TX_API_KEY) return;
  fetch(TX_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': TX_API_KEY },
    body: JSON.stringify({ userId, amount, type, service, provider, balanceAfter, description, referenceId, metadata }),
  }).catch(err => log(`[TX] 원장 기록 실패: ${err.message}`, 'WARNING'));
}

// Variant ID → 크레딧 매핑 (Lemon Squeezy)
const VARIANT_CREDITS = {
  '1297524': 10,  // MONKOS 10 Credits — $10
  '1297532': 30,  // MONKOS 30 Credits — $25
  '1297531': 50,  // MONKOS 50 Credits — $40
};

// 토스 금액(KRW) → 크레딧 매핑 (v2: 1c = $0.10 ≈ ₩145)
const TOSS_AMOUNT_CREDITS = {
  1450: 10,    // 기본 10c — ₩1,450 (정가)
  11600: 80,   // 단건 1장: 생성 10c + 다운로드 70c = 80c — ₩11,600
  13050: 100,  // 스탠다드 100c — ₩13,050 (10% 할인)
  34800: 300,  // 프리미엄 300c — ₩34,800 (20% 할인)
  50750: 500,  // 프로 500c — ₩50,750 (30% 할인)
};

// === Firestore 초기화 ===
const firestore = new Firestore({
  projectId: PROJECT_ID,
});
const usersCollection = firestore.collection('users');

// === 비로그인 직접결제 토큰 (in-memory, 5분 TTL) ===
const directTokens = new Map();
const DIRECT_TOKEN_TTL = 5 * 60 * 1000; // 5분
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of directTokens) {
    if (now - data.created > DIRECT_TOKEN_TTL) directTokens.delete(token);
  }
}, 60 * 1000); // 1분마다 정리

/**
 * 구조화된 로깅 (Cloud Logging 호환)
 * @param {string} msg - 로그 메시지
 * @param {'INFO'|'WARNING'|'ERROR'} severity - 심각도
 * @param {Object} meta - 추가 메타데이터
 */
function log(msg, severity = 'INFO', meta = {}) {
  const entry = {
    severity,
    message: msg,
    timestamp: new Date().toISOString(),
    ...meta
  };
  // Cloud Run 환경: JSON 출력 → Cloud Logging 자동 파싱
  // 로컬 환경: 읽기 쉬운 포맷
  if (process.env.K_SERVICE) {
    console.log(JSON.stringify(entry));
  } else {
    console.log(`[${entry.timestamp}] [${severity}] ${msg}`, meta.error || '');
  }
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
- 独自のAIエンジンによるリアルタイム撮影コーチング＆高品質証明写真生成
- 20年のベテラン写真家が開発、10年以上の写真スタジオ運営ノウハウをAIに学習させたプロ品質のシステム
- サイト: https://monkos.ai

[重要: 内部技術名の非公開]
- Gemini、Imagen、Google AI等の内部技術名やモデル名は絶対に言及しない
- 「MONKOSのAI」「独自AI」「MONKOS独自の学習データに基づくAI」等と表現する
- 技術の詳細を聞かれた場合: 「MONKOS独自のAIエンジンで、プロの写真スタジオのノウハウを学習しています」と回答

[サービス一覧]
1. AI証明写真（日本語）: https://idphoto-jp.monkos.ai/app
   - AIリアルタイム撮影コーチング → AI写真生成 → AI品質検証(QC)
   - パスポート、履歴書、マイナンバーカード対応
2. AI증명사진（韓国語）: https://idphoto-kr.monkos.ai/app
   - AI 실시간 촬영 코칭 → AI 사진 생성 → AI 품질 검증(QC)
   - 여권, 이력서, 주민등록증 대응

[クレジットシステム]
- 新規登録ボーナス: 80クレジット即時付与（すぐ体験可能！）
- 生成: 1回 = 10クレジット消費
- ダウンロード: 1回 = 70クレジット消費
- SNS共有ボーナス: SNSで共有 or Googleレビュー → 100クレジット獲得（1回限定）
- Telegramボーナス: @monkos_support_botを友達追加で30クレジット（1回限定）
- 購入（韓国・Toss）: 10c/₩1,450 | 100c/₩13,050（10%OFF） | 300c/₩34,800（20%OFF・おすすめ） | 500c/₩50,750（30%OFF）
- 購入（グローバル・Lemon Squeezy）: 10c/$10 | 30c/$25 | 50c/$40
- 決済: Toss Payments（韓国）/ Lemon Squeezy（グローバル、カード・PayPal・Apple Pay・Google Pay）

[SNS共有ボーナス案内 — 言語別に切り替えること]
- 日本語ユーザー → X(Twitter)での共有を優先案内
  「撮った写真をXでシェアすると100クレジットもらえます！」
- 韓国語ユーザー → Instagramでの共有を優先案内
  「촬영한 사진을 인스타그램에 공유하면 100크레딧을 받을 수 있어요!」
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
- [参考知識]が韓国語でも、必ずユーザーの言語に翻訳して応答
- 簡潔で親しみやすいトーン（3文以内）
- SNS案内は必ず言語に合わせて切り替える（日本語→X、韓国語→Instagram）
- 問い合わせ先: info@monkos.ai / Telegram: @monkos_support_bot`;

// === Telegram CS 전용 시스템 프롬프트 ===
const CS_SYSTEM_PROMPT = `あなたはMONKOS AIのカスタマーサポート担当「MONKOS Support」です。
Telegramを通じてお客様対応を行います。

[重要: 内部技術名の非公開]
- Gemini、Imagen、Google AI、Vertex AI等の内部技術名やモデル名は絶対に言及しない
- 「MONKOSのAI」「独自のAIエンジン」「プロのノウハウを学習したAI」等と表現する

[対応方針]
- 常に丁寧で礼儀正しく、温かみのある対応を心がける
- ポリシーに基づいた正確な回答（曖昧な約束は禁止）
- 解決できない場合はメールエスカレーション案内
- 知らないこと・不確実なことは正直に「確認が必要です」と伝え、推測で回答しない
- MONKOSサービスと無関係な質問には丁寧にお断りする

[文化的配慮 — 厳守]
- 日本語: 最高レベルの敬語（丁寧語・尊敬語）を使用。直接的な拒否を避け、クッション言葉を活用（「恐れ入りますが」「申し訳ございませんが」「ご不便をおかけし」）
- 한국어: 존댓말(합쇼체) 사용. 공감 표현 후 안내 ("불편을 드려 정말 죄송합니다", "도움이 필요하신 부분을 안내해 드리겠습니다")
- English: Professional and warm tone. Use "I'd be happy to help", "I understand your concern", "Thank you for reaching out"
- 中文: 使用礼貌用语（"您好"、"非常抱歉"、"感谢您的耐心"）
- すべての言語で: 顧客の感情を尊重し、文化的に失礼な表現を絶対に使わない

[サービス情報]
- AI証明写真サービス: https://idphoto-jp.monkos.ai/app (日本語) / https://idphoto-kr.monkos.ai/app (한국어)
- ポータル: https://monkos.ai

[クレジットシステム]
- 新規登録ボーナス: 80クレジット即時付与
- 生成: 1回 = 10クレジット
- ダウンロード: 1回 = 70クレジット
- SNS共有ボーナス: 100クレジット（1回限定）
- Telegramボーナス: @monkos_support_bot友達追加で30クレジット（1回限定）
- 購入（韓国）: 10c/₩1,450 | 100c/₩13,050 | 300c/₩34,800 | 500c/₩50,750
- 購入（グローバル）: 10c/$10 | 30c/$25 | 50c/$40
- 決済: Toss Payments（韓国）/ Lemon Squeezy（グローバル）

[返金ポリシー — 厳守]
- 購入後7日以内 + 完全未使用 → 全額返金
- 1回でも使用 → 返金不可（デジタルコンテンツ特性）
- システム障害による消費 → 自動復旧（返金ではなくクレジット復旧）
- 返金申請: info@monkos.ai へメール（購入メール、購入日、理由を記載）

[よくある問い合わせ]
1. 「クレジットが反映されない」→ 少々お待ちください。決済処理に数分かかる場合があります。解決しない場合はメールでお問い合わせください。
2. 「写真の品質が悪い」→ 正面・明るい照明で再撮影をお勧めします。AIコーチの指示に従ってください。
3. 「返金したい」→ 上記返金ポリシーを案内。条件を満たす場合はメールで申請を案内。
4. 「ログインできない」→ Googleアカウントでのログインのみ対応。ブラウザのキャッシュクリアを案内。

[エスカレーション]
以下の場合はメール対応を案内:
- 返金申請 → info@monkos.ai
- アカウント削除 → info@monkos.ai
- 決済トラブル → info@monkos.ai
- 「担当者に直接話したい場合は info@monkos.ai までご連絡ください」

[応答ルール]
- 必ずユーザーが使った言語で応答すること（日本語/韓国語/英語/中国語/その他すべて）
- 参考知識が韓国語でも、必ずユーザーの言語に翻訳して応答
- [参考知識]が提供された場合、その情報を優先的に活用して回答
- 簡潔かつ丁寧（5文以内）
- 感情的なクレームには必ず共感を先に示し、その後ポリシーを丁寧に伝える
- MONKOSサービスと無関係な質問は丁寧にお断り（例:「申し訳ございませんが、当サービスに関するご質問のみ承っております」）
- 法的判断・法的助言は絶対にしない（「法律の専門家にご相談ください」と案内）
- 確信が持てない情報は回答せず、メール(info@monkos.ai)での確認を案内`;

// === 촬영 준비 코치 시스템 프롬프트 ===
const PREP_SYSTEM_PROMPT = `당신은 MONKOS AI의 촬영 준비 코치입니다.
증명사진 촬영을 위한 준비 과정(용도 선택, 의상, 헤어, 표정 등)을 안내합니다.

[역할]
- 사용자가 촬영 목적(여권/이력서/학생증 등)을 선택하도록 안내
- 선택한 용도에 맞는 의상, 헤어스타일, 표정, 배경 가이드 제공
- 한국/일본 증명사진 규격 차이 안내 가능
- 촬영 팁(조명, 각도, 눈 위치) 제공

[대화 스타일]
- 친절하고 간결한 코치 톤 (3문 이내)
- 사용자 언어에 맞춰 응답 (한국어/일본어/영어)
- 선택지를 제시할 때는 번호로 안내
- 촬영과 무관한 질문은 부드럽게 거절

[중요]
- Gemini, Google AI 등 내부 기술명 언급 금지
- "MONKOS AI" 또는 "AI 코치"로만 표현
- 법률/환불 관련은 [참고 지식]에서 정확히 안내`;

// === CS 지식 RAG (Firestore cs_knowledge) ===
const csKnowledgeCollection = firestore.collection('cs_knowledge');
let csKnowledgeCache = [];
let csCacheLastUpdate = 0;
const CS_CACHE_TTL = 10 * 60 * 1000; // 10분 캐시

async function loadCsKnowledge() {
  const now = Date.now();
  if (csKnowledgeCache.length > 0 && now - csCacheLastUpdate < CS_CACHE_TTL) {
    return csKnowledgeCache;
  }
  try {
    const snapshot = await csKnowledgeCollection.get();
    csKnowledgeCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    csCacheLastUpdate = now;
    log(`[RAG] 지식 로드 완료: ${csKnowledgeCache.length}건`);
  } catch (err) {
    log(`[RAG] 지식 로드 실패: ${err.message}`);
  }
  return csKnowledgeCache;
}

function searchCsKnowledge(query) {
  const q = query.toLowerCase();
  const scored = csKnowledgeCache.map(doc => {
    let score = 0;
    const keywords = doc.keywords || [];
    for (const kw of keywords) {
      if (q.includes(kw.toLowerCase())) score += 10;
    }
    const title = (doc.title || '').toLowerCase();
    const content = (doc.content || '').toLowerCase();
    if (q.split(/\s+/).some(w => title.includes(w))) score += 5;
    if (q.split(/\s+/).some(w => content.includes(w))) score += 2;
    return { ...doc, score };
  });
  return scored.filter(d => d.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
}

// === Telegram API ヘルパー ===
const TELEGRAM_CS_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
const TELEGRAM_EVENT_API = `https://api.telegram.org/bot${TELEGRAM_EVENT_BOT_TOKEN}`;
const TELEGRAM_TEAM_API = `https://api.telegram.org/bot${TELEGRAM_TEAM_BOT_TOKEN}`;

async function sendTelegramMessage(chatId, text, botApi = TELEGRAM_CS_API) {
  try {
    await fetch(`${botApi}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    });
  } catch (err) {
    log(`[Telegram] 메시지 전송 실패: ${err.message}`);
  }
}

// === Telegram CS 대화 (Gemini 2.0 Flash, CS 프롬프트) ===
const csHistories = new Map();
const CS_HISTORY_TTL = 60 * 60 * 1000; // 1시간

function cleanupCsHistories() {
  const now = Date.now();
  for (const [key, val] of csHistories) {
    if (now - val.lastAccess > CS_HISTORY_TTL) csHistories.delete(key);
  }
}
setInterval(cleanupCsHistories, 10 * 60 * 1000);


// === Firestore CS 대화 로깅 ===
const csCollection = firestore.collection('cs_conversations');

async function logCsConversation(chatId, username, userMessage, botReply) {
  try {
    const docId = `tg_${chatId}`;
    const docRef = csCollection.doc(docId);
    const doc = await docRef.get();

    const entry = {
      role: 'user', text: userMessage, ts: new Date().toISOString(),
    };
    const replyEntry = {
      role: 'assistant', text: botReply, ts: new Date().toISOString(),
    };

    if (doc.exists) {
      const data = doc.data();
      const messages = data.messages || [];
      messages.push(entry, replyEntry);
      await docRef.update({ messages, updatedAt: new Date().toISOString() });
    } else {
      await docRef.set({
        chatId,
        username: username || '',
        channel: 'telegram',
        messages: [entry, replyEntry],
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    log(`[CS Log] 저장 실패: ${err.message}`);
  }
}

// === 대화 히스토리 (인메모리 + Firestore 영속화) ===
const chatHistories = new Map();
const HISTORY_TTL = 30 * 60 * 1000; // 30분
const chatLogsCollection = firestore.collection('chat_conversations');

function cleanupHistories() {
  const now = Date.now();
  for (const [key, val] of chatHistories) {
    if (now - val.lastAccess > HISTORY_TTL) chatHistories.delete(key);
  }
}
setInterval(cleanupHistories, 5 * 60 * 1000);

// === 코칭 프롬프트 (CF idphoto-coaching.js에서 이식) ===
const COACHING_INSTRUCTIONS = {
  id_photo: `몽코스 AI 코치입니다. 여권/증명사진 촬영을 도와드립니다.

[체크 순서]
1. 정면 응시 (고개 기울기, 시선)
2. 조명 균일 (얼굴에 그림자 없이)
3. 표정 (무표정 또는 자연스러운 미소)
4. 눈썹이 보이는지 (앞머리로 가리면 안됨)
5. 얼굴 라인이 드러나는지 (헤어로 덮으면 안됨)

[응답 규칙]
- 한국어 1문장, 15자 이내
- 문제시 1가지만 지적
- 긍정 표현: "~하면 완벽해요"
- 완벽하면: "좋아요! 지금 촬영하세요"`,

  resume: `몽코스 AI 코치입니다. 이력서 사진 촬영을 도와드립니다.

[체크 순서]
1. 정면 응시 (고개 기울기, 시선)
2. 조명 균일 (얼굴에 그림자 없이)
3. 표정 (자연스럽고 호감가는 미소)
4. 자세 (허리 펴고, 어깨 수평)

[응답 규칙]
- 한국어 1문장, 15자 이내
- 문제시 1가지만 지적
- 긍정 표현: "~하면 완벽해요"
- 완벽하면: "좋아요! 지금 촬영하세요"`,
};

const READY_KEYWORDS = ['좋아요', '완벽', '촬영하세요', 'OK', '좋습니다', '잘 맞', '훌륭', '지금'];

function buildCoachingPrompt(body) {
  const { style, purpose, gender, age, clothing, clothingColor, tie, hair, expression } = body;
  const base = COACHING_INSTRUCTIONS[style] || COACHING_INSTRUCTIONS.id_photo;
  const context = [];

  if (clothing && clothing !== 'as_is') {
    const clothingNames = { suit: '정장', shirt: '셔츠/블라우스', casual: '캐주얼', uniform: '교복' };
    context.push(`사용자 의상: ${clothingNames[clothing] || clothing}`);
    if (clothingColor) {
      const colorNames = { black: '검정', navy: '네이비', charcoal: '차콜', white: '흰색', beige: '베이지', wine: '와인', pastel: '파스텔' };
      context.push(`의상 컬러: ${colorNames[clothingColor] || clothingColor}`);
    }
  }
  if (tie && tie !== 'none' && gender === 'male') {
    const tieNames = { solid_navy: '무지 네이비', solid_wine: '무지 와인', stripe_blue: '스트라이프 블루', stripe_navy: '스트라이프 네이비', stripe_wine: '스트라이프 와인' };
    context.push(`넥타이: ${tieNames[tie] || '착용 예정'}`);
  }
  if (hair && hair !== 'as_is') {
    const hairNames = { tidy: '정돈', up: '올림머리', down: '내림머리' };
    context.push(`헤어 스타일: ${hairNames[hair] || hair}`);
  }
  if (expression) {
    const exprNames = { gentle_smile: '잔잔한 미소', neutral: '무표정', natural_smile: '자연스러운 미소', bright_smile: '밝은 미소' };
    context.push(`목표 표정: ${exprNames[expression] || expression}`);
  }
  if (context.length === 0) return base;
  return base + `\n\n[사용자 설정]\n${context.join('\n')}\n\n위 설정을 참고하여 촬영 전 코칭해 주세요. 의상이나 표정에 대한 구체적인 조언도 가능합니다.`;
}

// === QC 프롬프트 (CF qc.js에서 이식) ===
function buildQCInstruction(gender, age) {
  const genderText = gender === 'male' ? '남성' : '여성';
  const ageMap = { child: '유아~12세', teen: '13~18세', adult: '19세 이상' };
  const ageText = ageMap[age] || '미지정';

  return `2개의 이미지를 비교하고, 2번째 이미지(증명사진)의 품질을 종합 분석해 주세요.
1번째: 원본 (실제 촬영)
2번째: AI 생성물 (증명사진)
사용자 설정: 성별=${genderText}, 연령대=${ageText}

[판정 기준 — 모두 체크 필수]
1. 동일 인물인가? (얼굴 구조, 눈/코/입 비율)
2. 유사도 % (0-100)
3. 아이덴티티 유지 (PASS/FAIL)
4. 성별 일치: 원본 인물의 외형 성별과 생성물이 일치하는가?
5. 연령대 일치: 원본 인물의 외형 나이대와 생성물이 일치하는가?
6. 과도한 보정: 헤어스타일 대폭 변경, 피부 과보정, 얼굴 윤곽 변형, 눈크기 변경 등
7. 증명사진 품질 (조명, 배경, 구도)
8. 2번째 이미지에서 얼굴의 bounding box 좌표 [ymin, xmin, ymax, xmax] (0-1000 정규화)

[FAIL 조건 — 하나라도 해당되면 identity를 FAIL로 판정]
- 성별 외형이 원본과 다르게 변환됨
- 연령대가 원본과 크게 달라짐 (10세 이상 차이 추정)
- 얼굴 윤곽, 눈크기, 코 형태 등이 원본과 다르게 변형됨
- 헤어스타일이 원본과 완전히 다름 (정돈 수준은 허용)
- similarity 70% 미만

[응답 형식 — JSON만 출력]
{
  "same_person": true,
  "similarity": 85,
  "identity": "PASS",
  "gender_match": true,
  "age_match": true,
  "over_retouched": false,
  "quality": "GOOD",
  "face_box": [180, 220, 650, 780],
  "face_ratio": 0.35,
  "face_center_x": 500,
  "head_top_margin": 80,
  "note": "한줄 코멘트"
}

face_ratio = 얼굴 높이 / 전체 이미지 높이 (0.25~0.45 적합)
face_center_x = 얼굴 중심 x좌표 (500 근처면 중앙 정렬, ±50 허용)
head_top_margin = 머리 정수리에서 이미지 상단까지 여백 (40~150 적합)`;
}

// === 채널 설정 ===
const CHANNEL_CONFIG = {
  web: {
    systemPrompt: SYSTEM_PROMPT,
    temperature: 0.7,
    maxOutputTokens: 300,
    historyMap: chatHistories,
    historyTTL: 30 * 60 * 1000,
    maxHistory: 20,
    logCollection: 'chat_conversations',
  },
  telegram: {
    systemPrompt: CS_SYSTEM_PROMPT,
    temperature: 0.5,
    maxOutputTokens: 500,
    historyMap: csHistories,
    historyTTL: 60 * 60 * 1000,
    maxHistory: 20,
    logCollection: 'cs_conversations',
  },
  prep: {
    systemPrompt: PREP_SYSTEM_PROMPT,
    temperature: 0.6,
    maxOutputTokens: 400,
    historyMap: new Map(),
    historyTTL: 30 * 60 * 1000,
    maxHistory: 20,
    logCollection: 'prep_conversations',
  },
  coaching: {
    systemPrompt: COACHING_INSTRUCTIONS.id_photo,
    temperature: 0.3,
    maxOutputTokens: 50,
    stateless: true,
    historyMap: null,
    logCollection: null,
  },
  qc: {
    systemPrompt: '',  // buildQCInstruction()로 동적 생성
    temperature: 0.2,
    maxOutputTokens: 300,
    stateless: true,
    historyMap: null,
    logCollection: 'qc_results',
    responseMimeType: 'application/json',
  },
  kakao: {
    systemPrompt: SYSTEM_PROMPT,
    temperature: 0.7,
    maxOutputTokens: 300,
    historyMap: chatHistories,
    historyTTL: 30 * 60 * 1000,
    maxHistory: 20,
    logCollection: 'kakao_conversations',
  },
};

// Firestore에서 이전 대화 맥락 복원
async function loadChatHistory(sessionId) {
  try {
    const docRef = chatLogsCollection.doc(sessionId);
    const doc = await docRef.get();
    if (doc.exists) {
      const data = doc.data();
      const messages = (data.messages || []).slice(-20).map(m => ({
        role: m.role === 'assistant' ? 'model' : m.role,
        parts: [{ text: m.text }],
      }));
      return { messages, lastAccess: Date.now() };
    }
  } catch (err) {
    log(`[Chat Log] 복원 실패: ${err.message}`);
  }
  return null;
}

// Firestore에 포털 챗봇 대화 저장
async function logChatConversation(sessionId, userMessage, botReply) {
  try {
    const docRef = chatLogsCollection.doc(sessionId);
    const doc = await docRef.get();

    const entry = { role: 'user', text: userMessage, ts: new Date().toISOString() };
    const replyEntry = { role: 'assistant', text: botReply, ts: new Date().toISOString() };

    if (doc.exists) {
      const data = doc.data();
      const messages = data.messages || [];
      messages.push(entry, replyEntry);
      // 최근 40건만 보관 (20턴)
      const trimmed = messages.slice(-40);
      await docRef.update({ messages: trimmed, updatedAt: new Date().toISOString() });
    } else {
      await docRef.set({
        sessionId,
        channel: 'web',
        messages: [entry, replyEntry],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    log(`[Chat Log] 저장 실패: ${err.message}`);
  }
}

// === 통합 챗봇 API ===
async function chatWithMonkos(channel, chatId, userMessage, options = {}) {
  const config = CHANNEL_CONFIG[channel];
  if (!config) throw new Error(`Unknown channel: ${channel}`);

  // 시스템 프롬프트: 오버라이드 > 채널 기본
  const basePrompt = options.systemPromptOverride || config.systemPrompt;

  // --- stateless 채널 (coaching/qc): 히스토리 없이 단발 요청 ---
  if (config.stateless) {
    const parts = [];
    if (options.image) parts.push({ inlineData: { mimeType: 'image/jpeg', data: options.image } });
    if (options.image2) parts.push({ inlineData: { mimeType: 'image/jpeg', data: options.image2 } });
    parts.push({ text: userMessage });

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts }],
      config: {
        systemInstruction: basePrompt,
        maxOutputTokens: config.maxOutputTokens,
        temperature: config.temperature,
        ...(config.responseMimeType && { responseMimeType: config.responseMimeType }),
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  // --- stateful 채널 (web/telegram/prep): 기존 히스토리 로직 ---
  let history = config.historyMap.get(chatId);
  if (!history) {
    if (channel === 'web') {
      history = await loadChatHistory(chatId);
    }
    if (!history) {
      history = { messages: [], lastAccess: Date.now() };
    }
    config.historyMap.set(chatId, history);
  }
  history.lastAccess = Date.now();

  // RAG: stateful 채널 공통
  await loadCsKnowledge();
  const ragDocs = searchCsKnowledge(userMessage);
  let ragContext = '';
  if (ragDocs.length > 0) {
    ragContext = '\n\n[참고 지식]\n' + ragDocs.map(d =>
      `【${d.title}】\n${d.content}`
    ).join('\n\n');
  }

  // 히스토리에 유저 메시지 추가
  history.messages.push({ role: 'user', parts: [{ text: userMessage }] });
  if (history.messages.length > config.maxHistory) {
    history.messages = history.messages.slice(-config.maxHistory);
  }

  const systemPrompt = basePrompt + ragContext;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: history.messages,
    config: {
      systemInstruction: systemPrompt,
      maxOutputTokens: config.maxOutputTokens,
      temperature: config.temperature,
    },
  });

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
  history.messages.push({ role: 'model', parts: [{ text }] });

  // 비동기 로깅 (채널별 Firestore 컬렉션)
  if (channel === 'web') {
    logChatConversation(chatId, userMessage, text).catch(() => {});
  }

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
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

// === HTTP 서버 ===
const httpServer = createServer(async (req, res) => {
  // 보안 헤더
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  // CORS — 화이트리스트 (보안 패치 2026-02-13, dev 추가 2026-02-16)
  const ALLOWED_ORIGINS = [
    // production
    'https://monkos.ai',
    'https://idphoto-jp.monkos.ai',
    'https://idphoto-kr.monkos.ai',
    // Cloud Run 직접 URL (production)
    'https://monkos-idphoto-jp-933456016842.us-central1.run.app',
    'https://monkos-idphoto-kr-933456016842.us-central1.run.app',
    // Cloud Run 직접 URL (dev) — 신형 + 구형 URL 양쪽
    'https://monkos-idphoto-jp-dev-933456016842.us-central1.run.app',
    'https://monkos-idphoto-kr-dev-933456016842.us-central1.run.app',
    'https://monkos-portal-dev-933456016842.us-central1.run.app',
    'https://monkos-idphoto-kr-dev-4jeplpqpua-uc.a.run.app',
    'https://monkos-portal-dev-4jeplpqpua-uc.a.run.app',
    // monk.kr (MPA photolab → monkos.ai 코칭/QC)
    'https://monk.kr',
    // localhost
    'http://localhost:8080',
    'http://localhost:3000',
  ];
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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

  // === 카카오 OAuth (KR) ===
  if (req.url === '/auth/kakao' || req.url?.startsWith('/auth/kakao?')) {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const popup = parsedUrl.searchParams.get('popup') === '1';
    const redirectApp = parsedUrl.searchParams.get('redirect_app') || '';

    // state에 popup 정보 인코딩
    const state = Buffer.from(JSON.stringify({ popup, redirectApp })).toString('base64url');
    const effectiveRedirect = `https://${req.headers.host}/auth/kakao/callback`;
    const authUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${encodeURIComponent(effectiveRedirect)}&response_type=code&state=${state}`;
    res.writeHead(302, { Location: authUrl });
    res.end();
    return;
  }

  if (req.url?.startsWith('/auth/kakao/callback')) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error || !code) {
      res.writeHead(302, { Location: '/' });
      res.end();
      return;
    }

    try {
      const effectiveRedirect = `https://${req.headers.host}/auth/kakao/callback`;
      const tokenBody = {
        grant_type: 'authorization_code',
        client_id: KAKAO_REST_API_KEY,
        redirect_uri: effectiveRedirect,
        code,
        ...(process.env.KAKAO_CLIENT_SECRET ? { client_secret: process.env.KAKAO_CLIENT_SECRET } : {}),
      };
      log(`[Kakao] 토큰 요청: client_id=${KAKAO_REST_API_KEY}, secret=${process.env.KAKAO_CLIENT_SECRET ? 'YES(' + process.env.KAKAO_CLIENT_SECRET + ')' : 'NO'}, redirect=${KAKAO_REDIRECT_URI}, code=${code}`);
      const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(tokenBody),
      });
      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) {
        log(`[Kakao] 토큰 실패 응답: ${JSON.stringify(tokenData)}`);
        throw new Error(`토큰 발급 실패: ${tokenData.error || tokenData.error_code || 'unknown'} - ${tokenData.error_description || ''}`);
      }

      const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const userData = await userRes.json();

      const kakaoId = String(userData.id);
      const nickname = userData.kakao_account?.profile?.nickname || '';
      const email = userData.kakao_account?.email || '';
      const profileImage = userData.kakao_account?.profile?.profile_image_url || '';
      const docId = `kakao_${kakaoId}`;

      const userRef = usersCollection.doc(docId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        await userRef.set({
          provider: 'kakao',
          providerId: kakaoId,
          name: nickname,
          email,
          picture: profileImage,
          credits: 80,
          kakaoAccessToken: tokenData.access_token,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        });
        log(`[Kakao] 신규 가입: ${docId} (${nickname}) +80c 보너스`);
      } else {
        await userRef.update({
          name: nickname,
          picture: profileImage,
          kakaoAccessToken: tokenData.access_token,
          lastLogin: new Date().toISOString(),
        });
        log(`[Kakao] 로그인: ${docId}`);
      }

      const finalDoc = await userRef.get();
      const finalData = finalDoc.data();
      const userInfo = {
        id: docId,
        name: nickname,
        email,
        picture: profileImage,
        provider: 'kakao',
        credits: finalData.credits ?? 0,
      };

      // state에서 popup 정보 추출
      let popupMode = false;
      let redirectApp = '';
      const stateParam = url.searchParams.get('state');
      if (stateParam) {
        try {
          const stateData = JSON.parse(Buffer.from(stateParam, 'base64url').toString());
          popupMode = stateData.popup === true;
          redirectApp = stateData.redirectApp || '';
        } catch {}
      }

      if (popupMode) {
        // 팝업 모드: postMessage로 부모 윈도우에 전달 후 자동 닫힘
        const targetOrigin = ALLOWED_POPUP_ORIGINS.includes(redirectApp)
          ? redirectApp
          : 'https://monkos.ai';
        const { token } = generateAuthToken(docId, 30 * 24 * 60 * 60 * 1000); // 30일

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>로그인 완료</title></head><body><script>
(function() {
  var data = { type: 'auth-success', user: ${safeJsonForScript(userInfo)}, token: ${safeJsonForScript(token)} };
  if (window.opener) {
    window.opener.postMessage(data, ${safeJsonForScript(targetOrigin)});
    window.close();
  } else {
    sessionStorage.setItem('monkos_user', JSON.stringify(data.user));
    location.href = '/';
  }
})();
</script></body></html>`);
      } else {
        // 기존 리다이렉트 방식 (비팝업)
        const userObj = JSON.stringify(userInfo);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><script>
sessionStorage.setItem('monkos_user', ${JSON.stringify(userObj)});
location.href = '/';
</script></body></html>`);
      }
    } catch (err) {
      log(`[Kakao] OAuth 에러: ${err.message}`);
      res.writeHead(302, { Location: '/?error=kakao_auth_failed' });
      res.end();
    }
    return;
  }

  // === LINE OAuth (JP) ===
  if (req.url === '/auth/line' || req.url?.startsWith('/auth/line?')) {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const popup = parsedUrl.searchParams.get('popup') === '1';
    const redirectApp = parsedUrl.searchParams.get('redirect_app') || '';

    const csrf = randomBytes(16).toString('hex');
    // CSRF 토큰 + popup 정보를 state에 합성
    const stateObj = { csrf, popup, redirectApp };
    const state = Buffer.from(JSON.stringify(stateObj)).toString('base64url');

    pendingLineStates.set(csrf, Date.now());
    for (const [k, v] of pendingLineStates) {
      if (Date.now() - v > 10 * 60 * 1000) pendingLineStates.delete(k);
    }
    const effectiveLineRedirect = `https://${req.headers.host}/auth/line/callback`;
    const authUrl = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${LINE_CHANNEL_ID}&redirect_uri=${encodeURIComponent(effectiveLineRedirect)}&state=${state}&scope=profile%20openid%20email`;
    res.writeHead(302, { Location: authUrl });
    res.end();
    return;
  }

  if (req.url?.startsWith('/auth/line/callback')) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error || !code) {
      res.writeHead(302, { Location: '/' });
      res.end();
      return;
    }

    // state에서 CSRF 토큰 + popup 정보 추출
    let lineStateData = { csrf: state, popup: false, redirectApp: '' };
    try {
      lineStateData = JSON.parse(Buffer.from(state, 'base64url').toString());
    } catch {
      // 레거시 state (plain hex) — 하위 호환
      lineStateData = { csrf: state, popup: false, redirectApp: '' };
    }

    if (!lineStateData.csrf || !pendingLineStates.has(lineStateData.csrf)) {
      log('[LINE] state 검증 실패 (CSRF)');
      res.writeHead(302, { Location: '/?error=invalid_state' });
      res.end();
      return;
    }
    pendingLineStates.delete(lineStateData.csrf);

    try {
      const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: `https://${req.headers.host}/auth/line/callback`,
          client_id: LINE_CHANNEL_ID,
          client_secret: LINE_CHANNEL_SECRET,
        }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) throw new Error('トークン発行失敗');

      const profileRes = await fetch('https://api.line.me/v2/profile', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const profileData = await profileRes.json();

      let email = '';
      if (tokenData.id_token) {
        try {
          const payload = JSON.parse(Buffer.from(tokenData.id_token.split('.')[1], 'base64').toString());
          email = payload.email || '';
        } catch {}
      }

      const lineUserId = profileData.userId;
      const displayName = profileData.displayName || '';
      const pictureUrl = profileData.pictureUrl || '';
      const docId = `line_${lineUserId}`;

      const userRef = usersCollection.doc(docId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        await userRef.set({
          provider: 'line',
          providerId: lineUserId,
          name: displayName,
          email,
          picture: pictureUrl,
          credits: 80,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        });
        log(`[LINE] 신규 가입: ${docId} (${displayName}) +80c 보너스`);
      } else {
        await userRef.update({
          name: displayName,
          picture: pictureUrl,
          lastLogin: new Date().toISOString(),
        });
        log(`[LINE] 로그인: ${docId}`);
      }

      const finalDoc = await userRef.get();
      const finalData = finalDoc.data();
      const userInfo = {
        id: docId,
        name: displayName,
        email,
        picture: pictureUrl,
        provider: 'line',
        credits: finalData.credits ?? 0,
      };

      if (lineStateData.popup) {
        // 팝업 모드: postMessage로 부모 윈도우에 전달 후 자동 닫힘
        const targetOrigin = ALLOWED_POPUP_ORIGINS.includes(lineStateData.redirectApp)
          ? lineStateData.redirectApp
          : 'https://monkos.ai';
        const { token } = generateAuthToken(docId, 30 * 24 * 60 * 60 * 1000); // 30일

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>ログイン完了</title></head><body><script>
(function() {
  var data = { type: 'auth-success', user: ${safeJsonForScript(userInfo)}, token: ${safeJsonForScript(token)} };
  if (window.opener) {
    window.opener.postMessage(data, ${safeJsonForScript(targetOrigin)});
    window.close();
  } else {
    sessionStorage.setItem('monkos_user', JSON.stringify(data.user));
    location.href = '/';
  }
})();
</script></body></html>`);
      } else {
        // 기존 리다이렉트 방식 (비팝업)
        const userObj = JSON.stringify(userInfo);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0f0f23;display:flex;justify-content:center;align-items:center;height:100vh;font-family:-apple-system,BlinkMacSystemFont,sans-serif}
.logo{font-size:clamp(2rem,8vw,3rem);font-weight:800;background:linear-gradient(90deg,#a78bfa,#818cf8,#c084fc,#a78bfa);background-size:200% 100%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 2s linear infinite}
@keyframes shimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}
.sub{color:#64748b;margin-top:12px;font-size:0.9rem}
</style>
</head><body>
<div style="text-align:center"><div class="logo">MONKOS AI</div><div class="sub">ログイン中...</div></div>
<script>
sessionStorage.setItem('monkos_user', ${JSON.stringify(userObj)});
location.href = '/';
</script></body></html>`);
      }
    } catch (err) {
      log(`[LINE] OAuth 에러: ${err.message}`);
      res.writeHead(302, { Location: '/?error=line_auth_failed' });
      res.end();
    }
    return;
  }

  // === Google 로그인 API ===
  if (req.url === '/api/auth/google' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { credential, access_token } = JSON.parse(body);
        if (!credential && !access_token) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'credential 또는 access_token 필수' }));
          return;
        }

        let tokenInfo;

        if (credential) {
          // 방법1: GIS One Tap id_token 검증
          const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`;
          const verifyRes = await fetch(verifyUrl);
          tokenInfo = await verifyRes.json();
          if (tokenInfo.error || tokenInfo.aud !== GOOGLE_CLIENT_ID) {
            log(`[Auth] id_token 검증 실패: ${tokenInfo.error || 'aud 불일치'}`, 'WARNING');
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '토큰 검증 실패' }));
            return;
          }
        } else {
          // 방법2: OAuth 팝업 access_token → userinfo 조회
          const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` },
          });
          const userInfo = await userInfoRes.json();
          if (userInfo.error || !userInfo.sub) {
            log(`[Auth] access_token 검증 실패: ${userInfo.error || 'sub 없음'}`, 'WARNING');
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '토큰 검증 실패' }));
            return;
          }
          tokenInfo = {
            sub: userInfo.sub,
            email: userInfo.email,
            name: userInfo.name,
            given_name: userInfo.given_name || '',
            family_name: userInfo.family_name || '',
            picture: userInfo.picture,
            locale: userInfo.locale || '',
            email_verified: String(userInfo.email_verified),
          };
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
          givenName: tokenInfo.given_name || '',
          familyName: tokenInfo.family_name || '',
          picture: tokenInfo.picture,
          locale: tokenInfo.locale || '',
          emailVerified: tokenInfo.email_verified === 'true',
          lastLogin: new Date().toISOString(),
          ...(isNewUser ? {
            createdAt: new Date().toISOString(),
            credits: 80,
          } : {}),
        };

        await userRef.set(user, { merge: true });
        log(`[Auth] ${isNewUser ? '신규 가입 (+80c 보너스)' : '로그인'}: ${user.email}`);

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
      res.end(JSON.stringify({ credits, userId, unit: '$0.10/c', krwRate: 145 }));
    } catch (err) {
      log(`[Credits] 조회 에러: ${err.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // === 크레딧 사용 API ===
  // type: 'generate' (-10c) | 'download' (-70c)
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

        const COST_MAP = { generate: 10, download: 70, extra_crop: 10, full_original: 20 };
        const cost = COST_MAP[type] || 0;
        if (cost === 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '유효하지 않은 type' }));
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
        logTransaction({ userId, amount: -cost, type: 'use', provider: 'system', balanceAfter: result.credits, description: `${type} 사용 (-${cost}c)` });
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

  // === [DEPRECATED] 공유 보너스 API — v2에서 제거 (2026-02-26) ===
  if (req.url === '/api/credits/share-bonus' && req.method === 'POST') {
    log('[Credits] share-bonus 호출 시도 (deprecated)');
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '이 엔드포인트는 더 이상 사용되지 않습니다' }));
    return;
  }

  // === [DEPRECATED] 텔레그램 보너스 API — v2에서 제거 (2026-02-26) ===
  if (req.url?.startsWith('/api/telegram-bonus/') && (req.method === 'GET' || req.method === 'POST')) {
    log(`[TG-Bonus] deprecated 호출: ${req.url}`);
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '이 엔드포인트는 더 이상 사용되지 않습니다' }));
    return;
  }

  // === 텔레그램 게이트 코드 생성 API (v2) ===
  if (req.url === '/api/telegram/gate-code' && req.method === 'POST') {
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

        const userDoc = await usersCollection.doc(userId).get();
        if (!userDoc.exists) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '사용자 없음' }));
          return;
        }

        // 이미 telegram_join 또는 kakao_channel_add 이벤트를 받았는지 체크 (택1)
        const userEvents = userDoc.data()?.events || {};
        if (userEvents.telegram_join || userEvents.kakao_channel_add) {
          res.writeHead(409, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '이미 채널 보너스를 수령했습니다 (텔레그램/카카오 택1)', alreadyClaimed: true }));
          return;
        }

        const code = randomBytes(6).toString('hex').toUpperCase();
        await firestore.collection('telegramGateCodes').doc(code).set({
          userId,
          type: 'gate',
          createdAt: new Date().toISOString(),
          used: false,
        });

        const deeplink = `https://t.me/monkos_event_bot?start=GATE_${code}`;
        log(`[TG-Gate] 코드 생성: ${userId} → ${code}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ deeplink, code }));
      } catch (err) {
        log(`[TG-Gate] 생성 에러: ${err.message}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // === 텔레그램 미션 코드 생성 API (v2) ===
  if (req.url === '/api/telegram/mission-code' && req.method === 'POST') {
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

        const code = randomBytes(6).toString('hex').toUpperCase();
        await firestore.collection('telegramGateCodes').doc(code).set({
          userId,
          type: 'mission',
          createdAt: new Date().toISOString(),
          used: false,
        });

        const deeplink = `https://t.me/monkos_event_bot?start=MISSION_${code}`;
        log(`[TG-Mission] 코드 생성: ${userId} → ${code}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ deeplink, code }));
      } catch (err) {
        log(`[TG-Mission] 생성 에러: ${err.message}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // === SNS 활용 동의서 저장 API (v2) ===
  if (req.url === '/api/consent/sns' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { userId, agreed, timestamp } = JSON.parse(body);
        if (!userId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'userId 필수' }));
          return;
        }
        if (!agreed) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'agreed 필드가 true여야 합니다' }));
          return;
        }

        const userRef = usersCollection.doc(userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '사용자 없음' }));
          return;
        }

        await userRef.update({
          snsConsentSigned: true,
          snsConsentAt: timestamp || new Date().toISOString(),
          snsConsentVersion: 'v2',
          snsConsentPlatforms: ['instagram', 'telegram_channel', 'x', 'youtube'],
          snsConsentDuration: '동의 철회 시까지',
          snsConsentWithdrawMethod: '고객센터 문의 (텔레그램 @monkos_support_bot)',
          snsConsentImageType: 'watermark_preview',
        });

        log(`[Consent] SNS 동의: ${userId}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        log(`[Consent] 에러: ${err.message}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // === 100c 미션 완료 API (v2) ===
  if (req.url === '/api/credits/mission-complete' && req.method === 'POST') {
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

        const userRef = usersCollection.doc(userId);

        const result = await firestore.runTransaction(async (tx) => {
          const userDoc = await tx.get(userRef);
          if (!userDoc.exists) throw new Error('사용자 없음');

          const data = userDoc.data();

          // 중복 방지
          if (data.missionBonusClaimed) {
            return { success: false, error: '이미 미션 보너스를 수령했습니다', credits: data.credits ?? 0 };
          }

          // 조건 확인
          const missing = [];
          if (!data.snsConsentSigned) missing.push('consent');
          if (!data.missionImageReceived) missing.push('image');
          if (missing.length > 0) {
            return { success: false, error: '미션 조건 미충족', missing, credits: data.credits ?? 0 };
          }

          const currentCredits = data.credits ?? 0;
          const newCredits = currentCredits + 100;
          tx.update(userRef, {
            credits: newCredits,
            missionBonusClaimed: true,
            missionBonusAt: new Date().toISOString(),
          });
          return { success: true, credits: newCredits, credited: 100 };
        });

        if (!result.success) {
          const status = result.missing ? 400 : 409;
          log(`[Mission] 미완료: ${userId} (${result.error})`);
          res.writeHead(status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
          return;
        }

        log(`[Mission] 100c 지급: ${userId} → ${result.credits}c`);
        logTransaction({ userId, amount: 100, type: 'event', provider: 'mission', balanceAfter: result.credits, description: '100c 미션 완료' });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        log(`[Mission] 에러: ${err.message}`, 'ERROR');
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

        const REFUND_MAP = { generate: 10, download: 70, extra_crop: 10, full_original: 20 };
        const refund = REFUND_MAP[type] || 0;
        if (refund === 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '유효하지 않은 type' }));
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
        logTransaction({ userId, amount: refund, type: 'refund', provider: 'system', balanceAfter: result.credits, description: `${type} 환불 (+${refund}c)` });
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

  // === 이벤트 크레딧 지급 API ===
  // signup_bonus: +30c, sns_share: +40c, photo_consent: +40c (sns_share/photo_consent 택1)
  if (req.url === '/api/credits/event' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { userId, eventType, eventData } = JSON.parse(body);
        if (!userId || !eventType) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'userId, eventType 필수' }));
          return;
        }

        const EVENT_CREDITS = {
          signup_bonus: 30,
          telegram_join: 40,
          kakao_channel_add: 40,
          mission_complete: 100,
        };

        const granted = EVENT_CREDITS[eventType];
        if (!granted) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'eventType은 signup_bonus, telegram_join, kakao_channel_add, mission_complete 중 하나' }));
          return;
        }

        // 택1 검증: kakao_channel_add와 telegram_join은 둘 다 수령 불가
        if (eventType === 'kakao_channel_add' || eventType === 'telegram_join') {
          const preCheckDoc = await usersCollection.doc(userId).get();
          if (preCheckDoc.exists) {
            const preEvents = preCheckDoc.data()?.events || {};
            if (preEvents.kakao_channel_add || preEvents.telegram_join) {
              res.writeHead(409, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: '카카오 채널 / 텔레그램 채널 보너스는 택1입니다. 이미 수령했습니다.', alreadyClaimed: true }));
              return;
            }
          }
        }

        // kakao_channel_add: 카카오 채널 친구추가 relation 검증
        if (eventType === 'kakao_channel_add') {
          if (!KAKAO_CHANNEL_ID) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '카카오 채널 설정 미완료 (KAKAO_CHANNEL_ID)' }));
            return;
          }

          const kakaoUserDoc = await usersCollection.doc(userId).get();
          if (!kakaoUserDoc.exists) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '사용자 없음' }));
            return;
          }
          const kakaoAccessToken = kakaoUserDoc.data()?.kakaoAccessToken;
          if (!kakaoAccessToken) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '카카오 로그인이 필요합니다. 먼저 카카오로 로그인해주세요.' }));
            return;
          }

          try {
            const channelRes = await fetch('https://kapi.kakao.com/v2/api/talk/channels', {
              headers: { Authorization: `Bearer ${kakaoAccessToken}` },
            });
            const channelData = await channelRes.json();

            if (channelData.code && channelData.code < 0) {
              log(`[Event] 카카오 채널 API 에러: ${JSON.stringify(channelData)}`, 'ERROR');
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: '카카오 토큰이 만료되었습니다. 다시 로그인해주세요.', kakaoError: channelData.msg }));
              return;
            }

            const channels = channelData.channels || [];
            const monkosChannel = channels.find(ch => String(ch.channel_public_id) === KAKAO_CHANNEL_ID || String(ch.channel_id) === KAKAO_CHANNEL_ID);

            if (!monkosChannel || monkosChannel.relation !== 'ADDED') {
              log(`[Event] 카카오 채널 미추가: ${userId} relation=${monkosChannel?.relation || 'NOT_FOUND'}`);
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'MONKOS 카카오 채널을 친구추가 해주세요.', relation: monkosChannel?.relation || 'NOT_FOUND' }));
              return;
            }
            log(`[Event] 카카오 채널 추가 확인: ${userId} relation=${monkosChannel.relation}`);
          } catch (chErr) {
            log(`[Event] 카카오 채널 검증 에러: ${chErr.message}`, 'ERROR');
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '카카오 채널 확인 중 오류' }));
            return;
          }
        }

        // telegram_join: getChatMember로 채널 가입 검증
        if (eventType === 'telegram_join') {
          if (!TELEGRAM_CHANNEL_ID || !TELEGRAM_EVENT_BOT_TOKEN) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '텔레그램 채널 설정 미완료' }));
            return;
          }

          // userId → telegramId 조회 (봇이 GATE_ 딥링크로 매핑 저장)
          const userDoc = await usersCollection.doc(userId).get();
          if (!userDoc.exists) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '사용자 없음' }));
            return;
          }
          const telegramId = userDoc.data()?.telegramId;
          if (!telegramId) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '텔레그램 연동이 필요합니다. 먼저 봇 딥링크를 통해 연동해주세요.' }));
            return;
          }

          // getChatMember 호출
          try {
            const cmRes = await fetch(`${TELEGRAM_EVENT_API}/getChatMember?chat_id=${encodeURIComponent(TELEGRAM_CHANNEL_ID)}&user_id=${telegramId}`);
            const cmData = await cmRes.json();
            const status = cmData.result?.status;
            if (!['member', 'administrator', 'creator'].includes(status)) {
              log(`[Event] 채널 미가입: ${userId} telegramId=${telegramId} status=${status}`);
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: '채널에 가입되지 않았습니다. 채널 가입 후 다시 시도해주세요.', status }));
              return;
            }
            log(`[Event] 채널 가입 확인: ${userId} telegramId=${telegramId} status=${status}`);
          } catch (cmErr) {
            log(`[Event] getChatMember 에러: ${cmErr.message}`, 'ERROR');
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '텔레그램 채널 가입 확인 중 오류' }));
            return;
          }
        }

        const userRef = usersCollection.doc(userId);

        const result = await firestore.runTransaction(async (tx) => {
          const userDoc = await tx.get(userRef);
          if (!userDoc.exists) throw new Error('사용자 없음');

          const data = userDoc.data();
          const events = data.events || {};

          // 중복 체크
          if (events[eventType]) {
            return { success: false, error: '이미 지급된 이벤트', credits: data.credits ?? 0, alreadyClaimed: true };
          }

          // 택1 체크 (트랜잭션 내 race condition 방지)
          if (eventType === 'kakao_channel_add' && events.telegram_join) {
            return { success: false, error: '텔레그램 채널 보너스를 이미 수령했습니다 (택1)', credits: data.credits ?? 0, alreadyClaimed: true };
          }
          if (eventType === 'telegram_join' && events.kakao_channel_add) {
            return { success: false, error: '카카오 채널 보너스를 이미 수령했습니다 (택1)', credits: data.credits ?? 0, alreadyClaimed: true };
          }

          const currentCredits = data.credits ?? 0;
          const newCredits = currentCredits + granted;
          tx.update(userRef, {
            credits: newCredits,
            [`events.${eventType}`]: new Date().toISOString(),
          });
          return { success: true, credits: newCredits, granted, eventType };
        });

        if (!result.success) {
          log(`[Event] 중복 지급 시도: ${userId} ${eventType} (${result.error})`);
          res.writeHead(409, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
          return;
        }

        log(`[Event] 크레딧 지급: ${userId} +${granted}c (${eventType}) → ${result.credits}c`);
        logTransaction({ userId, amount: granted, type: 'event', provider: 'system', balanceAfter: result.credits, description: `${eventType} (+${granted}c)` });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        log(`[Event] 에러: ${err.message}`, 'ERROR');
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

  // === 토큰 갱신 API (장기 세션용) ===
  if (req.url === '/api/auth/refresh' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { token } = JSON.parse(body);
        if (!token) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'token 필수' }));
          return;
        }

        // 만료 허용 검증 (30일 이내)
        const decoded = verifyAuthToken(token, {
          allowExpired: true,
          maxAgeMs: 30 * 24 * 60 * 60 * 1000,
        });
        if (!decoded) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'invalid_token' }));
          return;
        }

        // Firestore에서 사용자 존재 확인
        const userRef = usersCollection.doc(decoded.userId);
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'user_not_found' }));
          return;
        }

        // 새 토큰 발급 (30일 만료)
        const userData = userDoc.data();
        const newToken = generateAuthToken(decoded.userId, 30 * 24 * 60 * 60 * 1000);

        log(`[Auth] 토큰 갱신: ${decoded.userId}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          token: newToken.token,
          expires: newToken.expires,
          user: {
            id: decoded.userId,
            name: userData.name || '',
            email: userData.email || '',
            picture: userData.picture || '',
            credits: userData.credits ?? 0,
            provider: userData.provider || '',
          },
        }));
      } catch (err) {
        log(`[Auth] 토큰 갱신 에러: ${err.message}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
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
          log(`[Checkout] 에러: ${JSON.stringify(checkoutData)}`, 'ERROR');
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '체크아웃 생성 실패' }));
          return;
        }

        const checkoutUrl = checkoutData.data?.attributes?.url;
        log(`[Checkout] 생성: ${userId} → variant ${variantId}`);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ url: checkoutUrl }));
      } catch (err) {
        log(`[Checkout] 에러: ${err.message}`, 'ERROR', { error: err.stack });
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
          const newBalance = await firestore.runTransaction(async (tx) => {
            const userDoc = await tx.get(userRef);
            if (!userDoc.exists) {
              log(`[Webhook] 사용자 없음: ${userId}`);
              return null;
            }
            const current = userDoc.data()?.credits ?? 0;
            const updated = current + credits;
            tx.update(userRef, {
              credits: updated,
              lastPurchase: new Date().toISOString(),
            });
            return updated;
          });

          log(`[Webhook] 크레딧 지급: ${userId} +${credits}c (variant ${variantId}, $${attrs?.total_formatted || '?'})`);
          if (newBalance !== null) {
            logTransaction({ userId, amount: credits, type: 'charge', provider: 'lemon', balanceAfter: newBalance, description: `Lemon 결제 (+${credits}c)`, referenceId: variantId, metadata: { total: attrs?.total_formatted } });
          }
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
            const newBalance = await firestore.runTransaction(async (tx) => {
              const userDoc = await tx.get(userRef);
              if (!userDoc.exists) return null;
              const current = userDoc.data()?.credits ?? 0;
              const updated = Math.max(0, current - credits);
              tx.update(userRef, { credits: updated });
              return updated;
            });
            log(`[Webhook] 환불 크레딧 회수: ${userId} -${credits}c`);
            if (newBalance !== null) {
              logTransaction({ userId, amount: -credits, type: 'refund', provider: 'lemon', balanceAfter: newBalance, description: `Lemon 환불 (-${credits}c)`, referenceId: variantId });
            }
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ received: true, action: 'credits_revoked' }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ received: true }));
      } catch (err) {
        log(`[Webhook] 에러: ${err.message}`, 'ERROR', { error: err.stack });
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

        let credits = TOSS_AMOUNT_CREDITS[amount];

        // 맞춤 충전: 패키지 매핑에 없으면 정가(₩145/c) 기준 10c 배수 검증
        if (!credits) {
          const customCredits = amount / 145;
          if (customCredits >= 10 && Number.isInteger(customCredits) && customCredits % 10 === 0) {
            credits = customCredits;
          } else {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `유효하지 않은 결제 금액: ${amount} (패키지 또는 ₩145 × 10c 배수만 가능)` }));
            return;
          }
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
          log(`[Toss] 결제 승인 실패: ${tossData.code} - ${tossData.message}`, 'ERROR', { userId, amount, orderId });
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
        logTransaction({ userId, amount: credits, type: 'charge', provider: 'toss', balanceAfter: result, description: `토스 결제 (+${credits}c, ₩${amount})`, referenceId: orderId, metadata: { paymentKey, amount } });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          credits: result,
          creditsAdded: credits,
          orderId,
        }));
      } catch (err) {
        log(`[Toss] 에러: ${err.message}`, 'ERROR', { error: err.stack });
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // === 비로그인 직접결제 (토스) ===
  if (req.url === '/api/payments/toss/direct' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { paymentKey, orderId, amount } = JSON.parse(body);
        if (!paymentKey || !orderId || !amount) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'paymentKey, orderId, amount 필수' }));
          return;
        }

        // 토스 API 결제 승인
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
          log(`[Toss-Direct] 결제 승인 실패: ${tossData.code} - ${tossData.message}`, 'ERROR', { amount, orderId });
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: tossData.message || '결제 승인 실패' }));
          return;
        }

        // 일회용 다운로드 토큰 생성
        const downloadToken = randomBytes(32).toString('hex');
        directTokens.set(downloadToken, { created: Date.now(), orderId, amount });

        // 결제 기록 로깅 (Firestore payments/ 컬렉션)
        try {
          await firestore.collection('payments').add({
            type: 'direct',
            orderId,
            amount,
            paymentKey,
            downloadToken,
            createdAt: new Date().toISOString(),
          });
        } catch (logErr) {
          log(`[Toss-Direct] 결제 로그 저장 실패: ${logErr.message}`, 'WARNING');
        }

        log(`[Toss-Direct] 결제 완료: orderId=${orderId}, ₩${amount} → token 발급`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, downloadToken }));
      } catch (err) {
        log(`[Toss-Direct] 에러: ${err.message}`, 'ERROR', { error: err.stack });
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // === 비로그인 직접결제 다운로드 검증 ===
  if (req.url?.startsWith('/api/download/direct') && req.method === 'GET') {
    const urlParams = new URL(req.url, `http://${req.headers.host}`);
    const token = urlParams.searchParams.get('token');

    if (!token) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: '토큰 필수' }));
      return;
    }

    const tokenData = directTokens.get(token);
    if (!tokenData) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: '만료된 토큰' }));
      return;
    }

    // 토큰 삭제 (1회용)
    directTokens.delete(token);
    log(`[Direct-Download] 토큰 사용: orderId=${tokenData.orderId}`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // === 카카오 챗봇 스킬 서버 ===
  if (req.url === '/api/kakao/chatbot' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const kakaoReq = JSON.parse(body);
        const utterance = kakaoReq?.userRequest?.utterance;
        const userId = kakaoReq?.userRequest?.user?.id || 'kakao_anon';

        if (!utterance) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            version: '2.0',
            template: { outputs: [{ simpleText: { text: '질문을 입력해주세요.' } }] }
          }));
          return;
        }

        const sid = `kakao_${userId}`;
        log(`[KakaoChat][${sid}] ${utterance.substring(0, 100)}`);

        const reply = await chatWithMonkos('kakao', sid, utterance);
        log(`[KakaoChat][${sid}] → ${reply.substring(0, 100)}`);

        // 카카오 응답 텍스트 1000자 제한
        const trimmedReply = reply.length > 1000 ? reply.substring(0, 997) + '...' : reply;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          version: '2.0',
          template: {
            outputs: [{ simpleText: { text: trimmedReply } }]
          }
        }));
      } catch (err) {
        log(`[KakaoChat] 에러: ${err.message}`, 'ERROR');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          version: '2.0',
          template: { outputs: [{ simpleText: { text: '죄송합니다. 잠시 후 다시 시도해주세요.' } }] }
        }));
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

        const reply = await chatWithMonkos('web', sid, message);
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

  // === AI 코칭 API (photolab MPA → monkos.ai) ===
  if (req.url === '/api/coaching' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { image, style, purpose, gender, age, clothing, clothingColor, tie, hair, expression } = JSON.parse(body);
        if (!image) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'image 필수' }));
          return;
        }

        const fields = { style, purpose, gender, age, clothing, clothingColor, tie, hair, expression };
        const prompt = buildCoachingPrompt(fields);

        const text = await chatWithMonkos('coaching', 'coaching', '이 사진의 자세, 조명, 표정을 체크해주세요.', {
          image,
          systemPromptOverride: prompt,
        });

        const ready = READY_KEYWORDS.some(kw => text.includes(kw));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ text, ready }));
      } catch (err) {
        log(`[Coaching] 에러: ${err.message}`, 'ERROR');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ text: '', ready: false }));
      }
    });
    return;
  }

  // === AI QC API (photolab MPA → monkos.ai) ===
  if (req.url === '/api/qc' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { original, generated, gender = 'male', age = 'adult', style } = JSON.parse(body);
        if (!original || !generated) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'original, generated 필수' }));
          return;
        }

        // data: prefix 제거
        const origBase64 = original.includes(',') ? original.split(',')[1] : original;
        const genBase64 = generated.includes(',') ? generated.split(',')[1] : generated;

        const qcPrompt = buildQCInstruction(gender, age);

        const text = await chatWithMonkos('qc', 'qc', 'QC 판정해주세요.', {
          image: origBase64,
          image2: genBase64,
          systemPromptOverride: qcPrompt,
        });

        try {
          const result = JSON.parse(text);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ identity: 'ERROR', raw: text }));
        }
      } catch (err) {
        log(`[QC] 에러: ${err.message}`, 'ERROR');
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // === Telegram Event Bot 웹훅 (@monkos_event_bot) — 공유 보너스 전용 ===
  if (req.url === '/api/webhook/telegram-event' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const update = JSON.parse(body);
        const msg = update.message;
        if (!msg) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
          return;
        }

        const chatId = msg.chat.id;
        const username = msg.from?.username || msg.from?.first_name || '';

        // === /start 딥링크 (v2: GATE_ / MISSION_ / 일반) ===
        if (msg.text && msg.text.startsWith('/start')) {
          const parts = msg.text.trim().split(' ');
          const param = parts[1] || '';
          const telegramId = msg.from?.id;

          // --- GATE_{code}: 게이트 Phase2 — userId ↔ telegramId 매핑 + 채널 가입 유도 ---
          if (param.startsWith('GATE_')) {
            const code = param.replace('GATE_', '');
            try {
              const codeRef = firestore.collection('telegramGateCodes').doc(code);
              const codeDoc = await codeRef.get();

              if (!codeDoc.exists || codeDoc.data().type !== 'gate') {
                await sendTelegramMessage(chatId, '유효하지 않은 코드입니다.', TELEGRAM_EVENT_API);
              } else if (codeDoc.data().used) {
                await sendTelegramMessage(chatId, '이미 처리된 코드입니다.', TELEGRAM_EVENT_API);
              } else {
                const userId = codeDoc.data().userId;

                // userId ↔ telegramId 매핑 저장
                await usersCollection.doc(userId).update({
                  telegramId: String(telegramId),
                  telegramChatId: String(chatId),
                  telegramUsername: username,
                  telegramLinkedAt: new Date().toISOString(),
                });

                // telegram_links에도 저장 (역방향 조회용)
                await firestore.collection('telegram_links').doc(String(chatId)).set({
                  chatId,
                  userId,
                  telegramId: String(telegramId),
                  username,
                  linkedAt: new Date().toISOString(),
                  type: 'gate',
                }, { merge: true });

                // 코드 사용 처리
                await codeRef.update({ used: true, usedAt: new Date().toISOString(), chatId: String(chatId), telegramId: String(telegramId) });

                log(`[TG-Gate] 매핑 완료: ${userId} ↔ ${telegramId} (${username})`);

                // 채널 가입 유도 메시지
                const channelLink = TELEGRAM_CHANNEL_ID ? `https://t.me/${TELEGRAM_CHANNEL_ID.replace('@', '')}` : 'https://t.me/MonkosChannel';
                await sendTelegramMessage(chatId, `MONKOS 채널에 가입해주세요! 💜\n\n채널 가입 후 웹으로 돌아가서 "가입 확인" 버튼을 눌러주세요.\n\n[채널 가입하기](${channelLink})`, TELEGRAM_EVENT_API);
              }
            } catch (err) {
              log(`[TG-Gate] 에러: ${err.message}`);
              await sendTelegramMessage(chatId, '처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.', TELEGRAM_EVENT_API);
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true }));
            return;
          }

          // --- MISSION_{code}: 100c 미션 — 이미지 수신 대기 모드 진입 ---
          if (param.startsWith('MISSION_')) {
            const code = param.replace('MISSION_', '');
            try {
              const codeRef = firestore.collection('telegramGateCodes').doc(code);
              const codeDoc = await codeRef.get();

              if (!codeDoc.exists || codeDoc.data().type !== 'mission') {
                await sendTelegramMessage(chatId, '유효하지 않은 미션 코드입니다.', TELEGRAM_EVENT_API);
              } else {
                const userId = codeDoc.data().userId;

                // 미션 수신 대기 모드 설정
                await firestore.collection('telegram_links').doc(String(chatId)).set({
                  chatId,
                  userId,
                  telegramId: String(telegramId),
                  username,
                  missionPending: true,
                  missionCode: code,
                  linkedAt: new Date().toISOString(),
                  type: 'mission',
                }, { merge: true });

                await codeRef.update({ used: true, usedAt: new Date().toISOString(), chatId: String(chatId) });

                log(`[TG-Mission] 미션 대기: ${userId} (chatId: ${chatId})`);
                await sendTelegramMessage(chatId, '증명사진 결과물을 보내주세요! 📸\n\n캡쳐본이나 다운받은 사진을 이 채팅에 보내주시면 됩니다.\n\n---\n証明写真の結果を送ってください！ 📸', TELEGRAM_EVENT_API);
              }
            } catch (err) {
              log(`[TG-Mission] 에러: ${err.message}`);
              await sendTelegramMessage(chatId, '처리 중 오류가 발생했습니다.', TELEGRAM_EVENT_API);
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true }));
            return;
          }

          // --- 일반 /start (파라미터 없음 또는 레거시) ---
          const welcome = `🎁 *MONKOS 이벤트 봇*에 오신 것을 환영합니다!\n\nMONKOS 앱에서 이벤트에 참여하고 보너스를 받아보세요 💜\n고객 문의는 @monkos\\_support\\_bot 으로 부탁드려요!\n\n---\n🎁 *MONKOS イベントBot* へようこそ！\n\nイベントに参加してボーナスをゲット 💜\nお問い合わせは @monkos\\_support\\_bot へどうぞ！`;
          await sendTelegramMessage(chatId, welcome, TELEGRAM_EVENT_API);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
          return;
        }

        // === 이미지 메시지: 미션 이미지 수신 처리 (v2) ===
        if (msg.photo && msg.photo.length > 0) {
          log(`[TG-Event] 이미지 수신: ${username}(${chatId})`);

          const linkDoc = await firestore.collection('telegram_links').doc(String(chatId)).get();
          if (!linkDoc.exists || !linkDoc.data().userId) {
            await sendTelegramMessage(chatId, '📱 먼저 MONKOS 앱에서 텔레그램 연결을 해주세요!\nまず MONKOS アプリからテレグラム連携をしてください！', TELEGRAM_EVENT_API);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true }));
            return;
          }

          const linkData = linkDoc.data();
          const linkedUserId = linkData.userId;

          // 동의서 서명 여부 확인 (v3: 미서명 시 이미지 수신 거부)
          const userDoc = await usersCollection.doc(linkedUserId).get();
          if (!userDoc.exists || !userDoc.data()?.snsConsentSigned) {
            await sendTelegramMessage(chatId, '⚠️ SNS 활용 동의서를 먼저 서명해주세요.\nMONKOS 웹에서 동의서 서명 후 다시 사진을 보내주세요.\n\n---\n⚠️ まずSNS活用同意書にご署名ください。\nMONKOSウェブで同意書に署名してから、もう一度写真を送ってください。', TELEGRAM_EVENT_API);
            log(`[TG-Mission] 동의서 미서명 → 이미지 거부: ${linkedUserId}`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true }));
            return;
          }

          // 미션 이미지 수신 처리 — 이미지 파일 ID 저장 + 플래그 설정
          const fileId = msg.photo[msg.photo.length - 1].file_id;
          await usersCollection.doc(linkedUserId).update({
            missionImageReceived: true,
            missionImageFileId: fileId,
            missionImageAt: new Date().toISOString(),
            missionImageType: 'user_upload',
          });

          // telegram_links 업데이트
          await firestore.collection('telegram_links').doc(String(chatId)).update({
            missionPending: false,
            missionImageReceived: true,
            missionImageAt: new Date().toISOString(),
          });

          log(`[TG-Mission] 이미지 수신 완료: ${linkedUserId} (fileId: ${fileId})`);
          await sendTelegramMessage(chatId, '사진을 받았습니다! 감사합니다 💜\n\nMONKOS 웹으로 돌아가서 "미션 완료 확인" 버튼을 눌러주세요.\n\n---\n写真を受け取りました！ ありがとう 💜\n\nMONKOS ウェブに戻って「ミッション完了確認」ボタンを押してください。', TELEGRAM_EVENT_API);

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
          return;
        }

        // === 이벤트 봇에서 일반 텍스트 → 안내 ===
        if (msg.text) {
          await sendTelegramMessage(chatId, `이 봇은 MONKOS 이벤트 전용입니다 🎁\n\n고객 문의는 @monkos\\_support\\_bot 으로 부탁드려요!\n\n---\nこのBotはイベント専用です 🎁\n\nお問い合わせは @monkos\\_support\\_bot へどうぞ！`, TELEGRAM_EVENT_API);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        log(`[TG-Event] 웹훅 에러: ${err.message}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      }
    });
    return;
  }

  // === Telegram Team Bot 웹훅 (@monkos_team_bot) — 팀 협업 전용 ===
  if (req.url === '/api/webhook/telegram-team' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const update = JSON.parse(body);
        const msg = update.message;
        if (!msg || !msg.text) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
          return;
        }

        const chatId = msg.chat.id;
        const username = msg.from?.username || msg.from?.first_name || '알수없음';
        const displayName = msg.from?.first_name || username;
        const text = msg.text.trim();

        // /report — 보고서 제출
        if (text.startsWith('/report')) {
          const content = text.replace(/^\/report\s*/, '').trim();
          if (!content) {
            await sendTelegramMessage(chatId, '사용법: /report [보고 내용]', TELEGRAM_TEAM_API);
          } else {
            await firestore.collection('team_reports').add({
              author: displayName,
              authorUsername: username,
              chatId,
              content,
              timestamp: new Date().toISOString(),
              category: 'auto'
            });
            const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
            await sendTelegramMessage(chatId, `✅ 보고서 접수 — ${displayName} (${now})`, TELEGRAM_TEAM_API);
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
          return;
        }

        // /status — 서비스 상태
        if (text === '/status') {
          let statusMsg = '📊 MONKOS 서비스 상태\n━━━━━━━━━━━━━━\n';
          const services = [
            { name: 'portal', url: 'https://monkos-portal-4jeplpqpua-uc.a.run.app/health' },
            { name: 'idphoto-kr', url: 'https://monkos-idphoto-kr-4jeplpqpua-uc.a.run.app/health' },
            { name: 'idphoto-jp', url: 'https://monkos-idphoto-jp-4jeplpqpua-uc.a.run.app/health' }
          ];
          for (const svc of services) {
            try {
              const r = await fetch(svc.url, { signal: AbortSignal.timeout(5000) });
              const ok = r.ok;
              statusMsg += `${ok ? '🟢' : '🔴'} ${svc.name}: ${ok ? '정상' : '이상'}\n`;
            } catch {
              statusMsg += `🔴 ${svc.name}: 응답없음\n`;
            }
          }
          // 오늘 보고서 수
          try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const snap = await firestore.collection('team_reports')
              .where('timestamp', '>=', today.toISOString())
              .get();
            statusMsg += `━━━━━━━━━━━━━━\n최근 보고서: ${snap.size}건 (오늘)`;
          } catch {
            statusMsg += '━━━━━━━━━━━━━━';
          }
          await sendTelegramMessage(chatId, statusMsg, TELEGRAM_TEAM_API);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
          return;
        }

        // /help — 도움말
        if (text === '/help' || text === '/start') {
          const helpMsg = '🤖 MONK TeamChat 봇\n━━━━━━━━━━━━━━\n/report [내용] — 보고서 제출\n/status — 서비스 상태 확인\n/help — 이 도움말';
          await sendTelegramMessage(chatId, helpMsg, TELEGRAM_TEAM_API);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
          return;
        }

        // 일반 메시지 — 그룹 대화 간섭 안 함 (무시)
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        log(`[TG-TEAM] 웹훅 에러: ${err.message}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      }
    });
    return;
  }

  // === Telegram CS Bot 웹훅 (@monkos_support_bot) — 고객 상담 전용 ===
  if (req.url === '/api/webhook/telegram' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const update = JSON.parse(body);
        const msg = update.message;
        if (!msg) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
          return;
        }

        const chatId = msg.chat.id;
        const username = msg.from?.username || msg.from?.first_name || '';

        // === /start: CS 안내 ===
        if (msg.text && msg.text.startsWith('/start')) {
          const parts = msg.text.split(' ');
          const param = parts[1] || '';

          // [DEPRECATED] bonus_ 딥링크 — v2에서 제거 (2026-02-26)
          if (param.startsWith('bonus_')) {
            await sendTelegramMessage(chatId, '이 보너스는 종료되었습니다.\nMONKOS 앱에서 새로운 이벤트를 확인해주세요! 💜', TELEGRAM_CS_API);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true }));
            return;
          }

          // 일반 /start — 기존 환영 메시지
          const welcome = `MONKOS AI 고객지원에 오신 것을 환영합니다 🙌\n궁금한 점이 있으시면 편하게 메시지를 보내주세요.\n\n---\nMONKOS AI サポートへようこそ 🙌\nご質問がございましたらお気軽にメッセージをどうぞ。\n\n---\nWelcome to MONKOS AI Support 🙌\nFeel free to send us a message with any questions.`;
          await sendTelegramMessage(chatId, welcome, TELEGRAM_CS_API);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
          return;
        }

        // === 일반 텍스트: Gemini CS 응답 ===
        if (msg.text) {
          const text = msg.text.trim();
          log(`[TG-CS] ${username}(${chatId}): ${text.substring(0, 100)}`);

          const reply = await chatWithMonkos('telegram', chatId, text);
          await sendTelegramMessage(chatId, reply || 'すみません、少々お待ちください。', TELEGRAM_CS_API);
          logCsConversation(chatId, username, text, reply).catch(() => {});
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        log(`[TG-CS] 웹훅 에러: ${err.message}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      }
    });
    return;
  }

  // === Team 알림 API — 에이전트 → 그룹 알림 ===
  if (req.url === '/api/team/notify' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        // 간단 인증
        const secret = req.headers['x-team-secret'] || '';
        if (secret !== TEAM_NOTIFY_SECRET) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Forbidden' }));
          return;
        }

        const { message, sender } = JSON.parse(body);
        if (!message) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'message required' }));
          return;
        }

        if (!TEAM_CHAT_ID) {
          log(`[TG-TEAM] 알림 스킵 (TEAM_CHAT_ID 미설정): ${message}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, skipped: true }));
          return;
        }

        const formatted = sender ? `[${sender}] ${message}` : message;
        await sendTelegramMessage(TEAM_CHAT_ID, formatted, TELEGRAM_TEAM_API);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        log(`[TG-TEAM] 알림 에러: ${err.message}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // === 토스 결제 성공 리다이렉트 (프론트에서 confirm 처리) ===
  if (req.url.startsWith('/toss-success')) {
    const params = new URL(req.url, `http://${req.headers.host}`).searchParams;
    const esc = (s) => (s || '').replace(/[&<>"'`]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#x27;','`':'&#x60;'}[c]));
    const paymentKey = esc(params.get('paymentKey'));
    const orderId = esc(params.get('orderId'));
    const amount = parseInt(params.get('amount')) || 0;
    const userId = esc(params.get('userId'));

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>결제 확인 중...</title>
<style>body{background:#0a0a1a;color:#e2e8f0;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.box{text-align:center;padding:40px}.spinner{width:40px;height:40px;border:3px solid rgba(167,139,250,0.2);border-top-color:#a78bfa;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 20px}
@keyframes spin{to{transform:rotate(360deg)}}.msg{font-size:1.1rem;margin-bottom:8px}.sub{color:#8892a8;font-size:0.85rem}
.ok{color:#34d399;font-size:1.2rem}.err{color:#f87171;font-size:1rem}</style></head>
<body><div class="box" id="box"><div class="spinner"></div><div class="msg">결제 확인 중...</div><div class="sub">잠시만 기다려 주세요</div></div>
<script>
(async()=>{
  const box=document.getElementById('box');
  try{
    const res=await fetch('/api/payments/toss/confirm',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({paymentKey:'${paymentKey}',orderId:'${orderId}',amount:${amount},userId:'${userId}'})});
    const data=await res.json();
    if(data.success){
      box.innerHTML='<div class="ok">\\u2705 결제 완료!</div><div class="msg" style="margin-top:12px">'+data.creditsAdded+' 크레딧이 추가되었습니다</div><div class="sub">현재 잔액: '+data.credits+'c</div><div class="sub" style="margin-top:16px"><a href="/" style="color:#a78bfa">포털로 돌아가기</a></div>';
    }else{
      box.innerHTML='<div class="err">결제 확인 실패</div><div class="sub" style="margin-top:8px">'+(data.error||'알 수 없는 오류')+'</div><div class="sub" style="margin-top:16px"><a href="/" style="color:#a78bfa">포털로 돌아가기</a></div>';
    }
  }catch(e){
    box.innerHTML='<div class="err">네트워크 오류</div><div class="sub" style="margin-top:8px">'+e.message+'</div><div class="sub" style="margin-top:16px"><a href="/" style="color:#a78bfa">포털로 돌아가기</a></div>';
  }
})();
</script></body></html>`;

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  // === 토스 결제 실패 리다이렉트 ===
  if (req.url.startsWith('/toss-fail')) {
    const params = new URL(req.url, `http://${req.headers.host}`).searchParams;
    const escFail = (s) => (s || '').replace(/[&<>"'`]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#x27;','`':'&#x60;'}[c]));
    const message = escFail(params.get('message')) || '결제가 취소되었습니다';

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>결제 실패</title>
<style>body{background:#0a0a1a;color:#e2e8f0;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.box{text-align:center;padding:40px}.err{color:#f87171;font-size:1.2rem;margin-bottom:12px}.sub{color:#8892a8;font-size:0.85rem}</style></head>
<body><div class="box"><div class="err">결제 실패</div><div class="sub">${message}</div><div class="sub" style="margin-top:16px"><a href="/" style="color:#a78bfa">포털로 돌아가기</a></div></div></body></html>`;

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }

  // 정적 파일
  let filePath = req.url === '/' ? '/index.html' : req.url;
  // 쿼리스트링 제거
  filePath = filePath.split('?')[0];
  const fullPath = join(__dirname, 'public', filePath);
  const ext = extname(filePath);

  try {
    let content, resolvedExt = ext;
    try {
      content = readFileSync(fullPath);
    } catch {
      // 확장자 없는 URL → .html 폴백 (/credits → /credits.html)
      if (!ext) {
        content = readFileSync(fullPath + '.html');
        resolvedExt = '.html';
      } else { throw new Error('Not Found'); }
    }
    res.writeHead(200, { 'Content-Type': MIME_TYPES[resolvedExt] || 'application/octet-stream' });
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
  log('  GET  /auth/kakao           — 카카오 로그인 (KR)');
  log('  GET  /auth/kakao/callback  — 카카오 콜백');
  log('  GET  /auth/line            — LINE 로그인 (JP)');
  log('  GET  /auth/line/callback   — LINE 콜백');
  log('  POST /api/auth/google      — Google 가입/로그인');
  log('  GET  /api/credits          — 크레딧 조회');
  log('  POST /api/credits/use      — 크레딧 사용 (generate:-10c, download:-70c)');
  log('  POST /api/credits/refund   — 크레딧 환불');
  log('  POST /api/telegram/gate-code  — 텔레그램 게이트 코드 생성 (v2)');
  log('  POST /api/telegram/mission-code — 텔레그램 미션 코드 생성 (v2)');
  log('  POST /api/consent/sns         — SNS 활용 동의서 저장 (v2)');
  log('  POST /api/credits/mission-complete — 100c 미션 완료 (v2)');
  log('  POST /api/auth/token       — 크로스 도메인 토큰 생성');
  log('  GET  /api/auth/verify      — 토큰 검증');
  log('  POST /api/auth/refresh     — 토큰 갱신 (30일, 장기 세션용)');
  log('  POST /api/checkout         — Lemon Squeezy 체크아웃 (JP/글로벌)');
  log('  POST /api/webhooks/lemonsqueezy — LS 결제 웹훅');
  log('  POST /api/payments/toss/confirm — 토스페이먼츠 결제 확인 (KR)');
  log('  POST /api/payments/toss/direct — 비로그인 직접결제 (KR)');
  log('  GET  /api/download/direct     — 비로그인 다운로드 토큰 검증');
  log('  POST /api/credits/event       — 이벤트 크레딧 (signup +30c, telegram_join/kakao_channel_add +40c 택1, mission_complete +100c)');
  log('  GET  /toss-success         — 토스 결제 성공 리다이렉트');
  log('  GET  /toss-fail            — 토스 결제 실패 리다이렉트');
  log('  [DEP] /api/credits/share-bonus    — deprecated');
  log('  [DEP] /api/telegram-bonus/*       — deprecated');
  log('  POST /api/kakao/chatbot    — 카카오 챗봇 스킬 서버');
  log('  POST /api/chat             — Gemini 챗봇');
  log('  POST /api/coaching         — AI 코칭 (멀티모달)');
  log('  POST /api/qc               — AI QC 품질검수 (멀티모달)');
  log('  POST /api/webhook/telegram       — Telegram CS봇');
  log('  POST /api/webhook/telegram-event — Telegram 이벤트봇');
  log('  POST /api/webhook/telegram-team  — Telegram 팀봇');
  log('  POST /api/team/notify            — 팀 그룹 알림 API');
  log('  GET  /                     — 메인 포털');
  log(`Google Client ID: ${GOOGLE_CLIENT_ID ? '설정됨' : '미설정'}`);
  log(`Lemon Squeezy: ${LEMONSQUEEZY_API_KEY ? '설정됨' : '미설정'}`);
  log(`Toss Payments: ${TOSS_SECRET_KEY ? '설정됨' : '미설정'}`);
  log(`Telegram CS Bot: ${TELEGRAM_BOT_TOKEN ? '설정됨' : '미설정'}`);
  log(`Telegram Event Bot: ${TELEGRAM_EVENT_BOT_TOKEN ? '설정됨' : '미설정'}`);
  log(`Telegram Team Bot: ${TELEGRAM_TEAM_BOT_TOKEN ? '설정됨' : '미설정'}`);
  log(`Telegram Channel: ${TELEGRAM_CHANNEL_ID || '미설정'}`);
  log(`Team Chat ID: ${TEAM_CHAT_ID ? '설정됨' : '미설정'}`);
  log(`Kakao Login: ${KAKAO_REST_API_KEY ? '설정됨' : '미설정'}`);
  log(`Kakao Channel: ${KAKAO_CHANNEL_ID || '미설정'}`);
  log(`LINE Login: ${LINE_CHANNEL_ID ? '설정됨' : '미설정'}`);
  log('='.repeat(60));
});

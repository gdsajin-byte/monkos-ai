/**
 * MONKOS AI 証明写真 — idphoto-jp.monkos.ai
 *
 * 日本市場特化 AI 証明写真サービス
 *   a) Gemini Live コーチング — 撮影前リアルタイムガイド (日本語)
 *   b) Imagen I2I 生成 — 証明写真変換 (gemini-3-pro-image-preview)
 *
 * 認証: ハイブリッド (Vertex AI ADC + Google AI Studio API Key)
 * Cloud Run デプロイ用 (HTTP — SSLはCloud Run処理)
 * ポート: 8080 (Cloud Run デフォルト)
 */

import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { saveImages, addWatermark, cropToSpec, downloadFromGCS, getSignedUrl } from './gcs-save.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '8080', 10);

// === 環境変数 ===
const PROJECT_ID = process.env.PROJECT_ID || 'monkos';
const LOCATION = process.env.LOCATION || 'us-central1';
const PORTAL_API_URL = process.env.PORTAL_API_URL || 'https://monkos.ai';
const GCS_BUCKET = process.env.GCS_BUCKET || 'monk-ai-images';

/**
 * 構造化ロギング (Cloud Logging 互換)
 */
function log(msg, severity = 'INFO', meta = {}) {
  const entry = {
    severity,
    message: msg,
    timestamp: new Date().toISOString(),
    ...meta
  };
  if (process.env.K_SERVICE) {
    console.log(JSON.stringify(entry));
  } else {
    console.log(`[${entry.timestamp}] [${severity}] ${msg}`, meta.error || '');
  }
}

// === ハイブリッド認証 ===
// Live コーチング → Vertex AI ADC
// Imagen I2I 生成 → Google AI Studio API Key (gemini-3-pro-image-previewはVertex AI未対応)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const ai = new GoogleGenAI({
  vertexai: true,
  project: PROJECT_ID,
  location: LOCATION,
});

const imagenAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

log('[Vertex AI] ADC クライアント初期化 (Live)');
log(`[Google AI Studio] Imagen クライアント初期化 (API Key ${GEMINI_API_KEY ? '設定済み' : '未設定'})`);
log(`[Portal API] ${PORTAL_API_URL}`);

// === クレジット API ヘルパー ===
async function useCredits(userId, type) {
  if (!userId) return { success: false, error: 'ログインが必要です' };

  try {
    const response = await fetch(`${PORTAL_API_URL}/api/credits/use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, type }),
    });
    return await response.json();
  } catch (err) {
    log(`[Credits] API呼び出し失敗: ${err.message}`);
    return { success: false, error: 'Portal API接続失敗' };
  }
}

async function refundCredits(userId, type) {
  if (!userId) return { success: false, error: 'ログインが必要です' };

  try {
    const response = await fetch(`${PORTAL_API_URL}/api/credits/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, type }),
    });
    return await response.json();
  } catch (err) {
    log(`[Credits] 返金API呼び出し失敗: ${err.message}`);
    return { success: false, error: 'Portal API接続失敗' };
  }
}

// === コーチング システムプロンプト (日本語ネイティブ) ===
const COACHING_INSTRUCTIONS = {
  passport: `証明写真撮影のAIコーチです。パスポート・証明写真撮影をサポートします。

[コーチングルール]
- 日本語1文、15文字以内
- 問題は1つだけ指摘（角度、表情、照明など）
- ポジティブ表現：「〜すれば完璧です」
- 完璧なら：「いいですね！今撮影してください」

[チェック順序]
1. 正面を向く（傾き、視線）
2. 照明均一（顔に影がない）
3. 表情（無表情または自然な微笑み）
4. 眉毛が見える（前髪で隠さない）
5. フェイスラインが見える（髪で覆わない）
6. 耳が見える（髪で両耳が隠れないように）

[セッション規律]
- 挨拶しないでください。すぐにコーチングだけ始めてください。
- 以前の会話を記憶したり言及しないでください。
- 3秒以内に同じ指摘を繰り返さないでください。
- フレームが良好なら沈黙してください。言うべきことがある時だけ発話してください。
- 撮影準備が完了したら必ず「いいですね！今撮影してください」を含めてください。
- 「今撮影してください」はシステムが自動撮影を実行するトリガーです。確実な時だけ使用してください。

[禁止]
- 自己紹介、雑談、感想、質問
- 「こんにちは」「はじめまして」「お手伝いしましょうか」類の発話`,

  id: `履歴書写真撮影のAIコーチです。

[コーチングルール]
- 日本語1文、15文字以内
- 問題は1つだけ指摘（角度、表情、照明など）
- ポジティブ表現：「〜すれば完璧です」
- 完璧なら：「いいですね！今撮影してください」

[チェック順序]
1. 正面を向く（傾き、視線）
2. 照明均一（顔に影がない）
3. 表情（自然で親しみやすい微笑み）
4. 姿勢（背筋を伸ばし、肩を平行に）
5. 髪と服装がきちんと整っているか

[セッション規律]
- 挨拶しないでください。すぐにコーチングだけ始めてください。
- 以前の会話を記憶したり言及しないでください。
- 3秒以内に同じ指摘を繰り返さないでください。
- フレームが良好なら沈黙してください。言うべきことがある時だけ発話してください。
- 撮影準備が完了したら必ず「いいですね！今撮影してください」を含めてください。
- 「今撮影してください」はシステムが自動撮影を実行するトリガーです。確実な時だけ使用してください。

[禁止]
- 自己紹介、雑談、感想、質問
- 「こんにちは」「はじめまして」「お手伝いしましょうか」類の発話`,
};

// === Imagen プロンプト (CF idgen.js 正本) ===
const IDENTITY_PRESERVATION = `IDENTITY RULE: 90% SAME PERSON + 10% ENHANCEMENT

PRESERVE (90%):
- Face shape, eye shape, nose, lips, skin tone
- Overall facial structure and unique characteristics
- The person must be clearly recognizable as the SAME individual

ENHANCE (10% creative freedom):
- Slightly smoother skin, subtle beauty enhancement
- Optimal lighting and flattering angles
- Minor imperfections can be softened
- Make them look their BEST version (not a different person)

DO NOT:
- Change gender, ethnicity, or age by more than 2-3 years
- Alter fundamental facial features
- Make them unrecognizable
- Make eyes look intense, strained, or unnaturally wide — keep natural calm eye contact

GOAL: "This is ME, but on my best day" - perfectly front-facing, studio flat lighting, 90% accuracy, 10% professional retouching.`;

// === スタイルプロンプト ===
const STYLE_PROMPTS = {
  passport: 'Professional passport/ID photo, perfectly front-facing looking directly at camera, formal white background, sharp focus, head straight, symmetric composition',
  id: 'Professional resume photo for Japanese job application (履歴書), perfectly front-facing looking directly at camera, clean white background, business formal attire, 3:4 ratio, approachable yet professional expression',
};

// === 9フィールドファネル — CF idgen.js 正本移植 ===
const BG_PROMPTS = {
  white:  'pure white (#FFFFFF) background',
  blue:   'soft blue (#4A90D9) studio background',
  gray:   'neutral gray (#9CA3AF) studio background',
  beige:  'warm beige (#D4B896) studio background',
  pink:   'soft pink (#F5A0B8) studio background',
  yellow: 'warm yellow (#FBBF24) studio background',
};

const CLOTHING_PROMPTS = {
  as_is: null,
  suit: 'formal business suit',
  shirt: 'clean dress shirt',
  casual: 'smart casual top',
  uniform: 'neat school uniform',
};

const CLOTHING_COLOR_PROMPTS = {
  black: 'black',
  navy: 'dark navy',
  charcoal: 'charcoal gray',
  white: 'white',
  beige: 'beige',
  wine: 'wine/burgundy',
  pastel: 'soft pastel-toned',
};

const TIE_PROMPTS = {
  none: null,
  solid_navy: 'solid navy tie',
  solid_wine: 'solid wine/burgundy tie',
  stripe_blue: 'blue striped tie',
  stripe_navy: 'navy striped tie',
  stripe_wine: 'wine striped regimental tie',
};

const EXPRESSION_PROMPTS = {
  gentle_smile: 'relaxed pleasant expression with naturally soft eyes, at ease, quiet warmth in face',
  neutral: 'natural calm resting face with soft relaxed eyes, at ease and composed',
  natural_smile: 'gently pleasant face with warm relaxed eyes, approachable and at ease',
  bright_smile: 'warm friendly expression with bright relaxed eyes, naturally pleasant',
};

const HAIR_PROMPTS = {
  as_is: null,
  tidy: 'neatly groomed hair',
  up: 'hair tied up neatly',
  down: 'hair down, well-groomed',
};

// === v5 プロンプトビルダー (SCHEMA_v5_確定.md §6 正本) ===
function buildPromptV5(body) {
  const { format, gender, age, clothing, clothingColor,
          suitColor, shirtColor, tieColor, tiePattern,
          hair, bgColor, expression } = body;

  const parts = [];

  // [1] FORMAT (SCHEMA §6-1)
  if (format === 'passport') {
    parts.push('[FORMAT] Official passport/visa photo. Head centered, face taking 70-80% of frame height. Forehead and eyebrows must be visible. White background mandatory.');
  } else {
    parts.push('[FORMAT] Professional ID photo. Head centered, face taking 70-80% of frame height.');
  }

  // [2] SUBJECT (SCHEMA §6-2 — gender × age = 8組合)
  const SUBJECT_MAP = {
    'f-baby':  'This person is a baby girl (infant/toddler).',
    'f-child': 'This person is a young girl (child, under 12).',
    'f-teen':  'This person is a teenage girl (13-18).',
    'f-adult': 'This person is an adult woman.',
    'm-baby':  'This person is a baby boy (infant/toddler).',
    'm-child': 'This person is a young boy (child, under 12).',
    'm-teen':  'This person is a teenage boy (13-18).',
    'm-adult': 'This person is an adult man.',
  };
  parts.push(`[SUBJECT] ${SUBJECT_MAP[`${gender}-${age}`] || 'This person is an adult.'}`);

  // [3] OUTFIT (SCHEMA §6-3)
  if (!clothing || clothing === 'default') {
    parts.push('[OUTFIT] Keep current clothing as-is. Only ensure it looks neat and tidy.');
  } else if (clothing === 'change') {
    parts.push(`[OUTFIT] Dress this child in a clean ${clothingColor || 'white'} top, age-appropriate and neat.`);
  } else if (clothing === 'casual') {
    parts.push(`[OUTFIT] Dress this person in a ${clothingColor || 'beige'} smart casual top, clean and neat.`);
  } else if (clothing === 'suit') {
    const suit = suitColor || 'navy';
    const shirt = shirtColor || 'white';
    let tieClause = '';
    if (tieColor && tieColor !== 'notie') {
      const pattern = tiePattern === 'stripe' ? 'striped' : 'solid';
      tieClause = ` and a ${pattern} ${tieColor} tie`;
    }
    const top = 'collared dress shirt';
    parts.push(`[OUTFIT] Dress this person in a ${suit} formal business suit with a ${shirt} ${top}${tieClause}.`);
  }

  // [4] HAIR (SCHEMA §6-4)
  if (hair && hair !== 'default') {
    const HAIR_MAP = {
      tidy: 'neatly groomed and tidy hair',
      updo: 'hair styled up neatly (updo)',
    };
    if (HAIR_MAP[hair]) parts.push(`[HAIR] ${HAIR_MAP[hair]}`);
  }

  // [5] BACKGROUND (SCHEMA §6-5)
  const BG_MAP = {
    white: 'pure white (#FFFFFF) background',
    gray:  'neutral gray (#9CA3AF) studio background',
    blue:  'soft blue (#4A90D9) studio background',
    beige: 'warm beige (#D4B896) studio background',
  };
  const finalBg = format === 'passport' ? 'white' : (bgColor || 'white');
  parts.push(`[BACKGROUND] ${BG_MAP[finalBg] || BG_MAP.white}`);

  // [6] EXPRESSION (表情 — EXPRESSION_PROMPTS 活性化)
  const expr = expression || 'gentle_smile';
  if (EXPRESSION_PROMPTS[expr]) {
    parts.push(`[EXPRESSION] ${EXPRESSION_PROMPTS[expr]}`);
  }

  // [7] CONSTRAINT (SCHEMA §6-6)
  parts.push('[CONSTRAINT] Keep the person\'s face and body exactly the same — only apply the specified styling. DO NOT change apparent gender or age.');

  return `${IDENTITY_PRESERVATION}\n\n[IMAGE-TO-IMAGE TRANSFORM]\n${parts.join('\n')}`;
}


// === クライアントセッション管理 ===
const sessions = new Map();

async function connectGeminiLive(session, clientId, style = 'passport') {
  function flushBuffer() {
    if (session.responseBuffer.trim() && session.ws?.readyState === 1) {
      const text = session.responseBuffer.trim();
      const isReady = /今\s*撮影してください|完璧|いいですね/.test(text);
      session.ws.send(JSON.stringify({
        type: 'ai-coaching',
        text,
        ready: isReady,
        timestamp: Date.now(),
      }));
      log(`[コーチング][${clientId}] ${text}${isReady ? ' [READY]' : ''}`);
    }
    session.responseBuffer = '';
    session.bufferFlushTimer = null;
  }

  try {
    session.gemini = await ai.live.connect({
      model: 'gemini-2.0-flash-live-preview-04-09',
      config: {
        responseModalities: ['TEXT'],
        systemInstruction: { parts: [{ text: COACHING_INSTRUCTIONS[style] || COACHING_INSTRUCTIONS.passport }] },
      },
      callbacks: {
        onopen: () => log(`[Gemini Live][${clientId}] 接続完了`),
        onclose: (e) => {
          log(`[Gemini Live][${clientId}] 切断: ${e?.code || 'unknown'}`);
          session.gemini = null;
        },
        onerror: (e) => log(`[Gemini Live][${clientId}] エラー: ${e?.message || e}`),
        onmessage: (msg) => {
          if (msg?.serverContent?.turnComplete) {
            if (session.bufferFlushTimer) clearTimeout(session.bufferFlushTimer);
            flushBuffer();
            return;
          }
          const parts = msg?.serverContent?.modelTurn?.parts;
          if (parts) {
            const text = parts.filter(p => p.text).map(p => p.text).join('');
            if (text) {
              session.responseBuffer += text;
              if (session.bufferFlushTimer) clearTimeout(session.bufferFlushTimer);
              session.bufferFlushTimer = setTimeout(flushBuffer, 600);
            }
          }
        },
      },
    });
    log(`[Gemini Live][${clientId}] セッション初期化完了`);
  } catch (err) {
    log(`[Gemini Live][${clientId}] セッション失敗: ${err.message}`);
  }
}

// === Base64 抽出ヘルパー ===
function extractBase64(base64Input) {
  return base64Input.includes(',') ? base64Input.split(',')[1] : base64Input;
}

// === 事前分析 フォールバックモデル ===
const PRECHECK_MODELS = ['gemini-2.0-flash'];

// === 事前分析 (SPA互換 — Gemini 2.0 Flash via Vertex AI ADC) ===
const PRE_CHECK_INSTRUCTION = `この写真が証明写真の原本として適切かどうか分析してください。

[チェック項目]
1. 顔検出：顔が1つ明確に見えるか？
2. 正面性：正面を向いているか？（左右の傾き、うつむき/あおむき）
3. 照明：顔に強い影や逆光がないか？
4. 鮮明度：ブレなく鮮明か？
5. 顔のサイズ：フレーム対比で顔が十分大きいか？（最低20%）
6. 表情：無表情または自然な微笑みか？
7. 目：目を閉じていないか？
8. 耳：両耳が見えているか？（髪で完全に隠れていないか）

[応答形式 — JSONのみ出力]
{
  "suitable": true,
  "score": 85,
  "face_detected": true,
  "issues": [],
  "suggestion": "一行アドバイス"
}

suitable: 証明写真生成可否 (true/false)
score: 総合スコア (0-100、70以上ならsuitable=true)
issues: 問題リスト (空配列なら問題なし)
suggestion: ユーザーに表示する一行日本語アドバイス`;

async function runPreCheck(imageBase64) {
  const data = extractBase64(imageBase64);

  for (const model of PRECHECK_MODELS) {
    try {
      log(`[事前分析] モデル試行: ${model}`);
      const response = await ai.models.generateContent({
        model,
        contents: [{
          role: 'user',
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data } },
            { text: PRE_CHECK_INSTRUCTION },
          ],
        }],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      log(`[事前分析][${model}] 応答: ${text.substring(0, 300)}`);

      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
      } catch { /* JSONパース失敗 → 次のモデル */ }
      return { suitable: true, score: 0, raw: text };
    } catch (err) {
      log(`[事前分析][${model}] 失敗: ${err.message} → フォールバック`);
      if (model === PRECHECK_MODELS[PRECHECK_MODELS.length - 1]) {
        return { suitable: true, score: 0, note: `分析失敗: ${err.message}` };
      }
    }
  }
}

// === 顔座標検出 (Gemini Flash — 精密クロップ用) ===
const FACE_DETECT_PROMPT = `이 증명사진에서 머리 영역의 좌표를 0~1 비율로 알려주세요.

JSON만 출력:
{ "headTop": 0.xx, "chinBottom": 0.xx, "faceLeft": 0.xx, "faceRight": 0.xx }

headTop: 정수리(머리카락 제외한 머리 최상부)의 Y좌표 (0=이미지상단, 1=이미지하단)
chinBottom: 턱 최하단의 Y좌표
faceLeft: 얼굴 좌측 윤곽 X좌표 (0=이미지좌측, 1=이미지우측)
faceRight: 얼굴 우측 윤곽 X좌표`;

async function detectFace(imageBuffer) {
  try {
    const base64 = imageBuffer.toString('base64');
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{
        role: 'user',
        parts: [
          { inlineData: { mimeType: 'image/png', data: base64 } },
          { text: FACE_DETECT_PROMPT },
        ],
      }],
      config: { responseMimeType: 'application/json', temperature: 0.1 },
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const raw = JSON.parse(match[0]);
      const box = {
        headTop: Number(raw.headTop),
        chinBottom: Number(raw.chinBottom),
        faceLeft: Number(raw.faceLeft),
        faceRight: Number(raw.faceRight),
      };
      if (!isNaN(box.headTop) && !isNaN(box.chinBottom)) {
        log(`[FaceDetect] 成功: headTop=${box.headTop} chin=${box.chinBottom} L=${box.faceLeft} R=${box.faceRight}`);
        return box;
      }
    }
    log('[FaceDetect] パース失敗 → フォールバッククロップ');
    return null;
  } catch (err) {
    log(`[FaceDetect] エラー: ${err.message} → フォールバッククロップ`);
    return null;
  }
}

// =============================================
// Express アプリ
// =============================================
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// セキュリティヘッダー
app.use((req, res, next) => {
  res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  next();
});

// === API ルート ===

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'monkos-idphoto-jp',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
    auth: 'Hybrid (ADC + API Key)',
    geminiLive: 'ready (ADC)',
    imagen: GEMINI_API_KEY ? 'active (API Key)' : 'NO API KEY',
    preCheck: 'active (gemini-2.0-flash)',
  });
});

// サービス情報
app.get('/api/info', (req, res) => {
  res.json({
    service: 'MONKOS AI 証明写真',
    domain: 'idphoto-jp.monkos.ai',
    features: ['AI コーチング (WS)', 'AI 事前分析', 'AI 証明写真生成'],
    styles: Object.keys(STYLE_PROMPTS),
  });
});

// 事前分析 — SPA互換 (ハイフン、Vertex AI ADC)
app.post('/api/pre-check', async (req, res) => {
  try {
    if (!req.body.image) return res.status(400).json({ error: '画像が必要です' });
    const result = await runPreCheck(req.body.image);
    res.json(result);
  } catch (err) {
    log(`[API][pre-check] エラー: ${err.message}`, 'ERROR');
    res.status(500).json({ error: err.message });
  }
});

// 事前分析 — MPA用 (連結、Vertex AI ADC)
app.post('/api/precheck', async (req, res) => {
  try {
    if (!req.body.image) return res.status(400).json({ error: '画像が必要です' });
    const result = await runPreCheck(req.body.image);
    res.json(result);
  } catch (err) {
    log(`[API][precheck] エラー: ${err.message}`, 'ERROR');
    res.status(500).json({ error: err.message });
  }
});

// I2I 生成 — MPA用 (9フィールド CF正本、raw fetch、クレジットチェック含む)
app.post('/api/idgen', async (req, res) => {
  let bodyUserId = null;
  try {
    const apiKey = GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'APIキー未設定' });

    const body = req.body;
    const { image, userId } = body;
    bodyUserId = userId;
    if (!image) return res.status(400).json({ error: '画像が必要です' });

    const base64Data = image.includes(',') ? image.split(',')[1] : image;
    const byteLength = Math.ceil(base64Data.length * 3 / 4);
    log(`[idgen] 入力画像: base64=${base64Data.length}chars, bytes=${byteLength}, KB=${(byteLength/1024).toFixed(1)}`);
    if (byteLength > 2 * 1024 * 1024) {
      return res.status(400).json({ error: '画像が大きすぎます（2MB以下）' });
    }

    // クレジット差引
    if (userId) {
      const creditResult = await useCredits(userId, 'generate');
      if (!creditResult.success) {
        return res.status(402).json({
          error: creditResult.error,
          credits: creditResult.credits ?? 0,
          required: 10,
        });
      }
      log(`[Credits] idgen差引: ${userId} → ${creditResult.credits}c`);
    } else {
      log(`[FREE-GEN] ip=${req.headers['x-forwarded-for'] || req.ip} t=${Date.now()}`);
    }

    if (!body.format || !body.gender || !body.age) {
      return res.status(400).json({ error: '必須値不足: format, gender, age' });
    }
    const instruction = buildPromptV5(body);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [
            { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
            { text: instruction },
          ]}],
          generationConfig: { imageConfig: { aspectRatio: '3:4' } },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let detail = '';
      try { detail = JSON.parse(errorText)?.error?.message || errorText.substring(0, 200); } catch { detail = errorText.substring(0, 200); }
      // 生成失敗時クレジット返金
      if (bodyUserId) await refundCredits(bodyUserId, 'generate');
      throw new Error(`API ${response.status}: ${detail}`);
    }

    const data = await response.json();
    const imagePart = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!imagePart?.inlineData) {
      if (bodyUserId) await refundCredits(bodyUserId, 'generate');
      throw new Error('画像生成失敗：応答に画像がありません');
    }

    const generatedBase64 = imagePart.inlineData.data;
    const generatedBuffer = Buffer.from(generatedBase64, 'base64');

    // ログインユーザー: GCS保存 + ウォーターマーク並列 → ウォーターマーク版応答
    // 非ログイン: 原本そのまま応答 (GCS保存なし)
    if (bodyUserId) {
      const [{ generatedPath }, watermarkedBuffer] = await Promise.all([
        saveImages(bodyUserId, image, generatedBase64),
        addWatermark(generatedBuffer),
      ]);
      res.json({
        image: `data:image/png;base64,${watermarkedBuffer.toString('base64')}`,
        gcsPath: generatedPath,
      });
    } else {
      res.json({ image: `data:image/png;base64,${generatedBase64}` });
    }
  } catch (err) {
    log(`[API][idgen] エラー: ${err.message}`, 'ERROR');
    res.status(500).json({ error: err.message });
  }
});

// クレジット差引
app.post('/api/credit/use', async (req, res) => {
  try {
    if (!req.body.userId) return res.status(400).json({ error: 'ログインが必要です' });
    const result = await useCredits(req.body.userId, req.body.type || 'download');
    res.status(result.success ? 200 : 402).json(result);
  } catch (err) {
    log(`[API][credit/use] エラー: ${err.message}`, 'ERROR');
    res.status(500).json({ error: err.message });
  }
});

// クレジット返金（ダウンロード失敗等）
app.post('/api/credit/refund', async (req, res) => {
  try {
    if (!req.body.userId) return res.status(400).json({ error: 'ログインが必要です' });
    const result = await refundCredits(req.body.userId, req.body.type || 'download');
    res.status(result.success ? 200 : 400).json(result);
  } catch (err) {
    log(`[API][credit/refund] エラー: ${err.message}`, 'ERROR');
    res.status(500).json({ error: err.message });
  }
});

// ダウンロード — Gemini顔検出 + 精密クロップ + 原本Signed URL (クレジット70c 1回差引)
app.post('/api/download', async (req, res) => {
  try {
    const { userId, gcsPath, format } = req.body;
    if (!userId) return res.status(400).json({ error: 'ログインが必要です' });
    if (!gcsPath) return res.status(400).json({ error: 'gcsPathが必要です' });

    // gcsPath検証: 該当ユーザーパスか確認 (他人のファイルアクセス遮断)
    if (!gcsPath.startsWith(`service/idphoto/jp/${userId}/`)) {
      return res.status(403).json({ error: 'アクセス権限なし' });
    }

    // クレジット差引 (70c — クロップ本+原本含む)
    const creditResult = await useCredits(userId, 'download');
    if (!creditResult.success) {
      return res.status(402).json({
        error: creditResult.error,
        credits: creditResult.credits ?? 0,
      });
    }

    // GCSから画像ダウンロード + Signed URL 並列発行
    const [buffer, originalUrl] = await Promise.all([
      downloadFromGCS(gcsPath),
      getSignedUrl(gcsPath),
    ]);

    log(`[Download] ${userId} → ${gcsPath} (ノークロップ原本)`);
    res.json({
      success: true,
      image: `data:image/png;base64,${buffer.toString('base64')}`,
      originalUrl,
      credits: creditResult.credits,
      format: format || 'passport',
    });
  } catch (err) {
    log(`[API][download] エラー: ${err.message}`, 'ERROR');
    res.status(500).json({ error: err.message });
  }
});

// === favicon.ico ===
app.get('/favicon.ico', (req, res) => {
  res.sendFile(join(__dirname, 'public/favicon-32.png'));
});

// === sitemap.xml ===
app.get('/sitemap.xml', (req, res) => {
  const base = 'https://idphoto-jp.monkos.ai';
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: '/',                         priority: '1.0', changefreq: 'weekly',  lastmod: today },
    { loc: '/app',                      priority: '1.0', changefreq: 'weekly',  lastmod: today },
    { loc: '/camera',                   priority: '0.9', changefreq: 'weekly',  lastmod: today },
    { loc: '/prep',                     priority: '0.8', changefreq: 'monthly', lastmod: today },
    // Phase 2.1 — 日本コアキーワード ランディング (2026-04-21)
    { loc: '/guide/shukatsu',           priority: '0.9', changefreq: 'monthly', lastmod: today },
    { loc: '/guide/app-comparison',     priority: '0.9', changefreq: 'monthly', lastmod: today },
    { loc: '/guide/ai',                 priority: '0.9', changefreq: 'monthly', lastmod: today },
    { loc: '/specs/passport',           priority: '0.9', changefreq: 'monthly', lastmod: today },
    { loc: '/specs/drivers-license',    priority: '0.9', changefreq: 'monthly', lastmod: today },
    { loc: '/policy/data',              priority: '0.4', changefreq: 'yearly',  lastmod: '2026-03-08' },
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(u => `  <url>\n    <loc>${base}${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`).join('\n') +
    `\n</urlset>`;
  res.set('Content-Type', 'application/xml');
  res.send(xml);
});

// === ページルート (MPA) ===
app.get('/', (req, res) => res.sendFile(join(__dirname, 'public/index.html')));
app.get('/app', (req, res) => res.sendFile(join(__dirname, 'public/index.html')));
app.get('/prep', (req, res) => res.sendFile(join(__dirname, 'public/prep.html')));
app.get('/camera', (req, res) => res.sendFile(join(__dirname, 'public/camera.html')));
app.get('/result', (req, res) => res.sendFile(join(__dirname, 'public/result.html')));
app.get('/thankyou', (req, res) => res.sendFile(join(__dirname, 'public/thankyou.html')));
app.get('/charge', (req, res) => res.sendFile(join(__dirname, 'public/charge.html')));
app.get('/policy/data', (req, res) => res.sendFile(join(__dirname, 'public/policy-data.html')));

// Phase 2.1 — 日本コアキーワード ランディングページ (2026-04-21)
app.get('/guide/shukatsu',        (req, res) => res.sendFile(join(__dirname, 'public/guide/shukatsu.html')));
app.get('/guide/app-comparison',  (req, res) => res.sendFile(join(__dirname, 'public/guide/app-comparison.html')));
app.get('/guide/ai',              (req, res) => res.sendFile(join(__dirname, 'public/guide/ai.html')));
app.get('/specs/passport',        (req, res) => res.sendFile(join(__dirname, 'public/specs/passport.html')));
app.get('/specs/drivers-license', (req, res) => res.sendFile(join(__dirname, 'public/specs/drivers-license.html')));

// 静的ファイル配信 (JS/CSS キャッシュ無効 — モバイルブラウザ強制更新)
app.use(express.static(join(__dirname, 'public'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
    }
  }
}));

// === サーバー起動 + WebSocket ===
const httpServer = app.listen(PORT, '0.0.0.0', () => {
  log('='.repeat(60));
  log('MONKOS AI 証明写真 (JP) — Express サーバー起動');
  log('='.repeat(60));
  log(`ポート: ${PORT}`);
  log(`プロジェクト: ${PROJECT_ID}`);
  log(`リージョン: ${LOCATION}`);
  log(`認証: ハイブリッド (ADC + API Key)`);
  log(`Imagen I2I: アクティブ (gemini-3-pro-image-preview, API Key)`);
  log('事前分析: アクティブ (gemini-2.0-flash)');
  log('='.repeat(60));
  log('エンドポイント:');
  log('  GET  /health              — ヘルスチェック');
  log('  GET  /api/info            — サービス情報');
  log('  POST /api/pre-check       — 事前分析 (SPA)');
  log('  POST /api/precheck        — 事前分析 (MPA)');
  log('  POST /api/idgen           — Imagen I2I (9フィールド)');
  log('  POST /api/credit/use      — クレジット差引');
  log('  POST /api/download        — ダウンロード (GCS+クロップ+SignedURL)');
  log('  GET  /                    — ランディングページ');
  log('  GET  /app                 — 撮影アプリ (SPA)');
  log('  GET  /prep                — 準備 (MPA)');
  log('  GET  /camera              — 撮影 (MPA)');
  log('  GET  /result              — 結果 (MPA)');
  log('  GET  /thankyou            — 受取 (MPA)');
  log('  WS   /                    — WebSocket (コーチング専用)');
  log('='.repeat(60));
});

// === WebSocket (コーチング専用 — 撮影室でのみ接続) ===
const wss = new WebSocketServer({ server: httpServer });
let clientCounter = 0;

wss.on('connection', async (ws) => {
  const clientId = `c${++clientCounter}`;
  log(`[WS][${clientId}] コーチングセッション接続`);

  const session = { gemini: null, frameCount: 0, responseBuffer: '', bufferFlushTimer: null, ws, photoStyle: 'passport' };
  sessions.set(clientId, session);

  ws.on('message', async (data, isBinary) => {
    // バイナリ = JPEG フレーム → Gemini Live コーチング
    if (isBinary) {
      if (!session.gemini) {
        await connectGeminiLive(session, clientId, session.photoStyle);
        log(`[コーチング][${clientId}] Gemini Live 遅延生成 (style=${session.photoStyle})`);
      }
      try {
        const base64 = Buffer.from(data).toString('base64');
        await session.gemini.sendRealtimeInput({
          media: { data: base64, mimeType: 'image/jpeg' },
        });
        session.frameCount++;
        if (session.frameCount % 5 === 1) {
          log(`[フレーム][${clientId}] #${session.frameCount} (${data.length}B)`);
        }
        if (session.frameCount % 5 === 0) {
          await session.gemini.sendClientContent({ turnComplete: true });
        }
      } catch (err) {
        log(`[フレーム送信エラー][${clientId}] ${err.message}`);
      }
      return;
    }

    // テキスト = JSON コマンド (コーチング関連のみ)
    let msg;
    try {
      const raw = Buffer.isBuffer(data) ? data.toString() : data;
      msg = JSON.parse(raw);
    } catch { return; }

    if (msg.type === 'set-format') {
      const val = msg.format;
      session.photoStyle = val === 'id' ? 'id' : 'passport';
      log(`[フォーマット][${clientId}] ${session.photoStyle}`);
      return;
    }

    if (msg.type === 'stop-coaching') {
      log(`[コーチング][${clientId}] セッション停止`);
      if (session.gemini) {
        try { session.gemini.close(); } catch {}
        session.gemini = null;
      }
      if (session.bufferFlushTimer) {
        clearTimeout(session.bufferFlushTimer);
        session.bufferFlushTimer = null;
      }
      session.responseBuffer = '';
      return;
    }

    if (msg.type === 'restart-coaching') {
      log(`[コーチング][${clientId}] セッション再起動`);
      session.frameCount = 0;
      if (session.gemini) {
        try { session.gemini.close(); } catch {}
        session.gemini = null;
      }
      await connectGeminiLive(session, clientId, session.photoStyle);
      return;
    }
  });

  ws.on('close', () => {
    log(`[WS][${clientId}] コーチングセッション終了`);
    if (session.gemini) {
      try { session.gemini.close(); } catch {}
    }
    if (session.bufferFlushTimer) clearTimeout(session.bufferFlushTimer);
    sessions.delete(clientId);
  });
});

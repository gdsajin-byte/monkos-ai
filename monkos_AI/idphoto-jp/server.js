/**
 * MONKOS AI 証明写真 — idphoto-jp.monkos.ai
 *
 * 日本市場特化 AI 証明写真サービス
 *   a) Gemini Live コーチング — 撮影前リアルタイムガイド (日本語)
 *   b) Imagen I2I 生成 — 証明写真変換 (gemini-3-pro-image-preview)
 *   c) Gemini QC — 原本 vs 生成物 類似度検証
 *
 * 認証: Vertex AI ADC 一本化 (API Key 不要)
 * Cloud Run 配備用 (HTTP — SSL は Cloud Run が処理)
 * ポート: 8080 (Cloud Run デフォルト)
 */

import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { readFileSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '8080', 10);

// === 環境変数 ===
const PROJECT_ID = process.env.PROJECT_ID || 'monkos';
const LOCATION = process.env.LOCATION || 'us-central1';
const PORTAL_API_URL = process.env.PORTAL_API_URL || 'https://monkos.ai';

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
// Live コーチング + QC → Vertex AI ADC
// Imagen I2I 生成 → Google AI Studio API Key (gemini-3-pro-image-preview は Vertex AI 未対応)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const ai = new GoogleGenAI({
  vertexai: true,
  project: PROJECT_ID,
  location: LOCATION,
});

const imagenAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

log('[Vertex AI] ADC クライアント初期化 (Live + QC)');
log(`[Google AI Studio] Imagen クライアント初期化 (API Key ${GEMINI_API_KEY ? '設定済み' : '未設定'})`);
log(`[Portal API] ${PORTAL_API_URL}`);

// === クレジットAPI ヘルパー ===
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

async function grantShareBonus(userId, platform) {
  if (!userId) return { success: false, error: 'ログインが必要です' };

  try {
    const response = await fetch(`${PORTAL_API_URL}/api/credits/share-bonus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, platform }),
    });
    return await response.json();
  } catch (err) {
    log(`[Credits] シェアボーナスAPI呼び出し失敗: ${err.message}`);
    return { success: false, error: 'Portal API接続失敗' };
  }
}

// === コーチング システムプロンプト (日本語ネイティブ) ===
const COACHING_INSTRUCTIONS = {
  id_photo: `モンコス AIコーチです。パスポート・証明写真撮影をサポートします。

[チェック順序]
1. 正面を向く（傾き、視線）
2. 照明均一（顔に影がない）
3. 表情（無表情または自然な微笑み）
4. 眉毛が見える（前髪で隠さない）
5. フェイスラインが見える（髪で覆わない）

[応答ルール]
- 日本語1文、15文字以内
- 問題は1つだけ指摘
- ポジティブ表現：「〜すれば完璧です」
- 完璧なら：「いいですね！今撮影してください」`,

  resume: `モンコス AIコーチです。履歴書写真撮影をサポートします。

[チェック順序]
1. 正面を向く（傾き、視線）
2. 照明均一（顔に影がない）
3. 表情（自然で親しみやすい微笑み）
4. 姿勢（背筋を伸ばし、肩を平行に）

[応答ルール]
- 日本語1文、15文字以内
- 問題は1つだけ指摘
- ポジティブ表現：「〜すれば完璧です」
- 完璧なら：「いいですね！今撮影してください」`,
};

// === Imagen プロンプト ===
const IDENTITY_PRESERVATION = `LIGHTING (HIGHEST PRIORITY — override all lighting from input):
- Flat, even studio illumination from directly above-front (centered, 45° overhead)
- BOTH sides of face equally lit — zero shadow on cheeks, forehead, or neck
- Only shadow allowed: very soft, small shadow directly under chin
- f/8 uniform sharpness, 5500K daylight white balance
- ABSOLUTELY NO: rembrandt lighting, side light, rim light, split light, dramatic shadows, warm/cool color shifts

BACKGROUND & SCENE (STRICT):
- Pure white background (#FFFFFF), evenly lit, no falloff or gradient
- ONLY the person in the frame — nothing else visible
- NO props, NO equipment, NO lighting gear, NO softbox, NO reflector, NO studio objects
- NO text, NO watermark, NO border, NO frame

IDENTITY RULE: 90% SAME PERSON + 10% ENHANCEMENT

POSE (CRITICAL):
- MUST be perfectly front-facing, looking directly at the camera
- NO semi-profile, no side angles, no 3/4 view
- Head straight, eyes looking directly at the lens
- Both ears should be equally visible
- Symmetric face positioning

PRESERVE (90%):
- Face shape, eye shape, nose, lips, skin tone
- Overall facial structure and unique characteristics
- The person must be clearly recognizable as the SAME individual

ENHANCE (10% creative freedom):
- Slightly smoother skin, subtle beauty enhancement
- Minor imperfections can be softened
- Make them look their BEST version (not a different person)

DO NOT:
- Use side lighting, rim lighting, or any dramatic lighting setup
- Generate side angles or semi-profile poses
- Change gender, ethnicity, or age by more than 2-3 years
- Alter fundamental facial features
- Make them unrecognizable

GOAL: "This is ME, but on my best day" - perfectly front-facing, studio flat lighting, 90% accuracy, 10% professional retouching.`;

const STYLE_PROMPTS = {
  id_photo: 'Professional passport/ID photo, perfectly front-facing looking directly at camera, formal white background, sharp focus, head straight, symmetric composition',
  resume: 'Professional resume photo for Japanese job application (履歴書), perfectly front-facing looking directly at camera, clean white background, Japanese recruit suit (リクルートスーツ), 3:4 ratio, approachable yet professional expression',
};

// 性別・年齢別の衣装プロンプト
function getOutfitPrompt(gender, age, style = 'id_photo') {
  const genderLabel = gender === 'female' ? 'female/woman' : 'male/man';
  const ageMap = {
    child: { label: 'young child (under 12)', outfit: gender === 'female'
      ? 'a clean white polo shirt or simple blouse, age-appropriate and neat'
      : 'a clean white polo shirt or simple dress shirt, age-appropriate and neat' },
    teen: { label: 'teenager (13-18)', outfit: gender === 'female'
      ? 'a neat school-style blouse or simple formal top, age-appropriate'
      : 'a clean dress shirt with or without tie, age-appropriate' },
    adult: { label: 'adult', outfit: style === 'resume'
      ? (gender === 'female'
        ? 'a white plain blouse with regular collar under solid black recruit suit (リクルートスーツ), simple and clean, no frills or lace'
        : 'a solid black recruit suit (リクルートスーツ) with white dress shirt and blue regimental stripe necktie')
      : (gender === 'female'
        ? 'a professional blouse or women\'s business jacket, formal and clean'
        : 'a clean, dark navy or charcoal formal business suit with white dress shirt and subtle tie') },
  };
  const info = ageMap[age] || ageMap.adult;
  return `SUBJECT: This person is a ${genderLabel}, ${info.label}. OUTFIT: Dress this person in ${info.outfit}. Keep the person's face, hair, and body exactly the same — only ensure appropriate attire. DO NOT change the person's apparent gender or age.`;
}

// === QC プロンプト (日本語 — bounding box 含む) ===
// === QCプロンプト（日本語 — bounding box + 性別/年齢/補正チェック）===
function buildQCInstruction(gender, age) {
  const genderText = gender === 'male' ? '男性' : '女性';
  const ageMap = { child: '幼児〜12歳', teen: '13〜18歳', adult: '19歳以上' };
  const ageText = ageMap[age] || '未指定';

  return `2つの画像を比較し、2枚目（証明写真）の品質を総合分析してください。
1枚目：原本（実際の撮影）
2枚目：AI生成物（証明写真）
ユーザー設定：性別=${genderText}、年齢層=${ageText}

[判定基準 — すべてチェック必須]
1. 同一人物か？（顔の構造、目/鼻/口の比率）
2. 類似度 %（0-100）
3. アイデンティティ維持（PASS/FAIL）
4. 性別一致：原本の外見上の性別と生成物が一致するか？（設定に関係なく原本基準で判断）
5. 年齢層一致：原本の外見年齢と生成物が一致するか？（子供→大人、大人→子供の変換を検出）
6. 過度な補正：ヘアスタイルの大幅変更、肌の過度な補正、顔の輪郭変形、目の大きさ変更など不自然な変形があるか？
7. 証明写真品質（照明、背景、構図）
8. 2枚目の画像で顔のbounding box座標 [ymin, xmin, ymax, xmax]（0-1000正規化）

[FAIL条件 — 一つでも該当すればidentityをFAILと判定]
- 性別の外見が原本と異なるように変換された
- 年齢層が原本と大きく異なる（10歳以上の差と推定）
- 顔の輪郭、目の大きさ、鼻の形態が原本と異なるように変形
- ヘアスタイルが原本と完全に異なる（整える程度は許容）
- similarity 70%未満

[応答形式 — JSONのみ出力]
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
  "note": "一行コメント"
}

face_ratio = 顔の高さ / 画像全体の高さ（0.25〜0.45が適切）
face_center_x = 顔の中心x座標（500付近で中央揃え、±50許容）
head_top_margin = 頭頂部から画像上端までの余白（40〜150が適切）`;
}

// === クライアントセッション管理 ===
const sessions = new Map();

async function connectGeminiLive(session, clientId, style = 'id_photo') {
  function flushBuffer() {
    if (session.responseBuffer.trim() && session.ws?.readyState === 1) {
      session.ws.send(JSON.stringify({
        type: 'ai-coaching',
        text: session.responseBuffer.trim(),
        timestamp: Date.now(),
      }));
      log(`[コーチング][${clientId}] ${session.responseBuffer.trim()}`);
    }
    session.responseBuffer = '';
    session.bufferFlushTimer = null;
  }

  try {
    session.gemini = await ai.live.connect({
      model: 'gemini-2.0-flash-live-preview-04-09',
      config: {
        responseModalities: ['TEXT'],
        systemInstruction: { parts: [{ text: COACHING_INSTRUCTIONS[style] || COACHING_INSTRUCTIONS.id_photo }] },
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

// === Imagen I2I 生成 (Google AI Studio API Key) ===
async function generatePhoto(inputBase64, style = 'id_photo', gender = 'male', age = 'adult') {
  const base64Data = inputBase64.includes(',') ? inputBase64.split(',')[1] : inputBase64;
  const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.id_photo;
  const outfitPrompt = getOutfitPrompt(gender, age, style);
  const instruction = `${IDENTITY_PRESERVATION}\n\n[IMAGE-TO-IMAGE TRANSFORM] ${stylePrompt}\n\n${outfitPrompt}`;

  const response = await imagenAI.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
        { text: instruction },
      ],
    },
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: { aspectRatio: '3:4' },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ],
    },
  });

  const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!part?.inlineData) throw new Error('画像生成失敗: レスポンスに画像なし');

  return `data:image/png;base64,${part.inlineData.data}`;
}

// === Gemini QC (Vertex AI ADC) — 3 Flash → 2.0 Flash フォールバック ===
const QC_MODELS = ['gemini-3-flash-preview', 'gemini-2.0-flash'];

async function runQC(originalBase64, generatedBase64, gender = 'male', age = 'adult') {
  const origData = originalBase64.includes(',') ? originalBase64.split(',')[1] : originalBase64;
  const genData = generatedBase64.includes(',') ? generatedBase64.split(',')[1] : generatedBase64;
  const qcInstruction = buildQCInstruction(gender, age);

  for (const model of QC_MODELS) {
    try {
      log(`[QC] モデル試行: ${model} (gender=${gender}, age=${age})`);
      const response = await ai.models.generateContent({
        model,
        contents: [{
          role: 'user',
          parts: [
            { inlineData: { mimeType: 'image/jpeg', data: origData } },
            { inlineData: { mimeType: 'image/png', data: genData } },
            { text: qcInstruction },
          ],
        }],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      log(`[QC][${model}] 応答: ${text.substring(0, 300)}`);

      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
      } catch { /* JSONパース失敗 → 次のモデル */ }
      return { raw: text };
    } catch (err) {
      log(`[QC][${model}] 失敗: ${err.message} → フォールバック`);
      if (model === QC_MODELS[QC_MODELS.length - 1]) {
        return { identity: 'ERROR', note: `QC全体失敗: ${err.message}` };
      }
    }
  }
}

// === 事前分析 (Gemini 3 Flash — 撮影写真の適合性チェック) ===
const PRE_CHECK_INSTRUCTION = `この写真が証明写真の原本として適切かどうか分析してください。

[チェック項目]
1. 顔検出：顔が1つ明確に見えるか？
2. 正面性：正面を向いているか？（左右の傾き、頭の上下）
3. 照明：顔に強い影や逆光がないか？
4. 鮮明度：ブレなく鮮明か？
5. 顔サイズ：フレーム対比で顔が十分大きいか？（最小20%）
6. 表情：無表情または自然な微笑みか？
7. 目：目を閉じていないか？

[応答形式 — JSONのみ出力]
{
  "suitable": true,
  "score": 85,
  "face_detected": true,
  "issues": [],
  "suggestion": "一行アドバイス"
}

suitable: 証明写真生成可能かどうか (true/false)
score: 総合点数 (0-100, 70以上ならsuitable=true)
issues: 問題リスト (空配列なら問題なし)
suggestion: ユーザーに表示する一行日本語アドバイス`;

async function runPreCheck(imageBase64) {
  const data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

  for (const model of QC_MODELS) {
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
      if (model === QC_MODELS[QC_MODELS.length - 1]) {
        return { suitable: true, score: 0, note: `分析失敗: ${err.message}` };
      }
    }
  }
}

// === HTTP サーバー (静的ファイル + APIエンドポイント) ===
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

// POST bodyパーサー (JSON)
function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function jsonResponse(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

const httpServer = createServer(async (req, res) => {
  // セキュリティヘッダー
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  const urlPath = req.url.split('?')[0];

  // ヘルスチェック
  if (urlPath === '/health') {
    jsonResponse(res, 200, {
      status: 'healthy',
      service: 'monkos-idphoto-jp',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      auth: 'Hybrid (ADC + API Key)',
      geminiLive: 'ready (ADC)',
      imagen: GEMINI_API_KEY ? 'active (API Key)' : 'NO API KEY',
      qc: 'active (gemini-3-flash-preview → 2.0-flash フォールバック)',
      preCheck: 'active (gemini-3-flash-preview)',
    });
    return;
  }

  // API 情報
  if (urlPath === '/api/info') {
    jsonResponse(res, 200, {
      service: 'MONKOS AI 証明写真',
      domain: 'idphoto-jp.monkos.ai',
      features: ['AIコーチング (WS)', 'AI事前分析', 'AI証明写真生成', 'AI品質検証'],
      styles: Object.keys(STYLE_PROMPTS),
    });
    return;
  }

  // === REST APIエンドポイント ===

  // POST /api/pre-check — 撮影写真の適合性分析
  if (urlPath === '/api/pre-check' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      if (!body.image) return jsonResponse(res, 400, { error: '画像が必要です' });
      const result = await runPreCheck(body.image);
      jsonResponse(res, 200, result);
    } catch (err) {
      log(`[API][pre-check] エラー: ${err.message}`);
      jsonResponse(res, 500, { error: err.message });
    }
    return;
  }

  // POST /api/generate — Imagen I2I 生成 (クレジットチェック含む)
  if (urlPath === '/api/generate' && req.method === 'POST') {
    let bodyUserId = null;
    try {
      const body = await parseBody(req);
      bodyUserId = body.userId;
      if (!body.image) return jsonResponse(res, 400, { error: '画像が必要です' });

      if (body.userId) {
        const creditResult = await useCredits(body.userId, 'generate');
        if (!creditResult.success) {
          return jsonResponse(res, 402, {
            error: creditResult.error,
            credits: creditResult.credits ?? 0,
            required: 1,
          });
        }
        log(`[Credits] 生成消費: ${body.userId} → ${creditResult.credits}c`);
      }

      log(`[Imagen] 生成リクエスト: style=${body.style}, gender=${body.gender || 'male'}, age=${body.age || 'adult'}`);
      const image = await generatePhoto(body.image, body.style, body.gender, body.age);
      jsonResponse(res, 200, { image });
    } catch (err) {
      log(`[API][generate] エラー: ${err.message}`);
      if (bodyUserId) {
        try {
          const refund = await refundCredits(bodyUserId, 'generate');
          if (refund.success) log(`[Credits] 生成失敗返金: ${bodyUserId}`);
        } catch {}
      }
      jsonResponse(res, 500, { error: err.message });
    }
    return;
  }

  // POST /api/qc — QC検証
  if (urlPath === '/api/qc' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      if (!body.original || !body.generated) return jsonResponse(res, 400, { error: '原本/生成物が必要です' });
      const result = await runQC(body.original, body.generated, body.gender, body.age);
      jsonResponse(res, 200, result);
    } catch (err) {
      log(`[API][qc] エラー: ${err.message}`);
      jsonResponse(res, 500, { error: err.message });
    }
    return;
  }

  // POST /api/credit/use — クレジット消費
  if (urlPath === '/api/credit/use' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      if (!body.userId) return jsonResponse(res, 400, { error: 'ログインが必要です' });
      const result = await useCredits(body.userId, body.type || 'download');
      jsonResponse(res, result.success ? 200 : 402, result);
    } catch (err) {
      log(`[API][credit/use] エラー: ${err.message}`);
      jsonResponse(res, 500, { error: err.message });
    }
    return;
  }

  // POST /api/credit/share-bonus — シェアボーナス
  if (urlPath === '/api/credit/share-bonus' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      if (!body.userId) return jsonResponse(res, 400, { error: 'ログインが必要です' });
      const result = await grantShareBonus(body.userId, body.platform);
      jsonResponse(res, result.success ? 200 : 400, result);
    } catch (err) {
      log(`[API][credit/share-bonus] エラー: ${err.message}`);
      jsonResponse(res, 500, { error: err.message });
    }
    return;
  }

  // 静的ファイル配信
  // / → ランディングページ, /app → 撮影アプリUI
  let filePath;
  if (urlPath === '/') filePath = '/landing.html';
  else if (urlPath === '/app') filePath = '/index.html';
  else filePath = urlPath;
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

// === WebSocket (コーチング専用 — 撮影室 Step 1 でのみ接続) ===
const wss = new WebSocketServer({ server: httpServer });
let clientCounter = 0;

wss.on('connection', async (ws) => {
  const clientId = `c${++clientCounter}`;
  log(`[WS][${clientId}] コーチングセッション接続`);

  const session = { gemini: null, frameCount: 0, responseBuffer: '', bufferFlushTimer: null, ws, photoStyle: 'id_photo' };
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

    // テキスト = JSON コマンド（コーチング関連のみ）
    let msg;
    try {
      const raw = Buffer.isBuffer(data) ? data.toString() : data;
      msg = JSON.parse(raw);
    } catch { return; }

    if (msg.type === 'set-style') {
      session.photoStyle = msg.style === 'resume' ? 'resume' : 'id_photo';
      log(`[スタイル][${clientId}] ${session.photoStyle}`);
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
    log(`[WS][${clientId}] コーチングセッション切断`);
    if (session.gemini) {
      try { session.gemini.close(); } catch {}
    }
    if (session.bufferFlushTimer) clearTimeout(session.bufferFlushTimer);
    sessions.delete(clientId);
  });
});

// === サーバー起動 ===
httpServer.listen(PORT, '0.0.0.0', () => {
  log('='.repeat(60));
  log('MONKOS AI 証明写真 (JP) — サーバー起動');
  log('='.repeat(60));
  log(`ポート: ${PORT}`);
  log(`プロジェクト: ${PROJECT_ID}`);
  log(`リージョン: ${LOCATION}`);
  log(`認証: ハイブリッド (ADC + API Key)`);
  log(`Imagen I2I: アクティブ (gemini-3-pro-image-preview, API Key)`);
  log(`QC: アクティブ (gemini-3-flash-preview → 2.0-flash フォールバック)`);
  log(`事前分析: アクティブ (gemini-3-flash-preview)`);
  log('='.repeat(60));
  log('エンドポイント:');
  log('  GET  /health              — ヘルスチェック');
  log('  GET  /api/info            — サービス情報');
  log('  POST /api/pre-check       — 事前分析 (撮影適合性)');
  log('  POST /api/generate        — Imagen I2I 生成');
  log('  POST /api/qc              — QC 検証');
  log('  POST /api/credit/use      — クレジット消費');
  log('  POST /api/credit/share-bonus — シェアボーナス');
  log('  GET  /                    — ランディングページ');
  log('  GET  /app                 — 撮影アプリ');
  log('  WS   /                    — WebSocket (コーチング専用)');
  log('='.repeat(60));
});

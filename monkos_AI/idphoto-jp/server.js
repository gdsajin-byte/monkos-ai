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

function log(msg) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}`);
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

// === コーチング システムプロンプト (日本語ネイティブ) ===
const COACHING_INSTRUCTION = `証明写真撮影アシスタント。カメラフィードの姿勢・表情・照明をリアルタイムチェックします。

[チェックリスト]
1. 正面を向いている（左右の傾き、視線の方向）
2. 無表情または自然な微笑み
3. 照明が均一（片側に影がない）
4. 背景がきれい（単色推奨）
5. 髪が整っている、メガネの反射がない
6. 肩が水平、頭上に適切な余白

[応答ルール]
- 日本語1文で回答
- すべてのチェック通過 → 「いいですね！今撮影してください」
- 問題がある場合 → 最も重要な1つだけ具体的に修正案内
- 例: 「あごを少し上げてください」「左の照明が強いです、少し右に移動してください」`;

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
  resume: 'Professional resume photo for Japanese job application (履歴書), perfectly front-facing looking directly at camera, clean white background, business formal attire, 3:4 ratio, approachable yet professional expression',
};

// 衣装: スーツ固定 (将来ファネルで選択肢追加)
const OUTFIT_PROMPT = 'OUTFIT: Always dress the person in a clean, dark navy or charcoal formal business suit with white dress shirt and subtle tie. Keep the person\'s face, hair, and body exactly the same — only ensure professional business attire.';

// === QC プロンプト (日本語) ===
const QC_INSTRUCTION = `2つの画像を比較してください。
1枚目：原本（実際の撮影）
2枚目：AI生成物（証明写真）

[判定基準]
1. 同一人物か？（顔の構造、目/鼻/口の比率）
2. 類似度 %（0-100）
3. アイデンティティ維持（PASS/FAIL）
4. 証明写真品質（照明、背景、構図）

[応答形式 — JSON]
{ "same_person": true/false, "similarity": 85, "identity": "PASS", "quality": "GOOD", "note": "一行コメント" }`;

// === クライアントセッション管理 ===
const sessions = new Map();

async function createGeminiSession(clientId) {
  const session = {
    gemini: null,
    frameCount: 0,
    responseBuffer: '',
    bufferFlushTimer: null,
    ws: null,
  };

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
        systemInstruction: { parts: [{ text: COACHING_INSTRUCTION }] },
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
    return session;
  } catch (err) {
    log(`[Gemini Live][${clientId}] セッション失敗: ${err.message}`);
    return session;
  }
}

// === Imagen I2I 生成 (Google AI Studio API Key) ===
async function generatePhoto(inputBase64, style = 'id_photo') {
  const base64Data = inputBase64.includes(',') ? inputBase64.split(',')[1] : inputBase64;
  const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.id_photo;
  const instruction = `${IDENTITY_PRESERVATION}\n\n[IMAGE-TO-IMAGE TRANSFORM] ${stylePrompt}\n\n${OUTFIT_PROMPT}`;

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

// === Gemini QC (Vertex AI ADC) ===
async function runQC(originalBase64, generatedBase64) {

  const origData = originalBase64.includes(',') ? originalBase64.split(',')[1] : originalBase64;
  const genData = generatedBase64.includes(',') ? generatedBase64.split(',')[1] : generatedBase64;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: origData } },
        { inlineData: { mimeType: 'image/png', data: genData } },
        { text: QC_INSTRUCTION },
      ],
    }],
  });

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
  log(`[QC] 応答: ${text.substring(0, 200)}`);

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch { /* パース失敗時は原文返却 */ }
  return { raw: text };
}

// === HTTP サーバー (静的ファイル + ヘルスチェック) ===
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

const httpServer = createServer((req, res) => {
  // ヘルスチェック
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      service: 'monkos-idphoto-jp',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      auth: 'Hybrid (ADC + API Key)',
      geminiLive: 'ready (ADC)',
      imagen: GEMINI_API_KEY ? 'active (API Key)' : 'NO API KEY',
      qc: 'active (ADC)',
    }));
    return;
  }

  // API 情報
  if (req.url === '/api/info') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      service: 'MONKOS AI 証明写真',
      domain: 'idphoto-jp.monkos.ai',
      features: ['AIコーチング', 'AI証明写真生成', 'AI品質検証'],
      styles: Object.keys(STYLE_PROMPTS),
    }));
    return;
  }

  // 静的ファイル配信
  // / → ランディングページ, /app → 撮影アプリUI
  let filePath;
  if (req.url === '/') filePath = '/landing.html';
  else if (req.url === '/app') filePath = '/index.html';
  else filePath = req.url;
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

// === WebSocket ===
const wss = new WebSocketServer({ server: httpServer });
let clientCounter = 0;

wss.on('connection', async (ws) => {
  const clientId = `c${++clientCounter}`;
  log(`[WS][${clientId}] クライアント接続`);

  // セッション作成
  const session = await createGeminiSession(clientId);
  session.ws = ws;
  sessions.set(clientId, session);

  ws.on('message', async (data, isBinary) => {
    // バイナリ = JPEG フレーム → Gemini Live コーチング
    if (isBinary) {
      if (!session.gemini) return;
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

    // テキスト = JSON コマンド
    let msg;
    try {
      const raw = Buffer.isBuffer(data) ? data.toString() : data;
      msg = JSON.parse(raw);
    } catch { return; }

    // Imagen 生成リクエスト
    if (msg.type === 'generate') {
      log(`[Imagen][${clientId}] 生成リクエスト: style=${msg.style}`);
      ws.send(JSON.stringify({ type: 'generate-start' }));
      try {
        const result = await generatePhoto(msg.image, msg.style);
        ws.send(JSON.stringify({ type: 'generate-result', image: result }));
        log(`[Imagen][${clientId}] 生成完了`);
      } catch (err) {
        ws.send(JSON.stringify({ type: 'generate-error', error: err.message }));
        log(`[Imagen][${clientId}] 生成失敗: ${err.message}`);
      }
      return;
    }

    // QC リクエスト
    if (msg.type === 'qc') {
      log(`[QC][${clientId}] 検証リクエスト`);
      try {
        const result = await runQC(msg.original, msg.generated);
        ws.send(JSON.stringify({ type: 'qc-result', result }));
        log(`[QC][${clientId}] 判定: ${JSON.stringify(result).substring(0, 100)}`);
      } catch (err) {
        ws.send(JSON.stringify({ type: 'qc-error', error: err.message }));
        log(`[QC][${clientId}] 検証失敗: ${err.message}`);
      }
      return;
    }

    // コーチングセッション再起動
    if (msg.type === 'restart-coaching') {
      log(`[コーチング][${clientId}] セッション再起動`);
      session.frameCount = 0;
      if (session.gemini) {
        try { session.gemini.close(); } catch {}
      }
      const newSession = await createGeminiSession(clientId);
      newSession.ws = ws;
      session.gemini = newSession.gemini;
      return;
    }
  });

  ws.on('close', () => {
    log(`[WS][${clientId}] クライアント切断`);
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
  log(`QC: アクティブ (gemini-2.0-flash)`);
  log('='.repeat(60));
  log('エンドポイント:');
  log(`  GET  /health   — ヘルスチェック`);
  log(`  GET  /api/info — サービス情報`);
  log(`  GET  /         — ランディングページ`);
  log(`  GET  /app      — 撮影アプリ`);
  log(`  WS   /         — WebSocket (コーチング/生成/QC)`);
  log('='.repeat(60));
});

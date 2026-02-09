/**
 * MONKOS AI 証明写真 — idphoto-jp.monkos.ai
 *
 * 日本市場特化 AI 証明写真サービス
 *   a) Gemini Live コーチング — 撮影前リアルタイムガイド (日本語)
 *   b) Imagen 3.0 生成 — 証明写真変換 (gemini-3-pro-image-preview)
 *   c) Gemini QC — 原本 vs 生成物 類似度検証
 *
 * Cloud Run 配備用 (HTTP — SSL は Cloud Run が処理)
 * ポート: 8080 (Cloud Run デフォルト)
 */

import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { readFileSync, existsSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '8080', 10);

// === 環境変数 ===
const PROJECT_ID = process.env.PROJECT_ID || 'monkos';
const LOCATION = process.env.LOCATION || 'us-central1';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

function log(msg) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}`);
}

// === Gemini Live API (Vertex AI ADC — コーチング用) ===
const liveAI = new GoogleGenAI({
  vertexai: true,
  project: PROJECT_ID,
  location: LOCATION,
});

// === Gemini API Key (Imagen 生成 + QC用) ===
const imagenAI = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;
if (!GEMINI_API_KEY) {
  log('[警告] GEMINI_API_KEY 未設定 — Imagen 生成/QC 無効');
} else {
  log('[Imagen] API Key ロード完了');
}

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

GOAL: "This is ME, but on my best day" - 90% accuracy, 10% professional retouching.`;

const STYLE_PROMPTS = {
  id_photo: 'Professional ID photo, studio lighting, formal white background, sharp focus, passport-style portrait',
  resume: 'Professional resume photo for Japanese job application (履歴書), clean white background, business formal attire, 3:4 ratio, approachable expression',
  profile: 'Professional business profile photo, soft studio lighting, neutral background, confident expression',
  mynumber: 'Japanese My Number Card photo (マイナンバーカード), white background, no shadows, neutral expression, sharp focus',
};

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
    session.gemini = await liveAI.live.connect({
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

// === Imagen 3.0 生成 ===
async function generatePhoto(inputBase64, style = 'id_photo') {
  if (!imagenAI) throw new Error('GEMINI_API_KEY 未設定');

  const base64Data = inputBase64.includes(',') ? inputBase64.split(',')[1] : inputBase64;
  const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.id_photo;
  const instruction = `${IDENTITY_PRESERVATION}\n\n[IMAGE-TO-IMAGE TRANSFORM] ${stylePrompt}`;

  const response = await imagenAI.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
        { text: instruction },
      ],
    },
    config: {
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

// === Gemini QC ===
async function runQC(originalBase64, generatedBase64) {
  if (!imagenAI) throw new Error('GEMINI_API_KEY 未設定');

  const origData = originalBase64.includes(',') ? originalBase64.split(',')[1] : originalBase64;
  const genData = generatedBase64.includes(',') ? generatedBase64.split(',')[1] : generatedBase64;

  const response = await imagenAI.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: origData } },
        { inlineData: { mimeType: 'image/png', data: genData } },
        { text: QC_INSTRUCTION },
      ],
    },
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
      geminiLive: 'ready',
      imagen: GEMINI_API_KEY ? 'active' : 'inactive',
    }));
    return;
  }

  // API 情報
  if (req.url === '/api/info') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      service: 'MONKOS AI 証明写真',
      domain: 'idphoto-jp.monkos.ai',
      features: ['Gemini Live コーチング', 'Imagen 3.0 生成', 'Gemini QC 検証'],
      styles: Object.keys(STYLE_PROMPTS),
    }));
    return;
  }

  // 静的ファイル配信
  const filePath = req.url === '/' ? '/index.html' : req.url;
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
  log(`Imagen: ${GEMINI_API_KEY ? 'アクティブ' : '無効 (GEMINI_API_KEY 必要)'}`);
  log(`認証: ADC (Application Default Credentials)`);
  log('='.repeat(60));
  log('エンドポイント:');
  log(`  GET  /health   — ヘルスチェック`);
  log(`  GET  /api/info — サービス情報`);
  log(`  GET  /         — フロントエンド`);
  log(`  WS   /         — WebSocket (コーチング/生成/QC)`);
  log('='.repeat(60));
});

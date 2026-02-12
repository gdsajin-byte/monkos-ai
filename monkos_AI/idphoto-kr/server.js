/**
 * MONKOS AI 증명사진 — idphoto-kr.monkos.ai
 *
 * 한국 시장 특화 AI 증명사진 서비스
 *   a) Gemini Live 코칭 — 촬영 전 실시간 가이드 (한국어)
 *   b) Imagen I2I 생성 — 증명사진 변환 (gemini-3-pro-image-preview)
 *   c) Gemini QC — 원본 vs 생성물 유사도 검증
 *
 * 인증: 하이브리드 (Vertex AI ADC + Google AI Studio API Key)
 * Cloud Run 배포용 (HTTP — SSL은 Cloud Run 처리)
 * 포트: 8080 (Cloud Run 기본)
 */

import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { readFileSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '8080', 10);

// === 환경변수 ===
const PROJECT_ID = process.env.PROJECT_ID || 'monkos';
const LOCATION = process.env.LOCATION || 'us-central1';
const PORTAL_API_URL = process.env.PORTAL_API_URL || 'https://monkos.ai';

function log(msg) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${msg}`);
}

// === 하이브리드 인증 ===
// Live 코칭 + QC → Vertex AI ADC
// Imagen I2I 생성 → Google AI Studio API Key (gemini-3-pro-image-preview는 Vertex AI 미지원)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const ai = new GoogleGenAI({
  vertexai: true,
  project: PROJECT_ID,
  location: LOCATION,
});

const imagenAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

log('[Vertex AI] ADC 클라이언트 초기화 (Live + QC)');
log(`[Google AI Studio] Imagen 클라이언트 초기화 (API Key ${GEMINI_API_KEY ? '설정됨' : '미설정'})`);
log(`[Portal API] ${PORTAL_API_URL}`);

// === 크레딧 API 헬퍼 ===
async function useCredits(userId, type) {
  if (!userId) return { success: false, error: '로그인 필요' };

  try {
    const response = await fetch(`${PORTAL_API_URL}/api/credits/use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, type }),
    });
    return await response.json();
  } catch (err) {
    log(`[Credits] API 호출 실패: ${err.message}`);
    return { success: false, error: 'Portal API 연결 실패' };
  }
}

async function refundCredits(userId, type) {
  if (!userId) return { success: false, error: '로그인 필요' };

  try {
    const response = await fetch(`${PORTAL_API_URL}/api/credits/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, type }),
    });
    return await response.json();
  } catch (err) {
    log(`[Credits] 환불 API 호출 실패: ${err.message}`);
    return { success: false, error: 'Portal API 연결 실패' };
  }
}

async function grantShareBonus(userId, platform) {
  if (!userId) return { success: false, error: '로그인 필요' };

  try {
    const response = await fetch(`${PORTAL_API_URL}/api/credits/share-bonus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, platform }),
    });
    return await response.json();
  } catch (err) {
    log(`[Credits] 공유 보너스 API 호출 실패: ${err.message}`);
    return { success: false, error: 'Portal API 연결 실패' };
  }
}

// === 코칭 시스템 프롬프트 (한국어 네이티브) ===
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

// === Imagen 프롬프트 ===
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
  resume: 'Professional resume photo for Korean job application (이력서), perfectly front-facing looking directly at camera, clean white background, business formal attire, 3:4 ratio, approachable yet professional expression',
};

// 성별/연령별 의상 프롬프트
function getOutfitPrompt(gender, age) {
  const genderLabel = gender === 'female' ? 'female/woman' : 'male/man';
  const ageMap = {
    child: { label: 'young child (under 12)', outfit: gender === 'female'
      ? 'a clean white polo shirt or simple blouse, age-appropriate and neat'
      : 'a clean white polo shirt or simple dress shirt, age-appropriate and neat' },
    teen: { label: 'teenager (13-18)', outfit: gender === 'female'
      ? 'a neat school-style blouse or simple formal top, age-appropriate'
      : 'a clean dress shirt with or without tie, age-appropriate' },
    adult: { label: 'adult', outfit: gender === 'female'
      ? 'a professional blouse or women\'s business jacket, formal and clean'
      : 'a clean, dark navy or charcoal formal business suit with white dress shirt and subtle tie' },
  };
  const info = ageMap[age] || ageMap.adult;
  return `SUBJECT: This person is a ${genderLabel}, ${info.label}. OUTFIT: Dress this person in ${info.outfit}. Keep the person's face, hair, and body exactly the same — only ensure appropriate attire. DO NOT change the person's apparent gender or age.`;
}

// === QC 프롬프트 (한국어) ===
const QC_INSTRUCTION = `2개의 이미지를 비교해 주세요.
1번째: 원본 (실제 촬영)
2번째: AI 생성물 (증명사진)

[판정 기준]
1. 동일 인물인가? (얼굴 구조, 눈/코/입 비율)
2. 유사도 % (0-100)
3. 아이덴티티 유지 (PASS/FAIL)
4. 증명사진 품질 (조명, 배경, 구도)

[응답 형식 — JSON]
{ "same_person": true/false, "similarity": 85, "identity": "PASS", "quality": "GOOD", "note": "한줄 코멘트" }`;

// === 클라이언트 세션 관리 ===
const sessions = new Map();

async function connectGeminiLive(session, clientId, style = 'id_photo') {
  function flushBuffer() {
    if (session.responseBuffer.trim() && session.ws?.readyState === 1) {
      session.ws.send(JSON.stringify({
        type: 'ai-coaching',
        text: session.responseBuffer.trim(),
        timestamp: Date.now(),
      }));
      log(`[코칭][${clientId}] ${session.responseBuffer.trim()}`);
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
        onopen: () => log(`[Gemini Live][${clientId}] 연결 완료`),
        onclose: (e) => {
          log(`[Gemini Live][${clientId}] 연결 종료: ${e?.code || 'unknown'}`);
          session.gemini = null;
        },
        onerror: (e) => log(`[Gemini Live][${clientId}] 에러: ${e?.message || e}`),
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
    log(`[Gemini Live][${clientId}] 세션 초기화 완료`);
  } catch (err) {
    log(`[Gemini Live][${clientId}] 세션 실패: ${err.message}`);
  }
}

// === Imagen I2I 생성 (Google AI Studio API Key) ===
async function compressImage(base64Input, maxSize = 720, quality = 70) {
  const raw = base64Input.includes(',') ? base64Input.split(',')[1] : base64Input;
  const buf = Buffer.from(raw, 'base64');
  const resized = await sharp(buf)
    .resize(maxSize, maxSize, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality })
    .toBuffer();
  log(`[압축] ${(buf.length / 1024).toFixed(0)}KB → ${(resized.length / 1024).toFixed(0)}KB`);
  return resized.toString('base64');
}

async function generatePhoto(inputBase64, style = 'id_photo', gender = 'male', age = 'adult') {
  const base64Data = await compressImage(inputBase64, 720, 70);
  const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.id_photo;
  const outfitPrompt = getOutfitPrompt(gender, age);
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
  if (!part?.inlineData) throw new Error('이미지 생성 실패: 응답에 이미지 없음');

  return `data:image/png;base64,${part.inlineData.data}`;
}

// === Gemini QC (Vertex AI ADC) ===
async function runQC(originalBase64, generatedBase64) {
  const origData = await compressImage(originalBase64, 512, 60);
  const genData = await compressImage(generatedBase64, 512, 60);

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
  log(`[QC] 응답: ${text.substring(0, 200)}`);

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch { /* 파싱 실패 시 원문 반환 */ }
  return { raw: text };
}

// === HTTP 서버 (정적 파일 + 헬스체크) ===
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

const httpServer = createServer(async (req, res) => {
  // 헬스체크
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      service: 'monkos-idphoto-kr',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      auth: 'Hybrid (ADC + API Key)',
      geminiLive: 'ready (ADC)',
      imagen: GEMINI_API_KEY ? 'active (API Key)' : 'NO API KEY',
      qc: 'active (ADC)',
    }));
    return;
  }

  // API 정보
  if (req.url === '/api/info') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      service: 'MONKOS AI 증명사진',
      domain: 'idphoto-kr.monkos.ai',
      features: ['AI 코칭', 'AI 증명사진 생성', 'AI 품질 검증'],
      styles: Object.keys(STYLE_PROMPTS),
    }));
    return;
  }

  // 정적 파일 배포
  // / → 랜딩페이지, /app → 촬영 앱 UI
  const urlPath = req.url.split('?')[0];
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

// === WebSocket ===
const wss = new WebSocketServer({ server: httpServer });
let clientCounter = 0;

wss.on('connection', async (ws) => {
  const clientId = `c${++clientCounter}`;
  log(`[WS][${clientId}] 클라이언트 연결`);

  // 세션 (Gemini Live는 첫 프레임 수신 시 지연 생성)
  const session = { gemini: null, frameCount: 0, responseBuffer: '', bufferFlushTimer: null, ws, photoStyle: 'id_photo' };
  sessions.set(clientId, session);

  ws.on('message', async (data, isBinary) => {
    // 바이너리 = JPEG 프레임 → Gemini Live 코칭
    if (isBinary) {
      // 첫 프레임에서 Gemini Live 세션 지연 생성
      if (!session.gemini) {
        await connectGeminiLive(session, clientId, session.photoStyle);
        log(`[코칭][${clientId}] Gemini Live 세션 지연 생성 (style=${session.photoStyle})`);
      }
      try {
        const base64 = Buffer.from(data).toString('base64');
        await session.gemini.sendRealtimeInput({
          media: { data: base64, mimeType: 'image/jpeg' },
        });
        session.frameCount++;
        if (session.frameCount % 5 === 1) {
          log(`[프레임][${clientId}] #${session.frameCount} (${data.length}B)`);
        }
        if (session.frameCount % 5 === 0) {
          await session.gemini.sendClientContent({ turnComplete: true });
        }
      } catch (err) {
        log(`[프레임 전송 에러][${clientId}] ${err.message}`);
      }
      return;
    }

    // 텍스트 = JSON 커맨드
    let msg;
    try {
      const raw = Buffer.isBuffer(data) ? data.toString() : data;
      msg = JSON.parse(raw);
    } catch { return; }

    // 스타일 설정 (코칭 시작 전 클라이언트에서 수신)
    if (msg.type === 'set-style') {
      session.photoStyle = msg.style === 'resume' ? 'resume' : 'id_photo';
      log(`[스타일][${clientId}] ${session.photoStyle}`);
      return;
    }

    // Imagen 생성 요청 (크레딧 체크)
    if (msg.type === 'generate') {
      log(`[Imagen][${clientId}] 생성 요청: style=${msg.style}, gender=${msg.gender || 'male'}, age=${msg.age || 'adult'}, userId=${msg.userId || 'anonymous'}`);

      // 크레딧 체크 및 차감 (1c)
      if (msg.userId) {
        const creditResult = await useCredits(msg.userId, 'generate');
        if (!creditResult.success) {
          ws.send(JSON.stringify({
            type: 'credit-error',
            error: creditResult.error,
            credits: creditResult.credits ?? 0,
            required: 1,
          }));
          log(`[Imagen][${clientId}] 크레딧 부족: ${msg.userId}`);
          return;
        }
        log(`[Credits][${clientId}] 생성 차감 완료: ${msg.userId} → ${creditResult.credits}c`);
        ws.send(JSON.stringify({ type: 'credit-update', credits: creditResult.credits }));
      }

      ws.send(JSON.stringify({ type: 'generate-start' }));
      try {
        const result = await generatePhoto(msg.image, msg.style, msg.gender, msg.age);
        ws.send(JSON.stringify({ type: 'generate-result', image: result }));
        log(`[Imagen][${clientId}] 생성 완료`);
      } catch (err) {
        // 생성 실패 시 크레딧 환불 (1c)
        if (msg.userId) {
          const refund = await refundCredits(msg.userId, 'generate');
          if (refund.success) {
            log(`[Credits][${clientId}] 생성 실패 환불: ${msg.userId} +1c → ${refund.credits}c`);
          }
        }
        ws.send(JSON.stringify({ type: 'generate-error', error: err.message }));
        log(`[Imagen][${clientId}] 생성 실패: ${err.message}`);
      }
      return;
    }

    // 다운로드 크레딧 차감 요청 (10c)
    if (msg.type === 'use-download-credit') {
      if (!msg.userId) {
        ws.send(JSON.stringify({ type: 'credit-error', error: '로그인 필요' }));
        return;
      }

      const creditResult = await useCredits(msg.userId, 'download');
      if (!creditResult.success) {
        ws.send(JSON.stringify({
          type: 'credit-error',
          error: creditResult.error,
          credits: creditResult.credits ?? 0,
          required: 10,
        }));
        log(`[Download][${clientId}] 크레딧 부족: ${msg.userId}`);
        return;
      }

      ws.send(JSON.stringify({
        type: 'download-credit-ok',
        credits: creditResult.credits,
      }));
      log(`[Credits][${clientId}] 다운로드 차감 완료: ${msg.userId} → ${creditResult.credits}c`);
      return;
    }

    // 공유 보너스 요청 (+10c)
    if (msg.type === 'share-bonus') {
      if (!msg.userId) {
        ws.send(JSON.stringify({ type: 'credit-error', error: '로그인 필요' }));
        return;
      }

      const bonusResult = await grantShareBonus(msg.userId, msg.platform);
      if (!bonusResult.success) {
        ws.send(JSON.stringify({ type: 'share-bonus-error', error: bonusResult.error }));
        return;
      }

      ws.send(JSON.stringify({
        type: 'share-bonus-ok',
        credits: bonusResult.credits,
        bonus: bonusResult.bonus,
      }));
      log(`[Credits][${clientId}] 공유 보너스 지급: ${msg.userId} +10c → ${bonusResult.credits}c`);
      return;
    }

    // QC 요청
    if (msg.type === 'qc') {
      log(`[QC][${clientId}] 검증 요청`);
      try {
        const result = await runQC(msg.original, msg.generated);
        ws.send(JSON.stringify({ type: 'qc-result', result }));
        log(`[QC][${clientId}] 판정: ${JSON.stringify(result).substring(0, 100)}`);
      } catch (err) {
        ws.send(JSON.stringify({ type: 'qc-error', error: err.message }));
        log(`[QC][${clientId}] 검증 실패: ${err.message}`);
      }
      return;
    }

    // 코칭 세션 중지 (촬영 완료 시)
    if (msg.type === 'stop-coaching') {
      log(`[코칭][${clientId}] 세션 중지`);
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

    // 코칭 세션 재시작
    if (msg.type === 'restart-coaching') {
      log(`[코칭][${clientId}] 세션 재시작`);
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
    log(`[WS][${clientId}] 클라이언트 연결 종료`);
    if (session.gemini) {
      try { session.gemini.close(); } catch {}
    }
    if (session.bufferFlushTimer) clearTimeout(session.bufferFlushTimer);
    sessions.delete(clientId);
  });
});

// === 서버 시작 ===
httpServer.listen(PORT, '0.0.0.0', () => {
  log('='.repeat(60));
  log('MONKOS AI 증명사진 (KR) — 서버 시작');
  log('='.repeat(60));
  log(`포트: ${PORT}`);
  log(`프로젝트: ${PROJECT_ID}`);
  log(`리전: ${LOCATION}`);
  log(`인증: 하이브리드 (ADC + API Key)`);
  log(`Imagen I2I: 활성 (gemini-3-pro-image-preview, API Key)`);
  log(`QC: 활성 (gemini-2.0-flash)`);
  log('='.repeat(60));
  log('엔드포인트:');
  log('  GET  /health              — 헬스체크');
  log('  GET  /api/info            — 서비스 정보');
  log('  GET  /                    — 랜딩페이지');
  log('  GET  /app                 — 촬영 앱');
  log('  WS   /                    — WebSocket (코칭/생성/QC)');
  log('='.repeat(60));
});

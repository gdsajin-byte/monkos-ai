/**
 * MONKOS Photo Coach 서버
 * 3가지 역할:
 *   a) Gemini Live 코칭 — 촬영 전 실시간 가이드
 *   b) Imagen 3.0 프록시 — 증명사진 생성 (gemini-3-pro-image-preview)
 *   c) Gemini QC — 원본 vs 생성물 유사도 검증
 *
 * 사용법: node server.js
 * 포트: 8443 (HTTPS+WSS)
 * API Key: ../imagen3/backend/.env 에서 자동 로드
 */

import { WebSocketServer } from 'ws';
import { createServer } from 'https';
import { readFileSync, appendFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 8443;
const LOG_FILE = '/tmp/photo_coach.log';

// .env 로드 (imagen3 공유)
const envPath = join(__dirname, '..', 'imagen3', 'backend', '.env');
if (existsSync(envPath)) {
    config({ path: envPath });
}

function log(msg) {
    const line = `[${new Date().toLocaleTimeString('ko-KR')}] ${msg}`;
    console.log(line);
    appendFileSync(LOG_FILE, line + '\n');
}

// === SSL ===
const sslOptions = {
    key: readFileSync(join(__dirname, 'key.pem')),
    cert: readFileSync(join(__dirname, 'cert.pem')),
};

// === Gemini Live API (Vertex AI — 코칭용) ===
const liveAI = new GoogleGenAI({
    vertexai: true,
    project: 'monkos',
    location: 'us-central1',
});

// === Gemini API Key (Imagen 생성 + QC용) ===
// imagen3/backend/.env → Google AI Studio API Key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const imagenAI = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;
if (!GEMINI_API_KEY) {
    log('[경고] GEMINI_API_KEY 미설정 — Imagen 생성/QC 비활성');
} else {
    log('[Imagen] API Key 로드됨 (imagen3/.env)');
}

// === 코칭 시스템 프롬프트 ===
const COACHING_INSTRUCTION = `증명사진 촬영 도우미. 카메라 피드의 자세/표정/조명을 실시간 체크.

[체크리스트]
1. 정면 응시 (좌우 기울기, 시선 방향)
2. 무표정 또는 자연스러운 미소
3. 조명 균일 (한쪽 그림자 없이)
4. 배경 깔끔 (단색 선호)
5. 머리카락 정리, 안경 반사 없음
6. 어깨 수평, 머리 위 여백 적절

[응답 규칙]
- 한국어 1문장
- 모든 체크 통과 → "좋아요! 지금 촬영하세요"
- 문제 있으면 → 가장 중요한 것 하나만 구체적 수정 안내
- 예: "턱을 살짝 올려주세요", "왼쪽 조명이 강해요, 살짝 오른쪽으로 이동하세요"`;

// === Imagen 프롬프트 (photo.js에서 가져옴) ===
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
    profile: 'Professional business profile photo, soft studio lighting, neutral background, confident expression',
    casual: 'Natural casual portrait, soft daylight, relaxed expression, lifestyle photography',
    suit: 'Professional portrait wearing formal business suit, corporate style, studio lighting',
    resume: 'Professional resume photo, clean studio background, business casual attire, approachable expression',
};

// === QC 프롬프트 ===
const QC_INSTRUCTION = `두 이미지를 비교하세요.
첫 번째: 원본 (실제 촬영)
두 번째: AI 생성물 (증명사진)

[판정 기준]
1. 동일 인물인가? (얼굴 구조, 눈/코/입 비율)
2. 유사도 % (0-100)
3. 정체성 유지 여부 (PASS/FAIL)
4. 증명사진 품질 (조명, 배경, 구도)

[응답 형식 — JSON]
{ "same_person": true/false, "similarity": 85, "identity": "PASS", "quality": "GOOD", "note": "한줄 코멘트" }`;

// === Gemini Live 세션 ===
let geminiSession = null;
let frameCount = 0;

// 응답 버퍼: 토큰 단위 조각을 모아서 턴 완료 시 한번에 전송
let responseBuffer = '';
let bufferFlushTimer = null;
const BUFFER_FLUSH_MS = 600; // 600ms 동안 추가 토큰 없으면 전송

function flushResponseBuffer() {
    if (responseBuffer.trim()) {
        sendToClient({ type: 'ai-coaching', text: responseBuffer.trim(), timestamp: Date.now() });
        log(`[코칭] ${responseBuffer.trim()}`);
    }
    responseBuffer = '';
    bufferFlushTimer = null;
}

async function initGeminiSession() {
    try {
        geminiSession = await liveAI.live.connect({
            model: 'gemini-2.0-flash-live-preview-04-09',
            config: {
                responseModalities: ['TEXT'],
                systemInstruction: { parts: [{ text: COACHING_INSTRUCTION }] },
            },
            callbacks: {
                onopen: () => log('[Gemini Live] 연결됨'),
                onclose: (e) => {
                    log(`[Gemini Live] 닫힘: ${e?.code || 'unknown'}`);
                    geminiSession = null;
                },
                onerror: (e) => log(`[Gemini Live] 에러: ${e?.message || e}`),
                onmessage: (msg) => {
                    // turnComplete → 즉시 플러시
                    if (msg?.serverContent?.turnComplete) {
                        if (bufferFlushTimer) clearTimeout(bufferFlushTimer);
                        flushResponseBuffer();
                        return;
                    }
                    const parts = msg?.serverContent?.modelTurn?.parts;
                    if (parts) {
                        const text = parts.filter(p => p.text).map(p => p.text).join('');
                        if (text) {
                            responseBuffer += text;
                            // 타이머 리셋: 마지막 토큰 후 600ms 대기
                            if (bufferFlushTimer) clearTimeout(bufferFlushTimer);
                            bufferFlushTimer = setTimeout(flushResponseBuffer, BUFFER_FLUSH_MS);
                        }
                    }
                },
            },
        });
        log('[Gemini Live] 세션 초기화 완료');
        return true;
    } catch (err) {
        log('[Gemini Live] 세션 실패: ' + err.message);
        return false;
    }
}

// === Imagen 3.0 생성 (@google/genai SDK — imagen3 검증 방식) ===
async function generatePhoto(inputBase64, style = 'id_photo') {
    if (!imagenAI) throw new Error('GEMINI_API_KEY 미설정');

    const mimeType = 'image/jpeg';
    const base64Data = inputBase64.includes(',') ? inputBase64.split(',')[1] : inputBase64;
    const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.id_photo;
    const instruction = `${IDENTITY_PRESERVATION}\n\n[IMAGE-TO-IMAGE TRANSFORM] ${stylePrompt}`;

    const response = await imagenAI.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
            parts: [
                { inlineData: { data: base64Data, mimeType } },
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
    if (!part?.inlineData) throw new Error('이미지 생성 실패: 응답에 이미지 없음');

    return `data:image/png;base64,${part.inlineData.data}`;
}

// === Gemini QC (@google/genai SDK) ===
async function runQC(originalBase64, generatedBase64) {
    if (!imagenAI) throw new Error('GEMINI_API_KEY 미설정');

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
    log(`[QC] 응답: ${text.substring(0, 200)}`);

    // JSON 파싱 시도
    try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch { /* 파싱 실패 시 원문 반환 */ }
    return { raw: text };
}

// === HTTPS 서버 ===
const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript',
    '.css': 'text/css',
};

const httpsServer = createServer(sslOptions, (req, res) => {
    const fileName = req.url === '/' ? '/index.html' : req.url;
    const filePath = join(__dirname, fileName);
    const ext = fileName.substring(fileName.lastIndexOf('.'));
    try {
        const content = readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
        res.end(content);
    } catch {
        res.writeHead(404);
        res.end('Not Found');
    }
});

// === WebSocket ===
const wss = new WebSocketServer({ server: httpsServer });
let clientWs = null;

function sendToClient(obj) {
    if (clientWs && clientWs.readyState === 1) {
        clientWs.send(JSON.stringify(obj));
    }
}

wss.on('connection', (ws) => {
    log('[WS] 클라이언트 연결');
    clientWs = ws;

    ws.on('message', async (data, isBinary) => {
        // 바이너리 = JPEG 프레임 → Gemini Live 코칭
        if (isBinary) {
            if (!geminiSession) return;
            try {
                const base64 = Buffer.from(data).toString('base64');
                await geminiSession.sendRealtimeInput({
                    media: { data: base64, mimeType: 'image/jpeg' },
                });
                frameCount++;
                if (frameCount % 5 === 1) log(`[프레임] #${frameCount} (${data.length}B)`);
                if (frameCount % 5 === 0) {
                    await geminiSession.sendClientContent({ turnComplete: true });
                }
            } catch (err) {
                log('[프레임 전송 오류] ' + err.message);
            }
            return;
        }

        // 텍스트 = JSON 명령
        let msg;
        try {
            const raw = Buffer.isBuffer(data) ? data.toString() : data;
            msg = JSON.parse(raw);
        } catch { return; }

        // Imagen 생성 요청
        if (msg.type === 'generate') {
            log(`[Imagen] 생성 요청: style=${msg.style}`);
            sendToClient({ type: 'generate-start' });
            try {
                const result = await generatePhoto(msg.image, msg.style);
                sendToClient({ type: 'generate-result', image: result });
                log('[Imagen] 생성 완료');
            } catch (err) {
                sendToClient({ type: 'generate-error', error: err.message });
                log('[Imagen] 생성 실패: ' + err.message);
            }
            return;
        }

        // QC 요청
        if (msg.type === 'qc') {
            log('[QC] 검증 요청');
            try {
                const result = await runQC(msg.original, msg.generated);
                sendToClient({ type: 'qc-result', result });
                log(`[QC] 판정: ${JSON.stringify(result).substring(0, 100)}`);
            } catch (err) {
                sendToClient({ type: 'qc-error', error: err.message });
                log('[QC] 검증 실패: ' + err.message);
            }
            return;
        }

        // 코칭 세션 재시작
        if (msg.type === 'restart-coaching') {
            log('[코칭] 세션 재시작 요청');
            frameCount = 0;
            if (geminiSession) {
                try { geminiSession.close(); } catch {}
            }
            await initGeminiSession();
            return;
        }
    });

    ws.on('close', () => {
        log('[WS] 클라이언트 해제');
        clientWs = null;
    });
});

// === 서버 시작 ===
httpsServer.listen(PORT, '0.0.0.0', async () => {
    log(`[서버] https://0.0.0.0:${PORT}`);
    log(`=== MONKOS Photo Coach ===`);
    log(`iPhone: https://100.97.103.10:${PORT}/`);
    log(`Imagen: ${GEMINI_API_KEY ? '활성' : '비활성 (GEMINI_API_KEY 필요)'}`);
    log(`==========================`);

    const connected = await initGeminiSession();
    if (!connected) {
        log('[경고] Gemini Live 없이 시작 — 코칭 비활성');
    }
});

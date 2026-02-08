/**
 * MONKOS Presentation Assistant 서버
 * WebRTC 프레임 수신 → Gemini Live API → 오버레이 응답
 *
 * 사용법: node presentation_server.js
 * 포트: 8443 (HTTPS+WSS 통합)
 */

import { WebSocketServer } from 'ws';
import { createServer } from 'https';
import { readFileSync, appendFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 8443;
const LOG_FILE = '/tmp/presentation_server.log';

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

// === Gemini Live API ===
const ai = new GoogleGenAI({
    vertexai: true,
    project: 'monkos',
    location: 'us-central1',
});

const SYSTEM_INSTRUCTION = `당신은 MONKOS Presentation Assistant입니다.
발표자의 프레젠테이션/면접을 실시간으로 보조합니다.

[행동 규칙]
1. 화면에 슬라이드가 보이면 → 해당 슬라이드의 핵심 포인트를 간결히 요약
2. 질문이 들리거나 보이면 → 관련 답변 가이드를 즉시 제공
3. 수치/통계가 보이면 → 핵심 데이터 포인트를 강조
4. 발표 흐름 보조 → "다음 포인트로 넘어가세요" 등 부드러운 가이드
5. 응답은 반드시 한국어, 2-3문장 이내로 짧게

[응답 형식]
- 핵심만 짧게 (발표 중 읽을 수 있도록)
- 불필요한 인사말/설명 없이 바로 본론`;

let geminiSession = null;
let frameCount = 0;

function broadcastCoaching(text) {
    const coaching = JSON.stringify({
        type: 'ai-coaching',
        text,
        timestamp: Date.now(),
    });
    for (const role of ['sender', 'receiver']) {
        const ws = clients.get(role);
        if (ws && ws.readyState === 1) {
            ws.send(coaching);
        }
    }
    log(`[AI] ${text.substring(0, 80)}`);
}

async function initGeminiSession() {
    try {
        geminiSession = await ai.live.connect({
            model: 'gemini-2.0-flash-live-preview-04-09',
            config: {
                responseModalities: ['TEXT'],
                systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
            },
            callbacks: {
                onopen: () => log('[Gemini] WS 열림'),
                onclose: (e) => log(`[Gemini] WS 닫힘: ${e?.code || 'unknown'}`),
                onerror: (e) => log(`[Gemini] WS 에러: ${e?.message || e}`),
                onmessage: (msg) => {
                    log(`[Gemini] 응답 수신: ${JSON.stringify(msg).substring(0, 200)}`);
                    const parts = msg?.serverContent?.modelTurn?.parts;
                    if (parts) {
                        const textParts = parts.filter(p => p.text).map(p => p.text);
                        if (textParts.length > 0) {
                            broadcastCoaching(textParts.join(''));
                        }
                    }
                },
            },
        });
        log('[Gemini] Live 세션 연결됨');
        return true;
    } catch (err) {
        log('[Gemini] 세션 연결 실패: ' + err.message);
        return false;
    }
}

// === HTTPS 서버 ===
const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript',
    '.css': 'text/css',
};

const httpsServer = createServer(sslOptions, (req, res) => {
    const fileName = req.url === '/' ? '/presenter_receiver.html' : req.url;
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

// === WebSocket 시그널링 + 프레임 중계 ===
const wss = new WebSocketServer({ server: httpsServer });
const clients = new Map();

wss.on('connection', (ws, req) => {
    log(`[WS] 새 연결: ${req.socket.remoteAddress}`);
    let role = null;

    ws.on('message', async (data, isBinary) => {
        // isBinary 플래그로 JPEG 프레임 vs JSON 텍스트 구분
        if (isBinary) {
            if (role === 'receiver' && geminiSession) {
                try {
                    const base64 = Buffer.from(data).toString('base64');
                    await geminiSession.sendRealtimeInput({
                        media: {
                            data: base64,
                            mimeType: 'image/jpeg',
                        }
                    });
                    frameCount++;
                    if (frameCount % 5 === 1) log(`[Gemini] 프레임 #${frameCount} 전송 (${data.length}B)`);
                    // 5프레임마다 턴 완료 → 응답 트리거
                    if (frameCount % 5 === 0) {
                        await geminiSession.sendClientContent({ turnComplete: true });
                        log(`[Gemini] turnComplete 전송 (프레임 #${frameCount})`);
                    }
                } catch (err) {
                    log('[Gemini] 프레임 전송 오류: ' + err.message);
                }
            }
            return;
        }

        // 텍스트 = JSON 메시지
        const raw = Buffer.isBuffer(data) ? data.toString() : data;
        let msg;
        try {
            msg = JSON.parse(raw);
        } catch {
            return;
        }

        // 역할 등록
        if (msg.type === 'register') {
            role = msg.role;
            clients.set(role, ws);
            log(`[등록] ${role} (현재: ${[...clients.keys()].join(', ')})`);

            const target = role === 'sender' ? 'receiver' : 'sender';
            const targetWs = clients.get(target);
            if (targetWs && targetWs.readyState === 1) {
                targetWs.send(JSON.stringify({ type: 'peer-joined', role }));
            }
            return;
        }

        // SDP/ICE → 상대에게 전달
        const target = role === 'sender' ? 'receiver' : 'sender';
        const targetWs = clients.get(target);
        if (targetWs && targetWs.readyState === 1) {
            targetWs.send(raw);
            if (msg.type === 'offer' || msg.type === 'answer') {
                log(`[시그널링] ${role} → ${target}: ${msg.type}`);
            }
        }
    });

    ws.on('close', () => {
        if (role) {
            clients.delete(role);
            log(`[해제] ${role}`);
        }
    });
});

// === 서버 시작 ===
httpsServer.listen(PORT, '0.0.0.0', async () => {
    log(`[서버] https://0.0.0.0:${PORT}`);
    log(`=== MONKOS Presentation Assistant ===`);
    log(`iMac 수신: https://localhost:${PORT}/presenter_receiver.html`);
    log(`iPhone 송신: https://100.97.103.10:${PORT}/presenter_sender.html`);
    log(`=====================================`);

    const connected = await initGeminiSession();
    if (!connected) {
        log('[경고] Gemini 없이 시작 — 프레임 캡처만 동작');
    }
});

/**
 * MONKOS WebRTC 시그널링 서버 (HTTPS)
 * SDP offer/answer + ICE candidate 교환만 담당
 *
 * 사용법: node signaling_server.js
 * 포트: 8443 (HTTPS + WSS 통합)
 */

import { WebSocketServer } from 'ws';
import { createServer } from 'https';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 8443;

// SSL 인증서
const sslOptions = {
    key: readFileSync(join(__dirname, 'key.pem')),
    cert: readFileSync(join(__dirname, 'cert.pem')),
};

// === HTTPS 정적 파일 서버 ===
const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
};

// mirror_client.js 자동 삽입 제외 목록
// mirror 시스템 페이지만 제외 (대상 페이지는 모두 주입)
const INJECT_EXCLUDE = new Set([
    '/mirror_console.html',
    '/mirror_launcher.html',
]);

const httpsServer = createServer(sslOptions, (req, res) => {
    const urlPath = req.url.split('?')[0]; // 쿼리스트링 제거
    const fileName = urlPath === '/' ? '/receiver.html'
                   : urlPath === '/mirror' ? '/mirror_launcher.html'
                   : urlPath;
    const filePath = join(__dirname, fileName);
    const ext = fileName.substring(fileName.lastIndexOf('.'));

    try {
        // HTML 파일에 mirror_client.js 자동 삽입 (제외 목록 외)
        if (ext === '.html' && !INJECT_EXCLUDE.has(urlPath)) {
            let html = readFileSync(filePath, 'utf8');
            html = html.replace('</body>',
                `<script src="/mirror_client.js"><\/script>\n</body>`);
            res.writeHead(200, { 'Content-Type': MIME[ext] });
            res.end(html);
            return;
        }

        const content = readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
        res.end(content);
    } catch {
        res.writeHead(404);
        res.end('Not Found');
    }
});

// === WebSocket 시그널링 (HTTPS 서버 위에 올림) ===
const wss = new WebSocketServer({ server: httpsServer });
const clients = new Map();

// 역할 페어링 맵 (sender↔receiver, mirror-sender↔mirror-receiver)
const ROLE_PAIRS = {
    'sender': 'receiver',
    'receiver': 'sender',
    'mirror-sender': 'mirror-receiver',
    'mirror-receiver': 'mirror-sender',
};

wss.on('connection', (ws) => {
    let role = null;

    ws.on('message', (data) => {
        const msg = JSON.parse(data);

        if (msg.type === 'register') {
            role = msg.role;
            clients.set(role, ws);
            console.log(`[등록] ${role} 연결됨 (현재: ${[...clients.keys()].join(', ')})`);

            const target = ROLE_PAIRS[role];
            if (target) {
                const targetWs = clients.get(target);
                if (targetWs && targetWs.readyState === 1) {
                    targetWs.send(JSON.stringify({ type: 'peer-joined', role }));
                    ws.send(JSON.stringify({ type: 'peer-joined', role: target }));
                }
            }
            return;
        }

        const target = ROLE_PAIRS[role];
        if (target) {
            const targetWs = clients.get(target);
            if (targetWs && targetWs.readyState === 1) {
                targetWs.send(data);
                console.log(`[중계] ${role} → ${target}: ${msg.type}`);
            }
        }
    });

    ws.on('close', () => {
        if (role) {
            clients.delete(role);
            console.log(`[해제] ${role} 연결 해제`);

            // 상대에게 끊김 알림
            const target = ROLE_PAIRS[role];
            if (target) {
                const targetWs = clients.get(target);
                if (targetWs && targetWs.readyState === 1) {
                    targetWs.send(JSON.stringify({ type: 'peer-left', role }));
                }
            }
        }
    });
});

httpsServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[HTTPS+WSS] 서버 구동: https://0.0.0.0:${PORT}`);
    console.log(`\n=== 접속 안내 ===`);
    console.log(`iMac 수신: https://localhost:${PORT}/receiver.html`);
    console.log(`iPhone 송신: https://100.97.103.10:${PORT}/sender.html`);
    console.log(`--- 미러링 ---`);
    console.log(`iMac 콘솔: https://localhost:${PORT}/mirror_console.html`);
    console.log(`iPhone 런처: https://100.97.103.10:${PORT}/mirror`);
    console.log(`iPhone 주입: <script src="https://100.97.103.10:${PORT}/mirror_client.js"><\/script>`);
    console.log(`================\n`);
    console.log(`※ 자체서명 인증서 사용 — 브라우저 경고 시 "고급 → 계속" 클릭`);
});

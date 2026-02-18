/**
 * MONKOS Mirror Client — 주입용 화면 캡쳐 스크립트
 *
 * 사용법:
 *   <script src="https://100.97.103.10:8443/mirror_client.js"></script>
 *   또는 URL 파라미터: ?mirror=100.97.103.10:8443
 *
 * html2canvas로 DOM 주기적 캡쳐 → WebRTC DataChannel 전송
 * 콘솔(mirror_console.html)에서 카메라 제어, 스크린샷 등 명령 수신
 */
(function () {
    'use strict';

    // 이미 로드됐으면 중복 실행 방지
    if (window.__MONKOS_MIRROR__) return;
    window.__MONKOS_MIRROR__ = true;

    // --- 설정 ---
    const SCRIPT_SRC = document.currentScript?.src || '';
    const SIGNAL_HOST = new URL(SCRIPT_SRC).host || location.host;
    const WS_URL = `wss://${SIGNAL_HOST}`;
    const HTML2CANVAS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';

    let ws = null;
    let pc = null;
    let dc = null; // DataChannel
    let captureTimer = null;
    let fps = 0; // 0 = 멈춤 (원샷 캡쳐만)
    let quality = 0.6;
    let isCapturing = false;
    let localStream = null; // 카메라 스트림
    let facingMode = 'environment';
    let html2canvasLoaded = false;
    let badgeExpanded = false;

    // --- html2canvas 동적 로드 ---
    function loadHtml2Canvas() {
        return new Promise((resolve, reject) => {
            if (window.html2canvas) return resolve();
            const s = document.createElement('script');
            s.src = HTML2CANVAS_CDN;
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
        });
    }

    // --- Floating Badge + 컨트롤 패널 ---
    function createBadge() {
        const badge = document.createElement('div');
        badge.id = 'monkos-mirror-badge';
        badge.innerHTML = `
            <style>
                #monkos-mirror-badge {
                    position: fixed; top: 8px; right: 8px; z-index: 999999;
                    background: rgba(0,0,0,0.85); color: #fff;
                    font-family: -apple-system, monospace; font-size: 11px;
                    padding: 6px 10px; border-radius: 20px;
                    user-select: none;
                    display: flex; align-items: center; gap: 6px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                    transition: all 0.2s;
                }
                .mm-dot {
                    width: 10px; height: 10px; border-radius: 50%;
                    background: #ef4444; flex-shrink: 0; cursor: pointer;
                }
                .mm-dot.on { background: #22c55e; }
                .mm-dot.connecting { background: #f59e0b; }
                .mm-text {
                    font-size: 10px; white-space: nowrap;
                    max-width: 80px; overflow: hidden;
                }
                .mm-controls {
                    display: none; gap: 4px; align-items: center;
                }
                .mm-controls.show { display: flex; }
                .mm-btn {
                    padding: 4px 8px; border-radius: 4px; border: none;
                    background: #333; color: #fff; font-size: 12px;
                    cursor: pointer; white-space: nowrap;
                }
                .mm-btn:active { opacity: 0.6; }
                .mm-btn.active { background: #22c55e; color: #000; }
            </style>
            <span class="mm-dot" id="mm-dot"></span>
            <span class="mm-text" id="mm-text">MIRROR</span>
            <span class="mm-controls" id="mm-controls">
                <button class="mm-btn" id="mm-toggle">연결</button>
                <button class="mm-btn" id="mm-shot">📷</button>
                <button class="mm-btn" id="mm-cam">📹</button>
                <button class="mm-btn" id="mm-back">↩</button>
            </span>
        `;

        document.body.appendChild(badge);

        // dot 탭 → 패널 펼침/접힘
        document.getElementById('mm-dot').addEventListener('click', (e) => {
            e.stopPropagation();
            badgeExpanded = !badgeExpanded;
            document.getElementById('mm-controls').classList.toggle('show', badgeExpanded);
        });

        // 연결/끊기 토글
        document.getElementById('mm-toggle').addEventListener('click', (e) => {
            e.stopPropagation();
            if (ws && ws.readyState <= 1) {
                cleanupAll();
                setBadgeStatus('off', 'MIRROR 끊김');
                document.getElementById('mm-toggle').textContent = '연결';
                document.getElementById('mm-toggle').classList.remove('active');
            } else {
                cleanupAll();
                connectSignaling();
            }
        });

        // 스크린샷
        document.getElementById('mm-shot').addEventListener('click', (e) => {
            e.stopPropagation();
            captureAndSend(true);
        });

        // 카메라 토글
        document.getElementById('mm-cam').addEventListener('click', (e) => {
            e.stopPropagation();
            if (localStream) {
                stopCamera();
            } else {
                startCamera();
            }
        });

        // 런처로 돌아가기
        document.getElementById('mm-back').addEventListener('click', (e) => {
            e.stopPropagation();
            cleanupAll();
            window.location.href = '/mirror';
        });

        return badge;
    }

    // 연결 상태에 따라 토글 버튼 갱신
    function updateToggleBtn() {
        const btn = document.getElementById('mm-toggle');
        if (!btn) return;
        const connected = ws && ws.readyState === 1;
        btn.textContent = connected ? '끊기' : '연결';
        btn.classList.toggle('active', connected);
    }

    function setBadgeStatus(state, text) {
        const dot = document.getElementById('mm-dot');
        const txt = document.getElementById('mm-text');
        if (dot) {
            dot.className = 'mm-dot' + (state === 'on' ? ' on' : state === 'connecting' ? ' connecting' : '');
        }
        if (txt) txt.textContent = text;
        updateToggleBtn();
    }

    // --- 전체 정리 (WS + P2P) ---
    function cleanupAll() {
        stopCapture();
        if (dc) { try { dc.close(); } catch {} dc = null; }
        if (pc) { try { pc.close(); } catch {} pc = null; }
        if (ws) { try { ws.close(); } catch {} ws = null; }
    }

    // --- P2P만 정리 ---
    function cleanupPeerConnection() {
        stopCapture();
        if (dc) { try { dc.close(); } catch {} dc = null; }
        if (pc) { try { pc.close(); } catch {} pc = null; }
    }

    // --- WebSocket 시그널링 (1회 연결, 자동 재연결 없음) ---
    function connectSignaling() {
        if (ws && ws.readyState <= 1) return; // 이미 연결 중이면 무시

        setBadgeStatus('connecting', 'MIRROR 연결 중...');
        ws = new WebSocket(WS_URL);

        ws.onopen = () => {
            ws.send(JSON.stringify({ type: 'register', role: 'mirror-sender' }));
            console.log('[Mirror] 시그널링 연결됨');
            setBadgeStatus('connecting', 'MIRROR 대기');
        };

        ws.onmessage = async (e) => {
            try {
                const raw = (e.data instanceof Blob) ? await e.data.text() : e.data;
                const msg = JSON.parse(raw);

                if (msg.type === 'peer-joined') {
                    console.log('[Mirror] 콘솔 접속 감지 → P2P 시작');
                    cleanupPeerConnection();
                    startPeerConnection();
                } else if (msg.type === 'answer') {
                    if (pc) {
                        await pc.setRemoteDescription(new RTCSessionDescription(msg));
                        console.log('[Mirror] Answer 수신');
                    }
                } else if (msg.type === 'ice-candidate') {
                    if (pc && pc.remoteDescription) {
                        await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
                    }
                }
            } catch (err) {
                console.error('[Mirror] 메시지 오류:', err);
            }
        };

        ws.onclose = () => {
            console.log('[Mirror] 시그널링 끊김');
            cleanupPeerConnection();
            setBadgeStatus('off', 'MIRROR 끊김');
            ws = null;
            // 재연결 안 함 — foreground 복귀 시 자동 재연결
        };

        ws.onerror = () => {
            console.error('[Mirror] WebSocket 오류');
        };
    }

    // --- 페이지 가시성 전환 (온디맨드 핵심) ---
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            // 포그라운드 복귀 → 연결 안 되어있으면 클린 스타트
            if (!ws || ws.readyState > 1) {
                console.log('[Mirror] 포그라운드 복귀 → 재연결');
                cleanupAll();
                connectSignaling();
            }
        } else {
            // 백그라운드 진입 → 리소스 전부 반환
            console.log('[Mirror] 백그라운드 → 리소스 반환');
            cleanupAll();
        }
    });

    // --- WebRTC P2P + DataChannel ---
    function startPeerConnection() {
        cleanupPeerConnection();

        pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        // DataChannel 생성 (sender가 만듦)
        dc = pc.createDataChannel('mirror', {
            ordered: false,
            maxRetransmits: 0 // 빠른 전송 우선, 손실 허용
        });

        dc.onopen = () => {
            console.log('[Mirror] DataChannel 열림');
            if (fps > 0) {
                setBadgeStatus('on', `MIRROR ${fps}fps`);
                startCapture();
            } else {
                setBadgeStatus('on', 'MIRROR 대기');
            }
        };

        dc.onclose = () => {
            console.log('[Mirror] DataChannel 닫힘');
            setBadgeStatus('off', 'MIRROR DC 끊김');
            stopCapture();
        };

        // 콘솔에서 오는 명령 수신
        dc.onmessage = (e) => {
            handleCommand(e.data);
        };

        pc.onicecandidate = (e) => {
            if (e.candidate && ws && ws.readyState === 1) {
                ws.send(JSON.stringify({ type: 'ice-candidate', candidate: e.candidate }));
            }
        };

        pc.onconnectionstatechange = () => {
            console.log('[Mirror] P2P 상태:', pc.connectionState);
            if (pc.connectionState === 'connected') {
                setBadgeStatus('on', fps > 0 ? `MIRROR ${fps}fps` : 'MIRROR 대기');
            } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
                // 온디맨드: 재연결 안 함 — 정리만 수행
                console.log('[Mirror] P2P 끊김 → 정리 (재연결 안 함)');
                stopCapture();
                cleanupPeerConnection();
                setBadgeStatus('off', 'MIRROR P2P 끊김');
            }
        };

        // Offer 생성 + 전송
        pc.createOffer().then(offer => {
            pc.setLocalDescription(offer);
            ws.send(JSON.stringify(offer));
            console.log('[Mirror] Offer 전송');
        });
    }

    // --- 화면 캡쳐 + 전송 ---
    function startCapture() {
        if (isCapturing) return;
        isCapturing = true;
        scheduleCapture();
    }

    function stopCapture() {
        isCapturing = false;
        if (captureTimer) {
            clearTimeout(captureTimer);
            captureTimer = null;
        }
    }

    async function captureAndSend(highQuality) {
        if (!dc || dc.readyState !== 'open') return;
        if (!html2canvasLoaded || !window.html2canvas) return;

        try {
            // html2canvas 미러 뱃지 제외
            const badge = document.getElementById('monkos-mirror-badge');
            if (badge) badge.style.display = 'none';

            const canvas = await window.html2canvas(document.body, {
                scale: highQuality ? 2 : 1,
                logging: false,
                useCORS: true,
                allowTaint: true,
                backgroundColor: null,
                width: window.innerWidth,
                height: window.innerHeight,
                scrollX: 0,
                scrollY: 0,
                windowWidth: window.innerWidth,
                windowHeight: window.innerHeight,
            });

            if (badge) badge.style.display = '';

            const q = highQuality ? 0.95 : quality;
            const dataUrl = canvas.toDataURL('image/jpeg', q);

            // DataChannel 최대 메시지 크기 제한 대응: 청크 분할
            const CHUNK_SIZE = 60000; // ~60KB per chunk
            const totalChunks = Math.ceil(dataUrl.length / CHUNK_SIZE);
            const frameId = Date.now();

            if (totalChunks === 1) {
                // 단일 프레임
                dc.send(JSON.stringify({
                    type: highQuality ? 'screenshot' : 'frame',
                    data: dataUrl,
                    w: canvas.width,
                    h: canvas.height,
                    ts: frameId,
                }));
            } else {
                // 청크 분할 전송
                for (let i = 0; i < totalChunks; i++) {
                    const chunk = dataUrl.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
                    dc.send(JSON.stringify({
                        type: highQuality ? 'screenshot-chunk' : 'frame-chunk',
                        id: frameId,
                        idx: i,
                        total: totalChunks,
                        data: chunk,
                        w: canvas.width,
                        h: canvas.height,
                    }));
                }
            }
        } catch (err) {
            console.error('[Mirror] 캡쳐 오류:', err);
        }
    }

    function scheduleCapture() {
        if (!isCapturing) return;
        captureAndSend(false).then(() => {
            if (isCapturing) {
                captureTimer = setTimeout(scheduleCapture, 1000 / fps);
            }
        });
    }

    // --- 명령 핸들러 ---
    function handleCommand(raw) {
        try {
            const cmd = JSON.parse(raw);
            console.log('[Mirror] 명령 수신:', cmd.type);

            switch (cmd.type) {
                case 'cam-on':
                    startCamera();
                    break;
                case 'cam-off':
                    stopCamera();
                    break;
                case 'cam-flip':
                    flipCamera();
                    break;
                case 'screenshot':
                    captureAndSend(true);
                    break;
                case 'set-fps':
                    fps = Math.max(0, Math.min(5, cmd.fps != null ? cmd.fps : 2));
                    if (fps === 0) {
                        stopCapture();
                        setBadgeStatus('on', 'MIRROR 대기');
                    } else {
                        setBadgeStatus('on', `MIRROR ${fps}fps`);
                        if (dc && dc.readyState === 'open' && !isCapturing) {
                            startCapture();
                        }
                    }
                    console.log('[Mirror] FPS 변경:', fps);
                    break;
                case 'set-quality':
                    quality = Math.max(0.3, Math.min(0.95, cmd.quality || 0.6));
                    console.log('[Mirror] 품질 변경:', quality);
                    break;
                case 'navigate':
                    if (cmd.url) {
                        window.location.href = cmd.url;
                    }
                    break;
            }
        } catch (err) {
            console.error('[Mirror] 명령 파싱 오류:', err);
        }
    }

    // --- 카메라 제어 ---
    async function startCamera() {
        try {
            if (localStream) stopCamera();
            localStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false
            });
            // 카메라 프리뷰 오버레이 (작은 PIP)
            let pip = document.getElementById('monkos-mirror-pip');
            if (!pip) {
                pip = document.createElement('video');
                pip.id = 'monkos-mirror-pip';
                pip.autoplay = true;
                pip.playsInline = true;
                pip.muted = true;
                pip.style.cssText = `
                    position: fixed; bottom: 16px; right: 16px; z-index: 999998;
                    width: 120px; border-radius: 8px;
                    box-shadow: 0 2px 12px rgba(0,0,0,0.5);
                    border: 2px solid #22c55e;
                `;
                document.body.appendChild(pip);
            }
            pip.srcObject = localStream;
            console.log('[Mirror] 카메라 ON:', facingMode);

            // 카메라 상태를 콘솔에 전달
            if (dc && dc.readyState === 'open') {
                dc.send(JSON.stringify({ type: 'cam-status', active: true, facingMode }));
            }
        } catch (err) {
            console.error('[Mirror] 카메라 오류:', err);
        }
    }

    function stopCamera() {
        if (localStream) {
            localStream.getTracks().forEach(t => t.stop());
            localStream = null;
        }
        const pip = document.getElementById('monkos-mirror-pip');
        if (pip) pip.remove();
        console.log('[Mirror] 카메라 OFF');

        if (dc && dc.readyState === 'open') {
            dc.send(JSON.stringify({ type: 'cam-status', active: false }));
        }
    }

    async function flipCamera() {
        facingMode = facingMode === 'environment' ? 'user' : 'environment';
        if (localStream) {
            await startCamera(); // 재시작으로 전환
        }
    }

    // --- 초기화 ---
    async function init() {
        createBadge();

        try {
            await loadHtml2Canvas();
            html2canvasLoaded = true;
            console.log('[Mirror] html2canvas 로드 완료');
        } catch (err) {
            console.error('[Mirror] html2canvas 로드 실패 — 캡쳐 불가, 연결은 계속');
            setBadgeStatus('connecting', 'MIRROR (캡쳐 불가)');
        }

        connectSignaling();
    }

    // DOM 준비 후 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

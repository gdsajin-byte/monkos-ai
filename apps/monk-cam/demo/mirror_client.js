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

    // --- Floating Badge UI ---
    function createBadge() {
        const badge = document.createElement('div');
        badge.id = 'monkos-mirror-badge';
        badge.innerHTML = `
            <style>
                #monkos-mirror-badge {
                    position: fixed; top: 8px; right: 8px; z-index: 999999;
                    background: rgba(0,0,0,0.85); color: #fff;
                    font-family: -apple-system, monospace; font-size: 11px;
                    padding: 6px 10px; border-radius: 6px;
                    cursor: move; user-select: none;
                    display: flex; align-items: center; gap: 6px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                    transition: opacity 0.3s;
                }
                #monkos-mirror-badge.minimized {
                    padding: 4px 6px; font-size: 0;
                }
                #monkos-mirror-badge.minimized .mm-dot { margin: 0; }
                #monkos-mirror-badge.minimized .mm-text { display: none; }
                .mm-dot {
                    width: 8px; height: 8px; border-radius: 50%;
                    background: #ef4444; flex-shrink: 0;
                }
                .mm-dot.on { background: #22c55e; }
                .mm-dot.connecting { background: #f59e0b; }
            </style>
            <span class="mm-dot" id="mm-dot"></span>
            <span class="mm-text" id="mm-text">MIRROR 연결 중...</span>
        `;

        // 더블탭으로 최소화/복원
        let tapCount = 0;
        badge.addEventListener('click', () => {
            tapCount++;
            if (tapCount === 2) {
                badge.classList.toggle('minimized');
                tapCount = 0;
            }
            setTimeout(() => { tapCount = 0; }, 300);
        });

        document.body.appendChild(badge);
        return badge;
    }

    function setBadgeStatus(state, text) {
        const dot = document.getElementById('mm-dot');
        const txt = document.getElementById('mm-text');
        if (dot) {
            dot.className = 'mm-dot' + (state === 'on' ? ' on' : state === 'connecting' ? ' connecting' : '');
        }
        if (txt) txt.textContent = text;
    }

    // --- 기존 P2P 정리 ---
    function cleanupPeerConnection() {
        stopCapture();
        if (dc) { try { dc.close(); } catch {} dc = null; }
        if (pc) { try { pc.close(); } catch {} pc = null; }
    }

    // --- WebSocket 시그널링 ---
    function connectSignaling() {
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
            setBadgeStatus('off', 'MIRROR 끊김');
            console.log('[Mirror] 시그널링 끊김 — 2초 후 재연결');
            cleanupPeerConnection();
            setTimeout(connectSignaling, 2000);
        };

        ws.onerror = () => {
            console.error('[Mirror] WebSocket 오류');
        };
    }

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
                setBadgeStatus('connecting', 'MIRROR 재연결...');
                stopCapture();
                // WS 살아있으면 2초 후 P2P 재시도
                if (ws && ws.readyState === 1) {
                    setTimeout(() => {
                        console.log('[Mirror] P2P 재연결 시도');
                        cleanupPeerConnection();
                        startPeerConnection();
                    }, 2000);
                }
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

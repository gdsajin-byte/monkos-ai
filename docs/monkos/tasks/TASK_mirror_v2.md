# 지시서: Mirror v2 — 전체 페이지 미러링 + 뱃지 컨트롤

[2026-02-18 17:40 KST] iMac/쌍아 → 막내(any)

## 역할 선언
> **너는 "막내"다. 쌍아가 아니다.**
> - 쌍아 = VSCode 전략실 (이 지시서를 작성한 에이전트)
> - 막내 = iTerm 터미널 (이 지시서를 실행하는 너)
> - 완료 보고: `{디바이스}/막내N → iMac/쌍아` 형식

---

## 배경

Mirror 시스템 = iPhone 화면을 iMac 콘솔에 실시간 미러링하는 디버깅 도구.
현재 온디맨드 아키텍처(P2P 연결/해제) 기본 동작은 확인됨.

**문제**: 런처에서 iframe으로 페이지를 감싸는 방식 시도 → 실패.
- iframe 안의 mirror_client.js는 iframe DOM만 캡쳐
- 폰의 실제 화면(사용자가 조작하는 페이지)을 캡쳐해야 의미가 있음
- iframe 밖으로 나가면 미러링 끊김

**해결**: 전체 페이지 이동 + 서버 자동 삽입 + 뱃지 컨트롤 강화

---

## 수정 대상 파일 (3개)

```
apps/monk-cam/demo/
├── signaling_server.js   ← 수정 1: 외부 앱 서빙 + HTML 자동 삽입
├── mirror_client.js      ← 수정 2: 뱃지를 컨트롤 패널로 강화
└── mirror_launcher.html  ← 수정 3: iframe 걷어내고 퀵링크 목록 복원
```

---

## 수정 1: signaling_server.js

### 1-A. 외부 앱 디렉토리 서빙

`/photolab/*` 경로로 요청이 오면 `MONK_kr/ai_lab/photolab/` 파일을 서빙한다.

```js
import { join, dirname, extname } from 'path';

// 기존 __dirname 아래에 추가
const SERVE_ROOTS = {
    '/photolab': join(__dirname, '../../../MONK_kr/ai_lab/photolab'),
};
```

라우팅 로직 수정:

```js
const httpsServer = createServer(sslOptions, (req, res) => {
    const urlPath = req.url.split('?')[0];

    // 별칭 라우트
    let filePath;
    if (urlPath === '/') {
        filePath = join(__dirname, '/receiver.html');
    } else if (urlPath === '/mirror') {
        filePath = join(__dirname, '/mirror_launcher.html');
    } else {
        // SERVE_ROOTS 매칭
        let matched = false;
        for (const [prefix, root] of Object.entries(SERVE_ROOTS)) {
            if (urlPath.startsWith(prefix)) {
                const subPath = urlPath.slice(prefix.length) || '/index.html';
                filePath = join(root, subPath);
                matched = true;
                break;
            }
        }
        if (!matched) {
            filePath = join(__dirname, urlPath);
        }
    }

    const ext = extname(filePath);

    try {
        let content = readFileSync(filePath);
        const mime = MIME[ext] || 'application/octet-stream';

        // ★ 핵심: HTML 파일에 mirror_client.js 자동 삽입
        if (ext === '.html') {
            let html = content.toString('utf8');
            // 이미 mirror_client.js 포함된 파일은 스킵
            if (!html.includes('mirror_client.js')) {
                html = html.replace(
                    '</body>',
                    `<script src="/mirror_client.js"></script>\n</body>`
                );
            }
            res.writeHead(200, { 'Content-Type': mime });
            res.end(html);
        } else {
            res.writeHead(200, { 'Content-Type': mime });
            res.end(content);
        }
    } catch {
        res.writeHead(404);
        res.end('Not Found');
    }
});
```

### 1-B. MIME 타입 추가

```js
const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.woff2': 'font/woff2',
    '.ico': 'image/x-icon',
};
```

### 1-C. 시작 로그에 photolab 경로 추가

```
console.log(`iPhone photolab: https://100.97.103.10:${PORT}/photolab`);
```

---

## 수정 2: mirror_client.js — 뱃지 컨트롤 패널

현재 뱃지: `[● MIRROR 대기]` (표시만)
변경: **탭하면 컨트롤 버튼이 펼쳐지는 패널**

### 2-A. 뱃지 HTML 구조

```
[축소] ● (dot만)
[펼침] ● MIRROR | 🔗 | 📷 | 📹 | ↩
```

- `●` 상태 dot (green/yellow/red) — 항상 표시
- `🔗` P2P 연결/끊기 토글
- `📷` 스크린샷 (고화질 캡쳐 → iMac 콘솔 갤러리)
- `📹` 카메라 ON/OFF 토글
- `↩` 런처(`/mirror`)로 돌아가기

### 2-B. createBadge() 교체

```js
function createBadge() {
    const badge = document.createElement('div');
    badge.id = 'monkos-mirror-badge';
    badge.innerHTML = `
        <style>
            #monkos-mirror-badge {
                position: fixed; top: 8px; right: 8px; z-index: 999999;
                background: rgba(0,0,0,0.9); color: #fff;
                font-family: -apple-system, sans-serif; font-size: 11px;
                padding: 6px 10px; border-radius: 20px;
                user-select: none;
                display: flex; align-items: center; gap: 6px;
                box-shadow: 0 2px 12px rgba(0,0,0,0.5);
                transition: all 0.2s;
                -webkit-tap-highlight-color: transparent;
            }
            .mm-dot {
                width: 8px; height: 8px; border-radius: 50%;
                background: #ef4444; flex-shrink: 0;
            }
            .mm-dot.on { background: #22c55e; }
            .mm-dot.connecting { background: #f59e0b; }
            .mm-text { white-space: nowrap; }
            .mm-controls {
                display: none; align-items: center; gap: 4px;
                margin-left: 4px;
            }
            .mm-controls.open { display: flex; }
            .mm-btn {
                width: 28px; height: 28px; border-radius: 50%;
                border: 1px solid #555; background: #333;
                color: #ccc; font-size: 13px;
                display: flex; align-items: center; justify-content: center;
                cursor: pointer; flex-shrink: 0;
            }
            .mm-btn:active { background: #555; }
            .mm-btn.active { background: #22c55e; color: #000; border-color: #22c55e; }
        </style>
        <span class="mm-dot" id="mm-dot"></span>
        <span class="mm-text" id="mm-text">MIRROR</span>
        <div class="mm-controls" id="mm-controls">
            <button class="mm-btn" id="mm-p2p" title="P2P 연결/끊기">🔗</button>
            <button class="mm-btn" id="mm-shot" title="스크린샷">📷</button>
            <button class="mm-btn" id="mm-cam" title="카메라">📹</button>
            <button class="mm-btn" id="mm-back" title="런처로">↩</button>
        </div>
    `;

    document.body.appendChild(badge);

    // 뱃지 탭 → 컨트롤 토글
    let expanded = false;
    badge.addEventListener('click', (e) => {
        if (e.target.closest('.mm-btn')) return; // 버튼 클릭은 무시
        expanded = !expanded;
        document.getElementById('mm-controls').className =
            expanded ? 'mm-controls open' : 'mm-controls';
    });

    // P2P 토글
    document.getElementById('mm-p2p').addEventListener('click', () => {
        if (dc && dc.readyState === 'open') {
            cleanupAll();
            setBadgeStatus('off', 'MIRROR 끊김');
        } else {
            cleanupAll();
            connectSignaling();
        }
    });

    // 스크린샷
    document.getElementById('mm-shot').addEventListener('click', () => {
        captureAndSend(true);
    });

    // 카메라 토글
    document.getElementById('mm-cam').addEventListener('click', () => {
        if (localStream) {
            stopCamera();
        } else {
            startCamera();
        }
    });

    // 런처로 돌아가기
    document.getElementById('mm-back').addEventListener('click', () => {
        window.location.href = '/mirror';
    });

    return badge;
}
```

### 2-C. P2P 연결 상태에 따른 버튼 스타일

`setBadgeStatus()` 에서 P2P 버튼 active 클래스 토글:

```js
function setBadgeStatus(state, text) {
    const dot = document.getElementById('mm-dot');
    const txt = document.getElementById('mm-text');
    const p2pBtn = document.getElementById('mm-p2p');
    const camBtn = document.getElementById('mm-cam');

    if (dot) {
        dot.className = 'mm-dot' + (state === 'on' ? ' on' : state === 'connecting' ? ' connecting' : '');
    }
    if (txt) txt.textContent = text;

    // P2P 버튼 상태
    if (p2pBtn) {
        p2pBtn.className = (dc && dc.readyState === 'open') ? 'mm-btn active' : 'mm-btn';
    }
    // 카메라 버튼 상태
    if (camBtn) {
        camBtn.className = localStream ? 'mm-btn active' : 'mm-btn';
    }

    reportStatusToParent();
}
```

### 2-D. postMessage API 유지

이전에 추가한 postMessage listener (`__mm` 명령)와 `reportStatusToParent()`는 **그대로 유지**.
iframe 모드에서도, 독립 페이지에서도 둘 다 동작하도록.

`isInIframe` 분기는 유지:
- iframe: 뱃지 생성 안 함 (부모 런처가 컨트롤)
- 독립 페이지: 뱃지 생성 + 컨트롤 패널 제공

---

## 수정 3: mirror_launcher.html — 퀵링크 목록 복원

iframe 전면 걷어내고, **페이지 이동(a href) 방식의 퀵링크 목록**으로 복원.

### 구조

```html
<h1>MONKOS Mirror</h1>
<p class="subtitle">모바일 디버깅 미러</p>

<!-- 연결 상태 -->
<div id="status-card">
    <div class="status-row">
        <span class="dot" id="ws-dot"></span>
        <span id="ws-text">시그널링 서버 확인 중...</span>
    </div>
    <div class="status-row">
        <span class="dot" id="console-dot"></span>
        <span id="console-text">PC 콘솔 대기</span>
    </div>
</div>

<!-- 퀵 링크 -->
<div class="card">
    <div class="card-title">테스트 대상 선택</div>
    <a class="btn btn-green" href="/mirror_test.html">Mirror 테스트 페이지</a>
    <a class="btn btn-primary" href="/photolab">Photolab (증명사진)</a>
    <a class="btn btn-gray" href="/sender.html">Presentation Sender</a>
</div>

<!-- 수동 URL 입력 -->
<div class="card">
    <div class="card-title">URL 직접 입력</div>
    <div class="card-desc">
        시그널링 서버에서 서빙하는 경로만 자동 미러링 가능.<br>
        외부 URL은 북마클릿 사용.
    </div>
    <div style="display:flex; gap:8px;">
        <input id="url-input" type="text" placeholder="/photolab"
               style="flex:1; height:40px; background:#222; border:1px solid #444;
               border-radius:8px; padding:0 10px; color:#fff; font-size:14px;">
        <button id="btn-go" style="height:40px; padding:0 16px; background:#3b82f6;
                color:#fff; border:none; border-radius:8px; font-weight:600; cursor:pointer;">
            이동
        </button>
    </div>
</div>

<!-- 북마클릿 (외부 URL용) -->
<div class="card">
    <div class="card-title">외부 URL용 북마클릿</div>
    <div class="bookmarklet-area">
        <a class="bookmarklet-link" id="bookmarklet-link" href="#">MONKOS Mirror</a>
    </div>
</div>
```

### 스크립트

```js
// URL 이동
document.getElementById('btn-go').addEventListener('click', () => {
    const url = document.getElementById('url-input').value.trim();
    if (url) window.location.href = url;
});

// 북마클릿 생성
const MIRROR_URL = `https://${location.host}/mirror_client.js`;
document.getElementById('bookmarklet-link').href =
    `javascript:void((function(){if(window.__MONKOS_MIRROR__)return;var s=document.createElement('script');s.src='${MIRROR_URL}';document.head.appendChild(s)})())`;

// WS 상태 확인 (기존 로직 유지)
// ...
```

### CSS

이전 mirror_launcher.html 의 카드+버튼 스타일 재활용.
`100dvh` + `env(safe-area-inset-*)` 적용 유지.
iframe 관련 CSS 제거.

---

## 플로우 정리

```
iPhone /mirror (런처)
    │
    ├─ "Photolab" 클릭
    │     ↓ 전체 페이지 이동
    │  /photolab/index.html
    │     ↓ 서버가 mirror_client.js 자동 삽입
    │     ↓ P2P 자동 연결 → iMac 콘솔에 화면 표시
    │     ↓ 뱃지 [●] 탭 → [● MIRROR | 🔗 📷 📹 ↩] 펼침
    │     ↓ 📷 탭 → 고화질 스크린샷 전송
    │     ↓ ↩ 탭 → /mirror 런처로 복귀
    │
    ├─ "URL 직접 입력" → /some/path → 동일 흐름
    │
    └─ "북마클릿" → 외부 URL에서 수동 실행 → 미러링 시작
```

---

## 주의사항

1. **`/mirror_client.js` 자체에는 삽입하지 않음** — `.html` 확장자만 대상
2. **이미 `mirror_client.js` 포함된 HTML은 중복 삽입 스킵** — `html.includes('mirror_client.js')` 체크
3. **뱃지 isInIframe 분기 유지** — iframe 모드(혹시 쓸 때)와 독립 페이지 모드 공존
4. **photolab의 상대 경로** — `/photolab/app.css` 등이 올바르게 resolve되는지 확인
   - `MONK_kr/ai_lab/photolab/index.html` 안에서 `app.css`, `app.js` 등은 상대 경로로 참조
   - `/photolab/` 기준으로 서빙하면 `/photolab/app.css` 로 resolve → OK
5. **photolab API 호출 경로** — `config.js`의 API 엔드포인트가 외부(monkos.ai)를 직접 가리키면 CORS 이슈 없음. CF Workers 프록시 경유하면 해당 경로 확인 필요.

---

## 검증 체크리스트

- [ ] `node signaling_server.js` 재시작
- [ ] iMac Brave: `https://localhost:8443/mirror_console.html` 접속
- [ ] iPhone Chrome: `https://100.97.103.10:8443/mirror` 접속 → 런처 표시
- [ ] "Photolab" 퀵링크 클릭 → 전체 페이지 이동 → photolab 표시
- [ ] 뱃지 `●` 표시 확인 (초록 = 연결됨)
- [ ] 뱃지 탭 → 컨트롤 패널 펼침
- [ ] 📷 탭 → iMac 콘솔에 스크린샷 표시
- [ ] 🔗 탭 → P2P 끊김 → 재탭 → 재연결
- [ ] 📹 탭 → 카메라 ON (PIP) → 재탭 → OFF
- [ ] ↩ 탭 → 런처로 복귀
- [ ] 런처에서 다른 링크 클릭 → 다시 미러링 동작

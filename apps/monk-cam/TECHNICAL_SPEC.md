# MONKOS monk-cam 기술명세서

**최종 갱신:** 2026-02-18
**상태:** 프로토타입 (apps/ — 실험/PoC)
**위치:** `apps/monk-cam/demo/`

---

## 1. 개요

monk-cam은 **WebRTC 기반 실시간 영상/화면 전송 도구**로, 3개의 독립된 서브시스템으로 구성된다.

| 서브시스템 | 용도 | 전송 방식 | 핵심 기술 |
|-----------|------|----------|----------|
| **Cam Pipe** | iPhone → iMac 실시간 영상 스트리밍 | WebRTC MediaStream | P2P 비디오 트랙 |
| **Presentation Assistant** | 발표/면접 실시간 AI 코칭 | WebRTC + Gemini Live API | 프레임 캡처 → AI 분석 |
| **Mirror** | 모바일 화면 → PC 실시간 미러링 | WebRTC DataChannel | html2canvas DOM 캡처 |

---

## 2. 아키텍처

### 2.1 공통 인프라

```
[iPhone/모바일]                [iMac/PC]
     │                              │
     └──── WSS (8443) ──────────────┘
              │
    ┌─────────┴─────────┐
    │ signaling_server.js │  ← HTTPS + WSS 통합 서버
    │   - 정적 파일 서빙   │
    │   - WebSocket 시그널링│
    │   - 역할 페어링       │
    └─────────────────────┘
```

**signaling_server.js** (123줄)
- Node.js ES Module (`ws` + `https`)
- 포트: 8443 (HTTPS + WSS 통합)
- 자체서명 SSL 인증서 (`cert.pem` / `key.pem`)
  - CN=localhost, SAN: DNS:localhost, IP:127.0.0.1, IP:100.97.103.10
- 역할 기반 페어링 (ROLE_PAIRS Map):
  - `sender` ↔ `receiver` (Cam Pipe / Presentation)
  - `mirror-sender` ↔ `mirror-receiver` (Mirror)
- 양방향 `peer-joined` 알림 (등록 시 쌍방 통지)
- `peer-left` 알림 (연결 해제 시 상대에게 통지)
- URL 라우팅: `/` → receiver.html, `/mirror` → mirror_launcher.html
- 쿼리스트링 자동 제거 (캐시버스팅 대응)

### 2.2 네트워크 토폴로지

```
Tailscale VPN (100.x.x.x)
├── iMac: 100.97.103.10
├── iPhone: 100.115.57.53
├── Mac mini: 100.76.80.99
└── 4060 GPU: 100.118.31.62

STUN: stun.l.google.com:19302 (NAT 트래버설)
전송: P2P 직결 (Tailscale 환경에서 100% host candidate)
```

---

## 3. 서브시스템 상세

### 3.1 Cam Pipe (WebRTC MediaStream)

**목적:** iPhone 카메라 영상을 iMac에서 실시간으로 수신·모니터링

| 파일 | 역할 | 줄 수 |
|------|------|-------|
| `sender.html` | iPhone 송신 (카메라 → WebRTC 비디오 트랙) | 250 |
| `receiver.html` | iMac 수신 (비디오 재생 + 통계 오버레이) | 305 |

**데이터 흐름:**
```
iPhone                              iMac
[카메라] → getUserMedia             [video 태그]
    ↓                                   ↑
addTrack(videoTrack)               ontrack → srcObject
    ↓                                   ↑
createOffer ──WSS──→ setRemoteDesc → createAnswer ──WSS──→ setRemoteDesc
    ↓                                   ↑
ICE candidates ←────── 교환 ──────→ ICE candidates
    ↓                                   ↑
    └──── P2P 직결 (STUN) ─────────────┘
```

**수신 화면 통계:**
- 해상도, FPS, 비트레이트 (kbps), RTT (ms)
- 패킷 손실률 (%), 코덱 (VP8/H264), 전송 방식 (P2P 직결/STUN/TURN)
- 경과 시간, 색상 경고 (RTT >100ms 노란, >200ms 빨간)

**성능 (Tailscale P2P 직결 실측):**
- RTT: 7ms
- 전송: P2P 직결 (host candidate)

### 3.2 Presentation Assistant (Gemini Live API)

**목적:** 발표/면접 중 AI가 실시간으로 화면을 분석하고 코칭 메시지를 오버레이로 표시

| 파일 | 역할 | 줄 수 |
|------|------|-------|
| `presenter_sender.html` | iPhone 송신 + AI 코칭 오버레이 수신 | 266 |
| `presenter_receiver.html` | iMac 수신 + 프레임 캡처 → Gemini 전송 | 300 |
| `presentation_server.js` | 시그널링 + Gemini Live API 세션 관리 | 212 |

**데이터 흐름:**
```
iPhone                    iMac (수신 화면)              Gemini Live API
[카메라] → P2P 비디오 →  [video 재생]                     │
                          [캔버스 캡처] → JPEG(768×768)     │
                              ↓ (1초마다, 장면변화 감지)     │
                          WS binary 전송 ─────────→ sendRealtimeInput
                              │                         ↓
                              │                    [AI 분석]
                              │                         ↓
                          ai-coaching 수신 ←──── onmessage (텍스트)
                              ↓                         │
                          AI 오버레이 표시               │
                              ↓ (WSS broadcast)         │
iPhone: coaching-overlay ←───┘
```

**Gemini Live API 연동:**
- 모델: `gemini-2.0-flash-live-preview-04-09` (Vertex AI ADC)
- SDK: `@google/genai` — `ai.live.connect()`
- 프레임 전송: `sendRealtimeInput({ media: { data: base64, mimeType: 'image/jpeg' } })`
- 응답 트리거: 5프레임마다 `sendClientContent({ turnComplete: true })`
- 응답 형태: 토큰 스트리밍 → `serverContent.modelTurn.parts[].text` 조합
- 시스템 프롬프트: 발표 보조, 한국어, 2-3문장 이내

**장면변화 감지:**
- 10% 픽셀 샘플링 (step=40), 3% 변화 임계값
- 변화 없으면 프레임 전송 스킵 → API 비용 절감

**AI 코칭 오버레이 (presenter_sender.html):**
- 하단 반투명 패널 (rgba, border-radius)
- 10초 자동 소멸
- 양쪽(sender + receiver) 동시 표시 (broadcast)

### 3.3 Mirror (WebRTC DataChannel + html2canvas)

**목적:** 모바일 브라우저 화면을 PC에서 실시간으로 확인 (원격 디버깅/QA용)

| 파일 | 역할 | 줄 수 |
|------|------|-------|
| `mirror_client.js` | 주입형 캡처 클라이언트 (IIFE) | 458 |
| `mirror_console.html` | PC 콘솔 (수신 + 제어판) | 610 |
| `mirror_launcher.html` | iPhone 런처 (PWA + 북마클릿) | 238 |
| `mirror_test.html` | 테스트 페이지 (mirror_client.js 프리주입) | 118 |
| `mirror_start.sh` | 원터치 서버 기동 스크립트 | 33 |
| `manifest.json` | PWA 매니페스트 | 12 |

**아키텍처 — 온디맨드 모델 (2026-02-18 확정):**
```
[모바일 브라우저]                        [iMac 콘솔]
                                         │
mirror_client.js 주입                    mirror_console.html
  ↓                                      │
html2canvas → DOM 캡처                   │
  ↓                                      │
JPEG dataURL → 청크 분할(60KB)           │
  ↓                                      │
DataChannel.send() ──P2P──→ DC.onmessage │
                                         ↓
                                    img.src = dataURL
                                    (모바일 비율 9:19.5 프레임)
                                         │
                              ┌──────────┤
                              ↓          ↓
                         통계 표시    스크린샷 갤러리
                         (FPS, 지연,
                          해상도, 크기)

[제어 역방향:]
콘솔 → DC.send(명령) → mirror_client.js → handleCommand()
명령: cam-on/off/flip, screenshot, set-fps, set-quality, navigate
```

**mirror_client.js 상세:**
- **IIFE 패턴** + `window.__MONKOS_MIRROR__` 중복 방지
- **주입 방법 3가지:**
  1. `<script src="...mirror_client.js">` 태그 직접 삽입
  2. 북마클릿 (mirror_launcher.html에서 생성)
  3. mirror_test.html (프리주입 테스트 페이지)
- **html2canvas** CDN 동적 로드 (1.4.1)
- **Floating Badge UI:** 상태 표시 (on/connecting/off), 더블탭 최소화
- **FPS 제어:** 0 = 멈춤 (원샷만), 0.5~5fps 범위
- **품질 제어:** 0.3~0.95 (JPEG quality)
- **청크 분할:** 60KB 단위 → DataChannel 메시지 크기 제한 대응
- **카메라 제어:** getUserMedia (전면/후면), PIP 오버레이

**온디맨드 연결 라이프사이클:**
```
[초기화] → connectSignaling() → WS 등록 (mirror-sender)
                                    ↓
                              peer-joined → startPeerConnection()
                                    ↓
                              P2P 연결 → DC 열림 → 캡처 대기 (fps=0)
                                    ↓
                              FPS 설정 시 → startCapture()

[백그라운드] → visibilitychange (hidden) → cleanupAll() (WS+P2P+캡처 전해제)
[포그라운드] → visibilitychange (visible) → 클린 스타트 (재연결)
[끊김] → WS close: 재연결 안 함 (포그라운드 복귀 시 자동)
         P2P failed/disconnected: 정리만 (auto-retry 없음)
```

**mirror_console.html 상세:**
- **모바일 프레임:** 9:19.5 비율 (iPhone 비율), 동적 리사이즈
- **사이드 패널:** 카메라 ON/OFF/전환, 스크린샷, FPS 선택 (멈춤/0.5/1/2/3), 품질 (낮음/중간/높음)
- **통계:** 수신 FPS, 지연(ms), 해상도, 프레임 크기(KB), 총 수신
- **스크린샷 갤러리:** 3열 그리드, 클릭 다운로드
- **ICE candidate 버퍼링:** remoteDescription 설정 전 도착한 candidate 보류 → 설정 후 일괄 처리
- **WS 항시 유지:** 콘솔(iMac)은 항상 연결, 클라이언트 끊김 시 대기 UI 복원
- **중복연결 가드:** `if (ws && ws.readyState <= 1) return`
- **visibilitychange 즉시 재연결:** Safari 백그라운드 suspension 대응

**PWA (mirror_launcher.html):**
- `manifest.json`: standalone 모드, 테마 #3b82f6
- 아이콘: 192px / 512px (Python Pillow 생성)
- apple-mobile-web-app-capable: yes
- 북마클릿 자동 생성 (`javascript:void(...)`)

---

## 4. 파일 맵

```
apps/monk-cam/demo/
│
├── signaling_server.js      ← 통합 시그널링 서버 (HTTPS+WSS, 8443)
│
├── [Cam Pipe]
│   ├── index.html            ← CamCapture 모듈 데모 (독립)
│   ├── sender.html           ← iPhone 영상 송신
│   └── receiver.html         ← iMac 영상 수신 + 통계
│
├── [Presentation Assistant]
│   ├── presentation_server.js ← 전용 서버 (시그널링 + Gemini Live)
│   ├── presenter_sender.html  ← iPhone 송신 + AI 코칭 오버레이
│   └── presenter_receiver.html← iMac 수신 + 프레임 캡처 → Gemini
│
├── [Mirror]
│   ├── mirror_client.js      ← 주입형 캡처 클라이언트 (IIFE)
│   ├── mirror_console.html   ← PC 콘솔 (수신 + 제어)
│   ├── mirror_launcher.html  ← iPhone 런처 (PWA)
│   ├── mirror_test.html      ← 테스트 페이지
│   ├── mirror_start.sh       ← 원터치 서버 기동
│   ├── manifest.json         ← PWA 매니페스트
│   ├── mirror_icon_192.png   ← 앱 아이콘 192px
│   └── mirror_icon_512.png   ← 앱 아이콘 512px
│
├── [인증서]
│   ├── cert.pem              ← SSL 인증서 (localhost + Tailscale IP)
│   ├── key.pem               ← SSL 비밀키
│   ├── cert_old.pem          ← 이전 인증서 (CN=monkos-cam)
│   └── key_old.pem           ← 이전 비밀키
│
└── .gitignore                ← node_modules 제외
```

---

## 5. 실행 방법

### 5.1 시그널링 서버 (Cam Pipe + Mirror 공용)

```bash
cd apps/monk-cam/demo
node signaling_server.js
# → https://0.0.0.0:8443
```

### 5.2 Presentation Assistant (전용 서버)

```bash
cd apps/monk-cam/demo
node presentation_server.js
# → Gemini Live 세션 자동 연결
# ※ Vertex AI ADC 인증 필요 (gcloud auth application-default login)
```

### 5.3 Mirror 원터치

```bash
bash apps/monk-cam/demo/mirror_start.sh
# → 서버 기동 + 콘솔 자동 열기
```

### 5.4 접속 URL

| 용도 | URL |
|------|-----|
| Cam 수신 (iMac) | https://localhost:8443/ |
| Cam 송신 (iPhone) | https://100.97.103.10:8443/sender.html |
| Mirror 콘솔 (iMac) | https://localhost:8443/mirror_console.html |
| Mirror 런처 (iPhone) | https://100.97.103.10:8443/mirror |
| Mirror 테스트 (iPhone) | https://100.97.103.10:8443/mirror_test.html |
| Presentation 수신 | https://localhost:8443/presenter_receiver.html |
| Presentation 송신 | https://100.97.103.10:8443/presenter_sender.html |

---

## 6. 의존성

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `ws` | ^8.x | WebSocket 서버 |
| `@google/genai` | ^1.x | Gemini Live API (Presentation만) |
| html2canvas | 1.4.1 (CDN) | DOM 캡처 (Mirror 클라이언트, 런타임 로드) |

---

## 7. 브라우저 호환성

| 브라우저 | Cam Pipe | Mirror Client | Mirror Console |
|---------|----------|---------------|----------------|
| **Chrome/Brave (iMac)** | ✅ 수신 | — | ✅ 권장 (WS 백그라운드 유지) |
| **Safari (iMac)** | ✅ 수신 | — | ⚠️ 백그라운드 시 WS suspension |
| **Chrome (iPhone)** | ✅ 송신 | ✅ 테스트 완료 | — |
| **Safari (iPhone)** | ✅ 송신 | ✅ 지원 | — |

**주의사항:**
- Safari는 백그라운드 탭의 WebSocket을 강제 중단 (code=1001, suspension)
  - 대응: visibilitychange로 포그라운드 복귀 시 즉시 재연결
- 자체서명 인증서: 최초 접속 시 "고급 → 계속" 수동 수락 필요
- iOS Safari getDisplayMedia 미지원 → html2canvas로 DOM 캡처 우회

---

## 8. 개발 이력

| 날짜 | 커밋 | 내용 |
|------|------|------|
| 2026-02-07 | `d23466c` | monk-cam 컴포넌트 모듈 복원 |
| 2026-02-08 | `0d1bca0` | WebRTC P2P 캠 파이프라인 테스트 성공 (RTT 7ms) |
| 2026-02-08 | `6a5d201` | Presentation Assistant E2E 성공 (Gemini Live) |
| 2026-02-18 | `32c3f5f` | Mirror MVP (html2canvas + DataChannel) |
| 2026-02-18 | `db32df4` | Mirror 안정화 (peer-joined, 자동재연결, 런처) |
| 2026-02-18 | `bba9d7b` | FPS 0 멈춤 모드 |
| 2026-02-18 | `dee010f` | PWA (홈 화면 앱) |
| 2026-02-18 | `c7ad49a` | 재연결 병목 해소 (peer-left, ICE 버퍼링) |
| 2026-02-18 | `58fc090` | 재연결 타이머 1초 단축 |
| 2026-02-18 | `c42a940` | 온디맨드 아키텍처 전환 |
| 2026-02-18 | `37027b9` | 안정화 (쿼리스트링, 중복연결 가드, Safari 대응) |

---

## 9. 알려진 제약 / TODO

### 제약
- html2canvas는 CSS 일부 미지원 (그라디언트, 그림자 등 누락 가능)
- DataChannel 전송은 비디오 스트리밍 대비 프레임레이트/품질 제한적 (max 5fps)
- iOS Safari에서 getDisplayMedia 불가 → DOM 캡처만 가능 (네이티브 화면 캡처 불가)
- 자체서명 인증서로 인해 최초 접속 시 수동 수락 필요

### TODO
- [ ] Cam Pipe sender/receiver에 온디맨드 모델 적용 (현재 3초 자동 재연결)
- [ ] Presentation server 쿼리스트링 파싱 추가
- [ ] Mirror에 오디오 캡처 추가 (WebRTC AudioTrack)
- [ ] mkcert 도입 (자체서명 인증서 수동 수락 제거)
- [ ] cert_old.pem / key_old.pem 정리 (불필요 파일)

# 지시서: 모바일 스크린 캡쳐 MVP — 연결 우선

```
[2026-02-18 09:18 KST] iMac/쌍아 → 막내2
```

## 역할 선언

> **너는 "막내 2호"다. 쌍아가 아니다.**
> - 완료 보고: `{디바이스}/막내2 → iMac/쌍아` 형식

## 작전 개요

| 항목 | 내용 |
|------|------|
| **작전명** | Mobile Screen Mirror MVP — 연결 우선 |
| **작업 경로** | `apps/monk-cam/demo/` |
| **참조 파일** | `signaling_server.js` (mirror 역할 추가 완료), `sender.html`, `receiver.html` |
| **신규 파일** | `mirror_client.js`, `mirror_console.html` (2개) |
| **브랜치** | `develop` |
| **목적** | 1) 모바일 앱 원격 테스트 도구 2) 라이브 프레젠테이션 모바일 화면 송출 기반 |

## 0원칙

> **MONK_kr/, monkos_AI/ 수정 금지.**
> **기존 sender.html, receiver.html 수정 금지.**
> **signaling_server.js는 이미 mirror 역할이 추가됨 — 추가 수정 최소화.**

---

## 배경 + 비전

### 현재 문제
모바일 앱(photolab 등) 테스트 시 폰에서 직접 캡쳐 → 공유해야 함. 비효율적.

### MVP 목표
**폰에서 스크린샷을 찍어서 iMac 브라우저에 표시되는 것**이 목표.

### 확장 로드맵 (MVP 이후)
```
[Phase 1] 스크린 캡쳐 전송 (이번 작업) ← NOW
    ↓
[Phase 2] 실시간 스트리밍 (FPS 조절, 녹화 버튼, 이미지 크기 옵션)
    ↓
[Phase 3] 에이전틱 비전 (캡쳐 이미지 → AI 분석 → 실시간 스크립트 생성)
    ↓
[Phase 4] 라이브 프레젠테이션 (OBS 연동, 모바일 화면 송출)
```

**Phase 1만 구현. 나머지는 하지 마라.**

---

## 아키텍처

```
[iPhone Safari]                              [iMac Chrome]
테스트 대상 페이지                             mirror_console.html
+ mirror_client.js 주입
┌─────────────────────┐                     ┌─────────────────────────┐
│                      │                    │ 📱 Mobile Mirror        │
│ html2canvas로        │  WebRTC            │                          │
│ DOM 주기적 캡쳐(5초) │──DataChannel──→    │ [폰 화면 이미지 표시]     │
│                      │                    │                          │
│ 명령 수신:            │  ←──DataChannel──  │ [📸 즉시 캡쳐] [💾 저장]  │
│ request-capture      │                    │                          │
│                      │                    │ 수신 시각 | 해상도        │
│ floating badge:      │                    │                          │
│ 🔴 MIRROR            │                    │                          │
└─────────────────────┘                     └─────────────────────────┘
         │                                            │
         └──────── signaling_server.js ───────────────┘
                   (기존 WSS 시그널링, mirror 역할 추가됨)
```

---

## 핵심 기술 결정

| 항목 | 결정 | 이유 |
|------|------|------|
| 화면 캡쳐 | `html2canvas` | iOS Safari에서 `getDisplayMedia()` 미지원 |
| 전송 | WebRTC DataChannel | 기존 P2P 인프라 재사용, 낮은 레이턴시 |
| 이미지 포맷 | JPEG quality 0.7 | 대역폭 절약, 256KB 이하 목표 |
| 캡쳐 주기 | 5초 (MVP) | Phase 2에서 FPS 조절 추가 |
| 시그널링 | 기존 signaling_server.js | mirror-sender ↔ mirror-receiver 페어링 완료 |

---

## 파일 1: `mirror_client.js` (폰 주입용)

테스트 대상 페이지에 `<script>` 한 줄로 주입:
```html
<script src="https://{TAILSCALE_IP}:8443/mirror_client.js"></script>
```

### 동작

1. html2canvas CDN 동적 로드: `https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js`
2. 시그널링 서버에 WebSocket 연결 → `role: 'mirror-sender'` 등록
3. peer-joined 수신 시 → WebRTC PeerConnection 생성
4. mirror-receiver(콘솔)의 offer 수신 → answer 생성 + DataChannel 수신 대기
5. DataChannel open 시 → 첫 캡쳐 실행 + 5초 간격 자동 캡쳐 시작
6. 화면 우상단에 floating badge 표시: `🔴 MIRROR` (연결 상태)
7. badge 클릭 시 즉시 캡쳐 1회 전송

### DataChannel 메시지 포맷

```js
// 캡쳐 전송 (sender → receiver)
{ type: 'capture', data: 'data:image/jpeg;base64,...', ts: Date.now(), w: 375, h: 812 }

// 즉시 캡쳐 요청 (receiver → sender)
{ type: 'request-capture' }
```

### 주의사항

- DataChannel 메시지 크기 제한: JPEG quality 0.7, canvas 크기 `window.innerWidth * 0.5`로 축소하여 256KB 이하 유지
- 크기 초과 시 quality를 0.5 → 0.3까지 자동 감소
- 시그널링 서버 주소: `wss://${location.hostname}:8443` (Tailscale IP 기준)
  - **하드코딩 금지**: 스크립트 로드 URL에서 host 추출
- html2canvas 로드 실패 시 badge에 에러 표시, 나머지 페이지 동작에 영향 없어야 함

---

## 파일 2: `mirror_console.html` (iMac 브라우저)

### 동작

1. 시그널링 서버 연결 → `role: 'mirror-receiver'` 등록
2. peer-joined 또는 페이지 로드 시 → WebRTC PeerConnection 생성 + offer 전송
3. DataChannel (`mirror`) 생성
4. DataChannel 메시지 수신 → `<img>` 태그에 JPEG 표시

### UI 레이아웃

```
┌──────────────────────────────────┐
│ 📱 Mobile Mirror     ● 연결됨    │
├──────────────────────────────────┤
│                                  │
│     [폰 화면 이미지]              │
│     (모바일 비율 유지: 9:19.5)    │
│     max-height: 80vh             │
│                                  │
├──────────────────────────────────┤
│ 마지막: 09:18:32 | 375×812       │
│ [📸 즉시 캡쳐] [💾 저장]          │
└──────────────────────────────────┘
```

### 버튼 동작

- `📸 즉시 캡쳐`: DataChannel로 `{ type: 'request-capture' }` 전송
- `💾 저장`: 현재 표시 중인 이미지를 `<a download="mirror_YYYYMMDD_HHmmss.jpg">` 로컬 저장
- 스타일: 기존 receiver.html 참조 (다크 테마, #111 배경)

---

## signaling_server.js 상태

이미 아래 수정 완료됨 (추가 수정 불필요):
- `ROLE_PAIRS`에 `mirror-sender` ↔ `mirror-receiver` 추가
- 접속 안내에 미러링 URL 표시

---

## WebRTC 연결 흐름

```
[mirror_console.html]              [signaling_server]              [mirror_client.js]
        │                                │                                │
        ├── register(mirror-receiver) ──→│                                │
        │                                │←── register(mirror-sender) ───┤
        │←── peer-joined ───────────────│                                │
        │                                │                                │
        ├── offer ──────────────────────→│──────────────────── offer ───→│
        │                                │←──────────────── answer ──────┤
        │←── answer ────────────────────│                                │
        │                                │                                │
        │←─────── DataChannel: capture ─────────────────────────────────┤
        │──────── DataChannel: request-capture ────────────────────────→│
        │←─────── DataChannel: capture ─────────────────────────────────┤
```

---

## 테스트 순서

```bash
# 1. 시그널링 서버 시작 (iMac 터미널)
cd apps/monk-cam/demo && node signaling_server.js

# 2. iMac 브라우저에서 콘솔 열기
https://localhost:8443/mirror_console.html

# 3. iPhone Safari에서 먼저 자체서명 인증서 수락
https://100.97.103.10:8443/
# → "고급 → 계속" 클릭 (이후 mirror_client.js 로드 가능)

# 4. photolab에 mirror_client.js 주입 (임시)
# MONK_kr/ai_lab/photolab/index.html 맨 아래 </body> 직전에:
# <script src="https://100.97.103.10:8443/mirror_client.js"></script>
# → develop에서만 테스트, 프로덕션 push 전 반드시 제거

# 5. iPhone에서 photolab 접속
https://monk.kr/ai_lab/photolab/
# → 우상단 🔴 MIRROR badge 확인
# → iMac 콘솔에 폰 화면 표시 확인
```

---

## 완료 기준

- [ ] `mirror_client.js` — html2canvas 로드 + 캡쳐 + DataChannel 전송 동작
- [ ] `mirror_console.html` — 폰 캡쳐 이미지 실시간 표시
- [ ] 5초 간격 자동 캡쳐 동작
- [ ] 즉시 캡쳐 요청/응답 동작
- [ ] 💾 저장 버튼으로 로컬 다운로드
- [ ] floating badge 표시 (연결 상태)
- [ ] 기존 sender/receiver 기능 영향 없음

## 커밋

```bash
git add apps/monk-cam/demo/mirror_client.js apps/monk-cam/demo/mirror_console.html
git commit -m "[feature] 모바일 스크린 캡쳐 MVP — mirror_client.js + mirror_console.html"
git push origin develop
```

## 완료 보고

2규칙 형식. 연결 테스트 결과 포함.

---

*[2026-02-18 09:18 KST] iMac/쌍아 → 막내2*

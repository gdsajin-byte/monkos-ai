---
type: REPORT
from: iMac/막내1
to: iMac/쌍아 → 작가님
date: 2026-04-03
subject: 라이브 PT 앱 리서치 A — 기존 프로토타입 파악 + iPhone 리모컨 연동
ref_order: monkos-ops/ops/orders/2026-04/ORDER_20260403_iMac쌍아_막내1_라이브PT_리서치A.md
ref_proposal: monkos-ops/ops/proposals/PROPOSAL_20260403_라이브PT앱_디딤돌대면평가.md
status: 완료
---

# 리서치 A 보고서: 기존 프로토타입 파악 + iPhone 리모컨 연동

**[2026-04-03 12:38 KST] iMac/막내1 → iMac/쌍아**

---

## 리서치 1: 기존 프로토타입 파악

### 1-1. 코드 전체 리딩 결과

#### 파일 구조

```
apps/monk-cam/demo/
├── presentation_server.js   ← HTTPS+WSS+Gemini Live 브릿지 (핵심)
├── presenter_sender.html     ← iPhone 송신 (카메라+AI코칭 오버레이)
├── presenter_receiver.html   ← iMac 수신 (프레임 캡처+씬 디텍션)
├── signaling_server.js       ← 기본 시그널링 서버 (Gemini 없는 버전)
├── sender.html / receiver.html ← 기본 WebRTC 송수신 (비 PT용)
├── mirror_*.js/.html         ← 미러링 시스템 (PT와 무관)
├── package.json              ← 의존성: ws@^8.19.0만
├── key.pem / cert.pem        ← 자체서명 SSL 인증서
└── .gitignore
```

#### 아키텍처 요약

**기술 스택:**
- **서버**: Node.js (ESM) + `ws` 라이브러리 + `@google/genai` SDK
- **프로토콜**: HTTPS(8443) + WSS(동일 포트) + WebRTC(P2P)
- **AI**: Gemini Live API (`gemini-2.0-flash-live-preview-04-09`, Vertex AI, us-central1)
- **인증**: Vertex AI ADC (Application Default Credentials)
- **SSL**: 자체서명 인증서 (LAN 전용)

**데이터 흐름:**

```
iPhone (presenter_sender.html)
  │ getUserMedia (1280×720, 후면카메라)
  │ WebRTC P2P (STUN: stun.l.google.com)
  ▼
iMac (presenter_receiver.html)
  │ 영상 수신 → Canvas 캡처 (768×768 JPEG, 1fps)
  │ 장면변화 감지 (3% threshold, 10% 샘플링)
  │ 바이너리 WebSocket 전송
  ▼
presentation_server.js (WSS)
  │ JPEG → Base64 → geminiSession.sendRealtimeInput()
  │ 5프레임마다 turnComplete 전송 → 응답 트리거
  ▼
Gemini Live API
  │ 텍스트 응답 (한국어, 2-3문장)
  ▼
서버 → broadcastCoaching()
  │ JSON { type: 'ai-coaching', text, timestamp }
  ├→ iPhone 오버레이 (하단, 10초 표시)
  └→ iMac 오버레이 (하단, 지속 표시)
```

#### WebRTC/WSS 연결 구조

```
┌─────────────┐          ┌─────────────────────┐          ┌────────────┐
│   iPhone    │◄─── P2P ──►│ presentation_server │          │   Gemini   │
│  (sender)   │          │    (HTTPS+WSS)      │◄── WS ──►│  Live API  │
│             │◄── WS ──►│   :8443             │          │            │
└─────────────┘          └─────────────────────┘          └────────────┘
                                  ▲
                                  │ WS
                          ┌───────┴──────┐
                          │    iMac      │
                          │  (receiver)  │
                          └──────────────┘

시그널링 흐름:
1. sender → { type: 'register', role: 'sender' }
2. receiver → { type: 'register', role: 'receiver' }
3. sender → { type: 'offer', sdp: ... }  →  서버 → receiver
4. receiver → { type: 'answer', sdp: ... } → 서버 → sender
5. 양방향 → { type: 'ice-candidate', candidate: ... }
6. P2P 연결 성립 후 → 비디오 직결
```

#### Gemini Live API 통합 방식

- **SDK**: `@google/genai` (`GoogleGenAI` 클래스)
- **연결**: `ai.live.connect()` — 콜백 기반 (비동기 이터레이터 아님)
- **인증**: Vertex AI ADC (`vertexai: true, project: 'monkos', location: 'us-central1'`)
- **모델**: `gemini-2.0-flash-live-preview-04-09` (Live API 전용 모델만 가능)
- **입력**: `sendRealtimeInput({ media: { data: base64, mimeType: 'image/jpeg' } })`
- **응답 트리거**: `sendClientContent({ turnComplete: true })` — 5프레임(=5초)마다
- **출력**: `callbacks.onmessage` → `msg.serverContent.modelTurn.parts[].text`
- **시스템 프롬프트**: 프레젠테이션 보조 전용 (슬라이드 요약, 질문 가이드, 데이터 강조)
- **응답 모달리티**: TEXT 전용 (`responseModalities: ['TEXT']`)

#### 실측 성능 수치 (2/8 세션 로그 기준)

| 항목 | 수치 |
|------|------|
| 해상도 | 1280×720 HD (송신), 768×768 JPEG (캡처) |
| FPS | 30fps (P2P), 1fps (AI 전송) |
| RTT | 7ms |
| 패킷 손실 | 0% |
| Gemini 응답 | ~5초 (turnComplete 후) |
| JPEG 크기 | ~30-70KB |
| 비용 | $0 (P2P 직결 + Vertex AI 무료 티어) |

### 1-2. photo-coach 구조 파악

```
apps/photo-coach/
├── index.html   ← 3단계 UI (코칭→촬영→생성+QC)
├── server.js    ← Gemini Live + Imagen 3.0 + Gemini QC (파일 없음 — node_modules만 존재)
└── node_modules/
```

**PT 연관도: 낮음**
- photo-coach는 증명사진 촬영 도우미 (Imagen 3.0 i2i + QC)
- WebSocket 프레임 캡처 패턴은 동일하나, 용도가 완전히 다름
- **재활용 가능 요소**: 없음 (PT 앱은 React 신규 구현)

### 1-3. 과거 세션 로그 분석

**2/8 세션 (238~387줄) — 핵심:**
- 13:12~14:00: presentation_server.js + presenter_*.html 구현 (Phase 1)
- 디버깅 8건 (SDK 콜백 방식, 모델명 오류, isBinary 구분 등)
- 14:00: E2E 파이프라인 성공 검증
- 14:03: **현실적 한계 기록** — Gemini가 발표 맥락을 모르면 일반적 코멘트만 함. systemInstruction에 슬라이드 PDF + 발표 스크립트 주입 필요
- 14:18: P2P 안정성 OK (끊김은 개발 환경 아티팩트). Tailscale이 NAT 처리 → TURN 불필요

**2/13, 2/19 세션 — PT 직접 관련 없음:**
- 2/13: 토스 PPT 가이드 언급 (다른 맥락)
- 2/19: 키오스크 퍼널 슬라이드 전환 언급 (photo-coach 관련)

### 1-4. 재활용 vs 신규 구분

| 구분 | 항목 | 판단 | 이유 |
|------|------|------|------|
| **재활용** | WebSocket 메시지 프로토콜 | ✅ | `{ type, role }` 등록 + JSON 텍스트 + 바이너리 구분 패턴이 검증됨 |
| **재활용** | Gemini Live API 연동 코드 | ✅ | `ai.live.connect()` + 콜백 + `sendRealtimeInput` 패턴 그대로 사용 가능 |
| **재활용** | SSL 인증서 | ✅ | Tailscale LAN 내 동일 인증서 재사용 |
| **재활용** | Tailscale P2P 네트워크 | ✅ | NAT 우회 검증 완료, TURN 불필요 |
| **재활용** | 장면변화 감지 알고리즘 | ⚠️ 부분 | 컨셉은 유효하나 PT에서는 슬라이드 전환 시에만 캡처 필요 → 로직 조정 |
| **신규** | React PT 앱 (12슬라이드) | 🆕 | 정적 HTML에서 React 앱으로 완전 신규 |
| **신규** | 슬라이드 네비게이션 | 🆕 | 화살표 키 + 진행 바 + 타이머 |
| **신규** | 인터랙티브 슬라이드 (S10~S11) | 🆕 | 비포/애프터 애니메이션, AX 매핑 |
| **신규** | 라이브 임베드 (S12) | 🆕 | iframe 또는 컴포넌트 포팅 |
| **신규** | iPhone 리모컨 | 🆕 | 슬라이드 제어 + 발표자 노트 (아래 리서치 4 참조) |
| **신규** | 발표 맥락 주입 | 🆕 | systemInstruction에 슬라이드 대본 주입 (2/8 잔여 과제) |
| **불필요** | WebRTC P2P 영상 전송 | ❌ | PT 앱은 카메라 피드가 아님. 슬라이드 제어만 필요 |
| **불필요** | 프레임 캡처 → Gemini 전송 | ❌ | 발표자가 직접 슬라이드를 제어. AI 실시간 코칭은 S12에서만 선택적 사용 |

**핵심 결론**: 기존 프로토타입의 **WebRTC/P2P 영상 파이프라인은 PT 앱에 불필요**. 재활용 가치가 있는 건 **WebSocket 프로토콜 패턴**과 **Gemini Live API 연동 노하우(SDK 사용법, 디버깅 교훈)**. PT 앱 자체는 React 기반 신규 구현이 맞다.

---

## 리서치 4: iPhone 리모컨 연동

### 4-1. 기존 presenter_sender.html의 WebSocket 구조 분석

**현재 프로토콜 (presenter_sender.html:102-265):**

| 메시지 타입 | 방향 | 페이로드 |
|-------------|------|----------|
| `{ type: 'register', role: 'sender' }` | sender→서버 | 역할 등록 |
| `{ type: 'offer', sdp: ... }` | sender→서버→receiver | WebRTC SDP |
| `{ type: 'answer', sdp: ... }` | receiver→서버→sender | WebRTC SDP |
| `{ type: 'ice-candidate', candidate: ... }` | 양방향 | ICE 후보 |
| `{ type: 'peer-joined', role: ... }` | 서버→클라이언트 | 상대 접속 알림 |
| `{ type: 'ai-coaching', text, timestamp }` | 서버→양쪽 | AI 코칭 텍스트 |

**리모컨 기능 추가 시 변경 범위:**

기존 WebRTC/P2P 영상 스트리밍 기능은 리모컨에 **불필요**. 리모컨은 순수 WebSocket 텍스트 통신만 필요:
- 슬라이드 전환 명령 (prev/next)
- 발표자 노트 수신
- 타이머 동기화

→ `presentation_server.js`의 WebSocket 멀티 클라이언트 관리 패턴(clients Map, 역할 등록)은 재활용 가능하나, WebRTC 관련 코드는 전부 불필요.

### 4-2. 리모컨 WebSocket 프로토콜 설계안

```
역할: 'remote' (기존 sender/receiver에 추가)

── iPhone → 서버 → PT 앱 ──

{ type: 'register', role: 'remote' }           // 리모컨 등록

{ type: 'slide-control',
  action: 'next' | 'prev' | 'goto',
  slideIndex?: number }                         // 슬라이드 제어

{ type: 'timer-control',
  action: 'start' | 'pause' | 'reset' }        // 타이머 제어

── 서버 → iPhone (리모컨) ──

{ type: 'slide-state',
  currentSlide: number,
  totalSlides: number,
  note: string,                                 // 발표자 노트 (현재 슬라이드 대본)
  timer: { elapsed: number, remaining: number } // 타이머 상태
}                                               // 슬라이드 상태 동기화

{ type: 'peer-joined', role: 'presenter' }      // PT 앱 접속 알림
```

### 4-3. presenter_sender.html 확장 vs 별도 /remote 라우트 — 장단점 비교

| 기준 | presenter_sender 확장 | /remote 별도 라우트 (권장) |
|------|----------------------|---------------------------|
| **코드 복잡도** | 기존 WebRTC+카메라 코드와 혼재. 리모컨 모드 토글 필요 | 깔끔한 단일 목적 페이지 |
| **UI** | 카메라 뷰어 + 리모컨 UI 공존 → 복잡 | 리모컨 전용 UI (큰 버튼, 노트 영역, 타이머) |
| **의존성** | getUserMedia/WebRTC 불필요한데 포함됨 | WebSocket만 사용. 경량 |
| **테스트** | 기존 기능 깨질 위험 | 독립 테스트 가능 |
| **배포** | 같은 서버에서 서빙 가능 | 같은 서버에서 /remote 경로로 서빙 가능 |
| **재활용** | 향후 확장 어려움 | React 앱에 `/remote` 라우트로 자연스럽게 통합 |

**권장: `/remote` 별도 라우트 신규 구현**

이유:
1. presenter_sender.html은 카메라+WebRTC 전용. 리모컨과 목적이 완전히 다름
2. React PT 앱 내 `/remote` 라우트로 구현하면 슬라이드 상태를 앱 내부에서 직접 관리 가능
3. WebSocket 서버도 React 앱의 dev server 또는 별도 경량 서버로 통합 가능
4. iPhone Safari에서 불필요한 카메라 권한 요청 없음

### 4-4. Tailscale P2P 통신 분석

**iPhone ↔ iMac 간 Tailscale WebSocket 연결 가능 여부: ✅ 확인됨**

근거:
- 2/8 세션에서 `https://100.97.103.10:8443` (Tailscale IP)로 iPhone→iMac 접속 성공 (presentation_server.js:205)
- WebSocket(`wss://`)도 동일 HTTPS 위에서 동작 → 별도 테스트 불필요
- Tailscale은 WireGuard 기반 VPN → 모든 TCP/UDP 트래픽 통과

**현장(TIPA) 네트워크 독립성:**

| 시나리오 | 가능 여부 | 설명 |
|----------|-----------|------|
| TIPA Wi-Fi + Tailscale | ✅ | 양쪽 모두 인터넷 접속 가능하면 Tailscale 자동 연결 |
| TIPA Wi-Fi 차단 + iPhone 핫스팟 | ✅ | iMac이 iPhone 핫스팟에 연결 → Tailscale 경유 |
| 인터넷 완전 차단 | ⚠️ | Tailscale direct connection은 같은 LAN이면 가능 (DERP 릴레이 불필요). 단, 최초 handshake에 인터넷 필요 → **사전 연결 유지 필수** |
| 완전 오프라인 | ❌ | WebSocket 자체가 TCP 기반. 로컬 서버 직접 접속 필요 |

**Tailscale 환경 테스트 필요 사항:**

1. ☐ TIPA 현장에서 Tailscale 연결 안정성 테스트 (Wi-Fi + 핫스팟 양쪽)
2. ☐ iPhone Safari에서 `wss://[Tailscale IP]:포트` 접속 테스트 (자체서명 인증서 경고 처리)
3. ☐ Tailscale direct connection 유지 시간 확인 (세션 중 끊김 여부)
4. ☐ 대체 경로: iPhone과 iMac을 같은 Wi-Fi에 놓고 로컬 IP로 직접 접속 (Tailscale 없이)

---

## 종합 판단

### 기존 자산 활용 전략

| 자산 | 활용 방식 |
|------|----------|
| **WebSocket 프로토콜 패턴** | 역할 등록 + JSON 메시지 구조를 리모컨에 그대로 적용 |
| **Gemini Live API 노하우** | S12 라이브 시연 시 AI 코칭에 활용 가능 (선택사항) |
| **Tailscale 네트워크** | 리모컨 통신 인프라로 확정 |
| **자체서명 SSL** | 개발/테스트용 유지. CF Pages 배포 시 정식 인증서 |

### PT 앱 신규 구현 범위

1. **React PT 앱**: 12슬라이드 (정적 9 + 인터랙티브 2 + 라이브 1)
2. **WebSocket 서버**: 슬라이드 상태 동기화 (리모컨 ↔ PT 앱)
3. **iPhone /remote 페이지**: 리모컨 UI (큰 버튼 + 발표자 노트 + 타이머)
4. **CF Pages 배포**: PT 앱 정적 빌드
5. **오프라인 백업**: HTML export

---

✅ 리서치 1 완료 — 기존 프로토타입 아키텍처 파악, 재활용/신규 구분 완료
✅ 리서치 4 완료 — 리모컨 프로토콜 설계, /remote 별도 라우트 권장, Tailscale 가능 확인
📁 보고서: `monkos-ops/ops/reports/REPORT_20260403_iMac막내1_라이브PT_리서치A.md`
💡 WebRTC P2P 영상 파이프라인은 PT에 불필요. 핵심 재활용 자산은 WS 프로토콜 + Gemini 노하우 + Tailscale
⏳ 리서치 2(React 프레임워크), 리서치 3(라이브 임베드)은 별도 지시서 대기

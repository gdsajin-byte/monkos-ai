# MONKOS Live Presentation System — 기반구조 설계서

> **작성일**: 2026-02-06  
> **작성자**: 철창 (Claude Opus 4.6)  
> **대상**: 막내 (Claude Code) — agent teams 활용 병렬 빌드 권장  
> **우선순위**: 🔴 HIGH — 디딤돌 면접 시연용 프로토타입 (2월 중순 데드라인)

---

## 1. 프로젝트 개요

### 1.1 목적
MONKOS 자체 빌드 라이브 프레젠테이션 시스템. 기존 PPT/Keynote를 대체하는 것이 아니라, **AI 오케스트레이션 + 실시간 디바이스 연동**이 네이티브로 통합된 새로운 형태의 발표 도구.

### 1.2 핵심 차별점
- 슬라이드 안에서 **실시간 디바이스 스트리밍** (아이폰 앱 라이브 시연)
- **AI 음성 명령**으로 프레젠테이션 제어 ("다음 슬라이드", "캠 열어", "분석해줘")
- **웹캠 캡처 → AI 컨텍스트 즉시 삽입** (파일 업로드 없이)
- 순수 웹 기술 기반, OS/생태계 무관, 브라우저만 있으면 동작
- "이거 어디 서비스 쓰신 거예요?" → **"저희 몽코스 자체 빌드입니다"**

### 1.3 1차 시연 시나리오 (디딤돌 면접)
1. 발표자가 monk.kr/present 접속 → 풀스크린 프레젠테이션 시작
2. 음성: "이미지프로 데모 띄워줘" → 사이드에 아이폰 미러링 윈도우 열림
3. 아이폰에서 증명사진 실시간 촬영 → 대형 디스플레이에 라이브로 보임
4. "결과물 분석해줘" → AI가 화질/규격 적합성 코멘트
5. "다음" → 매출 데이터 슬라이드로 전환
6. 면접관: "이거 어디 서비스...?" → "자체 빌드입니다~"

---

## 2. 시스템 아키텍처

### 2.1 전체 구조

```
┌─────────────────────────────────────────────────┐
│                monk.kr (프론트 게이트웨이)          │
├─────────────────────────────────────────────────┤
│                                                   │
│  /present ─── 프레젠테이션 뷰 (맥 브라우저)        │
│      ├── 슬라이드 컨테이너 (16:9 풀스크린)         │
│      ├── 디바이스 스트림 위젯 (9:16 사이드)         │
│      ├── 웹캠 캡처 위젯                            │
│      ├── AI 응답 오버레이                          │
│      └── 음성 명령 리스너                          │
│                                                   │
│  /cam ─────── 카메라 송출 (아이폰 브라우저)         │
│      ├── getUserMedia 카메라 스트림                 │
│      └── WebRTC peer connection (송신)             │
│                                                   │
│  /control ─── 발표자 리모컨 (선택사항)              │
│      └── 터치 기반 슬라이드 제어                    │
│                                                   │
└─────────────────────────────────────────────────┘
         │                        ▲
         │ WebRTC P2P             │ WebSocket (signaling)
         ▼                        │
┌─────────────────────────────────────────────────┐
│            Tailscale Mesh Network                 │
│                                                   │
│  아이폰 (100.x.x.x) ◄──────► 맥 (100.x.x.x)    │
│  5G 테더링으로 독립 네트워크 구성                    │
│  현장 WiFi 의존도 = 0                              │
│                                                   │
└─────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────┐
│            MONKOS Backend (기존 인프라 활용)        │
│                                                   │
│  AI 오케스트레이터                                  │
│  ├── Claude API (텍스트/이미지 분석)                │
│  ├── Gemini API (멀티모달 처리)                     │
│  └── Imagen 4 MaaS (이미지 생성/보정)              │
│                                                   │
└─────────────────────────────────────────────────┘
```

### 2.2 네트워크 구성

```
[발표 현장]

  아이폰 ──── 5G (테더링) ──── 맥북
     │                           │
     └── Tailscale ──────── Tailscale
         100.x.x.1          100.x.x.2
              │                  │
              └── WebRTC P2P ────┘
                  (직통, TURN 불필요)
                       │
                       ▼
              맥북 → HDMI → 대형 디스플레이
```

**핵심**: 현장 WiFi를 쓰지 않음. 5G 테더링 + Tailscale = 휴대용 사설 네트워크.

---

## 3. 모듈 상세 설계

### 3.1 슬라이드 컨테이너

**역할**: 웹 페이지를 슬라이드처럼 전환하는 가벼운 컨테이너

```
기술: React (또는 Vanilla JS)
구조:
  - slides[] 배열에 각 슬라이드 컴포넌트 등록
  - 현재 슬라이드 인덱스 state 관리
  - 전환: CSS transform 또는 opacity transition
  - 풀스크린: Fullscreen API (F11 또는 버튼)

슬라이드 정의 방식:
  - JSON 또는 Markdown 기반 슬라이드 데이터
  - 각 슬라이드에 "위젯 슬롯" 지정 가능
  - 위젯 타입: text, image, cam, stream, terminal, iframe, ai-response

레이아웃:
  - 기본: 16:9 풀스크린 (단일 콘텐츠)
  - 분할: 메인(16:9) + 사이드(9:16) — 디바이스 미러링용
  - 오버레이: AI 응답이 하단 또는 사이드에 표시
```

**슬라이드 데이터 예시**:
```json
{
  "slides": [
    {
      "id": "intro",
      "layout": "full",
      "content": {
        "type": "markdown",
        "data": "# MONKOS\n## AI Multi-Agent Orchestration Platform"
      }
    },
    {
      "id": "demo",
      "layout": "split",
      "main": {
        "type": "markdown",
        "data": "## 이미지프로 라이브 데모"
      },
      "side": {
        "type": "device-stream",
        "source": "webrtc",
        "aspect": "9:16"
      }
    },
    {
      "id": "cam-analysis",
      "layout": "full",
      "content": {
        "type": "cam-capture",
        "onCapture": "ai-analyze"
      }
    }
  ]
}
```

### 3.2 WebRTC 디바이스 스트리밍 모듈

**역할**: 아이폰 카메라 → 맥 브라우저 실시간 비디오 스트리밍

```
아키텍처:
  송신측 (아이폰 /cam):
    1. getUserMedia({ video: { facingMode: "environment" }, audio: false })
    2. RTCPeerConnection 생성
    3. 로컬 스트림 addTrack
    4. WebSocket으로 signaling (offer → answer → ICE)
    
  수신측 (맥 /present):
    1. RTCPeerConnection 생성
    2. ontrack 이벤트로 remote stream 수신
    3. <video> 엘리먼트에 srcObject 연결
    4. 슬라이드 사이드 위젯에 배치

시그널링 서버:
    - 위치: Tailscale 내부 또는 Cloudflare Workers
    - 프로토콜: WebSocket
    - 역할: SDP offer/answer 교환, ICE candidate 중계
    - Tailscale 내부망이면 STUN/TURN 불필요

iOS Safari 대응:
    - Wake Lock API → 화면 자동 꺼짐 방지
    - PWA manifest → 홈 화면 추가 시 네이티브 앱처럼 동작
    - 백그라운드 전환 시 스트림 끊김 대비 → 자동 재연결 로직
```

**핵심 코드 구조 (송신측)**:
```javascript
// /cam 페이지 — 아이폰에서 실행
async function startStreaming() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { 
      facingMode: "environment",  // 또는 "user" (전면)
      width: { ideal: 1080 },
      height: { ideal: 1920 }     // 9:16 세로
    },
    audio: false
  });
  
  const pc = new RTCPeerConnection({
    // Tailscale 내부망이면 iceServers 비워도 됨
    iceServers: []
  });
  
  stream.getTracks().forEach(track => pc.addTrack(track, stream));
  
  // WebSocket signaling
  const ws = new WebSocket(`wss://${TAILSCALE_IP}:${SIGNAL_PORT}`);
  // ... offer/answer/ICE 교환 로직
}
```

### 3.3 웹캠 캡처 모듈

**역할**: 발표용 맥북 웹캠 또는 외부 카메라로 즉석 캡처 → AI 분석

```
기능:
  1. 캠 버튼 클릭 (또는 음성 "캡처해줘")
  2. getUserMedia로 맥 웹캠 접근
  3. canvas에 현재 프레임 캡처
  4. canvas.toDataURL('image/jpeg') → base64
  5. MONKOS AI 백엔드로 전송 (현재 세션 컨텍스트에 어펜딩)
  6. AI 응답을 슬라이드 오버레이에 표시

재사용:
  - 이 모듈은 몽코스 AI 채팅의 캠 입력 버튼과 동일
  - 프레젠테이션 앱, 몽코스 AI, 이미지프로 모두 같은 모듈 사용
```

### 3.4 AI 음성 명령 모듈

**역할**: 발표자 음성으로 프레젠테이션 + AI 제어

```
기술: Web Speech API (SpeechRecognition)

명령어 매핑:
  "다음" / "next"           → 다음 슬라이드
  "이전" / "back"           → 이전 슬라이드
  "캠 열어"                 → 디바이스 스트림 위젯 활성화
  "캡처해줘" / "찍어"       → 웹캠 캡처 → AI 전송
  "분석해줘"                → 현재 화면/컨텍스트 AI 분석 요청
  "요약해줘"                → 브리핑 내용 AI 요약 생성
  "[자유 발화]"             → AI 대화 모드 (질의응답)

구현:
  - SpeechRecognition continuous 모드
  - 명령어 패턴 매칭 (정규식 또는 키워드)
  - 매칭 안 되면 AI 대화 모드로 fallback
  - 인식 결과 시각 피드백 (하단에 자막처럼 표시)

주의:
  - Web Speech API는 Chrome에서 가장 안정적
  - Safari는 부분 지원 → 맥은 Chrome 사용 권장
  - 오프라인 불가 (구글 서버 의존) → 5G 테더링 필수
```

### 3.5 AI 통합 레이어

**역할**: 기존 MONKOS AI 백엔드와 프레젠테이션 시스템 연결

```
연동 포인트:
  1. 웹캠 캡처 이미지 → 멀티모달 AI API (분석/코멘트)
  2. 음성 명령 중 자유 발화 → 텍스트 AI API (질의응답)  
  3. 슬라이드 컨텐츠 생성 → AI 자동 생성 (선택사항)
  4. 브리핑 요약 → AI 요약 생성 후 마지막 슬라이드에 삽입

세션 관리:
  - 프레젠테이션 세션 = AI 대화 세션
  - 슬라이드 내용 + 캡처 이미지 + 음성 입력 모두 동일 컨텍스트
  - 발표 끝나면 전체 브리핑 로그 자동 저장
```

---

## 4. 기술 스택

| 레이어 | 기술 | 비고 |
|--------|------|------|
| 프레젠테이션 UI | React + Tailwind | 풀스크린, 반응형 |
| 실시간 스트리밍 | WebRTC | P2P, Tailscale 내부 |
| 시그널링 | WebSocket | 간단한 relay 서버 |
| 카메라 접근 | getUserMedia API | 웹 표준 |
| 음성 인식 | Web Speech API | Chrome 권장 |
| 화면 잠금 | Wake Lock API | iOS 화면 꺼짐 방지 |
| 네트워크 | Tailscale | 5G 테더링 기반 |
| AI 백엔드 | 기존 MONKOS 인프라 | Claude/Gemini/Imagen |
| 배포 | Cloudflare Pages/Workers | 또는 기존 monk.kr 인프라 |

---

## 5. 파일 구조 (제안)

```
monkos-present/
├── package.json
├── src/
│   ├── app.jsx                    # 메인 앱 라우터
│   ├── pages/
│   │   ├── Present.jsx            # /present — 발표자 뷰
│   │   ├── Cam.jsx                # /cam — 디바이스 카메라 송출
│   │   └── Control.jsx            # /control — 리모컨 (선택)
│   ├── components/
│   │   ├── SlideContainer.jsx     # 슬라이드 컨테이너
│   │   ├── SlideRenderer.jsx      # 개별 슬라이드 렌더링
│   │   ├── DeviceStream.jsx       # WebRTC 수신 비디오
│   │   ├── CamCapture.jsx         # 웹캠 캡처 모듈 ★ 핵심 재사용 모듈
│   │   ├── VoiceCommand.jsx       # 음성 명령 리스너
│   │   └── AIOverlay.jsx          # AI 응답 표시
│   ├── modules/
│   │   ├── webrtc.js              # WebRTC 연결 관리
│   │   ├── signaling.js           # WebSocket 시그널링
│   │   ├── speech.js              # 음성 인식 래퍼
│   │   └── ai-client.js           # MONKOS AI API 클라이언트
│   ├── data/
│   │   └── slides.json            # 슬라이드 데이터 정의
│   └── styles/
│       └── present.css            # 프레젠테이션 전용 스타일
├── signal-server/
│   └── server.js                  # WebSocket 시그널링 서버 (간단)
└── README.md
```

---

## 6. 구현 우선순위

### Phase 1: MVP (면접 시연용) — 1주일
- [ ] 슬라이드 컨테이너 (JSON 기반 페이지 전환)
- [ ] 16:9 풀스크린 + 키보드/터치 네비게이션
- [ ] WebRTC 디바이스 스트리밍 (아이폰 → 맥)
- [ ] WebSocket 시그널링 서버 (Tailscale 내부)
- [ ] 분할 레이아웃 (메인 + 9:16 사이드)

### Phase 2: AI 통합 — +3일
- [ ] 웹캠 캡처 → base64 → AI API 전송
- [ ] AI 응답 오버레이 표시
- [ ] 음성 명령 기본 (다음/이전/캠)

### Phase 3: 완성도 — +3일  
- [ ] 음성 → AI 자유 대화 모드
- [ ] iOS PWA 설정 (Wake Lock, 홈 화면 추가)
- [ ] 브리핑 로그 자동 저장
- [ ] 에러 핸들링 (연결 끊김 자동 재연결)

---

## 7. 핵심 제약 및 주의사항

### iOS Safari/Chrome 제약
- `getUserMedia` 지원되나 **백그라운드 전환 시 스트림 끊김**
- 해결: Wake Lock API + 자동 재연결 + PWA 래핑
- 아이폰은 크롬도 내부적으로 WebKit 엔진 사용 (근본 동일)

### Web Speech API 제약
- **온라인 필수** (구글 서버 의존)
- Chrome에서만 안정적, Safari 부분 지원
- 5G 테더링 환경에서 테스트 필수

### WebRTC P2P
- Tailscale 내부망 → STUN/TURN 불필요 (직통)
- 만약 Tailscale 없는 환경 대비 → Cloudflare TURN 서버 fallback 옵션

### 보안
- Tailscale 자체가 WireGuard 기반 암호화
- 외부 접근 불가, 인증된 디바이스만 연결

---

## 8. agent teams 활용 가이드 (막내에게)

이 프로젝트는 모듈이 명확히 분리되어 있으므로 **agent teams 병렬 빌드에 최적화**되어 있음.

```
Agent A → SlideContainer + SlideRenderer + 레이아웃 시스템
Agent B → WebRTC 모듈 + 시그널링 서버
Agent C → CamCapture + VoiceCommand 모듈  
Agent D → AI 통합 레이어 + 오버레이 UI
```

각 에이전트는 독립적으로 개발 가능하며, 최종 `Present.jsx`에서 조립.

---

## 9. 성공 기준

- [ ] 맥 브라우저에서 풀스크린 프레젠테이션 가능
- [ ] 아이폰 카메라 영상이 슬라이드 사이드에 실시간 표시
- [ ] 음성으로 "다음" 하면 슬라이드 전환
- [ ] 웹캠 캡처 → AI가 분석 코멘트 표시
- [ ] 5G 테더링 + Tailscale로 현장 WiFi 없이 동작
- [ ] **면접관이 "이거 뭘로 만든 거예요?" 라고 물어봄 → 성공**

---

*"제품이 곧 피칭이고, 피칭이 곧 제품이다." — MONKOS*

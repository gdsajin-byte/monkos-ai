# MONKOS Presentation Assistant — 구현 스펙

> **작성일**: 2025-02-08 12:38 KST  
> **작성자**: 철창 (Claude Opus)  
> **대상**: 막내 (Claude Code)  
> **상태**: 1라운드 통과 → 프로토타입 구현 단계

---

## 1. 프로젝트 개요

MONKOS 멀티에이전트 오케스트레이션 플랫폼에 **실시간 영상 인지 기능("눈")** 을 탑재한다.  
첫 번째 앱은 **Presentation Assistant** — 면접/프레젠테이션 현장에서 폰 카메라로 상황을 실시간 캡처하고, AI가 분석하여 발표자에게 즉시 코칭/보조 데이터를 제공하는 시스템.

### 1.1 핵심 목표
- 디딤돌(2B)/창사도약(300M) 면접 현장에서 실시간 AI 코칭
- 강의/프레젠테이션 실시간 보조 (슬라이드 인식, Q&A 지원)
- MONKOS 에이전트 영상 파이프라인 실증 (데모 가능한 수준)

### 1.2 선행 검증 완료
| 항목 | 결과 | 비고 |
|------|------|------|
| WebRTC P2P (Tailscale) | ✅ RTT 7ms | 로컬 네트워크급 |
| 해상도 | 1280x720 (HD) | |
| FPS | 30fps | |
| 비트레이트 | 2,398 kbps | HD 영상통화급 |
| 패킷 손실 | 0.00% | |
| 코덱 | H264 (HW 가속) | |
| 전송 방식 | P2P 직결 | 중앙서버 無, 비용 0원 |

---

## 2. 시스템 아키텍처

```
┌──────────────────────────────────────────────────────────────────┐
│                    MONKOS Presentation Assistant                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [폰/디바이스]          [아이맥/서버]           [Vertex AI]       │
│                                                                  │
│  카메라 + 마이크        WebRTC 수신            Gemini Live API    │
│       │                     │                       │            │
│       │  WebRTC P2P         │  프레임 캡처(1FPS)    │            │
│       │  (Tailscale)        │  + 오디오 스트림       │            │
│       ├────────────────────►├──────────────────────►│            │
│       │                     │                       │            │
│       │                     │  번역기 레이어         │            │
│       │                     │  (장면변화감지,OCR)    │            │
│       │                     │       │               │            │
│       │                     │       ▼               │            │
│       │                     │  텍스트/요약 변환      │            │
│       │                     │       │               │            │
│       │                     │       ▼               │            │
│       │                     │  코퍼스 컨텍스트 주입  │            │
│       │                     │       │               │            │
│       │  오버레이 응답       │       ▼               │            │
│       │◄────────────────────┤  Gemini 응답 수신     │            │
│       │                     │◄──────────────────────┤            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 2.1 레이어 구조

| 레이어 | 역할 | 기술 스택 |
|--------|------|-----------|
| L1 네트워크 | 디바이스 간 P2P 연결 | Tailscale VPN |
| L2 영상전송 | 실시간 비디오/오디오 스트리밍 | WebRTC (STUN 불필요) |
| L3 번역기 | 영상→의미 변환 (토큰 최적화) | 로컬 처리 (장면변화감지, OCR) |
| L4 AI 엔진 | 상황 분석 + 코칭 생성 | Vertex AI Gemini Live API |
| L5 코퍼스 | 도메인 지식 (사업계획, 기술스펙) | MONKOS 코퍼스 (Git/GCS) |
| L6 출력 | 발표자 화면 오버레이 | WebRTC DataChannel / WebSocket |

---

## 3. 기술 스펙

### 3.1 Gemini Live API 설정

**모델 선택**: `gemini-2.5-flash-native-audio` (Vertex AI)

선택 근거:
- Live API 네이티브 지원 (실시간 양방향 스트리밍)
- 비디오 입력 1FPS 처리 — 프레젠테이션/면접에 충분
- 네이티브 오디오 — 면접관 음성 톤/감정 인식 가능
- Proactive Audio — 관련 질문에만 선택적 응답
- 24개 언어 지원, 30개 HD 보이스
- 토큰 효율: 프레임당 258 토큰 + 오디오 초당 32 토큰 ≈ 초당 300 토큰

**세션 설정**:
```python
from google import genai
from google.genai.types import (
    LiveConnectConfig, 
    Modality,
    HttpOptions
)

client = genai.Client(
    http_options=HttpOptions(api_version="v1beta1"),
    # Vertex AI 인증은 서비스 계정 키 또는 ADC
)

config = LiveConnectConfig(
    response_modalities=[Modality.TEXT],  # 텍스트 응답 (오버레이용)
    # 오디오 응답 필요시 Modality.AUDIO 추가
)

session = await client.aio.live.connect(
    model="gemini-2.5-flash-native-audio",
    config=config
)
```

**제약 사항**:
- 비디오 스트리밍: 1FPS 처리 (빠른 액션 부적합 → 프레젠테이션엔 충분)
- 기본 세션 최대 10분 (리저머블 세션으로 연장 가능)
- 서버→서버 인증만 지원 — 중간 앱서버 필수 (아이맥이 이 역할)

### 3.2 번역기 레이어 (토큰 최적화)

원본 영상을 그대로 Gemini에 넣으면 초당 300 토큰 소모.  
번역기 레이어를 거쳐 **선별적 전송**으로 비용을 1/10~1/100로 줄인다.

```
[30fps WebRTC 수신]
       │
       ▼
[장면 변화 감지] ──── 변화 없으면 스킵
       │
       ▼ (변화 감지 시만)
[프레임 캡처 + 리사이즈] → 768x768 (Gemini 최적 해상도)
       │
       ▼
[로컬 OCR] → 텍스트 추출 가능하면 텍스트로 변환
       │
       ├── 텍스트 전송 (토큰 극소) ──→ Gemini API
       │
       └── 이미지 필요시 프레임 전송 ──→ Gemini Live API
```

**장면 변화 감지 구현**:
```javascript
// 이전 프레임과 비교 — 픽셀 차이가 임계값 이상이면 새 프레임 전송
const THRESHOLD = 0.05; // 5% 변화

function detectSceneChange(currentFrame, previousFrame) {
    // Canvas로 두 프레임 비교
    // SSIM 또는 단순 픽셀 차이 사용
    const diff = computeFrameDifference(currentFrame, previousFrame);
    return diff > THRESHOLD;
}
```

### 3.3 코퍼스 연동

MONKOS 코퍼스를 Gemini Live API의 **System Instruction + Function Calling**으로 주입.

```python
# System Instruction에 핵심 코퍼스 컨텍스트 삽입
system_instruction = """
당신은 MONKOS Presentation Assistant입니다.
발표자의 프레젠테이션/면접을 실시간으로 보조합니다.

[코퍼스 컨텍스트]
- 사업명: MONKOS (AI 멀티에이전트 오케스트레이션 플랫폼)
- 핵심기술: 멀티에이전트 협업, 데이터 주권 (벙커 아키텍처), 실시간 영상 파이프라인
- 지원사업: 디딤돌 (2B), 창사도약 (300M)
{추가 코퍼스 내용은 런타임에 주입}

[행동 규칙]
1. 면접관/청중의 질문을 인식하면 → 관련 데이터/답변 가이드를 즉시 제공
2. 슬라이드 전환 감지 시 → 해당 슬라이드의 핵심 포인트/멘트 제안
3. 수치/통계 질문 → 코퍼스에서 정확한 데이터 검색하여 제공
4. 발표 흐름이 벗어나면 → 부드럽게 궤도 수정 제안
"""

# Function Calling으로 코퍼스 검색 연동
tools = [
    {
        "function_declarations": [{
            "name": "search_corpus",
            "description": "MONKOS 코퍼스에서 관련 정보를 검색합니다",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "검색 키워드"},
                    "category": {
                        "type": "string",
                        "enum": ["business_plan", "tech_spec", "financials", "team", "market"],
                        "description": "검색 카테고리"
                    }
                },
                "required": ["query"]
            }
        }]
    }
]
```

### 3.4 WebRTC 영상 파이프라인 (기존 검증 완료)

1라운드에서 검증된 코드를 그대로 활용.

**시그널링 서버**: `signal-server.js` (Node.js WebSocket, 아이맥에서 실행)  
**Sender**: `sender.html` (폰 브라우저)  
**Receiver**: `receiver.html` (아이맥 브라우저) → 여기에 번역기 + Gemini 연동 추가

### 3.5 출력 (발표자 오버레이)

Gemini 응답을 WebRTC DataChannel 또는 WebSocket으로 폰에 전송.  
폰 sender.html에 오버레이 UI 추가.

```
┌─────────────────────────────┐
│  [카메라 뷰 - 풀스크린]      │
│                             │
│                             │
│                             │
│  ┌───────────────────────┐  │
│  │ 💡 AI 코칭 오버레이    │  │
│  │                       │  │
│  │ "매출 데이터 질문 →    │  │
│  │  2024 Q3: 15% 하락,  │  │
│  │  원인: 시장 재편기"    │  │
│  │                       │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
```

---

## 4. 구현 우선순위

### Phase 1: 핵심 파이프라인 (즉시)
- [ ] WebRTC 수신 프레임을 캡처하여 Gemini Live API로 전송
- [ ] Gemini 응답을 폰 오버레이에 표시
- [ ] 기본 System Instruction으로 프레젠테이션 보조 동작 확인

### Phase 2: 번역기 레이어 (이번 주)
- [ ] 장면 변화 감지 구현 (불필요한 프레임 스킵)
- [ ] 프레임 리사이즈 (768x768)
- [ ] 로컬 OCR 연동 (슬라이드 텍스트 추출)

### Phase 3: 코퍼스 연동 (면접 전까지)
- [ ] MONKOS 코퍼스 Function Calling 연동
- [ ] 디딤돌/창사도약 사업계획서 데이터 주입
- [ ] 예상 질문/답변 데이터셋 구축

### Phase 4: 고도화 (차후)
- [ ] 로컬/폰 경량 모델(3B) 탑재 → API 의존도 감소
- [ ] 멀티디바이스 센서 네트워크 확장
- [ ] 양방향 AR 오버레이
- [ ] 오디오 분석 (면접관 톤/감정)

---

## 5. 의존성 & 환경

### 5.1 인프라
- **아이맥**: 메인 서버 (시그널링 + 번역기 + Gemini API 프록시)
- **4060 PC**: 로컬 OCR/모델 처리 (Phase 2~)
- **Tailscale VPN**: 전 디바이스 P2P 네트워크
- **폰**: 카메라 입력 + 오버레이 출력 (브라우저 기반, OS 무관)

### 5.2 API & 인증
- **Vertex AI**: 서비스 계정 키 또는 ADC (Application Default Credentials)
- **모델**: `gemini-2.5-flash-native-audio` (Live API)
- **리전**: 한국 근접 리전 (asia-northeast3 서울 또는 asia-northeast1 도쿄)

### 5.3 패키지
```bash
# 아이맥 서버
npm install ws                          # 시그널링 서버
pip install google-genai                # Vertex AI Gen AI SDK

# 번역기 레이어 (Phase 2)
pip install opencv-python               # 프레임 처리
pip install pytesseract                 # OCR (또는 Google Vision API)
```

---

## 6. 플랫폼 독립성

오늘 검증한 스택은 **완전 OS 무관**:
- WebRTC = 브라우저 표준 (Chrome/Safari/Firefox)
- Tailscale = 모든 OS 클라이언트 (iOS/Android/Mac/Win/Linux)
- 시그널링 = Node.js (어디서든)
- 클라이언트 = 브라우저만 있으면 됨

→ 아이폰→아이맥, 안드로이드→윈도우 등 어떤 조합이든 **코드 변경 없이** 동작.

---

## 7. 비용 구조

| 항목 | 비용 | 비고 |
|------|------|------|
| WebRTC P2P 전송 | 0원 | 중앙서버 없음 |
| Tailscale | 무료 (개인) | 100 디바이스까지 |
| Gemini Live API | 토큰 기반 과금 | 번역기로 1/10~1/100 최적화 |
| GCP 바우처 | $350K (3월 목표) | 인증 통과 시 |

---

## 8. 참고: 벤치마크 기준값

```
WebRTC P2P (iPhone → iMac via Tailscale)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RTT:        7ms (로컬 네트워크급)
해상도:     1280x720 (HD)
FPS:        30
비트레이트: 2,398 kbps
패킷 손실:  0.00%
코덱:       H264 (HW 가속)
전송 방식:  P2P 직결
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
측정일: 2025-02-08 12:28 KST
```

---

> **막내에게**: Phase 1부터 순차 구현. WebRTC receiver에서 프레임 캡처 → Gemini Live API 연결이 첫 번째 마일스톤. System Instruction에 코퍼스 기본 컨텍스트 박아넣고, 폰 오버레이까지 E2E 동작 확인하면 1차 완료.

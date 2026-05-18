---
type: devlog
portfolio: PF_CHATBOT
seq: 1
title: "왜 Gemini인가 — MONKOS AI 챗봇 엔진 선택"
period: 2026-01-10 ~ 2026-01-30
authors: 작가님, 쌍아, 막내
---

# 왜 Gemini인가 — MONKOS AI 챗봇 엔진 선택

> MONK.KR에 AI 챗봇을 넣으려 한다. 엔진을 무엇으로 만들 것인가?

---

## 1. 문제의식

MONK.KR은 AI 증명사진 서비스다. 사용자가 사진을 업로드하고 결과를 받는 과정에서 **대화형 안내**가 필요했다.

- 촬영 준비 코칭: "정면을 보세요", "배경이 밝으면 좋아요"
- 서비스 안내: 크레딧, 가격, 사용법
- CS 응대: 결제 문의, 환불, 오류 신고

기존에는 정적 FAQ + 이메일 응대. 하지만 증명사진은 **실시간성**이 핵심이다 — 촬영 직전에 코칭이 필요하고, 결과가 마음에 안 들면 즉시 재시도 안내가 필요하다. 사람이 24시간 붙어 있을 수 없다.

**핵심 질문**: 어떤 AI 엔진으로 이 대화를 만들 것인가?

---

## 2. 전개 / 리서치

2026년 1월 시점의 선택지:

| 엔진 | 장점 | 단점 |
|------|------|------|
| **OpenAI GPT-4o** | 한국어 품질 최상위, 생태계 풍부 | 비용 높음, Google Cloud와 별도 과금 체계 |
| **Claude (Anthropic)** | 긴 맥락, 정확한 지시 이행 | API 비용, 인프라 이질적 |
| **Gemini (Google)** | Google Cloud 네이티브, Vertex AI 통합 | 한국어 품질 GPT 대비 약간 뒤처짐 |
| **오픈소스 (Llama 등)** | 비용 0, 커스텀 자유 | 호스팅 필요, 한국어 품질 불안정 |

### 결정적 요인: 인프라 일체성

MONKOS는 이미 Google Cloud 위에 올라가 있었다:
- **Cloud Run**: 서비스 호스팅
- **Firestore**: 사용자 데이터, 대화 히스토리
- **Cloud Storage**: 이미지 저장
- **Vertex AI**: 이미지 생성 (Imagen)

여기에 OpenAI나 Claude를 붙이면 **과금 체계 이원화 + 인증 이원화 + 장애 포인트 증가**. 반면 Gemini는:
- `@google/genai` SDK 하나로 텍스트+이미지 생성 통합
- Firestore와 같은 IAM 체계
- Cloud Run 서비스 계정으로 인증 통과
- 비용이 Flash 기준 월 $5 이하 (당시 예상 트래픽)

### 한국어 품질 우려

GPT-4o 대비 Gemini 2.0 Flash의 한국어가 약간 경직된 느낌이 있었다. 하지만 챗봇의 용도가 **창의적 글쓰기가 아닌 CS/안내**이므로, 정확한 정보 전달이 우선이었다. 시스템 프롬프트로 톤을 제어하면 충분했다.

---

## 3. 해결방안

**Gemini 2.0 Flash** 선정. 이유 요약:

1. **인프라 일체성**: Google Cloud 한 지붕 아래서 모든 AI 기능 통합
2. **비용 효율**: Flash 모델의 입출력 비용이 GPT-4o 대비 1/10 수준
3. **SDK 통합**: `@google/genai`로 텍스트 대화 + 이미지 생성을 한 코드베이스에서 처리
4. **확장성**: 향후 멀티모달(이미지 분석 + 대화) 파이프라인으로 자연 확장 가능

위험 수용:
- 한국어 품질 → 시스템 프롬프트 튜닝으로 보정
- 벤더 종속 → 당시에는 Google Cloud 올인 전략이므로 일관된 판단

---

## 4. 실행

### 1단계: RAG 컨텍스트 구축 (01/10)
- MONKOS 서비스 전체를 설명하는 학습 문서 작성
- Firestore `cs_knowledge` 컬렉션에 Q&A 시드 데이터 적재

### 2단계: 스키마 설계 (01/13)
- 챗봇 대화 히스토리 Firestore 스키마
- 세션 관리: chatId 기반 TTL

### 3단계: chatWithGemini 초기 구현 (01/29~30)
- `@google/genai` SDK로 Gemini 2.0 Flash 연동
- Vertex AI 서비스 계정 권한 설정
- chatHistory 호환성 처리 (role: user/model 매핑)
- monkos.ai에 라이브 배포

```javascript
// 초기 구현의 핵심 — 단순했다
const { GoogleGenerativeAI } = require('@google/genai');
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
const chat = model.startChat({ history: chatHistory });
const result = await chat.sendMessage(userMessage);
```

---

## 5. 결과

- **01/30 라이브**: monkos.ai 포털에서 첫 AI 대화 성공
- **응답 품질**: CS 안내 용도로 충분. 가격·크레딧·사용법 정확 응답
- **응답 속도**: Flash 모델 특성상 1~2초 내 응답
- **비용**: 일 수십 건 대화 기준 월 $1 미만

### 한계 (후속 Phase에서 해결)
- 단일 채널(웹)만 지원 → Phase 1에서 텔레그램·카카오·LINE 확장
- RAG 없는 순수 프롬프트 → Phase 2에서 RAG 통합
- 대화 히스토리 관리 미비 → Firestore TTL + 인메모리 캐시 도입

---

## 6. 리뷰

### 잘한 판단
- **인프라 일체성 우선**: 별도 AI 벤더를 붙이지 않은 것이 운영 복잡도를 극적으로 낮췄다. 과금·인증·장애 모두 Google Cloud 한 곳에서 관리.
- **Flash 모델 선택**: 비용 대비 품질이 CS 챗봇 용도에 최적이었다. Pro를 쓸 이유가 없었다.

### 아쉬운 판단
- **모델명 하드코딩**: `gemini-2.0-flash`를 코드 곳곳에 직접 기재. 5개월 뒤 EOL 대응 시 21건 교체가 필요해짐. 상수 1곳에서 관리했어야 한다.
- **벤더 추상화 부재**: Gemini 직접 호출. 중간 레이어(모델 스위칭)가 없어서 향후 모델 전환 시 코드 전수 수정 필요.

### 후속 영향
이 선택이 이후 5개월간의 전체 아키텍처를 결정했다. chatWithGemini → chatWithMonkos 통합(devlog 002) → 6채널 확장 → RAG 고도화 → 온디바이스 분기(devlog 004)까지, 모두 이 첫 판단의 연장선에 있다.

Gemini 2.0 EOL(devlog 005)은 이 판단의 리스크가 현실화된 사례이며, 동시에 더 나은 모델(3.1-flash-lite)로 자연 진화하는 계기이기도 하다.

> **한 줄 요약**: Google Cloud 올인 전략의 논리적 귀결로 Gemini를 선택했고, 5개월간 검증됐다. 모델명 하드코딩만 피했어도 완벽했다.

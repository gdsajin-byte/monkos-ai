---
type: order
date: 2026-04-29
from: 작가님 → to: iMac/막내1
subject: Google AI 인프라 전체 로드맵 리서치
priority: P0
status: 대기
related: REPORT_20260428_iMac민아_나노바나나2_코드아키텍처_사용툴_분석.md / PF_PROFILES / PF_STUDIO
---

# 지시서: Google AI 인프라 전체 로드맵 리서치

**[2026-04-29 12:19 KST] iMac/쌍아 발행 (작가님 구두 지시)**

---

## 배경

MONKOS는 현재 Google AI 인프라(Vertex AI, Google AI Studio)에 전면 의존한다. 최근 Google이 Vertex AI 개념을 재편하는 방향의 메일을 발송한 정황이 있고, 2026년 6월 Gemini 2.0 폐쇄 예고, 쿼터 $250 제한 등 우리 서비스에 직접 영향을 주는 변화들이 동시 진행 중이다.

개별 모델 도입이 아니라 **전체 인프라 구성방안과 로드맵**이 필요한 시점.

## 현황 (쌍아 사전 확인 완료)

- `gemini-3-pro-image-preview`, `gemini-3.1-flash-image-preview` 모두 Vertex AI ADC 접근 가능 실측 확인
- 엔드포인트: `aiplatform.googleapis.com` (리전 접두어 없음) + `locations/global`
- 현재 코드는 Google AI Studio API Key 방식 (전환 대상)

## 조사 항목

### 1. Google AI 플랫폼 재편 방향
- Google이 최근 발송한 메일/공지의 핵심 (Vertex AI → Agent Platform? 통합? 이름 변경?)
- "에이전트 플랫폼" / "Model Garden" 재편의 실질적 의미
- 기존 Vertex AI API 엔드포인트 유지/변경 여부
- WebSearch로 최신 공식 블로그, changelog, 마이그레이션 가이드 수집

### 2. 프로비저닝된 처리량 (Provisioned Throughput) 상세
- on-demand vs Provisioned Throughput 차이
- Provisioned Throughput의 과금 구조 (최소 계약, 단가, 커밋 기간)
- 우리 트래픽 규모(일 50-200건 생성)에서 필요한가?
- 주문 절차와 해지 조건

### 3. 쿼터 $250 제한 및 상향 절차
- Google AI / Vertex AI의 무료 티어 → $250 → 그 이상 단계별 제한
- $250 이상 사용 시 필요한 절차 (별도 요청, 실결제 카드 인증, billing account 설정 등)
- RPM/TPM 쿼터 현재 값과 상향 방법
- 우리 프로젝트(monkos)의 현재 billing 상태 확인: `gcloud billing accounts list`, `gcloud billing projects describe monkos`

### 4. Gemini 2.0 폐쇄 영향 분석
- 2026년 6월 Gemini 2.0 flash 폐쇄 공식 일정
- 우리 코드에서 `gemini-2.0-flash` 사용 위치 전수 (grep)
  - functions/api/analyze.js
  - idphoto-*/precheck
  - 기타
- 대체 모델 (gemini-2.5-flash? gemini-3-flash?)
- 마이그레이션 시 코드 변경 범위 추정

### 5. 엔드포인트/SDK 통일 방안
- 현재 이중 인증 구조 (Vertex AI ADC + Google AI Studio API Key) 정리
- Gen AI SDK (`@google/genai`) Vertex 모드로 통일 가능한 범위
- REST 직접 호출 → SDK 전환 시 코드 변경점
- Cloud Run SA `monk-image-engine@monkos.iam.gserviceaccount.com`의 현재 역할 확인

### 6. 전체 로드맵 초안
위 조사 결과를 바탕으로:
- **즉시 (5월)**: 해야 할 것
- **6월 전**: Gemini 2.0 폐쇄 대응
- **6월 후**: 중기 과제
시간순 로드맵 초안 작성

## 산출물

`monkos-ops/ops/reports/REPORT_20260429_막내1_GoogleAI_인프라_로드맵.md`

## ⚠️ 준수 조항

- 법률 ch2: 코드 수정 없음. 리서치+보고서만.
- 헌법 4조 1항: API 키/시크릿 절대 노출 금지. gcloud describe 등 비파괴 명령만.
- 세션 로그: 보고서 완성 후 세션 로그 어펜드.

---

**완료 보고 형식**: ✅❌💡⏳📁🔀

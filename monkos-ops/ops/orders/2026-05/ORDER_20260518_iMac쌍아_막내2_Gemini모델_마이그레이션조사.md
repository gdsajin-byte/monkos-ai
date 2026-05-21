---
type: order
date: 2026-05-18
from: iMac/쌍아
to: 막내2
status: 발행
portfolio: PF_PORTAL
---

# 지시서: Gemini 모델 마이그레이션 이슈 전수 파악

## 배경

MONKOS 서비스에서 Gemini 2.0 계열 모델을 사용 중. 6월이 임박하여 deprecation/sunset 일정을 파악하고 마이그레이션 계획을 수립해야 함.

## 현재 사용 모델 (코드 기준)

| 용도 | 모델명 | 파일 | 접근방식 |
|------|--------|------|----------|
| Imagen I2I (증명사진 생성) | `gemini-3-pro-image-preview` | idphoto-kr/server.js:552 | Google AI Studio API Key |
| Gemini Live (촬영 코칭) | `gemini-2.0-flash-live-preview-04-09` | idphoto-kr/server.js:332 | Vertex AI ADC |
| 사전분석 (얼굴좌표) | `gemini-2.0-flash` | idphoto-kr/server.js:374 | Vertex AI ADC |
| 챗봇 | 확인 필요 | portal 또는 별도 | 확인 필요 |

## 임무

### 1. Google 공식 deprecation 일정 조사

- Gemini 2.0 Flash / 2.0 Flash Live 공식 sunset/deprecation 날짜
- Gemini 3.0 계열 (gemini-3-pro-image-preview 포함) preview → GA 전환 일정
- Google AI Studio vs Vertex AI 각각의 모델 지원 일정 차이
- 2026년 6~8월 주요 변경 예정 사항

### 2. MONKOS 코드 전수 스캔

아래 경로에서 Gemini/AI 모델 참조 전수 검색:

```
monkos_AI/portal/          — 챗봇, 기타 AI 기능
monkos_AI/idphoto-kr/      — 증명사진 KR
monkos_AI/idphoto-jp/      — 증명사진 JP
monkos_AI/studio/          — 스튜디오
functions/                 — CF Workers
apps/                      — 프로토타입
```

조사 항목:
- 모델명 + 파일:라인 + 용도
- API 접근방식 (AI Studio Key / Vertex AI ADC / REST 직접)
- preview/experimental 태그 여부
- 하드코딩 vs 환경변수

### 3. 마이그레이션 영향도 분석

| 항목 | 내용 |
|------|------|
| 긴급도 | 각 모델별 sunset까지 남은 일수 |
| 대체 모델 | GA 버전 또는 후속 모델 |
| 호환성 | API 시그니처 변경 여부, 응답 포맷 차이 |
| 코드 변경 범위 | 모델명만 교체 vs 로직 변경 필요 |
| 테스트 필요 사항 | 퀄리티 비교 필수 여부 |

### 4. 마이그레이션 로드맵 제안

- 우선순위 (가장 급한 것부터)
- 각 모델별 교체 방안 + 예상 소요
- 롤백 전략

## 산출물

- `REPORT_20260518_막내2_Gemini모델_마이그레이션조사.md`
- 배치: `monkos-ops/ops/sessions/2026-05/`

## ⚠️ 준수 조항

- Google 공식 문서(cloud.google.com, ai.google.dev) 기준. 비공식 블로그 단독 인용 금지
- 날짜는 절대값 (YYYY-MM-DD)으로 기재. "곧", "조만간" 금지
- 코드 스캔은 `grep` 실측 기준. 추측 금지
- 완료 후 세션 로그 어펜드 + 커밋

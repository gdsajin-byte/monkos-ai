---
type: ORDER
date: 2026-03-06
from: M1/쌍아
to: 막내3
scope: Gemini/Vertex AI 모델 전수조사 + 폐기 일정 + 마이그레이션 분석
prerequisite: 없음
ref: 2026-03-06 Google 메일 3건 (모델 종료 안내)
---

# 지시서: Gemini/Vertex AI 모델 전수조사 + 마이그레이션 분석

> **[2026-03-06 04:55 KST] M1/쌍아 → 막내3**

---

## 배경

Google로부터 모델 종료 안내 3건 수신:

| 긴급도 | 마감 | 내용 |
|--------|------|------|
| 🔴 | 3/9 | Google AI Studio — Gemini 3 Pro Preview 종료 → 3.1 마이그레이션 |
| 🟡 | 3/26 | Vertex AI — Gemini 3 Pro Preview 종료 → 3.1 마이그레이션 |
| 🟢 | 6/1 | Vertex AI — Gemini 2.0 Flash / Flash Lite 종료 → 3 Flash + 가격 3배 |

**핵심 질문:**
1. 우리가 사용 중인 모델 중 영향받는 것은 정확히 무엇인가?
2. `gemini-3-pro-image-preview` (I2I 생성 엔진)는 이 폐기에 포함되는가?
3. 각 모델의 후속 모델은 무엇이고, 호환성은?
4. 마이그레이션 시 품질·가격·API 호환성 변동은?

---

## Phase A: 웹 리서치 — 모델 폐기 일정 + 후속 모델

### A-1. Google 공식 문서 조사

웹 검색으로 아래 정보를 수집:

1. **Gemini 3 Pro Preview 폐기 상세**
   - 정확한 폐기 대상 모델 ID 목록 (`gemini-3-pro-preview`, `gemini-3-pro-image-preview` 포함 여부)
   - `gemini-3-pro-image-preview`의 라이프사이클 — 텍스트 모델과 동일한가 별도인가?
   - `gemini-3.1-pro-preview`와 `gemini-3.1-pro-image-preview` 존재 여부
   - 3/9 폐기 시 API 응답이 어떻게 변하는가 (에러? 자동 리다이렉트?)

2. **Gemini 2.0 Flash 폐기 상세**
   - 정확한 폐기 대상: `gemini-2.0-flash`, `gemini-2.0-flash-lite`, `gemini-2.0-flash-live-preview-04-09`
   - 후속 모델: `gemini-3-flash`? 정확한 모델 ID
   - Live API (WebSocket 실시간 스트리밍) 후속 — `gemini-2.0-flash-live-preview-04-09`의 대체는?
   - 가격 변동 상세 (ELA 3배 인상 범위)

3. **Gemini 3 Flash Preview**
   - `gemini-3-flash-preview` 현재 상태 및 GA 일정
   - `gemini-3-flash` (GA) 출시 여부

### A-2. Google AI Studio vs Vertex AI 차이

- 동일 모델 ID라도 Google AI Studio(API Key)와 Vertex AI(ADC)에서 폐기 일정이 다를 수 있음
- 우리는 **둘 다 사용** — I2I는 AI Studio(API Key), 코칭/QC/챗봇은 Vertex AI(ADC)
- 각 경로별 폐기 일정 정리

### A-3. 이미지 생성 모델 로드맵

- `gemini-3-pro-image-preview` → 후속 이미지 생성 모델은 무엇인가?
- Imagen 3/4 모델과의 관계 (imagen-4.0-generate-001 등)
- 네이티브 이미지 생성 (Gemini) vs 전용 이미지 모델 (Imagen) 로드맵

---

## Phase B: 코드베이스 전수조사 — 현재 모델 사용 현황

### B-1. 전체 모델 호출 지점 파악

아래 경로 전수 검색:
- `monkos_AI/idphoto-kr/` — 한국 증명사진
- `monkos_AI/idphoto-jp/` — 일본 증명사진
- `monkos_AI/portal/` — 포털 (챗봇, CS)
- `monkos_AI/` 하위 기타 서비스

검색 대상:
```
gemini-*
imagen-*
model:
model =
model:
```

### B-2. 모델별 사용 맵 작성

| 모델 ID | 서비스 | 파일:라인 | 용도 | 인증 경로 | 폐기 일정 |
|---------|--------|----------|------|----------|----------|
| (전수 기입) | | | | AI Studio / Vertex AI | |

### B-3. 미사용·레거시 모델 잔존 확인

- 코멘트·로그 메시지에만 남아있는 구 모델 (imagen-4.0-generate-001 등)
- 백업 파일의 구 모델 참조
- 환경변수나 config에 숨어있는 모델 참조

---

## Phase C: 마이그레이션 영향 분석

### C-1. 긴급도별 영향 분석

Phase A·B 결과를 종합하여:

**각 모델별:**
1. 현재 모델 → 후속 모델 매핑
2. API 호환성 (엔드포인트, 파라미터, 응답 형식 변경 여부)
3. 품질 변동 예상 (특히 I2I 이미지 생성)
4. 가격 변동
5. 마이그레이션 난이도 (모델 ID 한 줄 교체 vs API 구조 변경)
6. 테스트 필요 범위

### C-2. 마이그레이션 우선순위 제안

긴급도 + 영향도 기준으로 마이그레이션 순서 제안.

### C-3. 리스크 평가

- `gemini-3-pro-image-preview`가 폐기 대상이 아닌 경우: 안심, 모니터링만
- 폐기 대상인 경우: 3/9까지 3일 — 긴급 마이그레이션 필요, 품질 테스트 시간 부족 리스크
- 6/1 Flash 전환: 가격 3배 영향도 산출 (월간 API 호출량 기반)

---

## 검증 (완료 조건)

### 웹 리서치 (Phase A)
1. 3건 공지 각각의 정확한 폐기 대상 모델 ID 목록 확인
2. `gemini-3-pro-image-preview` 포함 여부 **명확한 답변**
3. 각 모델의 후속 모델 ID + 존재 여부 확인
4. Google AI Studio vs Vertex AI 폐기 일정 차이 정리
5. Live API 후속 모델 확인

### 코드 전수조사 (Phase B)
6. 전체 모델 사용 맵 완성 (서비스별, 파일:라인, 용도, 인증 경로)
7. 미사용·레거시 모델 잔존 목록

### 영향 분석 (Phase C)
8. 모델별 마이그레이션 매핑 + 난이도 + 리스크
9. 마이그레이션 우선순위 제안
10. 가격 영향 산출

---

## 보고 형식

```
REPORT_20260306_막내3_Gemini모델전수조사.md
```

구성:
1. Phase A 리서치 결과 (모델별 폐기 상세)
2. Phase B 코드 전수조사 결과 (모델 사용 맵)
3. Phase C 마이그레이션 분석 (영향도 + 우선순위 + 리스크)
4. 긴급 조치 필요 여부 결론

---

## 수정 파일 목록

**이 지시서에서 코드 수정 없음.** 보고서만 제출.
마이그레이션 실행은 보고서 기반으로 작가님+쌍아 합의 후 별도 지시.

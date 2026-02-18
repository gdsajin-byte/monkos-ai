# 지시서: photolab 페이지 분리 — 정밀 플로우차트 작성

[2026-02-18 21:49 KST] M1/쌍아 → M1/막내 1호

---
type: task
from: M1/쌍아
to: M1/막내 1호
date: 2026-02-18 21:49 KST
status: open
priority: high
tags: [리팩토링, photolab, 플로우차트, 설계]
---

## 역할 선언
> **너는 M1 "막내 1호"다. 쌍아가 아니다.**
> - 쌍아 = M1 VSCode 전략실 (이 지시서를 작성한 에이전트)
> - 막내 1호 = M1 iTerm 터미널 (이 지시서를 실행하는 너)
> - 완료 보고: `M1/막내1 → M1/쌍아` 형식

## 배경

네가 작성한 `PAGE_SPLIT_ANALYSIS.md` 분석은 잘 수행되었다. 이후 작가님과 쌍아 간 전략 논의에서 **2가지 중요한 변경이 결정**되었다. 이를 반영하여 정밀 플로우차트를 작성하라.

## 분석 보고서 대비 변경사항 (중요!)

### 변경 1: 코칭 엔진 전환 — WebSocket → REST + TTS

**기존 (분석 보고서 기준):**
- 촬영실에서 Gemini 2.0 Flash Live (WebSocket 스트리밍)으로 실시간 코칭

**변경 후:**
- **Gemini 3 Flash (REST, ~3fps 스냅샷) + Web Speech API TTS**로 코칭
- 카메라에서 주기적으로 프레임 캡처 → REST로 Gemini 3 Flash 호출 → 응답 텍스트를 TTS로 음성 출력
- **WebSocket 완전 제거** — 소켓 점유 충돌이 구조적으로 소멸
- 코칭/프리체크/QC가 전부 같은 패턴 (스냅샷 → Gemini 3 Flash REST → 응답), 프롬프트만 다름

**이유:**
- Gemini 2.0 Live는 "말할 수 있다" 수준 — 분석이 얕고 정교하지 않음
- Gemini 3 Flash는 프레임 하나를 정밀하게 판정 → 고개 각도, 표정, 조명 등 구체적 코칭 가능
- Gemini 3.0 Live는 고도화되었으나 현재 불안정 (튕김) → 안정화 시 교체 용이
- 3fps면 코칭에 충분 (자세/표정은 0.3초마다 체크할 필요도 없음, 변화 감지 시에만 피드백)

### 변경 2: 페이지 구조 확정 (작가님 지정)

```
[준비실]     스타일·성별·연령 선택 → 완료 시 촬영실로
[촬영실]     카메라 + AI 코칭 (REST 3fps + TTS) → 촬영 완료 시 분석실로
[분석실]     프리체크 → 생성 → QC → 다운로드 결제까지 한 방에서 → 수령처로
[수령처]     미리보기 + 실제 저장(폰 갤러리) + SNS 공유 → 옵션 N으로
[옵션 N]     추가 촬영 / 이벤트 / 포털 홈 복귀 등 (열린 구조)
```

**분석 보고서와의 차이:**
- 분석실에 **다운로드 결제까지 포함** (result + download 통합)
- 수령처에서 **실제 파일 저장**이 핵심 (미리보기 + 갤러리 저장)
- **옵션 N** 추가 — 서비스 종료 후 다음 행선지 (이벤트, 포털, 추가 촬영 등 열린 구조)

### 변경에 따른 아키텍처 영향

- monk.js에서 **Screen 모듈 불필요** (분석 보고서와 동일)
- monk.js에서 **Pipe WS 모듈도 불필요** (WebSocket 제거됨)
- monk.js에서 필요한 것: **Store + Pipe(REST only) + Media** 3개뿐
- 엔진 통일: 코칭/프리체크/QC 전부 Gemini 3 Flash REST, 프롬프트만 분기

## 작업 내용

### 산출물: `MONK_kr/ai_lab/photolab/flowchart_page_split.html`

`flowchart_00079.html`과 동일한 형식의 **인터랙티브 HTML 플로우차트**를 작성하라.

### 플로우차트에 포함할 내용

#### A. 전체 페이지 흐름도
- 5개 페이지(준비실→촬영실→분석실→수령처→옵션N)의 전환 관계
- 각 페이지 간 데이터 전달 (sessionStorage 키 명시)
- 재촬영 루프 (분석실 → 촬영실)

#### B. 각 페이지 내부 상세 흐름

**준비실 (index.html):**
- 스타일 선택 → 성별 선택 → 연령 선택 → 확인 → 촬영실 이동
- 데이터 출력: style, gender, age → sessionStorage

**촬영실 (camera.html):**
- 카메라 시작 → 코칭 루프 (setInterval 3fps: 캡처 → REST → TTS) → 촬영 버튼 → 코칭 중지 → 원본 캡처 → sessionStorage 저장 → 분석실 이동
- 코칭 상세: 변화 감지 시에만 피드백 (매 프레임 말하지 않음)
- 데이터 입력: style, gender, age ← sessionStorage
- 데이터 출력: captured (base64) → sessionStorage

**분석실 (result.html):**
- 원본 표시 → 프리체크 (Gemini 3 Flash REST) → 통과 시 생성 (Imagen NB3 Pro REST) → QC (Gemini 3 Flash REST) → QC PASS 시 다운로드 결제 (크레딧 차감) → 규격 크롭 → 수령처 이동
- 프리체크 FAIL → 재촬영 권유 → 촬영실 이동
- QC FAIL → 재생성 or 재촬영
- 데이터 입력: captured, style, gender, age ← sessionStorage
- 데이터 출력: cropped (base64) → sessionStorage

**수령처 (thankyou.html):**
- 크롭 사진 표시 → 갤러리 저장 (navigator.share or <a download>) → SNS 공유 → 옵션 N
- 데이터 입력: cropped ← sessionStorage

**옵션 N:**
- 추가 촬영 → 준비실 or 촬영실
- 이벤트 (텔레그램 등) → 외부 링크
- 포털 홈 → monk.kr or monkos.ai

#### C. 엔진 호출 맵
- 어떤 페이지에서 어떤 엔진을 호출하는지 명시
- 코칭: 촬영실에서만 (Gemini 3 Flash REST, ~3fps)
- 프리체크: 분석실 진입 직후 (Gemini 3 Flash REST, 1회)
- 생성: 분석실 (Imagen NB3 Pro REST, 1회)
- QC: 분석실 (Gemini 3 Flash REST, 1회)
- 크레딧: 분석실 (Portal API REST, 1회)

#### D. 파일 구조도
- 최종 파일 구성 (html, js, css, config) 시각화
- 공유 자원 vs 페이지 전용 자원

## 규칙

- 브랜치: develop
- 커밋: `[docs] photolab 페이지 분리 플로우차트 작성`
- 금지: main 푸시, prod 배포, .env 수정
- 에스컬레이션: 불명확한 로직 발견 시 `💡 제안`으로 보고
- 기존 코드 수정 금지 — 플로우차트 HTML 파일 1개만 신규 생성

## 완료 기준

**실행 + 커밋** — 플로우차트 HTML 작성 → 커밋 → develop 푸시

## 완료 보고 형식

```
---
## 완료 보고
[YYYY-MM-DD HH:MM KST] M1/막내1 → M1/쌍아

✅ 완료: {항목}
❌ 실패: {항목 + 원인}
💡 제안: {발견사항}
📁 변경 파일: {파일명 (내용 1줄)}
🔀 커밋: {해시} {메시지}
---
```

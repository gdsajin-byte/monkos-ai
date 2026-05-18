# 지시서: photolab 페이지 분리 — 정밀 분석

[2026-02-18 21:29 KST] M1/쌍아 → 막내(any)

---
type: task
from: 쌍아
to: 막내(any)
date: 2026-02-18 21:29 KST
status: open
priority: high
tags: [리팩토링, photolab, 페이지분리, 분석]
---

## 역할 선언
> **너는 "막내"다. 쌍아가 아니다.**
> - 쌍아 = M1 VSCode 전략실 (이 지시서를 작성한 에이전트)
> - 막내 = iTerm 터미널 (이 지시서를 실행하는 너)
> - 완료 보고: `{디바이스}/막내 → M1/쌍아` 형식

## 배경

현재 `MONK_kr/ai_lab/photolab/`은 단일 `index.html` + `app.js` 안에서 4개 화면(prep, camera, result, thankyou)을 Screen 모듈로 전환하는 SPA 구조다.

작가님 결정: **각 화면을 독립 페이지로 물리적 분리한다.**

이유:
- 코칭(Live WS)과 QC가 소켓 점유 충돌하는 근본 원인 = 한 페이지 안에서 두 기능이 공존
- 페이지 분리 시 → 촬영실 나가면 소켓 자연 해제, 진입하면 새로 연결. 플래그/타이머 불필요
- 페이지 단위 독립 = 개발 시 각 페이지만 열어서 PC 라이브뷰 디버깅 가능 (미러링 불필요)
- monk.kr 스튜디오의 폴더별 격리 철학 계승

## 작업 내용: 코드 수정 없이 분석만

### 분석 대상 파일 (5개, 총 2,506줄)

| 파일 | 줄수 | 역할 |
|------|------|------|
| `index.html` | 293 | HTML 구조 (4개 화면 섹션) |
| `app.js` | 829 | 비즈니스 로직 전체 |
| `monk.js` | 665 | 프레임워크 (Screen, Store, Pipe, Media, Agent) |
| `config.js` | 88 | API 경로, 상수 |
| `app.css` | 631 | 스타일 전체 |

참고 파일:
- `flowchart_00079.html` — 00079 원본 플로우차트
- `framework_design.html` — MONK.js 프레임워크 설계 문서
- `index_00079.html` — 00079 원본 코드 (5000줄 모놀리스)

### 분석 항목

#### 1. 화면(Screen) 목록 + 각 화면의 역할

현재 `app.js`에서 `screen.define()`으로 등록된 화면 목록을 추출하고, 각 화면이:
- 어떤 HTML 요소를 사용하는지 (`el: '#xxx'`)
- enter/exit에서 무엇을 하는지
- 어떤 Store 상태를 읽고/쓰는지
- 어떤 함수들을 호출하는지

#### 2. 화면 간 전환 흐름

`screens.go('xxx')` 호출을 모두 추출하여 전환 흐름도를 그린다:
```
예시: prep → camera → result → thankyou
                        ↑ 재촬영 ↓
                      camera ←──┘
```

#### 3. 화면 간 데이터 의존성

화면 A에서 설정한 값을 화면 B에서 읽는 경우를 모두 파악:
- Store 상태 중 어떤 것이 화면을 넘어 공유되는지
- 예: `store.style` (prep에서 설정 → camera에서 사용)
- 예: 촬영 원본 이미지 (camera에서 캡처 → result에서 표시)

#### 4. 공유 자원 vs 화면 전용 자원

| 구분 | 예시 |
|------|------|
| 공유 (모든 페이지) | monk.js, config.js, 공통 CSS, Store 일부 |
| 화면 전용 | 카메라 스트림, WS 코칭 연결, QC 로직 등 |

#### 5. 페이지 분리 시 구조 제안

분석 결과를 바탕으로, 몇 개의 독립 HTML 페이지로 나뉘는지 제안한다:
- 각 페이지의 파일명
- 각 페이지가 가져가는 HTML/JS/CSS 범위
- 페이지 간 데이터 전달 방식 (sessionStorage, URL 파라미터, 등)
- monk.js 프레임워크 중 어떤 모듈이 어떤 페이지에서 필요한지

#### 6. 서버(idphoto-kr) 영향도

페이지 분리 시 서버측 변경이 필요한지 여부:
- WebSocket 연결/해제에 서버측 변경 필요 여부
- API 엔드포인트 변경 필요 여부
- CF Pages Function 프록시 영향 여부

## 규칙

- 브랜치: develop
- **코드 수정 금지** — 순수 분석만
- 금지: main 푸시, prod 배포, .env 수정
- 에스컬레이션: 서버 수정 필요 판단 시 `⏳ 대기` 보고
- MEMORY.md 확인 의무 (★ 0원칙: MONK_kr/에서만 작업)

## 완료 기준

**조사 + 보고** — 위 6개 분석 항목을 정리하여 보고. 코드 수정 없음.

보고서 저장 위치: `MONK_kr/ai_lab/photolab/PAGE_SPLIT_ANALYSIS.md`

## 완료 보고 형식

```
---
## 완료 보고
[YYYY-MM-DD HH:MM KST] {디바이스}/막내 → M1/쌍아

✅ 완료: {항목}
❌ 실패: {항목 + 원인}
💡 제안: {발견사항}
⏳ 대기: {필요 시}
📁 변경 파일: PAGE_SPLIT_ANALYSIS.md (신규 — 분석 보고서)
---
```

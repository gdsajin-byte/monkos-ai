---
type: portfolio
id: PF_CDP
name: CDP
subject: 로컬 CDP 브라우저 제어 — 에이전트 독립 브라우저 인프라
created: 2026-03-27
owner: 작가님
leads: 민아(검증·구현), 쌍아(설계)
status: active
---

# PF_CDP — 로컬 CDP 브라우저 제어

> 막내에게 레이더를 장착한다.
> 터미널 맹인 비행이던 막내가 브라우저를 직접 보고·치고·검증하는 전폭기가 되는 인프라.
> 크롬 확장 1석 점유 한계를 CDP로 돌파, 디바이스·에이전트별 독립 브라우저 제어 확보.
> 방안 C(하이브리드) 채택 — 현행 CDP 직접 호출로 운용, 패턴 잡히면 MCP 서버화.

---

## 1. 비전

**한(M4)·꾸(M2) 낮 세션에서 브라우저 MCP를 독립 운용할 수 있는 인프라**

### 왜 이것을 하는가

- Claude in Chrome 확장 = 1석 점유. 한/꾸에게 배당하면 다른 에이전트가 못 씀
- CDP 직접 제어는 포트별 독립 인스턴스 가능 — 디바이스·에이전트 간 충돌 제거
- 낮 세션(사무실) = 멀티 디바이스·멀티 에이전트 동시 가동 환경. 브라우저 제어가 공유 자원이면 병목
- M1 새벽 세션은 단독 운용이라 급하지 않음 — 사무실 낮 세션이 본 수요
- **핵심 전환**: 막내의 검증 루프를 막내 안에서 닫는다. 스크린샷·브라우저 타이핑·데이터 수집을 직접 수행 → 작가님 개입 최소화 → 생산력 = 지시서 품질 × 막내 가동 수 × 도구 범위

### 검증 완료 사항 (3/26 민아)

| 기능 | 방법 | 결과 |
|------|------|------|
| 탭 조회/전환 | `GET /json`, `Target.activateTarget` | ✅ |
| JS 실행 | `Runtime.evaluate` | ✅ |
| URL 이동 | `Page.navigate` | ✅ |
| 스크린샷 | `Page.captureScreenshot` (10MB) | ✅ |
| 마우스 클릭 | `Input.dispatchMouseEvent` | ✅ |
| 직접 타이핑 | `Input.insertText` (한글/이모지) | ✅ |
| 키보드 입력 | `Input.dispatchKeyEvent` | ✅ |
| 실전 블로그 작성 | 어드민 에디터 풀 페이지 | ✅ |

### 성공 지표

| 지표 | 시작점 (3/26) | Phase 1 목표 | Phase 2 목표 |
|------|-------------|-------------|-------------|
| MCP 배당 가능 디바이스 | iMac만 (확장 점유) | M4·M2 독립 배당 | 전 디바이스 자율 |
| 반복 작업 자동화 수준 | 매번 인라인 Python | 유틸 라이브러리 | MCP 서버 도구 호출 |
| 어드민 작업 커버리지 | 블로그 글쓰기 | +이미지 일괄 +FAQ | 전 어드민 기능 |

---

## 2. 히스토리

> **append only. 수정·삭제 금지.**

| 날짜 | 주체 | 내용 | 산출물 | 상태 |
|------|------|------|--------|------|
| 03/26 | iMac/민아 | CDP 전 기능 검증 + cdp.sh 생성 | `scripts/tools/cdp.sh` | ✅ |
| 03/26 | iMac/민아 | MONKOS 어드민 블로그 에디터 실전 테스트 | 세션 로그 | ✅ |
| 03/26 | iMac/민아 | 작업명세(PROPOSAL) 제출 | `PROPOSAL_20260326_로컬CDP_브라우저제어_작업명세.md` | ✅ |
| 03/26 | iMac/쌍아 | 방안 C(하이브리드) 채택. PF 등록은 다음 세션 이관 | 세션 로그 | ✅ |
| 03/27 | M1/쌍아 | PF_CDP 발족 | `PF_CDP.md` | ✅ |
| 03/27 | M1/쌍아 | Phase 1 코드수집 지시서 발행 → iMac/민아 | `ORDER_20260327_...CDP_Phase1_코드수집.md` | ⏳ |

---

## 3. Phase 현황

### Phase 0 — 검증 ✅ 완료 (03/26)

| 항목 | 상태 | 담당 | 비고 |
|------|------|------|------|
| CDP 프로토콜 전 기능 테스트 | ✅ | iMac/민아 | WebSocket 직접 호출 |
| cdp.sh 간이 CLI 도구 | ✅ | iMac/민아 | `scripts/tools/cdp.sh` |
| 어드민 블로그 에디터 실전 검증 | ✅ | iMac/민아 | 풀 페이지 작성 완료 |
| 방안 선택 | ✅ | 작가님 | 방안 C(하이브리드) 채택 |

### Phase 1 — 실전 코드 수집 + 유틸 패키지화 ⏳ 대기

| 항목 | 상태 | 담당 | 비고 |
|------|------|------|------|
| 민아 세션 인라인 Python 수집 | ⏳ | iMac/민아 | 세션 컨텍스트에 잔존. 사무실 낮 세션에서 수집 |
| 수집 코드 → `scripts/tools/cdp_utils.py` 패키지화 | ⏳ | iMac/민아 | 클릭·타이핑·서식·이미지삽입 패턴 |
| 에디터 조작 노하우 코드화 | ⏳ | iMac/민아 | Toast UI editor API, ProseMirror 포커스 패턴 |
| 한(M4)·꾸(M2) 설치 가이드 | ⏳ | 쌍아 | cdp.sh + cdp_utils.py + 의존성 1줄 설치 |
| 멀티 포트 동시 운용 테스트 | ⏳ | 미정 | 에이전트별 독립 인스턴스 |

### Phase 2 — MCP 서버화 + 멀티탭 (방안 B 합류)

| 항목 | 상태 | 담당 | 비고 |
|------|------|------|------|
| MCP 서버 래핑 | — | — | Phase 1 패턴 안정화 후 판단 |
| 멀티탭 동시 제어 | — | — | 원 탭 고정 → 탭 간 전환·병렬 조작 |
| 웹서치 자동화 | — | — | 검색→수집→분석 파이프라인 |
| 어드민 매크로 | — | — | 블로그 글쓰기, 이미지 삽입 등 |
| 스프레드 전략 연동 | — | — | PF_SPREAD 콘텐츠 배포 자동화 |

> **병행 추적**: 클라우드 확장(Anthropic)도 빠르게 개선 중. CDP 자체 도구화와 확장 기능 향상을 동시 추적하여, 최종적으로 웹서치·직접 작업·스프레드 전략에 활용.

---

## 4. 성과

> 실측 데이터. 측정일 명시. 추정 금지.

| 항목 | 수치 | 측정일 | 비고 |
|------|------|--------|------|
| CDP 검증 기능 수 | 8/8 (전수 통과) | 03/26 | 탭·JS·이동·스크린샷·클릭·타이핑·키보드·이미지 |

---

## 5. 복기

### 교훈 1: MCP 패키지 vs CDP 직접 호출

**현상**: chrome-devtools-mcp 패키지가 `get_page_content`, `execute_javascript`에서 "Chrome is not running" 에러
**원인**: MCP 패키지의 크롬 감지 버그. CDP 프로토콜 자체는 정상
**대응**: 외부 패키지 디버깅(방안 A) 대신 CDP 직접 호출(방안 C) 채택. 의존성 최소화

### 교훈 2: ProseMirror 에디터 포커스

**현상**: `element.focus()` JS만으로는 타이핑 미동작
**원인**: ProseMirror가 마우스 이벤트 기반으로 포커스 상태 관리
**대응**: 반드시 `Input.dispatchMouseEvent`로 클릭 후 `Input.insertText`

---

## 6. 관련 문서 인덱스

### 기안서 (PROPOSAL)

| 파일 | 주체 | 내용 | 상태 |
|------|------|------|------|
| `monkos-ops/ops/proposals/PROPOSAL_20260326_로컬CDP_브라우저제어_작업명세.md` | iMac/민아 | CDP 독립 운용 검증 + 방안 3가지 | ✅ 방안C 채택 |

### 기술명세 (SPEC)

| 파일 | 주체 | 내용 |
|------|------|------|
| — | — | — |

### 보고서 (REPORT)

| 파일 | 주체 | 내용 |
|------|------|------|
| — | — | — |

### 지시서 (ORDER)

| 파일 | 수신 | 내용 | 상태 |
|------|------|------|------|
| `monkos-ops/ops/orders/2026-03/ORDER_20260327_M1쌍아_iMac민아_PF_CDP_Phase1_코드수집.md` | iMac/민아 | 세션 인라인 코드 수집 + cdp_utils.py 패키지화 | ⏳ |

### 커밋

| 해시 | 날짜 | 내용 |
|------|------|------|
| — | — | — |

---

## 7. 리스크

| 리스크 | 확률 | 대응 |
|--------|------|------|
| Chrome 디버깅 포트 보안 노출 | 낮음 | localhost 바인딩만 허용, 외부 접근 불가 |
| CDP 프로토콜 버전 변경 | 낮음 | Stable 도메인(Runtime, Page, Input)만 사용 |
| 에디터 API 변경 (Toast UI → 타 에디터) | 중간 | Phase 1에서 에디터 추상화 레이어 고려 |

---

## 8. 기술 참조

### CDP 연결 구조
```
에이전트 (민아/막내)
  → python3 + websockets
    → ws://127.0.0.1:{PORT}/devtools/page/{TARGET_ID}
      → Chrome (디버깅 인스턴스, 별도 프로필)
```

### 핵심 CDP 명령어
```
Runtime.evaluate         — JS 실행
Page.navigate            — URL 이동
Page.captureScreenshot   — 스크린샷 (clip 옵션, max_size 10MB)
Input.dispatchMouseEvent — 마우스 클릭 (mousePressed + mouseReleased)
Input.insertText         — 텍스트 입력 (한글/이모지)
Input.dispatchKeyEvent   — 키보드 입력 (Enter, 단축키)
```

### 주의사항
- 스크린샷: WebSocket `max_size` 기본 1MB → 10MB 확장 필요
- ProseMirror: `innerHTML` 직접 주입 불가 → `window.editor.setHTML()` 또는 클릭+insertText
- dpr=2 환경: 스크린샷/클릭 좌표 = CSS pixel 기준 (일치)

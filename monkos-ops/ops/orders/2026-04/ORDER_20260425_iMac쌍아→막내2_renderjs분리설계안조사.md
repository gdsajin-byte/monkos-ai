---
type: order
id: ORDER_20260425_renderjs분리설계안
date: 2026-04-25
from: iMac/쌍아
to: iMac/막내2
subject: render.js 2,362줄 모듈 분리 최적 설계안 조사 — 코드 관점
priority: high
status: 대기
affects: monkos_AI/portal/lib/cms/render.js, server.js
related: REPORT_20260425_막내2_포털프론트엔드구조진단.md, DESIGN_20260425_철창이_포털v5_타일그리드_전면개편_제안서.md
---

# 지시서 — render.js 모듈 분리 최적 설계안 조사

## 0. 배경

render.js가 2,362줄로 포화 상태. 작가님의 79 리팩토링 원칙에 따르면 2,000줄은 분기 신호.
현재 이 파일 하나에 블로그·FAQ·specs·gallery·board·guide·pricing·홈 렌더러가 전부 들어있다.

여기에 v5 타일 그리드 렌더러까지 추가하면 3,000줄을 넘기게 되므로,
**v5 작업 전에 render.js를 먼저 분리**하는 것이 전제 조건.

## 1. 조사 범위

### 1-1. render.js 내부 구조 분석

render.js를 읽고 다음을 파악:

- **함수 목록 전수**: 함수명 + 시작행 + 끝행 + 줄 수 + 의존 함수(같은 파일 내 호출)
- **공유 유틸**: 여러 함수가 공통으로 쓰는 헬퍼 (layoutShell, layoutNav, 공통 HTML 빌더 등)
- **데이터 의존**: 각 함수가 Firestore/specs-data.json/정적 데이터 중 뭘 쓰는지
- **export 맵**: 외부(server.js, home.js 등)에서 import하는 함수 목록

### 1-2. 분리 후보 그룹핑

위 분석 기반으로, render.js를 **어떤 단위로 쪼갤 수 있는지** 후보안 2~3개 제시.

**각 안에 대해 다음을 평가:**
- 분리 후 각 파일의 예상 줄 수
- 공유 유틸 처리 방식 (별도 파일 vs 각 파일 복제 vs re-export)
- server.js / home.js의 import 변경 범위
- 순환 의존 위험 여부
- v5 타일 렌더러가 어디에 붙는지

### 1-3. 기존 패턴 조사

현재 lib/cms/ 아래 다른 파일들(blog.js 284줄, board.js 333줄 등)의 모듈 패턴을 분석하고,
render.js 분리 시 이 패턴과 일관성을 유지할 수 있는지 확인.

## 2. 제약 조건

- **서비스 분리 금지**: Cloud Run 서비스는 monkos-portal 단일 유지. 프론트/백 분리 없음.
- **SSR 유지**: 100% SSR 구조 변경 없음. CSR 전환 제안 불필요.
- **v4-preview 구조 활용**: v5는 기존 preview 태그 방식으로 배포.
- **Fragment+Shell 패턴 유지**: layoutShell() 구조는 검증됨. 파괴적 리팩토링 불필요.

## 3. 산출물

`monkos-ops/ops/reports/REPORT_20260425_막내2_renderjs분리설계안.md`

```
§1 render.js 함수맵 (함수명 / 행 범위 / 줄 수 / 의존 / export 여부)
§2 공유 유틸 목록 (여러 함수가 공통 사용하는 헬퍼)
§3 분리 후보안 2~3개 (각 안: 파일 구성 + 예상 줄 수 + 장단점)
§4 추천안 + 근거
§5 v5 타일 렌더러 삽입 위치 제안
```

## 4. 주의

- 코드 수정 금지. 읽기·분석만.
- 줄 수는 정확히 세기. "약 N줄" 금지.

---

**완료 보고**: 리포트 파일 작성 → 보고

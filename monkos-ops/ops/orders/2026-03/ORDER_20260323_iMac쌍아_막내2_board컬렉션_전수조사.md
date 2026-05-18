---
type: ORDER
id: ORDER_20260323_board컬렉션_전수조사
date: 2026-03-23
from: iMac/쌍아
to: iMac/막내2
status: 발행
priority: P1
---

# 지시서: board vs board_posts 컬렉션 전수 조사

## 1. 목적

Firestore에 `board`와 `board_posts` 두 개의 게시판 컬렉션이 존재한다. 같은 데이터의 이중 참조인지, 별도 테이블인지 전수 조사하여 보고한다. 코드 수정은 하지 않는다.

## 2. 발견 경위

Firestore 통합 보고 과정에서 확인:
- `board_posts` — CMS 게시판 CRUD (`lib/cms/board.js`, `lib/cms/render.js`)
- `board` — 홈 프리뷰 쿼리 (`lib/cms/home.js:160`)

## 3. 조사 항목

### A. 코드 참조 전수 목록

아래 파일들에서 `board` 및 `board_posts` 컬렉션 참조를 **전부** 찾아 나열:
- `lib/cms/board.js` — CRUD 핸들러
- `lib/cms/render.js` — SSR 렌더링
- `lib/cms/home.js` — 홈 SSR
- `server.js` — 라우트
- `public/` 하위 JS — 클라이언트 API 호출
- 기타 `lib/` 하위 전체

각 참조별로:
- 파일명:줄번호
- 사용하는 컬렉션명 (`board` or `board_posts`)
- 쿼리 내용 (where 조건, orderBy 등)
- 사용하는 필드 목록

### B. 스키마 비교

두 컬렉션이 사용하는 필드를 코드에서 추출하여 비교:

| 필드 | `board` | `board_posts` | 비고 |
|------|---------|---------------|------|
| title | ? | ? | |
| content | ? | ? | |
| answered | ? | ? | |
| createdAt | ? | ? | |
| ... | | | |

### C. 판정

아래 중 하나로 결론:
1. **동일 데이터 이중 참조 (버그)** — 하나의 컬렉션명으로 통일 필요
2. **의도적 분리** — 서로 다른 용도의 별도 테이블
3. **마이그레이션 잔재** — 옛 이름이 남아있는 것

판정 근거를 코드 증거와 함께 명시할 것.

### D. 수정 방안 (판정 결과에 따라)

동일 데이터인 경우:
- 어느 쪽으로 통일할지 제안
- 수정 대상 파일·줄번호 목록
- 영향 범위 (SSR, 어드민, API)

## 4. 보고 형식

파일명: `REPORT_20260323_막내2_board컬렉션_전수조사.md`
위치: `monkos-ops/ops/reports/`

## 5. 유의 사항

⚠️ **코드 수정 금지** — 조사·보고만 수행
⚠️ **헌법 제1조 1항** — 타임스탬프 `date` 명령 취득
⚠️ **헌법 제2조 1항** — 완료 보고 필수 (✅❌💡 형식)

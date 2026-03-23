---
type: ORDER
id: ORDER_20260323_홈블록에디터_사전리서치
date: 2026-03-23
from: iMac/쌍아
to: 막내 (전원)
status: 발행
priority: P1
ref: PROPOSAL_20260323_홈블록에디터_Phase0_기안서
---

# 지시서: 홈 블록 에디터 Phase 0 — 사전 리서치

## 1. 목적

홈 블록 에디터 Phase 0 기안서의 실행에 앞서, **기존 코드 충돌·서비스 동선·기능 혼선 가능성을 사전에 파악**하고 보고서로 정리한다. 코드 수정은 하지 않는다. 리서치와 보고만 수행한다.

## 2. 배경 숙지 (필독)

기안서를 먼저 정독할 것:
- `monkos-ops/ops/proposals/PROPOSAL_20260323_홈블록에디터_Phase0_기안서.md`

**핵심 요약**: 메인 페이지(index.html)의 하드코딩된 14개 영역을 Firestore `site_config/layout` 블록 데이터로 이관. SSR(home.js)이 블록 데이터를 읽어 렌더링. 어드민(layout.html)에서 편집.

## 3. 리서치 항목

### A. SSR 충돌 분석 — `home.js` regex replace 체인

현재 `renderHome()`은 index.html 템플릿을 regex replace로 순차 교체한다.

**조사할 것:**
1. 현재 regex replace 순서를 전부 나열 (갤러리 → 인트로 → 매거진 → 태그 → 블로그 → FAQ → 게시판)
2. 각 regex 패턴이 의존하는 HTML 앵커 문자열 목록 (예: `class="gallery-track"`, `class="faq-list"` 등)
3. 새 블록 (hero, user-bar, nav, service-cards, howto, guide, credit, footer) 교체 시 **기존 regex 앵커가 깨질 가능성** 분석
4. 교체 순서 의존성: A 블록 교체가 B 블록의 앵커 문자열을 변경하는 경우가 있는지

**산출물**: regex 의존성 맵 + 충돌 위험 목록

### B. i18n.js `applyLang()` 영향 분석

SSR이 언어별로 렌더링하면 클라이언트 `applyLang()`의 DOM 조작과 충돌할 수 있다.

**조사할 것:**
1. `applyLang()`이 조작하는 DOM 요소 ID/selector 전체 목록
2. 이 중 SSR 블록 렌더링으로 대체되는 요소 목록 (= 제거 대상)
3. SSR과 `applyLang()` 양쪽에서 동시에 건드리는 요소가 있는지 → **이중 적용 위험**
4. `setLang()` → `window.location.href = '/?lang=...'` 리다이렉트 경로에서 SSR 블록 데이터가 정상 반영되는지 흐름 추적
5. i18n.js에서 제거 가능한 키 목록 vs 반드시 유지해야 하는 키 목록 (모달·챗봇 등 SSR 범위 밖)

**산출물**: i18n 키 이관 매핑표 (키명 → 블록ID → 제거 가능 여부)

### C. 서비스 동선 분석

**조사할 것:**
1. 메인 페이지에서 사용자가 클릭할 수 있는 **모든 링크/버튼** 목록 (href, onclick)
2. 각 링크의 현재 동작 (네비게이션, 모달 열기, 외부 이동 등)
3. 블록 데이터화 후 동선이 바뀌거나 끊길 수 있는 지점
4. 특히 CTA 버튼(`btn-shoot`), 로그인 버튼, 크레딧 뱃지의 onclick 핸들러가 SSR 교체 후에도 정상 바인딩되는지
5. FAQ 프리뷰 → `/faq#앵커` 링크 전환 시 FAQ 전문 페이지(render.js `renderFaq`)에서 앵커 수신 처리가 가능한지

**산출물**: 동선 체크리스트 (현재 동작 → Phase 0 후 예상 동작 → 위험도)

### D. 어드민 layout.html 현황 분석

**조사할 것:**
1. 현재 layout.html의 API 호출 구조 (`/api/admin/layout` GET/PUT)
2. 현재 저장되는 데이터 형식과 기안서 스키마의 차이점
3. 기존 layout.html 코드 중 재사용 가능한 부분 vs 전면 재작성 필요한 부분
4. 다른 어드민 페이지(faq.html, gallery.html 등)에서 참고할 수 있는 편집 모달 패턴

**산출물**: layout.html 확장 설계 메모

### E. Firestore 스키마 정합성

**조사할 것:**
1. `site_config` 컬렉션의 현재 문서 구조 (`main`, `layout` 등)
2. 기안서의 14개 블록 스키마가 Firestore 문서 크기 제한(1MB)에 문제 없는지
3. 다국어 텍스트 `{ ko, ja, en }` 패턴이 기존 Firestore 데이터(faq_items, blog_posts)의 lang 필드 방식과 어떻게 다른지, 향후 통합 시 문제 없는지

**산출물**: 스키마 정합성 메모

## 4. 보고 형식

보고서 파일명: `REPORT_20260323_막내N_홈블록에디터_사전리서치.md`
저장 위치: `monkos-ops/ops/reports/`

```markdown
---
type: REPORT
date: 2026-03-23
agent: {디바이스}/막내N
ref: ORDER_20260323_홈블록에디터_사전리서치
---

# 홈 블록 에디터 Phase 0 — 사전 리서치 보고서

## A. SSR 충돌 분석
(regex 의존성 맵 + 충돌 위험 목록)

## B. i18n 영향 분석
(키 이관 매핑표)

## C. 서비스 동선 분석
(동선 체크리스트)

## D. 어드민 layout.html 분석
(확장 설계 메모)

## E. Firestore 스키마 정합성
(스키마 메모)

## F. 종합 리스크 판정
(위험도 高/中/低 + 대응 방안)
```

## 5. 유의 사항

⚠️ **준수 조항**
- **코드 수정 금지**: 이번 지시서는 리서치 전용. 파일 수정·커밋·배포 일체 금지
- **헌법 제2조 1항**: 완료 보고 필수 (✅❌💡⏳📁🔀 형식)
- **헌법 제1조 1항**: 모든 타임스탬프 `date` 명령으로 취득

## 6. 지시서 발급 플로우 숙지

이 리서치 보고서가 승인되면, 후속 지시서는 아래 순서로 발행된다:

```
[현재] 사전 리서치 (본 지시서) → 보고서 제출
   ↓ 작가님 리뷰 + 쌍아 보정
[단계 1] #1 Firestore 시딩 스크립트
   ↓
[단계 2] #2 SSR 헤더+메인 / #3 SSR 사이드바+푸터 / #4 layout.html 확장 / #5 FAQ+갤러리
   ↓
[단계 3] #6 i18n 정리 + 대시보드 / #7 통합 검증+배포
```

각 단계의 지시서는 이전 단계 완료 후 쌍아가 발행한다. 막내는 리서치 보고서에서 발견한 위험 요소를 각 단계 실행 시 참조할 수 있도록 명확히 기록할 것.

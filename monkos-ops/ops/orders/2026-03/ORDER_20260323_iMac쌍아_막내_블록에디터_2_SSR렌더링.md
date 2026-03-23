---
type: ORDER
id: ORDER_20260323_블록에디터_2_SSR
date: 2026-03-23
from: iMac/쌍아
to: 막내
status: 발행 (단계1 완료 후 실행)
priority: P0
ref:
  - PROPOSAL_20260323_홈블록에디터_Phase0_기안서
  - REPORT_20260323_막내1_홈블록에디터_사전리서치
seq: "단계2-A — 지시서 #1(시딩) 완료 후 실행"
depends: ORDER_20260323_블록에디터_1_시딩
---

# 지시서 #2: SSR 블록 렌더링 — 전체 (헤더+메인+사이드바+푸터)

## 1. 목적

`renderHome()`에서 Firestore `site_config/layout` 블록 데이터를 읽어 index.html 템플릿의 하드코딩 영역을 SSR로 교체한다.

## 2. 수정 대상

**파일**: `monkos_AI/portal/lib/cms/home.js`

## 3. 작업 내용

### 3-1. layout 데이터 로드

`renderHome()` 상단에서 기존 Firestore 병렬 로드에 layout 추가:

```javascript
const [configSnap, postsSnap, gallerySnap, layoutSnap] = await Promise.all([
  siteConfigRef.get().catch(() => null),
  blogCollection.where('published', '==', true).orderBy('createdAt', 'desc').get().catch(() => ({ docs: [] })),
  galleryCollection.where('published', '==', true).orderBy('order', 'asc').get().catch(() => ({ docs: [] })),
  layoutConfigRef.get().catch(() => null),   // ← 추가
]);
```

layout 데이터에서 언어별 텍스트 선택 헬퍼:

```javascript
const lang = reqUrl.searchParams.get('lang') || 'ko';
function lt(obj) { return (obj && obj[lang]) || obj?.ko || ''; }  // lang text
```

### 3-2. 블록별 regex replace 구현

layout 데이터에서 각 블록을 찾아 HTML 생성 → regex replace. **fallback: layout 없으면 기존 하드코딩 유지**.

| 블록 | 교체 대상 앵커 | 생성 HTML |
|------|---------------|-----------|
| hero | `<div class="hero">` ~ `</div></div>` (hero 끝) | title, tagline 주입 |
| user-bar | `.btn-shoot` 텍스트만 | CTA 문구 교체 |
| gallery-strip | 기존 SSR 유지 | maxItems 적용 |
| nav | `<nav>` ~ `</nav>` 내부 링크 | 메뉴 items 언어별 렌더 |
| service-cards | `<div class="svc-grid">` ~ 끝 | items 순회, 카드 HTML |
| howto | `<div class="howto-grid">` ~ 끝 | items 순회, 카드 HTML |
| guide | 우측 사이드바 `.guide-card` 2개 | items 순회, 카드 HTML |
| credit-info | `.credit-info` 전체 | data에서 rows/promo 렌더 |
| footer | `<footer>` ~ `</footer>` | links/copyright 렌더 |

### 3-3. Firestore 동적 블록 설정 반영

faq-preview, board-preview, blog-cards, magazine, tags — 이미 SSR 중. layout에서 `maxItems`와 `header` 설정만 적용:

- FAQ: `.limit(3)` → `.limit(layout.faq-preview.data.maxItems || 3)`
- Board: `.limit(5)` → `.limit(layout.board-preview.data.maxItems || 5)`
- Blog: `.slice(0, 4)` → `.slice(0, layout.blog-cards.data.maxItems || 4)`
- Magazine: `.slice(0, 4)` → `.slice(0, layout.magazine.data.maxItems || 4)`
- 섹션 헤더(sec-h)의 h2/a 텍스트를 layout 데이터에서 언어별로 렌더

### 3-4. board 컬렉션 버그 수정 (이미 완료)

쌍아가 `board` → `board_posts`, `answered` → `published` + replies 판단으로 수정 완료 (home.js:160~). 이 수정을 유지할 것. 덮어쓰지 말 것.

## 4. ⚠️ 준수 조항 — 사전 리서치 반영

### 🔴 高위험: CTA 바인딩 class명 보존

main.js가 DOMContentLoaded에서 아래 selector로 이벤트 바인딩함:
- `document.querySelector('.btn-shoot')` (main.js:38)
- `document.querySelector('.svc.live')` (main.js:49)

**SSR로 교체한 HTML에 반드시 `.btn-shoot`, `.svc.live`, `.svc-link` class를 보존할 것.**

### 🟡 中위험: inline onclick 보존

user-bar의 아래 요소들은 inline onclick을 사용:
- `#headerLoginBtn` → `onclick="headerLogin()"`
- `#creditBadge` → `onclick="openCreditShop()"`
- `#providerBadge` → `onclick="toggleLogoutPopover()"`
- `#chatFab` → `onclick="openChat()"`

**SSR로 user-bar 교체 시 이 onclick 속성들을 그대로 보존할 것.** 또는 user-bar는 CTA 문구(btn-shoot 텍스트)만 교체하고 나머지는 건드리지 않는 방식도 가능.

### 🟢 regex 교체 순서

사전 리서치에서 확인된 안전한 교체 순서:
1. gallery-strip (기존 유지, maxItems만 적용)
2. hero
3. user-bar (CTA 텍스트만)
4. nav
5. intro (기존 유지)
6. service-cards
7. howto
8. FAQ (기존 유지 + header 언어화 + maxItems)
9. board (기존 유지 + header 언어화 + maxItems)
10. blog (기존 유지 + header 언어화 + maxItems)
11. magazine (기존 유지 + maxItems)
12. tags (기존 유지 + maxTags)
13. guide
14. credit-info
15. footer

## 5. 검증

- `/?lang=ko`, `/?lang=ja`, `/?lang=en` 세 언어 모두에서 정상 렌더링
- CTA 버튼 클릭 → `getCtaUrl()` 이동 정상
- 로그인/크레딧/챗봇 모달 정상 작동
- layout 문서 없을 때 fallback (기존 하드코딩) 정상
- 기존 블로그/FAQ/게시판 SSR 기능 유지

## 6. 유의 사항

⚠️ **코드 수정 범위**: `lib/cms/home.js` 1개 파일만 수정. index.html, i18n.js, main.js는 이 지시서에서 수정 금지 (단계3에서 처리)
⚠️ **헌법 제4조 1항**: API 키·비밀정보 하드코딩 금지
⚠️ **헌법 제1조 1항**: 타임스탬프 `date` 취득
⚠️ **헌법 제2조 1항**: 완료 보고 필수

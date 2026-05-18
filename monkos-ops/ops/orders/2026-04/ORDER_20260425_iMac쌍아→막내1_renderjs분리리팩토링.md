---
type: order
id: ORDER_20260425_renderjs분리리팩토링
date: 2026-04-25
from: iMac/쌍아
to: iMac/막내1
subject: render.js 2,362줄 → 7파일 모듈 분리 리팩토링 (동작 불변)
priority: high
status: 완료 (rev 00231, 2026-04-25 16:58 KST)
affects: monkos_AI/portal/lib/cms/render.js
related:
  - REPORT_20260425_막내2_renderjs분리설계안.md
  - REPORT_20260425_막내3_v5배포아키텍처설계안.md
  - PF_PORTAL.md
---

# 지시서 — render.js 모듈 분리 리팩토링

## 0. 목적

render.js 2,362줄이 포화 상태. 79 리팩토링 원칙(2,000줄 분기선)에 따라
**동작 변경 0인 순수 모듈 분리**를 실행한다.

이 작업은 v5 타일 개편의 전제 조건이지만, v5와 무관한 독립 리팩토링이다.

## 1. 사전 백업 (착수 전 필수)

```bash
# 1. 현재 프로덕션 render.js 백업
cp monkos_AI/portal/lib/cms/render.js monkos_AI/portal/lib/cms/render.js.bak

# 2. 현재 커밋 해시 기록
git log --oneline -1
# → 이 해시가 롤백 지점
```

⚠️ 백업 완료 보고 후 분리 작업 착수.

## 2. 분리 구조 (막내2 안 C 채택)

```
lib/cms/
├── render-shell.js     ← 공유 (layoutHead/Nav/Footer/Shell + escapeHtml + stripHtml + getSeoDescription + marked)  ~140줄
├── render-blog.js      ← blogListFragment + blogPostFragment + renderBlogList + renderBlogPost                     ~410줄
├── render-board.js     ← boardListFragment/Post/Write + renderBoardList/Post/Write                                ~310줄
├── render-static.js    ← faqFragment + renderFaq + galleryFragment + renderGallery + guideFragment + renderGuide   ~440줄
├── render-specs.js     ← SPECS_DATA/I18N/STYLE + locField + specsListFragment/Detail + renderSpecsList/Detail      ~700줄
├── render-pricing.js   ← PRICING_DATA + pricingFragment + renderPricing                                           ~270줄
├── render-sitemap.js   ← renderSitemap                                                                            ~80줄
├── render.js           ← barrel re-export (server.js import 변경 0)                                               ~15줄
└── render.js.bak       ← 원본 백업 (작업 완료 후 삭제 가능)
```

## 3. 작업 순서

### Step 1: render-shell.js 생성
- render.js에서 추출: `escapeHtml`, `stripHtml`, `getSeoDescription`, `blogRenderer`(marked), `layoutHead`, `layoutNav`, `layoutFooter`, `layoutShell`
- Firestore collection 참조(`blogCollection`, `faqCollection` 등)는 각 도메인 파일로 이동
- `marked` import도 이 파일에서 수행

### Step 2: 도메인별 파일 생성
각 파일은 `render-shell.js`에서 필요한 유틸/셸을 import.

- **render-blog.js**: `blogListFragment`, `blogPostFragment`, `renderBlogList`, `renderBlogPost` + `blogRenderer` 사용
- **render-board.js**: `boardListFragment`, `boardPostFragment`, `boardWriteFragment`, `renderBoardList`, `renderBoardPost`, `renderBoardWrite`
- **render-static.js**: `faqFragment`, `renderFaq`, `galleryFragment`, `renderGallery`, `guideFragment`, `renderGuide`
- **render-specs.js**: `SPECS_DATA`, `SPECS_I18N`, `SPECS_PAGE_STYLE`, `locField`, `specsListFragment`, `specsDetailFragment`, `renderSpecsList`, `renderSpecsDetail`
- **render-pricing.js**: `PRICING_DATA`, `pricingFragment`, `renderPricing`
- **render-sitemap.js**: `renderSitemap` (SPECS_DATA는 render-specs.js에서 re-export하거나 직접 JSON import)

### Step 3: barrel render.js 작성
```js
// render.js — barrel re-export (server.js import 변경 0)
export { layoutShell } from './render-shell.js';
export { blogListFragment, renderBlogList, blogPostFragment, renderBlogPost } from './render-blog.js';
export { boardListFragment, renderBoardList, boardPostFragment, renderBoardPost, boardWriteFragment, renderBoardWrite } from './render-board.js';
export { faqFragment, renderFaq, galleryFragment, renderGallery, guideFragment, renderGuide } from './render-static.js';
export { specsListFragment, specsDetailFragment, renderSpecsList, renderSpecsDetail } from './render-specs.js';
export { pricingFragment, renderPricing } from './render-pricing.js';
export { renderSitemap } from './render-sitemap.js';
```

### Step 4: 검증
```bash
# 1. 로컬 서버 기동
cd monkos_AI/portal && node server.js

# 2. 전 SSR 페이지 렌더 확인 (각 페이지 curl로 200 + 콘텐츠 확인)
for path in / /blog /faq /pricing /specs /specs/korea-passport /gallery /guide /board /sitemap.xml /ja/blog /en/blog /ja/specs /en/specs /ja/faq /en/faq /ja/pricing /en/pricing; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8080$path")
  echo "$path → $status"
done

# 3. JSON-LD 보존 확인 (홈)
curl -s http://localhost:8080/ | grep -c 'application/ld+json'

# 4. hreflang 보존 확인 (specs)
curl -s http://localhost:8080/specs/korea-passport | grep -c 'hreflang'
```

**전 페이지 200 + 콘텐츠 정상 확인 후에만 다음 단계 진행.**

### Step 5: 배포
```bash
./monkos_AI/portal/deploy.sh
```

### Step 6: 프로덕션 실측
```bash
for path in / /blog /faq /pricing /specs /specs/korea-passport /gallery /guide /board /sitemap.xml; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "https://monkos.ai$path")
  echo "$path → $status"
done
```

## 4. 절대 금지

- **함수 로직 수정 금지** — 파일 이동만. 동작 변경 0이 핵심.
- **export 시그니처 변경 금지** — server.js/home.js의 import가 깨지면 안 됨.
- **Firestore 쿼리 변경 금지** — 데이터 흐름 불변.
- **barrel render.js 이외의 방식으로 server.js 수정 금지**.

⚠️ 준수 조항:
- 배포는 반드시 deploy.sh 경유 (법률 5장 2조)
- render.js.bak 삭제는 프로덕션 검증 완료 후 별도 승인

---

**완료 보고**: 백업 완료 → 분리 완료 → 로컬 검증 → 배포 → 프로덕션 실측 → 보고 (각 단계 타임스탬프 포함)

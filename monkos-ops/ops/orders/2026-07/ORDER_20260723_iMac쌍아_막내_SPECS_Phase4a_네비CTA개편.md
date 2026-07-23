---
type: order
date: 2026-07-23
device: iMac
agent: 쌍아
target: 막내
status: 대기
portfolio: PF_SPECS
---

# Phase 4a — 네비 제품 승격 + 히어로 CTA → /specs

**[2026-07-23 15:20 KST]** iMac/쌍아 → 막내

> 설계: [DESIGN_20260723_SPECS_SSG전환_IDPASS쉘_점진이관.md](../../tech/designs/2026-07/DESIGN_20260723_SPECS_SSG전환_IDPASS쉘_점진이관.md) Phase 4a
> 배경: 현재 홈 히어로 ID Photo 카드의 CTA가 kr→idphoto-kr, jp→idphoto-jp, 글로벌→/headshot으로 분산. T0 무료 개방된 specs 퍼널로 보내지 않음. 네비에 제품이 0개(전부 콘텐츠/지원 페이지).

---

## ⚠️ 준수 조항

- ch2 코딩 규칙: 한국어 우선, Tailwind 클래스 우선
- ch2 7조: 인프라 상수 정본 집중 — URL 직조립 금지, specsUrl 경유
- 브랜딩 ch8: 외부 대면에서 "IDPASS" 명칭 아직 미사용 — 이번은 현행 표기 유지, IDPASS 명칭 노출은 Phase 4b(쉘 확정 후)

---

## 작업 항목

### A. 히어로 ID Photo 카드 CTA 통일 (home.js)

**현재** (home.js:483~485):
```javascript
const idphotoUrl = req.paymentRegion === 'kr' ? 'https://idphoto-kr.monkos.ai/'
  : req.paymentRegion === 'jp' ? 'https://idphoto-jp.monkos.ai/'
  : `${prefix}/headshot`;
```

**변경**:
```javascript
const idphotoUrl = `${prefix}/specs`;
```

- 전 리전 공통으로 `/specs` (ko) 또는 `/{lang}/specs` (en, ja 등)로 연결.
- T0 무료 퍼널로 직결.

### B. 도메인 라벨 제거 (home.js)

**현재** (home.js:311):
```html
<span class="mk-id-domain">idphoto.monkos.ai</span>
```

**변경**: 제거하거나 `MONKOS AI` 등 브랜드 라벨로 교체.
- 외부 서브도메인 하드코딩은 동선 혼란 유발.

### C. 네비 제품 승격 (render-shell.js)

**현재** (render-shell.js:136~143):
```html
<nav class="header-nav">
  <a href="${prefix}/blog">Blog</a>
  <a href="${prefix}/faq">FAQ</a>
  <a href="${prefix}/gallery">Gallery</a>
  <a href="${prefix}/board">Board</a>
  <a href="${prefix}/guide">Guide</a>
  <a href="${prefix}/pricing">Pricing</a>
</nav>
```

**변경**:
```html
<nav class="header-nav">
  <a href="${prefix}/specs">ID Photo</a>
  <a href="${prefix}/headshot">Headshot</a>
  <a href="${prefix}/pricing">Pricing</a>
  <a href="${prefix}/blog">Blog</a>
  <a href="${prefix}/guide">Guide</a>
</nav>
```

- 제품(ID Photo, Headshot)을 앞으로 승격.
- Gallery, Board는 트래픽/기능 미미하므로 제거.
- FAQ는 guide로 흡수 가능, 네비에서 제거.
- 순서: 제품 → 가격 → 콘텐츠

### D. 푸터 링크 정합 (home.js)

**현재** (home.js:413~414):
```html
<a href="${prefix}/specs">${esc(d.navSpecs)}</a>
<a href="${prefix}/headshot">Headshot</a>
```

이 부분은 이미 /specs 링크가 있어 유지. 다만 네비 변경과 일관성 확인.

---

## 수정 대상 파일

| 파일 | 변경 내용 |
|------|----------|
| `monkos_AI/portal/lib/cms/home.js` | A(CTA 통일) + B(도메인 라벨) + D(푸터 확인) |
| `monkos_AI/portal/lib/cms/render-shell.js` | C(네비 제품 승격) |

---

## 검증

1. dev 배포 후 ko/en/ja 홈 확인 — 히어로 CTA가 /specs 계열로 연결
2. 네비가 제품 우선 순서로 표시
3. 하드코딩된 외부 도메인 잔존 0
4. 기존 /headshot, /blog, /guide, /pricing 페이지 접근에 회귀 없음
5. jest 통과

---

## 완료 보고

- 수발신 헤더 필수
- COMPLETION 파일 생성
- PF_SPECS 히스토리 1행 어펜드
- 커밋 → 푸시 (dev 배포까지, prod는 검증 후)

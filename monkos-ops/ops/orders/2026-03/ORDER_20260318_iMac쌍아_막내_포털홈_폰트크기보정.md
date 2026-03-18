---
type: order
from: iMac/쌍아
to: iMac/막내
date: 2026-03-18
status: 대기
---

# [지시서] 포털 홈 폰트 크기 보정 — 가독성 개선

> **[2026-03-18 15:33 KST] iMac/쌍아 → iMac/막내**
> 홈 페이지 폰트가 전반적으로 너무 작음. 블로그 페이지 대비 50~60% 수준.
> 모바일에서 눈 찌푸려야 읽힘. portal.css만 수정.

---

## 문제

| 요소 | 현재 | 블로그 | 차이 |
|------|:---:|:---:|------|
| 섹션 헤더 (.sec-h h2) | 14px | 28px | -50% |
| 카드 제목 (.bi-info h3) | 11px | 18px | -39% |
| 카드 설명 (.bi-info p) | 9px | 14px | -36% |
| 메타 정보 (.bi-info .meta) | 8px | 12px | -33% |
| 사이드바 제목 (.sb-t) | 8px | — | 극소 |
| 매거진 제목 (.mag-body h4) | 11px | — | — |
| 매거진 설명 (.mag-body p) | 9px | — | — |
| 가이드 카드 (.guide-label p) | 8px | — | 극소 |
| body line-height | 미설정 | 1.7 | 답답함 |

---

## 수정 대상

**파일**: `monkos_AI/portal/public/css/portal.css`

### 변경 사항 (CSS만)

```css
/* === 폰트 크기 보정 === */

/* 기본 line-height 추가 */
body { line-height: 1.6; }

/* 섹션 헤더 */
.sec-h h2       { font-size: 14px → 18px }

/* 인트로 텍스트 */
.intro-text      { font-size: 13px → 15px }

/* 서비스 카드 */
.svc h3          { font-size: 12px → 14px }
.svc p           { font-size: 10px → 12px }

/* How-to */
.howto h4        { font-size: 11px → 13px }
.howto p         { font-size: 9px → 11px }

/* 블로그 카드 (홈) */
.bi-info h3      { font-size: 11px → 14px }
.bi-info p       { font-size: 9px → 12px }
.bi-info .meta   { font-size: 8px → 10px }

/* 매거진 사이드바 */
.mag-body h4     { font-size: 11px → 13px }
.mag-body p      { font-size: 9px → 11px }
.sb-t            { font-size: 8px → 11px }
.sb-tag          { font-size: 8px → 10px }

/* 우측 가이드 */
.guide-label h4  { font-size: 10px → 12px }
.guide-label p   { font-size: 8px → 10px }

/* 크레딧 안내 */
.credit-info-title { font-size: 10px → 12px }
.credit-info       { font-size: 9px → 11px }

/* 푸터 */
.ft-biz, .ft-links { font-size: 9px → 11px }
```

### 원칙
- **최소 10px** — 8px, 9px 폰트는 모바일에서 실질적으로 읽기 어려움
- **계층 유지** — 제목 > 본문 > 메타 순서의 크기 차이 보존
- **블로그 페이지에 맞추지 않음** — 3컬럼 레이아웃이므로 블로그보다는 작되, 현재보다 확실히 키움
- **line-height 1.6** 추가 — 텍스트 호흡 확보

---

## 수정 금지

- ⚠️ **레이아웃 변경 금지** — padding, margin, grid, width 등 건드리지 않음
- ⚠️ **색상 변경 금지**
- ⚠️ **블로그/SSR 페이지 CSS 건드리지 않음** (render.js 수정 없음)
- ⚠️ portal.css 내에서 **폰트 크기와 line-height만 수정**
- 카드 디자인 보정은 별도 후속 지시서에서 처리

---

## 검증

- [ ] 데스크탑: 3컬럼 레이아웃 깨지지 않음
- [ ] 모바일 (375px): 텍스트 가독성 개선 확인
- [ ] 블로그 페이지: 변경 없음 (회귀 없음)
- [ ] 기존 기능 동작 정상 (i18n, 챗봇 등)

---

## 완료 보고

커밋 해시 + dev 배포 확인.
형식: `✅❌💡⏳📁🔀`

---
type: ORDER
id: ORDER_20260323_블록에디터_3_어드민UI
date: 2026-03-23
from: iMac/쌍아
to: 막내
status: 발행 (단계1 완료 후 실행, #2와 병렬 가능)
priority: P0
ref:
  - PROPOSAL_20260323_홈블록에디터_Phase0_기안서
  - REPORT_20260323_막내1_홈블록에디터_사전리서치
seq: "단계2-B — 지시서 #1(시딩) 완료 후 실행. #2와 병렬 가능"
depends: ORDER_20260323_블록에디터_1_시딩
---

# 지시서 #3: layout.html 확장 — 블록 편집 UI

## 1. 목적

어드민 `layout.html`을 확장하여 14개 블록의 내용(텍스트·링크·설정)을 편집할 수 있는 UI를 구축한다.

## 2. 수정 대상

**파일**: `monkos_AI/portal/public/admin/layout.html`

## 3. 작업 내용

### 3-1. 현재 UI → 확장 UI

현재 (7개 섹션, 표시/순서/크기만):
```
테이블: [섹션명] [토글] [순서↑↓] [사이즈 S/M/L]
```

확장 후 (14개 블록, 카테고리 탭 + 편집 모달):
```
탭: [헤더] [메인] [사이드바] [푸터]

각 탭 내 블록 목록:
[블록명] [토글] [순서↑↓] [편집 ✏️]

편집 버튼 → 모달:
  [KO] [JA] [EN] 탭
  블록별 폼 필드 (텍스트, 링크, URL 등)
  [저장] [취소]
```

### 3-2. 카테고리 분류

| 탭 | 포함 블록 |
|-----|-----------|
| **헤더** | hero, user-bar, gallery-strip, nav |
| **메인** | service-cards, howto, faq-preview, board-preview, blog-cards |
| **사이드바** | magazine, tags, guide, credit-info |
| **푸터** | footer |

### 3-3. 블록별 편집 폼

**순수 데이터 블록** (텍스트 편집):

| 블록 | 편집 필드 |
|------|-----------|
| hero | label (단일), title (HTML), tagline (HTML) |
| user-bar | cta 문구 (다국어), ctaUrl (kr/global), showLangSwitch, showLogin, showCredit (토글) |
| nav | items[] — 각 항목의 label(다국어), href(다국어). 항목 추가/삭제/순서변경 |
| service-cards | items[] — title, desc, link(다국어), url, icon, badge.text, cardClass |
| howto | header.title/link(다국어), items[] — num, title, desc(다국어) |
| guide | items[] — title, desc, status(다국어), style.background |
| credit-info | exchange(다국어), rows[] — label(다국어)+value, promo — oldPrice/newPrice/bonus(다국어) |
| footer | links[] — label+href, copyright (단일) |

**Firestore 동적 블록** (설정만):

| 블록 | 편집 필드 |
|------|-----------|
| gallery-strip | maxItems (숫자), autoScroll (토글), speed (숫자) |
| faq-preview | maxItems (숫자), linkToFull (토글), header.title/link(다국어) |
| board-preview | maxItems (숫자), header.title/link(다국어) |
| blog-cards | maxItems (숫자), header.title/link(다국어) |
| magazine | maxItems (숫자) |
| tags | maxTags (숫자), expandable (토글) |

### 3-4. 편집 모달 패턴

faq.html의 모달 패턴을 참고:
- `.modal-overlay` + `.modal-box` 구조
- `.form-row` (label + input/textarea)
- 다국어 탭은 모달 상단에 `[KO] [JA] [EN]` 버튼, 선택된 언어의 필드만 표시
- 저장 시 로컬 `sections[]` 배열 갱신 → 상단 "저장" 버튼으로 일괄 PUT

### 3-5. 대시보드 연결

**파일**: `monkos_AI/portal/public/admin/index.html`

대시보드에 "Home Layout" 카드 추가:
```html
<a href="/admin/layout.html" class="menu-card">
  <div class="mc-icon">🏠</div>
  <h3>Home Layout</h3>
  <p>홈 페이지 블록 편집</p>
</a>
```

기존 카드들 사이에 적절한 위치 삽입.

## 4. 디자인 가이드

기존 어드민 디자인 시스템 준수:
- CSS 변수: `--bg`, `--surface`, `--accent(#6d28d9)`, `--text`, `--border` 등
- 폰트: Pretendard
- 카드/테이블: `border-radius: 8px`, `border: 1px solid var(--border)`
- 토글: `.toggle` 컴포넌트 (기존 layout.html 것 재사용)
- 토스트: `showToast()` 함수 (기존 것 재사용)

## 5. 유의 사항

⚠️ **코드 수정 범위**: `layout.html`, `index.html(어드민)` 2개 파일만
⚠️ **API 변경 없음**: 기존 GET/PUT `/api/admin/layout` 그대로 사용. 스키마만 확장
⚠️ **헌법 제1조 1항**: 타임스탬프 `date` 취득
⚠️ **헌법 제2조 1항**: 완료 보고 필수

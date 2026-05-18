---
type: ORDER
id: ORDER_20260323_블록에디터_4_FAQ_갤러리
date: 2026-03-23
from: iMac/쌍아
to: 막내
status: 발행 (단계1 완료 후 실행, #2/#3와 병렬 가능)
priority: P1
ref:
  - PROPOSAL_20260323_홈블록에디터_Phase0_기안서
  - REPORT_20260323_막내1_홈블록에디터_사전리서치
seq: "단계2-C — 지시서 #1(시딩) 완료 후 실행. #2/#3와 병렬 가능"
depends: ORDER_20260323_블록에디터_1_시딩
---

# 지시서 #4: FAQ 프리뷰 링크 연결 + 갤러리 스트립 설정

## 1. 목적

1. 홈 FAQ 프리뷰 카드 → `/faq#앵커` 링크 연결
2. FAQ 전문 페이지에서 앵커 수신 + 해당 항목 자동 열기

## 2. 작업 내용

### 2-1. 홈 FAQ 프리뷰 링크화

**파일**: `lib/cms/home.js` (FAQ preview 영역)

현재:
```javascript
return `<div class="faq-item"><h4>${esc(f.question)}</h4><p>${esc(short)}</p></div>`;
```

변경:
```javascript
return `<a href="/faq#faq-${d.id}" class="faq-item"><h4>${esc(f.question)}</h4><p>${esc(short)}</p></a>`;
```

### 2-2. FAQ 전문 페이지 앵커 추가

**파일**: `lib/cms/render.js` — `faqFragment()` 함수

현재 (사전 리서치 C-3 확인):
```html
<details class="faq-item">
  <summary class="faq-question">질문</summary>
  ...
</details>
```

변경:
```html
<details class="faq-item" id="faq-${doc.id}">
  <summary class="faq-question">질문</summary>
  ...
</details>
```

### 2-3. FAQ 앵커 자동 열기 JS

FAQ 전문 페이지 하단에 인라인 스크립트 추가:

```javascript
// URL 앵커로 이동 시 해당 FAQ 항목 자동 열기
if (location.hash) {
  var el = document.getElementById(location.hash.substring(1));
  if (el && el.tagName === 'DETAILS') {
    el.open = true;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
```

## 3. 유의 사항

⚠️ **faq-item 스타일**: `<div>` → `<a>` 변경 시 `text-decoration: none; color: inherit` 필요할 수 있음. portal.css의 `.faq-item` 스타일 확인 후 필요하면 보정
⚠️ **다국어 FAQ URL**: 홈에서 JA로 보는 경우 `/ja/faq#faq-{id}`로 연결해야 함. 현재 lang 변수 참조
⚠️ **코드 수정 범위**: `lib/cms/home.js` (FAQ 영역만), `lib/cms/render.js` (faqFragment만)
⚠️ **헌법 제1조 1항**: 타임스탬프 `date` 취득
⚠️ **헌법 제2조 1항**: 완료 보고 필수

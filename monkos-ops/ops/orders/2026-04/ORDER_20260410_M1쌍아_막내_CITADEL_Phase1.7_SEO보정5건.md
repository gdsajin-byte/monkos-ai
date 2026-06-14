---
type: order
date: 2026-04-10
from: M1/쌍아
to: 막내
pf: PF_CITADEL
phase: "1.7"
subject: "4/9 CDP 진단 이슈 보정 4건 — hreflang, canonical, 깨진이미지, specs 혼입 (/en/about 제외)"
priority: high
status: done
portfolio: PF_CITADEL
---

# CITADEL Phase 1.7 — SEO 보정 5건

> **[2026-04-10 06:55 KST]** M1/쌍아 → 막내
> 근거: 4/9 막내1(SEO 라이브 진단) + 막내3(다국어 15페이지 검증) 보고서

---

## 배경

4/9 CDP 시연에서 막내1(9222) + 막내3(9224)가 monkos.ai 전 페이지를 순회하며 메타태그/hreflang/이미지 정합성을 진단. 이슈 5건 발견. FAQPage 이중 삽입은 `36c52d9`에서 이미 해결 확인, 제외.

---

## 작업 목록

### 건1. crop hreflang ja/en 추가 (🔴 긴급)

**현상**: crop 페이지에 `ko`와 `x-default`만 있고 `ja`/`en` hreflang 없음
**파일**: `monkos_AI/portal/public/crop/index.html` (26~27줄 부근)

**현재**:
```html
<link rel="alternate" hreflang="ko" href="https://monkos.ai/crop">
<link rel="alternate" hreflang="x-default" href="https://monkos.ai/crop">
```

**수정**: ko 아래에 ja/en 추가
```html
<link rel="alternate" hreflang="ko" href="https://monkos.ai/crop">
<link rel="alternate" hreflang="ja" href="https://monkos.ai/crop">
<link rel="alternate" hreflang="en" href="https://monkos.ai/crop">
<link rel="alternate" hreflang="x-default" href="https://monkos.ai/crop">
```

> crop은 현재 단일 언어 페이지(다국어 미분리)이므로 3개 다 동일 URL을 가리킨다. 구글이 "이 페이지가 ko/ja/en 공용"임을 인식하도록.

---

### 건2. idphoto canonical `/app` 경로 보정 (🟠 중요)

**현상**: canonical이 루트(`/`)를 가리키지만, 실제 SPA 진입점은 `/app`

**파일 2개**:
- `monkos_AI/idphoto-kr/public/index.html` (30줄 부근)
- `monkos_AI/idphoto-jp/public/index.html` (30줄 부근)

**현재**:
```html
<!-- KR --> <link rel="canonical" href="https://idphoto-kr.monkos.ai/">
<!-- JP --> <link rel="canonical" href="https://idphoto-jp.monkos.ai/">
```

**수정**:
```html
<!-- KR --> <link rel="canonical" href="https://idphoto-kr.monkos.ai/app">
<!-- JP --> <link rel="canonical" href="https://idphoto-jp.monkos.ai/app">
```

> hreflang도 동일하게 `/app` 경로로 통일. 현재 hreflang href도 `/`이면 함께 보정.

---

### 건3. 깨진 이미지 3건 진단 + 수정 (🟠 중요)

**현상**: 막내3 보고서에서 crop, idphoto-kr/app, idphoto-jp/app에 깨진 이미지 각 1건

**진단 절차**:
1. CDP로 각 페이지 접속
2. `document.querySelectorAll('img')` 전수 조회
3. 각 img의 `naturalWidth === 0` 체크 → 깨진 이미지 URL 특정
4. 404인지 경로 오류인지 판별
5. 수정

> 정적 HTML 이미지 참조는 정상으로 확인됨. SPA 런타임 이미지 로드 실패 가능성 높음.

---

### ~~건4. `/en/about` 404~~ → **제외 (유령 URL)**

> 코드·sitemap·내부링크 어디에도 about 참조 없음. 직접 입력 시에만 도달하는 유령 URL. SEO 피해 없음. 처분: 무시.

---

### 건4. `/en/specs` 본문 한국어 혼입 확인 (🟡 경미)

**현상**: 막내3 보고서에서 en specs에 한국어 일부 혼입 감지

**진단 결과**: `specs-data.json` en 필드 데이터 자체는 정상(영문만). SSR 렌더링 시점(render.js) 문제 가능성.

**진단 절차**:
1. CDP로 monkos.ai/en/specs 접속
2. 페이지 텍스트 전문 추출 (`document.body.innerText`)
3. 한국어 포함 영역 특정 (정규식 `[\uAC00-\uD7A3]`)
4. render.js에서 해당 영역의 언어 분기 로직 확인
5. 수정

---

## 제외 항목

| 항목 | 사유 |
|------|------|
| FAQPage 이중 삽입 | ✅ 이미 해결 (`36c52d9`) |
| `/ja/` `/en/` root lang=ko | 코드 정상, CF 프록시 레벨 — 별도 인프라 이슈 |

---

## 완료 기준

- [ ] crop hreflang 4개 언어 태그 존재
- [ ] idphoto-kr/jp canonical이 `/app` 경로
- [ ] 깨진 이미지 0건 (CDP 재검증)
- [ ] /en/specs 한국어 혼입 0건 (CDP 재검증)
- [ ] 전체 수정 후 CDP 7페이지 재진단으로 검증

---

## 배포

- 수정 완료 후 커밋 → 작가님 승인 후 prod 배포
- 배포 후 CDP 재검증 필수

---
type: order
from: iMac/민아
to: 막내
date: 2026-03-28
priority: 긴급
subject: 구글 색인 촉진 — 블로그 포스트 개별 색인 미등록 문제 해결
---

# 지시서: 구글 색인 촉진 — 블로그 포스트 개별 색인 미등록 문제

**[2026-03-28 13:50 KST] iMac/민아 → 막내**

---

## 상황 설명

MONKOS AI 블로그 (`monkos.ai/blog`)에 80+ 포스트가 있으나, 구글 검색에서 **개별 포스트가 거의 색인되지 않고 있습니다.**

### 현재 상태
- `site:monkos.ai` 검색 시 **10건만** 노출 (80+ 포스트 중)
- 사이트맵(`/sitemap.xml`)에는 **80+ URL이 정상 등록**되어 있음
- 서버 SSR 정상 — 모든 포스트 URL이 200 OK + meta title/description 정상 반환
- GSC에서 "발견됨 - 현재 색인이 생성되지 않음", "크롤링됨 - 현재 색인이 생성되지 않음" 상태 존재

### 원인 분석
1. **도메인 연령** — monkos.ai 도메인이 신생이라 구글 크롤 버짓이 낮음
2. **내부 링크 구조** — 블로그 목록 페이지에서 개별 포스트로의 내부 링크가 크롤러에게 충분히 노출되는지 미확인
3. **meta description 품질** — 일부 포스트에서 `<br>` 태그가 description에 노출됨 (아까 vol16 확인)
4. **외부 백링크 부족** — 포스트를 가리키는 외부 링크가 적어 크롤 우선순위 낮음

### 어제 발행한 글 사례
- KR: `monkos.ai/blog/kulleodeu-neun-keompyuteoga-kkeojyeoisseodo-maeil-hal-ileun-`
- JP: `monkos.ai/ja/blog/claude-tasks-even-when-computer-is-off`
  - JP는 `site:monkos.ai` 검색에서 **발견됨** (19시간 전 크롤링)
  - KR은 `site:monkos.ai 클로드 스케줄` 검색에서 **미발견**

---

## 작업 내역

### 1. meta description 정리 (긴급)

`renderBlogPost()` 함수에서 `<meta name="description">` 생성 로직 확인.

아래 문제 수정:
```
현재: <meta name="description" content="<br> <br> <br>">
정상: <meta name="description" content="포스트 요약 또는 본문 첫 160자">
```

- `monkos_AI/portal/lib/cms/render.js`의 `renderBlogPost` 함수
- SEO description에 HTML 태그가 포함되지 않도록 strip 처리
- 빈 description인 경우 본문 첫 160자를 자동 추출

### 2. 구조화된 데이터 (JSON-LD) 추가

각 블로그 포스트에 `Article` 스키마 삽입:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "포스트 제목",
  "description": "포스트 요약",
  "image": "썸네일 URL",
  "author": {
    "@type": "Person",
    "name": "MONKOS AI"
  },
  "publisher": {
    "@type": "Organization",
    "name": "MONKOS AI",
    "logo": "https://monkos.ai/monkos-icon.svg"
  },
  "datePublished": "2026-03-27",
  "dateModified": "2026-03-27"
}
</script>
```

위치: `renderBlogPost()` 함수 내 `<head>` 영역

### 3. 내부 링크 강화

블로그 목록 페이지(`/blog`)에서 각 포스트로의 링크가 `<a href="/blog/{slug}">` 형태로 크롤러가 읽을 수 있는지 확인.

- SPA 라우팅이 아닌 **서버사이드 HTML `<a>` 태그**로 렌더링되는지 점검
- 각 포스트 하단에 "관련 포스트" 섹션 추가 검토 (내부 링크 증가)

### 4. GSC 색인 요청 자동화 (선택)

Google Indexing API를 통해 새 포스트 발행 시 자동으로 색인 요청:
- `POST https://indexing.googleapis.com/v3/urlNotifications:publish`
- `{ "url": "https://monkos.ai/blog/{slug}", "type": "URL_UPDATED" }`
- 단, Indexing API는 JobPosting/BroadcastEvent 스키마가 있는 페이지만 공식 지원
- 대안: GSC의 URL 검사 → "색인 생성 요청" 수동 트리거 (작가님이 주요 포스트에 대해)

---

## ⚠️ 준수 조항

- **헌법 제4조 1항**: API 키/토큰 하드코딩 금지. Indexing API 사용 시 .env 참조
- **헌법 제4조 2항**: 기존 render.js 수정 시 기능 파괴 주의. meta description 로직만 정밀 수정
- **법률 ch2**: 수정 전 계획 제시 → 승인 → 실행

---

## 완료 기준

- [ ] `curl -s "https://monkos.ai/blog/{slug}" | grep 'meta name="description"'` → HTML 태그 없는 깔끔한 description
- [ ] `curl -s "https://monkos.ai/blog/{slug}" | grep 'application/ld+json'` → Article 스키마 존재
- [ ] 블로그 목록 SSR에서 각 포스트 `<a>` 태그 확인
- [ ] 주요 포스트 3건 GSC URL 검사 + 색인 요청 (작가님 수동)

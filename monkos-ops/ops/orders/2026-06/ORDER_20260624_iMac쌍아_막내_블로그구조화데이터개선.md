---
type: order
date: 2026-06-24
from: iMac/쌍아
to: 막내
status: 대기
---

# 블로그 구조화 데이터 개선

> **[2026-06-24 12:34 KST]** iMac/쌍아 → 막내

---

## 작업 1: Article → BlogPosting 변경

**파일**: `monkos_AI/portal/lib/cms/render-blog.js`
**위치**: :313 부근

**현행**:
```js
"@type": "Article",
```

**수정**:
```js
"@type": "BlogPosting",
```

`BlogPosting`은 `Article`의 하위 타입으로, 블로그 콘텐츠에 더 정확한 시그널을 준다. 기존 필드(`headline`, `author`, `publisher`, `datePublished` 등)는 그대로 유효.

---

## 작업 2: FAQ 구조화 데이터 자동 삽입

블로그 본문에 `## 자주 묻는 질문 (FAQ)` 또는 `## FAQ` 섹션이 있고, `Q.` / `A.` 패턴의 문답이 있으면 `FAQPage` 구조화 데이터를 자동 생성한다.

**파일**: `monkos_AI/portal/lib/cms/render-blog.js`
**위치**: Article JSON-LD 블록 아래 (BreadcrumbList 전)

**구현 방향**:
1. `post.content` (마크다운 원문)에서 FAQ 섹션을 감지한다
2. `Q.` 로 시작하는 줄 = 질문, 바로 아래 `A.` 로 시작하는 줄 = 답변 (또는 `**Q.`/`**A.` 볼드 패턴)
3. 1쌍 이상 감지되면 `FAQPage` JSON-LD를 삽입한다

**출력 형식**:
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "질문 텍스트",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "답변 텍스트"
      }
    }
  ]
}
```

**주의**:
- FAQ가 없는 글에는 삽입하지 않는다 (빈 mainEntity 금지)
- 질문/답변 텍스트에서 마크다운 서식(`**`, `*`, `` ` `` 등)은 strip한다
- `stripHtml()` 함수가 이미 `render-shell.js`에 있으므로 활용 가능

---

## 작업 3: wordCount + 읽기 시간 추가

Article/BlogPosting에 `wordCount`와 `timeRequired` 필드를 추가한다.

**구현**:
```js
const wordCount = stripHtml(post.content).length;
const readMinutes = Math.max(1, Math.ceil(wordCount / 500));
```

JSON-LD에 추가:
```js
"wordCount": wordCount,
"timeRequired": `PT${readMinutes}M`
```

한국어는 글자 기준 500자/분으로 계산한다.

---

## ⚠️ 준수 조항

- 배포는 `deploy.sh` 경유 필수 (ch5 2조)
- 기존 구조화 데이터(Article, BreadcrumbList)를 깨뜨리지 않는다
- FAQ 파싱 실패 시 silent skip (에러로 렌더링 전체 깨지면 안 됨)
- 수정 후 Google Rich Results Test (`https://search.google.com/test/rich-results`)로 검증 권장

## 완료 기준

- [ ] `@type`: Article → BlogPosting
- [ ] FAQ 자동 감지 + FAQPage JSON-LD 삽입
- [ ] wordCount + timeRequired 추가
- [ ] 기존 구조화 데이터 무결성 유지
- [ ] 완료 보고 (헌법 3조 2항)

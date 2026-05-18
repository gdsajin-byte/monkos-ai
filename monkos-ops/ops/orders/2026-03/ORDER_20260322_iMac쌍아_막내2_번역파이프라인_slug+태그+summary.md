---
type: order
from: iMac/쌍아
to: 막내2
date: 2026-03-22
status: 대기
priority: 높음
---

# 지시서: 번역 파이프라인 — 영문 slug + 각국어 태그 + summary 번역

> **[2026-03-22 15:48 KST] iMac/쌍아 → 막내2**

## 대상 파일

- `monkos_AI/portal/lib/cms/translate.js`
- `monkos_AI/portal/lib/cms/blog.js` — `generateSlug()` 함수만 (11~18행)
- `monkos_AI/portal/public/admin/js/blog-editor.js` — slug 자동생성 로직만 (239~248행)

**다른 막내가 수정하는 파일(render.js, upload.js)은 절대 건드리지 말 것.**

## 수정 1: blog.js — generateSlug() 영문 전용화

### blog.js:11-18

**현재:**
```javascript
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s가-힣ぁ-んァ-ヶ一-龥-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}
```

**변경:**
```javascript
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}
```

한글·일본어·중국어 제거. 영문+숫자+하이픈만 허용.

## 수정 2: blog-editor.js — 에디터 slug 자동생성 영문 전용화

### blog-editor.js:241-247

**현재:**
```javascript
const slug = e.target.value
  .toLowerCase()
  .replace(/[^\w\s가-힣ぁ-んァ-ヶ一-龥-]/g, '')
  .replace(/\s+/g, '-')
```

**변경:**
```javascript
const slug = e.target.value
  .toLowerCase()
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
```

## 수정 3: translate.js — Gemini 프롬프트에 slug + tags 생성 지시

### translate.js — JSON_INSTRUCTION 수정 (44~51행)

**현재:**
```javascript
const JSON_INSTRUCTION = {
  ja: `以下のJSON形式で回答してください:
{"title": "翻訳されたタイトル", "content": "翻訳された本文(マークダウン)", "summary": "翻訳された要約(160文字以内)"}`,
  en: `Respond in the following JSON format:
{"title": "translated title", "content": "translated body (markdown)", "summary": "translated summary (max 160 chars)"}`,
  ko: `다음 JSON 형식으로 응답하세요:
{"title": "번역된 제목", "content": "번역된 본문(마크다운)", "summary": "번역된 요약(160자 이내)"}`,
};
```

**변경:**
```javascript
const JSON_INSTRUCTION = {
  ja: `以下のJSON形式で回答してください:
{"title": "翻訳されたタイトル", "content": "翻訳された本文(マークダウン)", "summary": "翻訳された要約(160文字以内、SEO用)", "slug": "english-slug-from-title (lowercase, hyphens, max 60 chars, ASCII only)", "tags": ["日本語タグ1", "日本語タグ2", "日本語タグ3"]}`,
  en: `Respond in the following JSON format:
{"title": "translated title", "content": "translated body (markdown)", "summary": "translated summary (max 160 chars, for SEO)", "slug": "english-slug-from-title (lowercase, hyphens, max 60 chars, ASCII only)", "tags": ["English tag1", "English tag2", "English tag3"]}`,
  ko: `다음 JSON 형식으로 응답하세요:
{"title": "번역된 제목", "content": "번역된 본문(마크다운)", "summary": "번역된 요약(160자 이내, SEO용)", "slug": "english-slug-from-title (소문자, 하이픈, 60자 이내, ASCII만)", "tags": ["한국어 태그1", "한국어 태그2", "한국어 태그3"]}`,
};
```

**핵심 변경**:
- `slug` 필드 추가: 번역된 제목 기반 영문 slug (전 언어 ASCII 통일)
- `tags` 필드 추가: 타깃 언어의 검색 키워드 (원본 태그 참조하여 번역)
- `summary`에 "SEO용" 명시: 검색 엔진 스니펫에 노출되므로 해당 언어로 작성

### translate.js — 프롬프트에 원본 태그 정보 추가 (77~85행)

**현재:**
```javascript
const prompt = `${TRANSLATE_PROMPT[promptKey] || TRANSLATE_PROMPT[lang]}

---
# ${originalDoc.title}

${originalDoc.content}
---

${JSON_INSTRUCTION[lang] || JSON_INSTRUCTION.en}`;
```

**변경:**
```javascript
const originalTags = (originalDoc.tags || []).join(', ');
const prompt = `${TRANSLATE_PROMPT[promptKey] || TRANSLATE_PROMPT[lang]}

Original tags for reference: ${originalTags}

---
# ${originalDoc.title}

${originalDoc.content}
---

${JSON_INSTRUCTION[lang] || JSON_INSTRUCTION.en}`;
```

### translate.js — 번역 결과 반영 (123~156행)

**현재 (123행):**
```javascript
const translatedSlug = `${slug}-${lang}`;
```

**변경:**
```javascript
// Gemini가 생성한 영문 slug 사용, 없으면 원본 slug에 lang 접미사
let translatedSlug;
if (translated.slug) {
  // slug 정제: ASCII만, 하이픈 구분, lang 접미사
  translatedSlug = translated.slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);
  translatedSlug = `${translatedSlug}-${lang}`;
} else {
  translatedSlug = `${slug}-${lang}`;
}
```

**tags 반영 — 기존 코드에서 `originalDoc.tags` → `translated.tags` 사용:**

set/update 호출부에서:
```javascript
tags: translated.tags && translated.tags.length > 0 ? translated.tags : (originalDoc.tags || []),
```

## 커밋

```bash
git add monkos_AI/portal/lib/cms/translate.js monkos_AI/portal/lib/cms/blog.js monkos_AI/portal/public/admin/js/blog-editor.js
git commit -m "[feat] 번역 파이프라인 — 영문slug + 각국어태그 + summary SEO강화"
```

**배포는 막내3과 합류하여 1회만 실행. 단독 배포 금지.**

## ⚠️ 준수 조항
- 헌법 제1조 1항: 매 턴 타임스탬프
- **translate.js, blog.js(generateSlug만), blog-editor.js(slug생성만) 수정. 다른 파일 절대 금지**
- blog.js의 다른 함수(저장/발행 로직 등)는 막내1이 수정하므로 건드리지 말 것
- 기존 포스트의 slug은 변경하지 않음 (신규 발행부터 적용)

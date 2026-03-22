---
type: ORDER
date: 2026-03-22
from: iMac/민아
to: 막내 (미배정)
status: 대기 (작가님 승인 후 발행)
priority: HIGH
---

# 블로그 번역 파이프라인 — slug 영문 통일 + 태그 언어별 번역

## 배경

현재 KO→EN/JA 자동번역 시 slug와 태그가 한국어 원본 그대로 복사됨.

### 문제

1. **slug가 한국어** → Medium/LinkedIn import 시 URL 인코딩 문제로 실패
2. **태그가 한국어 그대로** → 각국 검색엔진에서 해당 언어 키워드로 매칭 안 됨
3. **slug = Firestore doc ID** → 생성 후 변경 불가. 최초 생성 시 올바르게 설정해야 함

### 결정 (작가님 승인)

- **slug**: 전 언어 **영문 통일** (봇/크롤러/외부 배포 호환)
- **태그**: **각 국가 언어로 번역** (각국 검색엔진 키워드 매칭)

## 대상 파일

| 파일 | 변경 내용 |
|------|----------|
| `monkos_AI/portal/lib/cms/translate.js` | slug 영문 생성 + 태그 번역 로직 |
| `monkos_AI/portal/lib/cms/blog.js` | generateSlug() 영문 기본 옵션 |
| `monkos_AI/portal/public/admin/js/blog-editor.js` | 프론트엔드 slug 생성 로직 (선택적) |

## 변경 사항

### 1. slug 영문 생성 (translate.js)

**현재 (line 123):**
```javascript
const translatedSlug = `${slug}-${lang}`;
// 결과: "취업-증명사진-의상-컬러-선택법-en"
```

**변경:**
```javascript
// Gemini 번역 응답에 slug 필드 추가 요청
// translated.slug = 영문 slug (Gemini가 제목 기반으로 생성)
const translatedSlug = translated.slug
  ? `${sanitizeSlug(translated.slug)}-${lang}`
  : `${slug}-${lang}`;  // fallback: 기존 방식
// 결과: "job-application-photo-outfit-guide-en"
```

### 2. Gemini 프롬프트 수정 (translate.js)

**현재 프롬프트 응답 형식:**
```
{ "title": "...", "content": "...", "summary": "..." }
```

**변경 — 응답 형식에 slug, tags 추가:**
```
{
  "title": "...",
  "content": "...",
  "summary": "...",
  "slug": "english-slug-from-title",
  "tags": ["tag1", "tag2", "tag3"]
}
```

**프롬프트에 추가할 지시사항:**
```
Additionally:
- Generate an SEO-friendly English slug from the title (lowercase, hyphens, no special characters, max 60 chars)
- Translate all tags into the target language. Tags should be natural keywords that users would search for in that language.

Example:
- Korean tags: ["취업사진", "증명사진", "의상가이드"]
- English tags: ["job application photo", "ID photo", "outfit guide"]
- Japanese tags: ["就活写真", "証明写真", "服装ガイド"]
```

### 3. 태그 번역 반영 (translate.js)

**현재 (line 133, 146):**
```javascript
tags: originalDoc.tags || []  // 원본 그대로 복사
```

**변경:**
```javascript
tags: translated.tags || originalDoc.tags || []  // Gemini 번역 태그 우선, fallback 원본
```

### 4. slug 생성 함수 개선 (blog.js)

**현재 generateSlug():**
- 한국어/일본어/중국어 문자 허용
- 결과: 한글 slug 생성

**추가 함수 — sanitizeSlug():**
```javascript
function sanitizeSlug(slug) {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')  // 영문+숫자+하이픈만
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);
}
```

### 5. KO 원본 slug도 영문 옵션 (blog-editor.js, 선택적)

- KO 포스트 생성 시에도 **slug를 영문으로 생성하는 옵션** 제공
- 기존 generateSlug()는 유지하되, "영문 slug 자동 생성" 체크박스 or 기본값 변경
- **이건 Phase 2로 분리 가능** — 우선 번역 파이프라인 수정만 Phase 1

## 적용 범위

- **기존 포스트**: 변경 없음 (slug 변경 불가, Firestore doc ID)
- **신규 포스트**: 번역 시 영문 slug + 언어별 태그 자동 적용

## 검증 방법

1. 테스트 KO 포스트 작성 → 발행 → 자동번역 트리거
2. EN/JA 포스트의 slug가 영문인지 확인
3. EN/JA 포스트의 태그가 각각 영어/일본어인지 확인
4. `monkos.ai/en/blog/{영문slug}` 접속 확인
5. `medium.com/p/import` → 영문 slug URL import 성공 확인

## ⚠️ 준수 조항

- 헌법 제4조 1항: `.env`, secrets 수정 금지
- 헌법 제4조 2항: 파괴적 명령 금지
- 기존 Firestore 문서 수정/삭제 금지 — 신규 포스트에만 적용

---

*2026-03-22 11:46 KST iMac/민아*

---
type: report
from: iMac/쌍아
to: 작가님
date: 2026-03-22
subject: 블로그 slug 한글 포함 문제 — Medium import 실패 원인 + 수정 방안
status: 보고
---

# 블로그 slug 한글 포함 문제 보고서

**[2026-03-22 15:26 KST] iMac/쌍아 → 작가님**

---

## 1. 문제

Medium import 시 본진 URL에 한글 slug가 포함되어 import 실패. Medium 서버가 한글 URL을 fetch하지 못함.

## 2. 현재 slug 생성 경로 — 2곳에서 한글이 들어감

### 2-1. 에디터 자동생성 (blog-editor.js:241-247)

```javascript
const slug = e.target.value
  .toLowerCase()
  .replace(/[^\w\s가-힣ぁ-んァ-ヶ一-龥-]/g, '')  // ← 한글·일본어·중국어 허용
  .replace(/\s+/g, '-')
  .substring(0, 100);
```

제목이 "증명사진 옷차림 가이드"면 slug = `증명사진-옷차림-가이드`

### 2-2. 번역 파이프라인 (translate.js:123)

```javascript
const translatedSlug = `${slug}-${lang}`;
```

원본 slug이 한글이면 번역본도 한글: `증명사진-옷차림-가이드-en`

### 2-3. slug = Firestore document ID = 영구 불변

slug은 Firestore doc ID로 사용됨. 생성 후 변경 불가. 리다이렉트 메커니즘도 없음. **최초 생성 시 영문이어야 함.**

## 3. 영향 범위

| 항목 | 한글 slug | 영문 slug |
|------|----------|----------|
| 본진 서빙 | ✅ 정상 (브라우저가 URL 인코딩) | ✅ 정상 |
| Medium import | ❌ **실패** (fetch 불가) | ✅ 정상 |
| LinkedIn/X 공유 | ⚠️ URL 깨짐 위험 | ✅ 정상 |
| SEO 크롤링 | ⚠️ 일부 봇 인코딩 미지원 | ✅ 정상 |
| llms.txt | ⚠️ AI 크롤러 인코딩 불안정 | ✅ 정상 |

## 4. 확정 정책 (작가님 + 민아 합의, 03-22)

| 항목 | 정책 | 이유 |
|------|------|------|
| **slug** | 전 언어 영문 통일 | 외부 플랫폼 호환 (Medium, LinkedIn, X, AI 크롤러) |
| **요약(summary)** | SEO/GEO 타깃 언어 | 검색 결과 스니펫에 노출 — 각 국가 언어가 맞음 |
| **태그(tags)** | 각 국가 언어 | 검색 키워드 매칭 — 한국어 포스트엔 한국어 태그 |

## 5. 수정 필요 사항

### 5-1. blog-editor.js — slug 자동생성에서 비ASCII 제거

**현재:**
```javascript
.replace(/[^\w\s가-힣ぁ-んァ-ヶ一-龥-]/g, '')
```

**변경:**
```javascript
.replace(/[^a-z0-9\s-]/g, '')
```

한글·일본어·중국어 전부 제거. 영문+숫자+하이픈만 허용.

**문제**: 한글 제목만 있으면 slug이 빈 문자열이 됨. → Gemini에게 영문 slug 생성을 맡기거나, 제목 입력 시 영문 slug 별도 입력 유도 필요.

### 5-2. translate.js — 번역 시 영문 slug + 각국어 태그 자동 생성

**현재 프롬프트**: title, content, summary만 번역

**추가 필요**:
```
JSON 응답에 slug과 tags도 포함:
{
  "title": "번역된 제목",
  "content": "번역된 본문",
  "summary": "번역된 요약 (160자)",
  "slug": "english-slug-for-this-post",
  "tags": ["각국어 태그1", "각국어 태그2"]
}
```

- slug: 번역된 제목 기반 영문 slug (소문자, 하이픈 구분, 50자 이내)
- tags: 타깃 언어의 검색 키워드 (원본 태그 참조하여 번역)

### 5-3. translate.js:123 — 번역 slug 생성 로직 변경

**현재:**
```javascript
const translatedSlug = `${slug}-${lang}`;
```

**변경:**
```javascript
const translatedSlug = translated.slug
  ? `${translated.slug}-${lang}`
  : `${slug}-${lang}`;
```

Gemini가 생성한 영문 slug 사용. 없으면 기존 방식 폴백.

### 5-4. 기존 포스트 처리

- 기존 한글 slug 포스트: **불변** (Firestore doc ID = 변경 불가)
- 신규 포스트부터 영문 slug 적용
- 필요 시 한글 slug → 영문 slug 재생성 (새 doc 생성 + 구 doc 유지/삭제)

## 6. 기존 포스트 현황

민아 세션 로그(03-22)에서 이미 1건 수동 재생성 완료:
- 기존: `job-application-photo-outfit-color-guide-en` (이미 영문이었으나 재확인)
- 나머지 EN 포스트: 재생성 대기

---

💡 지시서 발행 대기 — 작가님 방향 확인 후 막내 지시서로 전환

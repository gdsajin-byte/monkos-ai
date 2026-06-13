---
type: order
date: 2026-06-11
from: iMac/쌍아
to: iMac/막내
portfolio: PF_OPUS
status: 대기
---

# 지시서 — 슬러그 단일화 + 임포터 삭제

**[2026-06-11 13:13 KST] iMac/쌍아 → iMac/막내**

---

## 배경

블로그 slug 생성 함수가 5곳에 흩어져 한글 처리·길이·소문자화 정책이 제각각. 임포터(naver/note)는 데드 코드(실행 0건)이며 한글 slug 오염원. 작가님 판단: 임포터 삭제 + slug.js 단일 모듈 추출 + sanitizeSlug 보정.

---

## ⚠️ 준수 조항

- ch2 2조: JS camelCase 네이밍
- ch5 2조: Cloud Run 배포는 deploy.sh 경유 필수
- 영문 slug 통일은 확정 사안 — 한글 slug 허용 코드를 남기지 않는다

---

## Task 1: slug.js 단일 모듈 생성

`monkos_AI/portal/lib/cms/slug.js` 신설. 아래 3개 함수를 통합:

### generateSlug(title)
- blog.js:42의 현행 로직 그대로 (정상 작동 중)
- 한글 제거, 소문자, 하이픈, 100자

### generateSlugFromAI(title)
- blog.js:52의 현행 로직 그대로 (Gemini 번역→slug)
- ai 인스턴스는 파라미터 또는 외부 주입으로 받을 것

### sanitizeSlug(slug)
- blog.js:68 현행 + **보정 2건**:
  1. `.toLowerCase()` 추가 (현재 누락)
  2. 한글 제거: `/[^a-z0-9-]/g` 로 교체 (현재 한글 통과)

### export

```js
export { generateSlug, generateSlugFromAI, sanitizeSlug };
```

---

## Task 2: 기존 호출부 전환

### blog.js
- `generateSlug`, `generateSlugFromAI`, `sanitizeSlug` 3개 함수 **삭제**
- 상단에 `import { generateSlug, generateSlugFromAI, sanitizeSlug } from './slug.js';` 추가
- 호출부(blog.js:89, 164, 166 등)는 함수명 동일하므로 변경 없음

### ai.js
- `makeSlug` 함수(ai.js:21-24) **삭제**
- 상단에 `import { generateSlug } from './slug.js';` 추가
- 호출부(ai.js:103, 198): `makeSlug(title)` → `generateSlug(title)` 치환
- 참고: ai.js의 makeSlug는 40자 제한이었으나, generateSlug의 100자로 통일 (SEO상 길어도 무방)

---

## Task 3: 임포터 삭제

```
git rm -r monkos_AI/portal/lib/cms/importer/
```

포함 파일: `index.js`, `naver.js`, `note.js`
- server.js에 라우트 없음 (데드 코드 확인 완료)
- 다른 파일에서 import 참조 없음 확인 후 삭제

---

## Task 4: 검증 + 배포

1. **로컬 기동 테스트**:
   - 서버 시작 → 블로그 에디터에서 새 글 작성(draft) → slug 자동 생성 확인
   - AI slug 탭 작동 확인
   - 기존 글 조회(sanitizeSlug 경로) 정상 확인
2. **`./deploy.sh prod`** 배포
3. prod에서 블로그 목록 + 개별 글 접근 확인

---

## 산출물

1. `lib/cms/slug.js` 신설
2. `blog.js`, `ai.js` 수정 (함수 삭제 + import 전환)
3. `lib/cms/importer/` 삭제
4. prod 배포 완료
5. **보고서**: `monkos-ops/ops/reports/2026-06/COMPLETION_20260611_iMac막내_슬러그단일화.md`
6. 세션 로그 어펜드
7. 완료 보고: ✅❌💡⏳📁🔀 형식

---

## 참조

- `REPORT_20260611_iMac민아_블로그CMS진단.md` §3 (슬러그 5중 분산 분석)
- `REPORT_20260611_iMac막내1_블로그파이프라인_코드정밀감사.md` Task 2 (임포터 DEAD 판정)

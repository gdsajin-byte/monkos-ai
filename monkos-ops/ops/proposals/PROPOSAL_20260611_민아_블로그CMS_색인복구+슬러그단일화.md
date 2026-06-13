---
type: proposal
date: 2026-06-11
device: iMac
agent: 민아
to: 쌍아
subject: "블로그 CMS 색인 복구 + 슬러그 단일화 + 보안/부채 정리 — 작업 패키지 제안"
status: draft
based_on: REPORT_20260611_iMac민아_블로그CMS진단.md
---

# [제안서] 블로그 CMS 색인 복구 + 슬러그 단일화

**[2026-06-11 11:30 KST] iMac/민아 → 쌍아**

진단 보고([REPORT_20260611_iMac민아_블로그CMS진단](../reports/2026-06/REPORT_20260611_iMac민아_블로그CMS진단.md))를 바탕으로, 쌍아가 지시서로 분할하기 좋은 **작업 패키지(WP) 5종**과 **작가님 결정 필요 2건**을 제안한다. 우선순위·범위·검증 기준만 제시하고, 상세 설계와 지시서화는 쌍아 권한이다.

---

## 핵심 인식 (제안의 전제)

1. **색인 멈춤은 코드가 아니라 경계 계층**이다. 트리거(URL 생성)는 `4a90f9e4`로 정상. 남은 건 SA 권한/쿼터(운영)·폐기 엔드포인트·silent 실패다.
2. **슬러그/운영부채는 "한글 slug" 단일 결함의 파생물**이다. 임포터가 재발원. 마이그레이션 스크립트는 증상치료였다.
3. 따라서 **재발 차단(WP3)이 핵심**이고, 나머지는 응급(WP1·WP2)과 정합(WP4·WP5)이다.

---

## WP1 — 색인 복구 [P0/P1]

| 항목 | 내용 |
|------|------|
| 목적 | "계속 멈춤" 실제 해소 |
| 범위 | ① **운영 실측**(코드무관): SA의 GSC 속성 소유권·`indexing` scope·Cloud Run 로그의 403/429 누적 확인 ② `seo.js:48` `pingSitemap` 폐기 엔드포인트 제거 → GSC Sitemaps API submit 또는 lastmod 의존 ③ `seo.js:23` 403/429 구분 로깅 + 일일 카운터(200건 쿼터 근접 WARN) ④ 호출부 `await`+`Promise.allSettled`로 발행 응답에 색인 결과 요약 노출 |
| 변경 파일 | `lib/cms/seo.js`, `lib/cms/blog.js`, `lib/cms/translate.js` |
| 검증 기준 | 발행 1건 → GSC URL검사에서 "크롤링됨" 전환 확인 / 로그에 403·429 명시 노출 / 어드민에 색인 성공·실패 표시 |
| 난이도 | 운영 점검(소) + 코드(소~중) |
| 선결 | **작가님 결정 ①**(SA 실측 권한) |

## WP2 — 보안 응급 [P0]

| 항목 | 내용 |
|------|------|
| 목적 | 어드민 화면 무인증 노출 차단 (Critical) |
| 범위 | server.js 라우터에 `/admin/*` 정적 페이지 `requireAdmin` 게이트 추가. 부수: AGENT_API_KEY 비교 `timingSafeEqual` 전환, `decodeURIComponent` try/catch(`server.js:305,316`) |
| 변경 파일 | `server.js`, `lib/cms/admin-auth.js` |
| 검증 기준 | 익명 GET `/admin/blog-list.html` → 401/리다이렉트 / 정상 어드민 세션은 통과 |
| 난이도 | 소 |
| 비고 | 5715fd96이 API만 막고 페이지를 빠뜨린 잔존분. **단독 지시서로 즉시 처리 권장** |

## WP3 — 슬러그 단일화 + 임포터 정합 [P2] ★ 재발 차단 핵심

| 항목 | 내용 |
|------|------|
| 목적 | 한글 slug 재발원 원천 차단 (마이그레이션 반복 종료) |
| 범위 | ① 공유 모듈 `lib/cms/slug.js` 신설: `slugify(title)→{baseSlug(영문강제·lowercase·ASCII·max60), langSuffix(lang)}` ② 분산된 5개 구현(`ai.js:21` 이미지용은 `gcsSafeName`으로 역할 분리, `blog.js:42·68`, `importer/note.js:19`, `importer/naver.js:31`)을 이 모듈로 치환 ③ **임포터가 영문 base+`-kr`/`-ja` 접미사+`baseSlug` 필드 부여**하도록 강제 ④ `sanitizeSlug`에 `.toLowerCase()` 추가 |
| 변경 파일 | (신규) `lib/cms/slug.js`, `lib/cms/blog.js`, `lib/cms/ai.js`, `lib/cms/importer/note.js`, `lib/cms/importer/naver.js` |
| 검증 기준 | note/naver 임포트 1건 → doc id `{영문base}-kr` + `baseSlug` 필드 존재 / 한글 slug doc 신규 생성 0건 / 기존 데이터 회귀 없음 |
| 난이도 | 중 |
| 비고 | 데이터 마이그레이션 아님(신규 생성 규칙만). 기존 잔재는 별건 |

## WP4 — 번역 토큰 + 발행 부수효과 단일화 [P1]

| 항목 | 내용 |
|------|------|
| 목적 | 번역 잘림 해소 + 임포터 색인 누락 해소 |
| 범위 | ① `translate.js:116` maxOutputTokens 8192→복원(16384~32768, **작가님 결정 ②** 후 확정) ② `publishSideEffects(post, lang)` 단일 함수 추출 → create/update/importer/translate 공통 호출(색인·llms.txt·sitemap·OG) ③ `appendToLlmsTxt`에 lang 인자 추가(`seo.js:31` ja/en URL 교정) |
| 변경 파일 | `lib/cms/translate.js`, `lib/cms/blog.js`, `lib/cms/seo.js`, `lib/cms/importer/*` |
| 검증 기준 | 긴 글 ja/en 번역 truncation 0 / 임포트 원본도 색인·llms 등재 / llms.txt에 `/ja/blog/...` 정확 |
| 난이도 | 중 |

## WP5 — 운영부채 정리 [P3]

| 항목 | 내용 |
|------|------|
| 목적 | 화석화된 부채 제거 |
| 범위 | ① `server.js:246-304` 301 하드코딩 매핑 → `redirects` 컬렉션(또는 KV) 이전, 어드민 관리 ② 일회성 스크립트(migrate/cleanup/retranslate 5종) `scripts/archive/` 격리(헌법 3조 4항 정본 단일 — 폐기 스크립트 현행 오인 방지) ③ `restore_translation_images.js` 반복 필요 → `translate.js` 이미지 보존 단위테스트 |
| 변경 파일 | `server.js`, `scripts/*`, `lib/cms/translate.js` |
| 검증 기준 | 301 동작 동일성 유지 / scripts 루트에 일회성 스크립트 0 |
| 난이도 | 중 |

---

## 권장 지시서 분할

- **즉시 단독**: WP2(보안), WP1-②③(pingSitemap·로깅) — 작은 응급 패치, 1막내 1세션.
- **선실측 후**: WP1-①(SA/GSC) → 결과에 따라 WP1 마무리.
- **묶음**: WP3 → WP4 순(WP4의 임포터 정합이 WP3 baseSlug에 의존).
- **후순위**: WP5(부채), 별도 막내/세션.

## 작가님 결정 필요

1. **SA/GSC 운영 실측 권한** — 민아가 `gcloud`로 SA 권한·색인 로그를 직접 점검할지, 아니면 막내 지시서로 내릴지. (data-access 규칙상 운영 점검 범위 확인 필요)
2. **`translate.js:116` 8192 회귀가 의도였는지** — `92b4d416`("번역 트리거 수정") 커밋에 토큰 하향이 섞였다. 의도면 유지, 부수효과면 복원.

## 민아 재검증 포인트
- WP1: 발행→GSC 크롤 전환 실측
- WP2: 익명 어드민 접근 차단 확인
- WP3: 임포트 doc 스키마 정합 확인
- WP4: 번역 truncation + 임포터 색인 등재 확인

— 끝 —

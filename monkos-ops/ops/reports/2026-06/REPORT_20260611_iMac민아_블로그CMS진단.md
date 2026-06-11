---
type: report
date: 2026-06-11
device: iMac
agent: 민아
status: 마감
subject: "블로그 CMS 코드 정밀 진단 — 색인 멈춤·슬러그·운영부채"
target: monkos_AI/portal/lib/cms
---

# 블로그 CMS 정밀 진단 보고

**[2026-06-11 11:30 KST] iMac/민아 → 작가님**

대상: `monkos_AI/portal` 블로그 CMS (lib/cms 6,405줄 + server.js 446줄 + admin UI).
방법: 4개 영역(색인·슬러그·코어·보안운영) 병렬 코드 정독 + 관련 커밋 diff 검증.

---

## 0. 한 줄 결론

> **색인이 "계속 멈추는" 원인은 색인 트리거 코드가 아니다 — 그건 `4a90f9e4`로 이미 고쳐졌다.**
> 진짜 원인은 그 아래 **인증/쿼터/폐기된 엔드포인트 계층**이고, 모든 실패가 `WARN` 한 줄 + `.catch(()=>{})`로 silent하게 삼켜져 어드민엔 정상으로 보인다.
> 그리고 **슬러그 부정합·운영부채는 전부 "한글 slug" 단일 결함**에서 파생됐다. 임포터가 스키마 통일을 우회해 계속 재발시킨다.

---

## 1. ✅ 잘 된 점 (구조적으로 견고)

| 영역 | 내용 | 근거 |
|------|------|------|
| 색인 URL 교정 | Indexing API/canonical에 `doc.id`(=`-kr`) 대신 `baseSlug`+lang prefix 전송 | `blog.js:210-214,293-298`, `translate.js:218-220` (커밋 `4a90f9e4`) |
| hreflang 안전 | 실제 존재+published 언어만 hreflang 출력 → 유령 URL 원천 차단 | `render-blog.js:252-277` |
| 사이트맵 정합 | published만 포함 + baseSlug 정규화 + XML 이스케이프 + 중복제거 | `render-sitemap.js:47,51-54,64-69,80` (커밋 `74f504fe`) |
| 번역 JSON 방어 | 파싱→sanitize 재파싱→regex 추출 3단 + 타이틀 동일성 가드 + 이미지 복원 | `translate.js:127-174` |
| 보안 페일클로즈 | 인증 페일오픈→페일클로즈 전환, IDOR 4건 차단(N-1/C-4/C-2/C-3) | `admin-auth.js:14`, 커밋 `5715fd96` |
| 토큰 검증 | HMAC-SHA256 + `timingSafeEqual` + 길이 선검사 | `config.js:210-227` |
| API 어드민 가드 | blog/faq/gallery/ai/upload/translate/VTON 프록시까지 전 핸들러 `requireAdmin` 선두 | server 라우팅 전수 |

→ **트리거 로직과 인증 코어는 정상.** 문제는 경계 계층과 데이터 스키마에 있다.

---

## 2. 🔴 색인 멈춤 — 근본 원인 (우선순위순)

### ① [HIGH] Indexing API 권한/쿼터 실패가 조용히 누적 — **가장 유력**
- `seo.js:14` `GoogleAuth({scopes:['.../indexing']})`는 ADC(런타임 SA)에 의존. 이 SA가
  - **Search Console 속성 소유자로 미등록**이거나 **indexing scope 미부여** → 매 발행 **403**
  - 다발 발행 시 **일 200건 쿼터 초과** → **429**
- 모든 실패가 `seo.js:23` `log(..., 'WARN')` 한 줄로만 남고 **재시도·알림·카운터 없음**.
- 호출부가 전부 fire-and-forget(`blog.js:213,297`, `translate.js:219` — `await` 없음) → 실패가 발행 응답에 전혀 반영 안 됨. **"계속 멈춘다 + 가끔 된다"는 쿼터 리셋 후 재개의 전형.**
- ✅ **검증 액션**: ① Cloud Run SA가 GSC 소유자인지 ② indexing scope 부여됐는지 ③ 최근 로그에 403/429 WARN이 쌓였는지. → 이건 코드가 아니라 **운영 실측** 필요.

### ② [HIGH] `pingSitemap`이 2023년 폐기된 엔드포인트 호출 — 영구 no-op
- `seo.js:48-49` `https://www.google.com/ping?sitemap=...` → **Google이 2023년 6월 공식 폐기.** 현재 무시됨.
- `.catch(()=>{})`로 에러를 완전히 삼켜 로그조차 없음. ①이 실패해도 재크롤 유도 경로가 ping뿐인데 그것마저 죽어 색인 신호가 Google에 **전혀 도달하지 않음**.
- ✅ **수정**: ping 제거 → GSC Sitemaps API submit 또는 사이트맵 lastmod 의존.

### ③ [HIGH] Indexing API는 본래 JobPosting/BroadcastEvent 전용 — 일반 블로그는 비공식
- `seo.js:12-25` 일반 블로그 URL을 `urlNotifications:publish`로 전송. Google 정책상 일반 콘텐츠는 **200을 받아도 실제 색인이 보장되지 않고 조용히 무시**될 수 있음.
- `seo.js:21`이 200을 `"성공"`으로 로깅 → "코드는 성공이라 믿는데 GSC엔 반영 안 됨"의 구조적 괴리.
- ✅ **수정**: 일반 블로그는 사이트맵+GSC URL검사 주력, Indexing API는 보조로만.

### ④ [MED] `appendToLlmsTxt` URL이 언어 무시 — 항상 `/blog/{slug}`
- `seo.js:31-32` lang 인자가 없어 ja/en 번역본도 `https://monkos.ai/blog/...`(ko URL)로 잘못 등재. (색인 직접 멈춤은 아니나 LLM 인용 정합성 깨짐)

---

## 3. 🔀 슬러그 — 5중 분산 + 임포터 우회 (재발의 근원)

slug 생성 함수가 **5곳**에 흩어져 한글 보존 정책이 정반대다.

| # | 위치 | 한글 처리 | 길이 | 소문자화 |
|---|------|----------|------|---------|
| ① | `ai.js:21` makeSlug | 제거(영문화) | 40 | O |
| ② | `importer/note.js:19` generateSlug | **보존**(한+일) | 100 | O |
| ③ | `importer/naver.js:31` generateSlug | **보존**(한글만) | 100 | O |
| ④ | `blog.js:42` generateSlug | 제거 | 100 | O |
| ⑤ | `blog.js:68` sanitizeSlug | **보존** | 100 | **✗ 누락** |

### [심각] 임포터(note/naver)가 스키마 통일을 우회 → `-kr` 없는 한글 doc 양산
- `importer/note.js:117,177`, `importer/naver.js:218,269`: `generateSlug(title)`(한글 보존, 접미사 없음)으로 `doc(slug).set()`. **`baseSlug` 필드도 안 넣음.**
- 에디터 경로(`blog.js:164-172`)는 한글 slug를 **400으로 거부**하는데 임포터는 그대로 저장 — **정책 불일치.**
- 결과: canonical=`/blog/{한글}`, 인코딩된 한글 URL이 sitemap/canonical로 노출 → **GSC 404·중복색인.**
- → **`migrate_korean_slugs.js`(35건)·`cleanup_ghost_posts.js`가 청소한 게 정확히 이 잔재다. 마이그레이션은 증상 치료, 발생원(임포터)은 그대로라 재발한다.**

### [중] `sanitizeSlug` 소문자화 누락 + 한글 통과
- `blog.js:68-75` 조회/수정 경로(`extractSlug`→`sanitizeSlug`, `blog.js:89`)에 `.toLowerCase()` 없고 한글도 안 지움 → 생성(소문자)과 조회 규칙 비대칭.

---

## 4. 🐛 CMS 코어 — 버그/리스크

### [HIGH] 번역 본문 truncation 재발 위험 — `maxOutputTokens: 8192` (`translate.js:116`)
- 커밋 `efdbdc64`가 "번역 본문 잘림"으로 **32768로 올렸는데**, 직후 `92b4d416`("번역 트리거 수정")이 **8192로 되돌림.**
- 모델 `gemini-2.5-flash`는 thinking 토큰이 maxOutputTokens를 잠식(suggest를 256→2048로 올린 `3e787fb0`의 근거와 동일). 8192면 긴 글 JSON 직렬화에 부족.
- ⚠️ **8192 회귀가 의도였는지 확인 필요** — "트리거 수정" 커밋에 토큰 하향이 섞여 부수효과로 의심.

### [HIGH] 발행 부수효과가 `blog.js`에만 박혀 임포터가 우회
- 색인/llms.txt/sitemap ping 3종이 `blog.js:209-215,292-299`에만 있고 공통함수 미추출. 임포터는 `published:true`로 직접 set하면서 **색인 3종을 호출 안 함** → 임포트 원본은 Google 등재 누락.
- ✅ **수정**: `publishSideEffects(post, lang)` 단일 함수 추출 → create/update/importer/translate 공통 호출 (색인 누락·llms URL 버그 동시 해소).

### 데이터 모델 불균일 (생성 경로별 필드 집합 다름)
- `baseSlug`는 **에디터 글에만**, 번역본은 `originalSlug`, 임포터 글은 **둘 다 없음**. 렌더링·dedup이 3개를 fallback 체인으로 흡수해야 동작(`render-blog.js:31`). 정합성 부채.

### 기타
- [MED] viewCount가 `{slug}-kr`로 update하나 ko fallback 글은 접미사 없어 `.catch(()=>{})`로 조용히 실패 → 조회수 누락 (`render-blog.js:247`).
- [LOW] `isDuplicate` title 비교가 전 발행글 풀스캔 O(N²) (`note.js:45`, `naver.js:106`).
- [LOW] naver RSS 실패 시 "모바일 fallback 미구현"이라며 즉시 return (`naver.js:201-205`).

---

## 5. 🔒 보안 — 잔존 리스크

### [CRITICAL] `/admin/*` 정적 HTML 무인증 노출
- server.js 라우터에 `/admin/` 보호 미들웨어가 **전혀 없음**. `blog-list.html`/`blog-edit.html`/`dashboard.html`이 정적 핸들러(`server.js:382-408`)로 그대로 서빙. `noindex`뿐 인증 게이트 없음.
- `5715fd96`이 API는 막았으나 **어드민 화면 자체는 무방비** → 공격 정찰(reconnaissance) 그대로 열림.
- ✅ **가장 시급한 단일 조치**: server.js 라우터에 `requireAdmin` 기반 `/admin/*` 가드 추가.

### 기타
- [HIGH] AGENT_API_KEY 비교가 `.includes()` 비-상수시간 (`admin-auth.js:23,52`) — 타이밍 사이드채널. 세션토큰은 timingSafeEqual인데 에이전트 키만 누락.
- [HIGH] 에이전트 Bearer 키 = 만료·스코프·폐기 없는 영구 어드민 만능키 (`admin-auth.js:27`). 유출 시 회수 수단은 환경변수 재배포뿐.
- [MED] `decodeURIComponent` 미방어 (`server.js:305,316`) — malformed % 시퀀스에 500.

---

## 6. 🧹 운영부채 — "한글 slug" 단일 결함의 화석들

5개 일회성 스크립트가 전부 같은 뿌리에서 분기:
- `cleanup_ghost_posts.js` (중복 doc 수기 삭제)
- `migrate_korean_slugs.js` (교차오염 25 unpublish + 한글→영문 35건)
- `retranslate_crosscontamination.js` (한글 KO 원본 17건 재번역)
- `restore_translation_images.js` (재번역 중 유실 이미지 복구 ← 번역 파이프라인 또 다른 결함)
- `retranslate_naver_posts.js` (네이버 복구분 재번역)

그리고 **`server.js:246-304`의 301 블록(50여 줄 수기 매핑)은 이 부채의 화석** — 데이터 결함을 라우팅 레이어로 떠넘긴 전형. slug 바뀔 때마다 자라며 누구도 안전하게 못 지운다.

> 작가님 말씀대로 **"쥐가 드러낸 구조"** — 버그가 아니라 slugify 분산 그 자체가 구조 결함이다.

---

## 7. 권고 — 우선순위 로드맵

| 순위 | 조치 | 영향 | 난이도 |
|------|------|------|--------|
| **P0** | SA의 GSC 소유권·indexing scope·403/429 로그 **운영 실측** | 색인 멈춤 직결 | 점검 |
| **P0** | `/admin/*` 정적 페이지 `requireAdmin` 가드 | Critical 보안 | 소 |
| **P1** | `pingSitemap` 폐기 엔드포인트 제거 → GSC Sitemaps API | 색인 신호 도달 | 소 |
| **P1** | `translate.js:116` maxOutputTokens 8192→복원 여부 확정 | 번역 잘림 | 소 |
| **P1** | `publishSideEffects()` 단일화 → 임포터 색인 누락 해소 | 색인+정합 | 중 |
| **P2** | `lib/cms/slug.js` slugify 단일화 + 임포터에 영문 base+`-kr` 강제 | 재발 차단 | 중 |
| **P2** | 색인 호출 `await`+결과 요약 어드민 노출, 403/429 구분 로깅+카운터 | 가시성 | 중 |
| **P3** | 301 매핑 코드→`redirects` 컬렉션 이전, 일회성 스크립트 `scripts/archive/` 격리 | 부채 정리 | 중 |

---

## 8. 다음 단계 (민아 흐름)
- 본 진단 → 쌍아 설계/지시서 → 막내 실행 → 민아 재검증 경로 권장.
- **P0 운영 실측(SA/GSC)**은 코드 무관 — 작가님 판단으로 실측 착수 여부 결정 필요.
- 상세 file:line 근거는 §2~6에 전부 명기. 서브에이전트 4종 원본 분석 보존.

— 끝 —

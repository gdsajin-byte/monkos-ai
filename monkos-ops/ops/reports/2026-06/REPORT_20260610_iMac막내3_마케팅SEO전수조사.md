---
type: report
date: 2026-06-10
device: iMac
agent: 막내3
portfolio: PF_SPREAD
status: 완료
---

# 보고서 — 마케팅·SEO·브랜딩 전수 조사

**[2026-06-10 15:09 KST] iMac/막내3 → 작가님**

---

## 1. Fable 5 보고 대비 검증 결과표

| # | Fable 5 지적 항목 | 검증 결과 | 판정 | 비고 |
|---|---|---|---|---|
| 1 | `MONK_kr/index.html:343` "Gemini Chat Panel" 주석 | **실재 확인** | ✅ 확인 | HTML 주석으로 사용자에게 소스보기로만 노출. SEO 크롤러는 무시하지만 브랜딩 일관성 위반 |
| 2 | 블로그 H1 중복 | **부분 확인** — 페이지 H1(`post.title`)은 1개이나, 마크다운 본문에 `#`(H1) 사용 시 `.post-content h1` 스타일이 적용되어 이중 H1 발생 가능 | ⚠️ 조건부 | 콘텐츠 작성 시 `##` 이하만 사용하면 회피 가능. 구조적 방어(renderer에서 h1→h2 다운그레이드) 미적용 |
| 3 | 블로그 H2/H3 부재 | **오탐** — CSS에 `.post-content h2`, `.post-content h3` 스타일 존재. 마크다운 `##`, `###` 정상 렌더링 | ❌ 오탐 | 콘텐츠가 사용하지 않으면 부재로 보일 수 있으나 구조적 문제 아님 |
| 4 | 블로그 영문 메타 | **부분 확인** — 블로그 **목록 페이지**의 OG description이 영어 고정 (`"AI ID Photo tips, guides, and news"`) | ⚠️ 확인 | 블로그 **개별 포스트**는 각 포스트 언어에 맞는 동적 description 사용으로 정상 |
| 5 | 브랜딩 위반 (Gemini 노출) | **실재 확인** — 다수 파일에서 기술 엔진명 사용자 노출 | ✅ 확인 | 상세: §2 참조 |

---

## 2. Task 1: 브랜딩 준수 전수 검증

### 2-1. 내부 호칭 유출 (헌법 4조 3항 위반)

| 위험도 | 파일:행 | 내용 | 노출 경로 |
|:---:|---|---|---|
| 🔴 | `MONK_kr/ai_lab/yonga_test.html:6` | `<title>용아 챗봇 테스트 | MONK AI</title>` | 웹 접근 가능 (ai_lab 하위) |
| 🔴 | `MONK_kr/ai_lab/yonga_test.html:73` | `<h1>용아 (龍牙)</h1>` | 동일 |
| 🔴 | `MONK_kr/ai_lab/yonga_test.html:75` | "Powered by Vertex AI RAG + Gemini" | 동일 (기술엔진명 + 내부호칭 동시) |
| 🔴 | `MONK_kr/ai_lab/yonga_test.html:115` | "쌍아와 용아의 역할은?" 버튼 텍스트 | 동일 |
| 🔴 | `MONK_kr/Academy/academy.html:137` | "용아쌤" 네비게이션, 다수 출현 (156, 174, 338, 373, 394, 467행) | 웹 접근 가능 |
| 🟡 | `MONK_kr/ai_lab/ai_lab.html:435` | `// ============ 쌍아 챗봇 스키마 수집 시스템 ============` | JS 주석 (소스보기만) |
| 🟡 | `MONK_kr/ai_lab/photolab/flowchart_00079.html:475` | "생성: 2026-02-17 쌍아" | 페이지 하단 텍스트 |
| 🟡 | `MONK_kr/ai_lab/photolab/flowchart_page_split.html:919` | "2026-02-18 막내1 (지시: 쌍아)" | 동일 |
| 🟠 | `MONK_kr/_functions_backup_20260220/api/telegram-webhook.js:34` | `봇 <b>용아</b>` | 백업 폴더 (비배포), 텔레그램 응답 |
| 🟠 | `monkos_AI/portal/public/admin/data/episode_catalog.json` | 쌍아, 막내, 민아 다수 언급 | admin 경로 (robots.txt Disallow) |
| 🟠 | `monkos_AI/portal/lib/*.js` 다수 | `/** 담당: 막내2 */`, `/** 담당: 막내3 */` 등 | 서버 코드 (사용자 미노출) |
| 🟠 | `monkos_AI/crop-engine/test-*.js` | `~/Desktop/쌍아/` 경로 | 테스트 코드 (비배포) |

**요약**: `yonga_test.html`과 `academy.html`이 사용자 직접 접근 가능한 **심각도 높은** 위반. "용아쌤"이 브랜딩 의도적 노출인지 확인 필요.

### 2-2. 기술 엔진명 노출 (헌법 4조 3항 — 외부표기 MONKOS)

| 위험도 | 파일:행 | 내용 | 비고 |
|:---:|---|---|---|
| 🔴 | `MONK_kr/ai_lab/ai_lab.html:15` | `<meta name="description">` "Imagen 4.0 기반" | 검색 결과에 직접 노출 |
| 🔴 | `MONK_kr/ai_lab/ai_lab.html:19` | OG description "Imagen 4.0 기반" | SNS 공유 시 노출 |
| 🔴 | `MONK_kr/ai_lab/yonga_test.html:75` | "Powered by Vertex AI RAG + Gemini" | 페이지 텍스트 |
| 🔴 | `MONK_kr/ai_lab/photolab/_legacy/index.html:8,12` | meta/OG "Imagen 4.0 기반" | 레거시이나 접근 가능 |
| 🟡 | `MONK_kr/ai_lab/lookbook/index.html:401` | "Imagen 재생성" 버튼 텍스트 | UI 텍스트 |
| 🟡 | `MONK_kr/index.html:343` | `<!-- Gemini Chat Panel -->` | HTML 주석 |
| 🟡 | `MONK_kr/index.html:252` | `id="status-gemini"` — 텍스트는 "Monkos.ai"로 정상 | ID만 gemini (소스보기) |
| ⚪ | `MONK_kr/ai_lab/photolab/engine/server.js` | Gemini/Imagen 모델명 다수 | 서버 코드 (미노출) |
| ⚪ | `MONK_kr/config.js:10-11` | `GEMINI_PROXY`, `IMAGEN_PROXY` | JS 변수명 (미노출) |

**핵심 서비스 페이지** (portal/index.html, idphoto-kr, idphoto-jp): **기술 엔진명 노출 0건** ✅

### 2-3. 브랜드명 일관성 (`<title>`, `<meta>`, OG)

| 사이트 | title | meta description | OG title | 판정 |
|---|---|---|---|---|
| monk.kr | MONK | 몽크사진관... | MONK | ✅ |
| monkos.ai (portal) | MONKOS AI | AI 증명사진... | MONKOS AI | ✅ |
| idphoto-kr | MONKOS AI 증명사진 | AI 실시간 코칭... | MONKOS AI 증명사진 | ✅ |
| idphoto-jp | MONKOS AI証明写真 | AIリアルタイムコーチング... | MONKOS AI証明写真 | ✅ |
| ai_lab | MONKOS AI LAB | **"Imagen 4.0 기반"** 🔴 | MONKOS AI LAB | ⚠️ desc 위반 |

---

## 3. Task 2: 기술 SEO 구조 점검

### 3-1. H1/H2/H3 계층 분석

| 페이지 | H1 수 | H2 수 | H3 수 | 판정 |
|---|:---:|:---:|:---:|---|
| `MONK_kr/index.html` | 1 | 5 | 3 | ✅ 정상 |
| `monkos.ai` (portal) | 1 | 5 | 6+ | ✅ 정상 |
| `idphoto-kr` | 1 | 3 | 1 | ✅ 정상 |
| `idphoto-jp` | 1 | 3 | 1 | ✅ 정상 |
| 블로그 목록 (`/blog`) | 1 ("Blog") | 0 (카드는 h2) | 0 | ⚠️ H1 영문 고정 |
| 블로그 포스트 (`/blog/:slug`) | 1 (제목) | 콘텐츠 의존 | 콘텐츠 의존 | ⚠️ 마크다운 H1 미차단 |

**블로그 목록 H1 문제**: `<h1>Blog</h1>`이 언어 무관 영문 고정. `/ja/blog`에서도 "Blog"로 표시.

### 3-2. 메타태그 언어 일치

| 사이트 | `<html lang>` | `<title>` 언어 | `<meta description>` 언어 | 판정 |
|---|---|---|---|---|
| monk.kr | `ko` | 한국어 | 한국어 | ✅ |
| monkos.ai | `ko` | 한국어 | 한국어 | ✅ |
| idphoto-kr | `ko` | 한국어 | 한국어 | ✅ |
| idphoto-jp | `ja` | 일본어 | 일본어 | ✅ |
| 블로그 목록 (ko) | `ko` (동적) | 한국어 | 한국어 | ✅ |
| **블로그 목록 OG** | — | — | **영어 고정** | 🔴 `render-blog.js:51` |

### 3-3. hreflang 양방향 검증

| 사이트 | ko | ja | en | x-default | 양방향 | 판정 |
|---|:---:|:---:|:---:|:---:|:---:|---|
| monkos.ai (portal) | ✅ | ✅ | ✅ | ✅ | ✅ | 완전 |
| idphoto-kr | ✅ | ✅ | — | ✅ | ✅ | 정상 (en 서비스 없음) |
| idphoto-jp | ✅ | ✅ | — | ✅ | ✅ | 정상 |
| studio (hreflang 有) | ✅ | ✅ | — | ✅ | ✅ | 정상 |
| **monk.kr** | — | — | — | — | — | 🔴 **hreflang 미구현** |
| 블로그 목록 | ✅ | ✅ | ✅ | ✅ | ✅ | 정상 |
| 블로그 포스트 | 동적 검증 후 출력 | — | — | 조건부 | ✅ | 정상 (유령URL 방어 로직 有) |

**monk.kr hreflang 부재**: monk.kr은 한국어 단일 사이트이므로 monkos.ai와의 관계를 명시할 필요 없으면 허용. 단 monk.kr이 monkos.ai와 동일 서비스 다국어 버전이라면 설정 필요.

### 3-4. JSON-LD 스키마

| 사이트 | 적용 스키마 | 판정 |
|---|---|---|
| monk.kr | Organization, FAQPage, BreadcrumbList, Person | ✅ 우수 |
| monkos.ai (portal) | Organization(추정), Product(추정) | ✅ |
| idphoto-jp | 2개 스키마 (Organization + ?) | ✅ |
| 블로그 포스트 | Article (headline, author, publisher, dates) | ✅ 우수 |
| 블로그 목록 | Blog (name, description, publisher) | ✅ |
| ai_lab | Organization | ✅ |
| Academy | — | 🟡 미적용 |
| photolab | Organization (index_00079) | ✅ |

### 3-5. robots.txt / sitemap.xml

| 사이트 | robots.txt | sitemap.xml | 블로그 포함 | 판정 |
|---|---|---|---|---|
| monk.kr | ✅ (AI 크롤러 허용) | ✅ 정적 (15 URL) | **❌ 블로그 미포함** | ⚠️ |
| monkos.ai (portal) | ✅ (AI 크롤러 허용, /admin 차단) | ✅ 동적 (Firestore 블로그 포함) | ✅ | 우수 |
| idphoto-kr | ✅ (앱경로 차단) | ✅ 정적 (7 URL) | — | ✅ |
| idphoto-jp | ✅ (앱경로 차단) | ✅ 정적 (가이드 포함) | — | ✅ |
| **studio** | 🔴 `Disallow: /` (전체 차단) | 없음 | — | 🔴 의도적? |

**monk.kr sitemap 문제**: 블로그 콘텐츠가 monkos.ai에서 제공되므로 monk.kr sitemap에 미포함은 정상. 다만 monk.kr에서 참조하는 `/specs/sitemap.xml` 파일 존재 여부 미확인.

**studio robots.txt**: `Disallow: /` 전체 차단 — studio가 레거시 또는 preview 상태라면 의도적. 실서비스라면 심각한 SEO 차단.

### 3-6. 포털 미해결 SEO 이슈 (기존 기록 교차 확인)

portal_seo.md에 기록된 미해결 이슈 현존 확인:
- `/pricing` 404 (JS 인터셉트 의존)
- `/guide` 404 (라우트 미존재)
- 포털 파비콘 Google 미노출

---

## 4. Task 3: 콘텐츠·채널 현황

### 4-1. 블로그 콘텐츠 (`monkos-ops/contents/blog/`)

| 항목 | 수치 |
|---|---|
| 총 파일 수 | 11건 (시드 스크립트 1건 포함) |
| 한국어 (KR) | 7건 |
| 일본어 (JP) | 1건 (`shushoku-shomei-shashin-kitei_JP`) |
| 영어 (EN) | 1건 (`dead-folders-to-living-system_EN`) |
| 기술문서/기타 | 2건 (SPEC, seed) |
| 최근 작성일 | 2026-06-10 (`rtx4060-local-ai-coding-agent-benchmark_KR`) |
| 최초 작성일 | 2026-03-18 (`크롭앱개발기`) |

### 4-2. 마케팅 자산 (`monkos-ops/marketing/`)

| 구분 | 현황 |
|---|---|
| 전략 문서 | 9건 (MARKETING_MASTER_STRATEGY, 광고오가닉부스터, KEYWORD_LEXICON 등) |
| 꾸(와이프) 채널 | 구조만 (outbox/inbox/reference — 빈 README) |
| 한(한송이) 채널 | outbox 1건, inbox 2건, reference 3건 |
| 실행 산출물 | 한송이 공유 보고서 1건 (SPREAD 실전검증) |

### 4-3. 일본 시장 콘텐츠

| 채널 | 현황 |
|---|---|
| note.com (@monkos_ai) | 연동 = CDP 부분자동화. 콘텐츠 = 한송이 매거진 시리즈 진행 중. ops 내 JP 블로그 원고 1건 |
| Blogger | 연계 증거 없음 (코드/ops에서 미발견) |
| idphoto-jp 가이드 | 3건 (app-comparison, shukatsu, ai) — sitemap 등록 완료 |
| X (@Photo_monkos) | 운영 중 (PF 기록 기준), 프리미엄 적용 |

---

## 5. 신규 발견 (Fable 5 미지적)

| # | 항목 | 위치 | 심각도 | 설명 |
|---|---|---|:---:|---|
| N1 | 블로그 목록 OG description 영어 고정 | `render-blog.js:51` | 🔴 | ko/ja 요청에도 "AI ID Photo tips, guides, and news" 출력 |
| N2 | 블로그 목록 H1 영어 고정 | `render-blog.js:165` | 🟡 | `<h1>Blog</h1>` — 다국어 미대응 |
| N3 | "용아쌤" Academy 전면 노출 | `academy.html` 다수 | 🔴 | 내부호칭인지 공식 브랜딩인지 판단 필요 |
| N4 | studio robots.txt 전체 차단 | `studio/public/robots.txt` | 🟡 | `Disallow: /` — 의도 확인 필요 |
| N5 | monk.kr sitemap에 블로그 미포함 | `MONK_kr/sitemap.xml` | 🟡 | monk.kr 블로그가 별도이면 정상 |
| N6 | 마크다운 H1 다운그레이드 미구현 | `render-blog.js` (blogRenderer) | 🟡 | 콘텐츠 `#` 사용 시 이중 H1 |
| N7 | episode_catalog.json 내부호칭 | `portal/public/admin/data/` | ⚪ | robots.txt에서 /admin 차단으로 SEO 영향 없음 |
| N8 | ai_lab 하위 다수 레거시 파일 | `_legacy/`, `flowchart_*.html` | 🟡 | 내부 개발문서가 크롤링 가능 상태 |

---

## 6. SEO 즉시 수정 가능 목록

| 우선 | 항목 | 파일 | 수정 내용 | 난이도 |
|:---:|---|---|---|:---:|
| 1 | 블로그 목록 OG desc 다국어화 | `render-blog.js:50-51` | `seoMeta`의 og:description을 `meta.description`으로 대체 | 1줄 |
| 2 | 블로그 목록 H1 다국어화 | `render-blog.js:165` | `<h1>${{ko:'블로그',ja:'ブログ',en:'Blog'}[htmlLang]}</h1>` | 1줄 |
| 3 | ai_lab.html meta "Imagen" 제거 | `ai_lab.html:15,19` | "Imagen 4.0 기반" → "MONKOS AI 기반" | 2줄 |
| 4 | 마크다운 H1→H2 다운그레이드 | `render-shell.js` (blogRenderer) | marked renderer의 heading에서 level+1 처리 | 5줄 |
| 5 | yonga_test.html 접근 제한 | `robots.txt` 또는 디렉토리 이동 | `/ai_lab/yonga_test.html` Disallow 추가 또는 삭제 | 1줄 |
| 6 | ai_lab 레거시 크롤링 차단 | `robots.txt` | `Disallow: /ai_lab/_legacy/` 추가 | 1줄 |

---

## 7. 종합 판정

| 영역 | 상태 | 요약 |
|---|:---:|---|
| **핵심 서비스 브랜딩** (portal, idphoto-kr/jp) | ✅ | 기술엔진명 0건, 내부호칭 0건 |
| **monk.kr 본진 브랜딩** | ⚠️ | ai_lab 하위에 Imagen/Gemini/용아 다수 노출 |
| **기술 SEO 구조** | ✅ | heading 정상, hreflang 양방향 완료, JSON-LD 적용 |
| **블로그 SEO** | ⚠️ | OG 영문 고정, H1 영문 고정, H1 중복 가능성 |
| **콘텐츠 볼륨** | ⚠️ | ops 블로그 원고 11건, JP 1건 — Firestore 실배포 수는 미측정 |
| **마케팅 실행** | ⚠️ | 전략 수립 완료, 자동화 파이프라인 미완 (Phase 1 진행중) |

---

*보고서 끝*

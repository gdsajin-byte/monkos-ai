---
type: report
date: 2026-06-24
device: iMac
agent: 민아
portfolio: PF_CITADEL
status: 완료
---

# 포털 라우팅 헬스 + 전환 동선 링크시스템 설계

> **[2026-06-24 14:02 KST]** iMac/민아 → 작가님
> 기준: 라이브 HTTP 실측(54 URL) + GA4(521406894) 30일 + GSC(sc-domain:monkos.ai) 28일 + 인기/유입 상위 13개 페이지 전환 동선 병렬 감사(read-only)
> 연계: 막내3 SEO 내부경합 종합감사(2026-06-24 13:00), 막내 render-blog.js CTA 작업(P0, 미커밋 진행 중)
> 범위: **진단·설계·검증**(민아 본령). 코드 구축은 막내 합류 — 본 설계는 쌍아→막내 경로로 실행.

---

## 0. 한눈 결론

- **라우팅 헬스**: ko/ja/en 전 라우트 정상(200/301/302/410 의도대로). portal-context 문서의 `/pricing`·`/guide` 404 미해결 이슈는 **이미 해소**(문서가 stale — 별도 정정 필요).
- **진짜 문제는 라우팅이 아니라 전환 동선**: 감사 13페이지 중 **broken 5 / partial 8 / good 0**. "자주 방문하는 페이지 → 서비스 → 결제" 깔때기가 단일 지점들에서 끊겨 있음.
- **broken의 공통 원인 단 2개** (고ROI):
  1. **블로그 CTA 화이트리스트 게이트** — 50+편 중 2편만 CTA 렌더 (막내 진행 중 작업이 정확히 이 지점)
  2. **specs 상세 CTA의 bare 홈 하드코딩**(`render-specs.js` L1516) — 고노출 관문(license/kr 927·passport/kr 828)이 촬영실이 아닌 일반 홈으로 새어나감
- **specs 301 관문**: 301 체인 자체는 건강(1홉, canonical 신URL 자기참조 정상). 새는 곳은 리다이렉트가 아니라 착지 후 CTA href.

---

## 1. 라우팅 헬스 전수 (라이브 실측 54 URL)

| 그룹 | 결과 |
|------|------|
| SSR 라우트 ko (`/`, `/blog`, `/guide`, `/guide/ai-photo`, `/faq`, `/pricing`, `/headshot`, `/specs`, `/gallery`, `/board`, `/crop`) | 전부 **200** |
| SSR 라우트 ja/en (각 동일 매트릭스) | 전부 **200** |
| `/app` → idphoto-kr | **302** (정상) |
| `/kr`→`/`, `/jp`→`/ja` | **301** (정상) |
| 레거시 `/monk_studio/*`·`/ai_lab/*`·`/b2b/`·`/debate` | **410 Gone** (의도대로 색인 제거 신호) |
| sitemap(.xml ×4)·llms.txt·health | **200** |

**specs URL 정규화 301 (검색 고노출 관문)**:

| 구 URL (GSC 노출) | → 301 → | 신 URL (200) |
|---|---|---|
| `/specs/korea-drivers-license` (927) | → | `/specs/license/kr` |
| `/specs/korea-passport` (828) | → | `/specs/passport/kr` |
| `/specs/korea-resident`·`/specs/resident/korea` (499) | → | `/specs/id/kr` |
| `/specs/passport/korea` | → | `/specs/passport/kr` |
| `/specs/jp-license` | → | `/specs/license/jp` |
| `/specs/vn-passport` | → | `/specs/passport/vn` |

→ **라우팅 레이어는 건강**. 문제는 착지 페이지의 전환 장치(§2 이하).

### 트래픽 컨텍스트 (실측)

- GA4 인기(30일): `/` 1282뷰(오가닉 12.5%), `/camera.html`·`/prep`·`/result.html`(앱 내부), `/specs` 90, `/crop` 71, `/headshot` 21
- GSC 검색 유입(28일): `/blog/vol36`(190노출 18클릭), `/specs/korea-drivers-license`(927노출 CTR 0.86%), `/specs/korea-passport`(828 CTR 0.6%), `/blog/vol17-vs`, `/guide/ai-photo`(103노출)
- → **블로그·specs가 검색 유입을 담당(거의 100% 오가닉), 포털 메인은 87.5% 비오가닉**. 유입은 외곽/성벽이, 전환 목적지는 메인/서비스. 그 사이 링크가 끊김.

---

## 2. 전환 동선 매트릭스 (13페이지 감사)

| 페이지군 | URL | Verdict | 서비스 CTA | 결제 동선 | 핵심 결손 |
|---------|-----|:---:|:---:|:---:|---------|
| 홈 | `/` | partial | 2(히어로·헤드샷) | ✗ 본문無 | 본문에 /pricing·크레딧 CTA 0개. /pricing은 네비에만, 충전은 JS모달만 → 비로그인 오가닉(12.5%)엔 결제 동선 SSR 비노출 |
| 결제 | `/pricing` | partial | 0 | ✓ /credits | 유료 서비스 진입 CTA 본문 0개. "가격만 보고 만들러 갈 길 없음" |
| specs 허브 | `/specs` | **broken** | 0 | ✗ | 서비스 CTA 0개. 417개 내부링크 전부 /specs/* 상세로만 |
| specs 상세 | `/specs/license/kr` | **broken** | 1(홈root) | ✗ | CTA가 bare 홈으로만. 크롭툴이 작동 안 하는 정적 목업 → 전환 최고지점이 막다른 길 |
| specs 상세 | `/specs/passport/kr` | partial | 1(홈root) | ✗ | CTA href L1516 `https://monkos.ai` 하드코딩 → 여권 의도를 일반 홈으로 |
| specs 상세 | `/specs/id/kr` | partial | 1(홈root) | ✗ | 크롭 BEFORE/AFTER 정적 이미지, 전환 지점 dead-end |
| 블로그 리스트 | `/blog` | **broken** | 0 | 네비만 | 서비스 CTA 0개. `.header-cta` CSS 정의됐으나 미사용 |
| 블로그 상세 | `/blog/vol36` | **broken** | 0 | 네비만 | CTA가 `SEO_TITLE_OVERRIDES[slug]` 참일 때만 삽입. vol36 미등록 → CTR 9.5% 유입이 매출 미연결 |
| 블로그 상세 | `/blog/vol17-vs` | **broken** | 0 | ✗ | 화이트리스트 미등록. 일본 타깃인데 idphoto-jp 링크 전무 |
| 블로그 상세 | `/blog/selfie-to-id-photo-ai-guide` | partial | 2(홈겸용) | 네비만 | 슬러그 미등록 CTA suppressed. 본문 서비스 링크 2개 모두 bare 홈 |
| 가이드 | `/guide/ai-photo` | partial | 2(하단) | ✗ | 히어로/인트로 CTA 부재, 결제 동선 본문 전무 |
| 가이드 | `/guide` | partial | 3 | 네비만 | 하단 primary가 `/`(홈)로 → 클릭→촬영 1홉 누수 |
| 헤드샷 | `/headshot` | partial | 4(인페이지) | JS모달 | 내부링크 0개. ko URL이 영문 콘텐츠 서빙+canonical=/en/headshot (ko 색인 누수 추정) |

**공통 패턴 3가지**:
- **(A)** 서비스 CTA가 bare 홈(`https://monkos.ai`)으로만 → specs 상세 3건·블로그 2건. "촬영실 직진 1홉 누수" 반복
- **(B)** 결제 동선이 본문 부재, 네비/JS모달 의존 → 거의 전 페이지
- **(C)** 블로그 CTA가 슬러그 화이트리스트(2개)에 묶임 → 막내3 감사("CTA 자동삽입 2편뿐")와 일치

---

## 3. 링크시스템 설계도

표준 동선: **콘텐츠/유입 페이지 → 서비스(촬영실) → 결제(/pricing·크레딧)**

### 3-1. 표준 CTA 블록 3종 (재사용 컴포넌트)

| 블록 | 구성 | 용도 | 리전 분기 |
|------|------|------|----------|
| `mk-cta-band` | 1차=촬영실 직진 + 2차=`/pricing` | 콘텐츠 본문 하단 회수 후크 | ko→idphoto-kr, ja→idphoto-jp, else→/headshot |
| `mk-hero-cta` | above-the-fold 단일=촬영실 | 검색 유입 첫 화면 | 동일 |
| `mk-header-cta` | 네비 우측=촬영실 | 전 페이지 상시 | 동일 |

> **리전 분기 정본**: `home.js` 396-398행 `paymentRegion` 로직 채택. 단 **else 폴백이 '증명사진 만들기' 문구와 불일치** → 폴백 시 CTA 카피 동적 변경("헤드샷 만들기") 정합 필요.

### 3-2. 페이지 유형별 심을 위치 (코드 위치 검증 완료 — 전 파일 실재)

| 페이지 유형 | 블록 | 코드 위치 | 담당 |
|------------|------|----------|------|
| 전 페이지 네비 | `mk-header-cta` | `render-shell.js` `.header-cta`(정의됨·미사용) → layoutNav | 쌍아→막내 |
| 홈 `/` | `mk-cta-band` | `home.js` resourcesHtml(289-315) + idpassHtml(263-287) | 쌍아→막내 |
| 결제 `/pricing` | 유료 진입 CTA + 비용표 행 클릭화 | `render-pricing.js` svc 행 link 부여 + 셀 래핑 + L228-230 2버튼화 | 쌍아→막내 |
| specs 허브 | `mk-hero-cta`+`mk-cta-band` | `render-specs.js` 히어로 `.specs-hero-cta`(정의됨·미사용) + 하단 footer 위 | 쌍아→막내 |
| specs 상세(공통) | CTA href 교정 + 크롭툴 라이브화 + 히어로 CTA | `render-specs.js` L1516 href, #specs-crop-embed L1417, 히어로 | 쌍아→막내 |
| 가이드 | 히어로 CTA + pricing 링크 | `render-static.js` guideFragment·aiPhotoGuideFragment | 쌍아→막내 |
| 헤드샷 | 내부링크 0→3+ + pricing 링크 + 라우팅 정합 | `render-headshot.js` hs-how(279-298) + forceLang | 쌍아→막내 |
| **블로그 리스트/상세** | `mk-cta-band` / 조건부→공통 분리 | `render-blog.js` (L465 등) | ⚠️ **막내(진행 중) 단독 소유** |

### 3-3. 막내 작업과 역할 분담 (충돌 방지 — 06-22 결제블로커 1시간 중복 교훈)

- **막내 단독 소유**: `render-blog.js` 전체. L465 화이트리스트 분리·bodyContent CTA·리전 분기 모두 막내 미커밋 작업 귀속. **타 에이전트 진입 금지.**
- **본 설계 담당**: `render-specs.js`·`render-static.js`·`render-headshot.js`·`render-pricing.js`·`render-shell.js`·`home.js` (render-blog.js 제외).
- **공유 표준만 합의**: 막내가 정의하는 CTA 클래스명·리전 분기 함수를 표준(`mk-cta-band` 등)으로 추출. **막내 커밋 패턴을 정본으로**, 나머지 렌더러가 따라감.
- **순서**: 막내 render-blog.js 커밋 → 패턴 확정 → 쌍아 설계서 발행(타 렌더러) → 별도 막내 실행. **병렬 동시 수정 금지.**

---

## 4. 우선순위 액션 리스트

### P0 (즉시 — 매출 직결)
| # | 액션 | 파일 | 효과 | 막내3 연계 |
|---|------|------|------|-----------|
| P0-1 | 블로그 CTA 화이트리스트 분리 → 전 글 공통 | `render-blog.js` L465 **(막내 진행 중)** | 2편→전편. vol36(CTR 9.5%)·vol17-vs 유입이 촬영실로 | "CTA 2편뿐" 직접 해소 |
| P0-2 | specs 상세 CTA href: bare 홈 → 촬영실 직진 | `render-specs.js` L1516 | **모든 /specs/*/* 공통 프래그먼트 일괄 반영, ROI 최대** | 고노출 927·828 전환 회수 |
| P0-3 | 결제 페이지 유료 서비스 진입 CTA 신설 | `render-pricing.js` L228-230 | "충전 후 빈손" 해소 | — |

### P1 (단기 — broken 해소)
| # | 액션 | 파일 | 효과 |
|---|------|------|------|
| P1-1 | specs 허브 히어로 CTA(미사용 `.specs-hero-cta` 활성) | `render-specs.js` | broken→partial, 상세 안 거치고 진입 |
| P1-2 | specs 상세 크롭툴 목업 라이브화 | `render-specs.js` L1417 | 전환 최고지점 막다른 길 제거 |
| P1-3 | 전 페이지 공통 네비 CTA(미사용 `.header-cta` 활성) | `render-shell.js` | 전 포털 상시 진입점 |
| P1-4 | 홈 본문 전환/결제 밴드 | `home.js` 289-315 | 트래픽 1위 콘텐츠 독파자 회수 |

### P2 (보강)
| # | 액션 | 파일 |
|---|------|------|
| P2-1 | 헤드샷 내부링크 0→3+ + pricing 링크 | `render-headshot.js` 279-298 |
| P2-2 | 헤드샷 ko/en canonical 정합(forceLang) | `render-headshot.js` + 라우팅 [추정] |
| P2-3 | 가이드 히어로 CTA + pricing 링크 | `render-static.js` |
| P2-4 | 홈 idphotoUrl 폴백 문구-링크 정합 | `home.js` 396-398 |

---

## 5. specs 301 관문 처리 권고

- **301 체인 유지가 정답**: 신URL이 직접 200(1홉, 다단 아님), canonical 신URL 자기참조 정상 → **추가 조치 불필요**.
- **CTR 0.6~0.86% 저조는 301 문제 아님** [추정]: 301은 순위를 깎지 않음. 노출↑ 클릭↓ = SERP 타이틀/스니펫 매력도 + 전환장치 부재 문제 → 메타 최적화는 별도 과제.
- **전환 측면(핵심)**: 301 고노출 트래픽이 현재 bare 홈 CTA(L1516)로만 빠져 1홉 누수 → **P0-2가 301 관문 ROI를 직접 끌어올림**.
- **규격 프리셋 진입 권고**: passport/kr → `idphoto-kr.monkos.ai?spec=passport`로 진입 즉시 프리셋. 단 **[추정] 촬영실 쿼리 프리셋 지원 여부 미확인** → 실서비스 라우트 확인 후 확정.
- GSC sitemap에 신URL만 등재됐는지(구URL 잔존 제거) 확인 권고.

---

## 6. 검증 체크리스트 (민아 재검증 — 라이브, 구축 후)

> 코드 작성자(쌍아/막내) 자기검증 금지 → 민아 본령. 구축 완료 후 라이브 실측으로 재검증.

**A. 블로그 CTA (P0-1)** — vol36·vol17-vs 등 화이트리스트 미등록 글에 idphoto CTA 렌더 / 일본 타깃 글 idphoto-jp 분기 / SEO title 조건과 CTA 조건 분리 확인
**B. specs (P0-2/P1-2)** — license/kr·passport/kr·id/kr 하단 CTA href가 촬영실 직진 / 크롭툴 클릭 가능 / 허브 히어로 CTA / ja·en forceLang 분기
**C. 결제 (P0-3/P1-4)** — /pricing 본문 유료 진입+충전 2버튼·비용표 클릭 / 홈 비로그인 SSR에 결제 동선 노출
**D. 네비·헤드샷 (P1-3/P2)** — 전 페이지 `.header-cta` 렌더+리전분기 / `/headshot` 내부링크 0→3+ / ko canonical 오염 해소
**E. 리전 정합(전역)** — paymentRegion kr/jp/미판정 각 케이스 CTA 링크-문구 일치 / 301 구URL GSC sitemap 제거

---

## 부록: 검증된 사실 vs 추정

- **검증(라이브/코드 Read)**: 라우팅 헬스 54 URL, 13페이지 CTA/링크 구조, 렌더러 파일 8종 실재 및 라인 위치, specs 301 체인, CTA href 하드코딩(L1516), 블로그 화이트리스트 게이트
- **추정([추정] 표기)**: 헤드샷 ko/en canonical 누수의 색인 영향, 촬영실 쿼리 프리셋 지원, CTR 저조의 메타 원인 — 모두 막내 구축 전 추가 확인 필요

> **핵심 한 줄**: broken 5건의 원인은 ① 블로그 CTA 화이트리스트(막내 소유), ② specs CTA bare 홈 하드코딩(L1516) — 둘 다 단일 지점 수정으로 전 페이지 일괄 반영되는 고ROI 구간. render-blog.js는 막내, 나머지는 쌍아→막내 경로로 분리 진행하여 병렬 충돌 차단.

---
type: design
date: 2026-07-23
device: iMac
agent: 쌍아
status: 초안
portfolio: PF_SPECS
---

# SPECS SSG 전환 + IDPASS 쉘 + 점진 이관 설계서

**[2026-07-23 14:51 KST]** iMac/쌍아 → 작가님

> **발단**: 작가님 — "4060에 인쇄기 세팅, IDPASS 호스팅, 필름 완성되면 찍어내기"
> **선행 설계**: [아키텍처 3분리](DESIGN_20260721_아키텍처전환_CF_CR_4060_3분리.md) (PF_INFRA, 7/21) + [민아 교차검증](../../reports/2026-07/REVIEW_20260721_M1민아_아키텍처3분리_교차검증.md)
> **PoC**: [SSG PoC 완료보고](../../reports/2026-07/COMPLETION_20260721_M1막내3_INFRA_SSG_PoC_monkkr.md) — kr-passport SSG, LCP 22.7s→6.3s 실증

---

## §1 핵심 결정 (7/23 작가님 확정)

| # | 결정 | 근거 |
|---|------|------|
| 1 | SSG는 종착점이나 **일괄 전환하지 않는다** | 콘텐츠·템플릿 변동 빈도가 주 단위 — 안정기 전 SSG는 빌드·배포 반복이 발목 |
| 2 | 4060에 **인쇄기(빌드 파이프라인)** 세팅 | BiRefNet 서빙으로 CF 터널+NSSM 패턴 검증 완료 |
| 3 | CF Pages에 **IDPASS 호스팅** 먼저 | 허브 페이지 + 준비된 specs 페이지부터 점진 탑재 |
| 4 | **필름(콘텐츠) 완성분부터 찍어서 올림** | SSR 공존 구간을 두고, CF SSG와 CR SSR 병행 |
| 5 | PF_SPECS 귀속 | specs 페이지가 CF로 가는 것이 본질 |

---

## §2 시타델 구조 (7/23 민아 분석 + 작가님 방향 지지)

> "한 헤드텀 = 한 시타델". 포털 루트는 브랜드 우산, 헤드텀은 제품 시타델이 소유.

| 시타델 | 소유 헤드텀·인텐트 | 인프라 |
|--------|-------------------|--------|
| **IDPASS** (/idpass + /specs/*) | 증명사진·여권사진·비자사진 — 규격/무료/만들기 + 국가×문서 롱테일 | CF Pages |
| idphoto-kr/jp | 취업사진·이력서사진 — 촬영/보정 품질 (유료) | CR 유지 |
| Headshot (/headshot) | AI headshot·LinkedIn·비즈 프로필 (EN) | CR 유지 |
| 포털 루트 | MONKOS 브랜드텀 only | CR→CF 순차 |

### "/specs = IDPASS 페이지" 구현 방식

- **URL 불변 대원칙**: 1,284 URL은 7/16에 대이동 완료한 라이브 자산. 재이동 금지.
- **브랜딩은 쉘 스킨으로**: specs 말단 페이지의 헤더에 "IDPASS by MONKOS" + IDPASS 내부 네비(여권/비자/이력서/신분증). 7/15 보고서 §4.5 소유권 L1의 첫 실전.
- **/idpass 허브 신설**: 백링크·앱 리퍼럴의 단일 랜딩 (7/15 확정 유지).
- **/specs 허브(인덱스) → /idpass 흡수 + 301**: GSC상 /specs 허브 자체 SEO 지분 0. server.js:1079에 타깃 변경 주석 예약 기완료.

---

## §3 아키텍처 — 등사기와 필름

```
[인쇄기 — 4060]
  빌드 스크립트 (build-specs.js)
    └─ render-specs.js 무변경 import
    └─ IDPASS 쉘 적용
    └─ 429slug × 6lang = 2,574 HTML 생성
    └─ _redirects 자동 생성
    └─ wrangler pages deploy

[CF Pages — 서빙]
  /idpass/*       허브 SPA
  /specs/*        SSG 정적 HTML (IDPASS 쉘)
  /api/*          → CR proxy (CF Workers)
  /auth/*         → CR proxy (OAuth 콜백)

[CR — API only]
  /api/idphoto/*  사진 처리
  /api/credits/*  크레딧
  /api/payments/* 결제 (Toss/Lemon)
  /api/auth/*     OAuth
  /toss-success   결제 완료 SSR (CR 잔류)
  /toss-fail      결제 실패 SSR (CR 잔류)

[공존 구간]
  CF SSG 미탑재 specs → CR SSR이 계속 서빙
  CF SSG 탑재 완료 specs → CF가 서빙
```

### 결제·인증 모듈 결합 판정 (7/23 실측)

| 항목 | 판정 | 근거 |
|------|------|------|
| 모듈 분리 | ✅ | auth.js·payments.js·credits.js 독립 모듈, server.js는 순수 라우터 |
| API 호출 패턴 | ✅ | idphoto-kr/jp/studio가 이미 cross-service 호출 검증 |
| SSR 인증 주입 | ✅ 없음 | 클라이언트 `fetch('/api/auth/verify-cookie')`로 복원, SSG 무관 |
| 쿠키 도메인 | ⚠️ | `Domain=.monkos.ai` 9곳 하드코딩 — `*.monkos.ai` 안이면 무변경 |
| CORS | ⚠️ | `ALLOWED_ORIGINS` 정적 배열 — CF Pages 도메인 1행 추가 필요 |

**판정: `*.monkos.ai` 서브도메인 유지 시 결제·인증 코드 무변경으로 동작.**

---

## §4 IDPASS 쉘 설계

### 4-1. 쉘 구조

현재 `layoutShell(parts)`이 모든 페이지의 HTML 외피를 생성 (render-shell.js).
IDPASS 쉘은 이 shell의 **변형**으로, 헤더·내비·푸터를 IDPASS 브랜딩으로 교체.

```
┌─────────────────────────────────────┐
│  IDPASS by MONKOS           [네비]  │  ← IDPASS 헤더
│  여권 | 비자 | 이력서 | 신분증      │  ← 카테고리 내비
├─────────────────────────────────────┤
│                                     │
│  (기존 specs 상세 콘텐츠 그대로)     │  ← specsDetailFragment 무변경
│                                     │
├─────────────────────────────────────┤
│  IDPASS 푸터                        │  ← 앱 다운로드 CTA + 관련 규격
└─────────────────────────────────────┘
```

### 4-2. 구현 방식

- `render-shell.js`에 `shellVariant` 파라미터 추가 (기본값 'portal', IDPASS용 'idpass')
- specs 빌드 시 `parts.shellVariant = 'idpass'` 설정 → layoutShell이 IDPASS 헤더·네비 렌더
- 카테고리 내비 데이터: specs-data.json의 기존 type 분류 활용 (passport/visa/id/custom)
- SSR 구간에서도 동일 쉘 적용 가능 (공존 구간 일관성)

### 4-3. /idpass 허브

- 바닐라 SPA (ch2 준수, React/Vue 없음)
- History API + 경량 라우터 (~50줄, 7/21 설계 유지)
- 주요 페이지: / (랜딩+규격 검색), /upload, /result, /pay
- specs-funnel.js **재사용** (신규 퍼널 로직 재구현 금지 — 7/7 재해석 금지 원칙)

---

## §5 SSG 빌드 파이프라인 (4060 인쇄기)

### 5-1. PoC에서 본 빌드로

PoC (build-specs-poc.js, 25행)가 증명한 것:
- render-specs.js 무변경 import → fragment → layoutShell → 파일 저장
- SSR vs SSG HTML 구조 100% 동일 (환경변수 의존 항목 제외)
- LCP 22.7s → 6.3s (3.6배 개선)

본 빌드 (build-specs.js)에 추가되는 것:
- 429slug × 6lang 루프
- IDPASS 쉘 적용
- paymentRegion 하이드레이션 분리 (§6 크리티컬 2)
- _redirects 자동 생성 (§6 게이트 1)
- 사이트맵 정적 생성

### 5-2. 4060 빌드 환경

```
4060 (Windows, Tailscale ssh)
  C:\Users\smuse73\specs-builder\
    ├─ build-specs.js        본 빌드 스크립트
    ├─ portal/               git sparse-checkout (lib/cms/ + lib/shared/)
    └─ dist/                 빌드 출력
      ├─ specs/ko/kr-passport/index.html
      ├─ specs/en/us-visa/index.html
      ├─ idpass/index.html   허브 SPA
      ├─ _redirects          자동 생성
      └─ sitemap-*.xml       언어별 사이트맵
```

### 5-3. 빌드 트리거

- **수동**: 쌍아/막내가 ssh로 빌드 실행
- **자동 (Phase 후반)**: specs-data.json 커밋 훅 → 4060 빌드 → CF 배포
- **빈도**: 콘텐츠 안정기 전 = 수동 주 1~2회, 안정기 후 = 커밋 훅 자동

### 5-4. 점진 빌드 전략

전량 일괄 빌드가 아닌, **준비된 필름(콘텐츠)부터 찍는다**:

```
1차 빌드: 트래픽 상위 50슬러그 (ko+en) = 100페이지
  → CF 배포, SSR 대비 diff 검증, LCP 실측
  → 문제없으면 확대

2차 빌드: 유니크 콘텐츠 탑재 완료 국가 추가
  → 필름 품질 확정분부터

3차 빌드: 전량 429 × 6lang = 2,574페이지
  → 콘텐츠·템플릿 안정기 진입 후
```

---

## §6 기술 관문 (크리티컬 + 게이트)

### 🔴 크리티컬 1 — paymentRegion SSR 주입

**현상**: render-specs.js:722·803에서 `parts.paymentRegion = req.paymentRegion` — 방문자 국가별 결제수단·통화 표시가 SSR HTML에 박힘. SSG는 URL당 1변형만 생성.

**처방**: 가격/PG 표기 블록을 클라이언트 하이드레이션으로 이관.
- specs-funnel.js 초기화 시 `fetch('/api/region')` 또는 CF `cf-ipcountry` 헤더로 지역 판별
- 가격 표시·결제 버튼·통화 문자열을 JS 렌더로 전환
- SSG HTML에는 placeholder 또는 기본값(ko) 탑재, JS가 교체

**범위**: specs-funnel.js + render-specs.js 가격 블록 분리. 일회성 작업이나 전 언어·전 시장 검증 필요.

### 🔴 크리티컬 2 — 클라이언트 IP 소실 (Workers 프록시 시)

**현상**: Workers 프록시 뒤에서 `XFF.split(',').pop()`이 CF 이그레스 IP 반환.
- `freeQuotaKey` — 전 유저가 CF IP 공유 → 무료 쿼터 즉시 소진
- `detectPaymentRegion` — 시장별 가격 오판정

**처방**: Workers에서 `CF-Connecting-IP`를 커스텀 헤더(`X-Real-IP`)로 포워딩 + 위조 방지 시크릿. server.js IP 추출 함수가 이를 최우선 신뢰.

### 🟠 게이트 1 — _redirects 생성기

**현상**: server.js 301 로직 10지점 + render-specs.js 8지점 (국가 축약형 40건, 1-seg, 블로그 변형, /crop 은퇴 등).

**처방**: 빌드 스크립트에 _redirects 자동 생성기 포함. COUNTRY_SLUG_TO_ISO 등 정본에서 파생. 301 목록이 정적 파일로 출력.

### 🟠 게이트 2 — diff 검증

전량 크롤 diff (429×6=2,574). SSR HTML vs SSG HTML 바이트 대조, 환경변수 의존 항목(K_REVISION, paymentRegion) 정규화 후 잔차 화이트리스트.

### 🟠 게이트 3 — DNS/도메인

CF Pages 커스텀 도메인(monkos.ai) = CF DNS 네임서버 이관 필요.
- 서브도메인 전수 인벤토리 선행 (CR 서비스 8종+)
- CR 매핑 서브도메인은 gray-cloud(프록시 OFF) CNAME 유지
- 상세: 7/21 민아 교차검증 §4

### 🟠 게이트 4 — 공존 구간 라우팅

SSG 탑재 완료 페이지 → CF 서빙, 미탑재 → CR SSR 계속.
구현 옵션:
- **A. CF _redirects로 미탑재분 CR에 프록시** — 탑재 목록 관리 필요
- **B. DNS 레벨에서 /specs만 CF로** — CF Workers가 404 시 CR 폴백
- **C. CR이 SSG 존재 여부 체크 후 리다이렉트** — CR 코드 변경 필요

→ **B안 권장**: Workers가 CF Pages에서 404이면 CR origin으로 프록시. SSG 페이지가 늘어날수록 자연스럽게 CF 비중 증가, CR 부하 감소.

---

## §7 Phase 로드맵

| Phase | 내용 | 선행 조건 | 산출물 |
|-------|------|----------|--------|
| **0** | CF Pages 프로젝트 세팅 + DNS 인벤토리 + Workers 프록시 PoC | — | CF 프로젝트, Workers 스크립트, 서브도메인 목록 |
| **1** | IDPASS 쉘 구현 + /idpass 허브 MVP | Phase 0 | render-shell.js 쉘 변형, 허브 SPA, /specs허브 301 |
| **2** | paymentRegion 하이드레이션 분리 | — (Phase 0과 병행 가능) | specs-funnel.js 수정, /api/region 엔드포인트 |
| **3** | 4060 빌드 스크립트 + 1차 빌드 (상위 50슬러그) | Phase 1, 2 | build-specs.js, dist/ 100페이지, CF 배포, diff 검증 |
| **4** | 네비·CTA 개편 (home.js, render-shell.js) | Phase 1 (IDPASS 쉘 확정 후) | 제품 네비 승격, 히어로 CTA → /specs |
| **5** | 점진 확대 (유니크 콘텐츠 완성분 추가) | Phase 3 검증 통과 | 빌드 범위 확대 |
| **6** | 전량 빌드 (429×6) + CR /specs 트래픽 완전 이관 | 콘텐츠·템플릿 안정기 | CR에서 specs 라우트 제거 |
| **7** | CR min 0 전환 + 비용 관측 | Phase 6 + 콜드 E2E 게이트 | 비용 실측 |

### Phase 순서 유연성

- Phase 2 (paymentRegion)는 Phase 0과 **병행 가능** — SSG 전제조건이지만 독립 작업.
- Phase 4 (네비·CTA)는 SSR에서 즉시 가능 — SSG를 기다릴 필요 없음. 민아 Step 0에 해당.
- Phase 3~6의 속도는 **필름 완성 속도에 종속** — 인쇄기는 준비돼도 필름이 없으면 못 찍음.

---

## §8 선행 참조 문서

| 문서 | 위치 | 관계 |
|------|------|------|
| 아키텍처 3분리 설계서 | [DESIGN_20260721](DESIGN_20260721_아키텍처전환_CF_CR_4060_3분리.md) | 인프라 상위 설계 (PF_INFRA) |
| 민아 교차검증 | [REVIEW_20260721](../../reports/2026-07/REVIEW_20260721_M1민아_아키텍처3분리_교차검증.md) | 크리티컬 2건 + 게이트 4건 |
| SSG PoC 완료보고 | [COMPLETION_20260721](../../reports/2026-07/COMPLETION_20260721_M1막내3_INFRA_SSG_PoC_monkkr.md) | LCP 3.6배 개선 실증 |
| SSG PoC 코드 | scripts/build-specs-poc.js | 본 빌드 스크립트의 출발점 |
| 7/15 IDPASS 3계층 확정 | MEMORY project_idpass_router_architecture.md | 허브+말단+수직 구조 |

---

## §9 본 설계서와 7/21 설계서의 관계

7/21 설계서(PF_INFRA)는 CF+CR+4060 3분리의 **인프라 전체상**을 그렸다.
본 설계서(PF_SPECS)는 그 중 **specs SSG 전환 + IDPASS 쉘**을 구체화하되, 작가님의 **"필름 완성분부터 점진 이관"** 결정을 반영하여 일괄 전환이 아닌 공존 구간 전략으로 재설계했다.

7/21 설계서의 BiRefNet 4060 이관(§5)은 오늘 Phase 4까지 완료되어 prod 서빙 중.
7/21 설계서의 IDPASS 허브(§3)·specs SSG(§4)는 본 설계서가 승계·구체화한다.

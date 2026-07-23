---
type: design
date: 2026-07-23
device: iMac
agent: 쌍아
status: v2 (민아 검수 반영)
portfolio: PF_SPECS
---

# SPECS SSG 전환 + IDPASS 쉘 + 점진 이관 설계서

**[2026-07-23 14:51 KST]** iMac/쌍아 → 작가님

> **발단**: 작가님 — "4060에 인쇄기 세팅, IDPASS 호스팅, 필름 완성되면 찍어내기"
> **선행 설계**: [아키텍처 3분리](DESIGN_20260721_아키텍처전환_CF_CR_4060_3분리.md) (PF_INFRA, 7/21) + [민아 교차검증](../../reports/2026-07/REVIEW_20260721_M1민아_아키텍처3분리_교차검증.md)
> **PoC**: [SSG PoC 완료보고](../../reports/2026-07/COMPLETION_20260721_M1막내3_INFRA_SSG_PoC_monkkr.md) — kr-passport SSG, LCP 22.7s→6.3s 실증
> **검수**: [민아 검수](../../reports/2026-07/REVIEW_20260723_iMac민아_SPECS_SSG설계_검수.md) — 조건부 승인, R1~R8 반영 (v2)

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
- **CR SSR specs에 shellVariant=idpass 선배포 필수** (Phase 1) — SSG 빌드(Phase 3) 전에 쉘이 CR에서 라이브여야 게이트2 diff가 성립하고 공존 구간 사이트 크롬이 일치

### 4-3. /idpass 허브

- 바닐라 SPA (ch2 준수, React/Vue 없음)
- History API + 경량 라우터 (~50줄, 7/21 설계 유지)
- 주요 페이지: / (랜딩+규격 검색), /upload, /result, /pay
- specs-funnel.js **재사용** (신규 퍼널 로직 재구현 금지 — 7/7 재해석 금지 원칙)
- **/result 유료 결과 보존**: T1 유료 생성 후 새로고침 시 결과 소실 방지 — 생성 ID를 URL 파라미터 또는 sessionStorage에 보존. 유료 실패 무음 출고 금지 철학 직결.

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
      ├─ specs/passport/kr.html          ← ko 무프리픽스 (specsUrl 정본)
      ├─ en/specs/visa/us.html           ← lang 최상위 프리픽스
      ├─ ja/specs/passport/kr.html       ← 각 언어 동일 패턴
      ├─ idpass/index.html               허브 SPA
      ├─ css/, js/, assets/              정적 자산 (public/ 복사 + ASSET_VER 상수화)
      ├─ _redirects                      자동 생성
      └─ sitemap-*.xml                   언어별 사이트맵
```

> **R1 교정 (민아 검수)**: flat .html 네이밍으로 CF Pages 트레일링 슬래시 308 방지. 경로는 **specsUrl() 정본 함수에서 도출** — 경로 문자열 직조립 금지 (ch2 7조). 정적 자산도 dist에 포함하여 Workers 폴백 경유 방지.

### 5-3. 빌드 트리거

- **수동**: 쌍아/막내가 ssh로 빌드 실행
- **자동 (Phase 후반)**: specs-data.json 커밋 훅 → 4060 빌드 → CF 배포
- **빈도**: 콘텐츠 안정기 전 = 수동 주 1~2회, 안정기 후 = 커밋 훅 자동
- **슬러그 단위 부분 재빌드**: `build-specs.js --slug kr-passport` — 규격 핫픽스 시 해당 슬러그만 재빌드+배포. 데이터 핫픽스 배포 절차에 "SSG 탑재분이면 부분 재빌드 동반" 의무화.
- **CF API 토큰**: `secret` 프로토콜 경유 등록 + **최소 스코프**(해당 Pages 프로젝트 Edit 단독) + SECRET_INVENTORY 등재. 4060은 게임 공존 가정집 머신 — 광역 토큰 금지.

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

### 🟠 게이트 3 — DNS/도메인 *(R3 실측 반영: 리스크 축소)*

monkos.ai NS는 **이미 Cloudflare** (`edna/bob.ns.cloudflare.com` — 7/23 민아 dig 실측). 4060 터널 작업 시 이관 완료된 것으로 추정. 현재 apex=GFE A레코드(gray), matte=orange(4060 터널), idphoto-kr=ghs CNAME(gray).

잔여 작업:
- 서브도메인 전수 인벤토리 (CR 서비스 8종+ 도메인 매핑·인증서 소유 확인)
- **PG 웹훅 URL 소재 확인** (monkos.ai인지 run.app 직결인지 — Toss/Lemon 대시보드)
- apex orange 전환 + TTL 사전 인하 → Phase 3 직전 실행
- CR 매핑 서브도메인은 gray-cloud(프록시 OFF) CNAME 유지

### 🟠 게이트 4 — 공존 구간 라우팅 *(R2 교정 반영)*

SSG 탑재 완료 페이지 → CF 서빙, 미탑재 → CR SSR 계속.

**채택안: apex orange + Workers 라우트** — monkos.ai 전 트래픽이 CF 엣지 경유.

Workers가 정적 자산/SSG 페이지에 매칭되면 CF Pages에서 서빙, 미매칭이면 CR origin(run.app 직결)으로 프록시. SSG 페이지가 늘어날수록 자연스럽게 CF 비중 증가.

> **R2 교정 (민아 검수)**: "DNS 레벨에서 /specs만"은 불성립(DNS는 호스트 단위). apex orange = monkos.ai 전 트래픽 CF 경유의 함의:
> 1. **PG 웹훅·OAuth 콜백이 CF WAF 뒤로 진입** — 봇파이트/WAF 예외 룰 필수 + Toss/Lemon 콜백 E2E 검증 Phase 0에 추가.
> 2. **Workers 폴백 오리진 = run.app 직결** (Host 오버라이드) — 도메인 매핑 재귀 방지 + 구글 관리형 인증서 갱신 리스크 원천 소거.
> 3. **apex orange 전환 시점 = Phase 3 직전** — 그 전까지 CR 직결 유지, 리스크 창 최소화.

### 🟠 게이트 5 — 301 쌍방 동기 + 사이트맵 정본

공존 구간에서 같은 URL이 CF·CR 어느 쪽에서도 서빙 가능하므로:
- 301 정본(생성기)과 server.js 라우트의 **쌍방 반영 원칙** — 한쪽 추가 시 다른 쪽도 반영.
- 사이트맵은 공존 기간 **CR 동적 단일 정본 유지**, Phase 6 완료 후 CF 정적으로 이관.

---

## §7 Phase 로드맵

| Phase | 내용 | 선행 조건 | 산출물 | 게이트 |
|-------|------|----------|--------|--------|
| **0** | CF Pages 프로젝트 세팅 + DNS/웹훅 인벤토리 + Workers 프록시 PoC + **billing SKU 기준선 실측** | — | CF 프로젝트, Workers 스크립트, 서브도메인 목록, IP 포워딩 E2E, billing 분해표 | Workers 쿼터·지역판정 E2E, 웹훅 경로 WAF 예외 |
| **1** | IDPASS 쉘 구현 + **CR SSR 선배포** + /idpass 허브 MVP | Phase 0 | render-shell.js 쉘 변형, CR specs에 idpass 쉘 라이브, 허브 SPA, /specs허브 301 | — |
| **2** | paymentRegion 하이드레이션 분리 | — (Phase 0과 병행 가능) | specs-funnel.js 수정, /api/region 또는 cf-ipcountry | 전 언어·전 시장 가격 표시 검증 |
| **3** | 4060 빌드 스크립트 + 1차 빌드 (상위 50슬러그) + **apex orange 전환** | Phase 1, 2 | build-specs.js, dist/ 100페이지, CF 배포 | **diff 전량 게이트** + **LCP < 2.5s 게이트** + Toss/Lemon 콜백 E2E |
| **4a** | 네비 제품 승격 + 히어로 CTA → /specs (현행 표기) | — (즉시 가능) | home.js, render-shell.js | — |
| **4b** | IDPASS 명칭 네비 노출 | Phase 1 (쉘 확정 후) | 네비에 IDPASS 명칭 | — |
| **5** | 점진 확대 (유니크 콘텐츠 완성분 추가) | Phase 3 검증 통과 | 빌드 범위 확대 | — |
| **6** | 전량 빌드 (429×6) + CR /specs 트래픽 완전 이관 | 콘텐츠·템플릿 안정기 | CR에서 specs 라우트 제거, 사이트맵 CF 정적 이관 | — |
| **7** | CR min 0 전환 + 비용 관측 | Phase 6 + 콜드 E2E 게이트 | 비용 실측 | 결제·생성 콜드 E2E |

### Phase 순서 유연성

- Phase 2 (paymentRegion)는 Phase 0과 **병행 가능** — SSG 전제조건이지만 독립 작업.
- **Phase 4a (네비·CTA)는 즉시 가능** — SSG·쉘 무관. 민아 Step 0에 해당. 4b는 쉘 확정 후.
- Phase 3~6의 속도는 **필름 완성 속도에 종속** — 인쇄기는 준비돼도 필름이 없으면 못 찍음.
- **apex orange 전환 = Phase 3 직전** — 그 전까지 CR 직결 유지, 리스크 창 최소화.

### LCP 예산 (R8)

PoC 6.3s는 SSR 22.7s 대비 개선이지 Core Web Vitals Good(< 2.5s) 아님. Phase 3 검증에 LCP 예산 게이트 추가. IDPASS 쉘 작업 시 외부 폰트(jsdelivr Pretendard, Google Fonts) **self-host + preload** 동반하여 정적화 이득을 자산 레벨에서 완성.

---

## §8 선행 참조 문서

| 문서 | 위치 | 관계 |
|------|------|------|
| 아키텍처 3분리 설계서 | [DESIGN_20260721](DESIGN_20260721_아키텍처전환_CF_CR_4060_3분리.md) | 인프라 상위 설계 (PF_INFRA) |
| 민아 교차검증 (7/21) | [REVIEW_20260721](../../reports/2026-07/REVIEW_20260721_M1민아_아키텍처3분리_교차검증.md) | 크리티컬 2건 + 게이트 4건 |
| **민아 검수 (7/23)** | [REVIEW_20260723](../../reports/2026-07/REVIEW_20260723_iMac민아_SPECS_SSG설계_검수.md) | R1~R8 → v2 반영 |
| SSG PoC 완료보고 | [COMPLETION_20260721](../../reports/2026-07/COMPLETION_20260721_M1막내3_INFRA_SSG_PoC_monkkr.md) | LCP 3.6배 개선 실증 |
| SSG PoC 코드 | scripts/build-specs-poc.js | 본 빌드 스크립트의 출발점 |
| 7/15 IDPASS 3계층 확정 | MEMORY project_idpass_router_architecture.md | 허브+말단+수직 구조 |

---

## §9 본 설계서와 7/21 설계서의 관계

7/21 설계서(PF_INFRA)는 CF+CR+4060 3분리의 **인프라 전체상**을 그렸다.
본 설계서(PF_SPECS)는 그 중 **specs SSG 전환 + IDPASS 쉘**을 구체화하되, 작가님의 **"필름 완성분부터 점진 이관"** 결정을 반영하여 일괄 전환이 아닌 공존 구간 전략으로 재설계했다.

7/21 설계서의 BiRefNet 4060 이관(§5)은 오늘 Phase 4까지 완료되어 prod 서빙 중.
7/21 설계서의 IDPASS 허브(§3)·specs SSG(§4)는 본 설계서가 승계·구체화한다.

---
type: proposal
date: 2026-07-23
device: iMac
agent: 민아
status: 제출
portfolio: PF_SPECS
---

# PROPOSAL — Phase 1 IDPASS 쉘 구현 방안

**[2026-07-23 18:09 KST]** iMac/민아 → 작가님, iMac/쌍아

> 근거: [DESIGN_20260723 v2](../../tech/designs/2026-07/DESIGN_20260723_SPECS_SSG전환_IDPASS쉘_점진이관.md) §4 + 7/15 소유권 4계층 §4.5 + 금일 코드 실측
> 성격: 쌍아 지시서의 씨드. 결정 포인트 3건 별도 표기.

## 0. 요약

shellVariant 스위치 1개로 layoutShell에 IDPASS 크롬(헤더·카테고리 네비·푸터)을 끼운다. **head(title·canonical·hreflang·JSON-LD)는 불변** — Phase 1은 body 크롬만 바꾸는 보수선. 토큰 최소선(L0)과 폰트 self-host(R8)를 동반하고, /idpass 허브 MVP가 쉘 소비 1호가 된다.

## 1. 실측 기반 (금일 확인)

- **주입점 2곳**: render-specs.js:723·804가 이미 `layoutShell(parts)` 소비 — `parts.shellVariant='idpass'` 한 줄이 말단 429×6에 관통. PoC 빌드도 동일 경로라 SSR/SSG 자동 동형.
- **layoutShell 계약**: `{ title, description, seoMeta, htmlLang, pageStyle, bodyContent, pageScript, paymentRegion }` — shellVariant 추가는 비파괴(기본값 'portal', 기존 호출부 전부 무변경).
- **⚠️ 설계 §4-2 교정 — 카테고리는 type 필드가 아니라 URL 타입 슬러그로**: 데이터의 `type` 필드는 자유 문자열 23종("여권", "쉥겐 비자", "이력서 (2寸)", "半名刺写真"…)이라 버킷 키로 쓸 수 없다. URL 타입 슬러그 17종(passport 202 · visa 201+evisa+bls · license 6 · resume 4+1cun+2cun · halfcard 2 · id 3 · 단건 8)이 기계 판별 가능한 정본.

## 2. 쉘 구조

### 2-1. 스위치 기구 (render-shell.js)

```js
layoutShell({ ..., shellVariant = 'portal' })
  → NAV[shellVariant](lang, ctx) + FOOTER[shellVariant](lang)
```
- 변형 렌더러 2벌: `layoutNavIdpass` / `layoutFooterIdpass`. 포털 쉘 무접촉.
- ctx 최소 전달: 현 페이지의 타입 슬러그(카테고리 active 하이라이트용) — parts에 `specType` 1필드 추가.

### 2-2. IDPASS 헤더 + 카테고리 네비

```
IDPASS  by MONKOS                    [무료로 만들기 →]
여권 | 비자 | 이력서·취업 | 신분증·면허
```
- 워드마크 "IDPASS" + "by MONKOS" 병기 (ch8 정합 — MONKOS 우산 명시). 로고 링크 → `${prefix}/idpass`.
- 우측 CTA "무료로 만들기" → 현 페이지 퍼널 앵커(말단) / 허브에서는 검색 포커스.
- **카테고리 4버킷 정본**: `TYPE_CATEGORY` 상수를 specs-url.js에 동거 신설(ch2 7조 — URL 정본과 한 모듈):
  - 여권 passport / 비자 visa·visa-evisa·visa-bls / 이력서·취업 resume계열·halfcard·headshot / 신분증·면허 id·license·intl-license·residence·youth-id·exam·taxi·marine
- 카테고리 목적지: Phase 1은 **/idpass 허브의 카테고리 앵커**(`/idpass#passport`) — 신규 URL 신설 없이 시작. [결정 P1]
- active 하이라이트: 현 슬러그의 타입 슬러그 → 소속 버킷.

### 2-3. IDPASS 푸터

- 앱 스토어 뱃지(App Store — 7/15 "앱은 뱃지화" 이행) + 카테고리 4링크 + © IDPASS by MONKOS + Terms/Privacy/Refund(기존 경로 유지).
- 설계서의 "관련 규격" 링크는 푸터가 아닌 본문 프래그먼트 소관(기존재 여부 확인 후 중복 금지) — 푸터는 고정 링크만.

### 2-4. 쉘 i18n

- `IDPASS_SHELL_I18N` 6언어(ko·en·ja·es·id·vi) × ~8키(카테고리 4·CTA·뱃지문구·바이라인) — **render-shell.js 내 소유**. 쉘 크롬 텍스트의 소유권은 쉘(L1)이며 specs 콘텐츠 사전(specs-i18n)과 구분. 장기 lib/i18n/ 통합 시 동반 이동.

### 2-5. 토큰 최소선 (L0, 7/15 실용 최소선)

- `lib/cms/design-tokens.js` 신설 — :root 변수 12± (브랜드 컬러 2·spacing 3·radius 2·폰트 스택·헤더 높이 등). **기존 CSS 반복값 추출만, 신축 금지.**
- layoutHead가 임베드(인라인 — 추가 요청 0, SSR/SSG 동형). IDPASS 쉘 = 토큰 소비 1호, 포털 쉘은 후속 이행.

## 3. 불변 보장 (SEO 보수선)

| 항목 | Phase 1 | 근거 |
|------|---------|------|
| title·description | **불변** | SERP 스니펫 변경 = 별도 실험. 브랜드 노출은 body 워드마크로 |
| canonical·hreflang | **불변** | URL 대원칙 |
| JSON-LD | **불변** | 7/22 OfferCatalog 통합 직후 스키마 안정기. brand 필드 추가는 별도 승인 [결정 P3] |
| 변경분 | body 크롬(헤더·네비·푸터)만 | 2,574p 재크롤 churn 1회는 불가피·1회성. **쉘 prod 라이브 후가 Phase 3 diff 기준선** (R4) |

## 4. R8 동반 — 폰트 self-host

- Pretendard(jsdelivr)·Noto Sans JP(Google Fonts) → `/assets/fonts/` self-host + `preload` + `font-display:swap`. woff2 서브셋만.
- 쉘 변형과 같은 파일(layoutHead)을 만지므로 동반이 공수 최소. LCP<2.5s 게이트(Phase 3)의 선행 투자.

## 5. /idpass 허브 MVP — 쉘 소비 1호

- **범위(1a)**: IDPASS 쉘 + 랜딩(카피 상품군 "여권사진 완전 무료로 만들기" — 실제 무료, 헌법 4조 4항 정합) + 국가 검색(renderSpecsList의 인덱스·검색 자산 재사용) + 카테고리 4섹션(앵커 목적지) + 앱 뱃지. 6언어 = 인덱스 데이터 기제공, 신규 번역은 카피 ~10키.
- **/specs 허브 301 → /idpass**: 6언어 라우트 전부(server.js:1186~1196) + redirects 정본 갱신(게이트5 쌍방 동기).
- **허브 내 퍼널 SPA(/upload·/result·/pay)는 Phase 1.5로 분리 제안** [결정 P2]: 말단이 이미 현장 자체 완결이라 허브 퍼널의 긴급도는 낮고, specs-funnel 재사용은 컴포넌트화 성숙(트랙 1 산출) 후가 안전. 설계 §4-3의 /result 생성 ID 보존 요건은 1.5에 승계.

## 6. 작업 분해 (지시서 씨드)

| Block | 내용 | 파일 | 공수 |
|-------|------|------|------|
| A | 토큰 최소선 추출 | design-tokens.js 신설 + render-shell 임베드 | 0.5일 |
| B | shellVariant 기구 + IDPASS 네비/푸터 + 쉘 i18n 6언어 | render-shell.js | 1일 |
| C | 말단 주입 + TYPE_CATEGORY 정본 + specType 전달 | render-specs.js(2줄) + specs-url.js | 0.5일 |
| D | /idpass 허브 1a + /specs 허브 301 6언어 | server.js + 신규 렌더러(renderIdpassHub) | 1~1.5일 |
| E | 폰트 self-host + preload | layoutHead + assets | 0.5일 |

- 순서: A→B→C(병행 E)→D. B·C까지가 "CR SSR 선배포 필수"(R4)의 최소 단위 — **D 이전에 B·C만 먼저 prod 가능** (로고 링크만 임시 /specs, D 랜딩 후 /idpass 전환).

## 7. 검증 게이트 (민아)

1. dev: 3언어 × (말단 passport/kr·visa/us + 허브) 크롬 실측 — 카테고리 active·CTA 앵커·앱 뱃지.
2. 회귀: 포털 쉘 소비층(홈·blog·guide·pricing) 크롬 **불변** + head 4항목(title·canonical·hreflang·JSON-LD) diff 0.
3. LCP 사전 실측(폰트 self-host 효과) + 301 6언어.
4. prod 배포 → 라이브 재확인 → **"Phase 3 diff 기준선 = 본 리비전" 선언 기록**.

## 8. 결정 포인트 (작가님/쌍아)

- **P1** 카테고리 목적지 = /idpass 앵커(신규 URL 무신설) — 카테고리별 독립 인덱스 페이지는 수요 확인 후.
- **P2** 허브 퍼널 SPA를 Phase 1.5로 분리 — Phase 1은 랜딩+검색+301까지.
- **P3** title·JSON-LD 불변 보수선 — IDPASS의 head 레벨 브랜딩(title 접미·brand 스키마)은 쉘 안착 후 별도 결정.

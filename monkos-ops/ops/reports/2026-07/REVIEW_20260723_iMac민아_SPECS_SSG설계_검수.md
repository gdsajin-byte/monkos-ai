---
type: report
date: 2026-07-23
device: iMac
agent: 민아
status: 마감
portfolio: PF_SPECS
---

# REVIEW — SPECS SSG 전환 + IDPASS 쉘 + 점진 이관 설계서 검수

**[2026-07-23 15:01 KST]** iMac/민아 → 작가님, iMac/쌍아

> 대상: [DESIGN_20260723_SPECS_SSG전환_IDPASS쉘_점진이관.md](../../../tech/designs/2026-07/DESIGN_20260723_SPECS_SSG전환_IDPASS쉘_점진이관.md)
> 방법: 코드 실측(render-specs.js·specs-url.js·server.js·config.js) + DNS dig 실측 + 7/21 교차검증(REVIEW_20260721_M1민아) 승계 대조

## 총평: **조건부 승인** — 골격(점진 이관·공존 구간·쉘 변형·B안 폴백) 지지. 단 **교정 필수 2건(R1·R2) + 승계 누락 복원 3건 + 보강 5건** 반영 조건.

---

## ① 승계 정합 — 7/21 크리티컬·게이트 대조

**정확 승계 ✓**: 크리티컬 2건(paymentRegion:722·803 실측 일치 / IP 소실:104·118 실측 일치), _redirects 생성기, diff 전량 429×6(7/21 20:07 정정 반영 — LANGS 6언어 실측 일치), /auth/* 프록시 범위(§3 포함), min0 콜드 E2E(Phase 7), specs-funnel 재사용 원칙(§4-3).

**누락 3건 — 복원 필요**:
- ⓐ **billing SKU 기준선 실측** (7/21 판정 #9): ₩100k↔₩10k 10배 모순 해소용 Phase 0 실측이 산출물에서 빠짐. 절감 주장의 기준선 — Phase 0 산출물에 재등재.
- ⓑ **/result 새로고침 유료 결과 소실 방지** (7/21 §6-1): 허브 SPA(§4-3)에 미반영. T1 유료 생성 후 새로고침 = 결과 소실 사고 유형 — 생성 ID URL 파라미터/sessionStorage 보존을 §4-3에 명기. 유료 실패 무음 금지 철학 직결.
- ⓒ **공존 구간 핫픽스 신선도 절차** (7/21 ② 신선도): 수동 주 1~2회 빌드면 SSG 탑재분의 규격 정정(7/17 kr ears류)이 최대 1주 낡은 채 서빙 — CR은 즉시, CF는 지연 = 같은 규격의 두 버전 라이브. **슬러그 단위 부분 재빌드**(`build-specs.js --slug kr-passport`)를 빌드 스크립트 요구사항에 명기 + 데이터 핫픽스 배포 절차에 "탑재분이면 부분 재빌드 동반" 1줄.

## ② 🔴 R1 — §5-2 dist 레이아웃이 URL 정본 위반 (교정 필수)

설계서 §2가 "URL 불변 대원칙"을 선언하면서 §5-2 트리가 그걸 위반한다:

| §5-2 기재 | 실제 정본 (specs-url.js) | 오류 |
|-----------|--------------------------|------|
| `specs/ko/kr-passport/index.html` | `/specs/passport/kr` | lang 경로 없음 + ko 무프리픽스 + `kr-passport`는 7/16 사멸한 구 1-seg 슬러그 |
| `specs/en/us-visa/index.html` | `/en/specs/visa/us` | lang은 최상위 프리픽스 |

이대로 빌드하면 2,574페이지 전량이 존재하지 않는 URL에 놓인다. 추가로 **디렉토리 스타일(index.html)은 CF Pages가 트레일링 슬래시로 308 정규화**(`/specs/passport/kr` → `/specs/passport/kr/`) — 전 슬러그 사실상 URL 변경 = canonical 불일치 + GSC 재크롤 churn.

**처방**:
1. **flat .html 네이밍**: `dist/specs/passport/kr.html`(ko) / `dist/en/specs/visa/us.html`(en) — Pages가 `/specs/passport/kr` 무슬래시로 서빙 (`.html` 직접 요청만 308, 무해).
2. 빌드 경로는 **specsUrl() 정본 함수에서 도출** — 경로 문자열 직조립 금지 (ch2 7조 그대로).
3. **dist에 정적 자산 포함** (public/css·js·assets 복사 + ASSET_VER 빌드 상수 치환): 자산이 Workers 404→CR 폴백으로 새면 LCP 이득 반감 + Phase 7 min0 방해.

## ③ 🟠 R2 — 게이트4 B안 표현 교정 + 실체 명기

"DNS 레벨에서 /specs만 CF로"는 성립하지 않는다(DNS는 호스트 단위, 경로 라우팅 불가). B안의 실체 = **apex orange-cloud + Workers 라우트**(`monkos.ai/specs/*`·`/idpass/*`) — Workers 미매칭 경로를 포함해 **monkos.ai 전 트래픽이 CF 엣지를 경유**하게 된다. 함의 3건을 설계에 명기:

1. **PG 웹훅·OAuth 콜백이 CF 프록시/WAF 뒤로 들어간다** — 7/21 "웹훅 무관 ✓"은 직수신 전제였고 apex orange에서 뒤집힘. Phase 0 검증에 **웹훅 경로 WAF/봇파이트 예외 룰 + Toss/Lemon 콜백 E2E** 추가. PG 대시보드의 웹훅 URL이 monkos.ai인지 run.app인지 인벤토리에 포함.
2. **Workers 폴백 오리진 = run.app 직결 권고** (Host 오버라이드): 도메인 매핑(monkos.ai) 재귀 호출 대신 CR run.app URL로 — 프록시 뒤 구글 관리형 인증서 갱신 리스크(7/21 §4-2가 서브도메인에 지적한 것이 apex 자신에게 적용됨)를 원천 소거하고 오리진 경로가 명시적이 된다.
3. 공존 구간 진입 = apex orange 전환 시점 — Phase 0이 아니라 **첫 SSG 서빙(Phase 3) 직전**에 전환하는 것으로 시점 명기 (그 전까지 CR 직결 유지, 리스크 창 최소화).

## ④ ✅ R3 — 게이트3 리스크 축소 (금일 실측, 희소식)

**monkos.ai NS는 이미 Cloudflare다** (`edna/bob.ns.cloudflare.com` — 15:01 dig 실측). apex=GFE A레코드(gray)·matte=orange(4060 터널)·idphoto-kr=ghs CNAME(gray). 즉 게이트3의 "네임서버 이관 필요"는 **기완료 상태** — 4060 터널 작업이 이미 수반한 것으로 추정. 잔여 작업 = 서브도메인 전수 인벤토리 + apex orange 전환 절차 + TTL 인하뿐. **게이트3 공수·리스크 대폭 축소** — 설계서 §게이트3 현행화 필요.

## ⑤ 🟡 보강 5건

- **R4 쉘 적용 순서 필수화**: §4-2 "SSR 구간에서도 동일 쉘 적용 **가능**" → **필수 + 순서**로: Phase 1에서 CR SSR specs에 shellVariant=idpass **선배포** → Phase 3 SSG 빌드. 아니면 게이트2 diff가 쉘 차이로 불성립 + 공존 구간 사이트 크롬 불일치.
- **R5 Phase 4 선행조건 자기모순**: 로드맵 표는 "Phase 1 선행", §7 유연성 절은 "즉시 가능(민아 Step 0)". **분할 처방**: 4a 네비 제품 승격 + 히어로 CTA→/specs (즉시, 현행 "ID Photo" 표기) / 4b IDPASS 명칭 노출 (쉘 확정 후).
- **R6 4060 배포 토큰**: wrangler pages deploy용 CF API 토큰 = `secret` 프로토콜 경유 + **최소 스코프**(해당 Pages 프로젝트 Edit 단독) + SECRET_INVENTORY 등재. 4060은 게임 공존 가정집 머신 — 광역 토큰 금지.
- **R7 301 쌍방 동기 + 사이트맵 정본**: 공존 중 같은 URL이 CF·CR 어느 쪽에서도 서빙 가능 — 301 정본(생성기)과 server.js 라우트의 **쌍방 반영 원칙** 1줄. 사이트맵은 공존 기간 CR 동적 단일 정본 유지, Phase 6 후 CF 정적 이관.
- **R8 LCP 게이트**: PoC 6.3s는 개선이지 합격이 아님(Good<2.5s). Phase 3 검증에 **LCP 예산 게이트** 추가 + 셸의 외부 폰트 2종(jsdelivr Pretendard·Google Fonts) self-host/preload를 IDPASS 쉘 작업에 동반 — 정적화 이득을 자산 레벨에서 완성.

미세(무해): 쿠키 `Domain=.monkos.ai` 설계 9곳 ↔ 실측 11곳. 판정 불변.

---

## 판정 요약

| # | 항목 | 판정 |
|---|------|------|
| R1 | dist 레이아웃·트레일링 슬래시 | 🔴 교정 필수 — flat .html + specsUrl() 도출 + 자산 포함 |
| R2 | B안 실체(apex orange 전 트래픽) | 🟠 명기 필수 — 웹훅 WAF 예외 + run.app 오리진 + 전환 시점 |
| R3 | NS 이관 | ✅ 기완료 실측 — 게이트3 축소 현행화 |
| 승계ⓐⓑⓒ | billing 기준선·/result 보존·핫픽스 부분 재빌드 | 🟠 복원 |
| R4~R8 | 쉘 순서·Phase4 분할·토큰 스코프·301/사이트맵·LCP 게이트 | 🟡 보강 |

**Phase 0 체크리스트 최종형**: CF Pages 프로젝트 + Workers PoC(IP 포워딩·쿼터·지역판정 E2E) + 서브도메인 인벤토리(웹훅 URL 소재 포함) + billing SKU 기준선 실측. Phase 3 직전: apex orange 전환 + 콜백 E2E + diff 전량 + LCP 게이트.

설계 골격은 승인 — 위 반영 후 지시서 발행에 이견 없음.

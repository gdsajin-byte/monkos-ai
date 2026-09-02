---
type: report
date: 2026-09-02
device: iMac
agent: 막내2
subject: "G-M1 퍼널 계측 단일화 — Phase 0 사전 검수 (코드 변경 0건)"
order: ORDER_20260902_iMac민아_막내1_ANCHOR_GM1_퍼널계측_사전검수
portfolio: PF_ANCHOR
related: PF_IDPHOTO, PF_SPECS
status: 제출 — Phase 1 착수 승인 대기
---

# Phase 0 사전 검수 보고 — G-M1 퍼널 계측 단일화

**[2026-09-02 18:56 KST]** iMac/막내2 → 작가님 (참조: iMac/민아·쌍아)

> 지시서 수신자는 막내1이나 **작가님 09-02 18:49 재배정**으로 막내2가 수행했다. 산출물 주체는 실제 실행자로 기재한다.
> **코드 변경 0건.** 전 항목 판독·읽기 전용 조회로만 수행했다.
> 민아 선행 실측(18:2x)은 **전제가 아니라 검증 대상**으로 다뤘고, GA4 수치는 본 세션(19:0x 전후)에 **재측정**했다.

---

## 요약 — 이 검수로 바뀌는 것

민아 실측 6건 중 **정합 3 · 반박 2 · 정정 1**이다. 그리고 **처방이 예상보다 훨씬 싸다.**

가장 큰 발견은 F6이다. `purchase` 계측 코드는 **이미 완성돼 있고 서버 라우트까지 있다.** 다만 **아무도 그 경로로 돌아오지 않는다.** 충전 결제는 계측이 없는 다른 페이지로 복귀한다. 즉 "계측을 만드는" 일이 아니라 **"이미 있는 계측에 결선하는"** 일이다.

두 번째는 브리핑이다. 3주간 **`### 퍼널 (GA4, idphoto-kr)`** 라는 제목으로 보고된 표는 hostName 필터가 없어 **실제로는 전 호스트 합산**이었고, 실측상 **idphoto-kr의 커스텀 이벤트 기여분은 0건**이다. 제목이 데이터와 다르다.

---

## §1. 민아 실측 F1~F6 검증 결과

| # | 판정 | 근거 |
|---|------|------|
| F1 | 🔴 **반박** | 측정 ID는 **2개가 아니라 3개**, 데이터 스트림은 **1개가 아니라 2개** |
| F2 | ✅ **정합 (강화)** | 400 추론이 아니라 **레지스트리 직접 조회로 확정** — `custom_dimensions: []` |
| F3 | ✅ **정합** | hostName 분리 가능. 단 idphoto-kr은 트래픽이 적은 게 아니라 **커스텀 이벤트가 0건** |
| F4 | ✅ **정합** | 재측정치 민아 값과 일치 |
| F5 | 🟡 **정정 — 더 나쁨** | 지적 2건 모두 정합. 추가로 **표 제목이 데이터와 불일치**하는 3번째 결함 |
| F6 | 🟡 **정정 — 더 쉬움** | 미발화 정합. 단 원인은 "계측 부재"가 아니라 **결선 누락**(구현된 라우트에 아무도 안 감) |

### F1 반박 — ID 3개 / 스트림 2개

민아 실측은 "ID 2개(`G-JPZWSJ3323` 포털 전용 + `G-FKG0CPTC14` 포털·idphoto-kr 공통), 스트림 1개"였다. 레포 **전역**(민아 조사는 `monkos_AI/`에 한정된 것으로 보인다) 재조사 결과:

```
83  G-JPZWSJ3323
48  G-FKG0CPTC14
44  G-C2H9ZM85F7      ← 신규 발견 (MONK_kr/, monk.kr)
```

**"포털 전용"도 사실이 아니다.** 배치 실측:

| 측정 ID | 배치 표면 |
|---|---|
| `G-JPZWSJ3323` | portal · **idphoto-jp 전 페이지** · **studio 전 페이지** (`render-shell.js:67`, `payments.js:1012`) |
| `G-FKG0CPTC14` | portal · **idphoto-kr 전 페이지** · studio 전 페이지 |
| `G-C2H9ZM85F7` | **MONK_kr (monk.kr)** — `MONK_kr/index.html:10` |

portal·studio는 **두 ID를 동시에** 로드하고, idphoto-jp는 JPZ만, idphoto-kr은 FKG만 로드한다.

**스트림도 1개가 아니다.** `streamId` 차원으로 조회했다 — 지시서 §2.2 P0-B는 "API 불가"로 보았으나 **Data API로 판정 가능하다**:

| streamId | streamName | hostName | 이벤트 | 유저 |
|---|---|---|---|---|
| 13382285742 | MONKOS AI | monkos.ai | 6,428 | 1,003 |
| 13382285742 | MONKOS AI | idphoto-jp.monkos.ai | 21 | 2 |
| 13382285742 | MONKOS AI | idphoto-kr.monkos.ai | 2 | 1 |
| 14850498513 | monk_studio | monk.kr | 343 | 68 |
| 14850498513 | monk_studio | monk-kr.pages.dev | 1 | 1 |

`G-C2H9ZM85F7` → `14850498513`(monk_studio)로 깔끔히 대응한다.

**남은 미해결 1건**: JPZ·FKG **두 ID가 모두 단일 스트림 `13382285742`로 귀속**된다. GA4에서 스트림 1개의 측정 ID는 1개이므로 이는 정상 배치로 설명되지 않는다. 가설:

| 가설 | 내용 | 이 가설이 참일 때의 관측 | 실측과 부합? |
|---|---|---|---|
| (가) **연결된 사이트 태그** | 스트림 `13382285742`에 다른 측정 ID가 connected site tag로 등록되어 같은 스트림으로 전달 | 두 ID 모두 살아 있고 streamId는 1개 | ✅ **가장 부합** |
| (나) 한 ID가 폐기·타 속성 | 죽은 ID만 실린 표면은 데이터 0 | idphoto-kr(FKG 단독)이 page_view 1건을 냈으므로 FKG는 死 아님. idphoto-jp(JPZ 단독)도 21건 → JPZ도 死 아님 | ❌ **배제** |
| (다) 한 ID 무응답 | 상동 | 상동 | ❌ **배제** |

> **막내 판단으로 단정하지 않는다** (지시서 P0-B 지시). (가)가 유력하나 확정은 §5 작가님 UI 확인 항목이다.

### F2 정합 — 판정 근거를 격상했다

지시서는 `customEvent:{param}` 400 응답으로 미등록을 추론하라고 했다. 그보다 강한 근거를 찾았다 — Admin API `get_custom_dimensions_and_metrics`:

```json
{ "custom_dimensions": [], "custom_metrics": [] }
```

**등록된 커스텀 측정기준이 0개**다. 추론이 아니라 레지스트리 직접 확인이므로 대조군 논쟁이 불필요하다.
(양성 대조군도 병행 충족 — 같은 속성에 표준 차원 `hostName`·`eventName`·`streamId` 쿼리는 전부 200에 실데이터를 반환했다. 조회 자체는 유효하다.)

`can_edit: false` — SA(yong-a)는 등록 권한이 없다. §5 작가님 작업.

### F3 정합 — 단, idphoto-kr은 "트래픽 0"이 아니라 "커스텀 이벤트 0"

민아 표현("idphoto-kr 트래픽이 사실상 0")보다 정확한 사실이 있다. eventName × hostName 실측:

| hostName | 자동 이벤트 | 커스텀(앱) 이벤트 |
|---|---|---|
| monkos.ai | page_view 1,529 · session_start 1,211 · first_visit 974 | spec_select 958 · photo_upload 130 · free_generate_click 134 · free_generate_done 118 · free_download 85 · upload_rejected 9 · begin_checkout 5 · t1_upsell_click 5 · generate_click 3 · preview_view 3 · credit_slot_click 2 |
| idphoto-jp.monkos.ai | page_view 9 · session_start 5 · first_visit 1 | **spec_select 1 · photo_upload 1** |
| idphoto-kr.monkos.ai | page_view 1 · session_start 1 | **0건** |
| monk.kr | page_view 91 · session_start 71 · scroll 42 · click 8 | 0건 |

**idphoto-kr은 커스텀 이벤트를 단 1건도 보내지 않았다.** idphoto-jp는 (미미하지만) 보냈다. 방문 자체가 1명뿐이라 "코드가 고장났다"고 단정할 수는 없으나, **F1 (가)/(나) 판별과 얽힌 유일한 관측치**이므로 §5에 확인 항목으로 올린다.

### F4 정합 — 재측정 일치

지시서 준수 조항(과거 실측 이월 금지)에 따라 본 세션에서 다시 조회했다. 민아 값과 일치한다.

- **무료 트랙**: spec_select 716u → photo_upload 96u → free_generate_click 79u → free_generate_done 76u → free_download 51u
- **유료 트랙**: generate_click 2u → begin_checkout 1u → **purchase 0** (전 호스트 통틀어 `purchase` 행 자체가 없음)
- 업셀: t1_upsell_click 4u · credit_slot_click 1u

무료 트랙 완주율은 **free_generate_click→done 96%**, **→download 65%**로 건강하다. 병목은 생성이 아니라 **업로드 진입**(spec_select 716 → photo_upload 96, 13%)과 **유료 전환**이다.

### F5 정정 — 지적 2건 정합 + 3번째 결함

`.github/scripts/daily_briefing.py:133-162` 판독.

| 후보 | 판정 | 근거 |
|---|---|---|
| ① 무료 트랙 이벤트 부재 | ✅ **정합** | `FUNNEL_EVENTS`(:133) 6종에 `free_generate_click/done/download`·`free_limit_hit`·`upload_rejected`·`t1_upsell_click`·`credit_slot_click` 전무. `in_list_filter`(:150)로 **목록 외 이벤트는 조회 자체가 안 된다** |
| ② hostName 미분리 | ✅ **정합** | `dimensions=[Dimension(name="eventName")]`(:145) — hostName 차원 없음 |
| ③ eventCount/totalUsers 혼용 | 🟡 **정정** | 혼용은 아니다(둘 다 수집). 실제 결함은 **분모 정의**다 — `top_users = max(f["users"])`(:397) 후 `cvr = users / top_users`(:402). 첫 단계 대비가 아니라 **최댓값 대비**이며, 6종이 서로 다른 표면에서 나오므로 08-24 교훈("분자·분모 출처가 다르면 만들어진 숫자")에 정면 해당 |
| ④ **표 제목 오기 (신규)** | 🔴 **신규 적발** | `:398` `lines.append("### 퍼널 (GA4, idphoto-kr)")` — **hostName 필터가 없으므로 전 호스트 합산인데 "idphoto-kr"로 라벨링**한다. 실측상 idphoto-kr 커스텀 이벤트는 0건이므로, 3주간 "idphoto-kr 퍼널"로 읽힌 표는 사실상 **전부 monkos.ai(포털 specs) 데이터**였다 |

④가 08-25 "퍼널 세 단계가 서로 다른 표면을 세고 있다"의 **기계적 원인**이며, 라벨이 틀렸다는 점에서 F5 원 지적보다 한 단계 나쁘다.

### F6 정정 — 미발화는 맞고, 원인은 "결선 누락"이다

**토스 결제 성공 복귀 경로가 4종이고, 그중 2종만 purchase를 쏜다.**

| # | 표면 | successUrl | 복귀 후 purchase | 판정 |
|---|---|---|---|---|
| 1 | `portal/public/js/specs-funnel.js:947` | `base + '?toss=direct'` | `gaTrackPurchase()` :991·:1225 | ✅ 발화 |
| 2 | `portal/public/js/headshot.js:519` | `base + '?toss=direct'` | `gaPayEvent('purchase')` :562·:656 | ✅ 발화 |
| 3 | `portal/public/credits.html:610` | `/credits?toss=success` | `handleTossResult()` :692이 confirm 성공 처리하나 **gtag 이벤트 호출 0건** | ❌ **미발화** |
| 4 | `idphoto-kr/public/charge.html:306` (studio `:287` 동일) | `/charge.html?toss=success` | **`toss=success` 소비부 자체가 없음** (`location.search` 사용은 `return` 파라미터뿐 — :304·:461) | ❌ **미발화** |

그리고 **결정적 발견**:

```
monkos_AI/portal/server.js:1006      if (req.url?.startsWith('/toss-success')) return handleTossSuccess(req, res);
monkos_AI/portal/lib/payments.js:999 export async function handleTossSuccess(...)
monkos_AI/portal/lib/payments.js:1026  gtag('event','purchase',{transaction_id, currency:'KRW', value, payment_provider:'toss', service:'portal', transport_type:'beacon'})
```

**`/toss-success` 라우트는 실결제액·주문ID·Ads 전환까지 갖춘 완성된 purchase 계측을 갖고 있다. 그런데 `successUrl`을 이 경로로 설정하는 표면이 하나도 없다** (successUrl 구성 지점 전수 조사 — `_legacy_spa` 2건 제외 시 위 표의 4종이 전부). **구현돼 있으나 결선되지 않은 죽은 라우트**다.

08-25 실고객 ₩9,900 결제는 **경로 4**(idphoto-kr 충전)였고, 따라서 purchase가 나가지 않았다. F6 정합, **지점 특정 완료**.

---

## §2. P0-A 이벤트 발화 전수표

> 판독 방법: `grep`은 모집단 확보용으로만 쓰고, `specs-funnel.js`·`headshot.js`는 **래퍼 함수를 먼저 읽은 뒤 호출부를 추적**했다. 두 파일은 `gtag('event', name, ...)` 형태라 이벤트명이 변수이며, grep만으로는 이름이 하나도 안 잡힌다.

### 공통 래퍼

| 표면 | 래퍼 | 기본 파라미터 | 중복 가드 |
|---|---|---|---|
| portal specs-v2 | `gaTrack(name, params, repeat)` `specs-funnel.js:49` | `spec_type`(slug) · `auth_method` · `lang` · `service='specs-v2'` · `market` | 페이지 로드당 1회(`repeat=true`면 매회) |
| portal specs-v2 결제 | `gaTrackOrder` :62 / `gaTrackPurchase` :67 | + `transaction_id`(orderId) · `payment_provider` · `currency` · `value` | **주문ID 단위** — 리로드 없는 2차 결제 소실 방지 |
| portal headshot | `gaPayEvent(name, orderId, extra)` `headshot.js:85` | `service='headshot'` · `market` · `payment_provider` · `currency` · `value` | 주문ID 단위 |

### 전수표

| 표면 | 이벤트 | 파일:행 | 발화 조건 | 주요 파라미터 |
|---|---|---|---|---|
| **① portal specs-v2** | `spec_select` | specs-funnel.js:78·80 | **DOMContentLoaded 즉시** (선택 아님 — 페이지뷰) | spec_type·service·market |
| | `upload_rejected` | :234 | 업로드 검증 실패 | + 사유 |
| | `photo_upload` | :262 | 업로드 성공 | |
| | `free_generate_click` | :481 | 무료 생성 클릭 (repeat) | |
| | `free_generate_done` | :469·:547 | 무료 생성 완료 (repeat) | + `gen_track` |
| | `free_limit_hit` | :444·:533 | 무료 한도 도달 | |
| | `free_download` | :564 | 무료 다운로드 | |
| | `t1_upsell_click` / `t2_upsell_click` | :572·:576 | 업셀 클릭 | |
| | `credit_slot_click` | :580 | 크레딧 슬롯 클릭 | |
| | `begin_checkout` | :897 | 결제 시작 | + transaction_id·transport_type=beacon |
| | `generate_click` | :1054 | **재생성 포함 매회** | |
| | `preview_view` | :1103 | 미리보기 노출 | |
| | `purchase` | :991·:1225 | 결제 확인 | + transaction_id·value·currency |
| | `conversion`(Ads) | :75 | purchase에 수반 | send_to |
| **② portal headshot** | `begin_checkout` | headshot.js:475 | 결제 시작 | |
| | `purchase` | :562·:656 | 결제 확인 2경로 | + transaction_id |
| **③ idphoto-kr** | `spec_select` | prep.js:154 | 규격 선택 | |
| | `photo_upload` | camera.js:236 | 업로드 | |
| | `generate_click` | result.js:186 | `confirmAndGenerate()` **진입 즉시, 로그인 게이트보다 먼저** | |
| | `preview_view` | result.js:296 | | |
| | `begin_checkout` | result.js:327 | | |
| | `purchase` | thankyou.js:182 | **다운로드 수령처 도달 시** | value=`CREDIT_COST.download × KRW_PER_CREDIT`, transaction_id=`ty_${Date.now()}` |
| | `sign_up` | modules/gate.js:210 | | |
| **④ idphoto-jp** | 동일 6종 + `sign_up` | prep.js:154 · camera.js:236 · result.js:186/297/328 · thankyou.js:228 · gate.js:154 | kr과 동일 구조 | |
| **⑤ 결제·충전 표면** | **없음** | `portal/credits.html` · `idphoto-kr/charge.html` · `idphoto-jp/charge.html` · `studio/charge.html` | `gtag('config')`만 있고 **`gtag('event')` 0건** | — |
| **(공통 셸)** | `ai_referral_landing` | render-shell.js:81, 각 index.html | referrer가 AI 엔진 5종 | ai_engine·landing_page |
| | `automation_hit` | render-shell.js:79 | `navigator.webdriver` 등 자동화 감지 | landing_page |
| | `sign_up` | portal/js/auth.js:135·160 | 신규 가입 2경로 | |

**08-26 변경분 반영 확인** (지시서 §2.2 P0-A 요구): 커밋 `f8ba3d03`·`34c38c70`의 게이트/귀속 분리는 `sessionId`·`gate`·`authenticated` 필드 신설이며, **GA4 이벤트 파라미터가 아니라 서버측 생성 기록 필드**다. 위 전수표의 GA4 파라미터 구성에는 영향이 없다.

### 🔴 P0-A에서 나온 구조적 결함 2건

1. **`spec_select`는 선택이 아니라 페이지뷰다** (`specs-funnel.js:78`, DOMContentLoaded). 08-25 진단대로이며 **현재도 그대로**다. 따라서 "spec_select 716 → photo_upload 96 = 13%"는 전환율이 아니라 **specs 페이지 열람 대비 업로드율**이다. 퍼널 1단계 정의를 바꾸지 않으면 G-M1의 "3단계 단일 표면 계측"은 성립하지 않는다.
2. **idphoto-kr `purchase`의 값·ID가 결제 실체와 다르다** (`thankyou.js:182`). `transaction_id`가 주문ID가 아닌 `ty_${Date.now()}`라 **결제 1건과 대응하지 않고**, `value`는 실결제액이 아니라 크레딧 환산액이며, 다운로드마다 발화하므로 **1회 결제 → N회 purchase**가 된다. 살아나면 매출이 부풀려진다.

---

## §3. P0-B~F 판정

- **P0-B**: §1 F1. **가설 (가) 연결된 사이트 태그가 유력**, (나)·(다)는 실측으로 배제. 확정은 §5.
- **P0-C**: 커스텀 측정기준 **0개 등록**. 코드가 보내는 파라미터 전수는 §5 등록 요청 표 참조. 양성 대조군 충족.
- **P0-D**: §1 F5 — 결함 4건(①②③④), 수정안 §4-2.
- **P0-E**: **지시된 방법으로 집계 불가.** 아래 별도 판정.
- **P0-F**: 아래 배포 경로 표.

### P0-E — `credits.sh log`으로는 실결제를 셀 수 없다

지시서 §2.2 P0-E는 "최근 30일 실결제 건수: `scripts/credits.sh log 200` 경유"를 지시했다. 실행 결과 **총 10행, 전부 에이전트 수동 조작 기록**(테스트 충전·환급·탈퇴)이며 **고객 실결제는 1건도 없다.** 2026-05-18~08-13 범위이고 최근 30일 신규 행은 0이다.

원인: `credits.sh log`은 Firestore `audit` 컬렉션 + `CREDIT_AUDIT_LOG.md`를 읽는다. 이는 **`credits.sh`가 스스로 남긴 수동 조작 원장**이다. 고객 결제는 토스/레몬 웹훅 → `payments`·`transactions` 컬렉션에 적재되며(`payments.js:135·176·248·344·400`), **`credits.sh`에 이를 읽는 서브커맨드가 없다.**

ch4 10조상 Firestore 직접 접근이 금지되므로 **막내가 정당한 경로로 실결제를 집계할 수단이 현재 없다.** 08-25 ₩9,900 건도 이 로그에 없다(출처는 PF_IDPHOTO README:166).

→ 수정안 §4-5(읽기 전용 서브커맨드 신설) 또는 §5(작가님 토스 대시보드 확인)로 올린다. **08-25 건이 경로 4(충전)였다는 판정은 `charge.html` 코드 경로로 내린 것이며, 결제 원장 대조로는 확인하지 못했다.**

### P0-F 배포 경로

| 수정 대상 | 배포 경로 | 비고 |
|---|---|---|
| `portal/public/js/specs-funnel.js` | **`portal/deploy.sh` + `edge/deploy.sh` 둘 다** | `tools/specs-ssg/dist/js/specs-funnel.js`로 복제되어 **엣지가 정적 종결**한다(`worker.mjs:213-214` ASSETS). **엣지 재배포 누락 = 무음 구본** |
| `portal/public/js/headshot.js` | **동일 (엣지 재배포 필수)** | `dist/js/headshot.js` 존재 확인 |
| `portal/public/credits.html` | `portal/deploy.sh` | dist에 없음 → 오리진 종결 |
| `idphoto-kr/public/charge.html` | `monkos_AI/idphoto-kr/deploy.sh` | |
| `idphoto-jp/public/*` | `monkos_AI/idphoto-jp/deploy.sh` | ⚠️ **이중 소스** — `apps/idphoto-jp-v079/`도 같은 서비스로 배포. 정본 확인 후 진행 |
| `portal/lib/payments.js` | `portal/deploy.sh` | 서버 코드, 엣지 무관 |
| `.github/scripts/daily_briefing.py` | **배포 불요** | GitHub Actions |

---

## §4. 수정안 — 항목별 분리

> 전부 **미적용**. 승인된 번호만 Phase 1에서 구현한다.

### 수정안 1 — 충전 결제 purchase 결선 `[매출 직결·최우선]`

**문제**: 경로 3·4(충전)가 purchase를 쏘지 않는다. 유일하게 확인된 실결제(08-25 ₩9,900)가 이 경로였다.

| 옵션 | 내용 | 리스크 |
|---|---|---|
| **1-A (권장)** | `credits.html handleTossResult()`의 `data.success` 분기와 `charge.html`에 `gtag('event','purchase', {transaction_id: orderId, value: amount, currency:'KRW', payment_provider:'toss', service:'portal'\|'idphoto-kr'})` 추가 | 낮음. 기존 confirm 흐름 무변경, 이벤트 1줄 추가 |
| 1-B | `successUrl`을 `/toss-success`로 변경해 기존 구현 재사용 | **중간** — `/toss-success`가 자체적으로 `/api/payments/toss/confirm`을 호출하므로 **이중 confirm** 가능. 충전 UI·복귀 동선도 바뀜 |

- 변경 파일: `portal/public/credits.html`, `idphoto-kr/public/charge.html` (+ 필요 시 studio)
- 배포: `portal/deploy.sh`, `idphoto-kr/deploy.sh` (엣지 무관)
- 되돌림: 추가한 gtag 블록 삭제 후 재배포. 커밋 단위 revert
- ⚠️ **선결 확인**: `charge.html`은 `toss=success` **소비부가 없다.** 결제 확인이 웹훅으로만 이뤄지는지 Phase 1 착수 시 먼저 판독해야 한다(§7 별건 ①)

### 수정안 2 — `daily_briefing.py` 퍼널 수집기 `[배포 불요·즉시 가능]`

```python
# ① 무료 트랙 편입
FUNNEL_EVENTS = [
    "spec_select", "photo_upload",
    "free_generate_click", "free_generate_done", "free_download",   # 신규
    "generate_click", "preview_view", "begin_checkout", "purchase",
]

# ② hostName 차원 추가 (표면 귀속)
dimensions=[Dimension(name="eventName"), Dimension(name="hostName")],

# ③ 분모를 최댓값이 아니라 첫 단계로
first_users = event_map.get(FUNNEL_EVENTS[0], {}).get("users", 0) or 1
cvr = f["users"] / first_users * 100

# ④ 표 제목을 실제 범위와 일치시킴
lines.append("### 퍼널 (GA4, 전 호스트 — hostName별 분리)")
```

- 변경 파일: `.github/scripts/daily_briefing.py` (:133 · :145 · :397·:402 · :398)
- 배포: **불요**
- 되돌림: revert 1커밋
- 리스크: 낮음. 다만 hostName 차원 추가로 표 행 수가 늘어 브리핑이 길어진다

### 수정안 3 — GA4 커스텀 측정기준 등록 `[작가님 UI 작업]`

§5 표 참조. 코드 변경 0.

### 수정안 4 — `spec_select` 퍼널 1단계 정의 `[정의 결정 필요]`

현행은 페이지뷰다. 선택지:
- **4-A**: 이벤트명을 `specs_page_view`로 바꾸고, 실제 규격 선택 시점에 새 `spec_select`를 신설 → 과거 데이터와 단절
- **4-B**: 이름 유지하고 브리핑·리포트에서 "specs 열람"으로 해석 정정 → 코드 변경 0, 연속성 유지
- 리스크: 4-A는 3주치 시계열이 끊긴다. **작가님 결정 항목**(§5)

### 수정안 5 — `credits.sh payments` 읽기 전용 서브커맨드 `[P0-E 수단 부재 해소]`

`payments`·`transactions` 컬렉션을 기간 집계로 읽는 읽기 전용 서브커맨드. ch4 10조 준수 경로를 만드는 것이 목적이며, 쓰기 기능은 두지 않는다.
- 변경 파일: `scripts/credits.sh` / 배포 불요 / 되돌림: revert
- ⚠️ ch4 10조·헌법 4조 1항 검토 필요 — **쌍아 설계 경유 권장**(막내 자율 범위 밖으로 판단)

### 수정안 6 — idphoto-kr `purchase` 값·ID 교정 `[살리기 전 선결]`

`thankyou.js:182`의 `transaction_id`를 실주문ID로, `value`를 실결제액으로, 발화를 주문 단위 1회로. **수정안 1보다 먼저 하거나 함께 해야** 매출 부풀림을 막는다.
- 변경 파일: `idphoto-kr/public/thankyou.js` (+ jp `:228`) / 배포: 각 `deploy.sh` (jp는 이중 소스 확인)

---

## §5. 작가님 결정·확인 요청 항목

| # | 항목 | 요청 내용 | 왜 필요한가 |
|---|---|---|---|
| **1** | **GA4 데이터 스트림 확인** | 관리 → 데이터 스트림 → `MONKOS AI`(13382285742) → **태그 설정 → "연결된 사이트 태그"** 에 다른 측정 ID가 등록돼 있는지. 그리고 각 스트림의 측정 ID 값 | ID 3개 ↔ 스트림 2개 불일치의 유일한 확정 수단. API로 여기까지가 한계 |
| **2** | **커스텀 측정기준 등록** | 관리 → 맞춤 정의 → 아래 표대로 등록 (SA는 `can_edit:false`라 대행 불가) | 등록 전까지 표면·규격·시장별 분리 리포트가 **원천 불가** |
| **3** | **`spec_select` 정의** | 4-A(이름 교체·시계열 단절) / 4-B(해석 정정·연속성 유지) 중 택1 | 퍼널 1단계의 의미가 G-M1 판정 기준을 좌우 |
| **4** | **purchase 정의** | 크레딧 **충전 시점**을 purchase로 볼 것인가, **크레딧 사용(생성/다운로드) 시점**인가 | 둘 다 쏘면 이중 계상. 08-25 건은 충전(₩9,900) → T1 2회 사용이라 정의에 따라 매출 1건이 2건으로도 보인다 |
| **5** | **실결제 원장 확인** | 최근 30일 토스·레몬 실결제 건수 (대시보드) 또는 수정안 5 승인 | P0-E를 정당한 경로로 수행할 수단이 현재 없음 |
| **6** | **수정안 승인** | 1~6 중 착수할 번호 지정 | ch7 3조 — 지정 외 작업 금지 |

### 커스텀 측정기준 등록 요청 표 (요청 #2)

| 파라미터 | 범위 | 설명 | 보내는 표면 |
|---|---|---|---|
| `service` | 이벤트 | 서비스 구분 (specs-v2 / headshot / idphoto-kr / portal) | 전 표면 |
| `market` | 이벤트 | 시장 (kr / jp / global) | specs-v2 · headshot |
| `spec_type` | 이벤트 | 규격 슬러그 (kr-passport 등) | specs-v2 · idphoto-kr/jp |
| `payment_provider` | 이벤트 | toss / lemon | 결제 이벤트 |
| `auth_method` | 이벤트 | 로그인 제공자 | specs-v2 · idphoto-kr/jp |
| `lang` | 이벤트 | 페이지 언어 | specs-v2 · idphoto-kr/jp |
| `gen_track` | 이벤트 | 생성 트랙 | free_generate_done |
| `ai_engine` | 이벤트 | AI 유입 엔진 (chatgpt/perplexity/…) | ai_referral_landing |
| `landing_page` | 이벤트 | 유입 랜딩 경로 | ai_referral_landing · automation_hit |

> 등록 상한은 이벤트 범위 50개다. 9개는 여유롭다. **`service`·`market`·`spec_type` 3개만 먼저 등록해도 표면 분리는 즉시 가능**하다.

---

## §6. Phase 1 예상 세션 수

| 항목 | 배포 | 예상 |
|---|---|---|
| 수정안 2 (브리핑 수집기) | 불요 | **0.3세션** — 검증은 다음 브리핑 1회 |
| 수정안 1 (purchase 결선) + 6 (값 교정) | portal·idphoto-kr | **0.5세션** + 실결제 1건 대기 |
| 수정안 4 (정의) | 4-B는 0 / 4-A는 0.5세션 + 엣지 재배포 | 결정 의존 |
| 수정안 5 (credits.sh) | 불요 | 0.5세션, **쌍아 설계 선행 권장** |

**승인 항목 전건 착수 시 약 1.5세션.** 단 수정안 1의 **최종 검증은 실결제 1건이 발생해야 성립**한다(계측 이벤트는 비멱등이라 2회 히트 규칙 적용 불가 — ch5 7조). 검증 옵션은 ⓐ 작가님 소액 실결제 1회 ⓑ GA4 DebugView로 발화만 확인 ⓒ 자연 발생 대기. **ⓐ가 G-M1(첫 유료 결제 1건) 요건과 동시에 충족된다.**

---

## §7. 별건 발견 (기재만 — ch7 3조)

1. **`idphoto-kr/charge.html`에 `toss=success` 소비부가 없다.** `successUrl`을 `?toss=success`로 설정하지만 그 파라미터를 읽는 코드가 없다(`location.search` 사용처는 `return` 뿐 — :304·:461). 결제 확인이 웹훅 단독인지, 아니면 **성공 후 사용자에게 확인 UI가 뜨지 않는 UX 결함**인지 미확정. `credits.html`은 정상적으로 `handleTossResult()`로 처리한다. **계측과 별개로 결제 신뢰성 사안일 수 있어 우선 확인 권고.**
2. **`/toss-success` 라우트가 미결선 상태로 존재한다** (`server.js:1006`). 완성된 purchase 계측을 갖고 있으나 호출자가 없다. 수정안 1-B로 살리든, 사용하지 않기로 하고 정리하든 **결정이 필요한 죽은 코드**다.
3. **`studio` 표면이 지시서 검수 대상 5종에서 빠져 있다.** `studio/public/charge.html`도 충전 표면이며 purchase 미발화(경로 4와 동일 구조), gtag ID 2개를 모두 로드한다. 수정안 1 적용 시 함께 다뤄야 누락이 없다.
4. **`monk.kr`(스트림 `monk_studio`)은 커스텀 이벤트가 0건**이다. `scroll`·`click` 등 향상된 측정만 들어온다. 본진 유입 68유저가 퍼널에 전혀 연결되지 않는다 — G-M2의 오프전환 추적 설계 시 선결 과제.

---

## §8. 준수 확인

- ✅ **코드 변경 0건** — 전 항목 판독·읽기 전용 조회
- ✅ **ch4 10조** — 결제 데이터는 `scripts/credits.sh log 200` 경유. Firestore 직접 접근 0건
- ✅ **ch5 7조 / live-verify** — GA4 수치 전건 본 세션 재측정(민아 18:2x 이월 없음). 커스텀 측정기준은 400 추론 대신 레지스트리 직접 조회 + 표준 차원 양성 대조군 병행
- ✅ **헌법 4조 1항** — 측정 ID는 코드상 공개값만 기재. 시크릿 접촉 0
- ✅ **ch7 3조** — 지시서 범위 밖 발견은 §7에 기재만
- ⏸️ **ch1 7조 — Phase 1 착수 승인 대기.** 본 보고 제출로 정지한다. §5 #6에서 착수 번호를 지정해 주시면 그때 시작한다

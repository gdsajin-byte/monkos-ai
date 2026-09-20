---
type: review
date: 2026-09-20
device: iMac
agent: 민아
status: 마감
portfolio: PF_SPECS
subject: "결제 표면 5곳 전수 코드 감사 — specs 결함 유형 A~G 대조 (읽기 전용)"
note: "감사 서브에이전트 산출 원문. 민아 1차 대조: 헤드샷 계측·가드·고정 부재(grep 0건), JP charge overflow-y 0건(대조군 KR 1건), credits.html await 이후 window.open(640행) 확인. 헤드샷 사진 소실 경로는 부분 확인(재저장 호출 439행의 실패 복귀 경로 포함 여부 미확정)."
---

**[2026-09-20 22:31 KST]** iMac/감사 서브에이전트 → 호출 에이전트

# 결제 표면 결함 감사 (A~G) — 읽기 전용, 코드 근거만

코드는 수정·커밋·배포하지 않았습니다. 시크릿 값은 읽거나 출력하지 않았습니다. 모든 판정은 코드 기준이고, 실기기나 라이브 표면에서 재현한 것은 없습니다.

**핵심 결론:** 지금 결제를 가장 많이 잃을 가능성이 높은 표면은 포털 헤드샷입니다. 09-19에 고치기 전 specs 코드가 그대로 남아 있고, 결제 실패 후 재시도하면 업로드 사진이 사라지는 결함이 추가로 있습니다. 그다음은 포털 `credits.html`(특히 글로벌 레몬 경로)과 idphoto-jp `charge.html`(08-13 KR 스크롤 수정 미이식)입니다.

---

## 1. 포털 헤드샷 유료 퍼널 — 가장 위험

- **파일:**
  - `monkos_AI/portal/public/js/headshot.js`
  - `monkos_AI/portal/lib/cms/render-headshot.js` (결제 마크업 400~442)
  - `monkos_AI/portal/public/css/headshot.css`
- **방식:**
  - KR은 토스 결제위젯이며 `/api/payments/direct/init` → `#hs-pm`/`#hs-agree` 렌더 → `?toss=direct|fail`로 복귀합니다.
  - 글로벌·JP는 레몬 팝업이고 팝업 차단 시 동일 탭으로 폴백합니다.
  - specs v2 패턴을 07-05에 이식했으나 09-19/20 수정은 들어가지 않았습니다.

| 결함 | 판정 | 근거 |
|---|---|---|
| A | 부분 해당 | 에러 요소 `#hsPayError`(render-headshot.js:441)는 `#hsPayConfirm`(439) 바로 아래 있습니다. `showPayError()`(headshot.js:53-57)에는 `scrollIntoView`가 없어, 버튼이 화면 하단에 걸리면 문구가 화면 밖에 뜹니다. 실패 복귀 시 `showPaySection(msg)`(61-78)는 섹션 상단으로 스크롤하는데 에러는 섹션 최하단(2카드·`#hsPayGo`·sub 아래)에 있습니다. |
| B | 해당 | `requestPayment().catch`(약 519행)는 `showPayError`만 호출합니다. `mode==='fail'` 분기(664-666), 승인 실패(658-662), 위젯 렌더 `.catch`(510-513), SDK 부재(491) 모두 GA·서버 전송이 없습니다. 서버에는 `[Toss-Direct] 결제 승인 실패`(payments.js:954) 로그만 남습니다. `/api/payments/direct/fail`은 이미 있는데 호출하지 않습니다. |
| C | 해당 | `startDirectPay()`(447-485)의 가드는 `payBusy`뿐이고, 렌더가 끝나면 `payBusy=false`가 됩니다(507). 이후 `#hsPayGo`를 다시 누르면 init이 새로 호출되어 서버 주문이 또 생깁니다. 화면은 그대로라 specs 결함 C 수정 전과 같습니다. 이중 렌더는 `renderPaymentMethods`는 성공하고 `renderAgreement`가 실패했을 때만 가능합니다(`tossWidgetRendered`가 false로 남아 재클릭 시 `#hs-pm`에 다시 렌더). |
| D | 해당 | 스크롤 잠금은 없습니다(portal.css:49-56은 `overflow-x`만). 그러나 `tossWidgetWrap.scrollIntoView({block:'nearest'})`를 1회만 호출합니다(508). specs-funnel.js:1240 주석이 "무효"로 명시한 패턴입니다. 하단 고정 버튼도 없습니다. |
| E | 해당 | 렌더 타임아웃이 없습니다. `setAmount/render` 프라미스가 끝나지 않으면 `payBusy`가 true로 고착되고, 447행 가드 때문에 `#hsPayGo`가 영구 무반응이 됩니다. 로딩 표시도 없습니다. `tossWidgetWrap.style.display='block'`(497) 시점에 금액 라벨이 붙은 `#hsPayConfirm`이 위젯 렌더 전에 먼저 노출됩니다. |
| F | 해당 없음 (코드 계산) | `.container{padding:40px 24px}`(render-shell.js:171)에 모바일 재정의가 없고 `#hsTossWidget`에 패딩이 없어, 360px 폰에서 위젯 폭은 312px입니다. iframe 내부 폭은 판단 불가입니다. |
| G | 해당, 추가 결함 있음 | `mode==='fail'`은 `showMainSections(); showPaySection(msg)`만 실행하고 위젯을 다시 열지 않습니다. 고객은 `#hsPayGo`를 다시 눌러 새 주문을 만들어야 합니다. `lastTossInit` 보존도 없습니다. |

**G 추가 결함 — 실패 후 재결제하면 사진이 사라집니다.**
- `restoreDraft()`(약 590-612)가 복귀 첫 로드에서 `IMG_KEY`/`STYLE_KEY`를 읽은 직후 삭제합니다.
- 실패 복귀 뒤 재시도 경로(`startDirectPay`)는 `persistPayState()`를 호출하지 않습니다. 호출처는 312행과 367행뿐입니다.
- 그래서 실패 1회 → 재결제 성공 → `?toss=direct`로 복귀하면 `uploadedImage`가 null이 되고, `proceed()`가 `showPaySection(PT.imgLost)`를 띄웁니다.
- 돈을 낸 고객이 사진을 다시 올려야 합니다. 결제 토큰은 `ORDER_KEY`에 남아 있어 금전 손실은 없습니다.

---

## 2. 포털 크레딧 충전 — `monkos_AI/portal/public/credits.html`

- **파일:** `credits.html`(인라인 JS 225-817), 모달 `public/js/credits.js`
- **방식:**
  - ko는 토스 위젯입니다(`#payment-method`/`#agreement`, 로그인 필수, `customerKey=user.id`).
  - orderId는 클라이언트에서 생성하며(603) 복귀는 `/credits?toss=success|fail`입니다.
  - 그 외 언어는 레몬 새 창 + 잔액 폴링입니다.

| 결함 | 판정 | 근거 |
|---|---|---|
| A | 해당 없음 (변형 있음) | 에러는 전부 `showToast()`(807-811)로 뜹니다. `.toast{position:fixed;top:24px}`(133-135)이라 스크롤 위치와 무관하게 보입니다. 다만 3.5초 뒤 사라지고 기록이 남지 않습니다. `USER_CANCEL`/`PAY_PROCESS_CANCELED`는 아무 표시 없이 넘어갑니다(615). |
| B | 해당 | `requestPayment` catch(614-618), `?toss=fail`(694-699), 승인 실패(750·755), 위젯 init·렌더 실패(496·501-504) 모두 미계측입니다. `begin_checkout` 이벤트도 없고 `purchase`만 보냅니다(735). 서버에는 승인 거절만 남습니다(payments.js:513 로그+텔레그램, 455 세션 불일치). `handleDirectFail`은 `directOrders` 문서가 있어야 해서(payments.js:855-856) 이 표면에는 그대로 재사용할 수 없습니다. |
| C | 해당 (이중 렌더 레이스) | `selectPkg()`(484-508)의 `widgetReady`는 두 await가 끝난 뒤에야 true가 됩니다(505). 렌더 중 재진입을 막는 플래그가 없습니다. 진입점은 로드 시 `checkAuth→selectPkg(selectedIdx)`(520·571)와 `.pkg` 클릭(약 412-418)입니다. `.pkg`는 `<label>`+내부 `<input radio>` 구조라 탭 1회에 click 리스너가 2번 발화합니다. 렌더 중 다른 패키지를 탭하면 `renderPaymentMethods({selector:'#payment-method'})`가 중복 호출됩니다. SDK가 실제로 이중 렌더하는지는 판단 불가입니다. specs에서는 `INVALID_METHOD_TRANSACTION`으로 나타났습니다. 서버 중복 주문은 해당 없음입니다(서버 주문이 없음). `startTossPayment`에 busy 가드도 없습니다. |
| D | 부분 해당 | 스크롤 잠금은 없습니다(`body{min-height:100vh}` 30-35). `#payBtn`(208)이 잔액카드·패키지 4개·위젯 아래 일반 흐름에 있고 sticky나 `scrollIntoView`가 없습니다. 스크롤하면 도달은 가능합니다. |
| E | 해당 | `selectPkg`에 try/catch와 타임아웃이 없습니다. `#payBtn`은 HTML에서 `disabled`로 시작하고(208) 렌더가 성공해야만 풀립니다(506). 렌더가 멈추거나 거절되면 "₩9,900 결제하기" 라벨이 붙은 버튼이 영구 비활성으로 남습니다. 키 미주입이나 init 예외 시에는 `console.error`만 찍고 return합니다(496). 로딩 표시도 없습니다. |
| F | 해당 없음 | `body{padding:0 16px}`, `.wrap` 좌우 0, `#widgetSection`(203)에 패딩이 없어 360px에서 328px입니다. |
| G | 부분 해당 | 실패 복귀 시 위젯은 로드 때 자동으로 다시 렌더되지만, 선택이 `selectedIdx=0`(297)으로 초기화되고 사유는 3.5초 토스트뿐입니다. 성공 복귀 때 `history.replaceState`(712)로 paymentKey를 URL에서 지운 뒤 승인을 요청합니다. 승인이 실패하거나 세션이 만료되면(`userId=''`→400) 재시도 수단이 없습니다. idphoto-kr에는 `monkos_pending_payment` 보존과 "다시 시도" 버튼이 있습니다. |

**범위 외 추가 적발 — 글로벌 레몬 경로가 결제를 직접 잃는 구조입니다.**
- `startLemonPayment()`(621-648)는 `await fetch` 이후에 `window.open(d.url,'_blank')`(640)을 호출합니다. 사용자 제스처 밖이라 모바일 Safari와 인앱 브라우저에서 팝업이 차단됩니다.
- 반환값을 확인하지 않고 바로 `startCreditPolling()`(641)로 넘어가, 버튼이 "Verifying top-up…" 상태로 180초간 비활성이 됩니다.
- specs와 headshot은 제스처 안에서 창을 먼저 열고 동일 탭으로 폴백하도록 이미 고쳐져 있습니다.
- 모달 `credits.js:63-91`의 `buyCreditsLS`도 같은 구조입니다.
- 실제 차단 여부는 브라우저 동작이라 코드만으로는 판단 불가입니다. 다만 같은 저장소의 주석이 이미 이 문제를 실사고로 기록해 두었습니다.
- 부수 사항: `credits.js`에 variantId와 가격이 하드코딩돼 있습니다(ch2 7조 위반). `buyToss(amount)`는 amount를 버리고 `/credits`로만 이동합니다(104-108).

---

## 3. idphoto-kr — `monkos_AI/idphoto-kr/public/charge.html` + `shared.js`

- **방식:** 토스 위젯, 투터치로 패키지 선택 후 `#payment-view`로 전환합니다. orderId는 클라이언트에서 생성하고, 복귀 처리는 `shared.js:162-244 initFromTossResult()`가 합니다.
- idphoto-kr에서 결제를 받는 페이지는 이 1곳뿐입니다. 모달(`modules/charge.js`)은 `buyCreditsKR`→`charge.html`로 이동만 합니다(shared.js:133-147).

| 결함 | 판정 | 근거 |
|---|---|---|
| A | 해당 없음 | 결제 요청 에러는 `alert()`로 뜹니다(charge.html:327). 실패 복귀도 `alert()`입니다(shared.js:171). 위젯 에러는 `showWidgetError()`(225-230)가 `#payment-method` 자리에 직접 씁니다. 인앱 웹뷰가 alert를 억제하는지는 판단 불가입니다. |
| B | 해당 | catch(323-329), fail 복귀, 승인 실패(`_showPaymentResult`), 위젯 실패(242·282) 모두 미계측입니다. `purchase`만 보냅니다. |
| C | 부분 해당 | 서버 주문이 없어 중복 주문은 생기지 않습니다. 이중 렌더는 `openPaymentView()`(247-285)에서 가능합니다. `widgetRendered`가 await 이후에야 true가 되는데(279), 렌더 중 "변경"/"← 돌아가기"(439-462) → 다른 패키지 2탭 → 재진입하면 `renderPaymentMethods`가 중복 호출됩니다. `handlePay`에 busy 가드도 없습니다. |
| D | 부분 해당 | 08-13 수정(ba2f0098)으로 `#charge-content{overflow-y:auto}`(47-55)가 들어가 도달은 가능합니다. `#pay-btn`(182)은 위젯 아래 일반 흐름에 있고 sticky가 없습니다. `resetScroll()`은 맨 위로만 보냅니다. 내부 스크롤 컨테이너라 specs식 `position:fixed` 고정은 가능합니다. |
| E | 부분 해당 | busy 고착은 없습니다(`#pay-btn`이 항상 활성). 그래서 렌더 전에 눌러 SDK 에러 alert가 뜰 수 있습니다. 로딩 표시와 타임아웃이 없고, `showPaymentView()` 직후 `#payment-method`가 빈 화면입니다. |
| F | 해당 없음 | `#charge-content` 패딩이 16px이라 360px에서 328px입니다. |
| G | 해당 (경미) | 실패 복귀 시 alert 후 선택 뷰로 초기화되고 선택은 보존되지 않습니다. 재시작은 2탭이면 됩니다. |

- 추가 1: 모달에서 패키지를 2탭으로 골라도 `buyCreditsKR(amount, credits)`가 선택값을 넘기지 않아 charge.html에서 다시 2탭이 필요합니다.
- 추가 2: 승인 실패 복구(`monkos_pending_payment`와 "다시 시도" 버튼)는 이 표면이 가장 잘 돼 있어 credits.html 수정의 본보기로 쓸 수 있습니다.

---

## 4. idphoto-jp — `monkos_AI/idphoto-jp/`가 현행 소스

- **이중 소스 판정:** `apps/idphoto-jp-v079/public`의 최종 변경은 2026-04-24이고, bf52fd87에서 "v0.79 아카이브"로 처리됐습니다. 현행은 `monkos_AI/idphoto-jp/`입니다(09-02 최종 변경).
- **v079 코드:** 단일 `index.html`의 `buyCredits()`(1356-1385)입니다. `window.open('about:blank')`를 제스처 안에서 먼저 열지만, 차단 시 `win`이 null이라 TypeError가 나고 catch에서 alert가 뜹니다. 동일 탭 폴백은 없습니다.
- **v079 배포 위험:** deploy.sh에 이중 소스 경고는 있으나 차단은 아닙니다. 실수로 배포하면 구 결제 코드가 라이브를 덮습니다.
- **방식:** 레몬 호스티드 체크아웃으로 동일 탭 리다이렉트합니다. `shared.js:133-178 buyCreditsJP()` → 포털 `/api/checkout` → `location.href` → 복귀는 `?payment=complete`(372-391)입니다.
- **진입점:** `charge.html`, 모달 `modules/charge.js`(prep·camera·result·thankyou에서 사용).

| 결함 | 판정 | 근거 |
|---|---|---|
| A | 해당 없음 | `alert()`를 씁니다(shared.js:168·176). |
| B | 해당 | 클라이언트 계측이 전혀 없습니다(shared.js에 gtag 없음, `begin_checkout`·`purchase`도 없음). 서버에는 `[Checkout] 에러`/`생성` 로그만 있습니다(payments.js:55·62·67). |
| C | 부분 해당 | busy 가드가 없어 연타하면 체크아웃이 여러 개 생성됩니다. 주문은 아닙니다. |
| D | 해당 (08-13 KR 수정 미이식) | `app.css:7-12 body{height:100dvh;overflow:hidden}`인데 `charge.html:80 #charge-content`에 `overflow-y`가 없습니다. KR의 `<style>` 블록(47-55)이 빠져 있습니다. 5번째 카드·스테퍼·特商法/환불 링크가 짧은 폰에서 도달 불가입니다. 실제 잘림 px은 판단 불가입니다. 모달은 `max-height:85vh;overflow-y:auto`(charge.js:120)라 스크롤 가능합니다. |
| E | 부분 해당 | 2탭 후 리다이렉트까지 로딩 표시나 비활성 처리가 없습니다. |
| F | 해당 없음 | 호스티드 페이지입니다. |
| G | 부분 해당 | 취소 복귀 처리가 없습니다. `_handlePaymentComplete`는 5초 후 `credits>0`이면 "決済が完了しました"를 띄우는데, 결제 전 잔액과 비교하지 않습니다. 웹훅이 5초 넘게 늦고 잔액이 0이면 아무 문구도 뜨지 않습니다. |

**범위 외 추가 적발 — 스테퍼 금액 불일치.**
- charge.html(231-234)과 modules/charge.js(186-190)의 스테퍼는 `¥750 決済`처럼 수량 가격을 보여줍니다.
- 실제로는 항상 `topup_10`(¥150/10c) variant로 체크아웃하고 quantity를 보내지 않습니다. `handleCheckout`도 quantity를 받지 않습니다(payments.js:11).
- 주석은 "数量分で決済"인데 구현이 빠져 있습니다.
- `renderChargeCards`가 `topup_10`을 5번째 카드(`data-ci=4`)로도 렌더해, 스테퍼의 `confirmedIdx===4`와 인덱스가 충돌합니다.

---

## 5. 그 외 발견

- **`monkos_AI/studio/public/charge.html`** (studio.monkos.ai, SERVICE_MAP에 "내부 도구 🟢❓"로 등재)
  - idphoto-kr charge의 복제본이고 스크립트 diff는 0입니다.
  - 08-13 D 수정이 빠져 있습니다: `app.css:10-11`이 body를 잠그고 `#charge-content`(79)에 overflow가 없습니다.
  - 짧은 폰에서는 08-13 이전 KR과 동일하게 결제 불가 구조입니다.
  - B·C·E·G 판정은 idphoto-kr과 같습니다. 내부 도구라 우선순위는 낮습니다.
- **포털 `/toss-success`·`/toss-fail`** (payments.js:1055·1100, server.js:1014-1015)
  - 호출처가 0건인 사장 경로입니다.
- **감사 대상에서 제외한 백업·레거시**
  - `portal/public/backup/v3/index.html`
  - `*/_legacy_spa/index.html`
  - `apps/photolab-*`
  - 이 파일들이 실제로 서빙되는지는 판단 불가입니다.
- **image-pro, crop-engine** 등에는 브라우저 결제 호출이 없습니다.

---

## (1) 결제 유실 가능성 순위

| 순위 | 표면 | 이유 |
|---|---|---|
| 1 | 포털 헤드샷 (KR 토스) | C·D·E·G가 09-19 수정 전 specs와 같은 코드이고 B가 전무합니다. 실패 후 재결제하면 사진이 사라집니다. SERVICE_MAP상 🟢 유료 표면입니다. |
| 2 | 포털 credits.html | 글로벌 레몬 경로는 팝업 차단 뒤 버튼이 180초 죽습니다. ko 경로는 위젯 렌더 실패 시 버튼이 영구 비활성, 이중 렌더 레이스, 승인 실패 시 재시도 불가, B 전무입니다. specs·headshot의 크레딧 경로와 idphoto 외 전 표면이 공유하는 충전 허브입니다. |
| 3 | idphoto-jp charge.html | D(스크롤 잠금)가 미수정이고 스테퍼 금액이 불일치합니다. 다만 주 동선인 모달은 스크롤이 됩니다. 서비스 상태도 🟡 레거시입니다. |
| 4 | idphoto-kr charge.html | D는 해소됐습니다. B 전무, 버튼이 화면 아래에 있고 고정이 없음, 로딩 표시 없음, 복귀 시 선택 유실이 남아 있습니다. |
| 5 | studio charge.html | D가 그대로지만 내부 도구입니다. |

B(계측 부재)는 5개 표면 전부 해당입니다. 그래서 위 순위는 구조상 추정이고, 실제 유실률은 어느 표면도 지금은 측정할 수 없습니다.

## (2) 표면별 최소 수정 목록 (specs-funnel.js 패턴 재사용)

**공통 서버 작업 — `portal/lib/payments.js`**
- `handleDirectFail`은 `directOrders` 문서가 있어야 합니다. 헤드샷은 그대로 쓸 수 있습니다.
- credits·idphoto-kr·studio·jp는 서버 주문이 없습니다. 선택지는 두 가지입니다.
  - (a) 로그인 세션 기준의 경량 엔드포인트를 신설합니다. 예: `/api/payments/fail`, `[Pay-Fail] service= stage= code= vp= inApp=` 로그, 3회 이상이면 텔레그램 1회.
  - (b) 1차로 GA `pay_fail`만 보냅니다.
- 어느 쪽이든 `FAIL_STAGES`·60자/200자 절단·키와 토큰 미포함 원칙은 그대로 따릅니다.
- idphoto-kr·studio는 교차 오리진이라 CORS와 `credentials:'include'`가 필요합니다.

**헤드샷 — `headshot.js`, `render-headshot.js`, `headshot.css`**
1. `reportPayFail(stage,code,msg)`를 이식합니다.
   - `/api/payments/direct/fail`을 그대로 씁니다.
   - 호출 지점은 `requestPayment.catch`, 렌더 `.catch`, SDK 부재, `mode==='fail'`, 승인 실패, 폴링 timeout/failed입니다.
2. `#hsPayError`를 상단 `#hsPayErrorTop`(`#hsPayGo` 위)과 하단(`#hsPayConfirm` 바로 위) 두 슬롯으로 나눕니다.
   - `showPayError`에 `isWidgetOpen` 분기와 `scrollIntoView({block:'center'})`를 넣습니다.
3. `startDirectPay` 앞에 두 가드를 넣습니다.
   - `tossWidgetRendered && pay.orderId && isWidgetOpen()`이면 포커스만 주고 return.
   - `tossRenderInFlight`이면 return.
4. 렌더 타임아웃을 넣습니다.
   - 12초 `renderTimer`가 `payBusy`를 해제합니다.
   - `setWidgetLoading()`으로 로딩 표시를 띄웁니다.
   - `#hsPayConfirm`은 렌더가 끝난 뒤에 노출합니다.
5. 하단 고정을 넣습니다.
   - `updateDock/scheduleDock`, `#hsPayConfirm.is-docked`, 스페이서, ResizeObserver를 이식합니다.
   - 렌더 후 `scrollIntoView`는 `block:'start'`로 바꿉니다.
6. 실패 복귀 재오픈을 넣습니다.
   - `lastTossInit`을 `persistOrder`에 포함합니다.
   - `mode==='fail'`에서 `startToss(lastTossInit)`으로 위젯을 다시 열고 사유를 버튼 위에 띄웁니다.
7. 사진 소실을 고칩니다.
   - `restoreDraft`의 즉시 삭제를 결제 복귀 모드에서는 건너뛰거나, `startDirectPay`·실패 복귀 분기에서 `persistPayState()`를 다시 호출합니다.

**credits.html** (인라인 JS는 빌드 때 난독화되므로 같은 파일 안에서 수정합니다)
1. `selectPkg`에 `renderInFlight` 가드와 try/catch, 12초 타임아웃, 로딩 표시를 넣습니다.
   - 실패 시 `#payBtn` 바로 위 인라인 에러 슬롯에 고정 표시하고, 재시도가 가능하게 합니다(토스트만 쓰지 않습니다).
   - 키 미주입(496)도 같은 슬롯에 띄웁니다.
2. `.pkg` 리스너를 label `click`에서 radio `change`로 바꿔 탭 1회에 2번 발화하는 문제를 없앱니다.
3. `startTossPayment`에 busy 가드와 `begin_checkout`·`pay_fail` 계측을 넣습니다.
4. `#payBtn`에 `is-docked` 하단 고정을 적용합니다.
5. 승인 복구를 넣습니다.
   - idphoto-kr `shared.js:180-196`의 `monkos_pending_payment` 보존과 "다시 시도" 버튼을 이식합니다.
   - `replaceState`는 승인 성공 뒤로 옮기거나, 보존을 먼저 하고 나서 실행합니다.
6. 실패 복귀 시 `selectedIdx`를 sessionStorage로 복원하고 사유는 인라인으로 고정합니다.
7. 레몬 경로를 고칩니다.
   - `startLemonPayment`와 `credits.js buyCreditsLS`를 specs식으로 바꿉니다(제스처 안에서 `window.open('')` → URL 지정 → 실패 시 `location.href`로 동일 탭 이동).
   - `window.open`이 null이면 폴링에 들어가지 않습니다.

**idphoto-jp**
1. `charge.html`에 KR의 `#charge-content` 스크롤 `<style>` 블록(KR 47-55)을 이식합니다.
2. `buyCreditsJP`에 busy 가드, 카드 "読み込み中…" 상태, `begin_checkout`·`pay_fail` 계측을 넣습니다.
3. `_handlePaymentComplete`를 결제 전 잔액과 비교하고 폴링하도록 바꿉니다(`credits.html startCreditPolling` 방식).
4. 스테퍼를 고칩니다. quantity를 지원하거나(`handleCheckout`에 quantity 추가) 10c 고정으로 단순화합니다. `topup_10` 카드는 중복 렌더에서 제외합니다.
   - 이 항목은 과금 정책이므로 작가님 승인이 필요합니다.
5. `apps/idphoto-jp-v079/deploy.sh`의 경고를 차단으로 올릴지 검토합니다(배포 체계 변경이라 쌍아 소관입니다).

**idphoto-kr charge.html**
1. `pay_fail` 계측을 catch, `shared.js:169` fail 복귀, 승인 실패에 넣습니다. `begin_checkout`도 추가합니다.
2. `openPaymentView`에 `renderInFlight` 가드와 12초 타임아웃, 로딩 표시를 넣습니다.
   - `#pay-btn`은 렌더가 끝난 뒤에 활성화합니다.
   - `handlePay`에 busy 가드를 넣습니다.
3. `#pay-btn`에 `is-docked`를 적용합니다(스크롤 이벤트는 `#charge-content`에 겁니다).
4. 실패 복귀 시 선택값(`selectedIdx`/`stepperQty`)을 sessionStorage로 복원해 결제 뷰를 자동으로 다시 열고, alert 대신 버튼 위 인라인 사유로 바꿉니다.
5. `buyCreditsKR`이 선택값을 `charge.html?pkg=`로 전달하도록 합니다.

**studio charge.html**
- KR 08-13 `<style>` 블록을 이식하고, 위 KR 수정 세트를 동기화합니다(공유 모듈화를 권장합니다).

---

✅ 5개 표면의 A~G 판정과 파일·행 근거를 확보했습니다.
❌ 코드 변경·배포·라이브 실측은 하지 않았습니다(읽기 전용 지시).
💡 범위 외 적발 3건:
- credits.html·credits.js 레몬 팝업 차단 후 버튼 180초 무반응
- 헤드샷 실패 후 재결제 시 사진 소실
- JP 스테퍼 금액 불일치

⏳ 코드만으로 판단 불가한 항목 4건(실기기 확인 필요):
- 토스 iframe 실폭
- SDK의 이중 렌더 동작
- 인앱 웹뷰의 alert 억제
- JP charge 실제 잘림 px

📁 주요 파일 (모두 `/Users/jeong-kyushin/developer/monk_project/monkos_AI/` 아래):
- `portal/public/js/headshot.js`
- `portal/lib/cms/render-headshot.js`
- `portal/public/credits.html`
- `portal/public/js/credits.js`
- `portal/lib/payments.js`
- `idphoto-kr/public/charge.html`
- `idphoto-kr/public/shared.js`
- `idphoto-jp/public/charge.html`
- `idphoto-jp/public/shared.js`
- `idphoto-jp/public/modules/charge.js`
- `studio/public/charge.html`

🔀 후속:
- 수정은 지시서 경로(쌍아 → 막내)를 권고합니다.
- JP 스테퍼와 v079 배포 차단은 작가님·쌍아 판단 사안입니다.

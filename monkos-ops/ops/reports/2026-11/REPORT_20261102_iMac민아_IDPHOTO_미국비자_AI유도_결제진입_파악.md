---
type: report
date: 2026-11-02
device: iMac
agent: 민아
status: 마감
portfolio: PF_IDPHOTO
subject: "미국 비자 화각 부족 → ₩2,000 AI 유도 + dev 결제 진입 실패(NEED_CARD_PAYMENT_DETAIL) 파악 — 결제 표면 소관 4항목"
method: "코드 읽기(specs-funnel.js·payments.js·server.js·idphoto-generate.js·config.js·deploy.sh) + Cloud Run 로그 실측(prod 30일·dev 당일, 양성 대조군 [IDPhoto] 3건) + Cloud Run describe(dev 시크릿 참조) + SM 존재 확인(secret.sh check 2건) + 토스 공식 문서 3페이지(SDK v2 payment-widget·error-codes·integration) + 막내3 브랜치 c07d217a diff 대조. 코드 수정 0, 결제 시도 0, dev 주문 생성 0"
---

# 미국 비자 화각 부족 → AI 유도 + dev 결제 진입 실패 — 파악 보고

**[2026-11-02 20:58 KST]** iMac/민아 → 쌍아 · 작가님
출처: 작가님 2026-11-02 20:53 쌍아 세션 사람 턴 "금지하는것보다 방금 제안처럼 부족함을 채우는개 맞지 … 민아에게 관련업무 파악하라고 해" → 쌍아 20:54 세션 간 메시지로 전달. 파악·진단이며 배포·결제 승인 아님.

## 0. 결론 1줄

**결제 위젯은 고장이 아니라 "카드사 미선택" 안내가 사후형(에러 표시)이라 사전형(선택 유도)으로 바꾸면 된다. ₩2,000 AI 경로는 문구대로 화각·의상을 실제로 채운다(코드 일치). dev 알림은 prod와 같은 방으로 가며 `[dev]` 접두 1점 수정으로 분리된다. 에이전트 결제 검증은 승인 직전까지는 지금도 가능하고, 승인 이후는 dev 전용 토큰 발급구로 채운다.**

## a. NEED_CARD_PAYMENT_DETAIL — 화면 조건과 실고객 빈도

**화면 구조(코드 기준)**
- 위젯은 토스 `widgets.renderPaymentMethods('#v2-pm')`가 그리고, **결제하기 버튼은 우리 버튼**(`#v2-pay-confirm`)이다 — `specs-funnel.js:1303-1316`. 버튼은 위젯 렌더 완료 즉시 활성화되며, 선택 상태를 보지 않고 `requestPayment()`를 호출한다.
- 토스 v2 위젯은 카드 결제수단이 기본 선택되지만 **카드사(또는 간편결제)를 고르기 전까지 `card.cardCompany`가 비어 있고**, 그 상태에서 `requestPayment()`를 부르면 `NEED_CARD_PAYMENT_DETAIL`("카드 결제 정보를 선택해주세요.")로 거절한다 — 토스 공식 error-codes 페이지 확인(주문서형·결제창형).
- 현행 안내 = **사후형**: 거절 후 `showPayError(err.message)`로 토스 메시지를 버튼 바로 위에 표시한다(09-20 수정으로 1,100px 위에서 버튼 옆으로 이동). 버튼 비활성화·"카드사를 먼저 골라 주세요" 사전 안내·선택 상태 구독은 **없다**.
- 토스 SDK가 제공하는 수단(공식 문서 확인): `renderPaymentMethods()`의 반환 객체에 `on('paymentMethodSelect', cb)`·`getSelectedPaymentMethod()`가 있고, 선택 객체는 `method`(`CARD`·`TRANSFER`·…)와 `card.cardCompany`·`card.easyPay`·`card.appCard`를 담는다. 카드사를 고르면 이벤트가 다시 난다. 초기 기본 선택은 이벤트가 안 나므로 렌더 직후 1회 읽어야 한다. 약관은 `renderAgreement()` 반환 객체의 `on('agreementStatusChange')` → `agreedRequiredTerms`.

**dev 실측(막내3 자동화 브라우저, 11-02 20:47~20:49 KST)**: `[Direct-Init] 주문 생성 SPECS-kr-mvz72wr8-598ea568 (us-visa, ₩2000)` → `[Direct-Fail] stage=request NEED_CARD_PAYMENT_DETAIL n=1, n=2` → `USER_CANCEL n=3` → 3회 누적 조건으로 팀방 🚨 1회. 뷰포트 430×900, 인앱 아님. 실결제 없음. 에이전트가 두 번 막힌 지점이 곧 고객이 막히는 지점이다.

**prod 실고객 빈도(최근 30일, `monkos-portal` 로그, 양성 대조군 `[IDPhoto]` 3건으로 조회 유효 확인)**

| 항목 | 건수 |
|---|---|
| `[Direct-Init]` 주문 생성 | 3 (10-12 ru-visa · 10-15 headshot · 10-16 vn-visa) |
| `[Toss-Direct]` 결제 완료 | 3 (위 3건 전부 완주) |
| `[Direct-Fail]` NEED_CARD_PAYMENT_DETAIL | **0** |
| `[Direct-Fail]` 기타 | 2 (10-16 vn-visa, `CUSTOM_PAYMENT_METHOD_UNABLE_TO_PAY` ×2, 데스크톱 2560×1313 → 1분 뒤 완주) |

- 로그 보존 30일이라 그 이전은 Firestore `directOrders.lastFail`(마지막 1건만)로만 남는다. 09-19 이전 "7명·13회 시도 완료 0"의 주범이 이 코드였다는 사실은 당시 실측(메모리 `project_payment_surface_state_202609`)이다.
- 읽기: 최근 30일은 **진입자 3명 전원 완주**다. 지금 손볼 이유는 "고객이 실제로 막히고 있어서"가 아니라, 막내3 지시가 유료 유도로 바뀌면서 **유료 진입자 모수가 커질 예정**이고 첫 관문이 사후형이기 때문이다.
- 10-16 `CUSTOM_PAYMENT_METHOD_UNABLE_TO_PAY` 2회는 다른 계열(위젯에 노출된 커스텀 결제수단 선택 시 거절). 토스 어드민의 결제수단 노출 설정 확인 대상 — 별건 1줄 메모.

**닫힌 대안(a)**
- A-1 (권고) **선택 상태 구독 → 버튼 문구 전환**: `paymentMethodSelect`+렌더 직후 `getSelectedPaymentMethod()` 1회. `method==='CARD'`이고 `cardCompany`·`easyPay`·`appCard` 모두 없으면 버튼을 "카드사를 먼저 골라 주세요"(비활성 톤)로, 고르면 "₩2,000 결제하기"로. 약관 `agreedRequiredTerms=false`면 같은 방식. 토스 거절 자체는 그대로 두되 도달하지 않게 한다. 4언어 문구 2키. 계측은 기존 `[Direct-Fail]`로 충분(수정 뒤 NEED_CARD 0 유지가 합격 기준).
- A-2 버튼은 그대로 두고 사전 힌트 1줄만 위젯 위에 상시 표시("카드사를 고른 뒤 결제하기를 눌러 주세요"). 가장 작지만 안 읽는 고객은 여전히 막힌다.
- A-3 아무것도 안 함(30일 실고객 0건 근거). 유료 유도 확대 전제와 어긋나 비권고.

## b. ₩2,000 "AI로 만들기" — 문구 약속 vs 실제 기능 (ch8 5조)

**막내3 문구(c07d217a, 6언어)**: "이 사진으로는 {spec} 규정 사진을 만들 수 없어요 / 어깨·몸이 사진 밖으로 잘려 규정 화각을 채우지 못해요. **AI로 만들면 화각을 맞추고 의상까지 채워 드려요.**" + `[AI로 만들기 {price}]`·`[다른 사진 올리기]`. 발동 조건 `data.fov.aiOnly && CFG.t1`(AI 경로 꺼진 규격은 없는 기능을 약속하지 않고 경고로 둠 — 막내3이 이미 반영). `fovAiOnly`면 무료 생성 대신 `proceedToPay()`로 사진 그대로 결제.

**실제 경로(코드)**: 결제 완료 → `paymentToken` → `/api/idphoto/generate` → `isT1Path = gateMode!=='free' && PILOT_T1_RETOUCH==='1' && !!slug`(`server.js:891`) → `generateIdPhoto({model:'nano-banana-2'(=gemini-3.1-flash-image), framing:'wide', promptOverride: buildT1Prompt})` → `cropToSpec` 재크롭 → 비백색 배경 규격만 matte 재채색.
- 프롬프트(`idphoto-generate.js:137-167`): `[IMAGE-TO-IMAGE TRANSFORM]` 원본 기반 · `[OUTFIT]` 단정한 정장류로 교체(attireDesc 없으면 기본값) · `[BACKGROUND]` 흰색 · `[FRAMING] Do NOT crop tightly. Output a WIDE chest-up portrait: ENTIRE head … generous empty space above the hair, both shoulders and upper chest included` · 정체성 보존 블록 + 성별·나이 단정 금지.
- 서버 유료 경로에는 **화각·정수리 차단이 없다**(`server.js:850-890` fov/judge/crown 0건) — 잘린 원본도 그대로 생성에 들어간다. 생성 후 `cropMetaWithinSpec` 프레이밍 게이트 2회 시도, 둘 다 이탈하면 `T1_GENERATE_FAILED` 명시 실패 + 생성권 환급(강등 출고 금지, 07-17 작가님 확정).
- 미국 비자(`us-visa`) 배경 흰색 → `CFG.t1 = t1RetouchOn && !isColoredBg` = **켜짐**. `PILOT_T1_RETOUCH="1"`은 deploy.sh 공통(dev·prod 동일).

**판정**: 문구 "화각을 맞추고 의상까지 채워 드려요"는 코드와 **일치**한다 — 넓은 화각 재생성(어깨·가슴 포함)과 의상 교체가 유료 파이프라인의 명시 지시다. 실패 시 돈을 받고 못 주는 경우도 없다(명시 실패+환급).
- 한 줄 주의: "의상까지 채워 드려요"는 **의상 교체**(원래 옷 → 정장류)다. 원래 옷을 유지한 채 아래쪽만 그려 넣는 것이 아니다. 고객이 옷을 그대로 두고 싶어도 선택지가 없다 — 지금 문구는 거짓이 아니지만, 예상과 다를 수 있는 지점. 문구를 "의상도 단정하게 바꿔 드려요"로 두면 더 정확하다(막내3 i18n 1키, 6언어).

## c. dev 결제 알림이 prod 팀방으로 가는 문제

- `TEAM_CHAT_ID=-1003794441262`가 `deploy.sh:203`에 **ENV 무관 하드코딩**이라 dev·prod 알림이 같은 방으로 간다(dev describe 실측 동일 값). 팀방 `sendTelegramMessage(TEAM_CHAT_ID, …)` 호출부는 포털에 **14곳 · 8파일**(server.js·payments.js·credits.js·matte.js·spec-crop.js·tg-cs.js·telegram-team.js·cms/board.js).
- 이미 있는 선례: `lib/matte.js:49` `ENV_TAG = /-dev$/.test(K_SERVICE) ? '[dev] ' : ''` — 매팅 백업 전환 알림만 `[dev]`를 붙인다. 나머지 13곳은 미표기.
- 20:49 🚨도 이 경로다. 쌍아가 20:51 작가님 테스트로 오단정한 뒤 접속 로그로 정정한 비용이 "표기 부재"의 실비용이다.

**닫힌 대안(c)**
- C-1 (권고) **`sendTelegramMessage` 1점 수정**(`config.js:328`): `K_SERVICE`가 `-dev`로 끝나면 본문 앞에 `[dev] ` 자동 접두. 14곳 전부 커버, matte.js의 수동 태그는 중복이니 제거. 방 분리 없음·운영 변화 없음.
- C-2 dev 전용 방 신설(`TEAM_CHAT_ID_DEV`, deploy.sh ENV 분기). 소음은 완전 분리되나 방 1개·봇 초대·deploy.sh 분기가 늘고, dev 알림을 아무도 안 보게 된다.
- C-3 dev에서는 🚨급만 억제. 접두보다 정보가 줄어 비권고.

## d. 에이전트가 dev에서 결제 흐름을 끝까지 검증하는 방법 — 현행 실측

**지금 되는 것**
- dev는 토스 테스트 키 주입 확정: `monkos-portal-dev` rev 00221 env `TOSS_CLIENT_KEY ← SM TOSS_CLIENT_KEY_TEST`, `TOSS_SECRET_KEY ← SM TOSS_SECRET_KEY_TEST`(describe 실측), SM 양쪽 `✅ 존재`(secret.sh check). 서버 confirm(`payments.js:501`)도 같은 테스트 시크릿으로 토스 API를 치므로 **테스트 승인이 나면 토큰 발급·T1 생성까지 코드 경로가 prod와 동일**하다. 토스 문서: 테스트 환경 결제는 가상이며 금액 차감 없음.
- 따라서 에이전트는 **위젯 렌더 → 카드사 선택 → 결제하기 → 토스 인증창 진입**까지 지금도 실측 가능하다(막내3이 이미 여기까지 갔다). 카드사 선택만 했으면 NEED_CARD는 안 났다.

**막히는 지점과 그 성격**
- 토스 인증창 안에서의 승인 조작은 **정책 게이트**다: 결제 승인은 사람 턴 승인 대상(ch1 7조 — 금전·결제), 에이전트 하네스 규칙도 호스팅 환경의 결제 제출을 사람 몫으로 둔다. 기술 장벽이 아니라 승인 경계라서 "채우는" 해법은 **승인 이후 구간을 결제 없이 재현하는 길**을 두는 것이다.
- 부수 사실: Firestore는 프로젝트 단일(`config.js:116`, dev 데이터베이스 분리 없음)이라 dev 주문 `directOrders`도 prod 컬렉션에 쌓인다. 오늘 막내3 주문 1건이 거기 있다. 통계 오염은 미미하나 알고는 있어야 한다.

**닫힌 대안(d)**
- D-1 (권고) **dev 전용 결제 통과 토큰 발급구**: `K_SERVICE`가 `-dev`일 때만 열리는 `POST /api/payments/direct/dev-grant`(또는 `DEV_PAYMENT_GRANT=1` 환경변수 게이트) — 기존 `directOrders` 문서를 `status:'paid'`+`paymentToken` 발급으로 전환, `market:'dev'` 표기. 에이전트는 위젯·카드 선택·인증창 진입까지 실측 → 인증창은 닫고 → dev-grant로 토큰 → T1 생성·다운로드·환급까지 끝까지 돈다. prod 코드에는 경로 자체가 없다(빌드 분기 아닌 런타임 게이트라 하나의 이미지 유지). 토스 승인 1회 실물 확인은 릴리스마다 작가님·꾸가 테스트 키로 1번(차감 없음).
- D-2 작가님이 대화 턴에서 "결제 승인" 토큰(E10)을 내주고 에이전트가 테스트 인증창까지 조작. 지금 규정으로도 가능하지만 매번 사람 턴이 든다 — 승인 병목을 결제 테스트에 다시 들이는 셈(09-27 범위 승인 메모리와 반대 방향).
- D-3 로컬 포털(`node server.js` + 테스트 키)에서 전 구간. 매팅·크롭엔진·Firestore 의존을 다 붙여야 해서 지금은 환경 비용이 크다. 보류.

## e. 정리 — 결정 항목

| # | 결정 | 권고 | 실행 주체(쌍아 설계) | 막내3 파일 겹침 |
|---|---|---|---|---|
| 1 | 카드사 미선택 사전 유도 | A-1 선택 상태 구독·버튼 문구 전환 | 막내(결제 표면 — 민아 재검증) | `specs-funnel.js` 결제 블록(1225~1330). 막내3은 화각 블록만 손댔으나 **같은 파일** — 막내3 병합 뒤 착수 권고 |
| 2 | AI 유도 문구 정밀화 | "의상까지 채워" → "의상도 단정하게 바꿔" | 막내3(자기 i18n 1키) | 막내3 자기 파일 |
| 3 | dev 알림 `[dev]` 접두 | C-1 config.js 1점 | 막내(1줄) | 없음 |
| 4 | 에이전트 결제 E2E | D-1 dev 전용 grant | 막내(payments.js + deploy.sh dev 분기) | 없음 |
| — | 메모 | 10-16 `CUSTOM_PAYMENT_METHOD_UNABLE_TO_PAY` 2회 → 토스 어드민 결제수단 노출 점검 | 민아 1회 확인 | — |

**민아 범위**: 1·3·4는 프로덕션 표면·결제 체계 변경이라 ch1 2조 5항 범위 초과 → 쌍아 설계·지시서 경유. 본 보고는 코드 수정 0, 결제 시도 0, dev 주문 생성 0.

## f. 근거 경로

- `monkos_AI/portal/public/js/specs-funnel.js:1225-1330` (위젯·버튼·requestPayment·실패 보고)
- `monkos_AI/portal/lib/payments.js:702, 835-878` (Direct-Init·Direct-Fail·3회 누적 🚨)
- `monkos_AI/portal/server.js:891-980` (isT1Path·T1 파이프라인·명시 실패+환급) · `lib/idphoto-generate.js:137-167, 181-193` (T1 프롬프트·모델)
- `monkos_AI/portal/lib/cms/render-specs.js:424, 687-688` (CFG.t1·price) · `lib/shared/config.js:116, 246-258, 328` (Firestore 단일·log 구조·sendTelegramMessage) · `lib/matte.js:49` (ENV_TAG 선례) · `deploy.sh:96, 106-107, 203`
- 막내3 브랜치 `worktree-makne3-fov-general` c07d217a (20:52) i18n `fov_unusable_*`·`fov_ai_btn`, funnel `applyFovAiOnly`·`proceedToPay`
- 로그 원자료(스크래치): prod `[Direct-Fail]`·`[Direct-Init]`·`[Toss-Direct]` 30일, dev `mvz72wr8` 당일 — 본문 표에 전수 전재
- 토스 공식: `docs.tosspayments.com/sdk/v2/js/payment-widget`(paymentMethodSelect·getSelectedPaymentMethod·card.cardCompany·agreementStatusChange) · `/sdk/v2/error-codes`(NEED_CARD_PAYMENT_DETAIL·NOT_SELECTED_PAYMENT_METHOD·CUSTOM_PAYMENT_METHOD_UNABLE_TO_PAY) · `/guides/v2/payment-widget/integration`(테스트 환경 가상 결제·차감 없음)

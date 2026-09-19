---
type: order
date: 2026-09-19
from: iMac/민아
to: iMac/막내1
subject: specs 즉시결제 동선 결함 6건 수정 + 결제 실패 계측 신설 (P0 — 결제 시도 고객 전원 미완료)
status: 대기
portfolio: PF_SPECS
priority: P0
sequence: 1/2 (후속 — ORDER_20260919_iMac민아_막내1_SPECS_불편신고_게시판연동)
---

# ORDER — specs 즉시결제 동선 결함 수정 + 실패 계측

**[2026-09-19 12:54 KST]** iMac/민아 → iMac/막내1 (작가님 직접 지시 · 쌍아 세션 부재로 민아 발행 — 쌍아 사후 추인 대상)

## 1. 배경/목적

specs "만들기 ₩2,000" 즉시결제 경로에서 **결제를 시도한 고객이 전원 완료하지 못했다.**

- 서버 로그(최근 30일): `/api/payments/direct/init` 실고객 3명·7회, 승인 호출 `/api/payments/toss/direct` **0건**.
- GA4(07-05~09-19): specs 경로 `begin_checkout` 약 7명·13회, `purchase` **0건**. 기기는 아이폰 사파리·윈도우 크롬/엣지·안드로이드 삼성인터넷/웨일·맥 — 특정 OS 한정 아님.
- 한 고객이 4회(07-07 아이폰), 5회(08-30 삼성인터넷, 중간에 사진 재업로드까지) 재시도 = 의사 변경이 아니라 **하려다 못 한** 패턴.
- 08-13에 같은 계열 사고(idphoto-kr `charge.html` 결제하기 버튼 화면 밖)를 고쳤으나 그 수정은 해당 페이지 1곳에만 적용됐다. specs 결제 표면은 점검된 적이 없다.

위젯 자체는 정상이다(라이브 모바일 에뮬 실측: init 200 · 라이브 키 · setAmount/renderPaymentMethods/renderAgreement ok · 기본 결제수단 CARD 선선택 · 서버 승인 핸들러 로직 이상 없음). **고장은 위젯을 둘러싼 우리 쪽 UI와, 실패를 아무 데도 남기지 않는 계측 공백에 있다.**

근거 기록: `monkos-ops/ops/sessions/2026-09/2026-09-19_iMac_민아.md` (12:30·12:36·12:40·12:47 항목)

## 2. 산출물

| 파일 | 역할 |
|---|---|
| `monkos_AI/portal/public/js/specs-funnel.js` | 결제 단계 동작 수정 + 계측 발화 |
| `monkos_AI/portal/lib/cms/components/spec-funnel-markup.js` | 결제 단계 마크업(위젯 위치·결제 영역 에러 슬롯) |
| `monkos_AI/portal/public/css/specs-funnel.css` | 결제하기 버튼 하단 고정·에러 슬롯 스타일 |
| `monkos_AI/portal/lib/cms/specs-i18n.js` | 신규 문구(ko/en/ja/es 전 로케일 — 누락 금지) |
| `monkos_AI/portal/server.js` + `lib/payments.js` | 결제 실패 수신 엔드포인트(서버 로그) |
| `monkos-ops/ops/reports/2026-09/COMPLETION_20260919_iMac막내1_SPECS_결제동선_결함수정.md` | 완료 보고 |

## 3. 상세 설계

### 3-1. 결함 6건 (전부 코드로 확정된 것)

| # | 결함 | 위치 | 수정 |
|---|---|---|---|
| A | **에러가 화면 밖에 뜬다.** 모든 에러가 `#v2-error`(마크업 33행, 결제 단계 *위* 정적 요소)에 표시. 모바일 1열에서 결제하기 버튼은 약 1,100px 아래 → 거절·취소·실패 문구가 고객 시야 밖 = "눌러도 반응 없는 버튼" | `showError()` (specs-funnel.js:96) · 마크업 33행 | 결제 영역 전용 에러 슬롯을 **결제하기 버튼 바로 위**에 신설. 결제 단계에서 발생한 에러는 그 슬롯에 표시 + `scrollIntoView({block:'center'})`. 기존 `#v2-error`는 업로드·검수 단계용으로 존치 |
| B | 계측 0 | 3-2 참조 | 3-2 |
| C | 첫 버튼(`#v2-pay-instant`) 재클릭마다 서버 주문 신규 생성, 화면 변화 없음 | specs-funnel.js:866~ | 위젯이 열린 상태(`tossWidgetRendered` && 주문 유효)에서 첫 버튼 재클릭 시 **init 재호출 금지** — 위젯으로 스크롤만. 주문 재사용 |
| D | 위젯이 누른 버튼 바로 아래가 아니라 구분선+크레딧 버튼 *아래*에 열림 | 마크업 110~126행 | 위젯 열림 시 `#v2-pay-instant` 직하에 위치하도록 재배치(또는 위젯 열림 동안 구분선·크레딧 버튼 접기). 첫 버튼은 "선택됨" 상태로 시각 전환 |
| E | 스크롤 정렬이 렌더 직후 `'nearest'` 1회뿐. 위젯 영역 실측 629px(375폭) — 가용 높이가 그보다 짧은 폰은 결제하기 버튼이 화면 아래 | specs-funnel.js:936 부근 | ① 위젯 열린 동안 `#v2-pay-confirm`을 **뷰포트 하단 고정(sticky/fixed, safe-area-inset-bottom 반영)** ② `ResizeObserver`로 `#v2-pm`·`#v2-agree` 높이 변화 시 재정렬 |
| F | 실패 복귀(`?toss=fail`) 시 페이지 재로드 → 위젯 소멸, 첫 버튼부터 재시작, 새 주문 | resume() (specs-funnel.js:1181~) | `mode==='fail'` 복귀 시 저장된 주문이 유효하면 **위젯을 자동 재오픈**하고 실패 사유를 결제 영역 에러 슬롯에 표시 |

- 유료 경로 정책(가격·크레딧·폴백)은 **일절 변경 금지**. 본 지시서는 UI 동작과 계측만 다룬다.
- 레몬(글로벌) 경로는 동작 변경 없음. 단 A(에러 슬롯)·B(계측)는 레몬 경로에도 동일 적용.

### 3-2. 결제 실패 계측 신설

GA4 이벤트(기존 `gaTrack` 경유, 파라미터에 토큰·키·개인정보 금지 — 기존 주석 원칙 준수):

| 이벤트 | 발화 시점 | 파라미터 |
|---|---|---|
| `pay_widget_open` | 위젯 렌더 완료 | payment_provider |
| `pay_confirm_click` | 결제하기 클릭 | payment_provider |
| `pay_fail` | requestPayment reject / `?toss=fail` 복귀 / 승인 API 실패 / 레몬 폴링 실패·타임아웃 | payment_provider, fail_stage(`request`·`return`·`confirm`·`poll`), fail_code, in_app(bool) |

서버 로그(실패 사유의 정본 — GA는 유실 가능):
- `POST /api/payments/direct/fail` 신설. body: `{ orderId, stage, code, message(200자 절단), vw, vh, inApp }`. UA는 요청 헤더에서 취득.
- `directOrders/{orderId}` 문서에 `lastFail` 필드 기록 + `log('[Direct-Fail] ...', 'WARNING')`. **서버 발급 orderId가 아니면 무시**(임의 주입 차단). 레이트리밋은 기존 `checkRateLimit` 관례 준용.
- 같은 주문에서 실패 3회 이상이면 `sendTelegramMessage(TEAM_CHAT_ID, ..., TELEGRAM_TEAM_API)` 1회 알림(기존 호출 관례 — `lib/payments.js:356` 참조).

### 3-3. 검증 (완료 기준에 포함)

- dev 배포 후 **모바일 에뮬 3종(360×640 · 360×740 · 375×812) + 데스크톱 1280×800**에서 각각: 위젯 열림 → 결제하기 버튼 **완전 가시** 실측(getBoundingClientRect, 뷰포트 내) → 약관 해제 등으로 에러 유발 → 에러 문구가 뷰포트 내 표시 확인 → 첫 버튼 재클릭 시 init 미호출(네트워크 탭) 확인.
- ⚠️ 브라우저 패널이 숨김(`document.hidden=true`)이면 토스 위젯 iframe 높이가 0으로 남는다(민아 12:47 실측 — 인공물). **반드시 탭을 전면에 두고** 측정할 것.
- `?toss=fail&code=TEST&message=test` 직접 진입으로 F(위젯 자동 재오픈) 확인.
- 실카드 승인 단계는 에이전트가 재현 불가 — prod 반영 후 작가님 실기기 1회로 종결(완료 보고에 "실카드 미검증" 명기).

### 3-4. 배포

1. `monkos_AI/portal/deploy.sh dev` → 3-3 검증.
2. prod는 **작가님 승인 후**: `deploy.sh prod` → **`edge/deploy.sh` 엣지 재배포 필수**(specs 페이지·`/js/specs-funnel.js`는 CF Worker 정적 자산 — 누락 시 무음 구본). `edge/smoke_assert.txt`에 신규 에러 슬롯 id 1행 추가 검토.
3. 라이브 검증은 URL당 2회 히트(`.claude/rules/live-verify.md`) + 판정 방법 병기.

## 4. ⚠️ 준수 조항

- **헌법 4조 1항**: API 키·토큰 생성/추측/로그 출력 금지. 토스 키 값을 로그·GA·fail 엔드포인트에 넣지 말 것.
- **헌법 3조 1항**: 타임스탬프는 `date` 명령 취득.
- **헌법 3조 2항**: 완료 보고 + COMPLETION 파일 + 세션 로그 + PF_SPECS 히스토리 1행.
- **ch5 2조·6조**: 배포는 `deploy.sh` 경유만. **ch1 7조**: `deploy.sh prod`는 새 사용자 턴 승인 후.
- **ch4 10조**: Firestore 운영 목적 직접 접근 금지(서비스 코드 내 접근은 대상 아님).
- **ch2 7조**: 가격 하드코딩 금지 — 버튼 라벨의 금액은 기존 `d.amount`/CFG 경유 유지.
- **유료 실패 원칙**(작가님 07-17): 실패는 명시적으로 보여줄 것. 무음 강등 금지.
- **롤백 단위 = 커밋 단위**: 본 지시서(결함 수정·계측)와 후속 지시서(게시판 연동)는 **커밋을 분리**할 것.

## 5. 완료 기준

- [ ] 결함 A·C·D·E·F 수정, 에뮬 3종+데스크톱에서 3-3 항목 전부 통과(수치 기재)
- [ ] `pay_widget_open`·`pay_confirm_click`·`pay_fail` GA 발화 확인(DebugView 또는 네트워크 collect 페이로드)
- [ ] `/api/payments/direct/fail` 동작 + 미발급 orderId 거부 + Cloud Run 로그에 `[Direct-Fail]` 실측
- [ ] 신규 문구 ko/en/ja/es 전 로케일 반영
- [ ] dev 검증 완료 → 작가님 승인 → prod + 엣지 재배포 → 2회 히트 라이브 검증
- [ ] COMPLETION 파일·세션 로그·PF_SPECS 히스토리·커밋·푸시

## 6. 커밋 메시지

`[fix] specs 즉시결제 동선 — 결제 영역 에러 가시화·결제하기 버튼 하단 고정·재클릭 주문 중복 차단·실패 복귀 위젯 재오픈 + 결제 실패 계측 신설`

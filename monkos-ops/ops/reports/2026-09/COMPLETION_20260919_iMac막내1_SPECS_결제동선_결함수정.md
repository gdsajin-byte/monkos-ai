---
type: completion
date: 2026-09-19
device: iMac
agent: 막내1
status: 마감
portfolio: PF_SPECS
order: ORDER_20260919_iMac민아_막내1_SPECS_결제동선_결함수정_실패계측
---

# COMPLETION — specs 즉시결제 동선 결함 수정 + 실패 계측

**[2026-09-19 13:30 KST]** iMac/막내1 → 작가님

## 1. 결과 요약

지시서 결함 5건(A·C·D·E·F) 수정 + 결제 실패 계측(B) 신설. **dev 배포·실측 전 항목 통과.**
prod 배포는 미실행 — 작가님 승인 대기 (ch1 7조 승인 게이트).

**가장 큰 수확은 수정 자체가 아니라, 실패 사유가 처음으로 서버에 남았다는 것이다.**
검증 중 발생한 실패 10건이 전부 `NEED_CARD_PAYMENT_DETAIL`("카드 결제 정보를 선택해주세요")로 기록됐다.
종전 코드였다면 이 문구는 결제 버튼 **약 1,100px 위**에 떠서 고객 눈에 닿지 않고, 서버에도 아무 흔적이 없었다.
실고객 7회 시도가 승인 호출 0건이었던 패턴과 **형태가 같다** — 다만 실고객 원인 단정은 불가(상관 가설).

## 2. 변경 파일

| 파일 | 변경 |
|---|---|
| `monkos_AI/portal/lib/cms/components/spec-funnel-markup.js` | 결제 에러 슬롯 2종 신설, 토스 위젯을 첫 버튼 직하로 재배치, 도킹 스페이서 |
| `monkos_AI/portal/public/js/specs-funnel.js` | showPayError/도킹/재클릭 차단/복귀 재오픈/GA 3종/서버 실패 보고 |
| `monkos_AI/portal/public/css/specs-funnel.css` | `.v2-pay-error`, `.v2-widget-open`, `#v2-pay-confirm.is-docked` |
| `monkos_AI/portal/lib/cms/specs-i18n.js` | `payRetryHint` — **6개 로케일 전량**(ko·ja·en·es·id·vi) |
| `monkos_AI/portal/lib/payments.js` | `handleDirectFail` 신설 |
| `monkos_AI/portal/server.js` | `POST /api/payments/direct/fail` 라우팅 + rate limit 20/분 |

커밋 2건 (롤백 단위 분리):
- `48b542c5` 결함 수정 + 계측 신설
- `88467e2d` 실패 복귀 재오픈이 성립하지 않던 저장 순서 교정 (실측이 적발)

## 3. 결함별 처리

| # | 처리 | 실측 근거 |
|---|---|---|
| **A** | 결제 영역 전용 에러 슬롯 2종 신설 — 위젯 내(`#v2-pay-error`, 결제하기 **바로 위**) / 위젯 열기 전(`#v2-pay-error-top`, 첫 버튼 바로 위). 표시 시 `scrollIntoView({block:'center'})`. 기존 `#v2-error`는 업로드·검수 단계용으로 존치 | 4/4 뷰포트에서 `#v2-pay-error` 표시·**뷰포트 내**, 전역 `#v2-error`는 **미표시** |
| **B** | 3-2 참조 | 아래 §4 |
| **C** | 위젯 렌더 완료 + 주문 보유 + 위젯 표시 중이면 첫 버튼 재클릭 시 **init 미호출**, 위젯으로 스크롤만 | 4/4에서 재클릭 후 init 호출 수 **1 → 1** |
| **D** | 토스 위젯 DOM을 `#v2-pay-instant` **직하**(구분선·크레딧 버튼 위)로 이동 + 첫 버튼 "선택됨" 시각 전환. **구분선·크레딧 버튼은 접지 않음** — 지시서가 "재배치 **또는** 접기"를 허용했고, 접으면 크레딧 경로로 되돌아갈 길이 사라진다 | 라이브 DOM 순서 실측: `v2-pay-instant`(296) → `v2-toss-widget`/`v2-pay-confirm`(303/307) → `v2-pay-divider`(311) → `v2-pay-credit`(312) |
| **E** | 위젯 열림 중 결제하기 버튼이 뷰포트 아래로 밀리면 **하단 고정**(`is-docked`, `env(safe-area-inset-bottom)` 반영) + 흐름 공백 유지 스페이서. 스크롤·리사이즈·`ResizeObserver`(`#v2-pm`·`#v2-agree`·위젯) rAF 스로틀 재정렬. 위젯 렌더 후 정렬을 `nearest` → `start`로 교정 | 아래 §5 표 |
| **F** | `?toss=fail` 복귀 시 저장된 주문으로 **위젯 자동 재오픈** + 실패 사유를 결제 영역 슬롯에 표시(`payRetryHint` 병기). 새 주문 생성 없음 | `?toss=fail&code=TEST` 진입 → phase=`v2-phase-pay`, 위젯 visible=**True**, 에러 슬롯 뷰포트 내 |

## 4. 결제 실패 계측 (B)

**GA4** — 4/4 뷰포트에서 `pay_widget_open` · `pay_confirm_click` · `pay_fail` 발화 실측(`window.dataLayer` 페이로드 판독).

```
pay_fail params: { spec_type: "kr-passport", lang: "ko", service: "specs-v2", market: "kr",
                   payment_provider: "toss", fail_stage: "request",
                   fail_code: "NEED_CARD_PAYMENT_DETAIL", in_app: false }
```
토큰·키·개인정보 미포함 확인. `fail_stage` 4종(`request`·`return`·`confirm`·`poll`) 중 `request`·`return` 실발화 확인.
레몬 경로는 `pay_widget_open`(체크아웃 표면 오픈)·`pay_fail`(`poll`) 적용, `pay_confirm_click`은 레몬 페이지 소관이라 미적용.

**서버** — `POST /api/payments/direct/fail` → `directOrders/{orderId}.lastFail` + `failCount` + `[Direct-Fail]` WARNING 로그.

| 검증 | 결과 |
|---|---|
| 형식 불일치 orderId(`HACK-1`) | **400** `INVALID_ORDER_ID` |
| 형식 정합·서버 미발급 orderId | **404** `ORDER_NOT_FOUND` |
| 실주문 기록 | `{"ok":true,"failCount":3}` |
| Cloud Run 로그 | `[Direct-Fail] SPECS-kr-… stage=request code=NEED_CARD_PAYMENT_DETAIL n=1 vp=375x812 inApp=false slug=kr-passport` **10건 실측** |

## 5. 검증 상세 (3-3)

dev rev **monkos-portal-dev-00184-wpk** / `https://…/specs/passport/kr` / CDP 크롬 전면(`document.hidden=false` 4/4 확인 — 민아 12:47 iframe 높이 0 인공물 회피)

| 뷰포트 | 위젯 높이 | 결제하기 (미도킹) | 뷰포트 내 | 도킹 유도 후 | init 재클릭 | 에러 슬롯 |
|---|---|---|---|---|---|---|
| 360×640 | 585px | top 529 / bottom 581 (vh 640) | ✅ | docked=**True**, 576–628 | 1→1 ✅ | `#v2-pay-error` top 345 ✅ |
| 360×740 | 585px | 529 / 581 (vh 740) | ✅ | docked=**True**, 676–728 | 1→1 ✅ | top 395 ✅ |
| 375×812 | 585px | 529 / 581 (vh 812) | ✅ | docked=**True**, 748–800 | 1→1 ✅ | top 431 ✅ |
| 1280×800 | 527px | 471 / 523 (vh 800) | ✅ | docked=**True**, 736–788 | 1→1 ✅ | top 405 ✅ |

- 위젯 렌더 직후에는 `block:'start'` 정렬만으로 결제하기가 이미 뷰포트 안에 들어온다(도킹 불필요) → 위로 280px 스크롤해 버튼을 화면 밖으로 밀어내는 **도킹 유도 시험**을 별도 수행, 4/4에서 도킹 후에도 버튼이 뷰포트 안(스페이서 64px로 흐름 공백 유지).
- 전역 `#v2-error`는 4/4에서 미표시 — 결제 에러가 옛 위치로 새지 않음.

## 6. ⚠️ 한계·미검증 (그대로 남긴 것)

1. **실카드 승인 미검증** — 에이전트 재현 불가. prod 반영 후 작가님 실기기 1회 필요 (지시서 3-3 명시 조건).
2. **검수 정규 경로 미통과** — 테스트 사진(`apps/crop-app/test_face.jpg`)이 precheck에서 "얼굴을 찾지 못했어요"로 반려되어, 결제 단계 진입은 **DOM 강제 전환**으로 대체했다(업로드로 `uploadedBase64`는 정상 세팅됨). 따라서 **의상 피커가 마운트되지 않은 상태**의 측정이다. 피커는 결제 버튼 *위*에 쌓이므로 위젯·결제하기 버튼의 상대 위치 판정에는 영향이 없으나, 실사용자 화면과 1:1은 아니다.
3. **텔레그램 3회 알림은 코드 경로만 구현** — 검증 중 한 주문이 `failCount=3`에 도달해 **팀 채팅으로 테스트 알림이 실제 발송됐을 수 있다**(발송 여부 자체는 미확인). 의도된 소음이며 실장애 아님.
4. **`cdp_utils._send` 결함 발견** — 이벤트/응답 구분 없음. 우회 클라이언트로 검증 수행, `PF_CDP/case_studies.md` **CASE-016** 등록. 본체 수정은 쌍아 소관이라 손대지 않음.

## 7. 잔여 (작가님 승인 후)

1. `monkos_AI/portal/deploy.sh prod`
2. **`edge/deploy.sh` 엣지 재배포 필수** — dev 배포가 드리프트를 경고했다(`spec-funnel-markup.js`·`specs-i18n.js`가 SSG 빌드 이후 변경). 누락 시 라이브 specs는 무음 구본.
3. `edge/smoke_assert.txt`에 `v2-pay-error` 슬롯 어서션 1행 추가 검토
4. prod 라이브 검증 — URL당 2회 히트(1차 버리고 2차 판정)

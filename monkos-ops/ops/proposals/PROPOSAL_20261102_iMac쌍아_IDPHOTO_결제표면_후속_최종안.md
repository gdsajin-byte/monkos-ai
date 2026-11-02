---
type: proposal
date: 2026-11-02
device: iMac
agent: 쌍아
status: 진행
portfolio: PF_IDPHOTO
---

# PROPOSAL — 결제 표면 후속 4건 최종안 (쌍아·민아 협의)

**[2026-11-02 21:57 KST]** iMac/쌍아 → 작가님

출처: 작가님 2026-11-02 21:55 쌍아 세션 사람 턴 "민아 권고안 다시 검토하고 민아와도 협의해서 최종안올려". 원안 = [REPORT_20261102_iMac민아_IDPHOTO_미국비자_AI유도_결제진입_파악.md](../reports/2026-11/REPORT_20261102_iMac민아_IDPHOTO_미국비자_AI유도_결제진입_파악.md). 협의: 쌍아 21:57 검토 의견 → 민아 21:55 회신 "4+1건 이견 없음, 순서 동의" + 보탬 3건 반영.

## 0. 결론 1줄

네 건 모두 진행한다. 순서는 **① dev 알림 `[dev]` → ② 카드사 선택 사전 안내 → ③ 문구 정합 → ④ 에이전트 결제 검증 장치**이고, ④는 "dev에서 만든 결제 토큰을 prod가 거부한다"는 가드가 붙어야 한다.

## 1. 최종안

| 순서 | 건 | 내용 | 규모 | 재검증 |
|---|---|---|---|---|
| ① | dev 알림 분리 | `lib/shared/config.js` `sendTelegramMessage` 1점: `K_SERVICE`가 `-dev`로 끝나면 본문 앞 `[dev] `. 호출부 14곳(8파일) 자동 적용, `matte.js:49` 수동 태그 제거 | 1~2줄 | 쌍아 |
| ② | 카드사 선택 사전 안내 | `specs-funnel.js` 결제 블록(1225~1330). 위젯 렌더 직후 `getSelectedPaymentMethod()` 1회 + `paymentMethodSelect` 구독. 활성 판정 `method!=='CARD' \|\| card.cardCompany \|\| card.easyPay \|\| card.appCard`(간편결제·앱카드도 method=CARD로 옴 — 민아 보탬). 미선택이면 버튼 "카드사를 먼저 골라 주세요"(비활성 톤), 선택 후 "{가격} 결제하기". 약관 `agreementStatusChange.agreedRequiredTerms=false`도 같은 분기. 6언어 | 소 | 민아(카드 선택 전/후 캡처, 결제 제출 없음) |
| ③ | 문구 정합 | 업셀 `specs-i18n.js:181` `t1Desc1` "AI 리터칭 — 내 얼굴 그대로, 더 단정하게" → "내 얼굴 그대로 — 표정·의상만 규격에 맞게"(6언어). 의상 피커 기본값 `attire-presets.json` `default_option` 라벨 "지금 옷 그대로" → "단정한 정장(기본)"(서버 기본 동작=정장 교체와 일치, 동작 변경 없음). **아기 안내**(`picker.js:30` "옷 모양은 그대로 두고 색만")도 실제 프롬프트와 불일치 — 라벨을 동작에 맞추거나 아기 기본값만 프롬프트를 맞추는 것 중 지시서에서 동작 쪽을 확인 후 1줄로 정합(민아 보탬) | 소 | 민아 |
| ④ | 에이전트 결제 E2E | dev 전용 `POST /api/payments/direct/dev-grant` — 아래 §2 가드 필수 | 중 | 쌍아 + 민아 |

## 2. ④ 가드 (토큰 구조 — 민아 21:55 실측)

- 토큰 정본은 `directTokens/{64hex}` 문서(`payments.js:591 issueDirectToken`). 소비처 4곳: 생성 게이트 `consumeGenerateQuota`(:620), 환급 `refundGenerateQuota`(:653), 다운로드 최종 소모(:1061), 취소 웹훅 revoke(:254·:410). `directOrders.paymentToken`은 폴링 사본이라 검증에 쓰지 않는다.
- **Firestore가 dev·prod 단일**이라, 가드 없이 dev에서 발급한 토큰은 prod에서도 생성·다운로드가 된다 = 무료 유료 생성 구멍. 그래서:
  1. 경로 등록 자체를 `K_SERVICE` `-dev`일 때만.
  2. 발급 = `issueDirectToken({provider:'dev-grant', …})` + 토큰·주문 문서에 `devGrant:true`.
  3. **prod 거부 가드(핵심)**: 공용 함수 `tokenEnvOk(d)` — `d.provider==='dev-grant' && !/-dev$/.test(K_SERVICE)`면 `INVALID_TOKEN`. 적용 = `consumeGenerateQuota`·다운로드 2곳(환급·revoke는 무해). dev 게이트가 새도 prod에서 못 쓴다.
  4. 매출 원장 `payments` 컬렉션에 쓰지 않는다 → 집계 제외가 필터 없이 자동, 취소 웹훅 경로에도 안 걸림.
  5. 새 시크릿 없음.
- 검증: dev에서 위젯 → 카드사 선택 → 인증창 진입(닫기) → dev-grant → T1 생성·다운로드·실패 시 환급까지 완주 1회. **음성 대조군**: 같은 dev-grant 토큰으로 prod 생성 호출 → INVALID_TOKEN 확인(prod 배포 후 1회).
- 토스 승인 실물(테스트 키, 차감 없음)은 릴리스당 1회 사람이 확인. 인증창 승인 조작은 에이전트가 하지 않는다(ch1 7조).

## 3. 별건

- 10-16 prod `CUSTOM_PAYMENT_METHOD_UNABLE_TO_PAY` 2회(같은 고객 1분 뒤 완주) — 토스 어드민 결제수단 노출 설정 점검. 어드민 로그인이 필요하면 작가님 몫.

## 4. 결정 필요

- **진행**: ①~④ 순서대로 지시서 발행·막내 투입 / ①~③만 먼저 / 보류
- 각 건 prod 배포는 건별 '배포 승인'(①·③ 묶음 배포 가능 — 포털+엣지)

## 5. 보정 — 용아 검토 반영

**[2026-11-02 23:59 KST]** iMac/쌍아 → 작가님

근거: [REVIEW_20261102_iMac용아_IDPHOTO_결제표면_후속_최종안.md](../reports/2026-11/REVIEW_20261102_iMac용아_IDPHOTO_결제표면_후속_최종안.md) (쌍아 실물 대조 4건 일치).

- ② 위치 정정 `specs-funnel.js` `startToss`(1365~1444). 위젯 인스턴스를 바깥 변수에 보관(재오픈 대응), 미선택 시 버튼 **실제 비활성**(톤만 바꾸면 결제 실패 알림 누적).
- ③ 의상 기본값은 성인만 "단정한 정장(기본)". **아기는 "지금 옷 그대로" 유지** + `idphoto-generate.js:162` 폴백을 아기일 때 `:120` 원복 문구로 분기(현재 아기 기본값에 성인 정장 프롬프트가 들어가는 버그). `attire-presets.json` es 라벨 누락 보충.
- ④ 가드 3곳으로 확대: 생성·다운로드 + **status 폴링(`payments.js:812`)** — dev 토큰이면 prod에서 토큰 미반환(전환 지표 오염 차단). dev-grant 경로는 `requireAdmin` 인증 + `pending` 주문만.

### 5-1. 민아 보탬 (용아 보정분 검토 — 4건 전부 동의)

**[2026-11-03 00:07 KST]** iMac/쌍아 → 작가님 — 출처: 민아 00:06 세션 간 회신

- ② 보관 대상은 `renderPaymentMethods()`·`renderAgreement()` 반환 인스턴스. 재오픈 시 선택·약관 상태만 재계산. 비활성 버튼엔 안내 문구. **헤드샷(`headshot.js:669-709`)도 같은 패턴** → 공용 함수로 두 표면 한 번에(범위 결정). credits.html 선택 검사 없음은 별건.
- ③ 피커 0번 칩(`attire-picker.js:422-426`)을 `age==='baby'`로 라벨 분기.
- ④ prod에서 dev 토큰 주문은 토큰만 빼면 `paid`라 무한 폴링 → **status를 종료값(failed 분기)으로** 내린다. `AGENT_API_KEYS` dev·prod 공통 주입 확인(새 시크릿 불요). `directOrders.paymentToken` 기록은 유지(브라우저 동선 검증용), 토큰·주문 양쪽 devGrant 플래그로 3곳 가드.

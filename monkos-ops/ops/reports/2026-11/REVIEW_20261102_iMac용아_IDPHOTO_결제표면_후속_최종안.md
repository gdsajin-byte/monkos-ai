---
type: report
date: 2026-11-02
device: iMac
agent: 용아
status: 마감
portfolio: PF_IDPHOTO
---

> 실행: Antigravity CLI `agy` 1.4.12 헤드리스, 모델 gemini-4-argon-high, 구독 로그인(별도 과금 없음), 읽기 전용. 기동 iMac/쌍아 23:53, 작가님 23:11 지시 "제미나이 용아에게도 cli붙여서…검토시켜봐". 원문 그대로 보존 — 쌍아 대조는 맨 아래.

**[2026-11-02 23:53 KST]** 용아 → 작가님

## 결론 (1줄)
**①은 그대로 진행 가능하나, ②·③·④는 아래 코드상 누락(위젯 재오픈·클릭 차단, 영유아 정장 폴백 버그, dev 무인증·폴링 구멍)을 보완해 진행해야 합니다.**

## 건별 판정
- **① dev 알림 분리 — 동의**: [`monkos_AI/portal/lib/shared/config.js:328`](file:///Users/jeong-kyushin/developer/monk_project/monkos_AI/portal/lib/shared/config.js#L328)(`sendTelegramMessage`) 1점 접두와 [`monkos_AI/portal/lib/matte.js:49`](file:///Users/jeong-kyushin/developer/monk_project/monkos_AI/portal/lib/matte.js#L49)·[`:248`](file:///Users/jeong-kyushin/developer/monk_project/monkos_AI/portal/lib/matte.js#L248) `ENV_TAG` 제거로 팀방 오경보가 해소됩니다.
- **② 카드사 선택 사전 안내 — 수정 필요**: 실제 코드는 1225~1330행이 아닌 [`monkos_AI/portal/public/js/specs-funnel.js:1365-1444`](file:///Users/jeong-kyushin/developer/monk_project/monkos_AI/portal/public/js/specs-funnel.js#L1365-L1444)(`startToss`)입니다. (1) [`:1398`](file:///Users/jeong-kyushin/developer/monk_project/monkos_AI/portal/public/js/specs-funnel.js#L1398) `if(tossWidgetRendered) return;` 때문에 실패 복귀 재오픈([`:1761`](file:///Users/jeong-kyushin/developer/monk_project/monkos_AI/portal/public/js/specs-funnel.js#L1761)) 시 위젯 객체를 못 읽으므로 반환 인스턴스를 외부 변수([`:1347`](file:///Users/jeong-kyushin/developer/monk_project/monkos_AI/portal/public/js/specs-funnel.js#L1347))에 보관해야 하고, (2) 미선택 시 버튼 "비활성 톤"만 주고 클릭을 안 막으면 [`:1427`](file:///Users/jeong-kyushin/developer/monk_project/monkos_AI/portal/public/js/specs-funnel.js#L1427) `requestPayment()` → [`:1434`](file:///Users/jeong-kyushin/developer/monk_project/monkos_AI/portal/public/js/specs-funnel.js#L1434) `reportPayFail` 3회 누적 🚨([`monkos_AI/portal/lib/payments.js:865`](file:///Users/jeong-kyushin/developer/monk_project/monkos_AI/portal/lib/payments.js#L865))가 그대로 울리므로 `btn.disabled = true`(또는 클릭 조기 반환)가 필수입니다.
- **③ 문구 정합 — 수정 필요**: 업셀 키는 [`monkos_AI/portal/lib/cms/specs-i18n.js:181`](file:///Users/jeong-kyushin/developer/monk_project/monkos_AI/portal/lib/cms/specs-i18n.js#L181)(`public/js` 아님), 아기 안내는 [`monkos_AI/portal/public/components/attire-picker/attire-picker.js:30`](file:///Users/jeong-kyushin/developer/monk_project/monkos_AI/portal/public/components/attire-picker/attire-picker.js#L30)(`picker.js` 아님)입니다. 아기 프리셋 3종([`attire-presets.json:2132-2283`](file:///Users/jeong-kyushin/developer/monk_project/monkos_AI/portal/public/components/attire-picker/attire-presets.json#L2132-L2283))은 실제로 `mode:"recolor"`(옷 모양 유지·색만 변경)라 안내 문구가 맞으며, 불일치 원인은 기본칩(`attire_desc:null`)일 때 [`monkos_AI/portal/lib/idphoto-generate.js:162`](file:///Users/jeong-kyushin/developer/monk_project/monkos_AI/portal/lib/idphoto-generate.js#L162)가 아기에게도 성인 정장(`dark business attire`) 폴백을 넣는 버그입니다.
- **④ 에이전트 결제 E2E(`dev-grant`) — 수정 필요**: `directTokens` 소비처는 생성 2곳([`monkos_AI/portal/server.js:864`](file:///Users/jeong-kyushin/developer/monk_project/monkos_AI/portal/server.js#L864)·[`monkos_AI/portal/lib/headshot-route.js:42`](file:///Users/jeong-kyushin/developer/monk_project/monkos_AI/portal/lib/headshot-route.js#L42) → [`monkos_AI/portal/lib/payments.js:616`](file:///Users/jeong-kyushin/developer/monk_project/monkos_AI/portal/lib/payments.js#L616) `consumeGenerateQuota`)과 다운로드 1곳([`monkos_AI/portal/lib/payments.js:1050`](file:///Users/jeong-kyushin/developer/monk_project/monkos_AI/portal/lib/payments.js#L1050) `handleDownloadDirect`)뿐이라 2곳 가드로 prod 생성·다운로드는 **전부 차단됨을 확인**했습니다. 단, 아래 위험 1·2를 함께 막아야 안전합니다.

## 놓친 위험 또는 더 나은 대안 (최대 3개)
1. **[④ 보안·원가] 공개 dev 서버의 무인증 `dev-grant` 악용**: `monkos-portal-dev`는 `--allow-unauthenticated`([`monkos_AI/portal/deploy.sh:245`](file:///Users/jeong-kyushin/developer/monk_project/monkos_AI/portal/deploy.sh#L245))이고 URL도 코드에 공개([`monkos_AI/portal/lib/shared/config.js:211-213`](file:///Users/jeong-kyushin/developer/monk_project/monkos_AI/portal/lib/shared/config.js#L211-L213))되어 있어, 무인증이면 외부인이 **dev 서버 자체에서** `dev-grant` 발급 후 유료 생성([`server.js:971`](file:///Users/jeong-kyushin/developer/monk_project/monkos_AI/portal/server.js#L971)·[`headshot-route.js:77`](file:///Users/jeong-kyushin/developer/monk_project/monkos_AI/portal/lib/headshot-route.js#L77))을 무제한 호출해 Vertex AI·RunPod 비용을 태울 수 있습니다. **대안**: 새 시크릿 없이 기존 [`monkos_AI/portal/lib/cms/admin-auth.js:52`](file:///Users/jeong-kyushin/developer/monk_project/monkos_AI/portal/lib/cms/admin-auth.js#L52) `requireAdmin(req, res)`(`Bearer AGENT_...`, [`deploy.sh:204`](file:///Users/jeong-kyushin/developer/monk_project/monkos_AI/portal/deploy.sh#L204) 기주입) 인증을 걸고 `order.status === 'pending'`만 허용하세요.
2. **[④ 소비처 누락] prod `handleDirectStatus` 폴링 구멍([`monkos_AI/portal/lib/payments.js:795-817`](file:///Users/jeong-kyushin/developer/monk_project/monkos_AI/portal/lib/payments.js#L795-L817))**: `directOrders.paymentToken`을 prod `GET /api/payments/direct/status`가 그대로 반환하면, prod 프론트([`specs-funnel.js:1479-1485`](file:///Users/jeong-kyushin/developer/monk_project/monkos_AI/portal/public/js/specs-funnel.js#L1479-L1485), [`headshot.js:755-760`](file:///Users/jeong-kyushin/developer/monk_project/monkos_AI/portal/public/js/headshot.js#L755-L760))가 생성 거절 전에 **GA4 `purchase`·Google Ads 전환을 먼저 발화**해 실매출 지표를 오염시킵니다. **대안**: [`payments.js:812`](file:///Users/jeong-kyushin/developer/monk_project/monkos_AI/portal/lib/payments.js#L812)에도 `tokenEnvOk(d)` 가드를 넣으세요.
3. **[③ 영유아 기본값] `default_option` 일괄 변경 시 아기에게 정장 노출·적용**: [`attire-presets.json:4-12`](file:///Users/jeong-kyushin/developer/monk_project/monkos_AI/portal/public/components/attire-picker/attire-presets.json#L4-L12)(`es` 라벨도 누락)를 일괄 `"단정한 정장(기본)"`으로 바꾸면 영유아 탭 0번 칩([`attire-picker.js:422-426`](file:///Users/jeong-kyushin/developer/monk_project/monkos_AI/portal/public/components/attire-picker/attire-picker.js#L422-L426))도 정장이 됩니다. **대안**: [`attire-picker.js:30`](file:///Users/jeong-kyushin/developer/monk_project/monkos_AI/portal/public/components/attire-picker/attire-picker.js#L30) 문구는 유지하고, `age === 'baby'`일 때는 0번 칩을 "지금 옷 그대로"로 두며 [`idphoto-generate.js:162`](file:///Users/jeong-kyushin/developer/monk_project/monkos_AI/portal/lib/idphoto-generate.js#L162)의 `!attireDesc && age === 'baby'` 폴백을 [`idphoto-generate.js:120`](file:///Users/jeong-kyushin/developer/monk_project/monkos_AI/portal/lib/idphoto-generate.js#L120)(`Keep current clothing as-is...`)으로 분기하세요.

## 미확인 사항
- **토스 SDK v2 런타임 반환 객체·어드민 설정**: `getSelectedPaymentMethod()` 반환 필드(`cardCompany`·`easyPay`·`appCard`) 실값과 토스 어드민 `CUSTOM_PAYMENT_METHOD_UNABLE_TO_PAY` 설정은 외부 SDK·어드민 영역이라 정적 코드만으로 **미확인**입니다.
- **막내3 브랜치(`c07d217a`) 병합 상태**: 로컬 `main`에 반영된 화각 코드([`specs-funnel.js:145-182`](file:///Users/jeong-kyushin/developer/monk_project/monkos_AI/portal/public/js/specs-funnel.js#L145-L182)) 외 별도 워크트리 잔여 변경 유무는 명령 미실행 원칙에 따라 **미확인**입니다.

---

**[2026-11-02 23:59 KST]** iMac/쌍아 → 작가님 — 실물 대조
- ② `specs-funnel.js:1398` `if(tossWidgetRendered) return;` 확인 — 재오픈 시 위젯 이벤트 재구독 불가 지적 맞음.
- ④ `payments.js:812` status 폴링이 `paymentToken`을 그대로 반환 확인 — prod 전환 오발화 구멍 맞음.
- ③ `idphoto-generate.js:162` 기본 의상 폴백이 나이 무관 정장, `:120` 원복 문구 별도 존재 확인 — 아기 기본값 버그 맞음.
- ④ dev `--allow-unauthenticated`(`deploy.sh:245`)·`requireAdmin`(`admin-auth.js:52`) 존재 확인 — 인증 부착 대안 채택 가능.

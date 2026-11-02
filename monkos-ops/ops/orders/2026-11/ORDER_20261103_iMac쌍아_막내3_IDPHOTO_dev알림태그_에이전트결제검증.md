---
type: order
date: 2026-11-03
from: iMac/쌍아
to: iMac/쌍아-막내3
subject: 결제 표면 ①dev 텔레그램 [dev] 태그 1점화 → ④에이전트 결제 E2E(dev-grant) + dev 토큰 prod 거부 가드 3곳, dev까지
status: 대기
portfolio: PF_IDPHOTO
---

# ORDER — ① dev 알림 태그 → ④ dev-grant 결제 검증 장치

**[2026-11-03 04:17 KST]** iMac/쌍아 → iMac/쌍아-막내3

출처: 작가님 2026-11-03 04:16 iMac 쌍아 세션 사람 턴 "모두진행해" — [최종안](../../proposals/PROPOSAL_20261102_iMac쌍아_IDPHOTO_결제표면_후속_최종안.md) §1·§2·§5·§5-1 전부(헤드샷 포함) 진행 승인. 범위 승인 = 본 문서 §2~§3(구현·dev 검증·보고). **prod·엣지 배포는 작가님 '배포 승인' 별도.**
근거 문서: 최종안 + [용아 검토](../../reports/2026-11/REVIEW_20261102_iMac용아_IDPHOTO_결제표면_후속_최종안.md). 먼저 읽는다.

## 2. 할 일 (①·④ 각각 별도 커밋 — 롤백 단위)

### ① dev 알림 태그
1. `monkos_AI/portal/lib/shared/config.js:328` `sendTelegramMessage` 1점: `K_SERVICE`가 `-dev`로 끝나면 본문 앞 `[dev] `. 이미 `[dev] `로 시작하면 중복 금지.
2. `lib/matte.js:49` `ENV_TAG`·:248 사용처 제거(중복 방지). 호출부 14곳(8파일) 별도 수정 없음 — grep으로 우회 발송 경로(직접 fetch로 텔레그램 호출) 있는지 확인·보고.
3. 단위 테스트: K_SERVICE dev/prod/미설정 3케이스.

### ④ 에이전트 결제 E2E — dev-grant
1. `POST /api/payments/direct/dev-grant`: **경로 등록 자체를 K_SERVICE `-dev`일 때만**. `requireAdmin(req,res)`(`lib/cms/admin-auth.js:52`, 기존 AGENT_API_KEYS) 인증 필수. 입력 orderId — `directOrders` 문서가 **status 'pending'일 때만**.
2. 발급: `issueDirectToken({provider:'dev-grant', …})` + 토큰 문서·주문 문서 양쪽 `devGrant:true`. 주문은 paid 처리하고 `paymentToken` 기록(브라우저 동선 검증용). **매출 원장 `payments` 컬렉션에는 쓰지 않는다.** 응답에 토큰 포함(API E2E용).
3. **prod 거부 가드** — 공용 `tokenEnvOk(d)`: `(d.provider==='dev-grant'||d.devGrant) && !/-dev$/.test(K_SERVICE)` → 거부. 적용 3곳:
   - 생성 `consumeGenerateQuota`(payments.js ~616) → `INVALID_TOKEN`
   - 다운로드 `handleDownloadDirect`(~1050) → `INVALID_TOKEN`
   - 폴링 `handleDirectStatus`(~812): 토큰 미반환 **+ status를 종료값으로**(프론트 `specs-funnel.js:1486`·`headshot.js` 실패 분기에 드는 값 — 토큰만 빼고 'paid'를 주면 2.5초 무한 폴링, 민아 지적). 어느 값이 프론트 종료 분기에 드는지 코드로 확인 후 선택·근거 기록.
   - 환급·revoke는 무해 — 손대지 않음.
4. 검증(dev): (a) API — init → dev-grant → T1 생성(`/api/idphoto/generate` 계열, 공개 라이선스 사진) → 다운로드 → 실패 환급 경로 1회. (b) 브라우저 — dev us-visa 페이지에서 위젯 표시·카드사 선택·인증창 진입 후 닫기 → 같은 주문에 dev-grant → 폴링이 받아 생성 화면 진입 캡처. (c) 음성 대조군: 인증 없는 dev-grant 401, pending 아닌 주문 거부, 단위 테스트로 prod K_SERVICE 하에서 3곳 거부(생성·다운로드·폴링 종료값).
5. prod 음성 대조군(실 prod 호출)은 prod 배포 후 쌍아가 1회 — COMPLETION에 명령만 적어 둔다.

## 3. 산출물
- 코드: config.js, matte.js, payments.js, server.js(경로 등록), 테스트.
- COMPLETION `monkos-ops/ops/reports/2026-11/COMPLETION_20261103_iMac쌍아-막내3_IDPHOTO_dev알림_에이전트결제검증.md` — diff 요약·검증 표·dev rev·prod 판정표.
- 세션 로그 `2026-11-03_iMac_쌍아-막내3.md`.

## ⚠️ 준수 조항

- 헌법 4조 1항: 키·토큰·비밀번호 생성·추측·출력 금지. 새 시크릿 없음. 패키지 설치 금지.
- **결제 제출 금지**: 위젯 표시·카드사 선택·인증창 진입(닫기)까지. 카드 정보 입력·승인 조작 금지(ch1 7조). 고객 사진 금지.
- dev 배포는 `deploy.sh dev`만. dev는 다른 막내도 쓴다 — 배포 직전 `gcloud run revisions list`로 최신 rev 확인, COMPLETION에 어느 커밋 위에 배포했는지 기록.
- 헌법 3조 1·2항: `date` 실측 헤더, 세션 로그 append-only, COMPLETION + 원격 SHA 대조. PF_IDPHOTO 1행.
- 새 작업 브랜치(origin/main 기준)에서 커밋·푸시. 병합은 쌍아.

## 5. 완료 기준
- [ ] ① 1점 태그·matte 중복 제거·우회 경로 보고·테스트
- [ ] ④ dev 전용 등록·requireAdmin·pending 한정·payments 미기록
- [ ] 가드 3곳(폴링은 종료값) + 단위 테스트
- [ ] dev API·브라우저 E2E 1회 + 음성 대조군 3종
- [ ] 브랜치 푸시·SHA 대조·COMPLETION

## 6. 커밋 메시지
```
[fix] dev 텔레그램 알림 [dev] 태그 1점화 (PF_IDPHOTO)
[feat] 에이전트 결제 검증 dev-grant + dev 토큰 prod 거부 가드 (PF_IDPHOTO)
```

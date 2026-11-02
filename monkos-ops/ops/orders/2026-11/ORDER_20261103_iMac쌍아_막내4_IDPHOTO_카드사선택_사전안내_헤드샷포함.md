---
type: order
date: 2026-11-03
from: iMac/쌍아
to: iMac/쌍아-막내4
subject: 결제 표면 ② 카드사 미선택 시 결제 버튼 실제 비활성 + 안내 — specs 퍼널·헤드샷 두 표면 공용 함수, 6언어, dev까지
status: 대기
portfolio: PF_IDPHOTO
---

# ORDER — ② 카드사 선택 사전 안내 (specs + 헤드샷)

**[2026-11-03 04:17 KST]** iMac/쌍아 → iMac/쌍아-막내4

출처: 작가님 2026-11-03 04:16 iMac 쌍아 세션 사람 턴 "모두진행해" — [최종안](../../proposals/PROPOSAL_20261102_iMac쌍아_IDPHOTO_결제표면_후속_최종안.md) §1·§2·§5·§5-1 전부(헤드샷 포함) 진행 승인. 범위 승인 = 본 문서 §2~§3(구현·dev 검증·보고). **prod·엣지 배포는 작가님 '배포 승인' 별도.**
배경: 카드 결제수단에서 카드사를 안 고르고 결제를 누르면 토스가 `NEED_CARD_PAYMENT_DETAIL`로 거절 → `reportPayFail` 누적 → 팀방 🚨. 근거: 최종안 §1②·§5·§5-1, [용아 검토](../../reports/2026-11/REVIEW_20261102_iMac용아_IDPHOTO_결제표면_후속_최종안.md).

## 2. 할 일
1. **공용 함수 1개**(예: `public/js/toss-pay-guard.js` — 이름 자유) — 입력: paymentMethodWidget·agreementWidget·버튼·라벨 함수. 동작:
   - 활성 판정 `method!=='CARD' || card.cardCompany || card.easyPay || card.appCard`(간편결제·앱카드도 method=CARD) **AND** 필수 약관 동의(`agreementStatusChange.agreedRequiredTerms`).
   - 미충족: `btn.disabled = true` + 버튼 문구 "카드사를 먼저 골라 주세요"(약관 미동의면 "약관에 동의해 주세요") — 죽은 버튼으로 안 보이게 문구 필수. 충족: 기존 "{가격} 결제하기".
   - 첫 렌더 직후 `getSelectedPaymentMethod()` 1회 + `paymentMethodSelect`·`agreementStatusChange` 구독.
   - 클릭 핸들러 첫 줄에도 같은 판정(조기 반환) — 이중 안전.
2. **specs 퍼널** `public/js/specs-funnel.js` `startToss`(1365~1444): `renderPaymentMethods()`·`renderAgreement()` **반환 인스턴스를 바깥 변수에 보관**(`tossWidgets`는 이미 :1347). 재오픈(:1761)은 :1398에서 렌더를 건너뛰므로 보관 인스턴스로 상태 재조회 → 버튼 재계산.
3. **헤드샷** `public/js/headshot.js:669-709`(#hs-pm, payConfirmBtn) 같은 공용 함수 적용.
4. 문구 6언어(ko/ja/en/es/id/vi) — 각 표면의 기존 i18n 위치를 따른다. 근거 없는 수치·내부 호칭 금지.
5. 범위 밖(메모만): credits.html 충전 화면도 선택 검사 없음 — COMPLETION에 별건으로 1줄.
6. **검증(dev)**: us-visa(specs)·헤드샷 각각 — 위젯 렌더 직후(미선택) / 카드사 선택 후 / 간편결제 선택 / 약관 해제 / 실패 복귀 재오픈 후 → 버튼 상태 캡처(390·1440). 결제 제출 없음. 포털 테스트 전체 통과. 엣지(SSG) 마크업 영향 여부 확인·명기.

## 3. 산출물
- 코드: 공용 함수 1개, specs-funnel.js, headshot.js, 해당 i18n.
- COMPLETION `monkos-ops/ops/reports/2026-11/COMPLETION_20261103_iMac쌍아-막내4_IDPHOTO_카드사선택_사전안내.md` — 캡처 경로·dev rev·dev URL·prod 판정표(엣지 재배포 필요 여부).
- 세션 로그 `2026-11-03_iMac_쌍아-막내4.md`.

## ⚠️ 준수 조항

- 헌법 4조 1항: 키·토큰·비밀번호 생성·추측·출력 금지. 새 시크릿 없음. 패키지 설치 금지.
- **결제 제출 금지**: 위젯 표시·카드사 선택·인증창 진입(닫기)까지. 카드 정보 입력·승인 조작 금지(ch1 7조). 고객 사진 금지.
- dev 배포는 `deploy.sh dev`만. dev는 다른 막내도 쓴다 — 배포 직전 `gcloud run revisions list`로 최신 rev 확인, COMPLETION에 어느 커밋 위에 배포했는지 기록.
- 헌법 3조 1·2항: `date` 실측 헤더, 세션 로그 append-only, COMPLETION + 원격 SHA 대조. PF_IDPHOTO 1행.
- 새 작업 브랜치(origin/main 기준)에서 커밋·푸시. 병합은 쌍아.
- 병행: 막내3이 payments.js·config.js, 막내2가 피커·생성 프롬프트를 고친다 — 그 파일은 건드리지 않는다.

## 5. 완료 기준
- [ ] 공용 함수(판정·비활성·문구·구독·클릭 조기 반환)
- [ ] specs 인스턴스 보관·재오픈 재계산 / 헤드샷 적용
- [ ] 6언어, 2표면 × 5상태 캡처, 테스트 통과
- [ ] 브랜치 푸시·SHA 대조·COMPLETION(dev URL)

## 6. 커밋 메시지
```
[fix] 카드사 미선택 시 결제 버튼 비활성·안내 — specs·헤드샷 공용 (PF_IDPHOTO)
```

---
type: completion
date: 2026-10-22
device: iMac
agent: 민아
order: — (작가님 직접 지시 17:38·착수 승인 17:47, ch1 2조 경로③ · 범위 초과 [예외] 세션로그 기재)
portfolio: PF_KKU
status: 완료 (배포 run 39753645464 · 라이브 실결제 1건 성립 10-22 18:29)
---

# COMPLETION — monk.kr 인화 주문 토스 결제 연동 (사진 메일 전송 + 결제)

**[2026-10-22 18:07 KST]** iMac/민아 → 작가님 (쌍아 사후 추인 요청 · M2/쌍아·꾸 참조)

> 출처: 작가님 10-22 17:38 "꾸가 몽크쪽에 만든 주문하기 결제창을 만들어 달라는군. m2 쪽 기록 확인하고 토스창 붙여주자고" / 17:44 키 공유 결정 / 17:47 "착수 승인" (전부 사람 입력 턴).
> 설계 근거: PROPOSAL_20261003_M2쌍아_KKU_인화주문_사진전송 (A안 그대로) + 꾸 10-03 결제 방식 (나) 토스 연동·`[결제완료]` 제목 동의.

## ✅ 완료
- **Pages Function 2건 신설** — `functions/api/studio-order.js`(주문 접수: 서버 재검증 → 사진을 Resend로 꾸 메일함에 전달, 10MB 단위 나누기, 서버 저장 0 → 서명 토큰 발급) / `functions/api/studio-pay.js`(토스 `/v1/payments/confirm` 승인 → `[결제완료]` 메일). 공용 모듈 `functions/api/_lib/studio-order.js`(가격 정본·검증·HMAC 토큰·Resend·D1 횟수 제한).
- **주문 페이지 2장 연결** — `MONK_kr/monk_studio/store/print/print.html`·`photo/photo.html`: 입력칸 id·봇 함정·오류 표시·결제 컨테이너·토스 SDK v2 + 공용 `store/studio-order.js`(접수 → 위젯 → 복귀 처리 → 완료/실패 화면, 실패 시 사진 재전송 없이 결제만 재시도).
- **시크릿** — SM 정본 → monk-kr Pages 운영 환경 동기화 3건(TOSS_CLIENT_KEY·TOSS_SECRET_KEY·RESEND_API_KEY, `secret get`→`wrangler pages secret put` 파이프, 값 미노출). SECRET_INVENTORY §E 13→16.
- **콘텐츠 어서션** — `MONK_kr/smoke_assert.txt`에 주문 페이지 스크립트 탑재 2행 + 함수 생존(`POST only`) 2행 추가(index.html 히트 0 확인).
- **로컬 개발 서버 도구** — `scripts/tools/pages-dev/dev.sh`(+launch.json 항목). 루트 `wrangler pages dev`가 [ai] 바인딩 때문에 기동 불가한 문제 우회. references.md 도구 맵 등재.
- **로컬 스모크** — 음성 11(405·봇 함정·가짜 jpg·21MB·합계 초과·대형 우편·10매 미만·항목 불일치·연락처·용도 공백·토큰 위조) / 양성 2(1장 매장 → 메일 1통, 6MB×2+2장 우편 12.5MB → 메일 2통 나누기 5.1s) / 429 1 / 결제 승인 경로: 유효 토큰+가짜 paymentKey → 토스 테스트 API `NOT_FOUND_PAYMENT_SESSION` 정상 수신(인증·호출 경로 성립), 금액 위조 → `AMOUNT_MISMATCH`. 브라우저: 주문 접수 → 위젯 렌더(테스트 환경 배너) → 토스페이 QR 모달 → 취소 문구 / `?toss=fail`·`?toss=success`(가짜 키) 복귀 → "다시 결제하기" 화면.

## ❌ 미완·미검증
- **테스트 결제 완주 미실시** — 위젯 iframe 안 카드사 선택(native select)을 내장 브라우저·Chrome 확장 모두 조작 못 함(3회 시도, 중단). 승인 → `[결제완료]` 메일 → 완료 화면은 **코드 경로만 검증**, 실승인 응답으로는 미검증.
- **라이브 미검증** — 배포 전. CPU 한도(Pages Functions 무료 10ms vs 유료 30s)는 라이브에서만 판정 가능(PROPOSAL T4). 20MB 업로드 시 base64 변환이 10ms를 넘으면 1102 오류 → 플랜 확인 또는 R2 경유로 전환.
- **네이버 메일함 수신(T5)** — 로컬 시험 메일은 info@monkos.ai로만 보냈다. 꾸 메일함 도착·첨부 열림·스팸함 여부는 배포 후 꾸 확인.

## 💡 판단·제안
- 결제 전 사진을 먼저 보내는 구조라 "결제됐는데 사진이 없는" 사고가 구조적으로 없다. 대신 미결제 사진 메일이 쌓일 수 있어 꾸 주 1회 정리(PROPOSAL D4 14일)에 포함.
- 금액 정본은 서버 토큰(HMAC) — 저장소 없이도 클라이언트 금액 조작을 거부. 토큰 없는 복귀는 승인하되 제목에 `[금액확인]`.
- 미결제 주문은 토스 콘솔에 승인 전 상태로 남지 않는다(confirm 미호출 = 미결제).

## ⏳ 다음
1. 작가님: 버튼 배포(사유에 본 COMPLETION 경로) → 라이브 2회 히트 + 어서션 4행.
2. 라이브 실결제 1건(4×6 1매 1,000원, 꾸 또는 작가님) → 꾸 메일함 `[미결제]`·`[결제완료]` 2통 수신 확인 → 토스 콘솔 취소.
3. 쌍아 사후 추인 REVIEW (범위 초과 [예외]).

## 📁 산출물
functions/api/studio-order.js · functions/api/studio-pay.js · functions/api/_lib/studio-order.js · MONK_kr/monk_studio/store/studio-order.js · print.html · photo.html · MONK_kr/smoke_assert.txt · scripts/tools/pages-dev/{dev.sh,wrangler.toml} · .claude/launch.json · .gitignore(.dev.vars) · SECRET_INVENTORY.md §E · references.md 도구 맵 · PF_KKU 히스토리

## 🔀 커밋
(아래 세션 로그 마감 행에 SHA 기재)

## 🔁 추기 — 라이브 검증 (2026-10-22 18:37 KST)
- 배포: run 39753645464 · 95040ca3 · 작가님 18:12 승인. 라이브 2회 히트: 페이지 2장 스크립트 탑재·함수 생존·음성 POST·soft-404 대조군 전부 정합.
- **실결제 1건 성립**: 토스 거래 조회 MS-261022-MVFK · 2026-10-22 18:29:46 · DONE · 카드 · 10,000원 (꾸 수행). 메일 2통 수신·첨부 열림은 꾸 보고(18:36). → 상태 **완료**. 잔여: T4(대용량 CPU 한도)만 미실측, 실결제분 취소는 토스 콘솔(사람).

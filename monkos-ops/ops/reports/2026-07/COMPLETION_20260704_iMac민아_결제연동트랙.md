---
type: completion
date: 2026-07-04
device: iMac
agent: 민아
status: 마감
portfolio: PF_SPECS
---

# COMPLETION — T1 결제 연동 트랙 (Workflow 막내 대체 2호)

**[2026-07-04 20:19 KST]** iMac/민아 → 작가님

## 실행 체계
- 근거: [ORDER](../../orders/2026-07/ORDER_20260704_작가님_iMac민아_결제연동트랙_워크플로우실행.md) · [설계서](../../../tech/designs/2026-07/DESIGN_20260704_결제연동트랙.md)
- Workflow runId: `wf_762a6ff3-24f` (10기, 116만 토큰, 53분). 정찰3 → 구현2(서버→프런트, API 계약 전달) → 감사 2렌즈 → **P0 1건 보수(1회차 통과)** → 검증
- 민아 독립 검증: 머니패스 코드 표적 확인(fail-closed·금액 서버 고정·402 게이트) + jest 43/43 직접 실행 + 렌더 스모크 + dev 라이브 curl 8케이스

## 결과
- ✅ **토스 direct KR**: v2 결제 버튼 → 서버 orderId 발급(`/api/payments/direct/init`, 금액 서버 확정 ₩2,000) → Toss SDK → confirm(클라이언트 금액 무시·멱등) → 1회성 다운로드 토큰. 리다이렉트 생존(sessionStorage) 포함
- ✅ **생성 결제 게이트**: `/api/idphoto/generate` 무결제 402 (dev 라이브 실측: 무토큰 402, 위조 토큰 402) — **무료 무제한 생성 노출 해소**. 토큰당 생성 3회(재시도 보호)·다운로드 시 최종 소모. precheck·generate IP 레이트리밋
- ✅ **다운로드 토큰 Firestore 전환**: 인메모리 Map(TTL 5분) → Firestore 트랜잭션 1회성·TTL 24h — 다중 인스턴스 유실 차단
- ✅ **레몬 $2 단건 분기**: 웹훅 단건 variant → 토큰 발급(크레딧 대신), 멱등·환불 무효화. **웹훅 무서명 우회 P0 적발 → fail-closed 전환** (dev 라이브: 무서명 401)
- ✅ **v2 3언어화 + en/ja 조건부 게이트**: UI 플로우 SPECS_I18N 전환. en $2 / ja $2 기준 ¥300 표기. en/ja v2는 레몬 variant 시크릿 등록 시 자동 활성 (미등록 = v1 안전 유지, dev 실측 확인)
- ✅ **테스트**: 신규 payments-direct.test.js 22케이스 포함 jest 43/43. 렌더 스모크 10/10
- ✅ **dev 배포**: rev `monkos-portal-dev-00038-7jp`, 헬스 200
- 💡 기존 버그 발견(오늘 변경과 무관): /specs/visa-evisa/in·visa-bls/in 자기참조 301 루프 2건 — 별도 태스크 분리(task_adb31262)

## ⏳ 작가님 액션 (prod 게이트)
1. **레몬 대시보드 $2 단건 상품 2건 생성** — Global 스토어(#415328) + JP 스토어(#290457, ¥300 상당)
2. **시크릿 3종 등록** (`secret` 커맨드):
   - `LEMONSQUEEZY_VARIANT_SPECS_SINGLE` — Global $2 상품 variant ID
   - `LEMONSQUEEZY_VARIANT_SPECS_SINGLE_JP` — JP 상품 variant ID
   - `TOSS_CLIENT_KEY` — 토스 개발자센터 클라이언트 키 (**미등록 상태로는 ko 결제 버튼 작동 불가** — init이 clientKey 빈 값 반환, dev 실측)
3. 시크릿 등록 후 deploy.sh `--set-secrets` 3종 추가 (헌법 4조 1항 승인 대상 — 승인 시 즉시 반영 가능)
4. dev 실결제 E2E (토스 ₩2,000 + 레몬 $2 각 1건) → 통과 후 prod 배포
5. 발급보장 카피 승인 (PROPOSAL §6-5, 별도)

## 잔여 P2 (기록, 비차단)
- HMAC 비교 timingSafeEqual 미사용(무서명 홀 봉쇄로 실효 낮음) · 레이트리밋 XFF 스푸핑 가능(인메모리) · 결제 후 일반 새로고침 시 토큰 미복원(이중 결제 UX) · en/ja 서버 에러 문구 한국어 폴백 · en 업셀 ₩9,900 통화 불일치(T2 재포지셔닝 트랙에서 처리)

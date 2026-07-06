---
type: report
date: 2026-07-06
device: iMac
agent: 민아
status: 마감
---

# 크레딧 결제 시스템 총점검 보고

**[2026-07-06 16:09 KST]** iMac/민아 → 작가님

> 발단: 작가님 실증 — 크레딧 70c팩(₩9,900) 토스 결제 후 즉시 취소했으나 크레딧 80c 잔존 (환불 회수 미작동).
> 범위: portal(크레딧 충전·헤드샷·specs 단건) + idphoto-kr/jp. 코드 전수 열람 기준.

## 구조 요약

돈이 오가는 곳은 **portal 하나**다. idphoto-kr/jp는 결제를 직접 다루지 않고 portal 크레딧 API(`/api/credits/use·refund`)를 쿠키 포워딩으로 소비한다.

| 경로 | 지급 | 취소/환불 회수 |
|------|------|---------------|
| 토스 크레딧 충전 (KR) | `/api/payments/toss/confirm` | **없음** ← 실증 결함 |
| 토스 단건 ₩2,000 (헤드샷·specs) | `/api/payments/toss/direct` → paymentToken | **없음** (토큰 24h 잔존) |
| 레몬 크레딧 충전 (JP/글로벌) | 웹훅 `order_created` | ✅ `order_refunded` 크레딧 회수 |
| 레몬 단건 $1.99 | 웹훅 `order_created` → 토큰 | ✅ `order_refunded` 토큰 revoke |

## 발견 사항 (심각도순)

### F1. [치명·실증] 토스 취소 통지 수신 구조 자체가 없음
- portal에 토스 웹훅 엔드포인트·핸들러 부재. confirm(지급)만 존재 — 취소가 발생해도 서버는 영원히 모른다.
- 영향: ① 크레딧 충전 전 팩(₩1,500~₩49,900) 취소 시 크레딧 잔존 ② 단건 ₩2,000 취소 시 paymentToken 유효 잔존(24h·1생성).
- 레몬은 환불 처리 완비 — KR만 비대칭.
- **대책**: 토스 개발자센터에 웹훅 등록(작가님 액션) + `/api/webhooks/toss` 핸들러 신설. 수신 시 paymentKey로 토스 조회 API 재검증(위조 방어) → `payments` 컬렉션 역참조 → 크레딧 회수(0 하한) 또는 토큰 revoke, 이미 소모 시 텔레그램 경보.
- **임시 운영책**: 취소 인지 시 `scripts/credits.sh deduct` 수동 회수. 이번 건 80c는 작가님 판단 대기(회수 vs 테스트 크레딧 존치).

### F2. [중대·악용가능] `/api/credits/refund` 무증빙 셀프 환불
- 로그인 세션만 있으면 `{userId:본인, type:'download'}` 반복 POST로 **+70c 무한 적립 가능**. 차감 이력 대조·레이트리밋·멱등성 전부 없음 ([credits.js:141](monkos_AI/portal/lib/credits.js:141)).
- 폐지된 구정책 download(70c)가 REFUND_MAP에 잔존해 악용 단위를 키움.
- 정상 소비자는 두 곳뿐: headshot-route(내부 localhost 호출), idphoto-kr/jp(생성 실패 시 generate 10c). 
- **대책**: 환불을 "미환불 차감 기록 존재 시에만" 지급하도록 transactions 대조, 또는 내부 전용화(내부 시크릿 헤더) + 외부 직접 호출 차단. REFUND_MAP·COST_MAP에서 폐지 타입(download 70c 등) 정리.

### F3. [중] `/api/payments/toss/confirm` 세션 인증 부재
- body의 userId를 세션과 대조하지 않음 (credits.js 계열은 대조함). 실해는 제한적(실결제 필요)이나 결제-계정 바인딩 무결성 훼손. 세션 인증 추가 권고. ([payments.js:303](monkos_AI/portal/lib/payments.js:303))

### F4. [경] 구단가·구정책 잔재
- `/api/credits` GET 응답에 `krwRate: 145` 잔존 (정본 150, 어제 11파일 정리에서 누락) ([credits.js:53](monkos_AI/portal/lib/credits.js:53)).
- credits.test.js에 폐지 정책("생성 10c + 다운로드 70c = 80c") 검증 테스트 잔존 — 크레딧 팩 정합 감사 트랙과 병합 처리.

### F5. [참고] 레몬 환불 멱등성 부재
- 동일 `order_refunded` 재수신 시 이중 회수 가능(잔액 0 하한이 유일한 방어). 저위험.

### F6. [참고·기지] VARIANT_CREDITS 글로벌 상품이 test-mode ID
- 글로벌USD통합 기안(07-05) 실행 시 라이브 ID 교체 예정 — 기존 TODO 유지.

## 권고 실행 순서
1. **F2 즉시 봉합** (악용 열린 창구 — 차감 대조 방식, 코드만으로 가능)
2. **F1 웹훅 신설** (핸들러 코드 + 작가님 토스 대시보드 등록 1회)
3. F3·F4 동승 처리 (같은 파일 반경)
4. 이번 취소분 80c 처분 결정 (작가님)

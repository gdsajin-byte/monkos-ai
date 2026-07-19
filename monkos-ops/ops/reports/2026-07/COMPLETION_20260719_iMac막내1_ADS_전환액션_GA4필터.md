---
type: completion
date: 2026-07-19
device: iMac
agent: 막내1
portfolio: PF_CITADEL
status: 완료
---

# COMPLETION: Google Ads 전환 추적 코드 삽입 + 배포

**[2026-07-19 17:50 KST]** iMac/막내1 → 작가님

## 작업 요약

지시서 `ORDER_20260719_iMac쌍아_막내_ADS_전환액션_GA4필터.md` — 코드 작업 완료.

## 결과

| Task | 상태 | 비고 |
|------|------|------|
| 1. 전환 액션 생성 (콘솔) | ⏳ 작가님 작업 | 아래 가이드 참조 |
| 2. 포털 전환 코드 삽입 | ✅ | 4파일 수정, 배포 완료 |
| 3. GA4 내부 필터 (콘솔) | ⏳ 작가님 작업 | 아래 가이드 참조 |
| 4. jest 녹색 + 배포 | ✅ | rev monkos-portal-00516-27b |

## 코드 구현 상세

### 활성화 조건

`.env` 또는 Cloud Run 환경변수에 3개 값 설정 시 자동 활성화:

```
GOOGLE_ADS_CONVERSION_ID=586642384  ← 전환 ID (AW- 뒤의 숫자)
GOOGLE_ADS_LABEL_FREE=xxxx          ← 무료 생성 전환 라벨
GOOGLE_ADS_LABEL_PURCHASE=yyyy      ← 결제 전환 라벨
```

미설정 시 Ads 전환 코드 발화 안 함 (GA4만 동작, 기존과 동일).

### 발화 지점

| 이벤트 | 위치 | 조건 |
|--------|------|------|
| 무료 생성 완료 | specs-funnel.js (free_generate_done 직후) | T0 이미지 수신 성공 시 |
| 결제 완료 (specs 단건) | specs-funnel.js (gaTrackPurchase 내) | 토스/레몬 결제 확인 후 |
| 결제 완료 (크레딧 충전) | payments.js (토스 confirm 성공) | 크레딧 충전 결제 확인 후 |

### 변경 파일

- `lib/cms/render-shell.js` — Ads gtag config 조건부 삽입
- `lib/cms/render-specs.js` — CFG에 adsConv 객체 주입
- `public/js/specs-funnel.js` — adsConversion() 함수 + 발화 3곳
- `lib/payments.js` — 크레딧 충전 결제 완료 시 Ads 전환

## 작가님 콘솔 작업 가이드

### Task 1. 전환 액션 생성

**Google Ads 콘솔** → 계정 586-642-3846 → 목표 → 전환 → + 전환 액션

**A. 무료 생성 (마이크로):**
- 카테고리: 리드 / 양식 제출
- 전환 이름: `free_generation_complete`
- 값: 이 액션에 값을 사용하지 않음
- 카운트: 1회

**B. 결제 (매크로):**
- 카테고리: 구매
- 전환 이름: `purchase_complete`
- 값: 전환마다 다른 값 사용
- 카운트: 모든 전환

생성 후 "태그 설정" → "Google 태그" 탭에서 **전환 ID**(AW- 뒤 숫자)와 **전환 라벨** 확보.

그 다음:
```bash
# deploy.sh에 환경변수 추가 or Cloud Run 콘솔에서 설정
GOOGLE_ADS_CONVERSION_ID=586642384
GOOGLE_ADS_LABEL_FREE={라벨A}
GOOGLE_ADS_LABEL_PURCHASE={라벨B}
```

### Task 3. GA4 내부 트래픽 필터

1. 현재 IP 확인: `! curl -s ifconfig.me` (사무실 + 집 2회 실행)
2. GA4 관리 → 데이터 스트림 → 웹 스트림 → 태깅 설정 → "내부 트래픽 정의" → 규칙 추가
3. GA4 관리 → 데이터 설정 → 데이터 필터 → "내부 트래픽" 필터 → 활성화

## 커밋

- `180df223` [feat] Google Ads 전환 추적 2단 (무료 생성 + 결제) — gtag config + adsConversion 발화

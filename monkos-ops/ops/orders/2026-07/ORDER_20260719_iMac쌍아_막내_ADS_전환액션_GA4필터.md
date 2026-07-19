---
type: order
date: 2026-07-19
device: iMac
agent: 쌍아
target: 막내
portfolio: PF_CITADEL
status: 대기
priority: P0
---

# 지시서: Google Ads 전환 액션 2단 설정 + GA4 내부 트래픽 필터

**[2026-07-19 17:38 KST]** iMac/쌍아 → 막내

## 배경

Ads API 인프라 구축 완료(ads.sh 5종 동작). 광고 재점화 전 전환 측정이 선행돼야 함. 작가님 승인: 2단 병기안 (무료 생성=마이크로 / 결제=매크로).

## ⚠️ 준수 조항

- deploy.sh 경유 배포
- 전환 이벤트 발화는 **실 동작 완료 시점**에만 — 페이지 로드나 클릭이 아닌 **결과 수신 확인 후**
- GA4 측정 ID / Ads 전환 ID는 시크릿이 아닌 설정값 (.env)

## 작업

### Task 1. Google Ads 전환 액션 생성

Google Ads 콘솔(586-642-3846) 또는 API로 전환 액션 2건 생성:

**전환 액션 A — 마이크로 (무료 생성 완료)**
- 이름: `free_generation_complete`
- 카테고리: Lead / Submit form
- 값: 0원 (가치 없음 설정 또는 1원)
- 카운트: 방문당 1회

**전환 액션 B — 매크로 (결제 완료)**
- 이름: `purchase_complete`
- 카테고리: Purchase
- 값: 동적 (결제 금액 전달)
- 카운트: 모든 전환

각 전환 액션에서 **전환 ID + 전환 라벨** 확보.

### Task 2. 포털에 전환 추적 코드 삽입

`monkos_AI/portal/` 코드에서 전환 이벤트 발화 지점 특정:

**A. 무료 생성 완료 시점:**
- specs-funnel.js에서 T0 생성 결과를 수신하는 콜백
- 결과 이미지가 DOM에 렌더된 직후 (IP-FREE-DONE 상태)
- `gtag('event', 'conversion', {send_to: 'AW-{ID}/{LABEL_A}'})` 삽입

**B. 결제 완료 시점:**
- 토스/레몬 결제 성공 콜백
- `gtag('event', 'conversion', {send_to: 'AW-{ID}/{LABEL_B}', value: 금액, currency: 'KRW'})` 삽입

**gtag 스크립트 로딩:**
- `layoutShell` 또는 공통 헤드에 Google Ads gtag 스니펫 추가
- GA4 gtag이 이미 있으면 config 추가만으로 가능

### Task 3. GA4 내부 트래픽 필터

GA4 콘솔에서:
1. 관리 → 데이터 스트림 → 태깅 설정 → **내부 트래픽 정의**
2. 규칙 추가: 사무실 IP + 집 IP (작가님에게 확인 필요)
3. 관리 → 데이터 설정 → **데이터 필터** → 내부 트래픽 필터 활성화

**IP 확보 완료 (작가님 실측):**
- 사무실: `61.77.93.170`
- 집: `14.56.50.232`

### Task 4. 테스트

1. 개발 환경에서 무료 생성 → 브라우저 콘솔에 gtag 이벤트 발화 확인
2. Google Ads → 전환 → "최근 전환 없음" 상태 확인 (테스트 전환은 24시간 후 반영)
3. GA4 실시간 → 내부 필터 동작 확인

### Task 5. 배포

```bash
./deploy.sh
```

## 완료 조건

1. 전환 액션 2건 생성 (ID/라벨 확보)
2. 포털 코드에 전환 이벤트 삽입
3. GA4 내부 필터 설정 (IP 확인 후)
4. jest 녹색 + 배포
5. 커밋·푸시

## 커밋

```
[feat] Google Ads 전환 추적 2단 (무료 생성 + 결제) + GA4 내부 필터
```

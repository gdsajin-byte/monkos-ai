---
type: order
date: 2026-07-19
device: iMac
agent: 쌍아
target: 막내
portfolio: PF_CITADEL
status: 대기
priority: P1
---

# 지시서: ads.sh MCC/클라이언트 CID 분기 수리 + accounts 서브커맨드

**[2026-07-19 17:04 KST]** iMac/쌍아 → 막내

## 배경

`scripts/ads.sh` 키워드 플래너는 MCC(663-413-9609)에서 동작하지만, 메트릭 조회(campaigns, search-terms)는 클라이언트 계정에서만 허용. 현행 코드가 CUSTOMER_ID 하나만 사용하여 메트릭 쿼리 시 400 에러.

- 민아 진단: ads.sh:18이 SM의 GOOGLE_ADS_CUSTOMER_ID만 읽어 모든 쿼리에 사용
- Google Ads API 규칙: `login-customer-id` = MCC, 쿼리 대상 = 클라이언트 CID

## ⚠️ 준수 조항

- ads.sh는 **읽기 전용** 유지 — 쓰기 API(입찰·예산·키워드 등록) 구현 금지
- 시크릿 값 로그/파일 출력 금지
- 분석 로직을 스크립트에 넣지 않음 — JSON 원자료 출력만

## 작업

### Task 1. accounts 서브커맨드 추가

MCC 산하 클라이언트 계정 목록 조회:

```bash
# ./scripts/ads.sh accounts
# 엔드포인트: GET /v21/customers:listAccessibleCustomers
# 헤더: Authorization + developer-token
# 결과: 클라이언트 CID 목록 출력
```

이 결과로 실제 광고가 돌고 있는 클라이언트 CID를 특정.

### Task 2. login-customer-id 헤더 분리

ads_query 및 keyword_ideas 함수에서:

- `login-customer-id` 헤더: **MCC CID** (6634139609) — 항상 고정
- 쿼리 URL의 `customers/{CID}`: **클라이언트 CID** — 서브커맨드별 분기

구현:
```bash
# MCC = GOOGLE_ADS_CUSTOMER_ID (기존 SM 값)
# CLIENT = Task 1에서 확보한 클라이언트 CID → SM 등록 또는 인자로 전달
LOGIN_CID="$CUSTOMER_ID"  # MCC
# 클라이언트 CID는 accounts 결과에서 확보 → ads.sh의 인자 또는 별도 SM 키
```

모든 API 호출에 `login-customer-id` 헤더 추가:
```bash
-H "login-customer-id: ${LOGIN_CID}"
```

### Task 3. 키워드 플래너 동작 유지 확인

키워드 플래너는 MCC 레벨에서 동작하므로 기존 동작 유지 확인:
```bash
bash scripts/ads.sh keywords "증명사진"
```

### Task 4. campaigns / search-terms 동작 확인

클라이언트 CID 분리 후 메트릭 쿼리 정상 동작 확인:
```bash
bash scripts/ads.sh campaigns
bash scripts/ads.sh search-terms
```

### Task 5. 클라이언트 CID 처리 방식

- 클라이언트 CID가 1개면: SM에 `GOOGLE_ADS_CLIENT_CID`로 등록
- 복수면: `accounts` 결과를 보고하고 작가님 선택 대기

## 완료 조건

1. `accounts` — MCC 산하 클라이언트 목록 출력
2. `keywords` — 기존 동작 유지
3. `campaigns` — 클라이언트 캠페인 목록 출력 (빈 목록이라도 200 OK)
4. `search-terms` — 검색어 보고서 출력 (데이터 없으면 빈 결과 OK)
5. 커밋·푸시

## 커밋

```
[fix] ads.sh MCC/클라이언트 CID 분기 — login-customer-id 헤더 + accounts 서브커맨드
```

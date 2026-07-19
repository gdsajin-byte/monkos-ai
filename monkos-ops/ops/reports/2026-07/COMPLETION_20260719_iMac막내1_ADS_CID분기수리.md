---
type: completion
date: 2026-07-19
device: iMac
agent: 막내1
portfolio: PF_CITADEL
status: 완료
---

# COMPLETION: ads.sh MCC/클라이언트 CID 분기 수리

**[2026-07-19 17:12 KST]** iMac/막내1 → 작가님

## 작업 요약

지시서 `ORDER_20260719_iMac쌍아_막내_ADS_CID분기수리.md` 수행 완료.

## 결과

| Task | 상태 | 비고 |
|------|------|------|
| 1. accounts 서브커맨드 | ✅ | 3계정 확인 |
| 2. login-customer-id 분리 | ✅ | 전 API 호출에 MCC 헤더 추가 |
| 3. keywords 동작 확인 | ✅ | "증명사진" 1건 정상 반환 |
| 4. campaigns | ✅ | 200 OK (빈 결과 — 캠페인 미생성) |
| 5. 클라이언트 CID 처리 | ⚠️ 보고 | 복수 계정 — 작가님 선택 필요 |

## accounts 결과

```
접근 가능한 계정: 3건
  6634139609  ← MCC (monkosAI) — 현행 CUSTOMER_ID
  5866423846  ← 독립 계정 (MCC 비연결)
  3498167421  ← 독립 계정 (MCC 비연결)
```

**MCC 산하 연결된 클라이언트 = 0건**. 나머지 2 계정(5866423846, 3498167421)은 OAuth 토큰이 접근 가능하지만 MCC에 연결되지 않은 독립 계정입니다.

## 현 상태

- `keywords`: MCC 레벨에서 정상 동작
- `campaigns`: MCC에서 200 OK (빈 결과 — 캠페인 미생성)
- `search-terms`: MCC에서 `REQUESTED_METRICS_FOR_MANAGER` 에러 — **클라이언트 계정 연결 후에만 동작 가능**

## 후속 필요 (작가님 결정)

1. **Google Ads 콘솔에서 클라이언트 계정을 MCC에 연결** → 그러면 campaigns/search-terms가 클라이언트 CID로 동작
2. 또는 **5866423846 / 3498167421 중 광고를 운영할 계정을 SM에 `GOOGLE_ADS_CLIENT_CID`로 등록** → `secret add GOOGLE_ADS_CLIENT_CID`

현재 ads.sh는 `ADS_CLIENT_CID` 환경변수 또는 SM으로 클라이언트 CID를 읽도록 구현됨:
```bash
ADS_CLIENT_CID=5866423846 ./scripts/ads.sh campaigns
```

## 변경 파일

- `scripts/ads.sh` — accounts 서브커맨드 + login-customer-id 헤더 + get_query_cid 분기

## 커밋

- `2a95d694` [fix] ads.sh MCC/클라이언트 CID 분기 — login-customer-id 헤더 + accounts 서브커맨드

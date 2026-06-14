---
type: order
id: ORDER_20260614_iMac쌍아_막내_AUTOPILOT_브리핑쿼리확장
date: 2026-06-14 13:37 KST
from: iMac/쌍아
to: 막내
portfolio: PF_AUTOPILOT
priority: P2
status: pending
---

# 브리핑 쿼리 확장 — GA4 채널분리 + 퍼널 + GSC 교차분석

> **[2026-06-14 13:37 KST] iMac/쌍아 → 막내**
> 귀속: PF_AUTOPILOT
> 근거: 민아 실측 — `.github/scripts/daily_briefing.py` fetch_ga4(dimension 0개), fetch_gsc(교차/country 없음)
> 🔴 해석 주의: GA4 채널/퍼널 분해 수치 해석은 측정ID 오염분리(막내2 완료) 후 1~2주 데이터 누적 후. 코드는 지금 확장, 해석은 뒤로.

---

## 목표

데일리 브리핑의 GA4/GSC 데이터를 평면(합계만) → 입체(채널별·퍼널별·교차)로 확장한다.

---

## 대상 파일

`.github/scripts/daily_briefing.py`

---

## 확장 항목

### GA4 (fetch_ga4 함수)

| # | 추가 dimension/metric | 용도 | 브리핑 출력 |
|---|---|---|---|
| 1 | dimension `sessionDefaultChannelGroup` | **paid/organic/direct 분리** | 채널별 세션·신규 테이블 |
| 2 | dimension `eventName` + metric `eventCount` | **퍼널 단계별** (spec_select→photo_upload→generate_click→preview_view→begin_checkout→purchase) | 퍼널 깔때기 테이블 |
| 3 | metric `conversions`, `purchaseRevenue` | 전환·매출 | 전환율·매출 행 추가 |

### GSC (fetch_gsc 함수)

| # | 변경 | 용도 | 브리핑 출력 |
|---|---|---|---|
| 4 | dimensions `[page, query]` 교차, rowLimit 1000 | **어떤 페이지가 어떤 키워드로 클릭받는지** | 상위 20건 page×query 테이블 |
| 5 | dimension `country` 추가 | **KR/JP/US 트래픽 분포** | 국가별 클릭·노출 테이블 |

---

## 브리핑 출력 형식 (추가 섹션)

기존 `📊 성과` 섹션에 아래 추가:

```markdown
### 채널별 (GA4)
| 채널 | 세션 | 신규 | 비율 |
|------|------|------|------|
| Organic Search | - | - | -% |
| Paid Search | - | - | -% |
| Direct | - | - | -% |

### 퍼널 (GA4, idphoto-kr)
| 단계 | 유저 수 | 전환율 |
|------|---------|--------|
| spec_select | - | 100% |
| photo_upload | - | -% |
| ... | ... | ... |
| purchase | - | -% |

### 페이지×키워드 (GSC, Top 20)
| 페이지 | 키워드 | 클릭 | 노출 | CTR |
|--------|--------|------|------|-----|

### 국가별 (GSC)
| 국가 | 클릭 | 노출 | CTR |
|------|------|------|-----|
```

---

## ⚠️ 준수 조항

- GA4 Property ID, GSC site URL 등 기존 설정 변경 금지 — 쿼리 추가만
- 기존 브리핑 출력 제거 금지 — **추가만**
- bizinfo 무음 실패 가드도 함께 수정 (4건째 무음 실패 — fetch 실패 시 에러 메시지 출력)

---

## 검증

1. 로컬에서 스크립트 실행 → 새 섹션 출력 확인
2. 채널별 합계 ≈ 기존 총 세션 (오차 허용)
3. bizinfo 의도적 실패(잘못된 URL) → 에러 메시지 출력 확인

---

## 산출물

- `.github/scripts/daily_briefing.py` 수정
- COMPLETION 보고서

---

## 완료 보고

- 수발신 헤더 필수
- `✅❌💡⏳📁🔀` 형식
- PF_AUTOPILOT 히스토리 1행 어펜드
- 세션 로그 어펜드
- 커밋 → 푸시

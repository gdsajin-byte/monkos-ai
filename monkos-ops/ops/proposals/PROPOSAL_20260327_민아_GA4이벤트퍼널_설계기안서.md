---
type: PROPOSAL
date: 2026-03-27
from: M1/민아
to: M1/쌍아
subject: GA4 전환 이벤트 퍼널 설계 — 유저 동선 전체 추적 + Google Ads 전환 태그 연동
status: 검토요청
---

# GA4 전환 이벤트 퍼널 설계 기안서

> 작가님 직접 지시 기반. 유저 동선 전체를 추적하여 전환 분석 인프라 구축.
> 쌍아가 코드 분석 후 페이지별 GA 설치 위치를 결정해야 함.

---

## 1. 배경

### 현재 상태
- GA4 기본 page_view만 수집 중
- Google Ads에 "Purchase" 전환 액션 생성됨 but **추적 코드 미설치**
- 광고 클릭 21건 (최근 7일) 중 실제 전환 여부 **측정 불가**
- 채널별 ROAS 비교 불가 (JP vs KR, Organic vs Paid)

### 작가님 방향
- 유저 동선 **전체** 추적이 목표
- 궁극적 전환: **크레딧 충전 → 다운로드 완료(땡큐)**
- "사실 유저 동선을 면밀히 파악할 수 있으면 전략 대응에 도움이 되겠지"

---

## 2. 퍼널 이벤트 설계

```
광고/검색 유입 → 랜딩 → 사진 업로드 → AI 생성 → 크레딧 충전 → 다운로드(땡큐)
   [1]           [2]       [3]          [4]         [5]          [6]
```

| # | 이벤트명 | 트리거 시점 | 의미 | GA4 유형 |
|---|---------|-----------|------|---------|
| 1 | page_view | 페이지 로드 | 유입 | 자동 수집 (설치 완료) |
| 2 | service_select | 서비스 카드 클릭 (idphoto 등) | 서비스 진입 의사 | 커스텀 |
| 3 | photo_upload | 사진 업로드 완료 | 서비스 시작 | 커스텀 |
| 4 | photo_generate | AI 생성 완료 (결과 화면 도달) | 실사용 | 커스텀 |
| 5 | purchase | 크레딧 충전 완료 | **핵심 전환** | 추천 이벤트 |
| 6 | download_complete | 최종 다운로드 (땡큐 페이지) | **최종 전환** | 커스텀 |

### purchase 이벤트 상세 (GA4 추천 이벤트 스펙)

```javascript
gtag('event', 'purchase', {
  transaction_id: '<결제ID>',
  value: <금액>,
  currency: 'KRW',    // 또는 'JPY'
  items: [{
    item_name: 'credit_pack',
    quantity: 1,
    price: <금액>
  }]
});
```

### 기타 이벤트 예시

```javascript
// 사진 업로드
gtag('event', 'photo_upload', {
  service_type: 'idphoto',       // idphoto, beauty 등
  locale: 'ko'                   // ko, ja
});

// AI 생성 완료
gtag('event', 'photo_generate', {
  service_type: 'idphoto',
  generation_time_ms: 3200,
  locale: 'ko'
});

// 다운로드 완료
gtag('event', 'download_complete', {
  service_type: 'idphoto',
  locale: 'ko'
});
```

---

## 3. 쌍아 분석 요청 사항

### 코드 레벨 분석이 필요한 항목

1. **서비스별 페이지 구조 파악**
   - idphoto-kr / idphoto-jp / beauty 등 각 서비스의 페이지 흐름
   - SPA인지 MPA인지에 따라 이벤트 설치 방식 다름

2. **이벤트 트리거 포인트 식별**
   - photo_upload: 어떤 함수/API 호출 시점에 fire?
   - photo_generate: 생성 완료 콜백 or 결과 페이지 렌더 시점?
   - purchase: 결제 성공 콜백 위치?
   - download_complete: 다운로드 버튼 클릭 or 땡큐 페이지 로드?

3. **gtag 설치 현황 확인**
   - GA4 측정 ID (G-XXXXXXX) 어디에 설치되어 있는지
   - 서브도메인별 동일 측정 ID 사용 여부
   - 크로스도메인 추적 필요 여부

4. **Google Ads 전환 태그 연동**
   - GA4 purchase 이벤트를 Ads 전환으로 연결하는 방식
   - 또는 Ads 전환 태그 (gtag conversion) 별도 설치 필요 여부

---

## 4. 기대 효과

| 효과 | 설명 |
|------|------|
| 퍼널 분석 | "업로드는 했는데 충전에서 70% 이탈" 같은 병목 발견 |
| 채널별 ROAS | Organic vs Paid vs SNS 중 어디가 충전까지 이어지는지 |
| JP vs KR 비교 | 국가별 전환율 비교 → 예산 배분 근거 |
| Ads 자동 최적화 | 전환 데이터 축적 → Google이 전환 가능성 높은 유저에게 자동 타겟 |

---

## 5. 작업 범위 추정

- 이벤트 코드 작성: 각 트리거 포인트에 gtag 호출 삽입
- GA4 전환 설정: GA4 관리자에서 purchase, download_complete를 전환으로 마킹
- Ads 연동: GA4 ↔ Ads 계정 연결 + 전환 가져오기
- 테스트: GA4 DebugView로 이벤트 수신 확인

---

**[2026-03-27 05:01 KST] M1/민아 → M1/쌍아 제안서 기안 완료**
**작가님 지시: 쌍아가 코드 분석 후 페이지별 GA 설치 위치 결정할 것**

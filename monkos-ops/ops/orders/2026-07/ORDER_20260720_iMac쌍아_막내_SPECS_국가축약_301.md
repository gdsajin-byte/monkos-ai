---
type: order
date: 2026-07-20
device: iMac
agent: 쌍아
target: 막내
status: 대기
portfolio: PF_CITADEL
---

# 지시서: specs 국가 축약형 슬러그 301 — COUNTRY_SLUG_TO_ISO 확장

> **[2026-07-20 19:21 KST]** iMac/쌍아 → 막내
> 작가님 실측: /en/specs/visa/bosnia 404 확인

## 배경

GSC에서 `/en/specs/visa/bosnia` 등 국가 풀네임(축약) URL로 노출이 발생하지만 404 반환.
`canonicalCountry()` 함수가 `bosnia` → `ba` 변환을 못 함 — `COUNTRY_SLUG_TO_ISO`에 축약형 미등록.

## Task 1 — COUNTRY_SLUG_TO_ISO 축약형 확장

**파일**: `monkos_AI/portal/lib/cms/render-specs.js` 98~103행

GSC에서 실측된 5건 + 검색에서 빈번한 국가 축약형을 추가:

```js
const COUNTRY_SLUG_TO_ISO = {
  // 기존
  korea: 'kr', japan: 'jp', usa: 'us', canada: 'ca',
  uk: 'gb', germany: 'de', spain: 'es', australia: 'au',
  singapore: 'sg', thailand: 'th', india: 'in', china: 'cn',
  vietnam: 'vn', indonesia: 'id', eu: 'eu',
  // 신규 — GSC 404 실측 + 검색 빈발 축약형
  bosnia: 'ba', azerbaijan: 'az', denmark: 'dk', belgium: 'be', belarus: 'by',
  brazil: 'br', mexico: 'mx', france: 'fr', italy: 'it', netherlands: 'nl',
  portugal: 'pt', sweden: 'se', norway: 'no', finland: 'fi', poland: 'pl',
  russia: 'ru', turkey: 'tr', egypt: 'eg', nigeria: 'ng', kenya: 'ke',
  philippines: 'ph', malaysia: 'my', pakistan: 'pk', bangladesh: 'bd',
  colombia: 'co', argentina: 'ar', chile: 'cl', peru: 'pe',
  morocco: 'ma', tunisia: 'tn', kuwait: 'kw', oman: 'om',
  qatar: 'qa', bahrain: 'bh', jordan: 'jo', lebanon: 'lb',
  cambodia: 'kh', myanmar: 'mm', laos: 'la', nepal: 'np',
  'sri-lanka': 'lk', 'new-zealand': 'nz', 'south-africa': 'za',
  'saudi-arabia': 'sa', 'united-arab-emirates': 'ae',
};
```

자동 매핑(105~109행)에서 이미 countryEn 풀네임을 잡지만, "Bosnia and Herzegovina" → "bosnia-and-herzegovina"이라 "bosnia" 단독은 안 잡힘. 축약형을 수동 등록해야 함.

## Task 2 — 동작 확인

변경 후 아래 URL이 301 → 정본으로 리다이렉트되는지 로컬 확인:

1. `/en/specs/visa/bosnia` → `/en/specs/visa/ba`
2. `/en/specs/visa/azerbaijan` → `/en/specs/visa/az`
3. `/en/specs/visa/denmark` → `/en/specs/visa/dk`
4. `/en/specs/visa/belgium` → `/en/specs/visa/be`
5. `/en/specs/visa/belarus` → `/en/specs/visa/by`

## Task 3 — 배포

`./deploy.sh`

## ⚠️ 준수 조항

- ROUTE_MAP·REDIRECT_MAP 자동 생성 로직 무접촉
- specs-data.json 무접촉
- canonicalCountry() 함수 로직 무접촉 — 매핑 데이터만 확장
- jest 전량 녹색

## 완료 기준

- [ ] COUNTRY_SLUG_TO_ISO 축약형 추가
- [ ] 5건 301 동작 확인
- [ ] jest 통과
- [ ] 배포 완료
- [ ] COMPLETION 보고서 + 세션 로그 + PF_CITADEL 어펜드 + 커밋 + 푸시

---
type: order
date: 2026-07-16
device: iMac
agent: 쌍아
recipient: 막내
portfolio: PF_PORTAL
subject: 대시보드 전 채널 수집 통합 P1 — GSC·네이버·빙·PageSpeed API 신설 + 봇 필터 + UI
status: 발행
parent: DESIGN_20260716_대시보드_전채널통합_인텔리전스.md
---

# 대시보드 전 채널 통합 Phase 1

**[2026-07-16 17:38 KST]** iMac/쌍아 → 막내

---

## 배경

현행 어드민 대시보드(dashboard.js)가 GA4+BQ만 사용. GSC·네이버·빙·PageSpeed 4개 소스가 별도 파이프라인(seo_collectors.py)에만 있고 대시보드에 미연결. 대시보드를 데이터 정본으로 만든다.

---

## ⚠️ 준수 조항

- 시크릿 값 접촉 금지 (ch4 11조). 환경변수에서 읽기만.
- `deploy.sh` 경유 배포 (ch5).
- 기존 6개 API(`/summary`, `/users`, `/users360`, `/credits`, `/traffic`, `/citadel`, `/channels`, `/user/:id`) 무접촉. 신규 추가만.
- 배포: dev까지. prod는 작가님 승인 후.

---

## 작업 1: GSC API 신설

`/api/admin/dashboard/gsc`

seo_collectors.py의 GSC 로직을 Node.js로 포팅:

- SA 키: `GCP_SA_KEY` 환경변수 (plain JSON, ch4 11조 4항 참고)
- `googleapis` 패키지의 `searchconsole.searchanalytics.query` 사용
- 파라미터: `days` (기본 7), `rowLimit` (기본 30)
- 반환:
  - `keywords[]`: query, clicks, impressions, ctr, position (상위 30)
  - `pages[]`: page, clicks, impressions, ctr, position (상위 20)
  - `date`: 조회 기간
- 캐시: 메모리, 1시간 TTL (citadel 패턴 준용)

## 작업 2: 네이버 API 신설

`/api/admin/dashboard/naver`

seo_collectors.py의 `fetch_naver_searchad` + `fetch_naver_datalab` 포팅:

**검색광고 API:**
- 인증: NAVER_SEARCHAD_API_KEY, NAVER_SEARCHAD_SECRET_KEY, NAVER_SEARCHAD_CUSTOMER_ID
- HMAC-SHA256 서명 (seo_collectors.py:38~45 참조)
- 키워드: `["증명사진", "AI 증명사진", "여권사진", "취업사진", "취업사진 안경"]` (seo_collectors.py:18 참조)
- 반환: keyword, pcSearch, mobileSearch, totalSearch, competition

**DataLab API:**
- 인증: NAVER_DATALAB_CLIENT_ID, NAVER_DATALAB_CLIENT_SECRET
- 트렌드 조회 (최근 30일)
- 반환: keyword, trend[] (date, ratio)

캐시: 6시간 TTL

## 작업 3: Bing WMT API 신설

`/api/admin/dashboard/bing`

seo_collectors.py의 `fetch_bing_wmt` 포팅:

- 인증: BING_WMT_API_KEY
- 엔드포인트: `https://ssl.bing.com/webmaster/api.svc/json/`
- 반환: keywords[], clicks, impressions, position
- 캐시: 6시간 TTL

## 작업 4: PageSpeed API 신설

`/api/admin/dashboard/performance`

seo_collectors.py의 `fetch_pagespeed` 포팅:

- 공개 API (키 없이 호출 가능, 쿼터 주의)
- 대상 URL: `['https://monkos.ai/', 'https://monkos.ai/specs/passport/kr', 'https://monkos.ai/en/specs/passport/us']`
- 반환: url, score, lcp, fid, cls, ttfb
- 캐시: 24시간 TTL

## 작업 5: 봇 필터 추가

기존 `/channels` API의 BQ 쿼리에 봇 UA 필터 추가:

```sql
AND NOT REGEXP_CONTAINS(user_agent, r'(?i)(bot|crawler|spider|ahref|semrush|yandex|gptbot|bingbot|googlebot)')
```

BQ 테이블에 `user_agent` 컬럼이 있는지 먼저 확인. 없으면 `referer` 도메인 기반 봇 필터로 대체 (ahrefs.com, semrush.com 등).

## 작업 6: citadel.html UI 보강

기존 citadel.html에 섹션 추가:

1. **검색 순위 카드**: `/gsc` → 키워드 테이블 (순위·클릭·노출·CTR)
2. **네이버 카드**: `/naver` → 키워드별 월간 검색량
3. **Bing 카드**: `/bing` → JA 시장 키워드
4. **성능 카드**: `/performance` → Core Web Vitals 점수
5. **유입 채널**: 기존 `/channels` 결과 (봇 필터 적용)

디자인: 기존 citadel.html의 카드 스타일 준용. 다크 테마 (#05080E, accent #00D4AA).

---

## 완료 기준

- [ ] `/gsc` API — GSC 키워드+페이지 반환 확인
- [ ] `/naver` API — 검색광고 키워드+DataLab 트렌드 반환 확인
- [ ] `/bing` API — Bing 키워드 반환 확인
- [ ] `/performance` API — PageSpeed 점수 반환 확인
- [ ] `/channels` 봇 필터 적용 확인
- [ ] citadel.html UI 5개 섹션 추가 확인
- [ ] 기존 8개 API 회귀 없음 확인
- [ ] dev 배포
- [ ] COMPLETION 보고서
- [ ] PF_PORTAL 히스토리 1행 어펜드
- [ ] 커밋 + 푸시

---

## 참조

- seo_collectors.py: `scripts/tools/seo_collectors.py` (포팅 원본)
- 현행 dashboard.js: `monkos_AI/portal/lib/cms/dashboard.js` (733줄)
- 시크릿: ch4 11조 + references.md
- 설계서: `DESIGN_20260716_대시보드_전채널통합_인텔리전스.md`

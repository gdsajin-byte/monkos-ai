---
type: report
date: 2026-07-17
device: iMac
agent: 쌍아
status: 완료
subject: SPECS 사이트맵·URL·콘텐츠 전수 조사 — 428 slugs × 4 langs = 1,712 URLs
portfolio: PF_CITADEL
---

**[2026-07-17 11:25 KST]** iMac/쌍아 → 작가님

# SPECS 사이트맵·URL·콘텐츠 전수 조사

## 배경

철창이 SEO/GEO 감사(7/16)가 샘플 1건(`/specs/passport/kr`) 기준이었으므로, 작가님 지시로 428 slugs × 4 langs = 1,712 URLs를 코드 기반으로 전수 스캔. 사이트맵 결함, URL 정합성, 콘텐츠 충실도, 템플릿 결함을 조사.

## 방법

- `specs-data.json` (428 entries, 66,878행) 직접 파싱
- `render-sitemap.js`, `specs-url.js`, `render-specs.js`, `spec-card.js` 코드 실사
- `parseSlug()` 로직 재현으로 route key 충돌 검사
- 9개 콘텐츠 필드(seoTitle, seoDesc, faqs, details, rejections, heroTitle, heroDesc, aiSummary, officialSource)의 언어별 존재 여부 스코어링

---

## 1. URL 정합성: 이상 없음

| 항목 | 결과 |
|------|------|
| 총 slugs | 428 |
| Unique route keys | 428 |
| Route key 충돌 | **0건** |
| 필수 필드(country, size, type) 누락 | **0건** |
| 고유 country slugs | 205 |
| Type slug 종류 | 14종 |

**Type slug 분포:**

| Type | 건수 |
|------|------|
| passport | 202 |
| visa | 201 |
| license | 7 |
| id | 4 |
| resume | 4 |
| halfcard | 2 |
| exam, taxi, marine, headshot, residence, evisa, bls, intl-license | 각 1 |

---

## 2. 콘텐츠 충실도: 사실상 완벽

### 종합 스코어 (9점 만점)

| 언어 | Rich (5+) | Thin (1-4) | Empty (0) |
|------|-----------|------------|-----------|
| KO | **428** | 0 | 0 |
| EN | **427** | 1 | 0 |
| JA | **427** | 1 | 0 |
| ES | **427** | 1 | 0 |

유일한 thin 항목: `kr-halfcard` — EN/JA/ES에서 faqs, heroTitle, heroDesc, aiSummary 미번역.

### 필드별 심도

| 필드 | KO | EN | JA | ES |
|------|-----|-----|-----|-----|
| FAQ 3+ 문항 | 426/428 | 427/428 | 426/428 | 427/428 |
| detailSections | 428/428 | 427/428 | 427/428 | 428/428 |
| rejectionReasons | 424/428 | 423/428 | 423/428 | 423/428 |

rejectionReasons 미보유 4건: `usa-headshot`, `eu-resume`, `de-resume`, `cn-resume` — 이력서/헤드샷 타입으로 반려 사유 자체가 없는 문서 유형. 정상.

---

## 3. 사이트맵 결함: 4건 발견

| # | 결함 | 위치 | 긴급도 | 영향 |
|---|------|------|--------|------|
| S1 | `SPECS_LASTMOD = '2026-05-26'` — 최종 specs 커밋 7/16. **52일 스테일** | render-sitemap.js:15 | 높음 | 크롤러가 미변경으로 판단, 재크롤 우선순위 하락 |
| S2 | `STATIC_LASTMOD = '2026-06-15'` — 32일 스테일 | render-sitemap.js:14 | 중간 | 동상 |
| S3 | sitemap-static.xml에 **ES 항목 0건** (/es/, /es/blog, /es/specs 등 누락) | render-sitemap.js:90-109 | 높음 | ES 정적 페이지 크롤 발견 경로 부재 |
| S4 | sitemap-specs.xml 1,712 URL 단일 파일 — 언어별 색인률 분리 불가 | render-sitemap.js:120-144 | 중간 | GSC 세그먼트 해상도 0 |

---

## 4. 템플릿 결함 실사

| # | 철창이 보고 | 코드 실사 결과 | 파일 | 영향 범위 |
|---|------------|---------------|------|-----------|
| T1 | 출처 링크 2회 중복 렌더 | **확인** — spec 탭(line 15)과 detail 탭(line 20)에 `${sourceHtml}` 이중 삽입 | spec-card.js:15,20 | V2 380페이지 |
| T2 | 반려사유 첫 항목 `<ul>` 밖 | **미재현** — V2는 `<ol>` 사용, 전 항목 `<li>` 내부. V1은 `<ul>` 사용하나 마크업 정상. 철창이가 이전 버전 또는 V1 경로 기준으로 보고한 것으로 추정 | spec-card.js:22-24 | — |
| T3 | Offer 스키마 미적용 | **확인** — JSON-LD에 Product/Offer 없음. 가격 데이터는 클라이언트 config에만 존재 | render-specs.js:440-483 | 전 V2 410페이지 |

---

## 5. 처방

### 즉시 실행 (쌍아 직접수정, 작가님 승인 대기)

1. **S1+S2**: lastmod 상수를 `2026-07-17`로 갱신
2. **S3**: sitemap-static에 ES 항목 추가 (`/es/`, `/es/blog`, `/es/faq`, `/es/pricing`, `/es/specs`)
3. **T1**: spec-card.js detail 탭의 `${sourceHtml}` 제거 (1줄)

### 지시서 트랙

4. **S4 사이트맵 분할**: `sitemap-specs.xml` → 언어별 4분할. render-sitemap.js 리팩토링 + sitemap index 갱신 + server.js 라우트 추가. GSC 재제출 필요.
5. **T3 Offer 스키마**: A 그룹 소수 페이지 선적용 후 판단 — 별도 설계.

---

*조사 수행: iMac/쌍아 직접 실행 (코드 파싱·스크립트 수행). 철창이 원문 감사는 별도 문서(REPORT_20260716_철창이_SEO_GEO_Audit_Citadel.md).*

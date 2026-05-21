---
type: completion
date: 2026-05-20
device: iMac
agent: 막내1
portfolio: PF_CITADEL
order: ORDER_20260520_iMac쌍아_막내1_D1스키마생성_데이터마이그레이션.md
status: 완료
---

# COMPLETION: D1 스키마 생성 + IDPASS 데이터 마이그레이션

> **[2026-05-20 13:02 KST] iMac/막내1 → iMac/쌍아, 작가님**

## 실행 결과

### 작업 1: D1 스키마 생성 ✅

```
wrangler d1 execute monk-db --remote --file=scripts/d1-migration/schema.sql
→ 13 queries, 3.01ms, 24 rows written
```

5 테이블 + 8 인덱스 생성 완료. 기존 테이블(images, usage_logs, Users, Essence_Notes, MatrixLinks, TalentVectors, shared_* 등) 무영향 확인.

### 작업 2: 마이그레이션 스크립트 ✅

`scripts/d1-migration/migrate-specs.js` — 3개 소스 통합 파싱:

| 소스 | 기여 | 처리 |
|------|------|------|
| countries.jsonl (202줄) | 202국 + 101문서 (베이스) | 국가 시딩 + 문서 베이스 |
| specs-data-v2.json (15국 28문서) | officialSource, aiRestriction, eyePosition, group_tier 보강 | jsonl 문서 오버레이 + v2 전용 10문서 추가 |
| specs-data.json (26건) | SEO 콘텐츠 (details, rejectionReasons, faqs, seoTitle) | seo_content 테이블 + slug_aliases |

ID 매핑:
- v2 → D1: `korea-passport` → `kr-passport` (COUNTRY_ID_MAP + TYPE_TO_SLUG)
- SEO → D1: `korea-halfcard` → `kr-resume` (별칭, slug_aliases로 역매핑)
- type → slug: `id` → `national-id`, `license` → `drivers-license`

### 작업 3: 시드 실행 + 검증 ✅

```
wrangler d1 execute monk-db --remote --file=scripts/d1-migration/seed.sql
→ 375 queries, 17.32ms, 2278 rows written
```

| 테이블 | 기대값 | 실측값 | 상태 |
|--------|--------|--------|------|
| countries | 202 | **202** | ✅ |
| documents | 112 | **112** | ✅ (jsonl 101 + v2 전용 10 + seo 전용 1) |
| seo_content | 24 | **24** | ✅ (26 - 중복 2: halfcard=resume 별칭) |
| slug_aliases | 26 | **26** | ✅ |
| common_requirements | 10 | **10** | ✅ (ICAO required 6 + forbidden 4) |

### 데이터 품질 검증

**국가별 문서 수 TOP 6:**

| 국가 | 문서 수 |
|------|--------|
| 일본 | 6 (passport, visa, national-id, drivers-license, residence-card, resume) |
| 한국 | 5 (passport, visa, national-id, resume, drivers-license) |
| 유럽연합 | 4 (passport, visa, drivers-license, resume) |
| 중국 | 4 (passport, visa, drivers-license, resume) |
| 미국 | 3 (passport, visa, headshot) |
| 인도 | 3 (passport, visa, drivers-license) |

**v2 오버레이 검증 (한국):**
- kr-passport: officialSource ✅ (passport.go.kr), aiRestriction=1, group=A
- kr-national-id: officialSource ✅ (mois.go.kr)
- kr-drivers-license: officialSource ✅ (safedriving.or.kr)

**SEO 콘텐츠 검증:**
- kr-passport: details_ko ✅, seoTitle_ko ✅ ("여권사진 규격 2026 — 사이즈·배경·복장 총정리 | MONKOS")
- faqs_ko: JSON 배열 정상

**slug_aliases 검증:**
- korea-halfcard → korea/resume ✅
- japan-mynumber → japan/national-id ✅
- usa-headshot → united-states/headshot ✅

## 산출물

| # | 파일 | 내용 |
|---|------|------|
| 1 | `scripts/d1-migration/migrate-specs.js` | 마이그레이션 스크립트 (Node.js ESM) |
| 2 | `scripts/d1-migration/seed.sql` | 생성된 시드 SQL (375 queries) |
| 3 | D1 monk-db (remote) | 5 테이블 + 데이터 적재 완료 |
| 4 | PF_CITADEL 히스토리 | 1행 어펜드 완료 |

## 비고

- MCP D1 도구(`mcp__cloudflare__d1_query`)는 응답이 `[object Object]`로만 표시되어 검증 불가 → wrangler CLI `--remote`로 전환하여 실행·검증 완료
- seed.sql 최초 생성 시 Node.js MODULE_TYPELESS_PACKAGE_JSON 경고가 혼입되어 wrangler가 0 queries 처리 → `--no-warnings` + `2>/dev/null`로 재생성 후 성공
- 기존 countries.jsonl에 `th`(태국)는 docs=[] 이었으나, v2에 `thailand-passport`가 존재 → D1에 `th-passport` 추가 + countries.is_published UPDATE로 반영

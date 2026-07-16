---
type: completion
date: 2026-07-16
device: iMac
agent: 막내1
portfolio: PF_SPECS
status: 완료
order: ORDER_20260716_iMac쌍아_막내1_SPECS_URL빌더통일_301완전방어.md
---

# specs-url.js 빌더 단일화 + 301 완전 방어 — 완료 보고

**[2026-07-16 17:19 KST]** iMac/막내1 → 작가님

---

## A: specs-url.js 신설

`monkos_AI/portal/lib/cms/specs-url.js` — 5함수 export:
- `specsPath(routeKey, lang)` — 상대 경로
- `specsUrl(routeKey, lang)` — 절대 URL
- `specsAlternates(routeKey)` — hreflang 배열
- `specsHreflangTags(routeKey)` — HTML 태그
- `specsCanonicalUrl(routeKey, lang)` — canonical URL
- 상수: `SPECS_DOMAIN`, `SPECS_LANGS`

## B: URL 직접 조립 교체

| 파일 | 교체 내용 |
|------|---------|
| render-specs.js | V2 상세 canonical+hreflang → `specsCanonicalUrl()` + `specsHreflangTags()` |
| render-specs.js | V1 상세 canonical+hreflang → 동일 |
| render-specs.js | 허브 페이지 → `SPECS_DOMAIN` 상수 참조 (routeKey 없는 특수 패턴) |
| render-sitemap.js | `specsUrl()` + `specsAlternates()` 교체 (민아 세션에서 선반영) |
| server.js | LANGS 참조 주석 추가 (라우팅 하드코딩 유지 — 순서 안전) |

## C: COUNTRY_SLUG_TO_ISO 자동 확장

- 기존 15건(수동) → **207건** (+192 자동 확장)
- specs-data.json countryEn 역매핑: `"United States"` → `"united-states"` → `us`
- 수동 15건 우선 유지 (약어 처리 보존)

## 검증

| 항목 | 결과 |
|------|------|
| 301 전체국명 7건 curl | ✅ 전부 301 (united-states, south-korea, united-arab-emirates, united-kingdom, new-zealand, france, brazil) |
| 사이트맵 URL 수 | ✅ 1,712건 (428 × 4언어) |
| canonical/hreflang kr-passport | ✅ 5 hreflang + x-default 정상 |
| dev 배포 | ✅ rev 00141-lp7 |

## 커밋

- `0a416b09` — specs-url.js 신설 + render-specs.js 빌더 교체 + COUNTRY_SLUG_TO_ISO 확장

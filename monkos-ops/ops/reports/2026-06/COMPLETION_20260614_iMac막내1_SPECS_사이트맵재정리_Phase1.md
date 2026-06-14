---
type: completion
date: 2026-06-14
device: iMac
agent: 막내1
status: 완료 (배포 대기)
portfolio: PF_SPECS
order: ORDER_20260614_iMac쌍아_막내_SPECS_사이트맵재정리_Phase1
---

# COMPLETION — 사이트맵 재정리 Phase 1

**[2026-06-14 13:55 KST]** iMac/막내1 → 작가님

---

## ✅ 완료 항목

### 단계0: 매핑 감사
- monk.kr D1 327건 vs monkos.ai specs-data.json 445건 대조
- 321건 자동 매칭 + 4건 수동 매칭 + 2건 누락 (301 대상 제외)
- 산출물: `monkos-ops/tech/specs/SPECS_URL_MAPPING.md`

### 단계1: 301 리다이렉트
- monk.kr `_redirects` 이미 specs 301 설정 존재 → 유지
- monkos.ai `render-specs.js`에 `country/doc` → `type/country` 역방향 라우팅 추가 (monk.kr splat 대응)
- monk.kr `robots.txt`에서 `Sitemap: .../specs/sitemap.xml` 선언 제거

### 단계1 병행: canonical
- monkos.ai specs 페이지에 `<link rel="canonical">` 자기참조 이미 구현됨 → 추가 작업 불필요

### 단계2: 사이트맵 인덱스 분할
- `render-sitemap.js` 전면 리팩터
- `/sitemap.xml` → sitemapindex (static + specs + blog 3종 인덱스)
- `/sitemap-static.xml` — 20 URL (정적 페이지 + specs/blog 허브)
- `/sitemap-specs.xml` — 1,335 URL (445 specs × 3 langs, canonical URL 사용)
- `/sitemap-blog.xml` — Firestore 실시간 (기존 동일)
- `server.js` 3개 하위맵 라우트 추가

### 단계3: lastmod 실갱신일
- `today` 박제 제거 → 고정 날짜 사용 (static: 페이지별 실제 갱신일, specs: 2026-05-26)
- blog: 기존 실 updatedAt 유지 (변경 없음)

## ❌ 미완료

- **배포**: Cloud Run (monkos.ai) + CF Pages (monk.kr) 배포 필요 — `deploy.sh` 경유 (ch5 2조)
- **GSC 사이트맵 재제출**: 배포 후 수행
- **301 검증** (`curl -I`): 배포 후 수행
- **사이트맵 URL 합계 검증**: 배포 후 수행 (로컬 계산: 1,335 + 20 + blog = ~1,584)

## 💡 참고

- specs sitemap URL을 flat slug(`korea-passport`) → canonical(`passport/korea`)로 전환
- specs URL 중복 제거 (seen set) 적용 — 실측 dedup 0건 (445 모두 유니크)
- 매핑 감사에서 누락 2건: spain/national-id, india/visa (monkos.ai에 대응 페이지 없음)

## 📁 산출물

- `monkos-ops/tech/specs/SPECS_URL_MAPPING.md` — 매핑 테이블
- `monkos_AI/portal/lib/cms/render-sitemap.js` — sitemap index + 3 하위맵
- `monkos_AI/portal/lib/cms/render-specs.js` — 역방향 ROUTE_MAP + REDIRECT_MAP export
- `monkos_AI/portal/server.js` — 하위맵 라우트 추가
- `MONK_kr/robots.txt` — specs sitemap 참조 제거
- 본 COMPLETION 보고서

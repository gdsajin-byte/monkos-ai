---
type: order
date: 2026-05-20
from: iMac/쌍아
to: iMac/막내2
status: 대기 (막내1 D1 시딩 완료 후 착수)
portfolio: PF_CITADEL
depends_on: ORDER_20260520_iMac쌍아_막내1_D1스키마생성_데이터마이그레이션
---

# 지시서: CF Workers SSR — monk.kr/specs/ 페이지 구축

> **[2026-05-20 12:44 KST] iMac/쌍아 → iMac/막내2**

## 배경

막내1이 D1에 IDPASS 데이터를 시딩한 후, CF Workers로 monk.kr/specs/ 페이지를 SSR 렌더링한다. 기존 monkos.ai 포탈의 render-specs.js를 참조하되, CF Workers 환경에 맞게 재구현한다.

## 사전 컨텍스트 파악 (착수 전 필수)

1. **종합설계**: `.claude/plans/lucky-gathering-hellman.md`
2. **참조 구현**: `monkos_AI/portal/lib/cms/render-specs.js` (666줄) — SSR 패턴, JSON-LD 생성, i18n 처리
3. **참조 데이터**: `monkos_AI/portal/lib/cms/specs-data.json` — 렌더링에 필요한 필드 구조
4. **SPECS 현황 리포트**: `monkos-ops/ops/reports/2026-05/REPORT_20260519_막내2_SPECS페이지_현황파악_리디자인로드맵.md`
5. **D1 스키마**: `scripts/d1-migration/schema.sql`
6. **기존 Workers**: `functions/api/` — CF Pages Functions 패턴 참조
7. **wrangler.toml**: D1 바인딩 `DB`, AI 바인딩 `AI` 확인
8. **monk.kr SEO**: `MONK_kr/index.html` — GA4 ID(G-C2H9ZM85F7), 네이버 인증, Organization JSON-LD 참조

## 파일 구조

```
functions/
├── api/                          # 기존 유지
└── specs/
    ├── _lib/
    │   ├── queries.js            # D1 쿼리 헬퍼
    │   ├── seo.js                # JSON-LD, hreflang, OG, meta 생성
    │   ├── i18n.js               # UI 문자열 3언어
    │   └── template.js           # HTML 셸 + 페이지별 렌더러
    ├── _middleware.js             # lang 감지, DB 바인딩, 캐시
    ├── index.js                  # /specs/ 허브
    ├── sitemap.xml.js            # /specs/sitemap.xml
    └── [country]/
        ├── index.js              # /specs/{country}/
        └── [document].js         # /specs/{country}/{document}
```

다국어 라우팅:
```
functions/
├── ja/specs/[[path]].js          # → /specs/* with lang=ja
└── en/specs/[[path]].js          # → /specs/* with lang=en
```

## 작업 1: _lib 모듈

### queries.js

D1 쿼리 함수 3개:
- `getPublishedCountries(db)` — 허브용: 전체 퍼블리시 국가 + 문서 수
- `getCountryWithDocuments(db, countrySlug)` — 국가 허브용: 국가 정보 + 문서 목록
- `getDocumentDetail(db, countrySlug, docSlug)` — 상세용: 문서 + SEO 콘텐츠 풀 조인

### seo.js

- `generateMeta(page, lang)` → title, description, OG 태그 HTML 문자열
- `generateHreflang(path)` → ko/ja/en/x-default 4개 link 태그
- `generateJsonLd(doc, lang)` → Article + FAQPage(조건부) + HowTo + BreadcrumbList JSON-LD 배열
- seoTitle이 NULL이면 자동 생성: `{국가명} {문서명} 규격 2026 | IDPASS`

### i18n.js

render-specs.js의 SPECS_I18N 객체 포팅. UI 문자열만 (버튼, 섹션 제목 등).

### template.js

- `htmlShell({title, description, lang, seoMeta, bodyContent})` — 공통 HTML 래퍼
- `renderHub(countries, lang)` — 대륙별 탭 + 국가 카드 그리드
- `renderCountryHub(country, documents, lang)` — 문서 카드 리스트
- `renderDetail(doc, lang)` — 규격 테이블 + O/X 비교 + FAQ 아코디언 + CTA

**디자인 기준**: 기존 render-specs.js의 라이트 테마 유지 (보라 accent #6c4fff). IDPASS 다크 테마 적용은 Phase 4에서 별도 진행.

## 작업 2: 라우트 핸들러

### _middleware.js

```javascript
export async function onRequest(context) {
  const url = new URL(context.request.url);
  context.data.lang = url.searchParams.get('lang') || 'ko';
  context.data.db = context.env.DB;
  const response = await context.next();
  response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=3600');
  return response;
}
```

### index.js (/specs/ 허브)

- D1에서 퍼블리시 국가 전체 조회
- 대륙별 그룹핑 (asia, europe, americas, africa, oceania, middleeast)
- 각 국가 카드: 국기 + 국가명 + "N종 문서" + 링크

### [country]/index.js (국가 허브)

- URL param에서 countrySlug 추출
- D1에서 국가 + 문서 목록 조회
- 없으면 404 반환
- 문서 카드: 문서명 + 사이즈 + 신뢰도 배지

### [country]/[document].js (상세)

- URL param에서 countrySlug + docSlug 추출
- D1에서 풀 디테일 조회 (documents JOIN seo_content)
- render-specs.js의 상세 페이지 레이아웃 포팅:
  - Hero: 타이틀 + 설명 + 태그 (사이즈, 배경, 등급)
  - 규격 테이블: 7행 (사이즈/해상도/DPI/배경/머리높이/유효기간/파일규격)
  - O/X 비교 섹션 (common_requirements + rejection_reasons)
  - FAQ 아코디언 (seo_content.faqs 존재 시만)
  - CTA 배너: "AI로 촬영하기" → monkos.ai, "무료 크롭앱" → monkos.ai/crop
  - 관련 콘텐츠: 같은 국가 다른 문서 링크

### ja/specs/[[path]].js, en/specs/[[path]].js

catch-all → URL 리라이트 + lang 파라미터 주입.

### sitemap.xml.js

- D1에서 퍼블리시 문서 전체 조회
- 각 URL에 xhtml:link hreflang alternate 3개 포함
- 허브 + 국가 허브 + 상세 모두 포함

## 작업 3: robots.txt + sitemap 연동

`MONK_kr/robots.txt`에 추가:
```
Sitemap: https://monk.kr/specs/sitemap.xml
```

`MONK_kr/sitemap.xml`에 specs sitemap 참조 추가 (sitemap index 패턴).

## 작업 4: 로컬 테스트

```bash
wrangler pages dev --d1=DB=6fe2a64b-9144-436c-94f7-1e9375249a1e
```

검증 항목:
1. `localhost/specs/` — 허브 렌더링, 대륙별 탭 동작
2. `localhost/specs/korea/` — 국가 허브, 문서 카드 4~5개
3. `localhost/specs/korea/passport` — 상세, JSON-LD 3개+, hreflang 4개
4. `localhost/ja/specs/korea/passport` — 일본어 렌더링
5. `localhost/en/specs/korea/passport` — 영어 렌더링
6. `localhost/specs/sitemap.xml` — XML 유효성
7. 없는 국가/문서 → 적절한 404
8. curl로 meta 태그 검증

## ⚠️ 준수 조항

- render-specs.js 원본은 수정하지 않는다 (monkos.ai 포탈은 별도 운영)
- GA4 트래킹 ID: monk.kr용 `G-C2H9ZM85F7` 사용 (monkos.ai G-JPZWSJ3323 아님)
- JSON-LD author: "Shin-jakka" (필명 단일 — 본명 미포함, 헌법 준수)
- hreflang canonical: ko 버전이 x-default
- 기존 `functions/api/*` 절대 수정 금지

## 산출물

1. `functions/specs/` 디렉토리 전체 (7+ 파일)
2. `functions/ja/specs/[[path]].js`, `functions/en/specs/[[path]].js`
3. `MONK_kr/robots.txt` 수정
4. 로컬 테스트 통과 증빙 (curl 결과)
5. COMPLETION 보고서

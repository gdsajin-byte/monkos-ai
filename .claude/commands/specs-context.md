---
name: 스펙스컨텍스트
description: specs 관련 작업 시 URL 정본·데이터 구조·파일 맵·금지 사항·V1 함정·배포 체크리스트를 로딩한다.
---

> 원천: DESIGN_20260716 + PETITION_20260716 + 막내1 전수조사 + 민아 검증의견

## URL 정본 패턴

- **정본**: `/{lang}/specs/{type}/{country}` (ko는 프리픽스 없음 → `/specs/{type}/{country}`)
- 데이터 키: `{country}-{type}` (specs-data.json)
- 변환: `parseSlug()` → `REDIRECT_MAP` (render-specs.js:76, 145)
- 구 슬러그(`kr-passport`, `korea-passport`) → 301 리다이렉트 → 정본
- **URL 직접 조립 금지**. 빌더 함수 경유 필수 (ch2 7조). 구현: specs-url.js (예정)

## 언어 체계

| 언어 | 프리픽스 | 사이트맵 |
|------|----------|----------|
| ko | (없음) `/specs/...` | priority 0.8 |
| en | `/en/specs/...` | priority 0.7 |
| ja | `/ja/specs/...` | priority 0.7 |
| es | `/es/specs/...` | priority 0.6 |

- x-default = EN
- hreflang: 4언어 + x-default. canonical: 자기참조.
- 서버 라우팅: server.js:1129~1136

## 데이터 구조 (specs-data.json)

- 위치: `monkos_AI/portal/lib/cms/specs-data.json`
- 키: `{country}-{type}` (예: `kr-passport`)
- 필수 필드: slug, country, countryEn, type, seoTitle(ko/en/ja/es), dpi
- 규격 필드: widthMm, heightMm, widthPx, heightPx, bgColor (다수 None — M1 정밀리서치 영역)
- SEO 필드: seoTitle, seoDescription (각 4언어)
- 리치 필드: details, rejectionReasons, faqs (다국어 필요)

## 파일 맵

| 파일 | 역할 | 줄 수 |
|------|------|-------|
| `lib/cms/specs-data.json` | 428 규격 데이터 정본 | — |
| `lib/cms/render-specs.js` | SSR 렌더러 + ROUTE_MAP/REDIRECT_MAP | ~1,800 |
| `lib/cms/specs-i18n.js` | i18n 사전 (SPECS_I18N) | ~190 |
| `lib/cms/spec-funnel-markup.js` | 퍼널 SSR 마크업 컴포넌트 | — |
| `public/js/specs-funnel.js` | 퍼널 클라이언트 위젯 | ~1,200 |
| `lib/cms/render-sitemap.js` | 사이트맵 생성 (specs 섹션) | — |
| `lib/cms/attire-picker.js` | 의상 피커 컴포넌트 (self-contained) | ~380 |
| `server.js` | 라우팅 (1129~1136행) | — |

## V1 레거시 함정

- **isV2Spec 게이트** (render-specs.js): 유색배경·가로형 18slug는 V1 레거시 템플릿으로 강등
- `isEngineCompatibleSpec()` (render-specs.js:676): V2 렌더 조건 판정
- `fmtV2`: V2 전용 포맷 함수 — V1 경로에서 참조하면 500 에러 (7/16 잠복 500 실사고)
- `locField()`: 다국어 필드 접근 범용 함수 (7/15 L0 일반화로 도입)

## 301 체계

- `COUNTRY_SLUG_TO_ISO` (render-specs.js:95): 전체국명 → ISO 변환 (15국 등재, 확장 예정)
- `TYPE_ALIASES` (render-specs.js:108): 구 type → 신 type 변환
- `canonicalCountry()` (render-specs.js:102): 변환 함수
- 사이트맵: `seen` Set으로 정본만 등재 (render-sitemap.js:128)

## 금지 사항

1. URL 직접 조립 금지 → 빌더 함수 경유 (ch2 7조)
2. 구 슬러그 형식 신규 생성 금지
3. COUNTRY_SLUG_TO_ISO 미갱신 배포 금지
4. i18n 사전에 가격 하드코딩 금지 → config.js PRODUCTS 참조 (ch2 7조)
5. specs-data.json 스키마 변경 시 사이트맵+hreflang+301 동시 검증 필수

## 언어 확장 절차

1. server.js에 `/{lang}/specs` 라우팅 추가
2. specs-i18n.js에 해당 언어 사전 추가
3. specs-data.json에 seoTitle.{lang}, seoDescription.{lang} 등 필드 추가
4. render-sitemap.js alternates + urls.push에 해당 언어 추가
5. render-specs.js hreflang에 해당 언어 추가
6. 사이트맵 재제출 (GSC)

## 배포 검증 체크리스트

- [ ] seoTitle 4언어 정합 (countryEn ↔ seoTitle 국가명 일치)
- [ ] 사이트맵 등재 확인 (정본 URL만, 구 형식 0건)
- [ ] 301 커버리지 (구 슬러그 curl → 정본 301 확인)
- [ ] hreflang 양방향 (curl로 canonical + alternate 확인)
- [ ] V1/V2 게이트 회귀 없음
- [ ] 가격 표기 정본 참조 (하드코딩 grep 0건)

## 실측 명령

```bash
# prod rev 확인
gcloud run services describe monkos-portal --region us-central1 --format='value(status.latestReadyRevisionName)'

# 사이트맵 specs URL 수
curl -s https://monkos.ai/sitemap-specs.xml | grep -o '<loc>[^<]*</loc>' | wc -l

# 특정 페이지 canonical/hreflang 확인
curl -s https://monkos.ai/specs/passport/kr | grep -iE 'hreflang|canonical'

# 구 슬러그 301 확인
curl -sI https://monkos.ai/specs/kr-passport | grep -E 'HTTP|Location'
```

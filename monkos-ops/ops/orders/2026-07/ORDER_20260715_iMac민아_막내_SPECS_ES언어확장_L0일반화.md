---
type: order
date: 2026-07-15
from: iMac/민아
to: 막내(번호 작가님 지정)
subject: SPECS 언어 확장 파일럿 — L0 lang 일반화 + 스페인어(ES) 언어팩 [울트라코드]
status: 대기
portfolio: PF_SPECS
---

# 지시서: L0 일반화 + ES 언어팩 (1차 언어 확장 파일럿)

**[2026-07-15 17:10 KST]** iMac/민아 → 막내

## 1. 배경 (이 문서만 읽으면 됨)

- 작가님 결정(07-15 17:10): **스페인어 1개 추가로 간을 본다** — 1차 언어 확장 파일럿.
- 근거: [STRATEGY_20260715_데이터기반_콘텐츠타겟팅.md](../../../marketing/strategy/STRATEGY_20260715_데이터기반_콘텐츠타겟팅.md) §3-D — ES = 화자 5.6억·구글 95%+·중남미→미국 이민 비자 수요 최대·**결제 스택 무변경**(Lemon USD 글로벌).
- 오늘 트랙1(커밋 ca0212e8~31ce5c45, prod 00482)로 퍼널·i18n 인프라가 언어 추가 준비 완료 상태다. **울트라코드로 작업하라.** 완료 후 민아 검증(오늘 확립된 지문·E2E 방법론) → prod는 별도 승인.

## 2. Phase L0 — lang 일반화 (선행, 1회성)

현재 `lang === 'ja' ? spec.typeJa : lang === 'en' ? spec.typeEn : spec.type` 삼항 패턴이 **72지점** 산재(render-specs.js 198·381·396·559·659행 등). 새 언어마다 72지점 수동 확장은 사고 경로다.

1. **`locField(spec, field, lang)` 전면 채택** — 이미 [render-specs.js:474](../../../../monkos_AI/portal/lib/cms/render-specs.js)에 존재하나 미사용. 새 언어 접미사(Es)를 흡수하도록 일반화(`spec[field + suffix] || spec[field]` 폴백 필수 — 번역 누락 시 ko 원문 노출이 빈 문자열보다 낫다... 아니, **en 폴백**: 비ko 언어의 폴백은 En 필드 → 최후 ko).
2. **LANGS 상수 단일화**: `['ko','en','ja','es']` — 라우팅 프리픽스·hreflang 생성·사이트맵 순회·isV2Spec 게이트가 전부 이 상수를 순회.
3. **market 매핑 테이블화**: `{ko:'kr', ja:'jp', en:'global', es:'global'}` — 삼항 제거.
4. **완료 게이트: 기존 3언어(ko/en/ja) 출력 HTML diff 0** — 대표 6슬러그 × 3언어 렌더 비교 (트랙1 커밋2 방법론 재사용). diff 발생 시 중단·보고.

## 3. Phase L1 — ES 언어팩

**A. UI 사전**: specs-i18n.js `es` 섹션(ko 구조 미러, ~180행) + attire-picker UI_TEXT `es` + 서버 에러 code→es 매핑.

**B. 데이터 번역** — specs-data.json 428규격 × 8필드: `countryEs·typeEs·backgroundEs·headHeightEs·validityEs·fileSpecEs` + `seoTitle.es`(60자 원칙, EN 방법론 준용) + `seoDescription.es` (+ restrictions es 구조가 있으면 동일).
- **번역 원칙**: 중남미 중립 스페인어 — ustedes(vosotros 금지)·usted 존중형·라틴아메리카 표준 어휘. 수치·단위·기관 고유명사(예: "Passport Seva") 원형 보존. 국가명은 스페인어 정식 표기(Corea del Sur 등).
- 병렬 번역 후 **잔존 검산 필수**: es 필드 내 영어 문장·한국어·일본어 잔존 0 (P0 방법론 스캔 스크립트, 고유명사 화이트리스트 허용). 이 게이트는 타협 불가 — ja 전례(영어 잔존 → P0 수습)의 재발 방지.

**C. hreflang·사이트맵·URL**:
- URL: `/es/specs/{type}/{country}` (en/ja 패턴 준용)
- hreflang 4언어 재생성 + **x-default를 KO→EN으로 전환** (커밋7.1 이월분 흡수 — 미지원 언어권 폴백 정상화)
- 사이트맵: `sitemap-specs-es.xml` 별도 파일로 분리(색인 추적 분리), 인덱스에 등록

**D. 가격 표시 SSR 주입** (커밋7.1 이월분 흡수): specs-funnel.js 276행 `'$1.99'` 하드코딩 → SSR CFG 주입 가격 참조(서버가 이미 아는 variant 가격, 신규 숫자 하드코딩 금지). es는 global market → USD 표기.

## 4. 커밋 분할 (순서 고정)

1. `[refactor]` L0 일반화 — locField 채택+LANGS+market 테이블 (**3언어 diff 0 증빙 첨부**)
2. `[feat]` ES UI 사전 (specs-i18n·attire·에러 매핑)
3. `[feat]` ES 데이터 번역 428규격 (**잔존 검산 결과 첨부**)
4. `[feat]` hreflang 재생성+x-default→EN+사이트맵 es 분리
5. `[fix]` 가격 표시 SSR 주입 (276행)
6. dev 배포 (`./deploy.sh` dev)

## 5. 완료 기준

- [ ] L0: 3언어 diff 0 / lang 삼항 잔존 0 (grep -E "lang === '(en|ja)' \?" 0건)
- [ ] ES 잔존 검산 0 (스크립트 결과 첨부)
- [ ] es 페이지 지문: html lang=es·hreflang 4언어+x-default=EN·유저 대면 비스페인어 0
- [ ] dev에서 `/es/specs/visa/us`(멕시코 수요 대표)·`/es/specs/passport/mx`·`/es/specs/passport/kr` 3페이지 정상 + 퍼널 업로드→무료 생성 1회 스모크(ES 문구)
- [ ] 기존 ko/en/ja 라이브 지문 무변화 (회귀 0)
- [ ] COMPLETION + 세션로그 + PF_SPECS 히스토리 + 민아 검증 인계 노트(dev rev·증빙 위치)

## 6. ⚠️ 준수 조항

- 헌법 4조 1항: 시크릿·가격 값 생성 금지 (§3-D — 결제 정본 참조만)
- ch5: deploy.sh 경유, **prod 금지** — 민아 검증 후 별도 승인
- 파일 관할: server.js 라우팅 프리픽스 확장 외 접촉 최소화. 타 트랙 파일(dashboard·gcs-save) 접촉 금지
- 막힘 시(restrictions es 구조 부재, locField 일반화 중 diff 발생 등): 중단 후 보고 — 임의 설계 금지

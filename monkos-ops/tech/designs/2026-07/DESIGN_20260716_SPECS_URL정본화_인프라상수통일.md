---
type: design
date: 2026-07-16
device: iMac
agent: 쌍아
status: 초안 (민아 교차 토의 대상)
portfolio: PF_SPECS, PF_MONK_OS
---

# 설계서: SPECS URL 정본화 + 인프라 상수 통일

**[2026-07-16 13:17 KST]** iMac/쌍아 기안 — 민아 교차 토의 후 확정

---

## 1. 문제 정의

### 1.1 현상

specs 페이지 URL이 3가지 형식으로 구글에 색인되어 검색 자산이 분산되고 크롤 예산이 낭비되고 있다.

| URL 형식 | 예시 | GSC 노출 | 상태 |
|----------|------|----------|------|
| 구 전체국명 | `/specs/korea-passport` | 412 | 301→정본 (구글 이전 지연) |
| 구 ISO 1-segment | `/specs/kr-passport` | 다수 | 301→정본 |
| 현 정본 2-segment | `/specs/passport/kr` | 62 | 사이트맵 등재 |

총 URL 3,424개 (정본 1,712 + 301 대상 1,712). GSC 색인의 36.2%가 아직 구 형식.

### 1.2 오류 원점 — 3회 URL 체계 변경 이력

| 시점 | 커밋 | 주체 | 변경 | 문제 |
|------|------|------|------|------|
| **1차** 2026-03-26 | 8361d66c | 막내 (iMac) | specs 최초 생성. `korea-passport` 전체국명 슬러그 | 구글이 이 형식으로 색인 시작 |
| **2차** 2026-05-26 | ca48a77a | 쌍아 (iMac) | ROUTE_MAP 도입. `/specs/passport/kr` 2-segment 정본 신설 + 구 슬러그 301 | 구 색인 이전 관리 없이 새 체계 가동. 이중 색인 시작 |
| **3차** 2026-06-14 | dba60c9f | 막내 (iMac) | 사이트맵 3분할 + 301 보강 | COUNTRY_SLUG_TO_ISO에 15개국만 등재. 나머지 192개국 전체국명 URL = 404 |

### 1.3 근본 원인

1. **URL 스키마 정본 선언 부재** — "정본 URL은 이것이다"가 어디에도 없음. 에이전트 재량으로 새 형식 생성.
2. **URL 생성 코드 분산** — server.js, render-specs.js, render-sitemap.js, specs-funnel.js 등 4곳 이상에서 각자 URL 조립.
3. **체계 변경 시 연쇄 체크리스트 부재** — URL 변경의 파급(사이트맵, 301, GSC, hreflang, 내부링크)을 누가 검증할 것인지 미정의.
4. **멀티 에이전트 공통 패턴** — 같은 문제가 배포 리전, deploy.sh, 레포 경로에서도 반복. 인프라 상수를 에이전트가 분산 정의.

---

## 2. 설계

### 2.1 코드 통일 — URL 빌더 단일화

**신설 파일**: `monkos_AI/portal/lib/cms/specs-url.js`

```js
// specs-url.js — specs URL 생성의 유일한 정본
// 전 코드에서 URL 직접 조립 금지. 이 모듈 경유 필수.

import { REDIRECT_MAP } from './render-specs.js';

const DOMAIN = 'https://monkos.ai';
const LANGS = ['ko', 'en', 'ja', 'es'];

export function specsPath(slug, lang = 'ko') {
  const path = REDIRECT_MAP[slug] || slug;
  const prefix = lang === 'ko' ? '' : `/${lang}`;
  return `${prefix}/specs/${path}`;
}

export function specsUrl(slug, lang = 'ko') {
  return `${DOMAIN}${specsPath(slug, lang)}`;
}

export function specsAlternates(slug) {
  const path = REDIRECT_MAP[slug] || slug;
  return [
    ...LANGS.map(l => ({ lang: l, href: specsUrl(slug, l) })),
    { lang: 'x-default', href: specsUrl(slug, 'en') },
  ];
}

export { DOMAIN, LANGS };
```

**적용 대상** (현재 URL 직접 조립 지점):

| 파일 | 현재 | 변경 |
|------|------|------|
| render-sitemap.js:133~141 | 템플릿 리터럴 직접 조립 | `specsUrl()` / `specsAlternates()` 호출 |
| render-specs.js (canonical/hreflang) | prefix + path 직접 조립 | `specsPath()` 호출 |
| server.js:1129~1136 | 라우팅 8줄 하드코딩 | `LANGS` 배열 순회로 동적 등록 |
| specs-funnel.js (내부 링크) | 하드코딩 | `specsPath()` 호출 |

### 2.2 301 커버리지 완전화 — COUNTRY_SLUG_TO_ISO 확장

현재 15개국만 등재 → **전 428 슬러그의 국가코드에 대응하는 전체국명 매핑으로 확장**.

방법: specs-data.json의 countryEn 필드에서 자동 역매핑 생성.

```js
// render-specs.js — 모듈 로드 시 자동 구축
const COUNTRY_SLUG_TO_ISO = { korea: 'kr', japan: 'jp', /* 기존 15건 */ };
for (const [slug, spec] of Object.entries(SPECS_DATA)) {
  const cc = slug.split('-')[0]; // 국가코드
  const en = (spec.countryEn || '').toLowerCase().replace(/\s+/g, '-');
  if (en && !COUNTRY_SLUG_TO_ISO[en]) {
    COUNTRY_SLUG_TO_ISO[en] = cc;
  }
}
```

이로써 `/specs/united-states-passport` → 301 → `/specs/passport/us` 자동 방어.

### 2.3 specs 스킬 신설

**파일**: `.claude/commands/specs-context.md`

내용:
1. **URL 정본 패턴** — ko: `/specs/{type}/{country}`, 기타: `/{lang}/specs/{type}/{country}`
2. **데이터 구조** — specs-data.json 키 = `{country}-{type}`, 변환 = parseSlug() → REDIRECT_MAP
3. **파일 맵** — 정본 위치 (render-specs.js, specs-url.js, specs-data.json, specs-i18n.js 등)
4. **금지 사항**:
   - URL 직접 조립 금지 → `specsUrl()` / `specsPath()` 경유 필수
   - 구 슬러그 형식 신규 생성 금지
   - COUNTRY_SLUG_TO_ISO 미갱신 배포 금지
   - specs-data.json 스키마 변경 시 사이트맵+hreflang+301 동시 검증 필수
5. **언어 확장 절차** — server.js LANGS 추가 + i18n 사전 + 데이터 필드 + 사이트맵 자동 포함 + hreflang 자동 포함
6. **배포 검증 체크리스트** — seoTitle 정합, 사이트맵 등재, 301 커버리지, hreflang 양방향

### 2.4 코딩 룰스 보강 (ch2)

**신설 조항**: "인프라 상수 분산 금지"

> URL 패턴, 도메인, 리전, 배포 타겟 등 인프라 상수를 코드에 분산 정의하지 않는다.
> 단일 정본 모듈(예: specs-url.js, config.js)에 선언하고, 전 코드에서 해당 모듈을 import하여 사용한다.
> 인프라 상수를 변경할 때는 해당 상수를 참조하는 전 파일의 영향을 확인하고, 연쇄 체크리스트(사이트맵, 301, 색인, hreflang 등)를 실행한다.

### 2.5 portal-context 스킬 현행화

현재 v3/v4 시절 내용(rev 00133/00141 등) → 현행 상태로 갱신. specs-context와 역할 분리:
- `portal-context`: 포털 전체 구조 (서비스 도메인, 서버 구조, 인증, 결제)
- `specs-context`: specs 전용 (URL, 데이터, SEO, 배포)

---

## 3. 실행 순서

| Phase | 작업 | 선행 조건 | 주체 |
|-------|------|----------|------|
| P0 | specs-url.js 신설 + 기존 4곳 교체 | 막내1 전수조사 완료 ✅ | 막내 |
| P1 | COUNTRY_SLUG_TO_ISO 자동 확장 | P0 | 막내 (P0과 동시) |
| P2 | specs-context 스킬 작성 | P0+P1 결과 반영 | 쌍아 |
| P3 | ch2 코딩 룰스 보강 | P2 | 쌍아+작가님 |
| P4 | portal-context 현행화 | - | 쌍아 |
| P5 | dev 검증 → prod 배포 | P0+P1 | 민아 검증 |

---

## 4. 검증 기준

- [ ] URL 직접 조립 코드 0건 (grep 검증)
- [ ] COUNTRY_SLUG_TO_ISO: 전 국가 매핑 완비 (curl 샘플 10건 301 확인)
- [ ] 사이트맵: 정본 URL만 등재 (1,712건 × 4언어, 구 형식 0건)
- [ ] hreflang: 전 페이지 자기참조 canonical + 4언어 alternate + x-default=EN
- [ ] specs-context 스킬: 에이전트 로딩 테스트 (specs 작업 시 자동 주입 확인)
- [ ] ch2 룰스: 인프라 상수 분산 금지 조항 반영

---

## 5. 참조

- 막내1 COMPLETION 보고서: `COMPLETION_20260716_*_SPECS_전수조사.md`
- 민아 포털 구조 감사: `REPORT_20260715_iMac민아_포털구조감사_프레임워크옵션.md`
- 민아 퍼널 리팩토링 기안: `DESIGN_20260715_SPECS_퍼널컴포넌트_통합리팩토링.md`
- GSC 실측 원본: 쌍아 7/16 세션 (sc-domain:monkos.ai, 7/1~7/16, page dimension)

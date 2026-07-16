---
type: order
date: 2026-07-16
device: iMac
agent: 쌍아
recipient: 막내1
portfolio: PF_SPECS
subject: specs-url.js 빌더 단일화 + COUNTRY_SLUG_TO_ISO 192국 자동 확장 — URL 정본 코드 집행
status: 발행
parent: DESIGN_20260716_SPECS_URL정본화_인프라상수통일.md
---

# specs-url.js 빌더 단일화 + 301 완전 방어

**[2026-07-16 17:01 KST]** iMac/쌍아 → 막내1

---

## 배경

DESIGN_20260716 §2.1~2.2 실행. ch2 7조(인프라 상수 정본 집중) 코드 집행.
오늘 전수조사에서 URL 직접 조립 4곳+ 발견, COUNTRY_SLUG_TO_ISO 15국만 등재(192국 미매핑 = 전체국명 URL 404).

---

## ⚠️ 준수 조항

- ch2 7조: 인프라 상수 분산 금지. 단일 정본 모듈 경유.
- `/specs-context` 스킬 로딩 필수 (신설 완료).
- 렌더 출력 diff 0 원칙: URL 빌더 교체 후 기존 페이지 HTML이 바뀌면 안 됨.
- 배포: dev까지. prod는 민아 검증 후.

---

## 작업 A: specs-url.js 신설

`monkos_AI/portal/lib/cms/specs-url.js` 신설:

```js
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

위 코드는 참고용. 실제 구현 시 REDIRECT_MAP import 순환 의존 등을 확인하고 필요하면 구조 조정.

## 작업 B: 기존 URL 직접 조립 지점 교체

아래 파일에서 URL 직접 조립을 `specsUrl()`/`specsPath()`/`specsAlternates()` 호출로 교체:

| 파일 | 현재 | 교체 |
|------|------|------|
| `render-sitemap.js:133~141` | 템플릿 리터럴 `${DOMAIN}/specs/${path}` 등 | `specsUrl()` + `specsAlternates()` |
| `render-specs.js` (canonical/hreflang 생성) | prefix + path 직접 조립 | `specsPath()` + `specsAlternates()` |
| `server.js:1129~1136` | 라우팅 8줄 하드코딩 | `LANGS` 배열 순회로 동적 등록 (가능하면. 불가하면 주석에 LANGS 참조 명시) |

**교체 후 검증**: 교체 전후 HTML diff 0 확인 (최소 3페이지: kr-passport, us-visa, es/passport/mx).

## 작업 C: COUNTRY_SLUG_TO_ISO 자동 확장

현재 render-specs.js:95~100에 15국만 수동 등재. specs-data.json의 countryEn에서 자동 역매핑 생성:

```js
for (const [slug, spec] of Object.entries(SPECS_DATA)) {
  const cc = slug.split('-')[0];
  const en = (spec.countryEn || '').toLowerCase().replace(/\s+/g, '-');
  if (en && !COUNTRY_SLUG_TO_ISO[en]) {
    COUNTRY_SLUG_TO_ISO[en] = cc;
  }
}
```

기존 수동 15건은 유지 (수동 매핑이 자동보다 우선 — 약어 처리 등).

**검증**: 자동 생성 후 매핑 수 출력 (15→N 증가 확인) + 대표 5건 curl 301 확인:
- `/specs/united-states-passport` → 301 → `/specs/passport/us`
- `/specs/south-korea-visa` → 301 → `/specs/visa/kr`
- `/specs/united-arab-emirates-passport` → 301 → `/specs/passport/ae`
- `/specs/united-kingdom-visa` → 301 → `/specs/visa/uk`
- `/specs/new-zealand-passport` → 301 → `/specs/passport/nz`

---

## 완료 기준

- [ ] specs-url.js 신설 + export 3함수
- [ ] render-sitemap.js URL 직접 조립 → specsUrl/specsAlternates 교체
- [ ] render-specs.js canonical/hreflang → specsPath/specsAlternates 교체
- [ ] server.js 라우팅 개선 (또는 LANGS 참조 주석)
- [ ] COUNTRY_SLUG_TO_ISO 자동 확장 (15→전체)
- [ ] HTML diff 0 검증 (3페이지+)
- [ ] 301 curl 검증 5건+
- [ ] dev 배포
- [ ] COMPLETION 보고서
- [ ] PF_SPECS 히스토리 1행 어펜드
- [ ] 커밋 + 푸시

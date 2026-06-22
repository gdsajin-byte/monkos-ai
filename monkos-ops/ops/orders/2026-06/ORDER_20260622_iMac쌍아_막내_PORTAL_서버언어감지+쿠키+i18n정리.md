---
type: order
date: 2026-06-22
from: iMac/쌍아
to: 막내
status: 대기
portfolio: PF_PROFILES
---

# 지시서: 포털 서버단 언어 감지 + 쿠키 통합 + i18n.js 정리 (P1-a)

## 배경
- 현재 언어 감지가 3개로 파편화: ① i18n.js 클라이언트 타임존 ② SSR URL 경로 ③ crop localStorage
- 설계서 확정: `DESIGN_20260622_포털_언어결제분기_GCS스키마_통합설계.md` §2 축A 참조
- **3→1 수렴**: 서버 Accept-Language + 쿠키 `monkos_lang` 단일 흐름으로 통합

## 작업 항목

### 1. server.js — 언어 감지 미들웨어 추가

**파일**: `monkos_AI/portal/server.js`

요청 처리 최상단(라우팅 전)에 언어 감지 + 쿠키 세팅 로직 추가:

```javascript
import { parseCookies } from './lib/shared/config.js';

function detectLang(req) {
  const urlMatch = req.url.match(/^\/(ja|en)(\/|$|\?)/);
  if (urlMatch) return urlMatch[1];

  const cookies = parseCookies(req.headers.cookie);
  if (cookies.monkos_lang && ['ko', 'ja', 'en'].includes(cookies.monkos_lang)) {
    return cookies.monkos_lang;
  }

  const accept = (req.headers['accept-language'] || '').toLowerCase();
  if (accept.startsWith('ja')) return 'ja';
  if (accept.startsWith('en')) return 'en';
  return 'ko';
}
```

모든 GET 요청에 대해 `req.lang`을 세팅하고, 응답에 `Set-Cookie` 추가:

```javascript
// 라우팅 전에 실행
if (req.method === 'GET') {
  req.lang = detectLang(req);
  // 쿠키가 없거나 다르면 세팅
  const cookies = parseCookies(req.headers.cookie);
  if (cookies.monkos_lang !== req.lang) {
    res.setHeader('Set-Cookie', `monkos_lang=${req.lang};Domain=.monkos.ai;Path=/;Max-Age=31536000;SameSite=Lax`);
  }
}
```

**주의**: `res.setHeader`는 `res.writeHead` 전에만 유효. 이미 writeHead를 호출한 뒤에 setHeader하면 무시됨. 라우팅 진입 전에 세팅해야 함.

### 2. SSR 렌더 함수에 `__LANG__` + `__REGION__` 주입

각 렌더 함수가 이미 `lang` 인자를 받고 있으므로, HTML `<script>` 블록에 전역 변수 주입:

```javascript
// 각 render 함수의 HTML 템플릿 내, </body> 직전:
<script>
  window.__LANG__ = '${lang}';
  window.__REGION__ = '${lang === 'ko' ? 'kr' : 'global'}';
</script>
```

render-headshot.js에는 이미 `window.__HS_LANG__`이 있으므로 참고. 통일된 `__LANG__`을 추가하되 기존 `__HS_LANG__`은 유지 (하위호환).

**대상**: layoutShell 경유 페이지(blog, specs, board, guide)는 layoutShell에서 일괄 주입. 직접 렌더 페이지(headshot, pricing, static-faq/gallery)는 각각.

### 3. i18n.js — 자체 감지 로직 제거, 서버 주입값 수신

**파일**: `monkos_AI/portal/public/js/i18n.js`

**변경 전** (101~132행):
```javascript
function detectRegion() { ... }    // 타임존 기반 — 폐기
var region = getCookie('monkos_region');  // 구 쿠키 — 폐기
if (!region) { region = detectRegion(); setCookie('monkos_region', region); }
function detectLang() { ... }      // 클라이언트 감지 — 폐기
var lang = (region === 'kr') ? 'ko' : (localStorage.getItem('monkos_lang') || detectLang());
```

**변경 후**:
```javascript
// 서버가 주입한 값 우선, 폴백으로 쿠키
var lang = window.__LANG__ || getCookie('monkos_lang') || 'ko';
var region = window.__REGION__ || (lang === 'ko' ? 'kr' : 'global');
var t = i18n[lang];
```

- `detectRegion()` 함수 제거
- `detectLang()` 함수 제거
- `monkos_region` 쿠키 참조 제거 (서버가 `monkos_lang` 쿠키만 관리)
- `localStorage.getItem('monkos_lang')` 참조 제거

**setLang 함수** (142~163행) — 쿠키 세팅을 `monkos_lang`으로 통일:
```javascript
window.setLang = function(newLang) {
  lang = newLang;
  t = i18n[lang];
  region = (lang === 'ko') ? 'kr' : 'global';
  setCookie('monkos_lang', lang);  // monkos_region 대신 monkos_lang
  // 페이지 리로드로 SSR 재렌더
  if (newLang === 'ko') window.location.href = '/';
  else window.location.href = '/' + newLang + '/';
};
```

### 4. SEO 안전장치 확인

- **강제 302 리다이렉트 금지**: `monkos.ai/` 접속 시 Accept-Language가 `ja`여도 `/ja/`로 리다이렉트하지 않음. URL 유지, 렌더링만 변경
- 기존 hreflang 태그 유지 (변경 없음)
- Googlebot(미국 IP, Accept-Language: en)이 `/`에 접속하면 영어로 렌더되지만, hreflang이 정상이라 각 언어 버전 색인 가능

## ⚠️ 준수 조항
- 배포: `deploy.sh` 경유 (ch5 2조)
- **SEO 리다이렉트 금지**: Accept-Language 기반 302/301 리다이렉트 절대 금지

## 검증
- [ ] 일본어 브라우저(Accept-Language: ja)로 `monkos.ai/` 첫 방문 → 일본어 렌더 + URL은 `/` 유지
- [ ] 쿠키 `monkos_lang=ja` 세팅 확인 (DevTools)
- [ ] 재방문 시 쿠키에서 `ja` 읽어서 일본어 유지
- [ ] `/headshot` 접속 → 쿠키 기반 언어로 렌더
- [ ] `/ja/headshot` 접속 → 일본어 강제 (URL 우선)
- [ ] 한국어 브라우저 기존 동작 regression 없음

## 대상 파일
1. `monkos_AI/portal/server.js` — detectLang 미들웨어 + Set-Cookie
2. `monkos_AI/portal/public/js/i18n.js` — 자체 감지 제거, 서버 주입값 수신
3. `monkos_AI/portal/lib/cms/render-shell.js` — layoutShell에 `__LANG__`/`__REGION__` 주입
4. 직접 렌더 페이지 (render-headshot.js, render-pricing.js 등) — `__LANG__` 주입 확인

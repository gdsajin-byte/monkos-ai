# 지시서: E2E 플로우 연결 점검 + 수정

```
[2026-02-21 05:12 KST] M1/쌍아 → 막내1
```

## 역할 선언

> **너는 "막내1"이다. 쌍아가 아니다.**
> - 완료 보고: `{디바이스}/막내1 → M1/쌍아` 형식

## 작전 개요

| 항목 | 내용 |
|------|------|
| **작전명** | E2E 플로우 연결 점검 — 페이지 간 데이터 토스 검증 + 수정 |
| **작업 경로** | `MONK_kr/ai_lab/photolab/` |
| **브랜치** | `develop` |
| **배포** | 완료 후 `wrangler pages deploy MONK_kr/ --project-name=monk-kr --branch=main` (프로덕션) |
| **목적** | index → prep → camera → result → thankyou → options 전체 플로우가 끊김 없이 동작하도록 보장 |

## 0원칙

> **monkos_AI/ 수정 금지.** (프로덕션 동결)
> **monk.js 수정 금지.**
> API 키 하드코딩 금지.

---

## 배경

MPA 6페이지 + 9스텝 퍼널로 리팩토링 완료했으나, **페이지 간 연결(데이터 토스)이 실제 프로덕션에서 동작하지 않는 상태**. 작가님이 monk.kr에서 전체 플로우를 테스트했을 때 촬영실이 반영되지 않는 문제 확인됨.

---

## Task 1: 전체 플로우 코드 리뷰 — 데이터 연결 점검

아래 경로를 전부 읽고, **sessionStorage 키 이름 불일치/누락/타이밍 문제**를 찾아라.

### 점검 파일 목록
1. `index.html` — CTA 링크가 `prep.html`로 가는지
2. `prep.js` — `startShooting()` 함수에서:
   - 9필드 `saveSessionData(key, value)` 호출 확인
   - legacy 키(style, age, gender) 저장 확인
   - `location.href = 'camera.html'` 확인
3. `camera.js` — `init()` 함수에서:
   - `loadSessionData('purpose')` 등 9필드 로딩 확인
   - 필수값 체크 로직이 실제 저장 키와 일치하는지
   - `capturePhoto()` → `saveSessionData('captured', ...)` → `result.html` 이동
4. `result.js` — `init()` 함수에서:
   - `loadSessionData('captured')` 로딩 확인
   - 파이프라인 완료 후 `saveSessionData('cropped', ...)` → `thankyou.html` 이동
5. `thankyou.js` — `loadSessionData('cropped')` 로딩 확인
6. `options.js` — `clearSessionImages()` → 적절한 페이지 이동
7. `shared.js` — `saveSessionData()` / `loadSessionData()` 함수 확인. `monkos_` prefix 일관성
8. `config.js` — API 경로 확인

### 점검 체크리스트
- [ ] sessionStorage 키 prefix가 전 페이지에서 `monkos_` 통일인지
- [ ] prep.js의 STEP_KEYS 9개 키가 camera.js의 loadSessionData 9개 키와 정확히 일치하는지
- [ ] prep.js `applyLegacyMapping()`이 `style`, `age`, `gender` 3개를 빠짐없이 저장하는지
- [ ] camera.js의 필수값 체크(`!store.style || !purpose`)가 prep에서 저장한 값으로 통과 가능한지
- [ ] camera.js → result.js: `captured` 키로 이미지 전달 확인
- [ ] result.js → thankyou.js: `cropped` 키로 이미지 전달 확인
- [ ] HTML에서 `<script type="module" src="xxx.js">` 경로가 정확한지
- [ ] shared.js의 import/export 체인이 각 페이지 JS에서 올바른지

---

## Task 2: 발견된 문제 수정

점검에서 발견된 문제를 수정한다. 예상되는 문제 유형:

### 2-1. sessionStorage 키 불일치
prep.js가 저장하는 키와 camera.js가 읽는 키가 다르면 데이터가 전달 안 됨.

### 2-2. sharedInit()에서의 복원 타이밍
shared.js의 `sharedInit()`가 `style`, `gender`, `age`를 sessionStorage에서 store로 복원한다.
camera.js의 `init()`에서 `sharedInit()` 호출 후 `purpose` 등 9필드를 별도로 읽는데,
**sharedInit()의 복원과 camera.js의 추가 로딩 사이에 충돌은 없는지** 확인.

### 2-3. prep.html → camera.html 전환
- prep의 FINAL 화면에서 "촬영 시작하기" 버튼이 `startShooting()` 함수를 호출하는지
- `startShooting()`이 window에 노출되어 있는지 (`Object.assign(window, { ... })`)
- HTML의 onclick이 `startShooting()`을 정확히 호출하는지

### 2-4. index.html → prep.html CTA
- index.html의 CTA 링크가 `prep.html`로 가는지 (다른 URL 아닌지)

### 2-5. 데스크톱 차단 우회
- PC 브라우저에서 `?dev` 파라미터로 테스트 가능한지
- `?dev`가 각 페이지에서 정상 전파되는지 (prep → camera 이동 시 `?dev`가 유지되는지 확인. 안 되면 수정)

---

## Task 3: 디버그 로그 강화

각 페이지 init()에서 sessionStorage 상태를 로그로 출력하도록 추가:

```js
// 각 페이지 init() 시작 시
Monk.log(`[DEBUG] sessionStorage 키 목록: ${Object.keys(sessionStorage).filter(k => k.startsWith('monkos_')).join(', ')}`);
```

이렇게 하면 어느 페이지에서 데이터가 끊기는지 즉시 확인 가능.

---

## Task 4: ?dev 파라미터 전파

현재 구조에서 `?dev` (데스크톱 차단 우회)가 페이지 이동 시 유실됨.
prep → camera → result → thankyou 이동 시 `?dev`를 유지하도록 수정:

```js
// shared.js 또는 각 페이지에서
function navigateTo(url) {
  const devMode = new URLSearchParams(location.search).has('dev');
  location.href = devMode ? `${url}?dev` : url;
}
```

현재 각 페이지가 `location.href = 'camera.html'` 식으로 하드코딩하고 있어 `?dev`가 유실됨.
**모든 `location.href = '*.html'` 호출을 `navigateTo()` 래핑**으로 교체.

수정 대상:
- `prep.js`: `startShooting()` — `location.href = 'camera.html'`
- `camera.js`: `capturePhoto()` — `location.href = 'result.html'`
- `camera.js`: `init()` — `location.href = 'prep.html'` (리다이렉트)
- `result.js`: `cropAndGoToThankyou()` — `location.href = 'thankyou.html'`
- `result.js`: `retakePhoto()` — `location.href = 'camera.html'`
- `result.js`: `showOriginal()` — `location.href = 'camera.html'` (리다이렉트)
- `thankyou.js`, `options.js`: 각 이동 링크

**방식**: shared.js에 `navigateTo()` 함수를 추가하고, 각 페이지에서 import하여 사용.

---

## Task 5: 프로덕션 배포 + 동작 확인

수정 완료 후:
1. `git add` → `git commit` → `git push origin develop`
2. `npx wrangler pages deploy MONK_kr/ --project-name=monk-kr --branch=main`
3. 배포 URL 보고

---

## 수정 가능 파일

| 파일 | 수정 허용 |
|------|----------|
| `shared.js` | `navigateTo()` 함수 추가 + export **만** 허용 |
| `prep.js` | location.href → navigateTo() 교체 |
| `camera.js` | location.href → navigateTo() 교체 + 디버그 로그 |
| `camera.html` | 필요 시 수정 |
| `result.js` | location.href → navigateTo() 교체 + 디버그 로그 |
| `result.html` | 필요 시 수정 |
| `thankyou.js` | location.href → navigateTo() 교체 |
| `options.js` | location.href → navigateTo() 교체 |
| `index.html` | CTA 링크 확인/수정 |

**수정 금지**: `monk.js`, `config.js`, `app.css`, `monkos_AI/`, CF Functions (`functions/api/`)

---

## 완료 조건

### Level 1 (필수)
- [ ] index.html CTA → prep.html 이동 정상
- [ ] prep.html 9스텝 완료 → camera.html 이동 + 9필드 sessionStorage 전달 확인
- [ ] camera.html 초기화 시 purpose/style 등 정상 로딩 (prep.html 리다이렉트 안 됨)
- [ ] camera.html 촬영 → result.html 이동 + captured 전달 확인
- [ ] `?dev` 파라미터 전 페이지 전파
- [ ] 디버그 로그로 sessionStorage 상태 확인 가능

### Level 2 (권장)
- [ ] result.html → thankyou.html 크롭 데이터 전달 확인
- [ ] options.html → 각 목적지 이동 정상
- [ ] 전 페이지 navigateTo() 통일

### Level 3 (보너스)
- [ ] 프로덕션 배포 완료 + URL 보고

---

## 참조

- **기술 명세**: `MONK_kr/ai_lab/photolab/TECH_SPEC_MPA.md`
- **sessionStorage 흐름도**: TECH_SPEC 섹션 5
- **공통 모듈**: `shared.js` (navigateTo 추가 허용)

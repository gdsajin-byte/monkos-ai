---
type: order
id: ORDER_20260302_iMac쌍아_막내_v5_Wave1_기반인프라
date: "2026-03-02 17:10 KST"
from: 쌍아
to: 막내
priority: P0
status: pending
references:
  - monkos-ops/03_개발/SCHEMA_v5_확정.md
  - monkos-ops/03_개발/MONKOS_퍼널_UI기획안_v5_쌍아전달.md
  - monkos-ops/ops/reports/REPORT_20260302_막내1_퍼널v5_프론트엔드_충돌분석.md
  - monkos-ops/ops/reports/REPORT_20260302_막내2_퍼널v5_엔진로직_충돌분석.md
---

# 지시서: v5 Wave 1 — 기반 인프라 (config.js + shared.js)

> **[2026-03-02 17:10 KST] iMac/쌍아 → 막내**

## 역할 선언
> **너는 "막내"다. 쌍아가 아니다.**
> - 쌍아 = VSCode 전략실 (이 지시서를 작성한 에이전트)
> - 막내 = iTerm 터미널 (이 지시서를 실행하는 너)
> - 완료 보고: `{디바이스}/막내N → iMac/쌍아` 형식

---

## 배경

철창이 디자인(퍼널 기획안 v5) → 스키마 확정(SCHEMA_v5_확정.md) → **이제 코드에 심는다.**

Phase 1을 3 Wave로 분할 운영한다:
- **Wave 1 (본 지시서)**: 공통 기반 — config.js + shared.js (Wave 2가 참조하는 계약)
- Wave 2: 병렬 구현 — prep.js(막내1) + server.js(막내2) + charge.html(막내3)
- Wave 3: 마무리 — camera.js + result.js + thankyou.js

**Wave 1이 완료되어야 Wave 2의 세 막내가 동시에 작업할 수 있다.**

---

## 임무

`monkos_AI/idphoto-kr/public/` 하위의 **config.js**와 **shared.js** 두 파일을 v5 스키마 기준으로 수정하라.

---

## 변경 1: config.js — PHOTO_SPECS 키 변경 (D2)

### 현행 (L79-94)
```javascript
export const PHOTO_SPECS = {
  id_photo: {
    name: '여권/증명사진 (35x45mm)',
    widthMM: 35,
    heightMM: 45,
    faceTopMM: 7,
    faceLenMM: 27,
  },
  resume: {
    name: '이력서 (30x40mm)',
    widthMM: 30,
    heightMM: 40,
    faceTopMM: 6,
    faceLenMM: 24,
  },
};
```

### v5 변경
```javascript
export const PHOTO_SPECS = {
  passport: {
    name: '여권사진 (35x45mm)',
    widthMM: 35,
    heightMM: 45,
    faceTopMM: 7,
    faceLenMM: 27,
  },
  id: {
    name: '증명사진 (30x40mm)',
    widthMM: 30,
    heightMM: 40,
    faceTopMM: 6,
    faceLenMM: 24,
  },
};
```

**변경 사항**: 키 `id_photo` → `passport`, `resume` → `id`. 이름도 v5 기준으로 변경.

---

## 변경 2: config.js — v5 옵션 상수 추가

config.js 하단에 v5 선택지 상수를 추가하라. Wave 2의 prep.js, server.js가 이 상수를 참조한다.

```javascript
// ─── v5 옵션 상수 ───

export const V5_OPTIONS = {
  format: ['passport', 'id'],
  gender: ['f', 'm'],
  age: ['baby', 'child', 'teen', 'adult'],
  clothing: ['default', 'change', 'casual', 'suit'],
  clothingColor: {
    child: ['skyblue', 'pink', 'lemon', 'green'],     // 영유아/어린이
    adult: ['beige', 'blue', 'wine', 'green'],         // 캐주얼 (중고생/성인)
  },
  suitColor: ['navy', 'brown', 'gray', 'black'],
  shirtColor: ['white', 'lightblue', 'lightpink', 'lightbeige'],
  tieColor: ['notie', 'navy', 'wine', 'black'],
  tiePattern: ['solid', 'stripe'],
  hair: ['default', 'tidy', 'updo'],
  bgColor: ['white', 'gray', 'blue', 'beige'],
};

// 연령별 clothing 허용값
export const CLOTHING_BY_AGE = {
  baby: ['default', 'change'],
  child: ['default', 'change'],
  teen: ['default', 'casual', 'suit'],
  adult: ['default', 'casual', 'suit'],
};

// 연령별 hair 표시 여부
export const HAIR_VISIBLE_AGES = ['teen', 'adult'];

// format="passport" → bgColor 강제
export const PASSPORT_FORCED_BG = 'white';

// 스키마 버전
export const SCHEMA_VERSION = 'v5';
```

---

## 변경 3: shared.js — store 필드 재설계

### 현행 store 선택 필드 (L26-29)
```javascript
style: null,
gender: null,
age: null,
profileComplete: false,
```

### v5 변경
```javascript
// 퍼널 선택 (v5 — SCHEMA_v5_확정.md 기준)
format: null,          // "passport" | "id"
gender: null,          // "f" | "m"
age: null,             // "baby" | "child" | "teen" | "adult"
clothing: 'default',   // "default" | "change" | "casual" | "suit"
clothingColor: '',     // 조건부
suitColor: '',         // 조건부
shirtColor: '',        // 조건부
tieColor: '',          // 조건부
tiePattern: '',        // 조건부
hair: 'default',       // "default" | "tidy" | "updo"
bgColor: 'white',      // "white" | "gray" | "blue" | "beige"
```

**삭제**: `style` 필드 (D2 확정). `profileComplete` 필드는 유지해도 무방하나, v5 4페이지 구조에서는 미사용 — 삭제 권장.

---

## 변경 4: shared.js — import 확장

### 현행 (L7-8)
```javascript
import {
  API, CREDIT_COST, TOSS_CLIENT_KEY, PHOTO_SPECS, TX, t,
  MAX_CAPTURE_SIZE, COACHING_DISPLAY_MS, FRAME_INTERVAL_MS, CAPTURE_SIZE,
  DPI, mmToPx, GOOGLE_CLIENT_ID
} from './config.js';
```

### v5 변경 — `SCHEMA_VERSION` 추가
```javascript
import {
  API, CREDIT_COST, TOSS_CLIENT_KEY, PHOTO_SPECS, TX, t,
  MAX_CAPTURE_SIZE, COACHING_DISPLAY_MS, FRAME_INTERVAL_MS, CAPTURE_SIZE,
  DPI, mmToPx, GOOGLE_CLIENT_ID, SCHEMA_VERSION
} from './config.js';
```

re-export (L14-18)에도 `SCHEMA_VERSION` 추가.

---

## 변경 5: shared.js — sessionStorage 복원 로직 (sharedInit)

### 현행 (L340-346)
```javascript
const savedStyle = loadSessionData('style');
const savedGender = loadSessionData('gender');
const savedAge = loadSessionData('age');
if (savedStyle) store.style = savedStyle;
if (savedGender) store.gender = savedGender;
if (savedAge) store.age = savedAge;
```

### v5 변경
```javascript
// v5 구키 정리 가드 (SCHEMA_v5_확정.md §9)
if (loadSessionData('schema_version') !== SCHEMA_VERSION) {
  ['monkos_purpose', 'monkos_style', 'monkos_expression',
   'monkos_tie', 'monkos_background'].forEach(k => sessionStorage.removeItem(k));
  saveSessionData('schema_version', SCHEMA_VERSION);
}

// v5 선택값 복원
const restore = (key, fallback) => {
  const v = loadSessionData(key);
  return v !== null ? v : fallback;
};
store.format = restore('format', null);
store.gender = restore('gender', null);
store.age = restore('age', null);
store.clothing = restore('clothing', 'default');
store.clothingColor = restore('clothingColor', '');
store.suitColor = restore('suitColor', '');
store.shirtColor = restore('shirtColor', '');
store.tieColor = restore('tieColor', '');
store.tiePattern = restore('tiePattern', '');
store.hair = restore('hair', 'default');
store.bgColor = restore('bgColor', 'white');
```

---

## 변경 6: shared.js — sessionStorage 저장 헬퍼 추가

`clearSessionImages()` (L311-314) 아래에 v5 선택값 일괄 저장 함수를 추가하라. prep.js에서 호출한다.

```javascript
// ─── v5 선택값 일괄 저장 ───
export function saveSelections() {
  const keys = ['format', 'gender', 'age', 'clothing', 'clothingColor',
    'suitColor', 'shirtColor', 'tieColor', 'tiePattern', 'hair', 'bgColor'];
  keys.forEach(k => {
    const v = store[k];
    if (v !== null && v !== undefined && v !== '') {
      saveSessionData(k, v);
    } else {
      sessionStorage.removeItem(`monkos_${k}`);
    }
  });
}

// ─── v5 선택값 초기화 (prep 재진입 시) ───
export function clearSelections() {
  const keys = ['format', 'gender', 'age', 'clothing', 'clothingColor',
    'suitColor', 'shirtColor', 'tieColor', 'tiePattern', 'hair', 'bgColor'];
  keys.forEach(k => sessionStorage.removeItem(`monkos_${k}`));
  store.format = null;
  store.gender = null;
  store.age = null;
  store.clothing = 'default';
  store.clothingColor = '';
  store.suitColor = '';
  store.shirtColor = '';
  store.tieColor = '';
  store.tiePattern = '';
  store.hair = 'default';
  store.bgColor = 'white';
}
```

`window` 노출부(L447-455)에 `saveSelections`, `clearSelections` 추가.

---

## 변경하지 않는 것

| 파일 | 이유 |
|------|------|
| prep.js / prep.html | Wave 2 막내1 영역 |
| camera.js | Wave 3 영역 |
| result.js / thankyou.js | Wave 3 영역 |
| server.js | Wave 2 막내2 영역 |
| app.css | Wave 2에서 페이지 재작성 시 함께 변경 |
| charge.js / charge.html | Wave 2 막내3 영역 |

---

## 검증 체크리스트

반영 완료 후 아래를 점검하라:

| # | 점검 항목 | 방법 |
|---|----------|------|
| 1 | config.js `PHOTO_SPECS.passport` 존재 | grep |
| 2 | config.js `PHOTO_SPECS.id` 존재 | grep |
| 3 | config.js `id_photo`, `resume` 키 없음 | grep 결과 0건 |
| 4 | config.js `V5_OPTIONS` export 존재 | grep |
| 5 | config.js `SCHEMA_VERSION = 'v5'` 존재 | grep |
| 6 | shared.js store에 `format` 필드 존재 | grep |
| 7 | shared.js store에 `style` 필드 없음 | grep 결과 0건 (store 정의부 기준) |
| 8 | shared.js `saveSelections()` export 존재 | grep |
| 9 | shared.js `clearSelections()` export 존재 | grep |
| 10 | shared.js sharedInit 내 `schema_version` 가드 존재 | grep |
| 11 | shared.js import에 `SCHEMA_VERSION` 포함 | grep |
| 12 | `node --check` config.js — 문법 오류 없음 | 실행 |

---

## 주의사항

- **prep.js, camera.js, result.js는 이 단계에서 수정하지 않는다.** store.style 참조로 인해 일시적으로 깨질 수 있으나, Wave 2에서 전면 재작성된다.
- options.js L16 `store.style`은 무해 (navigate 전에 store 참조만) — Wave 2에서 정리.
- **기존 함수/로직 삭제 금지** — 추가/교체만 수행. 기존 함수(showCreditModal, buyCreditsKR 등)는 그대로 유지.
- SCHEMA_v5_확정.md를 정본으로 참조. 이 지시서와 SCHEMA가 충돌하면 **SCHEMA가 우선**.

---

⚠️ **준수 조항**
- 헌법 1조: 타임스탬프 시스템 취득 (`date` 명령)
- 헌법 2조: 완료 보고 형식 준수
- 헌법 6조: API 키/시크릿 절대 생성 금지 — 기존 값 그대로 유지
- 헌법 8조: 기존 파일 삭제 금지
- 헌법 13조: YAML frontmatter 필수 (보고서)
- **수정 범위: config.js + shared.js 2파일만. 그 외 파일 수정 금지.**

## 엔드라인

| 항목 | 내용 |
|------|------|
| 마무리 | `커밋+push` |
| 산출물 | config.js + shared.js 수정 (2파일) |
| 문서 유형 | 해당 없음 |
| 세션 로그 | 해당 없음 |

---
type: order
id: ORDER_20260302_iMac쌍아_막내2_v5_Wave3B_분석실서버WS
date: "2026-03-02 18:07 KST"
from: 쌍아
to: 막내2
priority: P0
status: pending
references:
  - monkos-ops/03_개발/SCHEMA_v5_확정.md
---

# 지시서: v5 Wave 3-B — 분석실(result) + 서버 WS 코칭 v5 키 연결

> **[2026-03-02 18:07 KST] iMac/쌍아 → 막내2**

## 역할 선언
> **너는 "막내2"다. 쌍아가 아니다.**
> - 완료 보고: `iMac/막내2 → iMac/쌍아` 형식

---

## 배경

Wave 2 전원 완료. result.js가 v4 키(`store.style`, `PHOTO_SPECS[store.style]`, `id_photo`/`resume` 하드코딩)를 참조하여 **런타임에 깨지며**, generate API 호출이 v5 필드를 전송하지 않아 서버에서 **buildPromptV5 분기가 작동하지 않는다.**

서버 WS 코칭도 `set-style`/`id_photo`/`resume`를 사용 중이며, camera.js(막내1)가 `set-format`/`passport`/`id`로 전환하므로 **서버도 동시 전환 필수.**

**병렬 작업 중**: 막내1이 camera.js + thankyou.js를 동시 수정. 파일 충돌 없음.

---

## 임무

1. `result.js` — v5 키 매핑 + generate API v5 필드 전송 (10곳+)
2. `result.html` — 규격 탭 버튼 ID/onclick v5 키로 교체 (2곳)
3. `server.js` — WS 코칭 `set-format` 핸들러 + 코칭 상수에 v5 키 alias 추가

---

## 변경 1: result.js — generate API 호출 v5 전환 (L210-223)

### 현행
```javascript
const genResult = await pipe.run('generate', {
  image: base64,
  style: store.style,
  purpose: loadSessionData('purpose'),
  gender: store.gender,
  age: store.age,
  clothing: loadSessionData('clothing'),
  clothingColor: loadSessionData('clothingColor'),
  tie: loadSessionData('tie'),
  hair: loadSessionData('hair'),
  background: loadSessionData('background'),
  expression: loadSessionData('expression'),
  userId: store.user.id,
});
```

### v5 변경
```javascript
const genResult = await pipe.run('generate', {
  image: base64,
  format: store.format,
  gender: store.gender,
  age: store.age,
  clothing: store.clothing,
  clothingColor: store.clothingColor,
  suitColor: store.suitColor,
  shirtColor: store.shirtColor,
  tieColor: store.tieColor,
  tiePattern: store.tiePattern,
  hair: store.hair,
  bgColor: store.bgColor,
  userId: store.user.id,
  v: 5,
});
```

**핵심**: `v: 5` 플래그로 서버 buildPromptV5 분기 작동. `style`→`format`, `tie`→`tieColor`+`tiePattern`, `background`→`bgColor`, `expression` 삭제, `purpose` 삭제. 모든 값은 store에서 직접 참조 (sharedInit에서 이미 복원됨).

---

## 변경 2: result.js — PHOTO_SPECS 참조 6곳

모두 `store.style` → `store.format` 교체:

| 라인 | 현행 | 변경 |
|------|------|------|
| L233 | `PHOTO_SPECS[store.style]` | `PHOTO_SPECS[store.format]` |
| L379 | `store.generated && store.style` | `store.generated && store.format` |
| L380 | `PHOTO_SPECS[store.style]` | `PHOTO_SPECS[store.format]` |
| L389 | `_specCache[store.style]` | `_specCache[store.format]` |
| L390 | `_currentSpec = store.style` | `_currentSpec = store.format` |
| L22 주석 | `{ id_photo: dataUrl, resume: dataUrl }` | `{ passport: dataUrl, id: dataUrl }` |

---

## 변경 3: result.js — updateSpecButtons() (L505-533)

### 현행
```javascript
function updateSpecButtons() {
  const SPEC_DESC = {
    id_photo: '여권, 운전면허, 신분증',
    resume: '이력서, 사원증, 학생증, 컬러증명',
  };

  ['id_photo', 'resume'].forEach(key => {
    const btn = document.getElementById(`btn-spec-${key}`);
    if (!btn) return;
    // ...
    if (span && !isUnlocked && !isActive) {
      span.textContent = key === 'id_photo' ? '3.5×4.5cm · 10 Cr' : '3×4cm · 10 Cr';
    } else if (span && (isActive || isUnlocked)) {
      span.textContent = key === 'id_photo' ? '3.5×4.5cm' : '3×4cm';
    }
  });

  const desc = document.getElementById('spec-tab-desc');
  if (desc && _currentSpec) {
    desc.textContent = SPEC_DESC[_currentSpec];
  }
}
```

### v5 변경
```javascript
function updateSpecButtons() {
  const SPEC_DESC = {
    passport: '여권, 운전면허, 신분증',
    id: '이력서, 사원증, 학생증, 컬러증명',
  };

  ['passport', 'id'].forEach(key => {
    const btn = document.getElementById(`btn-spec-${key}`);
    if (!btn) return;

    const isActive = (key === _currentSpec);
    const isUnlocked = !!_specCache[key];

    btn.classList.toggle('active', isActive);
    btn.classList.toggle('locked', !isUnlocked && !isActive);

    const span = btn.querySelector('span');
    if (span && !isUnlocked && !isActive) {
      span.textContent = key === 'passport' ? '3.5×4.5cm · 10 Cr' : '3×4cm · 10 Cr';
    } else if (span && (isActive || isUnlocked)) {
      span.textContent = key === 'passport' ? '3.5×4.5cm' : '3×4cm';
    }
  });

  const desc = document.getElementById('spec-tab-desc');
  if (desc && _currentSpec) {
    desc.textContent = SPEC_DESC[_currentSpec];
  }
}
```

---

## 변경 4: result.html — 규격 탭 버튼 (L250-255)

### 현행
```html
<button class="btn spec-tab-btn" id="btn-spec-id_photo" onclick="selectSpec('id_photo')">
    여권규격 <span style="display:block;font-size:11px;opacity:0.7;">3.5×4.5cm</span>
</button>
<button class="btn spec-tab-btn" id="btn-spec-resume" onclick="selectSpec('resume')">
    반명함 <span style="display:block;font-size:11px;opacity:0.7;">3×4cm</span>
</button>
```

### v5 변경
```html
<button class="btn spec-tab-btn" id="btn-spec-passport" onclick="selectSpec('passport')">
    여권규격 <span style="display:block;font-size:11px;opacity:0.7;">3.5×4.5cm</span>
</button>
<button class="btn spec-tab-btn" id="btn-spec-id" onclick="selectSpec('id')">
    반명함 <span style="display:block;font-size:11px;opacity:0.7;">3×4cm</span>
</button>
```

---

## 변경 5: server.js — WS 코칭 핸들러 (L944-947)

### 현행
```javascript
if (msg.type === 'set-style') {
  session.photoStyle = msg.style === 'resume' ? 'resume' : 'id_photo';
  log(`[스타일][${clientId}] ${session.photoStyle}`);
  return;
}
```

### v5 변경 (v4 하위호환 유지)
```javascript
if (msg.type === 'set-format' || msg.type === 'set-style') {
  const val = msg.format || msg.style;
  session.photoStyle = (val === 'id' || val === 'resume') ? 'id' : 'passport';
  log(`[포맷][${clientId}] ${session.photoStyle}`);
  return;
}
```

---

## 변경 6: server.js — 코칭 상수 v5 alias 추가

### COACHING_INSTRUCTIONS (L112-141)
기존 `id_photo`/`resume` 키 유지 + v5 alias 추가:
```javascript
const COACHING_INSTRUCTIONS = {
  id_photo: `몽코스 AI 코치입니다. 여권/증명사진 촬영을 도와드립니다. ...`,
  resume: `몽코스 AI 코치입니다. 이력서 사진 촬영을 도와드립니다. ...`,
  // v5 aliases
  passport: null, // 아래에서 할당
  id: null,
};
COACHING_INSTRUCTIONS.passport = COACHING_INSTRUCTIONS.id_photo;
COACHING_INSTRUCTIONS.id = COACHING_INSTRUCTIONS.resume;
```

또는 상수 객체 뒤에 바로 alias:
```javascript
// v5 alias (48시간 후 원본 키 제거)
COACHING_INSTRUCTIONS.passport = COACHING_INSTRUCTIONS.id_photo;
COACHING_INSTRUCTIONS.id = COACHING_INSTRUCTIONS.resume;
```

### STYLE_PROMPTS (L165-168)
같은 패턴:
```javascript
STYLE_PROMPTS.passport = STYLE_PROMPTS.id_photo;
STYLE_PROMPTS.id = STYLE_PROMPTS.resume;
```

### 세션 초기값 (L909)
```javascript
// 현행:
const session = { ..., photoStyle: 'id_photo' };
// v5:
const session = { ..., photoStyle: 'passport' };
```

### 함수 기본값 (L435, L492)
```javascript
// L435 현행:
async function connectGeminiLive(session, clientId, style = 'id_photo')
// v5:
async function connectGeminiLive(session, clientId, style = 'passport')

// L492 현행:
async function generatePhoto(inputBase64, style = 'id_photo', gender = 'male', age = 'adult')
// v5:
async function generatePhoto(inputBase64, style = 'passport', gender = 'f', age = 'adult')
```

### 폴백 참조 (L454, L494)
```javascript
// L454:
COACHING_INSTRUCTIONS[style] || COACHING_INSTRUCTIONS.passport
// L494:
STYLE_PROMPTS[style] || STYLE_PROMPTS.passport
```

---

## 변경하지 않는 것

| 대상 | 이유 |
|------|------|
| `buildPrompt()` (v4 프롬프트 빌더, L251-309) | 48시간 하위호환 — 삭제 금지 |
| `buildPromptV5()` (Wave 2-B 산출물) | 이미 v5 완성 — 변경 불필요 |
| `PURPOSE_PROMPTS` (L243-249) | v4 buildPrompt()이 참조 — 48시간 유지 |
| `getOutfitPrompt()` (L171-189) | v4 buildPrompt()이 참조 — 48시간 유지 |
| camera.js, thankyou.js | 막내1 영역 |
| shared.js, config.js, prep.js, charge.html | 수정 금지 |

---

## 수정 범위

| 파일 | 작업 |
|------|------|
| **result.js** | generate API v5 필드 + PHOTO_SPECS 키 6곳 + updateSpecButtons |
| **result.html** | 규격 탭 버튼 ID/onclick 2곳 |
| **server.js** | WS set-format 핸들러 + COACHING/STYLE alias + 기본값 교체 |

---

## 검증 체크리스트

| # | 점검 항목 |
|---|----------|
| 1 | result.js에서 `store.style` 참조 0건 (grep) |
| 2 | result.js에서 `store.format` 참조 존재 |
| 3 | result.js generate 호출에 `v: 5` 플래그 존재 |
| 4 | result.js generate 호출에 `style` 필드 없음, `format` 필드 있음 |
| 5 | result.js generate 호출에 `tieColor`, `tiePattern`, `bgColor` 있음 |
| 6 | result.js generate 호출에 `expression`, `purpose`, `tie`, `background` 없음 |
| 7 | result.js `updateSpecButtons`에서 `['passport', 'id']` 사용 |
| 8 | result.html에서 `id_photo`, `resume` 0건 (grep) |
| 9 | result.html에서 `btn-spec-passport`, `btn-spec-id` 존재 |
| 10 | server.js WS에서 `set-format` 핸들링 존재 |
| 11 | server.js `COACHING_INSTRUCTIONS.passport` 존재 |
| 12 | server.js `STYLE_PROMPTS.passport` 존재 |
| 13 | server.js 세션 초기값 `photoStyle: 'passport'` |
| 14 | 기존 `buildPrompt()` 함수 삭제 안 됨 (48시간 유지) |
| 15 | `node --check result.js` 문법 오류 없음 |
| 16 | `node --check server.js` 문법 오류 없음 |

---

⚠️ **준수 조항**
- 헌법 1조: 타임스탬프 시스템 취득
- 헌법 2조: 완료 보고 형식 준수
- 헌법 6조: **GEMINI_API_KEY 절대 건드리지 않는다** — 기존 값 유지
- 헌법 9조: IDENTITY_PRESERVATION 프롬프트 변경 금지
- **camera.js, thankyou.js 수정 금지** — 막내1 영역
- **buildPrompt() 삭제 금지** — 48시간 하위호환

## 엔드라인

| 항목 | 내용 |
|------|------|
| 마무리 | `커밋+push` |
| 산출물 | result.js + result.html + server.js (3파일) |
| 보고서 | `monkos-ops/ops/reports/REPORT_20260302_막내2_v5_Wave3B_분석실서버WS.md` |
| 세션 로그 | 해당 없음 |

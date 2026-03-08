---
type: order
id: ORDER_20260302_iMac쌍아_막내1_v5_Wave3A_카메라수령처
date: "2026-03-02 18:07 KST"
from: 쌍아
to: 막내1
priority: P0
status: pending
references:
  - monkos-ops/03_개발/SCHEMA_v5_확정.md
---

# 지시서: v5 Wave 3-A — 카메라 + 수령처 v5 키 연결

> **[2026-03-02 18:07 KST] iMac/쌍아 → 막내1**

## 역할 선언
> **너는 "막내1"이다. 쌍아가 아니다.**
> - 완료 보고: `iMac/막내1 → iMac/쌍아` 형식

---

## 배경

Wave 2 전원 완료. v5 store/config가 확정된 상태에서, camera.js와 thankyou.js가 아직 v4 키를 참조하여 **런타임에 깨진다.**

- `store.style` → v5에서 삭제됨 (`store.format`으로 교체)
- `'male'/'female'` → v5에서 `'m'/'f'`
- `loadSessionData('purpose')` → v5에서 purpose 필드 삭제 (format이 대체)
- `loadSessionData('style')` → v5에서 format으로 교체

**병렬 작업 중**: 막내2가 result.js + result.html + server.js WS를 동시 수정. 파일 충돌 없음.

---

## 임무

1. `camera.js` — v4→v5 필드 매핑 (6곳)
2. `thankyou.js` — v4→v5 필드 매핑 (4곳)

---

## 변경 1: camera.js — WS 코칭 메시지 (L124-127)

### 현행
```javascript
wsCoaching.send(JSON.stringify({
  type: 'set-style',
  style: store.style || 'id_photo',
}));
```

### v5 변경
```javascript
wsCoaching.send(JSON.stringify({
  type: 'set-format',
  format: store.format || 'passport',
}));
```

---

## 변경 2: camera.js — 선택 요약 뱃지 (L224-237)

### 현행
```javascript
const PURPOSE_LABELS = {
  passport: '여권', student_id: '학생증', employee_id: '사원증',
  resume: '이력서', color_portrait: '컬러증명',
};

function renderSelectionSummary() {
  const summaryEl = document.querySelector('#selection-summary');
  if (!summaryEl) return;

  const labels = [];
  labels.push(PURPOSE_LABELS[store.purpose] || store.style || '');
  if (store.gender === 'male') labels.push('남성');
  else if (store.gender === 'female') labels.push('여성');
  summaryEl.textContent = labels.filter(Boolean).join(' · ');
}
```

### v5 변경
```javascript
const FORMAT_LABELS = {
  passport: '여권사진',
  id: '증명사진',
};

function renderSelectionSummary() {
  const summaryEl = document.querySelector('#selection-summary');
  if (!summaryEl) return;

  const labels = [];
  labels.push(FORMAT_LABELS[store.format] || '');
  if (store.gender === 'm') labels.push('남성');
  else if (store.gender === 'f') labels.push('여성');
  if (store.age) {
    const AGE_LABELS = { baby: '영유아', child: '어린이', teen: '청소년', adult: '성인' };
    labels.push(AGE_LABELS[store.age] || '');
  }
  summaryEl.textContent = labels.filter(Boolean).join(' · ');
}
```

---

## 변경 3: camera.js — 퍼널 필드 로딩 + 필수값 체크 (L261-286)

### 현행 (L261-286)
```javascript
// ── 퍼널 9필드 로딩 ──
const purpose = loadSessionData('purpose');
const age = loadSessionData('age');
const gender = loadSessionData('gender');
const clothing = loadSessionData('clothing');
const clothingColor = loadSessionData('clothingColor');
const tie = loadSessionData('tie');
const hair = loadSessionData('hair');
const background = loadSessionData('background');
const expression = loadSessionData('expression');

// 필수값 체크 (style은 sharedInit()에서 복원됨, purpose는 별도)
if (!store.style || !purpose) {
  Monk.log('선택 데이터 없음 → 준비실로 이동');
  navigateTo('prep.html');
  return;
}

// store에 9필드 세팅
store.purpose = purpose;
store.clothing = clothing;
store.clothingColor = clothingColor;
store.tie = tie;
store.hair = hair;
store.background = background;
store.expression = expression;
```

### v5 변경
```javascript
// ── v5 필수값 체크 (sharedInit에서 이미 11필드 복원됨) ──
if (!store.format) {
  Monk.log('선택 데이터 없음 → 준비실로 이동');
  navigateTo('prep.html');
  return;
}
```

**이유**: v5 `sharedInit()` 내부의 restore 로직(shared.js L385-395)이 sessionStorage→store 복원을 이미 처리한다. purpose/tie/background/expression은 v5에서 삭제된 필드. 수동 로딩 전체 불필요.

---

## 변경 4: thankyou.js — displaySpecInfo (L72-87)

### 현행
```javascript
function displaySpecInfo() {
  const style = loadSessionData('style');
  const specInfoEl = document.getElementById('spec-info');
  if (!specInfoEl || !style) return;

  const spec = PHOTO_SPECS[style];
  if (!spec) return;
  // ... (나머지 렌더링 동일)
}
```

### v5 변경
```javascript
function displaySpecInfo() {
  const format = loadSessionData('format');
  const specInfoEl = document.getElementById('spec-info');
  if (!specInfoEl || !format) return;

  const spec = PHOTO_SPECS[format];
  if (!spec) return;
  // ... (나머지 렌더링 동일)
}
```

---

## 변경 5: thankyou.js — USAGE_GUIDE + displayUsageGuide (L8-106)

### 현행
```javascript
const USAGE_GUIDE = {
  passport: [...],
  student_id: [...],
  employee_id: [...],
  resume: [...],
  color_portrait: [...],
};

function displayUsageGuide() {
  const purpose = loadSessionData('purpose');
  // ...
  const items = USAGE_GUIDE[purpose];
  // ...
}
```

### v5 변경
```javascript
const USAGE_GUIDE = {
  passport: [
    '여권 신청 (온라인/오프라인)',
    '비자 신청',
    '주민등록증 / 운전면허증',
  ],
  id: [
    '이력서 / 자기소개서',
    '학생증 / 사원증 발급',
    'SNS 프로필 / 명함 사진',
  ],
};

function displayUsageGuide() {
  const format = loadSessionData('format');
  const listEl = document.getElementById('usage-list');
  const guideEl = document.getElementById('usage-guide');
  if (!listEl || !guideEl) return;

  const items = USAGE_GUIDE[format];
  if (!items) {
    guideEl.style.display = 'none';
    return;
  }

  listEl.innerHTML = items.map(item =>
    `<div style="padding:2px 0;">· ${item}</div>`
  ).join('');
}
```

---

## 수정 범위

| 파일 | 작업 |
|------|------|
| **camera.js** | WS 메시지 + 뱃지 + 필드 로딩 간소화 |
| **thankyou.js** | specInfo + usageGuide v5 키 교체 |

**수정 금지**: shared.js, config.js, prep.js, result.js, result.html, server.js, charge.js, charge.html

---

## 검증 체크리스트

| # | 점검 항목 |
|---|----------|
| 1 | camera.js에서 `store.style` 참조 0건 (grep) |
| 2 | camera.js에서 `'male'` / `'female'` 비교 문자열 0건 |
| 3 | camera.js에서 `store.format` 참조 존재 |
| 4 | camera.js에서 `set-format` WS 메시지 전송 |
| 5 | camera.js에서 `loadSessionData('purpose')` 0건 |
| 6 | thankyou.js에서 `loadSessionData('style')` 0건 |
| 7 | thankyou.js에서 `loadSessionData('format')` 존재 |
| 8 | thankyou.js에서 `loadSessionData('purpose')` 0건 |
| 9 | thankyou.js에서 `PHOTO_SPECS[format]` 존재 |
| 10 | `node --check camera.js` 문법 오류 없음 |
| 11 | `node --check thankyou.js` 문법 오류 없음 |

---

⚠️ **준수 조항**
- 헌법 1조: 타임스탬프 시스템 취득
- 헌법 2조: 완료 보고 형식 준수
- 헌법 6조: API 키/시크릿 생성 금지
- **다른 파일 수정 절대 금지** — result.js, result.html, server.js는 막내2 영역

## 엔드라인

| 항목 | 내용 |
|------|------|
| 마무리 | `커밋+push` |
| 산출물 | camera.js + thankyou.js (2파일) |
| 보고서 | `monkos-ops/ops/reports/REPORT_20260302_막내1_v5_Wave3A_카메라수령처.md` |
| 세션 로그 | 해당 없음 |

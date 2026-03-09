---
type: order
id: ORDER_20260302_iMac쌍아_막내2_v5_Wave2B_서버프롬프트
date: "2026-03-02 17:24 KST"
from: 쌍아
to: 막내2
priority: P0
status: pending
references:
  - monkos-ops/03_개발/SCHEMA_v5_확정.md
---

# 지시서: v5 Wave 2-B — 서버 프롬프트 빌더 (/api/idgen v5)

> **[2026-03-02 17:24 KST] iMac/쌍아 → 막내2**

## 역할 선언
> **너는 "막내2"다. 쌍아가 아니다.**
> - 완료 보고: `iMac/막내2 → iMac/쌍아` 형식

---

## 배경

Wave 1 완료. 클라이언트 store가 v5 11필드로 전환됨.
서버 /api/idgen도 v5 요청을 처리할 수 있어야 한다.

**병렬 작업 중**: 막내1(prep.js), 막내3(charge.html) 동시 진행. 파일 충돌 없음.

---

## 임무

`monkos_AI/idphoto-kr/server.js`에 **buildPromptV5()** 함수를 추가하고, /api/idgen 핸들러에 버전 분기를 적용하라.

---

## 변경 1: buildPromptV5() 함수 추가

기존 `buildPrompt()` (L251-309) 바로 아래에 신규 함수를 추가하라. **기존 buildPrompt()는 삭제하지 않는다** (48시간 하위호환).

### v5 프롬프트 빌더 — SCHEMA_v5_확정.md §6 정본

```javascript
function buildPromptV5(body) {
  const { format, gender, age, clothing, clothingColor,
          suitColor, shirtColor, tieColor, tiePattern,
          hair, bgColor } = body;

  const parts = [];

  // [1] FORMAT (SCHEMA §6-1)
  if (format === 'passport') {
    parts.push('[FORMAT] Official passport/visa photo. Head centered, face taking 70-80% of frame height. Forehead and eyebrows must be visible. Neutral composed expression. White background mandatory.');
  } else {
    parts.push('[FORMAT] Professional ID photo. Head centered, face taking 70-80% of frame height. Approachable yet professional expression.');
  }

  // [2] SUBJECT (SCHEMA §6-2 — gender × age = 8조합)
  const SUBJECT_MAP = {
    'f-baby':  'This person is a baby girl (infant/toddler).',
    'f-child': 'This person is a young girl (child, under 12).',
    'f-teen':  'This person is a teenage girl (13-18).',
    'f-adult': 'This person is an adult woman.',
    'm-baby':  'This person is a baby boy (infant/toddler).',
    'm-child': 'This person is a young boy (child, under 12).',
    'm-teen':  'This person is a teenage boy (13-18).',
    'm-adult': 'This person is an adult man.',
  };
  parts.push(`[SUBJECT] ${SUBJECT_MAP[`${gender}-${age}`] || 'This person is an adult.'}`);

  // [3] OUTFIT (SCHEMA §6-3)
  if (!clothing || clothing === 'default') {
    parts.push('[OUTFIT] Keep current clothing as-is. Only ensure it looks neat and tidy.');
  } else if (clothing === 'change') {
    // 영유아/어린이 — clothingColor
    parts.push(`[OUTFIT] Dress this child in a clean ${clothingColor || 'white'} top, age-appropriate and neat.`);
  } else if (clothing === 'casual') {
    // 중고생/성인 — clothingColor
    parts.push(`[OUTFIT] Dress this person in a ${clothingColor || 'beige'} smart casual top, clean and neat.`);
  } else if (clothing === 'suit') {
    // 정장 — suitColor + shirtColor + tieClause
    const suit = suitColor || 'navy';
    const shirt = shirtColor || 'white';
    let tieClause = '';
    if (tieColor && tieColor !== 'notie') {
      const pattern = tiePattern === 'stripe' ? 'striped' : 'solid';
      tieClause = ` and a ${pattern} ${tieColor} tie`;
    }
    // D3: 성별 무관 넥타이. 블라우스/셔츠만 분기
    const top = gender === 'f' ? 'blouse' : 'dress shirt';
    parts.push(`[OUTFIT] Dress this person in a ${suit} formal business suit with a ${shirt} ${top}${tieClause}.`);
  }

  // [4] HAIR (SCHEMA §6-4)
  if (hair && hair !== 'default') {
    const HAIR_MAP = {
      tidy: 'neatly groomed and tidy hair',
      updo: 'hair styled up neatly (updo)',
    };
    if (HAIR_MAP[hair]) parts.push(`[HAIR] ${HAIR_MAP[hair]}`);
  }

  // [5] BACKGROUND (SCHEMA §6-5)
  const BG_MAP = {
    white: 'pure white (#FFFFFF) background',
    gray:  'neutral gray (#9CA3AF) studio background',
    blue:  'soft blue (#4A90D9) studio background',
    beige: 'warm beige (#D4B896) studio background',
  };
  // passport → white 강제 (서버에서도 한 번 더)
  const finalBg = format === 'passport' ? 'white' : (bgColor || 'white');
  parts.push(`[BACKGROUND] ${BG_MAP[finalBg] || BG_MAP.white}`);

  // [6] CONSTRAINT (SCHEMA §6-6)
  parts.push('[CONSTRAINT] Keep the person\'s face and body exactly the same — only apply the specified styling. DO NOT change apparent gender or age.');

  return `${IDENTITY_PRESERVATION}\n\n[IMAGE-TO-IMAGE TRANSFORM]\n${parts.join('\n')}`;
}
```

**핵심 차이 vs v4 buildPrompt():**
- `style`/`purpose` → `format` (2값)
- `gender`: `male/female` → `f/m`
- `tie` 합산형 → `tieColor` + `tiePattern` 분리
- `expression` **삭제** — format 프롬프트에 표정 지시 포함 (D7)
- `background` → `bgColor`
- D3: 여성도 넥타이 가능 (gender 분기 = blouse/dress shirt만)

---

## 변경 2: /api/idgen 핸들러 버전 분기

### 현행 (L644)
```javascript
const instruction = buildPrompt(body);
```

### v5 변경
```javascript
// v5 버전 분기 (SCHEMA §9 — 48시간 하위호환)
const schemaVersion = body.v || 4;
const instruction = schemaVersion >= 5
  ? buildPromptV5(body)
  : buildPrompt(body);  // 48시간 후 제거
```

---

## 변경 3: 서버 유효성 검증 추가 (선택)

buildPromptV5() 호출 전에 v5 요청의 필수값을 검증하는 가드를 추가하라:

```javascript
if (schemaVersion >= 5) {
  if (!body.format || !body.gender || !body.age) {
    return res.status(400).json({ error: 'v5 필수값 누락: format, gender, age' });
  }
}
```

---

## 수정 범위

| 파일 | 작업 |
|------|------|
| **server.js** | buildPromptV5() 추가 + /api/idgen 버전 분기 + 유효성 검증 |

**수정 금지**: config.js, shared.js, prep.js, result.js, camera.js, 모든 public/ 파일

---

## 검증 체크리스트

| # | 점검 항목 |
|---|----------|
| 1 | `buildPromptV5` 함수 존재 |
| 2 | 기존 `buildPrompt` 함수 유지 (삭제 안 됨) |
| 3 | /api/idgen에 `body.v` 분기 존재 |
| 4 | v5 요청 시 buildPromptV5 호출 확인 |
| 5 | format=passport 시 background=white 강제 |
| 6 | clothing=suit 시 blouse/dress shirt 성별 분기 |
| 7 | tieColor=notie 시 tieClause 빈 문자열 |
| 8 | expression 필드 미사용 (v5에서 삭제됨) |
| 9 | IDENTITY_PRESERVATION 프리픽스 유지 |
| 10 | `node --check server.js` 문법 오류 없음 |

---

⚠️ **준수 조항**
- 헌법 1조: 타임스탬프 시스템 취득
- 헌법 2조: 완료 보고 형식 준수
- 헌법 6조: **API 키 절대 건드리지 않는다** — GEMINI_API_KEY 기존 값 유지
- 헌법 9조: IDENTITY_PRESERVATION 프롬프트 변경 금지 (정체성 보존 핵심)
- **정본**: SCHEMA_v5_확정.md §5-6. 충돌 시 SCHEMA 우선.
- **다른 파일 수정 금지**

## 엔드라인

| 항목 | 내용 |
|------|------|
| 마무리 | `커밋+push` |
| 산출물 | server.js 수정 (1파일) |
| 문서 유형 | 해당 없음 |
| 세션 로그 | 해당 없음 |

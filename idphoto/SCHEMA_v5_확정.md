---
type: SPEC
date: 2026-03-02
from: iMac/쌍아
approved_by: 작가님 + 철창이 교차 검증
subject: 퍼널 v5 sessionStorage + API 스키마 확정
status: 확정
sources:
  - MONKOS_퍼널_UI기획안_v5_쌍아전달.md
  - REVIEW_20260302_쌍아_P0_스키마_정합검토.md
  - REPORT_20260302_막내1_P0_클라이언트_스키마설계.md
  - REPORT_20260302_막내2_P0_서버_스키마설계.md
  - REPORT_20260302_막내3_P0_전환_마이그레이션설계.md
---

# 퍼널 v5 스키마 확정

> **[2026-03-02 12:21 KST] 확정**
> **결정 근거**: 막내 3명 보고서 + 쌍아 정합 검토 + 철창이 교차 검증 + 작가님 승인

---

## 0. 확정 결정 사항 (D1~D7)

| # | 항목 | 결정 | 근거 |
|---|------|------|------|
| D1 | 전환 전략 | **빅뱅 전환** | 만장일치. 어댑터=복잡도 증가 |
| D2 | style 키 | **삭제** — PHOTO_SPECS 키를 passport/id로 변경 | 빅뱅 확정 → 근원 해결. 헌법 10조 |
| D3 | 여성 넥타이 | **성별 무관** — 여성도 넥타이 선택 가능 | 기획안 분기 기준이 연령이지 성별이 아님 |
| D4 | buyDirect | **유지** — 로그인 게이트 완성 전까지 | 순서 문제 |
| D5 | 비로그인 1회 무료 | **폐지** | 기획안 §3-4 로그인 게이트. 컨베이어 벨트 분기 방지 |
| D6 | 레거시 정리 | **선행 별도 처리** | monkos_user 1건 (portal auth.js) |
| D7 | passport 표정 | **FORMAT 프롬프트에 포함** | 표정 옵션 삭제 → 프롬프트 레벨 처리 |

---

## 1. 기획안 상태변수 → sessionStorage 키 전개도

기획안(철창이+작가님)에서 정의한 **상태변수 8개**가 sessionStorage **17키**로 전개되는 구조:

```
기획안 상태변수 (8개)          sessionStorage 키 (17키)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1p] format ─────────────── monkos_format
[2p] gender ─────────────── monkos_gender
[2p] age ────────────────── monkos_age
[3p] clothing ───────────── monkos_clothing
                            ├─ monkos_clothingColor  (change/casual 시)
                            ├─ monkos_suitColor      (suit 시)
                            ├─ monkos_shirtColor     (suit 시)
                            ├─ monkos_tieColor       (suit 시)
                            └─ monkos_tiePattern     (suit+tie 시)
[3p] hair ───────────────── monkos_hair
[3p] bgColor ────────────── monkos_bgColor

[런타임] styleEdit ── ❌ 저장 안 함 (아코디언 UI 상태)

[촬영/생성/결제]      ── monkos_captured        (camera.js)
                      ── monkos_generated       (result.js)
                      ── monkos_cropped         (result.js)
                      ── monkos_pending_action  (result.js)
                      ── _mo_p                  (result.js, 난독화)

[메타]                ── monkos_schema_version  (전환기 구키 정리)
```

---

## 2. sessionStorage 스키마 정본 — 퍼널 선택 키 (11키)

### 2-1. 필수 키 (3키) — 항상 저장

| # | 키 | 페이지 | 타입 | 값 | 디폴트 |
|---|-----|--------|------|-----|--------|
| 1 | `monkos_format` | 1p | string | `"passport"` \| `"id"` | — (필수 선택) |
| 2 | `monkos_gender` | 2p | string | `"f"` \| `"m"` | — (필수 선택) |
| 3 | `monkos_age` | 2p | string | `"baby"` \| `"child"` \| `"teen"` \| `"adult"` | — (필수 선택) |

### 2-2. 스타일 키 (8키) — 조건부 저장

| # | 키 | 페이지 | 타입 | 값 | 디폴트 | 저장 조건 |
|---|-----|--------|------|-----|--------|----------|
| 4 | `monkos_clothing` | 3p | string | `"default"` \| `"change"` \| `"casual"` \| `"suit"` | `"default"` | 항상 |
| 5 | `monkos_clothingColor` | 3p | string \| `""` | 영유아: `"skyblue"` \| `"pink"` \| `"lemon"` \| `"green"` / 캐주얼: `"beige"` \| `"blue"` \| `"wine"` \| `"green"` | `""` | clothing = `"change"` 또는 `"casual"` |
| 6 | `monkos_suitColor` | 3p | string \| `""` | `"navy"` \| `"brown"` \| `"gray"` \| `"black"` | `"navy"` | clothing = `"suit"` |
| 7 | `monkos_shirtColor` | 3p | string \| `""` | `"white"` \| `"lightblue"` \| `"lightpink"` \| `"lightbeige"` | `"white"` | clothing = `"suit"` |
| 8 | `monkos_tieColor` | 3p | string \| `""` | `"notie"` \| `"navy"` \| `"wine"` \| `"black"` | `"navy"` | clothing = `"suit"` |
| 9 | `monkos_tiePattern` | 3p | string \| `""` | `"solid"` \| `"stripe"` | `"solid"` | tieColor ≠ `"notie"` |
| 10 | `monkos_hair` | 3p | string | `"default"` \| `"tidy"` \| `"updo"` | `"default"` | 항상 |
| 11 | `monkos_bgColor` | 3p | string | `"white"` \| `"gray"` \| `"blue"` \| `"beige"` | `"white"` | 항상 |

### 2-3. 조건부 표시 규칙 (기획안 §3-3)

```
영유아/어린이 + 여권:   clothing만 (default/change)  + bgColor=white 고정
영유아/어린이 + 증명:   clothing(default/change) + bgColor(4색)
중고생/성인   + 여권:   clothing(default/casual/suit) + hair + bgColor=white 고정
중고생/성인   + 증명:   clothing(default/casual/suit) + hair + bgColor(4색)
```

### 2-4. 연령별 clothing 허용값

| age | 허용 clothing | 비고 |
|-----|-------------|------|
| `"baby"` \| `"child"` | `"default"` \| `"change"` | casual/suit 불가 |
| `"teen"` \| `"adult"` | `"default"` \| `"casual"` \| `"suit"` | change 불가 |

### 2-5. 연령별 hair 동작

| age | hair 동작 |
|-----|----------|
| `"baby"` \| `"child"` | `"default"` 고정 (UI에서 숨김) |
| `"teen"` \| `"adult"` | 유저 선택 가능 |

---

## 3. sessionStorage 스키마 정본 — 이미지/상태 키 (5키)

| # | 키 | 쓰기 | 읽기 | 타입 | 비고 |
|---|-----|------|------|------|------|
| 12 | `monkos_captured` | camera.js 촬영 시 | result.js 원본 표시 | base64 data URL | ~400KB |
| 13 | `monkos_generated` | result.js 생성 완료 | result.js 토스 복귀 | base64 data URL | ~500KB |
| 14 | `monkos_cropped` | result.js 다운로드 후 | thankyou.js 완성본 표시 | base64 data URL | ~200KB |
| 15 | `monkos_pending_action` | result.js 잔액 부족 시 | result.js 충전 복귀 시 | string (`"download"`) | — |
| 16 | `_mo_p` | result.js 다운로드 클릭 | result.js 토스 복귀 | base64 data URL | ~1MB, 난독화 |

---

## 4. sessionStorage 메타 키 (1키, 신규)

| # | 키 | 용도 |
|---|-----|------|
| 17 | `monkos_schema_version` | `"v5"` — prep.js init 시 구키 정리 트리거 (1회 실행) |

---

## 5. /api/idgen v5 요청 스키마

```javascript
// v5 /api/idgen 요청 body
{
  // 버전 태그 (서버 하위호환용, 48시간 유지 후 제거)
  "v": 5,

  // 퍼널 선택값
  "format":        "passport" | "id",
  "gender":        "f" | "m",
  "age":           "baby" | "child" | "teen" | "adult",
  "clothing":      "default" | "change" | "casual" | "suit",
  "clothingColor": "" | "skyblue" | "pink" | "lemon" | "green"
                      | "beige" | "blue" | "wine",
  "suitColor":     "" | "navy" | "brown" | "gray" | "black",
  "shirtColor":    "" | "white" | "lightblue" | "lightpink" | "lightbeige",
  "tieColor":      "" | "notie" | "navy" | "wine" | "black",
  "tiePattern":    "" | "solid" | "stripe",
  "hair":          "default" | "tidy" | "updo",
  "bgColor":       "white" | "gray" | "blue" | "beige",

  // 이미지
  "image":         "base64...",

  // 사용자
  "userId":        "..." | null
}
```

### 5-1. 서버 유효성 검증 규칙

```
format="passport" → bgColor 강제 "white"
age="baby"|"child" → clothing은 "default"|"change"만 허용, hair="default" 강제
clothing="default" → clothingColor/suitColor/shirtColor/tieColor/tiePattern 전부 무시
clothing="change" → clothingColor 필수, suitColor~tiePattern 무시
clothing="casual" → clothingColor 필수, suitColor~tiePattern 무시
clothing="suit" → clothingColor 무시, suitColor/shirtColor 필수, tieColor 필수
tieColor="notie" → tiePattern 무시
```

---

## 6. 서버 프롬프트 빌더 v5 — 레이어 정의

### 레이어 순서

```
IDENTITY_PRESERVATION (고정 — 헌법 9조 구현체)
[IMAGE-TO-IMAGE TRANSFORM]
[1] [FORMAT]     ← format
[2] [SUBJECT]    ← gender + age
[3] [OUTFIT]     ← clothing + 서브옵션
[4] [HAIR]       ← hair (default면 생략)
[5] [BACKGROUND] ← bgColor
[6] [CONSTRAINT] ← 고정
```

### [1] FORMAT 프롬프트

| format | 프롬프트 |
|--------|---------|
| `"passport"` | D7 확정: 표정 지시 포함. "...forehead and eyebrows must be visible, neutral composed expression" |
| `"id"` | 표정 자유. "...approachable yet professional expression" |

### [2] SUBJECT 프롬프트 (gender × age = 8조합)

| gender | age | 프롬프트 |
|--------|-----|---------|
| `"f"` | `"baby"` | `"This person is a baby girl (infant/toddler)."` |
| `"f"` | `"child"` | `"This person is a young girl (child, under 12)."` |
| `"f"` | `"teen"` | `"This person is a teenage girl (13-18)."` |
| `"f"` | `"adult"` | `"This person is an adult woman."` |
| `"m"` | `"baby"` | `"This person is a baby boy (infant/toddler)."` |
| `"m"` | `"child"` | `"This person is a young boy (child, under 12)."` |
| `"m"` | `"teen"` | `"This person is a teenage boy (13-18)."` |
| `"m"` | `"adult"` | `"This person is an adult man."` |

### [3] OUTFIT 프롬프트

#### clothing="default"
```
Keep current clothing as-is. Only ensure it looks neat and tidy.
```

#### clothing="change" (영유아/어린이)
```
Dress this child in a clean {clothingColor} top, age-appropriate and neat.
```

#### clothing="casual" (중고생/성인)
```
Dress this person in a {clothingColor} smart casual top, clean and neat.
```

#### clothing="suit" (중고생/성인)

D3 확정: **성별 무관 넥타이 적용**.

```
남성: Dress this person in a {suitColor} formal business suit with a {shirtColor} dress shirt{tieClause}.
여성: Dress this person in a {suitColor} formal business suit with a {shirtColor} blouse{tieClause}.

tieClause:
  tieColor="notie" → "" (생략)
  tieColor + tiePattern="solid" → " and a solid {tieColor} tie"
  tieColor + tiePattern="stripe" → " and a {tieColor} striped tie"
```

### [4] HAIR 프롬프트

| hair | 프롬프트 |
|------|---------|
| `"default"` | *(생략)* |
| `"tidy"` | `"neatly groomed and tidy hair"` |
| `"updo"` | `"hair styled up neatly (updo)"` |

### [5] BACKGROUND 프롬프트

| bgColor | 프롬프트 |
|---------|---------|
| `"white"` | `"pure white (#FFFFFF) background"` |
| `"gray"` | `"neutral gray (#9CA3AF) studio background"` |
| `"blue"` | `"soft blue (#4A90D9) studio background"` |
| `"beige"` | `"warm beige (#D4B896) studio background"` |

format="passport" → 서버에서 `"white"` 강제 오버라이드.

### [6] CONSTRAINT (고정)
```
Keep the person's face and body exactly the same — only apply the specified styling.
DO NOT change apparent gender or age.
```

---

## 7. 현행(v4) → v5 키 매핑 (전환 기준)

### 삭제 대상 (v4에서 제거)

| v4 키 | 삭제 사유 |
|-------|----------|
| `monkos_purpose` | `monkos_format`으로 대체 |
| `monkos_style` | D2 확정 삭제. PHOTO_SPECS 키 passport/id로 변경 |
| `monkos_expression` | v5에서 표정 옵션 자체 삭제 |
| `monkos_tie` | `monkos_tieColor` + `monkos_tiePattern`으로 분리 |
| `monkos_background` | `monkos_bgColor`로 키 이름 변경 |

### 신설 대상 (v5에서 추가)

| v5 키 | 신설 사유 |
|-------|----------|
| `monkos_format` | purpose 5값 → format 2값 |
| `monkos_suitColor` | 정장 수트 색상 분리 |
| `monkos_shirtColor` | 정장 셔츠 색상 분리 |
| `monkos_tieColor` | tie 합산형에서 분리 |
| `monkos_tiePattern` | tie 합산형에서 분리 |
| `monkos_bgColor` | background에서 키 이름 변경 |
| `monkos_schema_version` | 전환기 구키 정리 메타 키 |

### 값 변경 대상

| 키 | v4 값 | v5 값 |
|-----|-------|-------|
| `monkos_gender` | `"male"` / `"female"` | `"m"` / `"f"` |
| `monkos_age` | 5값 (baby/preschool/elementary/teen/adult) | 4값 (baby/child/teen/adult) |
| `monkos_clothing` | 5값 (as_is/suit/shirt/casual/uniform) | 4값 (default/change/casual/suit) |
| `monkos_clothingColor` | 7값 (black/navy/charcoal/white/beige/wine/pastel) | 8값 (영유아4+캐주얼4) |
| `monkos_hair` | 4값 (as_is/tidy/up/down) | 3값 (default/tidy/updo) |

---

## 8. PHOTO_SPECS 키 변경 (D2 적용)

### 현행
```javascript
const PHOTO_SPECS = {
  id_photo: { width: 413, height: 531, ... },  // 3.5×4.5cm
  resume:   { width: 354, height: 472, ... },  // 3×4cm
};
```

### v5
```javascript
const PHOTO_SPECS = {
  passport: { width: 413, height: 531, ... },  // 3.5×4.5cm
  id:       { width: 354, height: 472, ... },  // 3×4cm
};
```

영향 범위: config.js, result.js(규격 크롭), thankyou.js(규격 표시), camera.js WS(set-style → set-format)

---

## 9. 빅뱅 전환 안전장치

### prep.js init() — 구키 정리 가드

```javascript
const SCHEMA_VERSION = 'v5';
if (sessionStorage.getItem('monkos_schema_version') !== SCHEMA_VERSION) {
  ['monkos_purpose', 'monkos_style', 'monkos_expression',
   'monkos_tie', 'monkos_background'].forEach(k => sessionStorage.removeItem(k));
  sessionStorage.setItem('monkos_schema_version', SCHEMA_VERSION);
}
```

### camera.js init() — 필수값 체크

```javascript
// v4: if (!store.style || !purpose) → redirect
// v5: if (!store.format) → redirect
if (!store.format) {
  navigateTo('prep.html');
  return;
}
```

### 서버 하위호환 (48시간)

```javascript
// server.js /api/idgen
const schemaVersion = body.v || 4;
const instruction = schemaVersion >= 5
  ? buildPromptV5(body)
  : buildPrompt(body);  // 48시간 후 제거
```

### 배포 규칙

- 심야 배포 (03:00~06:00 KST)
- 원자적 배포: prep.js + camera.js + result.js + shared.js + config.js + server.js 한 커밋
- 부분 배포 금지

---

## 10. 실행 로드맵

```
Phase 0: 레거시 선행 정리 (D6)
  → portal auth.js monkos_user 4줄 삭제
  → 프로덕션 1~2일 검증

Phase 1: v5 구현 (본 스키마 기준)
  → 막내별 영역 분담 (별도 지시서)
  → charge.html 신규 생성
  → 로그인 게이트 구현 (D5)

Phase 2: 통합 검증
  → sessionStorage 키 전수 검증
  → 크레딧 플로우 E2E
  → 프롬프트 생성 품질 검증

Phase 3: 빅뱅 배포
  → 심야 원자적 배포
  → 서버 하위호환 48시간 유지
  → 48시간 후 buildPrompt() 제거
```

---

**— iMac/쌍아 스키마 확정 문서 작성 완료 —**

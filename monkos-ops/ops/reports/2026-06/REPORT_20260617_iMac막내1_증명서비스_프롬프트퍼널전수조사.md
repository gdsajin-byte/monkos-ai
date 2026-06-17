---
type: report
date: 2026-06-17
device: iMac
agent: 막내1
portfolio: PF_IDPHOTO, PF_STUDIO, PF_PROFILES
status: 완료
---

# 증명사진 서비스 전수조사 — 축 1(프롬프트) + 축 2(퍼널)

> **[2026-06-17 13:14 KST] iMac/막내1 → 작가님**
> 지시서: ORDER_20260617_iMac쌍아_막내_증명서비스_전수조사.md

---

## 축 1: 프롬프트 전수조사

### 1-1. 여성 정장 버그 — 정밀 분석

**결론: v5 리라이트에서 gender 분기가 탈락한 regression 버그.**

`buildPromptV5()` (KR server.js:302~313, JP 동일):
```javascript
} else if (clothing === 'suit') {
    const suit = suitColor || 'navy';
    const shirt = shirtColor || 'white';
    // ... tie 로직 ...
    const top = 'collared dress shirt';   // ← gender-blind 하드코딩
    parts.push(`[OUTFIT] Dress this person in a ${suit} formal business suit with a ${shirt} ${top}${tieClause}.`);
}
```

**여성이 suit 선택 시 생성되는 프롬프트:**
```
[SUBJECT] This person is an adult woman.
[OUTFIT] Dress this person in a navy formal business suit with a white collared dress shirt and a solid navy tie.
```

- `top` 변수가 `'collared dress shirt'`로 고정 (line 309). 여성에게도 남성 복장 표현 적용.
- SUBJECT에서 "adult woman"이라 하면서 OUTFIT에서 "collared dress shirt"는 남성 코딩 → 모델 해석이 비결정적.

**레거시(idgen.js)에서는 gender 분기가 있었음:**
```javascript
// 레거시 getOutfitPrompt() (idgen.js:48~54)
adult: { outfit: gender === 'female'
  ? 'a clean white blouse with regular collar under dark navy or black business jacket'
  : 'a dark navy or black formal business suit with white dress shirt and solid-color subtle tie'
}
```
→ 여성: `blouse` + `business jacket`, 남성: `formal business suit` + `dress shirt`. **v5 리라이트 시 이 분기가 소멸.**

**SCHEMA_v5 스펙에도 분기 명시 (§6-3 OUTFIT):**
- 남성: `Dress this person in a {suitColor} formal business suit with a {shirtColor} dress shirt{tieClause}.`
- 여성: `Dress this person in a {suitColor} formal business suit with a {shirtColor} blouse{tieClause}.`

→ 스펙 대비 구현 미반영.

**해결 방향 제안:**
```javascript
// gender 기반 상의 분기
const top = gender === 'f' ? 'blouse' : 'collared dress shirt';
```
- 넥타이 기본값도 여성은 `'notie'`로 분기하는 것이 자연스러움
- 추가로 여성 전용 clothing 옵션(블라우스 단독 등) 검토 가능하나 스코프 확대 → 별도 지시서

---

### 1-2. 8조합(gender × age) × clothing × expression 전수 검증

#### SUBJECT_MAP 8키 (KR server.js:283~291)

| 키 | 프롬프트 |
|---|---|
| f-baby | This person is a baby girl (infant/toddler). |
| f-child | This person is a young girl (child, under 12). |
| f-teen | This person is a teenage girl (13-18). |
| f-adult | This person is an adult woman. |
| m-baby | This person is a baby boy (infant/toddler). |
| m-child | This person is a young boy (child, under 12). |
| m-teen | This person is a teenage boy (13-18). |
| m-adult | This person is an adult man. |

Fallback: 매칭 실패 시 `'This person is an adult.'` (gender-neutral).

#### 서버 미검증 조합 (프론트에서만 제어)

프론트엔드 `CLOTHING_BY_AGE` (config.js:115~120)가 age별 clothing을 제한하지만, **서버에는 검증 없음**. API 직접 호출 시 모든 조합 허용:

| 조합 | 생성되는 프롬프트 | 문제 |
|---|---|---|
| baby + suit | `Dress this person in a navy formal business suit...` | 영아에게 정장 → **부조리** |
| baby + casual | `Dress this person in a beige smart casual top...` | 영아에게 캐주얼 → 부적절 |
| child + suit | `Dress this person in a navy formal business suit...` | 12세 미만에게 정장 → 부적절 |
| teen + change | `Dress this child in a clean white top...` | "this child"로 호칭 → 사소 |
| **adult + change** | **`Dress this child in a clean white top...`** | **성인을 "this child"로 호칭 → 버그** |

→ `clothing === 'change'` 분기(line 297)가 `"Dress this child"` 하드코딩. adult가 change를 선택하면 성인을 아이로 호칭하는 프롬프트 생성.

**인크루트 B2B 납품 관점**: 외부 파트너가 API를 직접 호출할 경우 프론트엔드 제한이 무의미. 서버 사이드 age/clothing 유효성 검증 필요.

#### Expression

EXPRESSION_PROMPTS 4종 (KR server.js:252~257):

| 키 | 프롬프트 |
|---|---|
| gentle_smile | relaxed pleasant expression with naturally soft eyes, at ease, quiet warmth in face |
| neutral | natural calm resting face with soft relaxed eyes, at ease and composed |
| natural_smile | gently pleasant face with warm relaxed eyes, approachable and at ease |
| bright_smile | warm friendly expression with bright relaxed eyes, naturally pleasant |

- v5 UI에서 expression 선택 삭제됨 (SCHEMA §0 D7). 서버는 여전히 수신하며 미전송 시 `gentle_smile` 기본값.
- baby에게 `bright_smile` 적용도 기술적으로 가능하나, 영아 사진 결과에 부자연스러울 수 있음 (미미한 이슈).

---

### 1-3. 프롬프트 품질 평가

**양호:**
- IDENTITY_PRESERVATION (line 188~207): 90% 보존 / 10% 보정 원칙 명확. "This is ME, but on my best day" 지시문 효과적.
- CONSTRAINT (line 339): "DO NOT change apparent gender or age" 명시적 안전장치.
- 배경색 hex 코드 명시 (#FFFFFF, #4A90D9 등) — 모델에 구체적 지시.

**개선 필요:**
- `casual` 분기(line 299): `"smart casual top"` — 구체적 의복 지시가 부족. "top"이 너무 범용.
- `change` 분기(line 297): 아동 전용 의도이나 `"this child"` 하드코딩으로 age 범용성 없음.
- 넥타이 패턴: `'solid'`/`'stripe'`만 존재. 여성에게 적합한 스카프/보타이 등 미지원.

---

### 1-4. KR vs JP 동기화 상태

**buildPromptV5**: KR/JP **바이트 동일**. 모든 버그 양쪽 동일.

**차이점 (의도적):**

| 항목 | KR | JP |
|---|---|---|
| STYLE_PROMPTS `id` | Korean job application (이력서) | Japanese job application (履歴書) |
| COACHING 언어 | 한국어 | 일본어 |
| PRECHECK_MODELS | `['gemini-2.5-flash', 'gemini-2.5-flash-lite']` (2개 + fallback) | `['gemini-2.5-flash']` (1개) |
| Pre-check 임계값 | score >= 60 | score >= 70 |
| Pre-check 항목 | 4항목 | 8항목 (귀 체크 등 포함) |
| face detection | 주석처리/deprecated | 함수 잔존 (한국어 프롬프트 텍스트 사용) |
| cropToSpec | 미import | import됨 |

**비의도적 차이:**
- JP `detectFace()` 함수(line 480~526)에 **한국어 프롬프트** 텍스트 잔존 — 일본어 미번역.

---

### 1-5. Dead Code 목록

다음 상수는 KR/JP 양쪽에서 **선언만 되고 참조 없음** (buildPromptV5가 인라인 로직 사용):

| 상수 | Lines (KR) | 대체 |
|---|---|---|
| STYLE_PROMPTS | 210~213 | buildPromptV5 인라인 FORMAT |
| BG_PROMPTS (6색) | 216~223 | buildPromptV5 인라인 BG_MAP (4색) |
| CLOTHING_PROMPTS | 225~231 | buildPromptV5 인라인 if/else |
| CLOTHING_COLOR_PROMPTS | 233~241 | buildPromptV5 raw 변수 사용 |
| TIE_PROMPTS | 243~250 | buildPromptV5 인라인 tie 로직 |
| HAIR_PROMPTS | 259~264 | buildPromptV5 인라인 HAIR_MAP |

**활성**: EXPRESSION_PROMPTS, IDENTITY_PRESERVATION 2개만 buildPromptV5가 참조.

**BG_PROMPTS vs BG_MAP 불일치**: 상위 상수에 pink/yellow 2색이 있으나 실제 BG_MAP에는 없음 → 도달 불가.

---

## 축 2: 퍼널·UX 전수조사

### 2-1. 사용자 퍼널 (idphoto-kr)

MPA 6페이지 구조:

```
index.html (랜딩) → prep.html (4단계 옵션) → camera.html (촬영+AI코칭) → result.html (분석+생성+미리보기) → thankyou.html (다운로드) → crop.html (선택적 크롭)
```

**prep.html 내부 4단계:**
1. **Format**: passport / id 카드 선택
2. **Profile**: Gender(f/m 카드) + Age(baby/child/teen/adult) 선택
3. **Style**: 아코디언 UI — Clothing / Hair / Background
4. **Confirm**: 선택 요약 + "촬영 시작하기"

**Gender 선택**: prep.js page 2에서 `👩 여성` / `👨 남성` 카드 버튼. 필수 선택(미선택 시 다음 단계 진행 불가).

### 2-2. Gender 전달 경로

```
prep.html (store.gender = 'f'|'m')
    ↓ sessionStorage
camera.html (통과)
    ↓ sessionStorage
result.html → API POST /api/idgen
    body: { gender: 'f'|'m', ... }
        ↓
server.js buildPromptV5()
    SUBJECT_MAP[`${gender}-${age}`]
```

**API 전송 파라미터 전체** (result.js:238~253):
```
image, format, gender, age, clothing, clothingColor,
suitColor, shirtColor, tieColor, tiePattern,
hair, bgColor, userId, v
```

gender는 **별도 파라미터**로 전송. clothing에 임베딩되지 않음.

### 2-3. 의상 옵션 UI — Gender 비인식

**config.js:115~120 `CLOTHING_BY_AGE`:**
```javascript
{
  baby: ['default', 'change'],
  child: ['default', 'change'],
  teen: ['default', 'casual', 'suit'],
  adult: ['default', 'casual', 'suit'],
}
```

→ **age 기반만 분기, gender 무관.** 여성 adult도 남성 adult와 동일한 clothing 선택지.

**여성이 suit 선택 시 UI:**
- suit 서브옵션: 정장색(navy/brown/gray/black), 셔츠색(white/lightblue/lightpink/lightbeige), 넥타이색(notie/navy/wine/black), 넥타이패턴(solid/stripe)
- **남성과 완전 동일한 옵션** — 여성 전용 옵션(블라우스, 스커트 수트 등) 없음
- 넥타이 기본값: `'navy'` (prep.js:449) → **여성도 기본 넥타이 착용으로 시작**
- 의류 미리보기 이미지 없음 — 텍스트 레이블 + 색상 칩만

**Hair 옵션:**
- teen/adult만 표시 (config.js:123 `HAIR_VISIBLE_AGES`)
- 선택지: 그대로(default), 깔끔 정리(tidy), 올림머리(updo)
- gender 무관 — "updo"가 여성에 더 자연스럽지만 남성에게도 노출

### 2-4. 에러 핸들링 UX

| 단계 | 실패 시 UX | 비고 |
|---|---|---|
| Pre-check (result.js:204~218) | 점수+제안 표시, "재촬영을 권장합니다" + 재촬영/리터칭 버튼. 강제 진행 가능 | 양호 |
| 생성 실패 (result.js:299~320) | shimmer 해제, 에러 메시지 표시, step 2 버튼 재표시 | 양호 |
| HTTP 402 (크레딧 부족) | 충전 모달 표시, step 2로 복귀 | 양호 |
| 생성 실패 시 크레딧 | 서버 사이드 자동 환불 (server.js:604) | 양호 |
| 다운로드 실패 (result.js:458~462) | 에러 로그, 다운로드 버튼 재활성화 | 양호 |

**재시도 흐름**: "재촬영" → prep.html(풀 리셋), "리터칭" → 동일 사진으로 재생성. 전반적으로 양호.

### 2-5. KR vs JP 차이 (퍼널)

| 항목 | KR | JP |
|---|---|---|
| 결제 | Toss Payments (KRW) | Lemon Squeezy (JPY) |
| 가격 | 9,900원 기본 | 990엔 기본 |
| OAuth | Google + Kakao + LINE | Google + Kakao + LINE |
| 법적 페이지 | terms.html | terms.html + tokusho.html (特商法) |
| 옵션 구조 | 동일 | 동일 |
| 프롬프트 | 동일 (buildPromptV5) | 동일 |

→ 퍼널·UX 구조 동일. 언어·결제만 차이.

### 2-6. IDPASS 앱

**별도 제품**. AI 생성 서비스가 아닌 **오프라인 크롭 도구**.

- Gender 선택 없음
- API 호출 없음 (온디바이스 ML Kit SelfieSegmenter + FaceDetector)
- 의상/스타일/표정 옵션 없음
- 플로우: 국가/문서 선택 → 사진 업로드 → 배경 제거 + 색상 선택 → 크롭 → 출력

→ 이번 조사 범위에서 gender/프롬프트 관련 이슈 없음.

---

## 종합 발견 사항

### 버그/결함 (수정 필요)

| # | 심각도 | 내용 | 위치 |
|---|---|---|---|
| 1 | 🔴 | **여성 정장 프롬프트 미분기** — `'collared dress shirt'` 하드코딩. 레거시에서 있던 gender 분기가 v5에서 탈락 | server.js:309 |
| 2 | 🟡 | **adult + change 프롬프트**: 성인을 `"this child"`로 호칭 | server.js:297 |
| 3 | 🟡 | **서버 사이드 age/clothing 유효성 미검증**: baby+suit 등 부조리 조합 허용 | server.js 전체 |
| 4 | 🟡 | **여성 suit 넥타이 기본값 navy**: `'notie'`가 아닌 `'navy'`가 기본 | prep.js:449 |

### 구조적 이슈 (인크루트 납품 전 검토)

| # | 내용 | 영향 |
|---|---|---|
| 5 | UI 의상 옵션이 gender 무인식 — 여성에게 남성 동일 옵션 노출 | UX 품질 |
| 6 | 의류 미리보기 이미지 부재 — 텍스트+칩만으로 선택 | UX 품질 |
| 7 | Dead code 6종 (STYLE/BG/CLOTHING/TIE/HAIR_PROMPTS) | 유지보수 혼란 |
| 8 | BG_PROMPTS(6색) vs BG_MAP(4색) 불일치 — pink/yellow 도달 불가 | 기능 누락 |
| 9 | JP detectFace() 한국어 프롬프트 잔존 | 미미 |

### 해결 방향 제안

**#1 여성 정장 (즉시 수정 가능):**
```javascript
const top = gender === 'f' ? 'blouse' : 'collared dress shirt';
```
+ 넥타이 기본값 분기: 여성 `'notie'`, 남성 `'navy'`

**#2 adult + change:**
```javascript
const label = (age === 'baby' || age === 'child') ? 'this child' : 'this person';
parts.push(`[OUTFIT] Dress ${label} in a clean ${clothingColor || 'white'} top, age-appropriate and neat.`);
```

**#3 서버 유효성 검증:**
```javascript
const VALID_CLOTHING = { baby: ['default','change'], child: ['default','change'], teen: ['default','casual','suit'], adult: ['default','casual','suit'] };
if (!VALID_CLOTHING[age]?.includes(clothing)) return res.status(400).json({error: 'invalid clothing for age'});
```

**#4~6**: UI 개선 — 별도 디자인/기획 필요.

---

*read-only 조사 완료. 코드 수정 없음.*

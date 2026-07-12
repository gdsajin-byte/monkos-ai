---
type: order
date: 2026-07-12
device: iMac
agent: 쌍아
recipient: 막내1
portfolio: PF_SPECS
status: 대기
depends_on: ORDER_20260712_iMac쌍아_막내_SPECS_T1의상선택UI
---

# 추가 지시서: 피사체 선택 칩 추가 + 의상 선택 인라인화

**[2026-07-12 13:58 KST]** iMac/쌍아 → 막내1

---

## 목적

dev 00096에 올린 T1 의상 선택 UI(v2-phase-attire)를 기반으로 두 가지 개선:
1. **피사체 선택 칩 추가** — 성별 × 연령을 하드코딩('m','adult')에서 유저 선택으로 전환
2. **의상 선택을 별도 phase에서 pay phase 안으로 인라인** — 컨테이너 전환 1회 절감

---

## ⚠️ 준수 조항

- ch2: 순수 JS, Tailwind, 한국어 UI
- ch5 2조: 배포는 deploy.sh 경유
- ch7: 범위 밖은 금지하되, 아래 4항 서버 수정은 본건 범위에 포함.

---

## 1. 피사체 선택 칩 (신규)

### 위치
의상 선택 영역의 **위에** 배치. "찍힌 분" 라벨 아래 칩 행.

### 구조
```
찍힌 분
  연령: (성인) (청소년) (영유아)     ← 칩, 기본값: 성인
  성별: (남성) (여성)               ← 칩, 기본값 없음 (필수 선택)
```

### 동작
- 연령 "영유아" 선택 시: 성별 행 숨김 (영유아 증명사진에 성별 무관)
- 연령 변경 시: 의상 선택지 연동 전환
  - 성인/청소년: 현재 4카드 (그대로/정장/블라우스/캐주얼)
  - 영유아: 의상 선택 자체 비활성 (영유아는 의상 교체 불필요)

### API 연결
현재 하드코딩 (render-specs.js:3506):
```js
var body = { image: uploadedBase64, format: CFG.format, gender: 'm', age: 'adult', slug: CFG.slug };
```

변경:
```js
var body = { image: uploadedBase64, format: CFG.format, gender: subjectSelection.gender, age: subjectSelection.age, slug: CFG.slug };
```

서버 `buildPromptV5` (idphoto-kr/server.js:274)의 SUBJECT_MAP이 이미 gender×age 8조합을 처리하므로 서버 수정 불필요.
portal 서버의 `buildT1Prompt`(idphoto-generate.js:136)도 gender/age를 외부에서 받아 프롬프트에 [SUBJECT]를 이미 삽입 중.

### 상태 변수
```js
var subjectSelection = { age: 'adult', gender: null };
```

---

## 2. 의상 선택 인라인화

### 현재 구조 (phase 분리)
```
fit → [v2-phase-attire] → [v2-phase-pay]
```

### 변경 구조 (pay 안에 인라인)
```
fit → [v2-phase-pay 안에 피사체 칩 + 의상 칩 + 결제 카드]
```

### 구체 작업
1. `v2-phase-attire`의 의상 선택 HTML/JS를 **v2-phase-pay** 안에 이동
   - 오른쪽 영역(결제 카드들 위)에 배치
   - 레이아웃 순서: 피사체 칩 → 의상 선택 → 결제 카드
2. `v2-phase-attire` div 제거 (빈 phase 남기지 않음)
3. `showPhase` 배열에서 `phaseAttire` 제거
4. `proceedToPay`에서 attire phase 우회 로직 제거 — pay phase가 직접 의상 포함하므로

### 의상 선택 표현
- 아코디언 또는 열린 상태의 컴팩트 칩 형태
- 기본 "그대로" 선택 상태로 열림 (유저가 바꾸고 싶으면 탭)
- 요약 1줄은 결제 버튼 바로 위에 표시: "네이비 정장 · 화이트 셔츠 · 노타이"

---

## 4. 서버 수정 — buildT1Prompt에 gender/age 전달 (민아 검증 보완)

**문제**: `buildT1Prompt(attireDesc)`가 `[SUBJECT] This person is an adult.` **고정**.
클라가 gender/age를 보내도 T1 프롬프트에 반영 안 됨 → 여성 선택해도 성별 미명시, 청소년 선택해도 "adult" 고정.

### 수정 1: idphoto-generate.js:136

```js
// 변경 전
export function buildT1Prompt(attireDesc) {
  // ...
  [SUBJECT] This person is an adult.

// 변경 후
export function buildT1Prompt(attireDesc, opts) {
  const gender = opts?.gender || '';
  const age = opts?.age || 'adult';
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
  const subjectText = SUBJECT_MAP[`${gender}-${age}`] || 'This person is an adult.';
  // ...
  [SUBJECT] ${subjectText}
```

### 수정 2: server.js:770

```js
// 변경 전
const t1Prompt = buildT1Prompt(attireDesc);

// 변경 후
const t1Prompt = buildT1Prompt(attireDesc, { gender, age });
```

영유아 선택 시 IDENTITY_PRESERVATION_BABY 적용도 검토할 것 (현재 T0에서만 분기).

---

## 5. T0 무료 경로 처리

- 피사체 칩(성별/연령)은 **T0 무료에서도 노출** — 단, **미선택 통과 허용** (기본값 adult/성별 생략으로 서버 전송). 무료 퍼널에 필수 입력 추가하면 0단 전환 원칙과 충돌.
- **T1 결제 직전**: 피사체 미선택 시 선택 확정 게이트 (필수)
- 의상 선택은 기존대로 **T1 유료에서만 노출** (`CFG.t1 === true`)

---

## 참조 파일

| 파일 | 위치/줄 |
|------|--------|
| 현재 의상 phase | render-specs.js:2256~2291 (v2-phase-attire) |
| 하드코딩 gender/age | render-specs.js:3506 |
| 의상 JS 로직 | render-specs.js:3204~3300 (attire phase 이벤트) |
| 서버 SUBJECT_MAP | idphoto-kr/server.js:289 (8조합 참조용, 수정 불필요) |
| buildT1Prompt | portal/lib/idphoto-generate.js:136 (수정 불필요) |

---

## 검증 기준

1. [ ] 성인 남성 선택 → 정장 차콜 → 생성 결과에 남성 수트 반영
2. [ ] 성인 여성 선택 → 블라우스 크림 → 생성 결과에 여성 블라우스 반영
3. [ ] 청소년 선택 → 캐주얼 니트 → 생성 결과 연령대 반영
4. [ ] 영유아 선택 → 의상 선택 비활성 → gender: null 또는 생략
5. [ ] T0 무료: 피사체 칩 노출 ✅, 의상 선택 미노출 ✅
6. [ ] T1 유료: 피사체 칩 + 의상 선택 모두 노출 ✅
7. [ ] phase 전환: fit → pay (attire phase 없이 직행) ✅
8. [ ] 모바일 375px 레이아웃 정상

---

## 산출물

- render-specs.js 수정 (피사체 칩 + 의상 인라인)
- dev 배포 후 E2E 스크린샷 (성인남/성인여/영유아 각 1종)
- COMPLETION 보고서

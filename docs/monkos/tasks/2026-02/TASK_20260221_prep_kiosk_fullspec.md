# 지시서: 준비실 키오스크 퍼널 풀스펙 구현

```
[2026-02-21 03:33 KST] M1/쌍아 → 막내
```

## 역할 선언

> **너는 "막내"다. 쌍아가 아니다.**
> - 완료 보고: `{디바이스}/막내 → M1/쌍아` 형식

## 작전 개요

| 항목 | 내용 |
|------|------|
| **작전명** | 준비실 키오스크 퍼널 — 9필드 풀스펙 |
| **작업 경로** | `MONK_kr/ai_lab/photolab/` |
| **수정 파일** | `prep.html`, `prep.js`, `app.css` |
| **신규 파일** | 없음 (기존 파일 확장만) |
| **브랜치** | `develop` |
| **설계 원문** | `docs/monkos/DESIGN_20260219_prep_room_schema.md` |

## 0원칙

> **monkos_AI/ 수정 금지.** (프로덕션 동결)
> **monk.js, shared.js, config.js 수정 금지.** (공통 모듈 보호)
> **camera.html, result.html 등 다른 페이지 수정 금지.**
> 작업 범위: `prep.html` + `prep.js` + `app.css` 3파일만.

---

## 배경

현재 준비실은 4스텝(용도→성별→연령→확인)으로 구현됨.
설계서는 **카드 스키마 9필드 + 조건부 스킵 + 디폴트 테이블**을 요구함.
"준비한 만큼 결과가 좋아진다" — 1회 정밀 생성 원칙에 부합하는 정밀 세팅 퍼널로 확장.

---

## 구현 상세

### Phase 1: 퍼널 스텝 확장 (9스텝 + FINAL)

현재 4스텝을 아래 구조로 확장한다.

```
STEP 1: 용도 (purpose)         — 필수, 5개 카드
STEP 2: 연령 (age)             — 필수, 용도별 필터링
STEP 3: 성별 (gender)          — 필수 (36개월 미만 스킵 가능)
STEP 4: 의상 타입 (clothing)   — 필수, 디폴트 "그대로"
STEP 5: 의상 컬러 (clothingColor) — 조건부: 의상≠그대로
STEP 6: 넥타이 (tie)           — 조건부: 남성 + 정장/셔츠
STEP 7: 헤어 (hair)            — 필수, 디폴트 "그대로"
STEP 8: 배경색 (background)    — 조건부: 용도별 선택지 다름
STEP 9: 표정 (expression)      — 조건부: 용도별 선택지 다름
FINAL:  카드 확인 → [촬영 시작하기]
```

**조건부 스텝 규칙:**
- 해당 안 되면 **자동 스킵** (UI에 아예 안 보임)
- 디폴트가 세팅된 스텝은 디폴트 카드가 미리 선택된 상태 + [다음] 버튼 표시
- 사용자가 [다음]만 누르면 디폴트 그대로 진행

---

### Phase 1-1: 용도 (STEP 1)

기존 2분류 → 5분류 확장:

| 값 | 카드 제목 | 아이콘 | 설명 |
|----|----------|--------|------|
| `passport` | 여권 / 신분증 | 📋 | 규격 엄격 · 눈썹 이마 노출 |
| `student_id` | 학생증 | 🎓 | 교복 권장 · 중간 자유도 |
| `employee_id` | 사원증 | 🏢 | 정장 권장 · 중간 자유도 |
| `resume` | 이력서 | 💼 | 호감형 · 높은 자유도 |
| `color_portrait` | 컬러증명 | 🎨 | 최대 자유도 |

---

### Phase 1-2: 연령 (STEP 2) — 용도별 필터링

5단계 연령:

| 값 | 카드 제목 | 아이콘 |
|----|----------|--------|
| `baby` | ~36개월 | 👶 |
| `preschool` | 4~7세 | 🧒 |
| `elementary` | 초등학생 | 👦 |
| `teen` | 중고등학생 | 🧑 |
| `adult` | 성인 | 👤 |

**용도별 필터링** (설계서 2-2 참조):

| 용도 | 표시되는 연령 |
|------|-------------|
| 여권/신분증 | 전체 5개 |
| 학생증 | 초등, 중고등 |
| 사원증 | 성인만 |
| 이력서 | 중고등, 성인 |
| 컬러증명 | 전체 5개 |

사원증 선택 시 연령은 `adult` 자동 세팅 → STEP 2 스킵.

---

### Phase 1-3: 성별 (STEP 3)

기존과 동일 (남성/여성).
36개월 미만(`baby`) 선택 시 성별 스킵 가능 — [건너뛰기] 버튼 추가, gender=null 허용.

---

### Phase 1-4: 의상 타입 (STEP 4)

| 값 | 카드 제목 | 아이콘 |
|----|----------|--------|
| `as_is` | 그대로 | 👕 |
| `suit` | 정장 | 🤵 |
| `shirt` | 셔츠 / 블라우스 | 👔 |
| `casual` | 캐주얼 | 🧥 |
| `uniform` | 교복 | 🎽 |

**용도별 필터링** (설계서 2-4 참조):

| 용도 | 표시되는 의상 |
|------|-------------|
| 여권/신분증 | 그대로, 정장, 셔츠, 캐주얼 |
| 학생증 | 그대로, 캐주얼, 교복 |
| 사원증 | 그대로, 정장, 셔츠, 캐주얼 |
| 이력서 | 그대로, 정장, 셔츠 |
| 컬러증명 | 전체 5개 |

디폴트: **"그대로" 미리 선택** + [다음] 버튼. 사용자가 다른 카드 탭하면 변경됨.

---

### Phase 1-5: 의상 컬러 (STEP 5) — 조건부

**조건**: 의상 ≠ `as_is` 일 때만 표시. `as_is`면 스킵.

| 값 | 카드 제목 |
|----|----------|
| `black` | 검정 |
| `navy` | 네이비 |
| `charcoal` | 차콜 / 회색 |
| `white` | 흰색 |
| `beige` | 베이지 |
| `wine` | 와인 |
| `pastel` | 파스텔 |

여권 선택 시 흰색/베이지/파스텔에 ⚠️ 표시 (배경과 유사, 비권장).

---

### Phase 1-6: 넥타이 (STEP 6) — 조건부

**조건**: 성별=남성 AND 의상=정장 or 셔츠 일 때만. 그 외 스킵.

| 값 | 카드 제목 |
|----|----------|
| `none` | 없음 |
| `solid_navy` | 무지 네이비 |
| `solid_wine` | 무지 와인 |
| `stripe_blue` | 스트라이프 블루 |
| `stripe_navy` | 스트라이프 네이비 |
| `stripe_wine` | 스트라이프 와인 |

---

### Phase 1-7: 헤어 (STEP 7)

| 값 | 카드 제목 | 아이콘 |
|----|----------|--------|
| `as_is` | 그대로 | 💇 |
| `tidy` | 정돈 | ✂️ |
| `up` | 올림머리 | 💆 |
| `down` | 내림머리 | 🧑‍🦱 |

디폴트: **"그대로" 미리 선택** + [다음] 버튼.

---

### Phase 1-8: 배경색 (STEP 8) — 조건부

여권(KR)일 때 흰색 고정 → 스킵.
그 외 용도는 선택지 표시:

| 용도 | 선택지 |
|------|--------|
| 여권(KR) | 스킵 (흰색 고정) |
| 이력서 | 흰색, 블루, 그레이, 베이지, 핑크 |
| 컬러증명 | 흰색, 블루, 그레이, 베이지, 핑크, 옐로우 |
| 학생증/사원증 | 흰색, 블루, 그레이 |

배경색 카드는 **컬러 칩** 스타일 (원형 색상 표시).

---

### Phase 1-9: 표정 (STEP 9) — 조건부

여권이면 선택지 제한:

| 값 | 카드 제목 | 여권 허용 |
|----|----------|:---:|
| `gentle_smile` | 잔잔한 미소 | ✅ |
| `neutral` | 무표정 | ✅ |
| `natural_smile` | 자연스러운 미소 | ✕ |
| `bright_smile` | 밝은 미소 | ✕ |

여권: 잔잔한미소 + 무표정만 표시.
그 외: 전체 4개 표시.

---

### Phase 1-10: FINAL (확인 화면)

현재 구현된 요약 카드를 9필드로 확장:

```
📋 여권 / 신분증
👤 성인 · 남성
🤵 정장 · 네이비
👔 스트라이프 블루 넥타이
💇 그대로
🎨 흰색 배경
😊 잔잔한 미소
```

- 각 항목 탭하면 해당 스텝으로 점프 (수정 가능)
- 하단: [촬영 시작하기] CTA + [처음부터 다시] 리셋

---

### Phase 2: 데이터 구조

#### selections 객체 확장

```js
const selections = {
  purpose: null,      // passport | student_id | employee_id | resume | color_portrait
  age: null,          // baby | preschool | elementary | teen | adult
  gender: null,       // male | female | null(baby)
  clothing: null,     // as_is | suit | shirt | casual | uniform
  clothingColor: null, // black | navy | charcoal | white | beige | wine | pastel
  tie: null,          // none | solid_navy | solid_wine | stripe_blue | stripe_navy | stripe_wine
  hair: null,         // as_is | tidy | up | down
  background: null,   // white | blue | gray | beige | pink | yellow
  expression: null,   // gentle_smile | neutral | natural_smile | bright_smile
};
```

#### sessionStorage 전달

`saveSessionData()`로 9필드 전부 저장. camera.html에서 읽을 수 있도록.

기존 `style`/`gender`/`age` 키와의 **하위 호환**:
- `purpose` → 기존 `style` 키에도 매핑 (`passport`/`student_id` → `id_photo`, `resume`/`color_portrait` → `resume`)
- camera.js가 `store.style`로 읽으므로, 양쪽 다 저장

---

### Phase 3: 조건부 스킵 엔진

```js
function getNextStep(current) {
  let next = current + 1;
  while (next <= TOTAL_STEPS && shouldSkip(next)) {
    next++;
  }
  return next > TOTAL_STEPS ? FINAL_STEP : next;
}

function shouldSkip(step) {
  // STEP 5 (의상 컬러): 의상 == as_is면 스킵
  // STEP 6 (넥타이): 성별≠male || 의상≠suit,shirt면 스킵
  // STEP 8 (배경): 여권(KR)이면 스킵 (흰색 고정)
  // STEP 9 (표정): 필요에 따라... (기본 표시)
  // 사원증 → 연령 스킵 (adult 자동)
}
```

뒤로가기(`kioskBack`)에서도 동일 스킵 로직 적용 (역방향).

---

### Phase 4: 디폴트 테이블

설계서 3장의 디폴트 테이블을 JS 객체로 구현:

```js
const DEFAULTS = {
  kr: {
    passport: {
      clothing: 'as_is', hair: 'as_is', background: 'white', expression: 'gentle_smile'
    },
    resume: {
      male: { clothing: 'suit', clothingColor: 'navy', tie: 'stripe_navy', hair: 'as_is', expression: 'natural_smile' },
      female: { clothing: 'as_is', hair: 'as_is', expression: 'natural_smile' }
    },
    student_id: {
      clothing: 'as_is', hair: 'as_is', expression: 'gentle_smile'
    },
    color_portrait: {
      clothing: 'as_is', hair: 'as_is'
    }
  }
};
```

디폴트가 있는 스텝에 진입하면:
1. 해당 디폴트 카드에 `selected` 클래스 미리 적용
2. [다음] 버튼 표시 (자동 전진 아님 — 사용자가 확인하고 넘김)
3. 다른 카드 탭하면 디폴트 해제 + 새 선택 → 자동 전진 (기존 동작)

---

### Phase 5: UI/CSS

#### 기존 유지
- 카드 탭 → 글로우 + 1.02x 스케일 → 350ms 후 자동 전진
- 좌우 슬라이드 애니메이션
- 프로그레스 도트 (스텝 수에 맞게 확장, 스킵된 스텝 제외)
- 뒤로 버튼

#### 추가 필요
- **[다음] 버튼**: 디폴트 스텝에서만 표시. "이대로 진행" 텍스트
- **[건너뛰기] 버튼**: 성별 스텝 baby 시 표시
- **배경색 카드**: 원형 컬러칩 스타일 (카드 내에 CSS background-color)
- **⚠️ 비권장 표시**: 여권+흰색의상 등 조합에 경고 텍스트
- **프로그레스 도트 동적 렌더링**: 조건부 스킵에 따라 도트 수 변동
- **FINAL 요약에서 항목 탭 → 해당 스텝 점프**

---

## 기존 키 매핑 (하위 호환)

| 신규 key | 기존 store key | 매핑 규칙 |
|----------|---------------|----------|
| `purpose` | `style` | passport,student_id→id_photo / resume,employee_id,color_portrait→resume |
| `age` | `age` | baby,preschool→child / elementary,teen→teen / adult→adult |
| `gender` | `gender` | 동일 |

camera.js/result.js가 기존 `store.style`, `store.age` 값을 참조하므로 양쪽 다 저장할 것.

---

## 완료 조건

### Level 1 (필수)
- [ ] 9스텝 + FINAL 퍼널 동작
- [ ] 조건부 스킵 정상 작동 (의상컬러/넥타이/배경/표정)
- [ ] 용도별 연령 필터링 정상 작동
- [ ] 디폴트 테이블 적용 (KR)
- [ ] sessionStorage 9필드 저장 + 기존 키 하위 호환
- [ ] camera.html 이동 후 정상 작동 (기존 플로우 깨지지 않음)
- [ ] 뒤로가기 + 리셋 정상 작동

### Level 2 (권장)
- [ ] 프로그레스 도트 동적 렌더링 (스킵 스텝 제외)
- [ ] FINAL 요약에서 항목 탭 → 해당 스텝 점프
- [ ] 배경색 카드 컬러칩 스타일
- [ ] 비권장 조합 ⚠️ 경고 표시
- [ ] 이전 방문 데이터 복원 → FINAL 직행

### Level 3 (보너스)
- [ ] 슬라이드 트랜지션 부드러움 검증 (Safari/Chrome)
- [ ] 접근성: 카드 포커스 + 키보드 네비게이션

---

## 참조 문서

- **설계 원문**: `docs/monkos/DESIGN_20260219_prep_room_schema.md`
- **기술 명세**: `MONK_kr/ai_lab/photolab/TECH_SPEC_MPA.md`
- **현재 구현**: `MONK_kr/ai_lab/photolab/prep.html`, `prep.js`
- **공통 모듈**: `MONK_kr/ai_lab/photolab/shared.js` (수정 금지, import만)
- **프레임워크**: `MONK_kr/ai_lab/photolab/monk.js` (수정 금지)

---

## 주의사항

1. **사이드 챗봇은 이 지시서 범위 밖.** 퍼널 UI 완성 후 별도 지시서.
2. **locale은 KR 고정.** JP 분기는 후속 작업.
3. `shared.js`의 `store` 키 추가가 필요하면 `prep.js` 내에서 `store.purpose = null` 등으로 직접 세팅. shared.js 파일 자체는 수정하지 않는다.
4. 기존 `kiosk-*` CSS 클래스명 패턴 유지. 신규 클래스도 `kiosk-` 접두사.

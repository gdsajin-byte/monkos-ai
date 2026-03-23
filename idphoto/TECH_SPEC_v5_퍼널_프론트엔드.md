---
type: tech_spec
date: "2026-03-02"
from: iMac/막내1
subject: v5 퍼널 프론트엔드 기술명세
status: 확정
references:
  - monkos-ops/03_개발/SCHEMA_v5_확정.md
  - monkos-ops/03_개발/MONKOS_퍼널_UI기획안_v5_쌍아전달.md
---

# v5 퍼널 프론트엔드 기술명세

> **[2026-03-02 19:03 KST] iMac/막내1 작성**
> 정본: `SCHEMA_v5_확정.md` > 본 문서 > UI기획안

---

## 1. 아키텍처 개요

```
prep.html ─── prep.js ───┐
                          ├─ shared.js (store + 헬퍼)
                          ├─ config.js (V5_OPTIONS + 상수)
                          │
camera.html ─ camera.js ──┤
                          │
result.html ─ result.js ──┤
                          │
thankyou.html─thankyou.js─┤
                          │
charge.html ─ charge.js ──┘
```

### 파일별 역할

| 파일 | 역할 | v5 변경 |
|------|------|---------|
| `config.js` | 환경설정 + 상수 | V5_OPTIONS, CLOTHING_BY_AGE, HAIR_VISIBLE_AGES, PASSPORT_FORCED_BG, SCHEMA_VERSION 추가. PHOTO_SPECS 키 passport/id |
| `shared.js` | store + 인증 + 크레딧 + 세션 헬퍼 | store 11필드, saveSelections/clearSelections, sharedInit v5 복원 |
| `prep.js` | 퍼널 (옵션 선택) | **전면 재작성** — 9스텝 키오스크 → 4페이지 선형 |
| `camera.js` | 촬영실 (WebSocket 코칭) | set-format, FORMAT_LABELS, 필수값 체크 간소화 |
| `result.js` | 생성 결과 + 다운로드 | v5 키 연결 (막내2 영역) |
| `thankyou.js` | 수령처 (갤러리 저장) | USAGE_GUIDE 2키, specInfo format 참조 |
| `charge.html` | 충전 풀페이지 | 신규 (막내3, 모달→페이지 전환) |
| `app.css` | 전체 스타일 | 키오스크 CSS → v5 prep CSS 교체 |

---

## 2. 데이터 흐름

### 2-1. store ↔ sessionStorage ↔ UI

```
[prep.js]                [shared.js]              [sessionStorage]
  store.format ←──────── sharedInit() restore ←── monkos_format
  store.gender             (11키 자동 복원)         monkos_gender
  store.age                                        monkos_age
  store.clothing                                   monkos_clothing
  store.clothingColor                              monkos_clothingColor
  store.suitColor                                  monkos_suitColor
  store.shirtColor                                 monkos_shirtColor
  store.tieColor                                   monkos_tieColor
  store.tiePattern                                 monkos_tiePattern
  store.hair                                       monkos_hair
  store.bgColor                                    monkos_bgColor
       │
       └──── saveSelections() ───────────────────→ sessionStorage 일괄 저장
       └──── clearSelections() ──────────────────→ sessionStorage 일괄 삭제 + store 초기화
```

### 2-2. 페이지 간 데이터 전달

```
prep.js                     camera.js                   result.js
  ↓ saveSelections()          ↓ sharedInit() 복원          ↓ sharedInit() 복원
  ↓ navigateTo(camera)       ↓ store.format 체크          ↓ store.format 체크
  sessionStorage 11키    →   sessionStorage 11키    →   sessionStorage 11키
                              ↓ saveSessionData           ↓ /api/idgen v5 body
                              ('captured', base64)          { v:5, format, gender, ... }
```

### 2-3. 구키 정리 가드 (SCHEMA §9)

```javascript
// shared.js sharedInit() 내부 — 모든 페이지 진입 시 1회 실행
if (loadSessionData('schema_version') !== 'v5') {
  ['monkos_purpose', 'monkos_style', 'monkos_expression',
   'monkos_tie', 'monkos_background'].forEach(k => sessionStorage.removeItem(k));
  saveSessionData('schema_version', 'v5');
}
```

---

## 3. prep.js — 4페이지 퍼널 구조

### 3-1. 페이지 라우팅

```
currentPage: 0=format, 1=profile, 2=style, 3=confirm
PAGES: ['format', 'profile', 'style', 'confirm']

showPage(idx)  → .prep-page active 토글 + 프로그레스 바 업데이트
nextPage()     → 유효성 검증 → showPage(currentPage + 1)
prevPage()     → showPage(currentPage - 1)
```

### 3-2. 1p — 규격 선택

```
카드 2개: passport (🛡️ 여권/신분증) | id (📋 증명사진)
선택 → store.format = val
```

### 3-3. 2p — 성별 + 연령

```
성별 2카드: f (👩 여성) | m (👨 남성)  → store.gender
연령 4카드: baby (👶) | child (🧒) | teen (🎒) | adult (🙂)  → store.age

연령 변경 시 clothing/hair/서브옵션 전부 초기화
```

### 3-4. 3p — 스타일 (아코디언)

```
openAccordion: null | 'clothing' | 'hair' | 'bg'

┌─ 👕 의상 ──────── [그대로] ─── ▼ ──┐
│  clothing 카드 (CLOTHING_BY_AGE)    │
│  서브옵션 (조건부)                    │
├─ 💇 헤어 ──────── [그대로] ─── ▼ ──┤  ← teen/adult만
│  hair 카드 3종                      │
├─ 🎨 배경 ──────── [흰색] ──── ▼ ──┤  ← passport면 잠금
│  bgColor 카드 4종                   │
└─────────────────────────────────────┘
```

#### 의상 서브옵션 분기

| clothing | 서브옵션 |
|----------|---------|
| `default` | 없음 |
| `change` (baby/child) | clothingColor 4색 (skyblue/pink/lemon/green) |
| `casual` (teen/adult) | clothingColor 4색 (beige/blue/wine/green) |
| `suit` (teen/adult) | suitColor 4색 + shirtColor 4색 + tieColor 4종 + tiePattern 2종 |

#### suit 디폴트

```
clothing 변경 → suit 선택 시 자동 세팅:
  suitColor: 'navy'
  shirtColor: 'white'
  tieColor: 'navy'
  tiePattern: 'solid'
```

#### tieColor = 'notie' → tiePattern 숨김

### 3-5. 4p — CONFIRM

```
요약 행: 규격 | 인물(성별·연령) | 의상 | 헤어(teen/adult) | 배경
각 행 클릭 → jumpTo(pageIdx) 해당 페이지 이동

코칭멘트 분기:
  baby   → "아이를 안고 촬영해도 됩니다"
  child  → "정면을 바라보도록 유도해 주세요"
  passport(teen/adult) → "눈썹 · 이마가 보이도록 준비해 주세요"
  id(teen/adult)       → "좋은 인상의 표정으로 촬영해 주세요"

CTA: "촬영 시작하기" → saveSelections() → navigateTo('camera.html')
```

---

## 4. 조건부 표시 규칙

### 4-1. 연령별 clothing 허용값 (CLOTHING_BY_AGE)

| age | 허용 clothing |
|-----|--------------|
| baby / child | default, change |
| teen / adult | default, casual, suit |

### 4-2. 연령별 hair 동작 (HAIR_VISIBLE_AGES)

| age | hair |
|-----|------|
| baby / child | `'default'` 고정 (UI 숨김) |
| teen / adult | 유저 선택 (default/tidy/updo) |

### 4-3. format별 배경 (PASSPORT_FORCED_BG)

| format | bgColor |
|--------|---------|
| passport | `'white'` 고정 (아코디언 잠금) |
| id | 유저 선택 (white/gray/blue/beige) |

### 4-4. 조합 매트릭스

```
영유아/어린이 + 여권:   의상(default/change) + bgColor=white 고정
영유아/어린이 + 증명:   의상(default/change) + bgColor(4색)
중고생/성인   + 여권:   의상(default/casual/suit) + hair(3종) + bgColor=white 고정
중고생/성인   + 증명:   의상(default/casual/suit) + hair(3종) + bgColor(4색)
```

---

## 5. camera.js — v5 연결 포인트

### 5-1. WS 코칭 초기화

```javascript
wsCoaching.send(JSON.stringify({
  type: 'set-format',          // v4: 'set-style'
  format: store.format || 'passport',  // v4: store.style || 'id_photo'
}));
```

### 5-2. 필수값 체크

```javascript
// v5: sharedInit()에서 11필드 이미 복원됨
if (!store.format) {
  navigateTo('prep.html');
  return;
}
// v4: store.style + purpose 수동 로딩 26행 → 삭제
```

### 5-3. 선택 요약 뱃지

```javascript
FORMAT_LABELS: { passport: '여권사진', id: '증명사진' }
gender: 'm'→'남성', 'f'→'여성'
age: AGE_LABELS 추가 표시
```

---

## 6. thankyou.js — v5 연결 포인트

### 6-1. 규격 정보

```javascript
const format = loadSessionData('format');  // v4: loadSessionData('style')
const spec = PHOTO_SPECS[format];          // v4: PHOTO_SPECS[style]
```

### 6-2. 활용 가이드

```javascript
USAGE_GUIDE = {
  passport: ['여권 신청', '비자 신청', '주민등록증/운전면허증'],
  id: ['이력서/자기소개서', '학생증/사원증 발급', 'SNS 프로필/명함'],
};
// v4: purpose 5키 (passport/student_id/employee_id/resume/color_portrait) → v5: format 2키
```

---

## 7. CSS 구조 (app.css)

### v5 prep 섹션 (v4 키오스크 대체)

```
/* === v5 퍼널 (4페이지 선형) === */
#prep-progress     프로그레스 바 (연속형, 25%씩)
#prep-pages        페이지 컨테이너 (absolute, active 토글)
.prep-page-inner   센터링 래퍼
.prep-label        STEP 라벨
.prep-question     질문 타이틀
.prep-cards        카드 컨테이너 (col/row/row2/grid 변형)
.prep-card         선택 카드 (selected: accent 보더)
.prep-color-chip   컬러 칩 (원형)
.accordion-*       아코디언 (header/body/item)
.prep-sub-label    서브옵션 라벨
.prep-locked-msg   잠금 안내 (여권 배경)
#prep-nav          하단 네비 (이전/다음)
.prep-summary-*    CONFIRM 요약
.prep-start        촬영 시작 버튼 (그라디언트)
.prep-reset        리셋 버튼
```

### 보존된 섹션 (변경 없음)

```
/* 헤더 */           #header, .brand, #step-label
/* 카메라 */         #camera-area, #face-guide, #coaching-overlay
/* 결과 */           #result-overlay, .photo-compare, #qc-badge
/* 수령처 */         #thankyou-screen, .ty-*
/* 컨트롤 */         #controls, #btn-capture
/* 크레딧 모달 */    #credit-modal, .credit-*
/* 데스크탑 차단 */  #desktop-blocker
/* 챗봇 */           .chat-bubble
```

---

## 8. sessionStorage 키 전체 목록 (v5)

| # | 키 | 쓰기 | 읽기 | 비고 |
|---|-----|------|------|------|
| 1 | `monkos_format` | prep.js | camera/result/thankyou | 필수 |
| 2 | `monkos_gender` | prep.js | camera/result | 필수 |
| 3 | `monkos_age` | prep.js | result | 필수 |
| 4 | `monkos_clothing` | prep.js | result | default |
| 5 | `monkos_clothingColor` | prep.js | result | 조건부 |
| 6 | `monkos_suitColor` | prep.js | result | 조건부 |
| 7 | `monkos_shirtColor` | prep.js | result | 조건부 |
| 8 | `monkos_tieColor` | prep.js | result | 조건부 |
| 9 | `monkos_tiePattern` | prep.js | result | 조건부 |
| 10 | `monkos_hair` | prep.js | result | default |
| 11 | `monkos_bgColor` | prep.js | result | white |
| 12 | `monkos_captured` | camera.js | result.js | base64 |
| 13 | `monkos_generated` | result.js | result.js | base64 |
| 14 | `monkos_cropped` | result.js | thankyou.js | base64 |
| 15 | `monkos_pending_action` | result.js | result.js | string |
| 16 | `_mo_p` | result.js | result.js | 난독화 |
| 17 | `monkos_schema_version` | shared.js | shared.js | 'v5' |

---

## 9. v4 삭제 키 (구키 정리 대상)

| v4 키 | 삭제 사유 |
|-------|----------|
| `monkos_purpose` | `monkos_format`으로 대체 |
| `monkos_style` | D2 삭제. PHOTO_SPECS 키 passport/id |
| `monkos_expression` | v5 표정 옵션 삭제 |
| `monkos_tie` | tieColor + tiePattern으로 분리 |
| `monkos_background` | bgColor로 키 이름 변경 |

---

**— iMac/막내1 기술명세 작성 완료 —**

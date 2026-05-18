---
type: order
from: iMac/쌍아
to: iMac/막내
date: 2026-03-18
status: 대기
---

# [지시서] Studio v2 Phase A — SPA 레이아웃 + 퍼널 복원

> **[2026-03-18 17:42 KST] iMac/쌍아 → iMac/막내**
> 기안서: `monkos-ops/ops/proposals/PROPOSAL_20260318_스튜디오v2_T2I+I2I_SPA기안서.md`
> Phase A: v1(멀티 페이지) → v2(데스크탑 SPA) 전환 + idphoto-kr 퍼널 복원

---

## 개요

현재 studio v1은 app.html → result.html 페이지 전환 방식이고, 의상/헤어/배경 퍼널이 삭제되어 있음.
Phase A에서 **한 페이지 3컬럼 SPA**로 전환하고, idphoto-kr의 퍼널 옵션을 복원.

---

## 1. 레이아웃 구조

### 파일: `monkos_AI/studio/public/app.html` (전면 교체)

```
┌──────────────────────────────────────────────────────────────┐
│  MONKOS Studio                                    INTERNAL  │
├──────────┬────────────────────────────┬───────────────────────┤
│ SIDEBAR  │     WORKSPACE             │    ARCHIVE (후속)     │
│ (260px)  │     (1fr)                  │    (280px, 빈 패널)   │
│          │                            │                       │
│ 파일입력  │  ┌────────┬────────┐       │  (Phase C에서 구현)   │
│ 드래그/선택│ │ BEFORE │ AFTER  │       │  지금은 빈 컨테이너  │
│          │  │        │        │       │                       │
│ ─────── │  └────────┴────────┘       │                       │
│ 규격     │                            │                       │
│ 성별     │  [다시] [After↓] [B/A↓]    │                       │
│ 연령     │                            │                       │
│ ─────── │                            │                       │
│ 의상     │                            │                       │
│  그대로   │                            │                       │
│  의상변경▸│                            │                       │
│  캐주얼▸ │                            │                       │
│  정장▸   │                            │                       │
│ ─────── │                            │                       │
│ 헤어     │                            │                       │
│  그대로   │                            │                       │
│  깔끔정리 │                            │                       │
│  올림머리 │                            │                       │
│ ─────── │                            │                       │
│ 배경     │                            │                       │
│  흰/회/파 │                            │                       │
│          │                            │                       │
│ [생성]   │                            │                       │
└──────────┴────────────────────────────┴───────────────────────┘
```

### CSS 그리드

```css
.studio-layout {
  display: grid;
  grid-template-columns: 260px 1fr 280px;
  min-height: 100vh;
}

@media (max-width: 1024px) {
  .studio-layout {
    grid-template-columns: 260px 1fr;  /* 아카이브 숨김 */
  }
}
```

---

## 2. 좌측 사이드바 (260px)

### 2-1. 파일 입력 영역 (상단)
- 드래그앤드롭 + `<input type="file">` 버튼 — v1에서 가져오기
- 업로드 즉시 중앙 BEFORE에 표시
- 기존 v1 로직 유지

### 2-2. 퍼널 옵션 (idphoto-kr prep.js에서 이식)

**참조 파일**:
- `monkos_AI/idphoto-kr/public/prep.html` (UI 구조)
- `monkos_AI/idphoto-kr/public/prep.js` (로직, 라인 210-425)

**이식할 옵션들**:

| 옵션 | 타입 | 값 |
|------|------|-----|
| format | 라디오 | passport, id |
| gender | 라디오 | f, m |
| age | 라디오 | adult, teen, child, baby |
| clothing | 아코디언 | default, change, casual, suit |
| clothingColor | 컬러칩 (clothing=change/casual 시) | 7가지 |
| suitColor | 컬러칩 (clothing=suit 시) | navy, black, charcoal 등 |
| shirtColor | 컬러칩 (clothing=suit 시) | white, lightblue 등 |
| tieColor | 컬러칩 (clothing=suit 시) | 선택 |
| tiePattern | 라디오 (clothing=suit 시) | solid, stripe, dot |
| hair | 라디오 | default, tidy, updo (teen/adult만) |
| bgColor | 컬러칩 | white, gray, blue, beige (id만, passport=white 고정) |

**조건부 표시**:
- clothing=suit → 정장 세부 옵션 펼침
- age=baby/child → hair 숨김
- format=passport → bgColor 숨김 (white 고정)

### 2-3. [생성] 버튼
- 사이드바 하단 고정 (sticky)
- 클릭 → `/api/idgen` 호출 (기존 v1 result.js 로직 통합)
- Before 이미지 없으면 비활성화

---

## 3. 중앙 워크스페이스 (1fr)

### 3-1. Before / After 나란히
- 2컬럼 flex (50/50)
- Before: 업로드된 이미지 표시
- After: 생성 결과 표시 (생성 전: "생성 대기" placeholder)
- 프로그레스: After 영역에 로딩 스피너 + 상태 메시지

### 3-2. 하단 버튼
- [다시 하기] — Before 유지, After 초기화, 사이드바 옵션 유지
- [After 다운로드] — After 이미지만 JPEG
- [비교 컷 다운로드] — Canvas 합성 B/A 나란히 (v1 로직 재사용)

---

## 4. 우측 아카이브 (280px) — Phase C 대비

- **이번 Phase에서는 빈 패널만 생성** (placeholder)
- `<div class="archive-panel"><p>아카이브 (준비 중)</p></div>`
- Phase C에서 GCS/Firestore 연동하여 히스토리 카드 채움

---

## 5. 로직 통합 (app.js 전면 재작성)

### 기존 v1 파일 구조
```
studio/public/
├── app.html    ← 전면 교체
├── app.js      ← 전면 재작성
├── result.html ← 삭제 (SPA에 통합)
├── result.js   ← 삭제 (app.js에 통합)
└── style.css   ← 3컬럼 그리드 CSS 추가
```

### app.js 구조
```javascript
// 1. 파일 입력 핸들러 (v1에서 가져오기)
// 2. 퍼널 옵션 상태 관리 (prep.js에서 이식)
// 3. [생성] 클릭 → /api/idgen 호출 (result.js에서 통합)
//    - 모든 옵션 필드 전달 (clothing, hair, bgColor 등)
//    - 하드코딩 'default' 제거
// 4. 결과 표시 → After 영역에 렌더링
// 5. 다운로드 (After / 비교 컷)
```

---

## 6. 서버 변경

### server.js 수정 (최소)
- `/` → `app.html` 서빙 (기존)
- `/result` 라우트 제거 (SPA이므로 불필요)
- `/api/idgen` 유지 (기존)
- **photo.js 수정 금지**

---

## 7. 주의 사항

- ⚠️ **photo.js 수정 금지** — 프롬프트 빌더 + I2I 파이프라인 정본
- ⚠️ **idphoto-kr 원본 수정 금지** — prep.js에서 UI/로직 복사만
- ⚠️ 기존 v1의 `/api/idgen` 엔드포인트 + 비교 컷 Canvas 로직 재사용
- ⚠️ 아카이브 패널은 빈 컨테이너만 — Phase C 대비
- 헌법 제4조: API 키 하드코딩 금지

---

## 8. 검증

- [ ] 파일 업로드 → Before 표시
- [ ] 규격/성별/연령/의상/헤어/배경 전체 옵션 선택 가능
- [ ] clothing=suit → 정장 세부 옵션 펼침
- [ ] [생성] → After 표시 (photo.js I2I 정상 동작)
- [ ] 의상 옵션이 실제 결과에 반영됨 (default vs suit 비교)
- [ ] [After 다운로드] / [비교 컷 다운로드] 정상
- [ ] 3컬럼 레이아웃 — 데스크탑 정상
- [ ] dev 배포 확인

---

## 완료 보고

커밋 해시 + dev 배포 URL.
형식: `✅❌💡⏳📁🔀`

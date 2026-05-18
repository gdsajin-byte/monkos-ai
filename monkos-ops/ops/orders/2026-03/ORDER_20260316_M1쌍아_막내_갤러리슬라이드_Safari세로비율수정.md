---
type: order
from: M1/쌍아
to: 막내(any)
date: 2026-03-16
status: pending
---

# [2026-03-16 04:27 KST] M1/쌍아 → 막내

## 지시서: 갤러리 슬라이드 — Safari 세로 비율 수정 (보정)

> 이전 지시서(자동스크롤 삭제 + 모바일 비율)의 **보정 지시서**.
> JS 삭제는 완료됨. CSS 비율 문제가 Safari 전체(데스크탑+iOS)에서 발생 확인.

### 원인 분석
- Chrome: `.gi`의 `height: 160px` 정상 반영 → 세로
- **Safari(데스크탑+iOS)**: `overflow-x: auto` flex 컨테이너 안에서 자식의 명시 `height`를 무시 → 가로로 찌그러짐
- 모바일만의 문제가 아니라 **Safari 렌더링 버그** — 부모(`.gallery-track`)에 명시 높이가 없기 때문

### 작업 대상 파일

| 파일 | 변경 내용 |
|------|----------|
| `monkos_AI/portal/public/css/portal.css` | `.gallery-track`에 높이 명시 + 모바일 보정 |

### 상세 지시

#### portal.css 수정

**① `.gallery-track` 규칙에 높이 추가** (224행 부근)

변경 전:
```css
.gallery-track {
  display: flex; gap: 8px; padding: 0 24px;
  overflow-x: auto; scrollbar-width: none; scroll-behavior: smooth;
}
```

변경 후:
```css
.gallery-track {
  display: flex; gap: 8px; padding: 0 24px;
  overflow-x: auto; scrollbar-width: none; scroll-behavior: smooth;
  height: 160px;
}
```

**② `@media (max-width: 768px)` 블록 — `.gallery-track` 높이도 추가**

기존에 추가한 `.gi` 규칙은 유지하고, `.gallery-track` 높이 보정 추가:

```css
.gallery-track { height: 140px; }
.gi { min-width: 100px; height: 140px; }
```

### 완료 조건

- [ ] **Safari 데스크탑**에서 갤러리 아이템 세로 비율 표시
- [ ] **iOS Safari**에서 갤러리 아이템 세로 비율 표시
- [ ] Chrome 데스크탑 기존 세로 비율 유지 (regression 없음)
- [ ] 수동 좌우 스크롤 정상 동작

### 검증 방법
1. Safari 데스크탑에서 `monkos.ai` 접속 → 갤러리 스트립 세로 확인
2. iPhone Safari에서 동일 확인
3. Chrome에서 기존과 동일한지 확인

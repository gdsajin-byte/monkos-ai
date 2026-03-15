---
type: order
from: M1/쌍아
to: 막내(any)
date: 2026-03-16
status: pending
---

# [2026-03-16 04:38 KST] M1/쌍아 → 막내

## 지시서: 갤러리 슬라이드 — Safari 세로비율 2차 수정

> 1차 보정(`gallery-track height` 명시)으로 Safari 해결 안 됨.
> Safari는 flex+overflow 컨테이너에서 자식의 `height`를 무시함.
> **`aspect-ratio`로 전환하여 확실히 해결.**

### 작업 대상 파일

| 파일 | 변경 내용 |
|------|----------|
| `monkos_AI/portal/public/css/portal.css` | `.gi`를 `aspect-ratio: 3/4` 방식으로 전환 |

### 상세 지시

#### ① `.gi` 규칙 변경 (230행 부근)

변경 전:
```css
.gi {
  min-width: 120px; height: 160px;
  border-radius: 6px; overflow: hidden;
  border: 1px solid var(--border); background: var(--white);
  flex-shrink: 0; position: relative; cursor: pointer;
  transition: all .2s;
}
```

변경 후:
```css
.gi {
  width: 120px; aspect-ratio: 3/4;
  border-radius: 6px; overflow: hidden;
  border: 1px solid var(--border); background: var(--white);
  flex-shrink: 0; position: relative; cursor: pointer;
  transition: all .2s;
}
```

핵심 변경:
- `min-width: 120px` → `width: 120px` (고정 폭)
- `height: 160px` → `aspect-ratio: 3/4` (높이 자동 계산 = 160px)

#### ② `.gallery-track` height 제거 (226행)

1차 보정에서 추가한 `height: 160px` 삭제 — `aspect-ratio`가 높이를 결정하므로 불필요.

변경 전:
```css
.gallery-track {
  display: flex; gap: 8px; padding: 0 24px;
  overflow-x: auto; scrollbar-width: none; scroll-behavior: smooth;
  height: 160px;
}
```

변경 후:
```css
.gallery-track {
  display: flex; gap: 8px; padding: 0 24px;
  overflow-x: auto; scrollbar-width: none; scroll-behavior: smooth;
}
```

#### ③ 모바일 미디어쿼리 수정 (`@media max-width: 768px`)

변경 전:
```css
.gallery-track { height: 140px; }
.gi { min-width: 100px; height: 140px; }
```

변경 후:
```css
.gi { width: 100px; }
```

- `gallery-track height` 삭제
- `.gi`는 `width`만 오버라이드 — `aspect-ratio: 3/4` 상속으로 높이 자동 (= 133px)

### 완료 조건

- [ ] **Safari 데스크탑**에서 갤러리 아이템 세로(3:4) 비율
- [ ] **iOS Safari**에서 갤러리 아이템 세로(3:4) 비율
- [ ] Chrome 데스크탑 동일 비율 유지
- [ ] 수동 좌우 스크롤 정상 동작
- [ ] 배포 후 실기기(iPhone) 확인

### 배포
- 커밋+push 후 `deploy.sh` 실행

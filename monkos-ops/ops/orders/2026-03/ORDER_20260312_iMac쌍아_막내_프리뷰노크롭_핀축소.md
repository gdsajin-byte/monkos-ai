---
type: ORDER
date: 2026-03-12
issuer: iMac/쌍아
receiver: iMac/막내
subject: 프리뷰 클라이언트 크롭 제거 + 크롭앱 핀/스케일 시각 축소
priority: P1
category: 프론트엔드
---

# 지시서: 프리뷰 클라이언트 크롭 제거 + 크롭앱 핀/스케일 시각 축소

> **[2026-03-12 16:42 KST]** iMac/쌍아 → iMac/막내
> 출처: 작가님 프로덕션 테스트 피드백

---

## 이슈 1: result.js 프리뷰 — 클라이언트 크롭 제거

### 문제
서버 자동크롭은 제거했으나, **result.js 260-268행**에서 `media.crop()`으로 클라이언트 크롭이 여전히 동작. 프리뷰와 비교컷에 크롭본이 표시됨.

### 방침
프리뷰/땡큐에서는 **노크롭 원본(보정본)**만 표시. 크롭은 크롭앱에서만.

### 변경 — result.js 260-268행

```javascript
// 현재 (260-268행)
// 크롭 프리뷰 (서버 워터마크본 기반)
const spec = PHOTO_SPECS[store.format];
let croppedPreview = genResult.image;
try {
  const cropResult = await media.crop(genResult.image, spec);
  croppedPreview = cropResult.dataUrl;
} catch (e) {
  Monk.log('프리뷰 크롭 실패, 풀 워터마크 사용');
}

// 변경 — 크롭 제거, 원본 그대로 표시
const spec = PHOTO_SPECS[store.format];
let croppedPreview = genResult.image; // 노크롭 원본 그대로
```

→ `media.crop()` 호출 블록(try-catch) 전체 삭제. 변수명 `croppedPreview`는 하위 참조가 많으므로 유지 (리네이밍은 불필요).

### 추가 — 비교컷 레이블 변경 (284-286행)

```javascript
// 현재
const label = document.querySelector('#photo-generated-wrap .label');
if (label) label.textContent = spec.name;  // → "여권사진 (35x45mm)" 등

// 변경 — "AI 보정" 표시 (크롭이 아니므로)
if (label) label.textContent = 'AI 보정';
```

---

## 이슈 2: 크롭앱 — 정수리 핀 + 스케일 핸들 시각 크기 축소

### 방침
시각적으로 **많이** 줄이되, 터치 히트 영역은 현재 크기(약 50px) 유지.

### A. 정수리 핀 (crop.css .pin-crown)

```css
/* 현재 */
.pin-crown {
  width: 20px; height: 20px; /* ... */
  padding: 15px; margin: -15px;
  /* ... */
  font-size: 11px;
}

/* 변경 — 시각 12px, 히트 50px 유지 */
.pin-crown {
  width: 12px; height: 12px; cursor: ns-resize;
  padding: 19px;      /* (50-12)/2 = 19 */
  margin: -19px;
  box-sizing: content-box;
  display: flex; align-items: center; justify-content: center;
  font-size: 8px; color: #fff; font-weight: 800;
  text-shadow: 0 1px 2px rgba(0,0,0,0.6);
}
```

### B. 스케일 핸들 (crop.css .scale-handle)

```css
/* 현재 */
.scale-handle {
  width: 30px; height: 30px; border-radius: 8px;
  /* ... */
  font-size: 12px;
  padding: 10px; margin: -10px;
}

/* 변경 — 시각 18px, 히트 50px 유지 */
.scale-handle {
  position: absolute; transform: translate(-50%,-50%);
  width: 18px; height: 18px; border-radius: 6px;
  background: var(--accent); border: 2px solid #fff;
  cursor: nwse-resize; z-index: 22; pointer-events: auto;
  display: flex; align-items: center; justify-content: center;
  font-size: 9px; color: #fff; font-weight: 900;
  padding: 16px;      /* (50-18)/2 = 16 */
  margin: -16px;
  box-sizing: content-box;
}
```

### C. 정수리 핀 위치 오프셋 조정 (crop.js render() 내)

현재 `crownPin.style.top = (pts.crown.y - 10) + 'px'` — 핀 크기가 줄었으므로 오프셋도 조정:
```javascript
// 현재 (235행)
crownPin.style.top = (pts.crown.y - 10) + 'px';

// 변경 — 핀 시각 12px의 절반 = 6
crownPin.style.top = (pts.crown.y - 6) + 'px';
```

힌트 위치도 조정:
```javascript
// 현재 (241-242행)
hint.style.left = (pts.crown.x + 14) + 'px';
hint.style.top = (pts.crown.y - 10) + 'px';

// 변경
hint.style.left = (pts.crown.x + 10) + 'px';
hint.style.top = (pts.crown.y - 6) + 'px';
```

---

## ⚠️ 준수 조항

- **헌법 6조**: API 키/인프라 수정 금지
- result.js의 `media` 객체 자체는 삭제하지 않음 (thankyou.js에서 다운로드 시 toJpeg 사용 중)

## 커밋 + 배포

- 1커밋으로 합쳐서 push
- 배포는 작가님 지시 대기

---

**— 지시서 끝 —**

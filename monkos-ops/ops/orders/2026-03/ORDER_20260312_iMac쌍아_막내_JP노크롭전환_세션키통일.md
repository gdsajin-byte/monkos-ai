---
type: ORDER
date: 2026-03-12
issuer: iMac/쌍아
receiver: iMac/막내
subject: JP 노크롭 전환 + 세션키 KR 통일
priority: P0
category: 서버+프론트엔드
---

# 지시서: JP 노크롭 전환 + 세션키 KR 통일

> **[2026-03-12 19:02 KST]** iMac/쌍아 → iMac/막내
> KR 커밋 `058da0c` + `a36a835`와 동일한 변경을 JP에 적용.
> 서버크롭 제거 + 세션 데이터 키 `cropped` → `image` 통일.

---

## 배경

KR은 3/12 오후에 노크롭 전환 완료:
- 서버 `cropToSpec` 제거 → 노크롭 원본 반환
- 응답 키 `cropped` → `image`
- 세션키 `monkos_cropped` → `monkos_image` 통일
- 크롭은 크롭앱(crop.html)에서만 수행

JP는 아직 서버크롭 + 옛 세션키 상태. 크롭앱은 이미 `monkos_image`를 읽으므로 키 불일치로 이미지 로드 실패.

---

## 변경 1: server.js — 서버크롭 제거 + 응답키 변경

### 740행 부근 (`/api/download` 엔드포인트)

```javascript
// 현재
// 顔検出 + Signed URL 並列発行
const [faceBox, originalUrl] = await Promise.all([
  detectFace(buffer),
  getSignedUrl(gcsPath),
]);

// 顔座標基準 精密クロップ (faceBox nullならフォールバック)
const croppedBuffer = await cropToSpec(buffer, format || 'passport', faceBox);

log(`[Download] ${userId} → ${gcsPath} (${format || 'passport'}, face=${!!faceBox})`);
res.json({
  success: true,
  cropped: `data:image/png;base64,${croppedBuffer.toString('base64')}`,
  originalUrl,
  credits: creditResult.credits,
});

// 변경 — KR 동일 (노크롭 원본 반환)
const [buffer, originalUrl] = await Promise.all([
  downloadFromGCS(gcsPath),
  getSignedUrl(gcsPath),
]);

log(`[Download] ${userId} → ${gcsPath} (ノークロップ原本)`);
res.json({
  success: true,
  image: `data:image/png;base64,${buffer.toString('base64')}`,
  originalUrl,
  credits: creditResult.credits,
  format: format || 'passport',
});
```

> `detectFace`, `cropToSpec` 호출 삭제. `downloadFromGCS`는 이미 윗줄에서 호출 중이면 중복 확인 후 정리.
> 응답 키: `cropped` → `image`

---

## 변경 2: result.js — 세션키 변경

### 440행: saveSessionData

```javascript
// 현재
saveSessionData('cropped', data.cropped);

// 변경
saveSessionData('image', data.image);
```

### 357행: generateCompareImage 내 참조

```javascript
// 현재
const cropped = loadSessionData('cropped');

// 변경
const cropped = loadSessionData('image');
```

---

## 변경 3: thankyou.js — 세션키 변경

### 4행: 주석

```javascript
// 현재
// * データ: sessionStorage (monkos_cropped, monkos_compare, monkos_originalUrl, monkos_format)

// 변경
// * データ: sessionStorage (monkos_image, monkos_compare, monkos_originalUrl, monkos_format)
```

### 41행: loadSessionData

```javascript
// 현재
const cropped = loadSessionData('cropped');

// 변경
const cropped = loadSessionData('image');
```

---

## 변경 4: camera.js — sessionStorage 키

### 318행

```javascript
// 현재
sessionStorage.removeItem('monkos_cropped');

// 변경
sessionStorage.removeItem('monkos_image');
```

---

## 변경 5: shared.js — clearSessionImages

### 319행

```javascript
// 현재
sessionStorage.removeItem('monkos_cropped');

// 변경
sessionStorage.removeItem('monkos_image');
```

---

## ⚠️ 준수 조항

- **헌법 6조**: API 키/인프라 수정 금지. server.js의 env/키 관련 코드 변경 없음.
- server.js에서 `cropToSpec` import는 남겨도 됨 (다른 곳에서 사용 가능). `/api/download` 내 호출만 제거.
- `detectFace` 호출도 크롭 목적이었으므로 함께 제거.

## 커밋 + 배포

- 1커밋으로 push
- 배포는 작가님 지시 대기

---

**— 지시서 끝 —**

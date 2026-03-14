# 지시서: idgen.js 핫픽스 — photo.js 패턴 정합

[2026-02-19 14:55 KST] iMac/쌍아 → 막내(any)

## 역할 선언
> **너는 "막내"다. 쌍아가 아니다.**
> - 쌍아 = VSCode 전략실 (이 지시서를 작성한 에이전트)
> - 막내 = iTerm 터미널 (이 지시서를 실행하는 너)
> - 완료 보고: `{디바이스}/막내N → iMac/쌍아` 형식

---

## 증상

monk.kr/ai_lab/photolab/ 에서 증명사진 생성 시:
```
생성 실패: The string did not match the expected pattern
```

## 원인 분석

`idgen.js`가 동작 중인 `photo.js`와 2가지 차이:

### 차이 1: `responseModalities` (핵심 원인 추정)

```js
// photo.js (동작 O) — responseModalities 없음
generationConfig: {
  imageConfig: { aspectRatio }
}

// idgen.js (동작 X) — responseModalities 있음
generationConfig: {
  responseModalities: ['TEXT', 'IMAGE'],  // ← 이거 제거
  imageConfig: { aspectRatio: '3:4' }
}
```

### 차이 2: mimeType 하드코딩

```js
// photo.js (동작 O) — 실제 mimeType 추출
const mimeTypeMatch = inputImage.match(/data:([^;]+);base64/);
const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';

// idgen.js (동작 X) — 'image/png' 하드코딩
{ inlineData: { data: base64Data, mimeType: 'image/png' } }
```

단, idgen.js는 프론트엔드에서 이미 `split(',')[1]`로 순수 base64만 받으므로 data: prefix가 없음.
→ mimeType 추출 불가 → `'image/png'` 폴백은 유지하되, 실제로는 JPEG일 수 있어 `'image/jpeg'`도 고려.

---

## 수정 사항

### 파일: `MONK_kr/functions/api/idgen.js`

#### 수정 1: generationConfig에서 responseModalities 제거

```js
// Before (L103~105)
generationConfig: {
  responseModalities: ['TEXT', 'IMAGE'],
  imageConfig: { aspectRatio: '3:4' },
},

// After
generationConfig: {
  imageConfig: { aspectRatio: '3:4' },
},
```

#### 수정 2: mimeType을 image/jpeg로 변경

캡처 이미지는 canvas.toDataURL()에서 나오며 기본이 PNG이나, 압축 시 JPEG일 수 있음.
Gemini API는 둘 다 처리 가능하므로 실해가 없지만, 안전하게 `'image/jpeg'`로 변경.
(photo.js도 실제로 JPEG가 들어오면 JPEG로 처리함)

```js
// Before
{ inlineData: { data: base64Data, mimeType: 'image/png' } },

// After
{ inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
```

---

## 작업 순서

1. `MONK_kr/functions/api/idgen.js` 수정 (위 2건)
2. 커밋: `[fix] idgen.js: responseModalities 제거 + mimeType 수정 (photo.js 패턴 정합)`
3. prod 배포: `wrangler pages deploy MONK_kr/ --project-name=monk-kr --branch=main`
4. 배포 후 `/api/idgen` 엔드포인트 400 응답 확인 (라우팅 정상)
5. 완료 보고

## 주의

- `MONK_kr/functions/api/idgen.js`만 수정. 다른 파일 손대지 마라.
- `monkos_AI/` 수정 금지 (0원칙)
- photo.js 참고만 하고 수정하지 마라

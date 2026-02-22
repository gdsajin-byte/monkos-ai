# 지시서: result 페이지 — 워터마크 프리뷰 + 비교 카드 UI

```
[2026-02-21 15:32 KST] iMac/쌍아 → 막내1
```

## 역할 선언

> **너는 "막내1"이다. 쌍아가 아니다.**
> - 완료 보고: `{디바이스}/막내1 → iMac/쌍아` 형식
> - **병렬 작업 중**: 막내2가 prep.*, thankyou.*, app.css를 동시 수정 중
> - **네 수정 범위**: `result.html`, `result.js`, `shared.js`(store 필드 1건만)

## 작전 개요

| 항목 | 내용 |
|------|------|
| **작전명** | result 페이지 워터마크 프리뷰 + 비교 카드 |
| **수정 파일** | `MONK_kr/ai_lab/photolab/result.html`, `result.js`, `shared.js` |
| **브랜치** | `develop` |
| **긴급도** | 높음 — 전환율 핵심 화면 |

## ⚠️ 준수 조항

- **헌법 제9조**: 워터마크는 프리뷰 전용. 원본/생성 이미지 훼손 금지
- **헌법 제10조**: 프록시 금지 — monk.js/shared.js 기존 패턴 준수
- **법률 제2장**: monk.js Store/Pipe 패턴 유지

## ⚠️ 파일 충돌 방지

- `app.css` 수정 금지 (막내2 담당)
- `prep.*`, `thankyou.*` 수정 금지 (막내2 담당)
- `shared.js`는 store 초기값에 `watermarkPreview: null` 1줄만 추가 허용
- 스타일은 `result.html` 내 인라인 또는 `<style>` 블록으로 처리

---

## 배경

현재 result 페이지는 생성 완료 후 상단에 원본/생성 전후 비교만 있고 **하단이 텅 비어있음**. 사용자가 최종 품질을 확인하지 못한 채 다운로드를 결정해야 하는 구조.

---

## 목표 레이아웃

```
┌─────────────────────────────────┐
│        완료!                     │
│  증명사진이 준비되었습니다          │
│                                  │
│  ┌──────────┐  ┌──────────┐     │  ← 비교 카드 (들어올림)
│  │  원본    │  │ AI 증명  │     │
│  │          │  │          │     │
│  └──────────┘  └──────────┘     │
│  ─────────────────────────────  │
│  ✨ MONKOS AI 증명사진  monkos.ai│  ← 브랜딩 바
│                                  │
│  ┌─────────────────────────┐    │  ← 워터마크 프리뷰 (신규)
│  │                         │    │
│  │   생성 원본 + 워터마크    │    │
│  │   (MONKOS 대각선 반복)   │    │
│  │                         │    │
│  └─────────────────────────┘    │
│  여권 | 35×45mm | 300dpi        │
│  ✨ 다운로드 시 워터마크 없는     │
│     고화질 원본이 제공됩니다      │
│                                  │
│  [다시 찍기] [📥 고화질 다운(8c)] │
│                                  │
│  [📋 비교 카드 저장]             │  ← 카드 저장 버튼 (신규)
└─────────────────────────────────┘
```

---

## 작업 내역

### TASK 1: 비교 카드 UI (result.html)

현재 `photo-compare` div를 카드식으로 개선:

- `.photo-compare`에 카드 스타일 적용 (배경, 라운딩, 그림자, 살짝 들어올림)
- 카드 하단에 MONKOS 브랜딩 바 추가:
  ```
  ✨ MONKOS AI 증명사진  monkos.ai
  ```
- 스타일은 `result.html` 내 `<style>` 블록으로 처리 (app.css 수정 금지)

### TASK 2: 워터마크 프리뷰 (result.js)

생성 완료 시점에 **생성 원본 사이즈**(크롭 아님)의 워터마크 프리뷰 생성:

```javascript
async function generateWatermarkPreview(imageDataUrl) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();

  return new Promise((resolve) => {
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // 워터마크: 대각선 반복 MONKOS 텍스트
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.max(img.width / 8, 24)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 6);

      for (let y = -canvas.height; y < canvas.height * 2; y += img.height / 4) {
        ctx.fillText('MONKOS', 0, y);
      }
      ctx.restore();

      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = imageDataUrl;
  });
}
```

**호출 위치**: `confirmAndGenerate()` 내 생성 성공 블록:

```javascript
// 기존 코드 뒤에 추가
const watermarked = await generateWatermarkPreview(genResult.image);
if (watermarked) {
  store.watermarkPreview = watermarked;
}
```

### TASK 3: 워터마크 프리뷰 HTML (result.html)

`#step3-actions` 위에 삽입:

```html
<!-- 워터마크 프리뷰 -->
<div id="watermark-preview" data-show="watermarkPreview" style="padding:16px; text-align:center;">
    <div style="font-size:14px; font-weight:600; color:#a78bfa; margin-bottom:8px;">
        다운로드 프리뷰
    </div>
    <div style="display:inline-block; border-radius:8px; overflow:hidden; border:1px solid rgba(167,139,250,0.2);">
        <img id="watermark-img" data-bind-src="watermarkPreview" src="" alt="프리뷰"
             style="max-width:240px; display:block;">
    </div>
    <div style="margin-top:8px; font-size:12px; color:#8892a8;">
        ✨ 다운로드 시 워터마크 없는 고화질 원본이 제공됩니다
    </div>
</div>
```

### TASK 4: 비교 카드 저장 (result.js)

Canvas로 원본+생성 합성 이미지 생성 + MONKOS 브랜딩:

```javascript
async function saveCompareCard() {
  if (!store.captured || !store.generated) return;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const [imgOrig, imgGen] = await Promise.all([
    loadImage(store.captured),
    loadImage(store.generated),
  ]);

  const cardW = 720;
  const imgW = (cardW - 48) / 2;  // 양쪽 16px 패딩 + 16px 간격
  const imgH = imgW * (imgOrig.height / imgOrig.width);
  const brandH = 48;
  const cardH = 32 + imgH + 24 + brandH + 16;  // top + img + labels + brand + bottom

  canvas.width = cardW;
  canvas.height = cardH;

  // 배경
  ctx.fillStyle = '#0a0e17';
  ctx.beginPath();
  ctx.roundRect(0, 0, cardW, cardH, 16);
  ctx.fill();

  // 원본
  ctx.drawImage(imgOrig, 16, 24, imgW, imgH);
  // 생성
  ctx.drawImage(imgGen, 16 + imgW + 16, 24, imgW, imgH);

  // 라벨
  ctx.fillStyle = '#8892a8';
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('원본', 16 + imgW / 2, 24 + imgH + 16);
  ctx.fillText('AI 증명사진', 16 + imgW + 16 + imgW / 2, 24 + imgH + 16);

  // 브랜딩 바
  ctx.fillStyle = 'rgba(167,139,250,0.1)';
  ctx.fillRect(0, cardH - brandH, cardW, brandH);
  ctx.fillStyle = '#a78bfa';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✨ MONKOS AI 증명사진   monkos.ai', cardW / 2, cardH - brandH / 2 + 5);

  // 저장
  canvas.toBlob(async (blob) => {
    const file = new File([blob], `monkos_compare_${Date.now()}.jpg`, { type: 'image/jpeg' });
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'MONKOS AI 증명사진' });
    } else {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = file.name;
      a.click();
    }
    Monk.log('비교 카드 저장 완료');
  }, 'image/jpeg', 0.92);
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = src;
  });
}
```

### TASK 5: 카드 저장 버튼 (result.html)

`#step3-actions` 안에 추가:

```html
<button class="btn btn-secondary" onclick="saveCompareCard()" style="width:100%;">📋 비교 카드 저장</button>
```

### TASK 6: 다운로드 버튼 카피 변경

```html
<!-- 기존 -->
<button class="btn btn-success" id="btn-download" onclick="downloadResult()">📥 다운로드 (8c)</button>
<!-- 변경 -->
<button class="btn btn-success" id="btn-download" onclick="downloadResult()">📥 고화질 다운로드 (8c)</button>
```

### TASK 7: store 필드 (shared.js)

store 초기값에 1줄 추가:

```javascript
watermarkPreview: null,
```

### TASK 8: window 노출 (result.js)

```javascript
Object.assign(window, {
  retakePhoto,
  confirmAndGenerate,
  downloadResult,
  saveCompareCard,  // 추가
});
```

---

## 금지 사항

- `app.css` 수정 금지 (막내2 담당)
- `prep.*`, `thankyou.*`, `camera.*` 수정 금지
- monk.js 수정 금지
- 워터마크를 store.captured / store.generated 원본에 적용 금지
- API 호출 추가/변경 금지 (프론트 UI만)

---

## 완료 조건

1. 생성 완료 시 하단에 워터마크 프리뷰 표시 (생성 원본 사이즈)
2. 비교 카드가 카드식 UI (그림자 + 라운딩 + 브랜딩 바)
3. "비교 카드 저장" 버튼 동작 (Canvas 합성 → 저장/공유)
4. 다운로드 버튼 카피 "고화질 다운로드 (8c)"
5. 워터마크 없는 원본은 그대로 유지 (다운로드 시 제공)
6. 완료 보고 발신

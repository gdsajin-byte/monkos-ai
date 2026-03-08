---
type: ORDER
date: 2026-03-03
from: M1/쌍아
to: 막내1
priority: HIGH
scope: result.js 정리 + thankyou.html 전환
depends: C2 핫픽스 선행 또는 동시 적용
parallel: 막내2 thankyou.html 구현과 병렬 (파일 분리)
---

# 지시서 B: result.js 포스트 다운로드 제거 + thankyou.html 전환

> **[2026-03-03 05:12 KST] M1/쌍아 → 막내1**

---

## 목표

다운로드 70c 결제 성공 시 thankyou.html로 페이지 전환. result.js의 포스트 다운로드 인페이지 로직을 전부 제거.

---

## 참조 문서

- 막내1 보고서: `REPORT_20260303_막내1_v5퍼널_로직전수검토.md`
- 막내2 보고서: `REPORT_20260303_막내2_포스트다운로드_데이터흐름_전수조사.md`
- 철창이 UI 스펙시트: `monkos-ops/03_개발/MONKOS_퍼널_UI기획안_v5_쌍아전달_1.md`

---

## 수정 1: `doDownload()` — 성공 시 thankyou.html 전환

**파일**: `result.js`

현행 (`doDownload()` 성공 경로):
```
showThankYou() → 원본 교체 → cropAndShowPostDownload()
```

변경:
```javascript
async function doDownload() {
  try {
    const result = await pipe.run('creditUse', { userId: store.user.id, type: 'download' });
    store.user = { ...store.user, credits: result.credits };

    // 크롭 실행 (thankyou용 데이터 준비)
    if (_fullOriginal) {
      const spec = PHOTO_SPECS[store.format];
      try {
        const cropResult = await media.crop(_fullOriginal, spec);
        saveSessionData('cropped', cropResult.dataUrl);
      } catch (e) {
        // 크롭 실패 시 원본 그대로 저장
        const jpeg = await media.toJpeg(_fullOriginal, 0.92);
        saveSessionData('cropped', jpeg);
      }
    }

    // 풀 원본 sessionStorage 보존 (thankyou에서 풀샷 20c용)
    if (_fullOriginal) {
      try { sessionStorage.setItem('_mo_p', _fullOriginal); } catch(e) {}
    }

    // 전후비교 합성 (워터마크 없이)
    await generateCompareImage();

    // thankyou.html로 전환
    navigateTo('thankyou.html');

  } catch (err) {
    if (err.status === 402) {
      navigateTo('charge.html?return=result&action=download');
    } else {
      Monk.log('다운로드 크레딧 에러: ' + (err.error || err.message));
      const btn = document.querySelector('#btn-download');
      if (btn) btn.disabled = false;
    }
  }
}
```

## 수정 2: 전후비교 합성 함수 신규

**파일**: `result.js` (doDownload 위에 추가)

```javascript
async function generateCompareImage() {
  const captured = loadSessionData('captured');
  const cropped = loadSessionData('cropped');
  if (!captured || !cropped) return;

  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const [imgA, imgB] = await Promise.all([
      loadImage(captured),
      loadImage(cropped),
    ]);

    // 나란히 배치 (같은 높이, 비율 유지)
    const h = 400;
    const wA = (imgA.width / imgA.height) * h;
    const wB = (imgB.width / imgB.height) * h;
    const gap = 16;
    const pad = 24;
    const totalW = wA + gap + wB + pad * 2;
    const totalH = h + pad * 2 + 40; // 하단 브랜딩 영역

    canvas.width = totalW;
    canvas.height = totalH;

    // 배경
    ctx.fillStyle = '#0A0E17';
    ctx.fillRect(0, 0, totalW, totalH);

    // 원본
    ctx.drawImage(imgA, pad, pad, wA, h);
    // 완성본
    ctx.drawImage(imgB, pad + wA + gap, pad, wB, h);

    // 라벨
    ctx.fillStyle = '#94A3B8';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('원본', pad + wA / 2, pad + h + 18);
    ctx.fillText(PHOTO_SPECS[store.format]?.name || '완성', pad + wA + gap + wB / 2, pad + h + 18);

    // 브랜딩
    ctx.fillStyle = '#8B5CF6';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✨ MONKOS AI 증명사진  ·  monkos.ai', totalW / 2, totalH - 10);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    sessionStorage.setItem('monkos_compare', dataUrl);
  } catch (e) {
    Monk.log('전후비교 합성 실패: ' + e.message);
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
```

## 수정 3: GateModule 직결제 콜백 수정

**파일**: `result.js` init() 내부 (L717-721)

현행:
```javascript
await GateModule.initDirectPayment(() => {
  if (_fullOriginal) store.generated = _fullOriginal;
  return cropAndShowPostDownload();
});
```

변경:
```javascript
await GateModule.initDirectPayment(async () => {
  // 직결제 성공 → 크롭 + 전후비교 합성 + thankyou 전환
  if (_fullOriginal) {
    const spec = PHOTO_SPECS[store.format];
    try {
      const cropResult = await media.crop(_fullOriginal, spec);
      saveSessionData('cropped', cropResult.dataUrl);
    } catch (e) {
      const jpeg = await media.toJpeg(_fullOriginal, 0.92);
      saveSessionData('cropped', jpeg);
    }
    try { sessionStorage.setItem('_mo_p', _fullOriginal); } catch(e) {}
  }
  await generateCompareImage();
  navigateTo('thankyou.html');
});
```

## 수정 4: 포스트 다운로드 코드 제거

**파일**: `result.js`

다음 함수/코드 블록 **전체 삭제**:

| 대상 | 현행 라인 범위 (대략) | 사유 |
|------|---------------------|------|
| `cropAndShowPostDownload()` | L380-497 | thankyou.html로 이관 |
| `showSpecTab()` | L500-505 | 규격 탭 v5 제외 |
| `updateSpecButtons()` | L507-535 | 규격 탭 v5 제외 |
| `selectSpec()` | L537-567 | 규격 탭 v5 제외 |
| `switchToSpec()` | L569-579 | 규격 탭 v5 제외 |
| `downloadFullOriginal()` | L582-622 | thankyou.html로 이관 |
| `redownloadFullOriginal()` | L624-631 | thankyou.html로 이관 |
| `showStudioBanner()` | L633-653 | thankyou.html로 이관 |
| `saveToGallery()` | L656-682 | thankyou.html로 이관 |
| `_specCache` / `_currentSpec` 변수 | L22-23 | 규격 탭 제거 |
| `store.downloadComplete` 관련 | L404 등 | 페이지 분리로 불필요 |

**window 노출에서도 제거**:
```javascript
// 제거: selectSpec, downloadFullOriginal
Object.assign(window, {
  retakePhoto,
  confirmAndGenerate,
  downloadResult,
});
```

## 수정 5: result.html — 규격 탭 DOM 제거

**파일**: `result.html`

`#spec-tab`, `#btn-spec-passport`, `#btn-spec-id`, `#spec-tab-desc`, `#spec-photo` 관련 HTML 블록 삭제. `#post-download-mount` 영역도 삭제.

## 수정 6: shared.js — showThankYou 5초 오버레이 제거

**파일**: `shared.js`

`showThankYou()` 함수의 5초 오버레이 로직 제거. export는 유지하되 빈 함수로 (다른 파일에서 import하므로):

```javascript
export function showThankYou() {
  // v5: thankyou.html 별도 페이지로 전환됨. 오버레이 제거.
}
```

---

## 완료 조건

- [ ] doDownload() 성공 → navigateTo('thankyou.html') 확인
- [ ] 전후비교 합성 이미지 sessionStorage 저장 확인
- [ ] _mo_p에 풀 원본 보존 확인
- [ ] 직결제 콜백 → thankyou.html 전환 확인
- [ ] 포스트 다운로드 코드 전부 제거 확인 (함수 10개+)
- [ ] result.html 규격 탭 DOM 제거 확인
- [ ] 기존 기능 정상: 생성, 프리뷰, 다운로드 버튼, charge.html 이동/복귀
- [ ] 커밋 태그: `[refactor]`

## 보고

- 형식: `[시각] M1/막내1 → M1/쌍아`
- 커밋+push 승인 대기

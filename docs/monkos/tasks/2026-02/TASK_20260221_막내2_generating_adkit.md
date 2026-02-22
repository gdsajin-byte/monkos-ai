# 지시서: result 생성 대기 화면 — 광고 킷 + 카운트다운 연출

```
[2026-02-21 18:05 KST] iMac/쌍아 → 막내2
```

## 역할 선언

> **너는 "막내2"이다. 쌍아가 아니다.**
> - 완료 보고: `{디바이스}/막내2 → iMac/쌍아` 형식
> - **병렬 작업 중**: 막내1이 thankyou.html을 동시 수정 중
> - **네 수정 범위**: `result.html`, `result.js`

## 작전 개요

| 항목 | 내용 |
|------|------|
| **작전명** | 생성 대기 화면 광고 킷 + 카운트다운 연출 |
| **수정 파일** | `MONK_kr/ai_lab/photolab/result.html`, `result.js` |
| **브랜치** | `develop` |
| **긴급도** | 높음 — UX 핵심 |

## ⚠️ 준수 조항

- **헌법 제4조**: 기술명 노출 금지 — "MONKOS" 브랜드만 사용
- **헌법 제10조**: 프록시 금지 — GCS 직접 fetch (manifest.json)
- **법률 제2장**: monk.js Store/Pipe 패턴 유지
- **법률 제7장 1조**: 마무리 절차 필수

## ⚠️ 파일 충돌 방지

- `thankyou.*` 수정 금지 (막내1 담당)
- `shared.js`, `app.css`, `prep.*`, `camera.*`, `config.js`, `monk.js` 수정 금지

---

## 배경

"이 사진으로 생성" 클릭 후 현재는 단순 텍스트("생성 중...")만 표시.
Gemini 3 Pro I2I는 10~25초 소요 → 이 대기 시간에 **시머링 연출 + 포트폴리오 광고 슬라이드**를 보여주고, 결과를 **카운트다운 + 공개 연출**로 임팩트 있게 전달.

---

## GCS 광고 킷 정보

| 항목 | 값 |
|------|------|
| **manifest URL** | `https://storage.googleapis.com/monk-ai-images/ads/manifest.json` |
| **이미지 수** | 6장 |
| **rotate** | 6000ms (6초) |
| **transition** | 800ms (페이드) |
| **형식** | `{ images: [url1, url2, ...], rotate: 6000, transition: 800 }` |

---

## 목표 레이아웃

```
┌─────────────────────────────────┐
│                                  │
│                                  │
│      ✨ MONKOS is rendering      │  ← 시머링 그라디언트 텍스트
│      your perfect portrait       │     (좌→우 빛 흐름 애니메이션)
│                                  │
│      ░░░░░░░░████░░░░░░  42%    │  ← 시머링 프로그레스 바
│                                  │
│  ┌─────────────────────────┐    │
│  │                         │    │
│  │   [GCS 광고 이미지]      │    │  ← manifest에서 로드
│  │   6초 간격 페이드 전환    │    │     크로스페이드 0.8s
│  │                         │    │
│  └─────────────────────────┘    │
│                                  │
│   MONKOS AI · 완벽한 증명사진    │  ← 하단 브랜딩
│                                  │
│         ─── 완료 시 ───          │
│                                  │
│       (시머링 텍스트 → 카운트)    │
│           ✨ 3                   │
│           ✨ 2                   │
│           ✨ 1                   │
│                                  │
│       오버레이 해제 → 결과 표시   │
└─────────────────────────────────┘
```

---

## 작업 내역

### TASK 1: 생성 대기 오버레이 HTML (result.html)

`#result-overlay` 안, `#step2-actions` 뒤에 삽입:

```html
<!-- 생성 대기 오버레이 -->
<div id="gen-overlay" data-show="genOverlayVisible" style="
    display:none; position:fixed; inset:0; z-index:80;
    background:#030508; flex-direction:column;
    align-items:center; justify-content:center; padding:24px;
">
    <!-- 시머링 타이틀 -->
    <div id="gen-title" style="text-align:center; margin-bottom:24px;">
        <div class="shimmer-text" style="font-size:22px; font-weight:800; letter-spacing:1px;">
            MONKOS is rendering
        </div>
        <div class="shimmer-text" style="font-size:16px; font-weight:500; margin-top:6px; opacity:0.8;">
            your perfect portrait
        </div>
    </div>

    <!-- 시머링 프로그레스 바 -->
    <div style="width:80%; max-width:300px; height:4px; background:rgba(167,139,250,0.15); border-radius:2px; overflow:hidden; margin-bottom:32px;">
        <div id="gen-progress" style="height:100%; width:0%; background:linear-gradient(90deg,#a78bfa,#c4b5fd,#a78bfa); background-size:200% 100%; animation:shimmerBar 1.5s ease infinite; border-radius:2px; transition:width 0.5s ease;"></div>
    </div>

    <!-- 광고 슬라이드 영역 -->
    <div id="gen-ad-area" style="
        width:100%; max-width:320px; aspect-ratio:3/4;
        border-radius:16px; overflow:hidden; position:relative;
        background:#0d1117; margin-bottom:16px;
    ">
        <img id="gen-ad-img" src="" alt="" style="
            width:100%; height:100%; object-fit:cover;
            transition:opacity 0.8s ease;
        ">
    </div>

    <!-- 브랜딩 -->
    <div style="font-size:12px; color:#8892a8; letter-spacing:0.5px;">
        MONKOS AI · 완벽한 증명사진
    </div>

    <!-- 카운트다운 (결과 준비 완료 후 표시) -->
    <div id="gen-countdown" style="
        display:none; position:absolute; inset:0;
        background:rgba(3,5,8,0.9); z-index:1;
        display:none; align-items:center; justify-content:center;
        flex-direction:column;
    ">
        <div id="gen-count-num" style="font-size:72px; font-weight:900; color:#a78bfa;"></div>
        <div style="font-size:14px; color:#c4b5fd; margin-top:8px;">잠시 후 공개됩니다</div>
    </div>
</div>
```

### TASK 2: 시머링 CSS (result.html `<style>` 블록에 추가)

기존 `</style>` 직전에 추가:

```css
/* 시머링 텍스트 */
.shimmer-text {
    background: linear-gradient(90deg, #8b7cc8 0%, #e0d4ff 40%, #a78bfa 60%, #8b7cc8 100%);
    background-size: 200% 100%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmerText 2.5s ease infinite;
}
@keyframes shimmerText {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
}
@keyframes shimmerBar {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
}
```

### TASK 3: 생성 대기 로직 (result.js)

`confirmAndGenerate()` 함수를 수정. 핵심 흐름:

1. "이 사진으로 생성" 클릭 → 사전분석(기존 유지)
2. 사전분석 통과 → `showGenOverlay()` 호출 (오버레이 표시 + 광고 로테이션 시작)
3. `pipe.run('generate', ...)` 병렬 실행
4. API 응답 도착 → 결과를 store에 저장하되 **즉시 표시하지 않음**
5. 최소 10초 대기 (API가 빨라도)
6. 10초 경과 + API 완료 → `startCountdown()` → 3→2→1
7. 카운트다운 완료 → 오버레이 해제 → 결과 표시

```javascript
// ─── 광고 킷 상수 ───
const AD_MANIFEST_URL = 'https://storage.googleapis.com/monk-ai-images/ads/manifest.json';
const MIN_DISPLAY_TIME = 10000; // 최소 10초 표시

let adImages = [];
let adTimer = null;
let adIndex = 0;

// ─── 광고 manifest 로드 ───
async function loadAdManifest() {
  try {
    const res = await fetch(AD_MANIFEST_URL);
    const data = await res.json();
    adImages = data.images || [];
    Monk.log(`광고 manifest 로드: ${adImages.length}장`);
  } catch (e) {
    Monk.log('광고 manifest 로드 실패: ' + e.message);
  }
}

// ─── 오버레이 표시 + 광고 로테이션 시작 ───
function showGenOverlay() {
  store.genOverlayVisible = true;

  const overlay = document.getElementById('gen-overlay');
  if (overlay) overlay.style.display = 'flex';

  // 프로그레스 바 시작
  const progress = document.getElementById('gen-progress');
  if (progress) {
    progress.style.width = '0%';
    // 10초에 걸쳐 90%까지 서서히 채움
    setTimeout(() => { progress.style.transition = 'width 10s ease-out'; progress.style.width = '90%'; }, 100);
  }

  // 광고 이미지 로테이션
  if (adImages.length > 0) {
    adIndex = 0;
    showAdImage(adIndex);
    adTimer = setInterval(() => {
      adIndex = (adIndex + 1) % adImages.length;
      showAdImage(adIndex);
    }, 6000);
  }
}

function showAdImage(index) {
  const img = document.getElementById('gen-ad-img');
  if (!img || !adImages[index]) return;
  img.style.opacity = '0';
  setTimeout(() => {
    img.src = adImages[index];
    img.style.opacity = '1';
  }, 400); // 페이드 아웃 후 교체
}

// ─── 카운트다운 → 결과 공개 ───
function startCountdown(callback) {
  const countdown = document.getElementById('gen-countdown');
  const countNum = document.getElementById('gen-count-num');
  if (!countdown || !countNum) { callback(); return; }

  // 프로그레스 바 100%
  const progress = document.getElementById('gen-progress');
  if (progress) { progress.style.transition = 'width 0.5s ease'; progress.style.width = '100%'; }

  countdown.style.display = 'flex';

  let count = 3;
  countNum.textContent = count;

  const interval = setInterval(() => {
    count--;
    if (count > 0) {
      countNum.textContent = count;
    } else {
      clearInterval(interval);
      countNum.textContent = '✨';
      setTimeout(() => {
        hideGenOverlay();
        callback();
      }, 500);
    }
  }, 1000);
}

function hideGenOverlay() {
  if (adTimer) { clearInterval(adTimer); adTimer = null; }
  store.genOverlayVisible = false;
  const overlay = document.getElementById('gen-overlay');
  if (overlay) overlay.style.display = 'none';
  const countdown = document.getElementById('gen-countdown');
  if (countdown) countdown.style.display = 'none';
}
```

### TASK 4: confirmAndGenerate() 수정 (result.js)

기존 생성 단계 부분을 교체. **사전분석까지는 기존 그대로 유지.** 생성 단계만 변경:

```javascript
  // 생성 단계 (기존 store.step = 3 이후부터 교체)
  store.step = 3;
  store.stepLabel = TX.step3;

  // 오버레이 표시
  showGenOverlay();
  const genStartTime = Date.now();

  try {
    const genResult = await pipe.run('generate', {
      image: base64,
      style: store.style,
      purpose: loadSessionData('purpose'),
      gender: store.gender,
      age: store.age,
      clothing: loadSessionData('clothing'),
      clothingColor: loadSessionData('clothingColor'),
      tie: loadSessionData('tie'),
      hair: loadSessionData('hair'),
      background: loadSessionData('background'),
      expression: loadSessionData('expression'),
      userId: store.user.id,
    });

    store.generated = genResult.image;
    Monk.log('생성 완료');

    // 최소 대기 시간 보장
    const elapsed = Date.now() - genStartTime;
    const remaining = Math.max(0, MIN_DISPLAY_TIME - elapsed);

    await new Promise(resolve => setTimeout(resolve, remaining));

    // 카운트다운 → 결과 공개
    startCountdown(() => {
      // 생성된 이미지 표시
      const genImg = document.querySelector('#photo-generated');
      if (genImg) genImg.src = genResult.image;

      store.statusText = TX.resultDone;
      store.resultTitle = TX.resultDone;
      store.resultSubtitle = TX.resultDoneSub;
      store.stepLabel = TX.resultDone;
      store.showStep3Actions = true;
      store.showStep2Actions = false;

      const btnDownload = document.querySelector('#btn-download');
      if (btnDownload) btnDownload.disabled = false;

      // 워터마크 프리뷰 생성
      generateWatermarkPreview(genResult.image).then(watermarked => {
        if (watermarked) store.watermarkPreview = watermarked;
      });
    });

  } catch (err) {
    hideGenOverlay();
    if (err.status === 402) {
      showCreditModal(err.required || 1, err.credits || 0, 'generate');
      store.showStep2Actions = true;
      store.resultTitle = TX.resultConfirm;
      store.resultSubtitle = '크레딧이 부족합니다';
      store.step = 2;
    } else {
      showGenerateError(err.error || err.message || '생성 실패');
    }
  }
```

### TASK 5: store 필드 추가 (result.js 상단 또는 shared.js)

**result.js 내에서만 사용하므로 shared.js 수정 불필요.**
`showGenOverlay()`에서 직접 DOM 조작하므로 store 필드 불필요.
단, `genOverlayVisible`을 store에 넣고 싶다면 result.js init()에서:
```javascript
store.genOverlayVisible = false;
```
→ 하지만 data-show 바인딩이 아닌 직접 DOM 제어이므로 **불필요. 생략.**

### TASK 6: init()에서 광고 manifest 프리로드

init() 함수 안, `showOriginal()` 호출 전에 추가:

```javascript
  // 광고 manifest 프리로드
  loadAdManifest();
```

### TASK 7: window 노출 정리

기존에서 변경 없음. `showGenOverlay`, `hideGenOverlay` 등은 내부 함수이므로 window 노출 불필요.

---

## 금지 사항

- `thankyou.*` 수정 금지 (막내1 담당)
- `shared.js` 수정 금지
- `app.css` 수정 금지 (CSS는 result.html `<style>` 블록에)
- `config.js`, `monk.js`, `camera.*`, `prep.*` 수정 금지
- API 엔드포인트 변경 금지
- manifest.json 수정 금지 (읽기 전용)

---

## 마무리 절차 (필수)

| 순서 | 절차 | 필수 여부 |
|------|------|----------|
| 1 | `develop` 브랜치에 커밋 | **필수** |
| 2 | `git push origin develop` | **필수** |
| 3 | 완료 보고 발신 (헌법 제2조 형식) | **필수** |
| 4 | `main` 머지 + 배포 | **금지** — 작가님 별도 지시 시에만 |

### 커밋 메시지 형식

```
[feature] result 생성 대기 화면 — 시머링 연출 + GCS 광고 킷 + 카운트다운

지시서: TASK_20260221_막내2_generating_adkit.md
```

---

## 완료 조건

1. "이 사진으로 생성" 클릭 → 풀스크린 오버레이 표시
2. "MONKOS is rendering your perfect portrait" 시머링 텍스트 애니메이션
3. 시머링 프로그레스 바 (10초에 걸쳐 90%까지)
4. GCS manifest에서 광고 이미지 로드 + 6초 간격 크로스페이드
5. API 완료 + 최소 10초 경과 → 3→2→1 카운트다운
6. 카운트다운 완료 → 오버레이 해제 → 결과 표시
7. API 에러 시 오버레이 즉시 해제 + 에러 표시 (기존 로직)
8. develop 커밋 + push 완료
9. 완료 보고 발신

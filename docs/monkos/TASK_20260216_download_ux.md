# 막내 지시서: 다운로드 UX 애니메이션 개선

**발행:** 2026-02-16 19:56 KST
**발행자:** 쌍아 (전략실)
**대상:** 막내 (팩토리)
**우선도:** 중
**브랜치:** develop

---

## 목표

다운로드 → 땡큐 화면이 무미건조함. 이벤트 느낌의 애니메이션을 추가하여 사용자 성취감을 높인다.

## 수정 대상

1. `monkos_AI/idphoto-kr/public/index.html`
2. `monkos_AI/idphoto-jp/public/index.html` (동일 패턴, 일본어 텍스트)

KR 먼저 완성 → JP에 동일 적용.

---

## PHASE 1: 다운로드 버튼 즉시 피드백

### 현재 문제
`#btn-download` 클릭 시 API 호출 중 무반응. 눌렀는지 안 눌렀는지 모름.

### 변경

`downloadResult()` 함수 (line ~2164) 시작부에 버튼 비활성화 + 스피너 추가:

```javascript
async function downloadResult() {
    if (!generatedImageData) return;

    const btn = document.getElementById('btn-download');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '처리 중...';

    // ... 기존 로직 ...

    // 에러 catch 블록에서 원복:
    // btn.disabled = false;
    // btn.textContent = originalText;
}
```

**JP:** `'処理中...'`

---

## PHASE 2: 땡큐 화면 진입 애니메이션

### CSS 추가 (기존 `@keyframes fadeInUp` 뒤에)

```css
@keyframes tyScreenIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
}
#thankyou-screen.active {
    display: flex;
    animation: tyScreenIn 0.3s ease-out;
}

@keyframes photoGlow {
    0% { box-shadow: 0 4px 24px rgba(167,139,250,0.2); }
    50% { box-shadow: 0 4px 40px rgba(167,139,250,0.5); }
    100% { box-shadow: 0 4px 24px rgba(167,139,250,0.2); }
}
.ty-preview.glow {
    animation: photoGlow 1.5s ease;
}
```

### JS 변경

`showPreview()` 함수에서 화면 활성화 후 사진 글로우 추가:

```javascript
document.getElementById('thankyou-screen').classList.add('active');
document.querySelector('.ty-preview').classList.add('glow');
```

---

## PHASE 3: 자동 저장 + 즉시 완료 표시

### 현재 문제
사용자가 이미지를 롱프레스해야만 "다운로드 완료" 표시됨. 체감 지연.

### 변경

`showPreview()` 함수를 수정하여 JPEG 변환 완료 후 자동 저장 시도:

```javascript
function showPreview() {
    document.getElementById('thankyou-screen').classList.add('active');
    document.getElementById('controls').classList.remove('active');
    document.querySelector('.ty-preview').classList.add('glow');

    // 공유 섹션 초기 숨김 (시퀀스 진입용)
    const shareSection = document.querySelector('.ty-share-section');
    if (shareSection) shareSection.style.opacity = '0';

    document.getElementById('postCreditMsg').textContent =
        userId ? `💎 10c 사용 · 잔여 ${userCredits}c` : '';

    // JPEG 변환 후 자동 저장 시도
    toJpegDataUrl(generatedImageData, 0.92).then(async jpegUrl => {
        document.getElementById('ty-photo').src = jpegUrl;

        // 자동 저장 시도
        let saved = false;
        try {
            saved = await autoSave(jpegUrl);
        } catch (e) {
            saved = false;
        }

        if (saved) {
            showComplete();
        } else {
            // 폴백: 기존 롱프레스 가이드
            showSaveGuide();
        }
    });

    log('미리보기 모드 표시');
}
```

### 새 함수: `autoSave()`

```javascript
async function autoSave(jpegUrl) {
    // navigator.share 지원 시 (iOS Safari 등)
    if (navigator.share && navigator.canShare) {
        try {
            const res = await fetch(jpegUrl);
            const blob = await res.blob();
            const file = new File([blob], `monkos_photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
            if (navigator.canShare({ files: [file] })) {
                await navigator.share({ files: [file], title: 'MONKOS AI 증명사진' });
                return true;
            }
        } catch (e) {
            if (e.name === 'AbortError') return false;
        }
    }

    // 폴백: <a download> 자동 클릭 (데스크탑/Android)
    try {
        const a = document.createElement('a');
        a.href = jpegUrl;
        a.download = `monkos_photo_${Date.now()}.jpg`;
        a.click();
        return true;
    } catch (e) {
        return false;
    }
}
```

**JP:** `title: 'MONKOS AI 証明写真'`

### 새 함수: `showSaveGuide()` (기존 롱프레스 가이드 폴백)

```javascript
function showSaveGuide() {
    document.getElementById('tySaveGuide').style.display = '';
    document.getElementById('tyCompleteMsg').style.display = 'none';

    const tyPhoto = document.getElementById('ty-photo');
    const onSaved = () => {
        showComplete();
        tyPhoto.removeEventListener('contextmenu', onSaved);
        document.removeEventListener('visibilitychange', onVisChange);
    };
    const onVisChange = () => {
        if (document.hidden) onSaved();
    };
    tyPhoto.addEventListener('contextmenu', onSaved);
    document.addEventListener('visibilitychange', onVisChange);
}
```

---

## PHASE 4: 완료 애니메이션 (체크마크 + 컨페티)

### CSS 추가

```css
@keyframes scaleBounce {
    0% { transform: scale(0); opacity: 0; }
    60% { transform: scale(1.15); }
    100% { transform: scale(1); opacity: 1; }
}

@keyframes checkCircleDraw {
    to { stroke-dashoffset: 0; }
}

@keyframes checkMarkDraw {
    to { stroke-dashoffset: 0; }
}

@keyframes confettiDrop {
    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
    100% { transform: translateY(80px) rotate(360deg); opacity: 0; }
}

.ty-check-svg {
    width: 56px; height: 56px; margin: 0 auto 8px;
}
.ty-check-svg .circle {
    fill: none; stroke: #34d399; stroke-width: 2;
    stroke-dasharray: 157; stroke-dashoffset: 157;
    animation: checkCircleDraw 0.4s ease forwards;
}
.ty-check-svg .check {
    fill: none; stroke: #34d399; stroke-width: 3;
    stroke-linecap: round; stroke-linejoin: round;
    stroke-dasharray: 30; stroke-dashoffset: 30;
    animation: checkMarkDraw 0.3s 0.35s ease forwards;
}

.ty-complete-text {
    font-size: 20px; font-weight: 800; color: #34d399;
    animation: scaleBounce 0.4s 0.5s ease both;
}

.confetti-container {
    position: relative; height: 0; overflow: visible;
    display: flex; justify-content: center;
}
.confetti-dot {
    position: absolute; width: 6px; height: 6px; border-radius: 50%;
    animation: confettiDrop 1s ease-out forwards;
}
```

### HTML 변경

`#tyCompleteMsg` (line ~1055) 교체:

**현재:**
```html
<div class="ty-complete-msg" id="tyCompleteMsg" style="display:none;">✅ 다운로드 완료! 감사합니다 🎉</div>
```

**변경 (KR):**
```html
<div id="tyCompleteMsg" style="display:none; text-align:center;">
    <div class="confetti-container" id="confettiContainer"></div>
    <svg class="ty-check-svg" viewBox="0 0 52 52">
        <circle class="circle" cx="26" cy="26" r="25"/>
        <path class="check" d="M14 27l7 7 16-16"/>
    </svg>
    <div class="ty-complete-text">저장 완료!</div>
</div>
```

**변경 (JP):**
```html
<div id="tyCompleteMsg" style="display:none; text-align:center;">
    <div class="confetti-container" id="confettiContainer"></div>
    <svg class="ty-check-svg" viewBox="0 0 52 52">
        <circle class="circle" cx="26" cy="26" r="25"/>
        <path class="check" d="M14 27l7 7 16-16"/>
    </svg>
    <div class="ty-complete-text">保存完了！</div>
</div>
```

### 새 함수: `showComplete()`

```javascript
function showComplete() {
    document.getElementById('tySaveGuide').style.display = 'none';
    const completeMsg = document.getElementById('tyCompleteMsg');
    completeMsg.style.display = '';

    // 컨페티 생성
    const container = document.getElementById('confettiContainer');
    container.innerHTML = '';
    const colors = ['#a78bfa', '#34d399', '#facc15', '#f472b6', '#60a5fa', '#fb923c'];
    for (let i = 0; i < 8; i++) {
        const dot = document.createElement('div');
        dot.className = 'confetti-dot';
        dot.style.background = colors[i % colors.length];
        dot.style.left = `${(i - 4) * 18}px`;
        dot.style.animationDelay = `${i * 0.08}s`;
        dot.style.animationDuration = `${0.8 + Math.random() * 0.6}s`;
        container.appendChild(dot);
    }

    // 0.8초 후 컨페티 제거 + 공유 섹션 fadeIn
    setTimeout(() => {
        container.innerHTML = '';
        const shareSection = document.querySelector('.ty-share-section');
        if (shareSection) {
            shareSection.style.opacity = '1';
            shareSection.style.animation = 'fadeInUp 0.4s ease';
        }
    }, 1200);
}
```

---

## PHASE 5: 기존 `saveToPhotos()` 정리

기존 `saveToPhotos()` 함수는 "다시 저장" 버튼용으로 유지하되, 내부 로직을 `autoSave()`를 재사용하도록 변경:

```javascript
async function saveToPhotos() {
    if (!generatedImageData) return;
    const jpegUrl = await toJpegDataUrl(generatedImageData, 0.92);
    await autoSave(jpegUrl);
}
```

---

## 안전 제약

- **수정 파일 2개만** (KR, JP의 index.html)
- **서버 코드 변경 없음**
- **크레딧 로직 변경 없음** (UI 피드백만)
- **기존 기능 삭제 없음** (롱프레스 가이드는 폴백으로 유지)
- **develop 브랜치에서 작업** → 커밋 → dev 배포 테스트

## 완료 기준

1. 다운로드 버튼 클릭 → 즉시 "처리 중..." 표시
2. 땡큐 화면 → 부드러운 페이드인 + 사진 글로우
3. 자동 저장 트리거 → 체크마크 draw + 컨페티 → "저장 완료!" bounce
4. 자동 저장 실패 시 → 기존 "길게 눌러 저장" 가이드 표시
5. 1.2초 후 SNS 공유 섹션 자연 페이드인
6. KR/JP 양쪽 동일 동작

## 커밋 메시지
```
다운로드 UX 개선: 자동저장 + 체크마크 애니 + 컨페티
```

# 막내 지시서: 다운로드 UX 버그 3건 긴급 수정

**발행:** 2026-02-16 21:25 KST
**발행자:** 쌍아 (전략실)
**대상:** 막내 (팩토리)
**우선도:** 긴급 (P1)
**브랜치:** develop

---

## 배경

막내의 다운로드 UX 개선 커밋(`0336f1a`)에서 발견된 버그 3건.
이 코드가 프로덕션 배포 시 카메라 기능과는 무관하나, **iOS에서 거짓 "저장 완료!" 표시** 등 사용자 혼란을 유발하므로 배포 전 필수 수정.

---

## 수정 대상

1. `monkos_AI/idphoto-kr/public/index.html`
2. `monkos_AI/idphoto-jp/public/index.html`

KR 먼저 완성 → JP에 동일 적용.

---

## BUG 1: iOS Safari `<a download>` 거짓 완료 표시

### 원인

`autoSave()` 함수에서 `navigator.share` 실패/취소 후 `<a download>` 폴백으로 진입.
iOS Safari에서 `<a download>`는 data URL에 대해 **아무 동작도 안 하지만 에러도 안 던짐** → `return true` → `showComplete()` 호출 → **저장 안 됐는데 "저장 완료!" 표시**.

### 시나리오

1. iOS 사용자 → Web Share API 공유 시트 뜸 → **취소** 누름
2. `AbortError` → `return false` → `<a download>` 폴백 진입
3. `a.click()` → iOS에서 무시됨 (에러 없음) → `return true`
4. `showComplete()` → **"저장 완료!" 거짓 표시** ❌

### 수정

**KR (line ~2304)** / **JP (line ~2229)** — `autoSave()` 함수 교체:

```javascript
async function autoSave(jpegUrl) {
    // 1. Web Share API (iOS Safari 등)
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

    // 2. <a download> — iOS에서는 data URL 다운로드 불가 → 스킵
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (isIOS) return false;

    // 3. 데스크탑/Android: <a download> 자동 클릭
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

**JP 차이점:** `title: 'MONKOS AI 証明写真'` (기존과 동일, 변경 없음)

### 검증

- iOS Safari: 공유 시트 → 취소 → **"길게 눌러 저장" 가이드 표시** (거짓 완료 아님) ✅
- iOS Safari: 공유 시트 → 실제 저장 → "저장 완료!" ✅
- Android Chrome: `<a download>` 자동 다운로드 → "저장 완료!" ✅
- 데스크탑: `<a download>` 자동 다운로드 → "저장 완료!" ✅

---

## BUG 2: 공유 섹션 영구 숨김

### 원인

`showPreview()`에서 `.ty-share-section`의 `opacity`를 `0`으로 설정.
`showComplete()`에서만 `opacity: 1`로 복구.
그런데 `showSaveGuide()` 경로(autoSave 실패 시)에서는 **사용자가 롱프레스하거나 앱을 전환할 때까지** 공유 섹션이 보이지 않음.

### 시나리오

1. iOS 사용자 → 공유 시트 → 취소
2. `autoSave()` → `false` → `showSaveGuide()` 진입
3. "길게 눌러 저장" 가이드 표시됨
4. 사용자가 **아래 스크롤하면 공유 섹션이 투명** (opacity: 0) ❌
5. 롱프레스 안 하고 그냥 나가면 → 공유 섹션 영원히 안 보임

### 수정

**KR (line ~2332)** / **JP (line ~2257)** — `showSaveGuide()` 함수에 공유 섹션 복구 타이머 추가:

```javascript
function showSaveGuide() {
    document.getElementById('tySaveGuide').style.display = '';
    document.getElementById('tyCompleteMsg').style.display = 'none';

    // 공유 섹션: 2초 후 표시 (저장 대기 중에도 접근 가능하도록)
    setTimeout(() => {
        const shareSection = document.querySelector('.ty-share-section');
        if (shareSection && shareSection.style.opacity === '0') {
            shareSection.style.opacity = '1';
            shareSection.style.animation = 'fadeInUp 0.4s ease';
        }
    }, 2000);

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

### 검증

- autoSave 실패 → "길게 눌러 저장" 가이드 → 2초 후 **공유 섹션 fadeIn** ✅
- autoSave 성공 → showComplete() 경로 → 1.2초 후 공유 섹션 fadeIn (기존과 동일) ✅

---

## BUG 3: CSS 중복 선언 정리

### 원인

`#thankyou-screen.active`가 2군데에서 선언됨:
- **KR line 463** / **JP line 465**: `#thankyou-screen.active { display: flex; }`
- **KR line 533~536** / **JP line 535~538**: `#thankyou-screen.active { display: flex; animation: tyScreenIn 0.3s ease-out; }`

후자가 캐스케이드로 이기므로 전자는 **유령 코드** (dead code).

### 수정

**KR line 463** — 아래 1줄 삭제:
```css
/* 삭제 대상 */
#thankyou-screen.active { display: flex; }
```

**JP line 465** — 동일하게 삭제.

나머지 (line 533~536 / 535~538) 유지:
```css
/* 이것만 남김 */
#thankyou-screen.active {
    display: flex;
    animation: tyScreenIn 0.3s ease-out;
}
```

### 검증

- 땡큐 화면 진입 → fadeIn + scale 애니메이션 정상 동작 ✅
- display: flex 정상 적용 ✅

---

## 안전 제약

- **수정 파일 2개만** (KR, JP의 index.html)
- **서버 코드 변경 없음**
- **크레딧 로직 변경 없음**
- **HTML 구조 변경 없음** (CSS + JS만)
- **develop 브랜치에서 작업** → 커밋 → dev 배포 테스트

---

## 완료 기준

1. iOS Safari: 공유 취소 시 "길게 눌러 저장" 가이드 표시 (거짓 완료 없음)
2. iOS Safari: 공유 성공 시 "저장 완료!" 정상 표시
3. Android/데스크탑: `<a download>` 자동 저장 → "저장 완료!" 정상 표시
4. 공유 섹션: autoSave 실패 경로에서도 2초 후 fadeIn
5. CSS 중복 선언 제거 후 애니메이션 정상 동작
6. KR/JP 양쪽 동일 수정

---

## 커밋 메시지
```
UX 버그 수정: iOS 거짓 완료 + 공유 섹션 숨김 + CSS 중복 정리
```

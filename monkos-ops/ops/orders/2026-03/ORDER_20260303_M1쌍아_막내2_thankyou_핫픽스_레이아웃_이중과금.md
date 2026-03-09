---
type: ORDER
date: 2026-03-03
from: M1/쌍아
to: 막내2
priority: CRITICAL
scope: thankyou.html/js 핫픽스 3건
depends: 385f556 (thankyou v5) 커밋 위에 적용
---

# 핫픽스: thankyou.html 레이아웃 + 이중과금 방지 + 피드백 UI

> **[2026-03-03 05:55 KST] M1/쌍아 → 막내2**

---

## 배경

코드 리뷰에서 발견된 버그 3건. P0 1건, P1 2건.

---

## 수정 1 (P0): 카드 레이아웃 — align-items: stretch

**문제**: `app.css`의 `.ty-body`에 `align-items: center`가 적용되어 있어 카드들이 컨텐츠 너비로 축소됨. `.ty-divider`는 폭 0px로 아예 안 보임.

**파일**: `thankyou.html` 내 `<style>` 블록 또는 `app.css`

**수정**:
```css
#thankyou-screen .ty-body {
    align-items: stretch;
}
```

이 1줄로 모든 카드가 부모 너비에 맞춰 펼쳐지고, 각 카드의 `margin: 0 16px`이 좌우 여백으로 정상 동작.

---

## 수정 2 (P1): charge.html 복귀 시 풀샷 이중과금 방지

**문제**: charge.html에서 돌아오면 페이지 새로고침으로 `_fullOriginalJpeg = null` 초기화. `pending_action` 감지 → `downloadFullOriginal()` 호출 → `_fullOriginalJpeg`가 null이라 첫 구매 분기를 타서 `pipe.run('creditUse')` **재호출** → 20c 이중 차감 가능.

**파일**: `thankyou.js`

**수정**: `pending_action` 분기에서 크레딧 차감을 건너뛰고 직접 JPEG 변환 + 다운로드만 수행.

```javascript
// init() 내 pending_action 처리 부분
if (pendingAction === 'full_original') {
    sessionStorage.removeItem('monkos_pending_action');
    // charge.html에서 이미 충전 완료 → 크레딧 차감만 수행 (이미 잔액 있음)
    // 단, _fullOriginalJpeg가 없으므로 새로 변환
    const fullSrc = sessionStorage.getItem('_mo_p');
    if (fullSrc) {
        try {
            const result = await pipe.run('creditUse', { userId: store.user.id, type: 'full_original' });
            store.user = { ...store.user, credits: result.credits };
            // JPEG 변환 + 다운로드
            const img = new Image();
            img.onload = async () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                canvas.getContext('2d').drawImage(img, 0, 0);
                const jpeg = canvas.toDataURL('image/jpeg', 0.95);
                _fullOriginalJpeg = jpeg;
                await redownloadFull();
                // 버튼 텍스트 변경
                const label = document.querySelector('.ty-fullshot-card .ty-card-title');
                if (label) label.textContent = '📸 풀샷 다시 저장하기';
                const badge = document.querySelector('.ty-fullshot-card .ty-price-badge');
                if (badge) badge.style.display = 'none';
            };
            img.src = fullSrc;
        } catch (e) {
            Monk.log('풀샷 자동 진행 실패: ' + e.message);
        }
    }
}
```

**핵심**: 이 분기는 "충전하고 돌아온 직후"이므로 `pipe.run('creditUse')`가 한 번만 실행됨. 문제는 기존 `downloadFullOriginal()`을 그대로 호출하면 `_fullOriginalJpeg` null 체크에서 첫 구매 분기를 타는 것이었으므로, pending 분기를 별도로 처리.

**대안 (더 간단)**: `downloadFullOriginal()` 내부에서 `_fullOriginalJpeg`가 null이어도 `sessionStorage`에 `monkos_fullshot_purchased` 플래그가 있으면 크레딧 차감 건너뛰기:

```javascript
async function downloadFullOriginal() {
    // 이미 구매 완료 (재다운로드)
    if (_fullOriginalJpeg) {
        return redownloadFull();
    }

    // charge 복귀 등으로 _fullOriginalJpeg 소실됐지만 이미 구매한 경우
    const alreadyPurchased = sessionStorage.getItem('monkos_fullshot_purchased');

    if (!alreadyPurchased) {
        // 첫 구매: 크레딧 차감
        if (!store.user?.id) return;
        if ((store.user.credits || 0) < CREDIT_COST.fullOriginal) {
            sessionStorage.setItem('monkos_pending_action', 'full_original');
            navigateTo('charge.html?return=thankyou&action=full');
            return;
        }
        const result = await pipe.run('creditUse', { userId: store.user.id, type: 'full_original' });
        store.user = { ...store.user, credits: result.credits };
        sessionStorage.setItem('monkos_fullshot_purchased', '1');
    }

    // JPEG 변환 + 다운로드
    const fullSrc = sessionStorage.getItem('_mo_p');
    if (!fullSrc) return;
    // ... 기존 JPEG 변환 로직 ...
}
```

**두 방식 중 구현하기 편한 쪽 선택. 핵심은 `monkos_fullshot_purchased` 플래그로 이중 차감 차단.**

---

## 수정 3 (P1): 풀샷/SNS 이벤트 성공 피드백

**문제**: `showThankYou()`가 빈 함수라 풀샷 20c 결제 성공, SNS 이벤트 완료 시 사용자에게 아무 피드백 없음.

**파일**: `thankyou.js`

**수정**: 인라인 토스트 함수 추가. shared.js의 showThankYou 대신 로컬에서 간단한 토스트 표시.

```javascript
function showToast(message, duration = 2000) {
    const toast = document.createElement('div');
    toast.textContent = message;
    Object.assign(toast.style, {
        position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(139,92,246,0.9)', color: '#fff', padding: '10px 20px',
        borderRadius: '8px', fontSize: '13px', fontWeight: '600',
        zIndex: '9999', transition: 'opacity 0.3s'
    });
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, duration);
}
```

기존 `showThankYou()` 호출부를 `showToast()`로 교체:
- L173: `showToast('풀샷 원본 다운로드 완료');`
- L213: `showToast('SNS 인증 이벤트 신청 완료 · +100c');`

---

## 완료 조건

- [ ] P0: 카드가 전체 너비로 렌더링되고 구분선 보임
- [ ] P1: charge.html 복귀 시 풀샷 이중과금 차단 (`monkos_fullshot_purchased` 플래그)
- [ ] P1: 풀샷 구매/SNS 이벤트 후 토스트 피드백 표시
- [ ] 커밋 태그: `[hotfix]`

## 보고

- 형식: `[시각] M1/막내2 → M1/쌍아`
- 커밋+push 승인 대기

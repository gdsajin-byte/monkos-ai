---
type: ORDER
date: 2026-03-12
issuer: iMac/쌍아
receiver: iMac/막내4
subject: crop.js 세션 연동 — 앱 내 자동 이미지 로드
priority: P0
category: 프론트엔드
---

# 지시서: crop.js 세션 연동 — 앱 내 자동 이미지 로드

> **[2026-03-12 14:23 KST]** iMac/쌍아 → iMac/막내4

---

## 배경

땡큐 페이지에서 "크롭 조정하기" 클릭 시 `crop.html?from=thankyou&spec=passport`로 이동합니다. crop.js가 URL 파라미터를 감지하여 sessionStorage의 보정 원본을 자동 로드하고, 업로드 UI를 숨겨야 합니다.

## 작업 대상

| 파일 | 경로 |
|------|------|
| crop.js | `monkos_AI/idphoto-kr/public/crop.js` (초기화 영역) |
| crop.html | `monkos_AI/idphoto-kr/public/crop.html` (업로드 UI 영역) |

## 변경 사항

### 1. crop.js — 초기화 시 세션 연동 추가

파일 상단 또는 DOMContentLoaded 리스너 내에 추가:

```javascript
// ─── 앱 내 진입 감지 (thankyou → crop) ───
function checkAppEntry() {
  const params = new URLSearchParams(window.location.search);
  const from = params.get('from');
  const spec = params.get('spec');

  if (from === 'thankyou') {
    // 규격 자동 선택
    if (spec && SPECS[spec]) {
      specKey = spec;
      // 탭 UI 반영
      document.querySelectorAll('.spec-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.spec === spec);
      });
    }

    // sessionStorage에서 보정 원본 로드
    const imageData = sessionStorage.getItem('monkos_image');
    if (imageData) {
      // 업로드 UI 숨김
      const uploadArea = document.querySelector('.upload-area');
      if (uploadArea) uploadArea.style.display = 'none';

      // 이미지 로드 (기존 파일 업로드 핸들러와 동일 경로)
      const img = new Image();
      img.onload = () => {
        loadedImg = img;
        isSample = false;
        // 기존 setPhoto() 또는 해당 함수 호출
        setPhoto(img.src);
      };
      img.src = imageData;
      return true;
    }
  }
  return false;
}
```

**호출 위치:** DOMContentLoaded 또는 기존 초기화 함수 내, 샘플 이미지 로드보다 앞에:

```javascript
// 앱 내 진입이면 자동 로드, 아니면 기존 업로드 대기
if (!checkAppEntry()) {
  // 기존 초기화 (샘플 또는 업로드 대기)
}
```

### 2. crop.html — 업로드 영역 id 확인

- 업로드 영역에 `.upload-area` 클래스 또는 식별 가능한 selector가 있는지 확인
- 없으면 추가 (crop.js에서 숨기기 위해)

### 3. 뒤로가기 처리

크롭앱에서 뒤로가기(브라우저 백) 시 땡큐로 복귀해야 함:

```javascript
// from=thankyou일 때 뒤로가기 = 땡큐 복귀
if (from === 'thankyou') {
  window.addEventListener('popstate', () => {
    window.location.href = 'thankyou.html';
  });
}
```

### 4. 크롭 완료 후 동작

**현재**: `performCrop()` → Canvas → JPEG 다운로드 → 페이지 유지
**변경 없음**: 다운로드 후 페이지에 머무름. 사용자가 브라우저 백 또는 홈으로 이동.

> 크롭앱이 엔드포인트입니다. 다운로드하면 여정 끝.

### 5. 오픈앱 모드 유지

`from` 파라미터가 없으면 기존 동작 그대로:
- 업로드 UI 표시
- 파일 선택 → FaceMesh → 크롭
- 독립 도구로 동작 (향후 crop.monkos.ai)

## ⚠️ 준수 조항

- **헌법 6조**: crop.js는 순수 클라이언트. 서버 호출 추가 금지
- **법률 2장**: 기존 vanilla JS 패턴 유지 (프레임워크 도입 금지)

## 의존성

- **선행**: 막내2 result.js (`monkos_image` 키), 막내3 thankyou.js (`goToCrop()`)
- crop.js 자체 수정은 병렬 가능 (sessionStorage 키만 합의되면)

## 검증

1. **앱 내 진입**: `crop.html?from=thankyou&spec=passport`
   - 업로드 UI 숨김 확인
   - 보정 원본 자동 로드 확인
   - FaceMesh 자동 실행 → 랜드마크 표시 확인
   - 규격 탭 `passport` 자동 선택 확인
   - 크롭 + 다운로드 정상 확인

2. **오픈앱 진입**: `crop.html` (파라미터 없음)
   - 업로드 UI 표시 확인
   - 기존 동작 100% 동일 확인

3. **세션 없이 직접 접근**: `crop.html?from=thankyou&spec=passport` (sessionStorage 비어있음)
   - 이미지 없음 → 업로드 UI 폴백 또는 "이전 단계로 돌아가세요" 안내

---

**— 지시서 끝 —**

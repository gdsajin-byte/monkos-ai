---
type: ORDER
date: 2026-03-12
issuer: iMac/쌍아
receiver: iMac/막내
subject: 크롭앱 다운로드 iOS 분기 처리
priority: P1
category: 프론트엔드
---

# 지시서: 크롭앱 다운로드 iOS 분기 처리

> **[2026-03-12 17:53 KST]** iMac/쌍아 → iMac/막내
> 출처: 작가님 프로덕션 테스트 — iOS 다운로드 시 파일시트 경유 문제

---

## 문제

iOS Safari에서 `<a download>` 방식으로 다운로드하면 파일 아이콘만 보이는 중간 페이지를 거침.
이미지가 직접 표시되지 않아 사용자 경험이 좋지 않음.

## 해결: iOS 분기

### crop.js — 다운로드 함수 (751-761행 부근)

```javascript
// 현재
canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MONKOS_crop_${spec.id}_${spec.pxW}x${spec.pxH}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}, 'image/jpeg', 0.95);

// 변경 — iOS 분기
canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (isIOS) {
        // iOS: 새 탭에 이미지 직접 표시 → 길게 눌러 "사진에 저장"
        window.open(url, '_blank');
    } else {
        // Android/데스크톱: 기존 자동 다운로드
        const a = document.createElement('a');
        a.href = url;
        a.download = `MONKOS_crop_${spec.id}_${spec.pxW}x${spec.pxH}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}, 'image/jpeg', 0.95);
```

> iOS 분기에서 `revokeObjectURL`은 호출하지 않음 — 새 탭에서 이미지 로드 전에 revoke되면 깨짐.

---

## ⚠️ 준수 조항

- **헌법 6조**: API 키/인프라 수정 금지
- crop.js 1파일만 수정. 다른 파일 변경 없음.

## 커밋 + 배포

- 1커밋으로 push
- 배포는 작가님 지시 대기

---

**— 지시서 끝 —**

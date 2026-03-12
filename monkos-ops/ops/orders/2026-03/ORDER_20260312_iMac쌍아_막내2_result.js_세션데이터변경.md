---
type: ORDER
date: 2026-03-12
issuer: iMac/쌍아
receiver: iMac/막내2
subject: result.js 세션 데이터 키 변경 — 노크롭 원본 전달
priority: P0
category: 프론트엔드
---

# 지시서: result.js 세션 데이터 키 변경

> **[2026-03-12 14:23 KST]** iMac/쌍아 → iMac/막내2

---

## 배경

`/api/download` 응답이 `cropped`(크롭본) → `image`(노크롭 원본)으로 변경됩니다. result.js의 `doDownload()` 함수에서 세션 데이터 저장 로직을 맞춰야 합니다.

## 작업 대상

| 파일 | 경로 |
|------|------|
| result.js | `monkos_AI/idphoto-kr/public/result.js` (424-464행) |

## 변경 사항

### doDownload() (424-464행)

**현재:**
```javascript
// 서버 크롭본 → thankyou 표시용
saveSessionData('cropped', data.cropped);
```

**변경:**
```javascript
// 보정 원본 (노크롭) → thankyou 표시 + 크롭앱 전달용
saveSessionData('image', data.image);

// 규격 정보 보존 (크롭앱에서 자동 선택용)
saveSessionData('format', store.format);
```

**전체 변경 후:**
```javascript
async function doDownload() {
  try {
    const res = await fetch('/api/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: store.user.id, gcsPath: _gcsPath, format: store.format }),
    });
    const data = await res.json();

    if (!res.ok) {
      if (res.status === 402) {
        showChargeModal();
        return;
      }
      throw new Error(data.error || '다운로드 실패');
    }

    store.user = { ...store.user, credits: data.credits };

    // 보정 원본 (노크롭) → thankyou + 크롭앱 전달용
    saveSessionData('image', data.image);

    // 원본 Signed URL 보존 (thankyou에서 원본 다운로드용)
    try {
      sessionStorage.setItem('monkos_originalUrl', data.originalUrl);
      sessionStorage.setItem('monkos_gcsPath', _gcsPath);
    } catch(e) {}

    // 전후비교 합성
    await generateCompareImage();

    // thankyou.html로 전환
    navigateTo('thankyou.html');

  } catch (err) {
    Monk.log('다운로드 에러: ' + (err.error || err.message));
    const btn = document.querySelector('#btn-download');
    if (btn) btn.disabled = false;
  }
}
```

**핵심 변경점:**
- `saveSessionData('cropped', data.cropped)` → `saveSessionData('image', data.image)`
- `format`은 이미 저장되고 있다면 확인만. 없으면 추가.

### generateCompareImage() 확인

- 전후비교 합성에서 `monkos_generated` (워터마크 프리뷰)를 사용하고 있으면 → 변경 불필요
- `monkos_cropped`를 참조하고 있으면 → `monkos_image`로 변경

## ⚠️ 준수 조항

- **헌법 6조**: 세션 키 외 인프라 수정 금지
- **법률 2장**: 기존 에러 핸들링 패턴 유지

## 의존성

- **선행**: 막내1 `/api/download` API 변경 완료 후 테스트 가능
- 단, 코드 수정 자체는 병렬 진행 가능

## 검증

- doDownload() 호출 → sessionStorage에 `monkos_image` 존재 확인
- `monkos_cropped` 키 미사용 확인
- thankyou.html 정상 이동 확인
- 전후비교 합성 정상 동작 확인

---

**— 지시서 끝 —**

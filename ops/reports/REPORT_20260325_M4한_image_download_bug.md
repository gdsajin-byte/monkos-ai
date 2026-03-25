[2026-03-25 KST] M4/한 → 쌍아/막내

# BUG: image.monkos.ai 다운로드 버튼 → HTML로 저장되는 문제

## 증상
이미지 저장 버튼 클릭 시 JPG가 아닌 HTML(웹페이지)로 저장됨

## 원인
`index-v6.js` 내 `gi` 함수 (저장 버튼 onClick 핸들러):

```javascript
// ❌ 현재 코드 (크로스 오리진에서 Safari가 download 속성 무시)
const Y = document.createElement("a");
Y.href = B;                                    // B = CDN URL (cross-origin)
Y.download = `MONK_ARTIFACT_${Date.now()}.png`; // ← 확장자도 .png 로 잘못됨
Y.click();
```

Safari(및 일부 브라우저)는 크로스 오리진 URL에서 `<a download>` 속성을 무시함.
→ 파일 다운로드 대신 URL 탐색 → 웹페이지 저장 다이얼로그 출력

같은 버그가 두 곳에 있음:
- pos 203728: `Ml.href=V.url, Ml.download=...png, Ml.click()`
- pos 225658: `Y.href=B, Y.download=...png, Y.click()`

## 수정 코드

```javascript
// ✅ 수정 코드 (fetch → blob → objectURL 방식)
const downloadImageAsJpg = async (url, filename) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    // JPG로 변환 (필요 시)
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename || `MONK_ARTIFACT_${Date.now()}.jpg`; // .png → .jpg
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl); // 메모리 해제
  } catch (err) {
    console.error("Download failed:", err);
  }
};
```

## 적용 위치

`gi` 함수 내 다운로드 부분:

```javascript
// 변경 전
const Y = document.createElement("a");
Y.href = B;
Y.download = `MONK_ARTIFACT_${Date.now()}.png`;
Y.click();

// 변경 후
const response = await fetch(B);
const blob = await response.blob();
const blobUrl = URL.createObjectURL(blob);
const Y = document.createElement("a");
Y.href = blobUrl;
Y.download = `MONK_ARTIFACT_${Date.now()}.jpg`;
document.body.appendChild(Y);
Y.click();
document.body.removeChild(Y);
URL.revokeObjectURL(blobUrl);
```

두 곳 동일하게 수정 필요.

## 우선순위
🔴 높음 — 사용자가 생성한 이미지를 저장할 수 없는 핵심 기능 버그

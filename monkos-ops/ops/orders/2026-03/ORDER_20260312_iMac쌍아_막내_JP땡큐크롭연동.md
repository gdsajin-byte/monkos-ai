---
type: ORDER
date: 2026-03-12
issuer: iMac/쌍아
receiver: iMac/막내
subject: JP 땡큐 페이지 — KR 동기화 + 크롭앱 연동
priority: P1
category: 프론트엔드
---

# 지시서: JP 땡큐 페이지 — KR 동기화 + 크롭앱 연동

> **[2026-03-12 18:29 KST]** iMac/쌍아 → iMac/막내
> KR 땡큐에 적용한 변경사항을 JP에도 반영 + 크롭앱 연결

---

## 변경 1: 서브텍스트 강화 (thankyou.html 388행)

```html
<!-- 현재 -->
<div class="ty-celebration-sub">下からダウンロードしてください</div>

<!-- 변경 -->
<div class="ty-celebration-sub">
    こちらはクロップされていないフルサイズ原本です<br>
    パスポート(3.5×4.5)または証明写真(3×4)規格が必要な場合は<br>
    <strong style="color:#B4A0FF;">規格カスタムクロップ</strong>を選択してください
</div>
```

---

## 변경 2: 규격명 고정 텍스트 (thankyou.html 396행)

```html
<!-- 현재 -->
<div class="ty-photo-spec" id="ty-spec-name"></div>

<!-- 변경 -->
<div class="ty-photo-spec">AI補正 原本</div>
```

---

## 변경 3: 다운로드 버튼 문구 (thankyou.html 400행)

```html
<!-- 현재 -->
<button class="ty-download-btn" id="btn-ty-download">📥 ダウンロード</button>

<!-- 변경 -->
<button class="ty-download-btn" id="btn-ty-download">📥 フルサイズ原本ダウンロード (No Crop)</button>
```

---

## 변경 4: 크롭 버튼 추가 (thankyou.html — 다운로드 버튼 바로 아래, 400행 뒤)

```html
<!-- 신규 추가 -->
<button class="ty-crop-btn" id="btn-ty-crop" onclick="goToCrop()">✂️ 規格カスタムクロップ (パスポート/証明写真)</button>
```

> `ty-crop-btn` 클래스가 JP app.css에 없으면 KR thankyou.html에서 해당 스타일 블록을 복사.

---

## 변경 5: 하단에 데이터 저장 정책 링크 추가 (thankyou.html — 구분선 아래, 홈 버튼 위)

```html
<!-- 422행 구분선 뒤, 424행 홈 버튼 앞에 삽입 -->
<a href="/policy/data" target="_blank" rel="noopener"
   style="display:block; padding:10px 16px; margin:0 16px; background:#111827; border:1px solid #1E293B; border-radius:12px; text-align:center; text-decoration:none; cursor:pointer;">
    <div style="font-size:11px; color:#64748B; line-height:1.5;">
        📂 ダウンロードしたファイルはお客様のデバイスに保存されます
    </div>
    <div style="font-size:11px; color:#6C5CE7; font-weight:600; margin-top:4px;">
        データ保存ポリシーを見る →
    </div>
</a>
```

---

## 변경 6: goToCrop 함수 추가 (thankyou.js)

KR thankyou.js의 `goToCrop()` 함수를 JP에도 추가.

```javascript
// ─── クロップアプリ移動 ───
function goToCrop() {
  const format = loadSessionData('format') || 'passport';
  navigateTo(`crop.html?from=thankyou&spec=${format}`);
}

// window 노출에 추가
Object.assign(window, {
  navigateTo,
  goToCrop,
});
```

---

## 변경 7: specNameEl 코드 삭제 (thankyou.js 53-59행)

HTML에서 고정 텍스트로 처리하므로 동적 설정 코드 삭제.

```javascript
// 삭제 대상
const format = loadSessionData('format');
const specNameEl = document.getElementById('ty-spec-name');
if (specNameEl && format) {
  const spec = PHOTO_SPECS[format];
  if (spec) specNameEl.textContent = spec.name;
}
```

---

## ⚠️ 준수 조항

- **헌법 6조**: API 키/인프라 수정 금지
- `ty-crop-btn` CSS가 JP에 없으면 KR에서 복사 (인라인 또는 app.css에 추가)
- `/policy/data` 경로는 미구현 (후속 작업)

## 커밋 + 배포

- 1커밋으로 push
- 배포는 작가님 지시 대기

---

**— 지시서 끝 —**

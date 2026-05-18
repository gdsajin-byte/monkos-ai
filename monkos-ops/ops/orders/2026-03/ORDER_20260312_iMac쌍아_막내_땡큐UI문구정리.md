---
type: ORDER
date: 2026-03-12
issuer: iMac/쌍아
receiver: iMac/막내
subject: 땡큐 페이지 UI 문구 정리 5건
priority: P1
category: 프론트엔드
---

# 지시서: 땡큐 페이지 UI 문구 정리 5건

> **[2026-03-12 17:05 KST]** iMac/쌍아 → iMac/막내
> 출처: 작가님 프로덕션 테스트 피드백

---

## 변경 1: "여권사진 (35x45mm)" 삭제

노크롭 원본을 보여주는데 규격명이 붙으면 "이미 여권사진 규격"이라고 오해.

### thankyou.html 413행

```html
<!-- 현재 -->
<div class="ty-photo-spec" id="ty-spec-name"></div>

<!-- 변경 — 고정 텍스트로 -->
<div class="ty-photo-spec">AI 보정 원본</div>
```

### thankyou.js displayPhoto() 내 (51-56행)

```javascript
// 현재
const specNameEl = document.getElementById('ty-spec-name');
if (specNameEl && format) {
  const spec = PHOTO_SPECS[format];
  if (spec) specNameEl.textContent = spec.name;
}

// 변경 — 삭제 (HTML에서 고정 텍스트로 처리)
```

→ specNameEl 관련 코드 전체 삭제.

---

## 변경 2: 다운로드 버튼 문구

### thankyou.html 417행

```html
<!-- 현재 -->
<button class="ty-download-btn" id="btn-ty-download">📥 보정 원본 다운로드</button>

<!-- 변경 -->
<button class="ty-download-btn" id="btn-ty-download">📥 최종 원본 다운로드</button>
```

---

## 변경 3: 크롭 버튼 문구

### thankyou.html 420행

```html
<!-- 현재 -->
<button class="ty-crop-btn" id="btn-ty-crop" onclick="goToCrop()">✂️ 규격 크롭 조정하기 · 무료</button>

<!-- 변경 -->
<button class="ty-crop-btn" id="btn-ty-crop" onclick="goToCrop()">✂️ 규격 맞춤 자르기 (여권/반명함)</button>
```

---

## 변경 4: 하단 "내 크레딧" → "파일 저장 기간 안내"

헤더 우상에 이미 크레딧 동전 배지가 존재 (380-393행). 하단 크레딧 row 삭제 후 저장 기간 안내로 교체.

### thankyou.html 435-439행

```html
<!-- 현재 -->
<!-- §2-7 크레딧 잔고 (로그인 시만) -->
<div class="ty-credit-row" id="ty-credit-section" data-show="user.id" style="display:none;">
    <span class="ty-credit-label">내 크레딧</span>
    <span class="ty-credit-value"><span data-bind="user.credits">0</span>c</span>
</div>

<!-- 변경 — 파일 저장 기간 안내 -->
<div class="ty-storage-notice" style="padding:10px 16px; margin:0 16px; background:#111827; border:1px solid #1E293B; border-radius:12px; text-align:center;">
    <div style="font-size:11px; color:#64748B; line-height:1.5;">
        📂 다운로드한 파일은 기기에 저장됩니다<br>
        서버 보관: 촬영일로부터 <strong style="color:#94A3B8;">7일</strong> 이내
    </div>
</div>
```

> ⚠️ 실제 보관 기간은 GCS 정책에 따름. 현재 lifecycle rule이 없으면 작가님 확인 필요. 일단 "7일"로 표기.

---

## 변경 5: 셀레브레이션 서브텍스트

```html
<!-- 현재 -->
<div class="ty-celebration-sub">아래에서 다운로드해 주세요</div>

<!-- 변경 — 크롭 옵션 안내 포함 -->
<div class="ty-celebration-sub">원본 다운로드 또는 규격 맞춤 자르기를 선택하세요</div>
```

---

## ⚠️ 준수 조항

- **헌법 6조**: API 키/인프라 수정 금지
- CSS 인라인 스타일은 최소화. 기존 클래스 활용 가능하면 우선.

## 커밋 + 배포

- 1커밋으로 합쳐서 push
- 배포는 작가님 지시 대기

---

**— 지시서 끝 —**

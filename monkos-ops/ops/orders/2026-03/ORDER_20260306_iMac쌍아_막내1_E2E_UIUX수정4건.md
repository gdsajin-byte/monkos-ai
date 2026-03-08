---
type: order
date: 2026-03-06
from: iMac/쌍아
to: iMac/막내1
status: pending
---

# [지시서] E2E UI/UX 수정 4건

> **[2026-03-06 14:59 KST] iMac/쌍아 → iMac/막내1**
> 작가님 E2E 체크 후 지적사항 4건. 프론트엔드 수정.

---

## 작업 1: 포털 헤더 크레딧 — 동전 디자인 적용

**현상**: 포털 헤더에 `Cr` 텍스트 배지만 표시. idphoto-kr의 3D 동전 디자인 미적용.

**수정 대상**:
- `monkos_AI/portal/public/index.html` (라인 226-234: `.credit-badge` CSS, 라인 1206: HTML)

**참조 (정답 코드)**:
- `monkos_AI/idphoto-kr/public/cr-coin.css` — 전체 동전 디자인 시스템
- `monkos_AI/idphoto-kr/public/charge.html` (라인 52-65) — 헤더 동전 HTML 구조

**작업 내용**:
1. `cr-coin.css`를 portal에서도 사용할 수 있도록 적용 (파일 복사 또는 link)
2. portal index.html의 `credit-badge` 영역을 idphoto-kr의 `header-balance` 구조로 교체:
   ```html
   <div class="header-balance" id="creditBadge">
     <div class="header-coin-wrap">
       <div class="header-sparkle"></div>
       <div class="header-sparkle"></div>
       <div class="header-coin">
         <div class="header-coin-face">
           <div class="header-shimmer"></div>
           <span class="cr-sym">Cr</span>
         </div>
       </div>
     </div>
     <span class="balance-amount" id="creditCount">0</span>
     <span class="balance-unit">Cr</span>
   </div>
   ```
3. 기존 `.credit-btn`, `.credit-badge` CSS 제거 또는 교체
4. JavaScript에서 크레딧 표시 토글 로직이 새 구조와 호환되는지 확인

---

## 작업 2: 챗봇 "생성" → "리터칭" 표현 통일

**현상**: 챗봇 시스템 프롬프트에서 "生成(생성)" 표현이 사용자에게 노출됨.

**수정 대상**:
- `monkos_AI/portal/lib/prompts.js`
  - 라인 30: `- 生成: 1回 = 10クレジット消費` → `- リタッチ: 1回 = 10クレジット消費`
  - 라인 151: `- 生成: 1回 = 10クレジット` → `- リタッチ: 1回 = 10クレジット`

**참고**: KR 한국어는 이미 "리터칭"으로 통일 완료. 일본어 사용자 노출 부분만 수정.

---

## 작업 3: 랜딩 이벤트 배지 문구 수정

**현상**: 오픈이벤트 배너에 "가입만 해도"로 표기됨. "간편로그인으로"로 수정 필요.

**수정 대상**:
- `monkos_AI/idphoto-kr/public/index.html` (라인 636)

**현재**:
```html
🎉 오픈 이벤트 — 가입만 해도 무료 체험 가능!
```

**변경**:
```html
🎉 오픈 이벤트 — 간편로그인으로 무료 체험!
```

**추가**: 랜딩 이미지 폴더 형식 정리
- 현재 `public/images/`에 `hero.webp` 1개만 존재
- GCS `monk-ai-images/ads/` 경로의 쇼케이스 이미지 3장 참조 상태 확인
- 이미지 경로가 일관성 있는지 점검하고 필요시 정리

---

## 작업 4: 비로그인 구매 버튼 → 로그인 모달 연결

**현상**: 비로그인 상태에서 충전 구매 버튼 클릭 시 alert만 뜨고 로그인 모달이 안 뜸.

**원인**: `shared.js` 라인 126-128에서 `alert('로그인이 필요합니다')` 사용. `GateModule` 미호출.

**수정 대상**:
- `monkos_AI/idphoto-kr/public/shared.js` (라인 125-128)

**현재 코드**:
```javascript
if (!store.user.id) {
  alert('로그인이 필요합니다');
  return;
}
```

**수정 (참조: result.js 라인 157-161 패턴)**:
```javascript
if (!store.user.id) {
  GateModule.showLoginRequired('크레딧 충전은 로그인이 필요합니다\n첫 로그인 시 10c를 드려요!', () => {
    buyCreditsKR(amount, credits);
  });
  return;
}
```

- `GateModule` import가 shared.js에 없으면 추가 필요
- `modules/gate.js`에서 `GateModule` export 확인

---

## ⚠️ 준수 조항

- **헌법 2조**: 완료 보고 필수 (✅❌💡⏳📁🔀 형식)
- **헌법 6조**: API 키/비밀정보 생성·추측 금지
- **헌법 8조**: 파괴적 명령 금지
- **법률 6장**: 커밋 메시지 `[fix] E2E UI/UX 수정 — 동전디자인+리터칭표현+이벤트배지+로그인모달`

---

## 배포

- 수정 완료 후 **idphoto-kr + portal 양쪽 Cloud Run 재배포** 필요
- `gcloud run deploy monkos-idphoto-kr --source . --region us-central1 --allow-unauthenticated`
- `gcloud run deploy monkos-portal --source . --region us-central1 --allow-unauthenticated`

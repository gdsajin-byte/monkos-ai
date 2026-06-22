---
type: order
date: 2026-06-22
from: iMac/쌍아
to: 막내
status: 대기
portfolio: PF_HEADSHOT
---

# 지시서: 헤드샷 클라이언트 리사이즈 + 크레딧 충전 모달 수정

## 배경
1. 5MB 이상 입력 파일이 Studio 백엔드에서 거부됨 (프론트 10MB vs 백엔드 5MB 불일치)
2. 크레딧 소진 시 결제창 안 뜸 — 헤드샷 페이지에 creditShopModal HTML 누락
3. 아이폰 Pro Max 등 최신 단말의 고해상도 촬영본(10MB+) 일관 수용 필요
4. API 입력 이미지 과금은 파일 크기 무관 고정 토큰 → 리사이즈해도 비용 차이 없음

## 작업 항목

### 1. 클라이언트 리사이즈 (headshot.js)

**파일**: `monkos_AI/portal/public/js/headshot.js`
**위치**: `handleFile()` 함수 (현재 55행 부근)

현재 `FileReader.readAsDataURL(file)`로 원본 그대로 base64 변환 중.
Canvas API로 리사이즈 후 base64 변환하도록 변경.

**스펙**:
- 장변 기준 **1536px** 초과 시 비율 유지 리사이즈
- 1536px 이하는 리사이즈 없이 통과
- 출력 포맷: **JPEG 85%** (`canvas.toDataURL('image/jpeg', 0.85)`)
- 기존 10MB 파일 크기 제한 **제거** (리사이즈 후에는 의미 없음)

**변경 로직**:
```javascript
function handleFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  // 파일 크기 제한 제거 — 리사이즈가 처리
  var reader = new FileReader();
  reader.onload = function(e) {
    var img = new Image();
    img.onload = function() {
      var MAX_SIDE = 1536;
      var w = img.width, h = img.height;
      if (w > MAX_SIDE || h > MAX_SIDE) {
        var ratio = Math.min(MAX_SIDE / w, MAX_SIDE / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      var canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      uploadedImage = canvas.toDataURL('image/jpeg', 0.85);
      // 이하 기존 프리뷰 로직 유지
      previewImg.src = uploadedImage;
      uploadPlaceholder.style.display = 'none';
      uploadPreview.style.display = 'block';
      updateStepIndicators();
      updateGenerateBtn();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}
```

### 2. 크레딧 충전 모달 추가 (render-headshot.js)

**파일**: `monkos_AI/portal/lib/cms/render-headshot.js`
**위치**: `</body>` 직전, `<script src="/js/credits.js"></script>` 이전

현재 헤드샷 페이지에 `creditShopModal` 요소가 없어서 `openCreditShop()` 호출 시 아무 반응 없음.
index.html에 있는 크레딧 충전 모달 HTML을 헤드샷 페이지에도 추가.

**추가할 HTML** (layoutFooter() 뒤, scripts 앞):
```html
<!-- Credit Shop Modal -->
<div class="modal-overlay" id="creditShopModal">
  <div class="modal-box">
    <h3 id="shopTitle">크레딧 충전</h3>
    <p id="shopCurrentLabel"></p>
    <p id="shopCurrentCredits" style="display:none;"></p>
    <div id="shopItems"></div>
    <button class="modal-close-btn" id="shopCloseBtn" onclick="closeCreditShop()">닫기</button>
  </div>
</div>
```

## ⚠️ 준수 조항
- 배포: `deploy.sh` 경유 필수 (ch5 2조)
- 비밀정보: `.env`, 시크릿 수정 금지 (헌법 4조 1항)

## 검증
- [ ] 아이폰 고해상도 사진(10MB+) 업로드 → 에러 없이 생성 완료
- [ ] 리사이즈 후 전송 크기가 ~2MB 이하인지 DevTools Network 탭 확인
- [ ] 크레딧 0인 상태에서 생성 클릭 → 충전 모달 표시
- [ ] 충전 모달에서 상품 선택 → 결제 페이지 이동 (KR: /credits, JP: Line Shop)

## 대상 파일
1. `monkos_AI/portal/public/js/headshot.js` — handleFile 리사이즈
2. `monkos_AI/portal/lib/cms/render-headshot.js` — creditShopModal HTML 추가

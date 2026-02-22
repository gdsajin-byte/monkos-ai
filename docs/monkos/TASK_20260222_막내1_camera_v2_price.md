# 지시서: camera.html 구매모달 v2 가격 보정

> [2026-02-22 17:20 KST] iMac/쌍아 → 막내1

## 역할 선언
> **너는 "막내1호"다. 쌍아가 아니다.**
> - 쌍아 = VSCode 전략실 (이 지시서를 작성한 에이전트)
> - 막내 = iTerm 터미널 (이 지시서를 실행하는 너)
> - 완료 보고: `{디바이스}/막내1 → iMac/쌍아` 형식

## ⚠️ 준수 조항
- 헌법 제6조 (인프라 보호): API 키/환경변수 수정 없음
- 법률 제2장 (코딩 규칙): HTML 하드코딩 값만 변경

## 배경
camera.html의 크레딧 구매모달만 v1 가격이 남아있음. 다른 4개 페이지(index/prep/result/thankyou)는 v2 완료.

## 작업

### 1. camera.html 구매모달 v1→v2 교체

**파일**: `monkos_AI/idphoto-kr/public/camera.html` (L109~L125)

**현행 (v1):**
```html
<button class="credit-pkg" onclick="buyCreditsKR(12900, 10)">
    <div class="pkg-credits">10c</div>
    <div class="pkg-price">₩12,900</div>
</button>
<button class="credit-pkg popular" onclick="buyCreditsKR(29900, 30)">
    <div class="pkg-badge">BEST</div>
    <div class="pkg-credits">30c</div>
    <div class="pkg-price">₩29,900</div>
    <div class="pkg-save">23% 할인</div>
</button>
<button class="credit-pkg" onclick="buyCreditsKR(45900, 50)">
    <div class="pkg-credits">50c</div>
    <div class="pkg-price">₩45,900</div>
    <div class="pkg-save">29% 할인</div>
</button>
```

**변경 (v2) — result.html과 동일하게:**
```html
<button class="credit-pkg" onclick="buyCreditsKR(1450, 10)">
    <div class="pkg-credits">10c</div>
    <div class="pkg-price">₩1,450</div>
</button>
<button class="credit-pkg" onclick="buyCreditsKR(13050, 100)">
    <div class="pkg-credits">100c</div>
    <div class="pkg-price">₩13,050</div>
    <div class="pkg-save">10% 할인</div>
</button>
<button class="credit-pkg popular" onclick="buyCreditsKR(34800, 300)">
    <div class="pkg-badge">BEST</div>
    <div class="pkg-credits">300c</div>
    <div class="pkg-price">₩34,800</div>
    <div class="pkg-save">20% 할인</div>
</button>
<button class="credit-pkg" onclick="buyCreditsKR(50750, 500)">
    <div class="pkg-credits">500c</div>
    <div class="pkg-price">₩50,750</div>
    <div class="pkg-save">30% 할인</div>
</button>
```

### 2. 검증
- grep으로 5개 HTML 파일의 `buyCreditsKR` 호출 인자값 전수 비교
- v1 가격(12900, 29900, 45900) 잔존 0건 확인

## 엔드라인
| 항목 | 내용 |
|------|------|
| 마무리 | `보고 대기` (S2 선행 후 S3에서 일괄 배포) |
| 산출물 | `monkos_AI/idphoto-kr/public/camera.html` |
| 문서 유형 | 해당 없음 |
| 세션 로그 | 해당 없음 (S3에서 일괄 커밋) |

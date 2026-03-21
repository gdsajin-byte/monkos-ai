---
type: report
from: M1/막내3
to: M1/쌍아
date: 2026-03-17
subject: idphoto KR/JP — 레이아웃 폭 탐색 결과 + 개선안
---

# idphoto KR/JP — 레이아웃 폭 탐색 결과

**[2026-03-17 06:00 KST] M1/막내3 → M1/쌍아**

---

## 1. 현재 상태 분석

### 컨테이너 기본 구조

```css
.container { max-width: 480px; margin: 0 auto; padding: 0 20px; }
```

- 미디어 쿼리: **없음** (모바일/데스크탑 동일)
- 실효 콘텐츠 폭: **440px** (480 - 좌우 패딩 40px)

### 네거티브 마진 사용 지점 (뷰포트 확장)

| 셀렉터 | 마진 | 확장 효과 | 비고 |
|---------|------|-----------|------|
| `.hero` | `margin: 0 -20px 8px` | 컨테이너 max-width(480px)까지 확장 | 유지 |
| `.showcase-track-wrap` | `margin: 0 -20px` | 동일 | 유지 |
| `.event-banner` | `margin: 0 -20px` | 동일 | **삭제 예정 — 분석 제외** |

→ 네거티브 마진 요소들은 **패딩 20px를 상쇄**하여 컨테이너 max-width까지 확장하는 패턴.
→ max-width 변경 시: 이 요소들도 자연스럽게 넓어짐. 뷰포트 끝까지 도달하지 않을 뿐 **깨짐 없음**.

---

## 2. 480px에서 문제되는 지점

### (1) 기능 소개 3열 그리드 — **가장 타이트**

```css
.features-grid { grid-template-columns: repeat(3, 1fr); gap: 10px; }
.feature-item { padding: 20px 6px 16px; }
```

- 가용폭: 440px
- 갭 합계: 20px (2 × 10px)
- 각 열: **(440 - 20) ÷ 3 = 140px**
- 내부 패딩 12px(좌우 6px) 제외 → 콘텐츠 영역: **128px**
- JP의 경우 "リアルタイムセルフィー"(10글자) 제목이 128px 안에서 줄바꿈 발생

### (2) 푸터 링크 줄바꿈 — **데스크탑에서 불편**

```
KR: Privacy | Terms | Refund | Credit (4개)
JP: Privacy | Terms | Refund | Credit | 特定商取引法 (5개)
```

- 0.8rem 크기, 440px 안에 링크 + 구분자를 나열
- **JP 5개 링크는 확실히 줄바꿈**, KR도 브라우저에 따라 줄바꿈 가능
- 데스크탑에서 깔끔하게 한 줄 표시 안 됨

### (3) 가격 카드 price-breakdown — **경계선**

```html
리터칭 10c + 다운로드 70c = 80c
```

- flex row, gap 8px
- 칩(~80px) + plus(~10px) + 칩(~100px) + eq(~10px) + total(~40px) ≈ **240px**
- 440px 안에서 여유는 있으나, JP "ダウンロード 70c" 칩이 KR보다 약간 넓음
- 현재 문제 없으나 마진이 빡빡

### (4) 사업자 정보 — **KR 6줄, JP 3줄**

```css
.biz-info-inner { max-width: 600px; }  /* 컨테이너보다 넓지만 440px로 제한됨 */
.biz-info p { font-size: 0.7rem; line-height: 1.8; }
```

- KR: Business / CEO / Reg. No. / E-Commerce / Address / Email / Tel / Hosting — 장문
- JP: 운영 / Email / 특정상취인법 링크 — 간결
- **KR 주소 라인이 440px에서 2~3줄 래핑** → 데스크탑에서 불필요하게 길어짐

### (5) 히어로 영역 — **문제 없음**

- `margin: 0 -20px`으로 480px 확장
- hero-content는 자체 패딩 24px → 콘텐츠 432px
- h1은 `clamp(2rem, 7vw, 2.8rem)` — 반응형 적용됨
- CTA 버튼 `padding: 14px 36px` — 충분

### (6) 쇼케이스 — **문제 없음**

- `showcase-card { width: 140px }` 고정 → 무한 스크롤 트랙
- 컨테이너 폭과 무관하게 동작

### (7) 신뢰 배지 — **경계선** (삭제 예정 시 무시)

- `trust-badge { padding: 16px 20px; gap: 14px; }`
- "여권사진 발급 보장" + "반려 시 100c 지급 · 텔레그램 CS"
- 440px에서 텍스트 래핑은 없으나 여유가 적음

---

## 3. 옵션 분석

### 옵션 A: 단순 확장 (520px 또는 560px)

```css
.container { max-width: 560px; margin: 0 auto; padding: 0 20px; }
```

| 항목 | 480px (현재) | 520px | 560px |
|------|-------------|-------|-------|
| 콘텐츠 폭 | 440px | 480px | 520px |
| 기능 그리드 각 열 | 140px | 153px (+13) | 167px (+27) |
| 푸터 한 줄 가능성 | 낮음 | 중간 | 높음 |

**장점**: 최소 변경 (CSS 1줄), 모든 요소 비례 확장
**단점**: 모바일에서도 max-width가 바뀜 → 하지만 모바일 뷰포트가 480px 미만이면 어차피 뷰포트에 맞춰짐. **실질 영향 없음**
**리스크**: 520~560px 폭의 태블릿에서 좌우 여백이 줄어듦 (미미)

### 옵션 B: 데스크탑 미디어 쿼리

```css
.container { max-width: 480px; margin: 0 auto; padding: 0 20px; }

@media (min-width: 768px) {
  .container { max-width: 560px; }
}
```

**장점**: 모바일 **완전 무영향** 보장, 명확한 분기
**단점**: 미디어 쿼리 추가 → 추후 반응형 확장 시 기준점이 됨 (복잡도 증가 가능성)
**리스크**: 네거티브 마진 요소(hero, showcase)가 768px 전환 시점에서 갑자기 80px 넓어짐 → **시각적 점프**. 하지만 hero는 그라디언트 배경이라 눈에 띄지 않음

### 옵션 C: clamp 기반

```css
.container { max-width: clamp(480px, 80vw, 600px); }
```

- 600px 뷰포트: `80vw = 480px` → 480px (최소값)
- 700px 뷰포트: `80vw = 560px` → 560px
- 750px+ 뷰포트: `80vw = 600px+` → 600px (최대값으로 잠김)

**장점**: 부드러운 전환, 점프 없음
**단점**: clamp 동작이 직관적이지 않음 (디버깅 시 계산 필요)
**브라우저 호환**: Safari 13.1+, Chrome 79+, Firefox 75+ → **실질 문제 없음**
**리스크**: 네거티브 마진 요소가 뷰포트 폭에 따라 점진적 확장 → 자연스러움

---

## 4. 추천안: 옵션 A (560px 단순 확장)

### 추천 이유

1. **모바일 영향 제로**: 현존 모바일 기기 최대 뷰포트는 430px(iPhone 16 Pro Max). 560px는 어떤 모바일에서도 도달 불가 → 모바일에서는 현재와 100% 동일
2. **최소 변경**: CSS 1줄 변경. 미디어 쿼리/clamp 불필요
3. **데스크탑 효과 즉시**: 콘텐츠 폭 440→520px로 80px 확장
   - 기능 그리드 열: 140→167px (19% 넓어짐)
   - 푸터 링크: KR 한 줄 확정, JP 높은 확률로 한 줄
   - 사업자 정보 래핑 감소
4. **네거티브 마진 자연스럽게 동작**: hero/showcase가 560px까지 확장 — 센터 정렬이라 어색함 없음
5. **520px vs 560px**: 520px도 충분하나, 560px가 푸터·biz-info까지 커버. 600px 이상은 모바일 앱 느낌이 깨질 수 있어 560px이 상한선

### 구체적 CSS 변경

**KR** (`monkos_AI/idphoto-kr/public/index.html` :157)
```css
/* 변경 전 */
.container {
  position: relative; z-index: 1;
  max-width: 480px; margin: 0 auto; padding: 0 20px;
}

/* 변경 후 */
.container {
  position: relative; z-index: 1;
  max-width: 560px; margin: 0 auto; padding: 0 20px;
}
```

**JP** (`monkos_AI/idphoto-jp/public/index.html` :157)
```css
/* 동일 변경 */
.container {
  position: relative; z-index: 1;
  max-width: 560px; margin: 0 auto; padding: 0 20px;
}
```

**로그인 모달도 동기화** (KR :579, JP :579)
```css
/* 변경 전 */
.login-modal-content {
  width: 100%; max-width: 480px;

/* 변경 후 */
.login-modal-content {
  width: 100%; max-width: 560px;
```

---

## 5. KR/JP 차이점

| 항목 | KR | JP | 폭 변경 영향 |
|------|----|----|-------------|
| 폰트 | system-ui | Noto Sans JP (wider glyphs) | JP이 약간 더 넓게 렌더링 |
| 푸터 링크 수 | 4개 | 5개 (特定商取引法) | JP이 줄바꿈에 더 취약 |
| 사업자 정보 | 6줄 (상세) | 3줄 (간결) | KR이 폭 확장 혜택 더 큼 |
| 로그인 버튼 | Google/Kakao/LINE | Google/LINE | 동일 |
| 기능 제목 길이 | 짧음 (4~5자) | 김 (7~10자) | JP이 열 확장 혜택 더 큼 |

**결론**: 560px 확장은 KR/JP 모두에서 개선 효과가 있으며, 특히 JP의 긴 텍스트에 더 유리함.

---

## 6. 모바일 깨짐 리스크 평가

| 리스크 | 평가 | 근거 |
|--------|------|------|
| 모바일 레이아웃 변화 | **제로** | 현존 모바일 최대 430px < 560px |
| 태블릿 (768px) | **무시 가능** | 좌우 마진이 104px→84px로 줄지만 시각적 차이 미미 |
| 네거티브 마진 깨짐 | **없음** | hero/showcase는 -20px으로 패딩만 상쇄 → max-width와 무관 |
| 로그인 모달 | **없음** | max-width 동기화 필요 (위 코드에 포함) |

---

## 완료 체크리스트

- [x] KR/JP index.html 전체 구조 분석 완료
- [x] 480px 문제 지점 리스트 작성 (7개 영역 분석)
- [x] 3가지 옵션 영향 분석
- [x] 추천안(A — 560px 단순 확장) + 구체 CSS 코드 포함
- [x] 보고서 작성 완료

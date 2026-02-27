# 지시서: index.html LP 비주얼 디자인 리뉴얼

```
[2026-02-21 03:36 KST] M1/쌍아 → 막내2
```

## 역할 선언

> **너는 "막내 2호"다. 쌍아가 아니다.**
> - 완료 보고: `{디바이스}/막내2 → M1/쌍아` 형식

## 작전 개요

| 항목 | 내용 |
|------|------|
| **작전명** | index.html LP 비주얼 디자인 리뉴얼 |
| **작업 경로** | `MONK_kr/ai_lab/photolab/` |
| **수정 파일** | `index.html` (1파일) |
| **브랜치** | `develop` |
| **목적** | 현재 텍스트 문서형 LP → 증명사진 샘플 이미지가 돋보이는 비주얼 LP로 전환 |

## 0원칙

> **monkos_AI/ 수정 금지.**
> **prep.html, camera.html 등 다른 페이지 수정 금지.**
> **app.css 수정 금지.** (index.html은 인라인 `<style>` 사용 중 — 독자 스타일 유지)
> 작업 범위: `index.html` 1파일만.

---

## 배경

현재 index.html은 텍스트 중심의 "문서형" LP다. 서비스 설명, 가격, 기능 나열에 그치고 있어 **시각적 임팩트가 없다**. 증명사진 서비스인 만큼 **실제 결과물 사진이 전면에** 와야 한다.

---

## GCS 증명사진 샘플 이미지

아래 이미지들을 LP에 활용한다. **전부 public URL, 직접 `<img src>` 가능.**

```
https://storage.googleapis.com/monk-ai-images/ads/20260220_191258_학생증모델_(2).jpg
https://storage.googleapis.com/monk-ai-images/ads/20260220_191245_송혜교닮은.jpg
https://storage.googleapis.com/monk-ai-images/ads/20260220_191208_여자증명측면.jpg
https://storage.googleapis.com/monk-ai-images/ads/20260220_184127_auto_test.jpg
https://storage.googleapis.com/monk-ai-images/ads/20260220_183842_test_ad.jpg
https://storage.googleapis.com/monk-ai-images/ads/1771578266121_0.jpg
```

향후 이미지 추가/교체 시 URL만 바꾸면 됨. 매니페스트 API(`/api/ads`)도 있으나 LP에서는 정적 하드코딩으로 충분.

---

## 디자인 구조

### 전체 레이아웃 (모바일 퍼스트, max-width: 480px 유지)

```
[1] 히어로 영역
    - 배경: 어두운 그라데이션 유지 (현재 다크테마)
    - 중앙: 히어로 이미지 갤러리 (증명사진 3~4장 캐러셀 또는 그리드)
    - 이미지 위에 오버레이 텍스트: "AI 증명사진"
    - LIVE SERVICE 뱃지 유지

[2] Before/After 또는 샘플 쇼케이스
    - 증명사진 결과물을 크게 보여주는 영역
    - 카드형 이미지 그리드 (2열) 또는 가로 스크롤
    - 각 이미지 아래 용도 라벨 (여권, 이력서, 학생증 등)

[3] 기능 소개 (아이콘 + 짧은 텍스트)
    - 현재 서비스 카드의 기능 목록을 간소화
    - AI 코칭 / 규격 자동 / 즉시 다운로드 — 아이콘 3열

[4] 가격 + CTA
    - 현재 가격 정보 유지 (1c 생성 + 8c 다운로드 = 9c)
    - CTA: "촬영 시작하기 →" (prep.html)

[5] 이벤트 카드
    - 현재 디자인 유지 (가입 10c 이벤트)

[6] 사업자 정보 + 푸터
    - 현재 그대로
```

### 핵심 디자인 원칙

1. **이미지가 주인공** — 텍스트가 아니라 결과물 사진이 첫인상을 결정
2. **모바일 최적화** — 480px 기준, 스크롤 최소화
3. **다크테마 유지** — 현재 CSS 변수(--bg, --accent 등) 계승
4. **이미지 로딩 최적화** — `loading="lazy"`, `decoding="async"` 적용
5. **사진관 프리미엄 느낌** — 깔끔하고 고급스러운 톤. 과하지 않게

---

## 히어로 이미지 갤러리 상세

**방식 선택 (택 1, 판단에 맡김):**

### A안: 카드 캐러셀
- 증명사진 3~4장이 자동 슬라이드 (4초 간격)
- CSS-only 또는 최소 JS (외부 라이브러리 금지)
- 카드에 둥근 모서리 + 그림자

### B안: 히어로 그리드
- 2x2 또는 3열 그리드에 증명사진 배치
- 살짝 기울어진 카드 (3~5deg rotate) + 겹침 효과
- 정적이지만 시각적 풍성함

### C안: 풀블리드 히어로
- 대표 사진 1장을 크게 배경으로
- 어두운 오버레이 위에 텍스트
- 하단에 썸네일 스트립 (나머지 사진들)

어떤 방식이든 **증명사진이 히어로 영역 면적의 50% 이상** 차지해야 함.

---

## 샘플 쇼케이스 영역

이미지를 카드로 배치. 각 카드:

```html
<div class="sample-card">
  <img src="GCS_URL" alt="여권 증명사진" loading="lazy" decoding="async">
  <div class="sample-label">여권 / 신분증</div>
</div>
```

- 2열 그리드 (gap 12px)
- 이미지: `border-radius: 12px`, `object-fit: cover`, `aspect-ratio: 3/4` (증명사진 비율)
- 라벨: 이미지 하단 또는 오버레이

이미지-용도 매핑 (파일명 기준 추정, 적절히 배정):
- `학생증모델_(2).jpg` → 학생증
- `송혜교닮은.jpg` → 이력서
- `여자증명측면.jpg` → 컬러증명
- `auto_test.jpg` / `test_ad.jpg` / `1771578266121_0.jpg` → 여권 또는 범용

---

## 보존 사항 (반드시 유지)

1. **CTA**: `<a href="prep.html">촬영 시작하기</a>` — 동선 유지
2. **이벤트 카드**: 가입 10c 이벤트 카드 유지
3. **사업자 정보**: 그대로 (법적 필수)
4. **푸터 링크**: Privacy/Terms/Refund 링크 유지
5. **OG Tags / 파비콘 / 메타태그**: 현재 `<head>` 그대로 유지
6. **다크테마 CSS 변수**: 현재 `:root` 변수 유지 또는 확장
7. **max-width: 480px**: 모바일 LP 기준

---

## 완료 조건

### Level 1 (필수)
- [ ] 증명사진 샘플 이미지가 LP에 표시됨 (최소 3장)
- [ ] 히어로 영역에서 이미지가 주인공
- [ ] CTA → prep.html 동선 유지
- [ ] 이벤트 카드, 사업자 정보, 푸터 유지
- [ ] 모바일(480px) 레이아웃 정상
- [ ] 이미지 lazy loading 적용

### Level 2 (권장)
- [ ] 캐러셀 또는 자동 슬라이드 동작
- [ ] 이미지별 용도 라벨 표시
- [ ] 기능 소개 아이콘 3열 (AI 코칭 / 규격 자동 / 즉시 다운로드)
- [ ] 스크롤 시 부드러운 페이드인 애니메이션

### Level 3 (보너스)
- [ ] 이미지 탭 시 확대 프리뷰
- [ ] CSS-only 캐러셀 (JS 없이)

---

## 참조

- **현재 구현**: `MONK_kr/ai_lab/photolab/index.html` (인라인 CSS, JS 없음)
- **GCS 매니페스트 API**: `functions/api/ads.js` (참고용, LP에서는 미사용)
- **디자인 시스템**: `docs/infrastructure/guides/DESIGN_SYSTEM.md` (참고)

---

## 주의사항

1. **외부 라이브러리/CDN 금지** — CSS/JS 순수 구현
2. **index.html은 독자 `<style>` 사용** — app.css 참조하지 않음
3. **이미지 URL 하드코딩 OK** — GCS public URL 직접 사용
4. **JavaScript 최소화** — 캐러셀 필요 시 `<script>` 인라인, 별도 .js 파일 불필요

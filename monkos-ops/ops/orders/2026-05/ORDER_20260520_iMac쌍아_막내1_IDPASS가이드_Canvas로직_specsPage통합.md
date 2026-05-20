---
type: order
date: 2026-05-20
from: iMac/쌍아
to: iMac/막내1
status: 대기
portfolio: PF_CITADEL
depends_on: ORDER_20260520_iMac쌍아_막내2_CFWorkers_Specs페이지_SSR
---

# 지시서: IDPASS 가이드 Canvas 로직 — specs 상세 페이지 통합

> **[2026-05-20 14:49 KST] iMac/쌍아 → iMac/막내1**

## 배경

specs 상세 페이지(`/specs/{country}/{document}`)의 SVG 실루엣 플레이스홀더를 **IDPASS 스타일 가이드 오버레이가 포함된 Canvas 인터랙티브 데모**로 교체한다. D1 규격 데이터(size, head_height, eye_position)를 읽어 가이드라인 좌표를 동적 계산하고, 범용 인물 이미지 위에 렌더링한다.

이를 통해 각 specs 페이지가 **IDPASS 앱의 라이브 쇼케이스**가 되어, 규격 정보 열람 → 앱 체험 → 다운로드/서비스 CTA 전환 퍼널을 형성한다.

## 사전 컨텍스트 파악 (착수 전 필수)

1. **현재 상세 페이지**: `functions/specs/_lib/template.js` — `renderDetail()` 함수, Hero 영역의 SVG 다이어그램 확인
2. **IDPASS 시안**: `~/Desktop/crop app/idpass_upload_v4.html` — 업로드 화면 가이드 오버레이 (코너 브래킷, 가이드라인, 코칭 라벨, 스펙 태그)
3. **D1 스키마**: `scripts/d1-migration/schema.sql` — documents 테이블의 size_w_mm, size_h_mm, head_height_min_mm, head_height_max_mm, eye_position_*, background 필드
4. **기존 queries.js**: `functions/specs/_lib/queries.js` — `getDocumentDetail()` 이미 규격 데이터 풀 리턴

## 작업 1: 범용 인물 이미지 준비

- 정면 무표정 인물 사진 1장 (성별 중립적, 밝은 배경)
- **AI 생성 금지** — ICAO 기준상 AI 생성 사진 사용 논란 가능. 스톡 이미지 또는 플레이스홀더 실루엣 고도화 중 택 1
- 권장: 현재 SVG 실루엣을 **고품질 반투명 실루엣 + 피부톤 그라데이션**으로 업그레이드 (사진이 아니므로 저작권/AI 이슈 없음)
- 파일: `MONK_kr/images/specs/sample-portrait.svg` (인라인 SVG도 가능)
- 가로세로 비율: 3:4 기본 (규격별로 Canvas에서 비율 조정)

## 작업 2: Canvas 가이드 렌더링 JS 모듈

`functions/specs/_lib/guide-canvas.js` — 클라이언트사이드 JS (template.js에서 인라인 삽입)

### 입력 데이터 (D1에서 서버사이드로 주입)

```javascript
const SPEC = {
  w_mm: 35, h_mm: 45,           // 사진 사이즈
  head_min_mm: 32, head_max_mm: 36,  // 머리 높이 범위
  eye_min_pct: null, eye_max_pct: null,  // 눈 위치 (있으면)
  background: 'white',
  standard: 'ICAO 9303',
  size_display: '35x45',
};
```

### 렌더링 요소

1. **사진 프레임** — 규격 비율로 Canvas 사이즈 동적 계산 (3:4, 1:1, 4:6 등)
2. **코너 브래킷** 4개 — IDPASS 앱 스타일
3. **가이드라인 4개**:
   - HEAD TOP (정수리) — `head_max_mm` 위치
   - EYE LINE (눈높이) — `eye_position` 또는 자동 계산
   - CHIN (턱) — `head_min_mm` 기준
   - SHOULDER (어깨) — 프레임 하단 근처
4. **치수 라벨**: 좌측 "32~36mm", 우측 "4.5cm", 하단 "3.5cm"
5. **스펙 배지**: "35 × 45 mm" + "ICAO" (표준명)
6. **배경색 표시**: 배경 영역에 연한 색상 (white→#f8f8f8, blue→#e8f0fe 등)

### 적합/반려 비교 (O/X 섹션)

현재 SVG 플레이스홀더 2개를 Canvas 기반으로 교체:
- **적합**: 실루엣이 가이드 안에 정확히 위치 + 초록 체크 + "PASS"
- **반려**: 실루엣 기울임 or 위치 이탈 + 빨강 X + "FAIL" + 사유 텍스트

### 구현 방식

- template.js의 `renderDetail()`에서 `<canvas id="spec-guide">` 삽입
- 하단에 `<script>` 블록으로 SPEC 데이터 + Canvas 렌더링 코드 인라인
- 외부 JS 파일 로드 불가 (CF Pages Functions은 정적 에셋과 분리) → 인라인 필수
- Canvas 크기: max-width 300px, 비율은 SPEC.w_mm:SPEC.h_mm

## 작업 3: template.js 수정

- `renderDetail()` 함수의 Hero 우측 영역 교체
- 기존 `.specs-diagram` + `.specs-photo-frame` SVG 블록 → Canvas 블록으로 대체
- O/X 비교 섹션 `.specs-compare` 도 Canvas 기반으로 교체
- SPEC 데이터를 JSON으로 서버사이드 주입: `<script>const SPEC = ${JSON.stringify(specData)}</script>`

## 작업 4: SEO 키워드 보정

H1과 title에 "사진" 키워드 추가:

현재:
```
H1: "2026 🇰🇷 한국 여권·신분증"
title: "한국 여권·신분증 규격 2026 | IDPASS"
```

변경:
```
H1: "🇰🇷 한국 여권사진 규격 2026"
title: "한국 여권사진 규격 2026 — 사이즈·배경·복장 총정리 | IDPASS"
```

- seo.js의 `autoTitle()` 함수 수정
- template.js의 H1 렌더링 수정
- "사진" 삽입 로직: `{국가} {문서명}사진 규격 2026` (단, resume/headshot은 "사진" 불필요)
- 문서 type별 분기: passport/visa/national-id/drivers-license → "사진" 추가, resume/headshot → 추가 안 함

## 작업 5: 로컬 테스트

```bash
wrangler pages dev --d1=DB=6fe2a64b-9144-436c-94f7-1e9375249a1e
```

검증:
1. `/specs/korea/passport` — Canvas 가이드 렌더링, 35×45 비율, 32~36mm 라벨
2. `/specs/united-states/visa` — 51×51 정사각 비율로 Canvas 변경됨
3. `/specs/korea/drivers-license` — 35×45 동일 비율이지만 별도 페이지
4. O/X 비교: PASS/FAIL Canvas 2개 렌더링
5. H1에 "사진" 포함 확인
6. `/ja/specs/korea/passport` — 일본어 라벨 확인

## ⚠️ 준수 조항

- 범용 인물에 **실사 AI 생성 이미지 사용 금지** — 실루엣/일러스트만 허용
- 기존 functions/api/* 무수정
- functions/specs/ 외 다른 라우트 무수정
- GA4 ID: G-C2H9ZM85F7 유지
- author: "Shin-jakka" 유지

## 산출물

1. `functions/specs/_lib/template.js` 수정 (Canvas 가이드 + H1 키워드 보정)
2. `functions/specs/_lib/seo.js` 수정 (autoTitle "사진" 추가)
3. `MONK_kr/images/specs/sample-portrait.svg` (필요 시)
4. 로컬 테스트 스크린샷 (한국 여권 + 미국 비자 최소 2건)
5. COMPLETION 보고서

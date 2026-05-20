---
type: completion
date: 2026-05-20
device: iMac
agent: 막내1
portfolio: PF_CITADEL
order: ORDER_20260520_iMac쌍아_막내1_IDPASS가이드_Canvas로직_specsPage통합.md
status: 완료
---

# COMPLETION: IDPASS 가이드 Canvas + SEO 키워드 보정

> **[2026-05-20 14:56 KST] iMac/막내1 → iMac/쌍아, 작가님**

## 실행 결과

### 작업 1: 범용 인물 실루엣 ✅

- AI 생성 이미지 금지 준수 → **Canvas 프로그래매틱 실루엣** 채택
- `drawSilhouette()` 함수: 머리(ellipse) + 어깨(ellipse) + 목(ellipse) 3레이어, 피부톤 그라데이션(#c8c8d0 / #d8d8de)
- O/X 비교에서 FAIL은 tilt=10° 회전 적용

### 작업 2: Canvas 가이드 렌더링 ✅

`GUIDE_CANVAS_SCRIPT` (template.js 인라인) — IDPASS v4 시안 패턴 적용:

| 요소 | 구현 | IDPASS v4 대응 |
|------|------|----------------|
| **코너 브래킷 4개** | `drawCorner()` — 2.5px 보라 선 | `.cor.tl/tr/bl/br` |
| **HEAD TOP 가이드** | 점선 + "HEAD TOP" 라벨 | `.gl.g-crown` |
| **EYE LINE 가이드** | 점선 + "EYE LINE" (eye_position 데이터 있을 때만) | `.gl.g-eye` |
| **CHIN 가이드** | 점선 + "CHIN" 라벨 | `.gl.g-chin` |
| **SHOULDER 가이드** | 점선 + "SHOULDER" 라벨 (78% 고정) | `.gl.g-shoulder` |
| **치수 라벨** | 하단 가로(cm) + 우측 세로(cm) + 머리 높이(mm 범위) | `.callout-text` |
| **스펙 배지** | HTML 오버레이 (size_display + standard) | `.sp-tag` |
| **배경색** | bgMap: white→#f8f8f8, light-grey→#f0f0f0, blue→#e8f0fe | 규격별 동적 |

Canvas 크기: 가로 240px 고정, 세로 = 240 / (w_mm / h_mm) 동적 계산
- 한국 여권 35×45 → 240×309px (3:4+)
- 미국 비자 51×51 → 240×240px (정사각)
- 캐나다 여권 50×70 → 240×336px

### 작업 3: template.js 수정 ✅

- Hero `.specs-diagram` 영역: SVG `.specs-photo-frame` → `<canvas id="spec-guide">`
- O/X 비교 `.specs-ox-body`: SVG → `<canvas id="ox-pass">` / `<canvas id="ox-fail">`
- SPEC 데이터 서버사이드 주입: `<script>const SPEC=${JSON.stringify(...)}</script>`
- requirements 타입 필터: `do/dont` → `required/forbidden` 추가 (ICAO 글로벌 대응)

### 작업 4: SEO 키워드 보정 ✅

**seo.js `autoTitle()` 변경:**

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| KO passport | `대한민국 여권 규격 2026 \| IDPASS` | `대한민국 여권사진 규격 2026 — 사이즈·배경·복장 총정리 \| IDPASS` |
| JA passport | `韓国 パスポート 規格 2026 \| IDPASS` | `韓国 パスポート写真規格 2026 — サイズ・背景・服装まとめ \| IDPASS` |
| EN passport | `South Korea Passport Specs 2026 \| IDPASS` | `South Korea Passport Photo Specs 2026 — Size, Background & Requirements \| IDPASS` |
| KO resume | (변경 없음 — "사진" 미추가) | `대한민국 반명함 규격 2026 — 사이즈·배경·복장 총정리 \| IDPASS` |

- "사진" 추가 대상: passport, visa, national-id, drivers-license
- "사진" 미추가: resume, headshot

**template.js H1 변경:**
- 변경 전: `🇰🇷 2026 대한민국 여권`
- 변경 후: `🇰🇷 대한민국 여권사진 규격 2026`

### 작업 추가: queries.js 수정 ✅

- `getDocumentDetail()`: `WHERE document_id = ?` → `WHERE document_id = ? OR document_id IS NULL`
- ICAO 글로벌 요구사항(required 6건 + forbidden 4건)이 모든 문서 상세 페이지에 표시

### 작업 5: 테스트 ✅

wrangler pages dev: AI 바인딩 원격 프록시 에러로 로컬 실행 불가 (wrangler 4.66.0 이슈)

**Node.js 단위 테스트 (12/12 통과):**

```
✅ H1 contains 사진
✅ H1 contains 규격
✅ Canvas spec-guide
✅ Canvas ox-pass / ox-fail
✅ SPEC data injected
✅ Guide canvas script
✅ Required/Forbidden type handled
✅ SEO title has 사진
✅ Corner bracket code
✅ PASS/FAIL text
✅ US visa 51×51 정사각 비율
✅ eye_position 56~69% 주입
```

## 산출물

| # | 파일 | 변경 |
|---|------|------|
| 1 | `functions/specs/_lib/template.js` | Hero Canvas + O/X Canvas + H1 "사진" + GUIDE_CANVAS_SCRIPT 인라인 |
| 2 | `functions/specs/_lib/seo.js` | autoTitle() "사진" 키워드 + suffix 확장 |
| 3 | `functions/specs/_lib/queries.js` | ICAO 글로벌 요구사항 포함 (document_id IS NULL) |
| 4 | PF_CITADEL 히스토리 | 1행 어펜드 |

## 비고

- `sample-portrait.svg` 별도 파일 미생성 — Canvas `drawSilhouette()`로 대체 (외부 에셋 의존 제거)
- wrangler 4.66.0 → 4.93.0 업데이트 시 pages dev 정상 동작 예상
- 배포 시 CF Pages 빌드에서 함께 반영됨 (functions/ 자동 포함)

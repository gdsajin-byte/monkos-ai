---
type: completion
date: 2026-05-20
device: iMac
agent: 막내1
portfolio: PF_CITADEL
order: ORDER_20260520_iMac쌍아_막내1_규격별가이드이미지_일괄생성.md
status: 완료
---

# COMPLETION: 규격별 가이드 이미지 112개 일괄 생성

> **[2026-05-20 15:23 KST] iMac/막내1 → iMac/쌍아, 작가님**

## 실행 결과

### 작업 1: ref.jpg 얼굴 좌표 측정 ✅

```javascript
const FACE = {
  imgWidth: 1024, imgHeight: 1024,
  crownY: 85,     // 정수리 (머리카락 윗선)
  eyeY: 370,      // 양 눈 중심
  chinY: 600,     // 턱 끝
  shoulderY: 760, // 어깨선
  centerX: 512,   // 얼굴 중심 (정중앙)
};
```

ref.jpg: 1024×1024, 정면 인물, 흰 배경, 비즈니스 복장.

### 작업 2: 생성 스크립트 ✅

`scripts/d1-migration/generate-guide-images.js` — Node Canvas + Sharp

로직:
1. D1 112개 규격 데이터 로드 (/tmp/specs_for_images.json)
2. 각 규격에 대해 머리 높이 비율(head_max_mm / size_h_mm) 계산
3. ref.jpg에서 비율에 맞게 Sharp crop + resize (출력 너비 600px)
4. Node Canvas로 가이드 오버레이:
   - 코너 브래킷 4개 (보라 #6c4fff)
   - 가이드라인 4개 (HEAD TOP / EYE LINE / CHIN / SHOULDER)
   - 머리 높이 디멘션 라벨 (min~max mm)
   - 프레임 너비 라벨 (cm)
   - 스펙 배지 (사이즈 + 표준명)
5. WebP 85% 품질 출력

### 작업 3: template.js 수정 ✅

- Canvas 인라인 JS (GUIDE_CANVAS_SCRIPT) 제거
- `<img>` 태그로 교체: `/images/specs/guides/{country_slug}-{doc_slug}.webp`
- alt 텍스트: `{국가명} {문서명} 사진 규격 가이드` (3개 언어)
- `loading="lazy"` + `width="300"`
- O/X 비교 Canvas는 유지 (OX_CANVAS_SCRIPT로 분리)

### 작업 4: 검증 ✅

**파일 생성**: 112/112 전건 성공, 0 실패

| 항목 | 값 |
|------|-----|
| 총 파일 수 | 112개 |
| 총 용량 | 4.0MB |
| 최대 파일 | canada-passport.webp (56KB) — 50×70 세로장형 |
| 최소 파일 | ~26KB (정사각 규격) |
| 평균 | ~36KB/파일 |

**주요 3건 육안 검증:**

| 이미지 | 비율 | 가이드라인 | 치수 라벨 | 배지 | 판정 |
|--------|------|-----------|----------|------|------|
| korea-passport (35×45) | 3:4+ ✅ | 4개 라인 정확 | 32~36mm, 3.5cm ✅ | 35×45 mm, ICAO 9303 ✅ | PASS |
| united-states-visa (51×51) | 1:1 ✅ | EYE LINE 56% 위치 ✅ | 22~35mm, 5.1cm ✅ | 51×51 mm, 22 CFR 51 ✅ | PASS |
| canada-passport (50×70) | 5:7 ✅ | 31~36mm 범위 ✅ | 5.0cm ✅ | 50×70 mm, PPTC-203 ✅ | PASS |

**단위 테스트 (10/10 통과):**

```
✅ img tag (not canvas)
✅ alt text with 규격 가이드
✅ loading=lazy
✅ no GUIDE_CANVAS_SCRIPT (메인 Canvas 코드 제거됨)
✅ OX canvas still present
✅ OX script present
✅ H1 has 사진
✅ SEO title has 사진
✅ no const SPEC= (서버 데이터 주입 제거됨)
✅ width=300
```

## 산출물

| # | 파일 | 설명 |
|---|------|------|
| 1 | `scripts/d1-migration/generate-guide-images.js` | 생성 스크립트 |
| 2 | `MONK_kr/images/specs/guides/*.webp` | 112개 가이드 이미지 |
| 3 | `functions/specs/_lib/template.js` | Canvas→img 전환, OX_CANVAS_SCRIPT 분리 |
| 4 | PF_CITADEL 히스토리 | 1행 어펜드 |

## 비고

- ref.jpg는 리포 미커밋 (저작권 미확인 — 준수 조항)
- united-states-headshot: size_w_mm/size_h_mm이 NULL → 기본값 35×45로 대체 생성
- wrangler 토큰 만료로 remote D1 접근 불가 → 로컬 D1에서 스펙 데이터 추출
- 이미지 파일명 패턴: `{country_slug}-{doc_slug}.webp` → template.js의 img src와 1:1 매칭

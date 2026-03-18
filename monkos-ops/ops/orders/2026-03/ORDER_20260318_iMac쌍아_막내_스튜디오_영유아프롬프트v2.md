---
type: order
from: iMac/쌍아
to: iMac/막내
date: 2026-03-18
scope: monkos_AI/studio
status: 대기
---

# 스튜디오 영유아 프롬프트 v2 — 심플화

## 배경
- v1(98%/2%) 프롬프트가 금지 조항이 너무 많아서 Imagen이 오히려 어색하게 반응
- "open mouth acceptable" → 입을 벌려버림, "straighten head" → 누운 사진 억지 변환
- **작가님 방향**: 성인 정본(90%/10%)과 동일 구조, 숫자만 95%/5%로. 자연스럽게.

## 작업 대상
- `monkos_AI/studio/server.js`

## 수정 사항

### 1. IDENTITY_PRESERVATION_BABY를 아래로 교체

기존 v1 상수를 **통째로** 아래로 교체:

```javascript
const IDENTITY_PRESERVATION_BABY = `IDENTITY RULE: 95% SAME CHILD + 5% CLEANUP

PRESERVE (95%):
- Face shape, eye shape, nose, lips, skin tone
- Overall facial structure and unique characteristics
- Baby/toddler proportions — chubby cheeks, soft rounded face, baby fat
- The child must be clearly recognizable as the SAME individual
- Current facial expression (mouth open or closed — keep as-is)

CLEANUP (5% — less than adult retouching):
- Studio flat lighting and clean background
- Minor color/exposure correction
- Make them look clean and presentable (not "enhanced")

DO NOT:
- Apply adult-style beauty enhancement or skin smoothing
- Change facial expression or mouth position
- Alter fundamental facial features or baby proportions
- Make the child look older or more mature

GOAL: "This is my baby, looking clean and presentable" - studio lighting, tidy background, 95% accuracy, 5% minimal cleanup only.`;
```

### 2. EXPRESSION 영유아 분기도 심플화

```javascript
// 기존 v1:
if (age === 'baby') {
  parts.push('[EXPRESSION] Keep the baby\'s natural expression as-is. Open mouth is acceptable for infants. Do NOT force a specific expression.');
}

// v2로 교체:
if (age === 'baby') {
  parts.push('[EXPRESSION] Keep the child\'s natural expression exactly as-is.');
}
```

### 3. buildPromptV5 return문 분기는 유지 (변경 없음)

```javascript
const identity = (age === 'baby') ? IDENTITY_PRESERVATION_BABY : IDENTITY_PRESERVATION;
```

## 요약
- 성인 정본과 **동일한 구조·톤**, 비율만 95%/5%
- 금지 조항 최소화 (4줄), 강제 지시 제거
- "acceptable" 류 표현 제거 → Imagen 오해석 방지

## ⚠️ 준수 조항
- IDENTITY_PRESERVATION 원본 수정 금지
- idphoto-kr 수정 금지

## 완료 기준
- dev 배포 후 보고

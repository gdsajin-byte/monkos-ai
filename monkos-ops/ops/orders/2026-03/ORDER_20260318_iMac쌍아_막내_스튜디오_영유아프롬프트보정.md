---
type: order
from: iMac/쌍아
to: iMac/막내
date: 2026-03-18
scope: monkos_AI/studio
status: 대기
---

# 스튜디오 영유아 I2I 프롬프트 보정

## 배경
- 영유아 사진 보정 시 결과물이 너무 어른스러움
- 현행 IDENTITY_PRESERVATION 정본이 성인 기준 미화 톤 → 영유아에 부적합
- **스튜디오에서 먼저 테스트 → 검증 후 idphoto-kr에 클론** (작가님 지시)

## 핵심 원칙 (작가님 직접 지시)
> 영유아(36개월 미만)는 입이 벌어져도 용인됨.
> 정면컷·조명·배경 등은 깔끔히 정리하되, **표정이나 피부 보정은 매우 자제**.

## 작업 대상
- `monkos_AI/studio/server.js` — `buildPromptV5()` 함수

## 수정 사항

### 1. 영유아 전용 IDENTITY 프롬프트 추가

`IDENTITY_PRESERVATION` 아래에 영유아 전용 상수 추가:

```javascript
const IDENTITY_PRESERVATION_BABY = `IDENTITY RULE: 98% SAME CHILD + 2% CLEANUP ONLY

PRESERVE (98%):
- Face shape, cheek fullness, baby fat, skin texture
- Eye shape, nose, lips — all baby/toddler proportions
- Natural baby expression (open mouth is acceptable for infants)
- Chubby cheeks, soft rounded face, innocent look
- The child must look EXACTLY like the original photo

CLEANUP ONLY (2%):
- Fix lighting to studio flat lighting
- Clean up background
- Straighten head position to front-facing if slightly tilted
- Minor color/exposure correction

DO NOT:
- Smooth or retouch baby skin — keep natural texture
- Change facial expression or close an open mouth
- Apply any beauty enhancement or skin softening
- Make the child look older or more mature
- Alter baby fat, cheek fullness, or face proportions
- Add adult-like lighting/retouching aesthetics

GOAL: "This is my baby, exactly as they are" - front-facing, clean studio lighting and background, but ZERO cosmetic retouching.`;
```

### 2. buildPromptV5()에서 연령 분기

`buildPromptV5()` 함수의 **마지막 return 문**을 수정:

```javascript
// 기존:
return `${IDENTITY_PRESERVATION}\n\n[IMAGE-TO-IMAGE TRANSFORM]\n${parts.join('\n')}`;

// 변경:
const identity = (age === 'baby') ? IDENTITY_PRESERVATION_BABY : IDENTITY_PRESERVATION;
return `${identity}\n\n[IMAGE-TO-IMAGE TRANSFORM]\n${parts.join('\n')}`;
```

### 3. 영유아 EXPRESSION 분기

`buildPromptV5()` 내 EXPRESSION 섹션을 수정:

```javascript
// 기존:
const expr = expression || 'gentle_smile';
if (EXPRESSION_PROMPTS[expr]) {
  parts.push(`[EXPRESSION] ${EXPRESSION_PROMPTS[expr]}`);
}

// 변경:
if (age === 'baby') {
  parts.push('[EXPRESSION] Keep the baby\'s natural expression as-is. Open mouth is acceptable for infants. Do NOT force a specific expression.');
} else {
  const expr = expression || 'gentle_smile';
  if (EXPRESSION_PROMPTS[expr]) {
    parts.push(`[EXPRESSION] ${EXPRESSION_PROMPTS[expr]}`);
  }
}
```

## ⚠️ 준수 조항
- **헌법 5조 2항** — 정체성 보존 원칙. 영유아의 정체성 = 아기다운 얼굴 특징
- **idphoto-kr 수정 금지** — 스튜디오에서 테스트 완료 후 별도 클론 지시서 발행 예정
- `IDENTITY_PRESERVATION` 원본 상수는 절대 수정하지 말 것 (신규 상수 추가)

## 완료 기준
- dev 배포 후 영유아 사진으로 Before/After 비교 가능 상태
- 보고 시 변경된 프롬프트 전문 첨부

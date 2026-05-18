---
type: ORDER
date: 2026-03-12
issuer: iMac/쌍아
receiver: iMac/막내
subject: 표정 프롬프트 보정 + JP 여성 셔츠 프롬프트 수정
priority: P1
category: 프롬프트
---

# 지시서: 표정 프롬프트 보정 + JP 여성 셔츠 프롬프트 수정

> **[2026-03-12 14:39 KST]** iMac/쌍아 → iMac/막내
> 출처: 한송이 QA 피드백

---

## 이슈 1: 이력서 촬영 시 표정이 화난 것처럼 나옴

### 원인
`EXPRESSION_PROMPTS.neutral`이 `'neutral, composed expression'` — AI가 "composed"를 경직된 표정으로 해석.

### 수정 대상

| 파일 | 행 |
|------|---|
| `monkos_AI/idphoto-kr/server.js` | 232-237행 |
| `monkos_AI/idphoto-jp/server.js` | 236-241행 |

### 변경

**현재:**
```javascript
const EXPRESSION_PROMPTS = {
  gentle_smile: 'gentle, subtle smile',
  neutral: 'neutral, composed expression',
  natural_smile: 'natural, friendly smile',
  bright_smile: 'bright, confident smile',
};
```

**변경:**
```javascript
const EXPRESSION_PROMPTS = {
  gentle_smile: 'gentle, subtle smile with soft eyes',
  neutral: 'calm, relaxed neutral expression with soft eyes',
  natural_smile: 'natural, friendly smile',
  bright_smile: 'bright, confident smile',
};
```

**변경 포인트:**
- `neutral`: `composed` → `calm, relaxed` + `with soft eyes` 추가 (눈매 부드럽게)
- `gentle_smile`: `with soft eyes` 추가 (미세한 미소도 눈이 경직되면 화나 보임)

> KR/JP 양쪽 동일하게 적용.

---

## 이슈 2: JP 여성 흰셔츠 선택 시 V넥 블라우스 생성

### 원인
`server.js` 프롬프트 빌더에서 여성(`gender === 'f'`)이면 일괄 `blouse`로 변환:
```javascript
const top = gender === 'f' ? 'blouse' : 'dress shirt';
```

일본 취활(就活) 스츠의 여성 셔츠는 **칼라(collar) 있는 드레스 셔츠**로, 한국 남성 와이셔츠와 유사한 형태. `blouse`라고 하면 AI가 V넥이나 라운드넥을 생성함.

### 수정 대상

| 파일 | 행 |
|------|---|
| `monkos_AI/idphoto-jp/server.js` | 293행 (프롬프트 빌더) |
| `monkos_AI/idphoto-kr/server.js` | 289행 (동일 로직) |

### 변경

**현재:**
```javascript
const top = gender === 'f' ? 'blouse' : 'dress shirt';
```

**변경:**
```javascript
const top = 'collared dress shirt';
```

**변경 포인트:**
- 성별 분기 제거 — 남녀 모두 칼라 있는 드레스 셔츠
- `collared` 명시 — AI가 V넥/라운드넥으로 해석하는 것 차단
- 정장 스츠(suit) 옵션 내에서만 적용되므로, casual/as_is에는 영향 없음

> KR/JP 양쪽 동일하게 적용.

---

## ⚠️ 준수 조항

- **헌법 9조 (I2I 정체성 보존)**: 프롬프트 변경이 얼굴 정체성에 영향 없음 확인
- **헌법 6조 (인프라 보호)**: 프롬프트 텍스트만 수정. API 키/엔드포인트 수정 금지

## 검증

1. **표정 테스트**: neutral 표정으로 생성 → 이전 대비 부드러운 표정 확인
2. **JP 여성 셔츠 테스트**: 여성 + suit + white shirt → V넥 아닌 칼라 셔츠 확인
3. **KR 남성 셔츠**: 기존 정상 동작 유지 확인
4. **casual/as_is**: 영향 없음 확인

---

**— 지시서 끝 —**

---
type: order
from: iMac/쌍아
to: 막내
date: 2026-03-30
priority: 🔴 P0 긴급 (프로덕션 다운)
subject: gemini-3-pro-image-preview → gemini-3.1-flash-image-preview 긴급 교체
---

# 🔴 긴급 지시서: Gemini 이미지 모델 교체 + 배포

**[2026-03-30 20:20 KST] iMac/쌍아 → 막내**

---

## 상황

`gemini-3-pro-image-preview` 모델에서 **403 에러 발생 → 증명사진 앱 프로덕션 다운**.
대체 모델 `gemini-3.1-flash-image-preview`로 즉시 교체 후 배포.

---

## 작업 내역

### 1. 모델명 교체 (5파일)

모든 파일에서 `gemini-3-pro-image-preview` → `gemini-3.1-flash-image-preview` 교체:

| 파일 | 위치 |
|------|------|
| `monkos_AI/idphoto-kr/server.js` | L552 URL 하드코딩 |
| `monkos_AI/idphoto-jp/server.js` | L598 URL 하드코딩 |
| `MONK_kr/ai_lab/photolab/engine/server.js` | L40 `IMAGEN_MODEL` 상수 |
| `functions/api/generate.js` | L37 URL 하드코딩 |
| `functions/api/refine.js` | L57 URL 하드코딩 |

주석/로그 문자열도 같이 교체할 것.

### 2. generationConfig에 responseModalities 추가

`gemini-3.1-flash-image-preview`는 **`responseModalities: ["TEXT", "IMAGE"]`가 필수**.
기존 코드의 generateContent 호출에서 generationConfig에 이 필드가 없으면 추가할 것.

기존:
```js
generationConfig: { imageConfig: { aspectRatio: '3:4' } }
```

변경:
```js
generationConfig: {
  responseModalities: ["TEXT", "IMAGE"],
  imageConfig: { aspectRatio: '3:4' }
}
```

### 3. 배포 (P0 — idphoto-kr/jp 최우선)

```bash
cd monkos_AI/idphoto-kr && echo "y" | bash deploy.sh prod
cd monkos_AI/idphoto-jp && echo "y" | bash deploy.sh prod
```

### 4. E2E 검증

```bash
curl -s https://monkos.ai/idphoto-kr/health
curl -s https://monkos.ai/idphoto-jp/health
```

+ 실제 이미지 생성 테스트 (작가님이 수동 확인)

---

## ⚠️ 준수 조항

- 헌법 제4조 1항: API 키 하드코딩 금지. 기존 .env 참조 유지
- 헌법 제4조 2항: 기존 로직 파괴 주의. 모델명 + generationConfig만 정밀 수정
- 헌법 제3조 3항: 긴급 장애 대응 — 최소 필드 INCIDENT 허용

---

## 완료 기준

- [ ] 5파일 모델명 교체 완료
- [ ] responseModalities 추가 확인
- [ ] idphoto-kr prod 배포 + health 정상
- [ ] idphoto-jp prod 배포 + health 정상
- [ ] 완료 보고

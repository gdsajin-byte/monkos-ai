---
type: order
date: 2026-05-22
from: iMac/쌍아
to: 막내
status: 대기
portfolio: PF_CITADEL
---

# IDPHOTO og:image 절대 URL 수정 + 빈 파일 교체

## 배경

`idphoto-kr.monkos.ai/app`, `idphoto-jp.monkos.ai/app` 모두 og:image가 상대경로(`/og-image.png`)이며, 해당 파일이 **빈 파일**(size 0). Google·SNS 크롤러가 대표 이미지를 뽑아갈 수 없는 상태.

## 작업

### 1. og-image.png 교체 (KR, JP 각각)

기존 GCS 에셋에서 대표 이미지를 선정하여 `public/og-image.png`를 실제 이미지로 교체.

- **KR**: 히어로 영역의 증명사진 샘플 3장 중 1장, 또는 "스튜디오 수준의 증명사진" 섹션 이미지를 1200×630px로 리사이즈/크롭
- **JP**: 동일 패턴으로 JP 서비스에 맞는 이미지 선정

GCS 원본 이미지 참조:
```
https://storage.googleapis.com/monk-ai-images/ads/20260220_191245_송혜교닮은.jpg
https://storage.googleapis.com/monk-ai-images/ads/20260220_191258_학생증모델_(2).jpg
https://storage.googleapis.com/monk-ai-images/ads/20260220_191208_여자증명촬영면.jpg
```

### 2. og:image 메타태그 절대 URL로 변경

**KR** (`monkos_AI/idphoto-kr/` 내 HTML 또는 SSR 렌더러):
```html
<!-- before -->
<meta property="og:image" content="/og-image.png">
<!-- after -->
<meta property="og:image" content="https://idphoto-kr.monkos.ai/og-image.png">
```

**JP** (`monkos_AI/idphoto-jp/` 내 동일 위치):
```html
<meta property="og:image" content="https://idphoto-jp.monkos.ai/og-image.png">
```

### 3. og:image 추가 메타태그 (권장)

```html
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:type" content="image/png">
```

## 배포

- KR: `monkos_AI/idphoto-kr/deploy.sh prod`
- JP: `monkos_AI/idphoto-jp/deploy.sh prod`

## 검증

```bash
curl -s https://idphoto-kr.monkos.ai/app | grep 'og:image'
# → content="https://idphoto-kr.monkos.ai/og-image.png"

curl -sI https://idphoto-kr.monkos.ai/og-image.png -o /dev/null -w "%{http_code} %{size_download}\n"
# → 200, size > 0

curl -s https://idphoto-jp.monkos.ai/app | grep 'og:image'
curl -sI https://idphoto-jp.monkos.ai/og-image.png -o /dev/null -w "%{http_code} %{size_download}\n"
```

## ⚠️ 준수 조항

- 배포는 반드시 deploy.sh 경유 (법률 ch5 2조)
- 이미지 에셋은 기존 GCS 공개 이미지에서 선정. 고객 실사진 사용 금지 (헌법 1조 3항)

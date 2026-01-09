# MONK Imagen 3.0 Proxy

Google Imagen 3.0을 ai_PHOTOLAB에서 사용하기 위한 Cloudflare Workers 프록시입니다.

## 🚀 배포

```bash
cd cloudflare-workers-imagen
npx wrangler login
npx wrangler deploy
```

## 🔑 API 키 설정

Cloudflare Dashboard → Workers → monk-imagen-proxy → Settings → Variables

필요한 환경변수:
- `GOOGLE_CLOUD_API_KEY` - Google Cloud API 키
- `GCP_PROJECT_ID` - Google Cloud 프로젝트 ID

## 📝 API 사용법

```bash
curl -X POST https://monk-imagen-proxy.gdsajin.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "따뜻한 햇살이 비치는 카페",
    "aspectRatio": "16:9",
    "style": "realistic"
  }'
```

## 지원 옵션

**aspectRatio:**
- `1:1` - 정사각형
- `16:9` - 와이드
- `9:16` - 세로
- `4:3` - 표준

**style:**
- `realistic` - 사실적
- `artistic` - 예술적
- `anime` - 애니메이션
- `3d` - 3D 렌더링

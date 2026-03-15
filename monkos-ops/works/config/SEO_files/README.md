# SEO_files — 서비스 공통 SEO 자산

> 모든 MONKOS 서비스에 배포할 파비콘·아이콘·OG 이미지 원본 세트.
> 새 서비스 배포 시 여기서 필요한 파일을 복사하여 public/에 배치.

## 파일 목록

| 파일 | 규격 | 용도 |
|------|------|------|
| `monkos-icon.svg` | 벡터 | 마스터 벡터 아이콘 |
| `favicon-16.png` | 16x16 | 브라우저 탭 (소형) |
| `favicon-32.png` | 32x32 | 브라우저 탭 (표준) |
| `favicon-64.png` | 64x64 | 고해상도 탭 |
| `favicon-128.png` | 128x128 | 크롬 웹스토어 등 |
| `favicon-192.png` | 192x192 | **Google SERP + PWA manifest** |
| `favicon-256.png` | 256x256 | Windows 타일 등 |
| `favicon-512.png` | 512x512 | PWA manifest (필수) |
| `monkos-icon-1024.png` | 1024x1024 | 마스터 래스터 원본 |
| `apple-touch-icon.png` | 180x180 | iOS 홈화면 |
| `og-image-sample.png` | 1200x630 | SNS 공유 이미지 (idphoto 샘플, 포털용 별도 제작 필요) |

## HTML 삽입 템플릿

```html
<!-- Favicon -->
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="icon" href="/favicon-192.png" sizes="192x192" type="image/png">
<link rel="icon" href="/monkos-icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">

<!-- OG Image -->
<meta property="og:image" content="https://{도메인}/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
```

## 원본 출처

- 벡터: `monkos-ops/ops/assets/logo/monkos-icon.svg`
- 래스터: `~/Desktop/철창이/로고/` (1024~16px 풀세트, 철창이 제작)

---

> 최종 갱신: 2026-03-15 iMac/쌍아

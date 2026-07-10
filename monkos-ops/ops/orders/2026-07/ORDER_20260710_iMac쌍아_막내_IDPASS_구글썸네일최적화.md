---
type: order
date: 2026-07-10
device: iMac
agent: 쌍아
recipient: 막내
subject: "IDPASS 구글 검색결과 썸네일 최적화 — 이미지 전략 + 배포"
priority: 보통
portfolio: PF_IDPASS
---

# IDPASS 구글 검색결과 썸네일 최적화

**[2026-07-10 12:42 KST]** iMac/쌍아 → 막내

## 배경

"ai 증명사진" 구글 검색에서 `idphoto-kr.monkos.ai`가 상위에 복귀했으나, 썸네일에 몽코스 캐릭터 OG 카드가 표시됨. 경쟁사(드롭샷 AI, 증명한컷, idcut.kr)는 모두 **증명사진 결과물 얼굴 이미지**가 1:1로 표출되어 클릭률에서 불리.

원인: 페이지 내 증명사진 샘플이 GCS 외부 도메인(`storage.googleapis.com`)에서 로드되어 구글이 같은 도메인의 `og-image.png`를 우선 선택.

## 목표

구글 검색결과 썸네일에 **증명사진 결과물 이미지**가 표시되도록 유도.

## 작업 내용

### 1. 대표 결과물 이미지 준비

- 기존 비포/애프터 소재 중 **애프터(완성된 증명사진)** 이미지 사용
  - 소스: `MONKOS_ASSETS/CROP APP/ref.jpg` 또는 GCS `monk-ai-images/ads/` 내 기존 결과물
- **1:1 정사각형(1200×1200px)** 크롭 — 얼굴 중심, 상반신 포함
- 파일명: `hero-result.jpg`

### 2. 같은 도메인에 이미지 호스팅

- 이미지를 `idphoto-kr.monkos.ai` 도메인에서 직접 서빙하도록 배치
  - Cloud Run 정적 파일 서빙 경로: `/images/hero-result.jpg`
  - 또는 `public/images/` 디렉토리에 포함하여 빌드 배포
- **GCS 외부 URL 사용 금지** — 구글이 같은 도메인 이미지를 우선 선택하는 것이 핵심

### 3. 페이지 상단 배치

- 랜딩 히어로 섹션 내 첫 번째 이미지로 `hero-result.jpg` 배치
- 기존 GCS 이미지(송혜교닮은, 학생증명모델, 여자증명측면)보다 **상위**, **더 큰 사이즈**로
- `alt` 속성: `"AI 증명사진 결과물 - MONKOS AI"`
- 구글은 페이지 상단의 큰 이미지를 우선 선택

### 4. 구조화 데이터 추가 (선택)

현재 JSON-LD 구조화 데이터가 없음. 추가하면 구글 이미지 선택에 영향:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "MONKOS AI 증명사진",
  "description": "셀카 한 장으로 증명사진 완성. AI가 배경·조명·피부를 사진관 수준으로 보정합니다.",
  "image": "https://idphoto-kr.monkos.ai/images/hero-result.jpg",
  "url": "https://idphoto-kr.monkos.ai",
  "applicationCategory": "PhotographyApplication",
  "offers": {
    "@type": "Offer",
    "price": "9900",
    "priceCurrency": "KRW"
  }
}
</script>
```

### 5. OG 이미지도 교체 (별도 목적)

- 기존 `og-image.png` (몽코스 캐릭터 카드)를 유지하되, 카카오/메타 공유 시 더 효과적인 소재로 교체 검토
- 이건 구글 썸네일과 별개 — 우선순위 낮음. 구글 썸네일 해결이 먼저.

### 6. 배포 후 색인 갱신 요청

- 배포 완료 후 Google Search Console → URL 검사 → `https://idphoto-kr.monkos.ai/` 색인 생성 요청
- ⚠️ GSC 접근은 작가님에게 요청할 것 (직접 실행 금지)

## ⚠️ 준수 조항

- 배포는 `deploy.sh` 경유 필수 (ch5 2조)
- 실제 인물 이미지 사용 시 저작권/초상권 확인 — 기존 승인된 소재만 사용
- 페이지 기존 구조/기능 변경 최소화 — 이미지 추가 + 배치 조정만

## 완료 기준

- [ ] `hero-result.jpg` 1:1 크롭 이미지 준비
- [ ] 같은 도메인(`idphoto-kr.monkos.ai/images/`)에서 서빙 확인
- [ ] 페이지 히어로 섹션 상단에 배치 완료
- [ ] JSON-LD 구조화 데이터 `image` 필드 포함
- [ ] dev 배포 후 이미지 로딩 정상 확인
- [ ] COMPLETION 보고서 작성

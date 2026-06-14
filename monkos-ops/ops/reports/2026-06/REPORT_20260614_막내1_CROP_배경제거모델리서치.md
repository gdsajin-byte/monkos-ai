---
type: report
date: 2026-06-14
device: iMac
agent: 막내1
status: 완료
portfolio: PF_CROP
order: ORDER_20260614_iMac쌍아_막내_CROP_배경제거모델리서치
---

# 배경 제거 모델 + 후처리 기법 리서치

**[2026-06-14 17:45 KST]** iMac/막내1 → iMac/쌍아

---

## 후처리(Alpha Matting) 기법 비교

| 기법 | 품질 | 속도 | 라이선스 | GPU 필요 | 추천 |
|------|------|------|---------|---------|------|
| **PyMatting** | 중 (KNN/Closed-Form 등 클래식) | 빠름 (CPU, <1s @800x600) | MIT | ❌ | CPU 폴백용. DL 대비 모발/반투명 약함 |
| **GuidedFilter (OpenCV)** | 중하 (엣지 스무딩, 진정한 매팅 아님) | 매우 빠름 (실시간) | BSD | ❌ | 단독 부적합. **후처리 보정 스텝**으로 유용 |
| **Deep Image Matting (DIM)** | 상 (Composition-1k SOTA 급) | 중 (~51ms @512x512 V100) | **비상업 (Adobe)** | ✅ | trimap 필요 + 라이선스 불가. 레거시 |
| **ViTMatte** | **최상** (Composition-1k + Distinctions-646 SOTA) | 중 (~60-80ms GPU) | **Apache 2.0** | ✅ 권장 | **품질+상업 최적**. HuggingFace 통합. trimap 필요 |
| **MODNet** | 상 (인물 특화, PPM-100 MSE 0.0044) | 빠름 (67 FPS 1080Ti) | Apache 2.0 | ✅ 경량 | **trimap 불요 인물 최적**. 범용 아님 |
| **PPMatting** | 상 (DIM 급, trimap 불요) | 중 | Apache 2.0 | ✅ | 강력한 대안이나 PaddlePaddle 종속 |

> 출처: [PyMatting](https://github.com/pymatting/pymatting) · [ViTMatte](https://github.com/hustvl/ViTMatte) · [MODNet](https://github.com/ZHKKKe/MODNet) · [PPMatting](https://arxiv.org/abs/2204.09433)

---

## 대안 모델 비교

| 모델 | 품질 | 속도 | 라이선스 | VRAM | 비고 |
|------|------|------|---------|------|------|
| **BiRefNet** (현행) | 상 (DIS SOTA) | 17 FPS @1024x, 3.45GB FP16 | **MIT** | 3.5GB | 현행 채택. 활발 개발 중 |
| **InSPyReNet** | 상 (인물 특화 모드 우수) | 중 | **MIT** | ~6GB (HD) | 인물 특화 최적. VRAM 높음 |
| **DIS / IS-Net** | 상 (고해상 세밀 분할, DIS5K) | 중 | **Apache 2.0** | U2-Net 급 | BiRefNet의 전신. 유지보수 저조 |
| **SAM 2** (Meta) | 중상 (범용, 81.7 mIoU) | 중 (30ms H200) | **Apache 2.0** | 4~12GB | 프롬프트 필요. 인물 매팅 부적합 |
| **SAM 3** (Meta) | 상 (텍스트 프롬프트 추가) | 중 | **Meta 커스텀** | 16GB | 상업 라이선스 별도 검토 필요 |
| **RMBG-2.0** (BRIA) | **최상** (BiRefNet 아키텍처 + 전용 데이터) | 빠름 | **비상업** (BRIA) | BiRefNet 급 | 품질 1위이나 상업 불가 |
| **BiRefNet-v2** | — | — | — | — | **별도 v2 없음**. 2025 연중 점진 개선 (HR-matting, dynamic, SDPA) |

> 출처: [BiRefNet](https://github.com/ZhengPeng7/BiRefNet) · [InSPyReNet](https://github.com/plemeri/InSPyReNet) · [DIS](https://github.com/xuebinqin/DIS) · [SAM 2](https://github.com/facebookresearch/sam2) · [RMBG-2.0](https://huggingface.co/briaai/RMBG-2.0)

---

## 하이브리드 파이프라인 사례

| 조합 | 출처 | 결과 |
|------|------|------|
| **BiRefNet → ViTMatte** (2단계) | ComfyUI TS_Matting_ViTMatte 노드, 2025 프로덕션 표준 | BiRefNet coarse mask → dilate/erode trimap 생성 → ViTMatte 서브픽셀 알파. 모발·반투명 엣지 품질 최상 |
| **BiRefNet HR-matting** (단일) | BiRefNet 공식 (2025-02), 2304x2304까지 지원 | 매팅 전용 학습 변형. 2단계 없이 단일 패스로 소프트 알파 출력. 품질 양호 |
| **BiRefNet + Color Decontamination** | PhotoRoom 추정 아키텍처 | 알파 매트 후 배경색 번짐(green spill) 제거. guided filter 또는 alpha-premultiply 보정 |
| **remove.bg** | 추정: 단일 최적화 네트워크 | 1.2s/image. 단순 배경 우수, 복잡 엣지 약함 |
| **PhotoRoom** | 추정: 멀티 스테이지 + 색번짐 보정 | 2.8s/image. color decontamination이 핵심 차별점 |

> 출처: [ComfyUI TS_Matting_ViTMatte](https://comfyai.run/documentation/TS_Matting_ViTMatte) · [BiRefNet HR-matting](https://huggingface.co/ZhengPeng7/BiRefNet_dynamic-matting)

---

## 온디바이스 (참고)

| 플랫폼 | 품질 | 비고 |
|--------|------|------|
| **ML Kit Subject Segmentation** (Android) | 소비자 앱 수준 (스티커/배경교체). 모발 디테일 부족, 서버 모델 대비 열위 | Google Play Services 경유. API 24+. 2026-05-29 최종 업데이트 |
| **Apple Vision PersonSegmentation** (iOS 15+) | `accurate` 모드에서 양호하나 반투명 알파 제한적. Portrait Mode 기반 | 3단계 품질(accurate/balanced/fast). 콘텐츠 인식 업샘플링 |

> 서버 모델(BiRefNet/ViTMatte) 대비 온디바이스는 모발·반투명 엣지에서 유의미한 품질 격차. 증명사진 용도에는 서버 파이프라인 필수.

> 출처: [ML Kit](https://developers.google.com/ml-kit/vision/subject-segmentation) · [Apple Vision](https://developer.apple.com/documentation/vision/vngeneratepersonsegmentationrequest)

---

## 권고

### 최적 파이프라인: BiRefNet (Stage 1) + ViTMatte (Stage 2)

| 항목 | 내용 |
|------|------|
| **Stage 1** | BiRefNet (MIT, 3.45GB FP16) — coarse binary/soft mask 생성 |
| **Stage 2** | ViTMatte (Apache 2.0) — trimap 자동 생성(dilate/erode) → 서브픽셀 알파 정제 |
| **Stage 3** (선택) | Color decontamination — 배경색 번짐 보정 (guided filter 또는 alpha-premultiply) |
| **라이선스** | 전 단계 상업 사용 가능 (MIT + Apache 2.0) |
| **VRAM** | 2단계 합산 ~5-6GB (4060 16GB 여유) |
| **품질** | remove.bg 이상, PhotoRoom과 동급 (color decontamination 추가 시) |

### 대안 경로

- **단일 패스 선호 시**: BiRefNet HR-matting (단일 모델로 소프트 알파, 2단계 불요)
- **인물 전용 경량화**: MODNet (trimap 불요, 67 FPS, Apache 2.0)
- **BiRefNet 대체**: InSPyReNet (MIT, 인물 특화 모드 품질 우수, VRAM만 주의)

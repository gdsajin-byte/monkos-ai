---
type: portfolio
id: PF_VTON
name: VTON
subject: 이너웨어/패션 AI 가상착장(VTON) 사업화 — 4060 로컬 CatVTON 파이프라인
created: 2026-05-31
owner: 작가님
leads: 쌍아(설계), 4060막내(구현)
status: active
---

# PF_VTON — 패션/이너웨어 가상착장 사업화

> "우리 모델에게 제품(의상)을 정확히 입힌다" — 이너웨어 상세페이지를 AI로 생산하는 VTON 파이프라인.
> 정체성 보존(헌법 1조 3항) 하에 모델·제품 레퍼런스를 합성.

## 배경 / 기술 결론 (2026-05-31 확정)

클라우드 엔진으로는 이너웨어 VTON이 **원천 불가**함을 실측으로 확정:
- **Imagen 4**: I2I 미지원 (T2I 전용) → 특정 모델·제품 입력 불가
- **nano-banana (Gemini 3.x image)**: I2I 가능하나 **노출 인물 출력 거부**. `safetySettings: BLOCK_NONE`으로도 출력단 인물정책은 안 풀림

→ **유일 경로 = 4060 로컬 (ComfyUI)**. CatVTON이 1024×768을 **8GB 미만**으로 설계되어 RTX 4060(8GB)에 적합.

## 4060 환경 (2026-05-31 정찰)

- ComfyUI portable: `C:\AI_Factory\ComfyUI_windows_portable\ComfyUI` (Py 3.13.9 / Torch 2.9.1+cu130 / CUDA 13.0)
- 모델 공유: Forge/webui 경로 (`C:\AI_Factory\webui\models\`) — extra_model_paths.yaml
- 체크포인트: **JuggernautXL** (사실계 SDXL). LoRA: `monk_test_100steps`, `SJK_SDXL_v1` (정체 규명 필요)
- IP-Adapter 5종(대부분 FaceID/face), CLIP-ViT-H/bigG, ipadapter_plus 노드
- **ControlNet 부재** / 출력 자동동기화: `G:\4060Factory\OUTPUT_Zone\Images` (구글드라이브)
- ⚠️ `monk_fashion_v1`은 실재하지 않음 (5/30 인벤토리 부정확)

## VTON 노드 결정

- ❌ **pzc163/Comfyui-CatVTON**: detectron2 v0.6(2021) 의존 → 현 스택(Py3.13/Torch2.9/CUDA13)과 충돌, 빌드 불가
- ✅ **chflame163/ComfyUI_CatVTON_Wrapper**: detectron2-free (numpy<2.0/pillow<10/Scipy/diffusers/accelerate/transformers). 6GB+ 권장

## 모델 전략 (2026-05-31 리서치 — 2단계 GPU)

NSFW 커뮤니티(Civitai 사실계)가 인체 리얼리즘을 선도하는 게 업계 현실 — 단 대부분 SDXL/Flux/Pony **파인튜닝**이지 독자 모델 아님. 우리 용도는 정당 이너웨어/패션 커머스(tasteful), 헌법 4조 검토 통과.

**베이스 사실계 (Flux 외 후보)**
| 모델 | 특징 | VRAM | 4060 |
|------|------|------|------|
| SDXL 사실계 (JuggernautXL·RealVisXL·epiCRealism) | Civitai 주력, 즉시 사용 | 8GB | ✅ |
| Z-Image-Turbo | 초고속·FLUX.2/Imagen4급, 적은 스텝 | 중 | △ |
| Qwen-Image (Alibaba) | 사실적 얼굴·피부·질감, Apache | 20GB+ | ❌(RunPod) |
| HiDream-I1 | 오픈소스 최상위 상업용 사실성 | 큼 | ❌(RunPod) |

**VTON SOTA**
- **CatVTON + Flux.1 Dev Fill = VITON-HD 벤치 SOTA** (FitDiT·IDM-VTON·StableVITON 능가, ~35초/컷)
- **Re-CatVTON**: 개선판, Leffa보다 적은 연산·메모리로 더 좋은 FID/KID/LPIPS
- IDM-VTON: 사실성 높으나 프린트/로고 드리프트·마스킹 민감

**2단계 GPU 전략** (고정비 0, 쓸 때만 과금)
1. **1단계 (4060, 무료)**: CatVTON_Wrapper + SDXL 사실계 → 타당성·워크플로우 검증
2. **2단계 (RunPod 임대)**: 품질 필요 시 RTX4090(24GB ~$0.4-0.7/hr)·A100(~$1.5-2/hr)에서 **CatVTON + Flux.1 Fill**(SOTA) 또는 Qwen/HiDream 베이스로 양산. 배치 생산 때만 가동

## Phase 현황

| Phase | 내용 | 상태 |
|-------|------|------|
| Phase 0 | SSH 복구 + ComfyUI 환경 정찰 | ✅ 완료 (5/30~5/31) |
| Phase 1 | 클라우드 타당성 검증 (Imagen4/nano 실측 → 불가 확정) | ✅ 완료 (5/31) |
| Phase 2 | 4060 CatVTON_Wrapper 설치 + 이너웨어 PoC (1단계 검증) | ✅ 완료 (3컷, 5/31) |
| Phase 3 | 품질 부족 시 RunPod 2단계 (CatVTON+Flux Fill / Qwen·HiDream) | 🔄 진행 — 첫 컷 검증 완료(2026-06-01) |
| Phase 4 | 워크플로우 정형화 + 상세페이지 양산 체계 | ❌ 대기 |

## 히스토리

| 날짜 | 주체 | 내용 | 산출물 | 상태 |
|------|------|------|--------|------|
| 2026-05-31 | iMac/쌍아 | 클라우드 VTON 불가 확정 + 4060 정찰(CatVTON 8GB 가능, detectron2 회피 경로 확정) + PF 신설 | PF_VTON, ORDER(CatVTON설치_PoC) | active |
| 2026-05-31 | iMac/쌍아 | 모델 매트릭스 + 2단계 GPU 전략 반영(4060 검증→RunPod 양산). VTON SOTA=CatVTON+Flux Fill, 베이스 후보 Qwen/HiDream/Z-Image | 모델전략 섹션 | active |
| 2026-05-31 | 4060/쌍아 | CatVTON 베이스라인 PoC — 환경구축+가중치+착장 3컷. VRAM 51%(4199MiB)/컷당 45~50초/OOM 없음. 정체성·교체 정합성 우수, 텍스처 평면화(SD1.5 한계) → RunPod 2단계 권장 | COMPLETION_20260531_4060쌍아_이너웨어VTON_CatVTON_PoC, test_outputs/VTON_PoC_20260531(3컷) | active |
| 2026-05-31 | iMac/쌍아 | RunPod 2단계 인프라 구축(API직접제어·볼륨 e0sdw1kxku·3090 pod·SSH·CatvtonFlux노드·LoRA·HF토큰·Flux Fill다운로드 착수). pod EXITED(과금정지) | 4060 SD1.5 베이스라인=납품미달 / RunPod Flux Fill 환경 | active |
| 2026-06-01 | iMac/쌍아 | **RunPod Flux Fill 첫 컷 성공** — 가용성 폴링으로 새 3090 pod 확보(볼륨 100GB 확장), venv 부팅, UI→API 변환기 자작(4버그 수정), SAM2 자동마스크. 캐미솔→브라렛 30steps/257초, 정체성보존·**레이스 텍스처 SD1.5 평면화 대비 개선** | cut1_camisole-to-bralette_FluxFill.png, wf_convert.py | active |
| 2026-06-01 | iMac/쌍아 | **⭐ 품질 핵심 규명 = garment·person 포즈/각도 일치** — 측면 person엔 garment 디테일 미전사(원본 레이스 잔존), 정면-정면 매칭 시 매끈 심리스 정확 전사+색 반영. 모델 한계 아닌 입력정렬 문제. 양산규칙: 정면↔정면 페어링. MONK VTON Studio(localhost:8080, ComfyUI 노드 숨긴 전용UI) 제작 | dain11_sage_front_result.png, VTON Studio, 양산규칙 | active |

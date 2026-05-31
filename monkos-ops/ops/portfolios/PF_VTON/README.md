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

## Phase 현황

| Phase | 내용 | 상태 |
|-------|------|------|
| Phase 0 | SSH 복구 + ComfyUI 환경 정찰 | ✅ 완료 (5/30~5/31) |
| Phase 1 | 클라우드 타당성 검증 (Imagen4/nano 실측 → 불가 확정) | ✅ 완료 (5/31) |
| Phase 2 | CatVTON_Wrapper 설치 + 이너웨어 PoC 10컷 | ⏳ 착수 (ORDER 발행) |
| Phase 3 | 워크플로우 정형화 + 상세페이지 양산 체계 | ❌ 대기 |

## 히스토리

| 날짜 | 주체 | 내용 | 산출물 | 상태 |
|------|------|------|--------|------|
| 2026-05-31 | iMac/쌍아 | 클라우드 VTON 불가 확정 + 4060 정찰(CatVTON 8GB 가능, detectron2 회피 경로 확정) + PF 신설 | PF_VTON, ORDER(CatVTON설치_PoC) | active |

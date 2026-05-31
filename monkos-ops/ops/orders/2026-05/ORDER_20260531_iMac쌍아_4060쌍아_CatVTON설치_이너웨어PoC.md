---
type: order
date: 2026-05-31
device: iMac
agent: 쌍아
to: 4060쌍아
status: 발행
portfolio: PF_VTON
---

# ORDER — 4060 CatVTON 설치 + 이너웨어 VTON PoC

**발신**: iMac/쌍아 → **수신**: 4060/쌍아 (4060 메인 작업자)
**PF**: PF_VTON (착수 전 README Read 필수)

> iMac/쌍아가 SSH로 직접 정찰 완료. 아래는 검증된 사실 — 재조사 불필요, 바로 실행.
> 입력 자산(monk_assets 2.5GB)은 iMac/쌍아가 `C:\Users\smuse73\Desktop\monk_assets\`로 전송 중 — 도착 확인 후 PoC 입력으로 활용.

---

## 배경 (확정 사실)

- 이너웨어 VTON은 클라우드 불가(Imagen4=I2I없음, nano=노출거부). **4060 로컬이 유일 경로.**
- CatVTON은 1024×768을 **8GB 미만**으로 설계 → 4060(8GB) 적합.
- **detectron2 회피 필수**: pzc163 버전은 detectron2 v0.6 의존 → 현 스택(Py3.13/Torch2.9/CUDA13)과 충돌. **chflame163/ComfyUI_CatVTON_Wrapper(detectron2-free)** 를 쓴다.

## 환경 (정찰 결과 — 재확인 불요)

- ComfyUI: `C:\AI_Factory\ComfyUI_windows_portable\ComfyUI` (Py 3.13.9 / Torch 2.9.1+cu130)
- python: `...\python_embeded\python.exe` / git 2.43 있음 / ComfyUI 미실행(8188)
- 체크포인트: `C:\AI_Factory\webui\models\Stable-diffusion\juggernautXL_ragnarokBy.safetensors` (webui 공유)
- 출력 자동동기화: `G:\4060Factory\OUTPUT_Zone\Images` (구글드라이브)

## 작업

### 1. 정리
- 쌍아가 이미 clone해둔 `custom_nodes\Comfyui-CatVTON`(pzc163) **제거** (detectron2라 미사용).

### 2. CatVTON_Wrapper 설치
- `custom_nodes`에 `git clone https://github.com/chflame163/ComfyUI_CatVTON_Wrapper`
- requirements: `numpy<2.0 / pillow<10.0.0 / Scipy / diffusers / accelerate / transformers`
- ⚠️ **`numpy<2.0`·`pillow<10` 전역 강제 다운그레이드 금지** (Py3.13 wheel 부재 가능 + 타 노드 깨짐 위험). **먼저 현 버전 그대로 ComfyUI 구동 → 실제 import 에러 나는 패키지만 핀포인트 대응.** 충돌 진단되면 보고.

### 3. 구동 + 가중치
- `python_embeded\python.exe`로 ComfyUI 실행 → CatVTON 워크플로우 첫 실행 시 **가중치 자동 다운로드(수십 분)**.

### 4. 이너웨어 PoC
- 입력 자산: **`C:\Users\smuse73\Desktop\monk_assets\`** (iMac/쌍아가 전송한 2.5GB — AI_LAb_Model/monk_models/monk_workbench/monk_assets_all/monk_sorting). 모델 베이스·제품 이미지를 여기서 선별. 제품 상세컷이 부족하면 작가님께 추가 요청.
- CatVTON으로 **착용 컷 생성** → 정체성 보존 + 의상 충실도 평가. 목표 다양 포즈/제품 수 컷.
- 결과는 `G:\4060Factory\OUTPUT_Zone\Images` 동기화 확인.

## ⚠️ 준수 조항

- **환경 보존 우선**: portable Python을 깨뜨리는 전역 패키지 변경 금지. 노드별 격리/최소 변경. 위험 변경 전 보고.
- 에러 **3회 반복 시 `/에스컬레이션`**.
- 막힘 발생 시 가설 전에 관련 자료 선참조 (ch7 6조).
- 정체성 보존(헌법 1조 3항) — 모델 얼굴/체형 유지, 의상만 교체.
- 완료 시: COMPLETION → `reports/2026-05/` + 세션로그 어펜드 + **PF_VTON 히스토리 1행** + 커밋·푸시.

## 검증 (완료 기준)

1. ComfyUI에서 CatVTON 노드 로드 성공 (import 에러 없음)
2. 가중치 다운로드 완료
3. **이너웨어 착용 컷 1장 이상 생성 성공** + GDrive 동기화 확인
4. 8GB VRAM 내 구동 확인 (OOM 없음) + 소요시간/품질 보고

## 부가 (여력 시)
- LoRA 정체 규명: `SJK_SDXL_v1` / `monk_test_100steps`가 뭘 학습했는지(트리거·대상) 메타 확인 후 보고.

---
*발행: 2026-05-31 iMac/쌍아 · 정찰 기반 직접 작성*

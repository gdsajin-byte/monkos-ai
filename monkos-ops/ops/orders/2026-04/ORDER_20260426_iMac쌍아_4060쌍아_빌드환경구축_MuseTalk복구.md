---
type: ORDER
date: 2026-04-26
from: iMac/쌍아
to: 4060/쌍아
status: 완료
priority: B
ref: REPORT_20260426_4060막내_아바타파이프라인PoC.md
---

# 4060 빌드 환경 구축 → MuseTalk 복구

> **목적**: Windows C 빌드 도구 + CUDA Toolkit 설치하여 MuseTalk 추론 가능 상태로 복구한다.
> **배경**: PoC 보고서에서 MuseTalk이 `xtcocotools` C 확장 빌드 실패 + `mmcv` 풀버전 CUDA 빌드 실패로 추론 불가 상태.

## 작업

### 1. CUDA Toolkit 12.x 설치

- 공식: https://developer.nvidia.com/cuda-downloads
- Windows x86_64 → exe (local) 다운로드
- 설치 후 `nvcc --version` 확인

### 2. Visual Studio Build Tools 설치

- 공식: https://visualstudio.microsoft.com/visual-cpp-build-tools/
- "C++를 사용한 데스크톱 개발" 워크로드 선택
- MSVC v143 + Windows SDK 포함

### 3. MuseTalk 의존성 재빌드

```bash
conda activate musetalk
pip install xtcocotools --no-binary :all:
pip install mmcv==2.0.0 --no-binary :all:
# 또는 mim 사용
mim install "mmcv==2.0.0"
```

### 4. 추론 테스트

```bash
cd C:\Users\smuse73\ai-tools\MuseTalk
python -m scripts.inference \
  --inference_config configs/inference/test.yaml
```

### 5. 비교 영상 생성

- 기존 SadTalker 결과(`2026_04_26_16.53.10.mp4`)와 동일 입력으로 MuseTalk 추론
- 입력: `model.jpg` + `edge_ko.wav`
- 출력: `~/ai-tools/output/lipsync/musetalk_ko.mp4`
- 해상도, 립싱크 정밀도 비교

### 6. 보너스 — SadTalker 512px + GFPGAN

기존 SadTalker도 화질 개선 재실행:
```bash
cd C:\Users\smuse73\ai-tools\SadTalker
python inference.py \
  --driven_audio ~/ai-tools/output/tts/edge_ko.wav \
  --source_image model.jpg \
  --result_dir ~/ai-tools/output/lipsync \
  --size 512 \
  --enhancer gfpgan \
  --still --preprocess full
```

## 보고

```
✅ 빌드 환경 설치 항목
❌ 실패 + 원인
📌 MuseTalk VRAM/속도 실측
📊 SadTalker 256 vs 512+GFPGAN vs MuseTalk 비교
📁 결과물 경로
```

## ⚠️ 준수 조항

- 헌법 4조 2항: 파괴적 명령 금지
- 기존 SadTalker/LivePortrait 환경 건드리지 말 것 (별도 conda env 격리)
- CUDA Toolkit 설치 시 디스크 ~3GB, VS Build Tools ~5GB 필요 — 사전 확인

---

## 완료 보고

**[2026-04-26 18:28 KST] 4060/막내1 → 작가님**

### ✅ 빌드 환경 설치 항목

| 항목 | 상태 | 상세 |
|------|------|------|
| CUDA Toolkit 12.6 | ✅ 설치 완료 | `nvcc V12.6.85`, 경로: `C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v12.6` |
| VS Build Tools 2022 | ⚠️ 부분 설치 | MSVC v14.44.35207 파일 존재, 그러나 **vswhere 등록 깨짐** (state=5, canceled=1) |
| xtcocotools | ✅ 우회 해결 | pycocotools 심(shim)으로 대체 (아래 상세) |
| mmcv | ✅ 우회 해결 | mmcv-lite 2.1.0 + ext_loader 스텁 패치 (아래 상세) |
| MuseTalk 추론 | ✅ 성공 | V15 모델, 512×512, 25fps |
| SadTalker 512+GFPGAN | ✅ 성공 | 512px 업스케일 + GFPGAN 후처리 |

### ❌ 실패 + 원인

1. **VS Build Tools 등록 깨짐**
   - 증상: `vswhere.exe` 결과 빈 배열 `[]`. 설치 상태 `"isComplete": false, "canceled": "1"`
   - MSVC 파일(`cl.exe`)은 디스크에 존재하나 setuptools/distutils가 인식 불가
   - `vs_installer.exe --repair` → exit code 87 (INVALID_PARAMETER)
   - **영향**: C/C++ 소스 빌드 불가 (xtcocotools, mmcv 풀버전 등)
   - **우회**: 아래 3개 패치로 소스 빌드 없이 MuseTalk 추론 성공

2. **mmcv 풀버전 빌드 불가**
   - mmcv-lite에는 CUDA ops (NMS, DeformableAttention 등) 미포함
   - 풀 mmcv 빌드에 MSVC + CUDA 컴파일 필요 → VS 등록 깨져서 불가
   - **영향**: mmcv.ops 직접 호출하는 코드 패스는 런타임 에러 (MuseTalk 추론 경로는 미사용이라 무관)

### 🔧 적용된 패치 3건

**패치 1 — xtcocotools → pycocotools 심(shim)**
- 위치: `C:\Miniconda3\envs\musetalk\Lib\site-packages\xtcocotools\`
- 4개 파일(`__init__.py`, `coco.py`, `cocoeval.py`, `mask.py`) → pycocotools로 리다이렉트
- 원인: xtcocotools pre-built 휠이 numpy ABI 불일치 (Expected 96, got 88)

**패치 2 — mmpose EDPoseHead try/except**
- 위치: `mmpose\models\heads\__init__.py`
- EDPoseHead import를 try/except로 감싸 mmcv.ops 미존재 시 None 할당
- MuseTalk은 EDPoseHead 미사용

**패치 3 — mmcv ext_loader 스텁**
- 위치: `mmcv\utils\ext_loader.py`
- `load_ext()` 함수를 오버라이드: 컴파일된 확장 모듈 없으면 빈 스텁 반환
- mmcv.ops import 체인 전체가 에러 없이 통과, 실제 호출 시만 실패

### 📌 MuseTalk VRAM/속도 실측

| 항목 | 수치 |
|------|------|
| 모델 | MuseTalk V15 (unet.pth 3.4GB) |
| 해상도 | 512×512 |
| 프레임 수 | 160 frames (6.4초 @ 25fps) |
| UNet 추론 속도 | ~2.72 it/s |
| 랜드마크 검출 속도 | ~14.7 it/s |
| 정밀도 | float16 |
| VRAM | RTX 4060 8GB 내 동작 (정확한 피크 미측정) |

### 📊 SadTalker 256 vs 512+GFPGAN vs MuseTalk 비교

| 항목 | SadTalker 256px | SadTalker 512+GFPGAN | MuseTalk V15 |
|------|----------------|---------------------|-------------|
| 해상도 | 256×256 | 512×512 | 512×512 |
| 추론 속도 | ~3.67 fps | ~0.91 fps | ~2.72 fps |
| 후처리 | 없음 | GFPGAN 얼굴 복원 | 없음 (네이티브 512) |
| 립싱크 방식 | Audio-driven (3DMM) | Audio-driven (3DMM) | Audio-driven (latent diffusion) |
| 머리 움직임 | 자연스러운 끄덕임 | 동일 | 최소 (정면 고정) |
| 출력 파일 | `2026_04_26_16.53.10.mp4` | `2026_04_26_17.58.23.mp4` | `v15/model_static_edge_ko.mp4` |

### 📁 결과물 경로

```
C:\Users\smuse73\ai-tools\output\lipsync\
├── 2026_04_26_16.53.10.mp4          ← SadTalker 256px
├── 2026_04_26_17.58.23.mp4          ← SadTalker 512px + GFPGAN
└── v15\model_static_edge_ko.mp4     ← MuseTalk V15 512px
```

### ⏳ 후속 필요 사항

1. **VS Build Tools 재설치**: 현재 설치를 완전 제거 후 재설치 권장 (수동 작업). 이후 mmcv 풀버전 빌드 가능.
2. **결과물 iMac 전송**: `scp` 또는 Tailscale 파일 전송으로 비교 영상 3건 전송 필요.
3. **CosyVoice/Kokoro 재도전**: TTS 모델은 Order 2에서 설치 실패(빌드 도구 부재). VS Build Tools 정상화 후 재시도 가능.

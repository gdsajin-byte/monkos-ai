---
type: ORDER
date: 2026-04-26
from: iMac/쌍아
to: 4060/쌍아
status: 대기
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

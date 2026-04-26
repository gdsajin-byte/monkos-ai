---
type: ORDER
date: 2026-04-26
from: iMac/쌍아
to: 막내 (4060)
status: 대기
priority: A
---

# 4060 LivePortrait 립싱크 환경 셋업

> **목적**: RTX 4060 서버에 LivePortrait를 설치하고, 사진 1장 + 오디오 → 립싱크 영상 렌더링 파이프라인을 구축한다.
> **최종 목표**: MONKOS 프레젠테이션 앱의 나레이터(캐스터) 영상 생성 PoC

## 접속 정보

```bash
ssh 4060
# Host: 100.118.31.62 / User: smuse73
```

## 작업 순서

### 1단계 — 환경 확인

```bash
# GPU 상태 확인
nvidia-smi

# Python 버전 확인 (3.10+ 필요)
python3 --version

# CUDA 버전 확인 (11.8+ 또는 12.x)
nvcc --version

# 디스크 여유 확인 (체크포인트 ~2GB, 환경 ~5GB 필요)
df -h
```

결과를 보고서에 포함할 것.

### 2단계 — LivePortrait 설치

```bash
# 작업 디렉토리
mkdir -p ~/ai-tools && cd ~/ai-tools

# LivePortrait 클론
git clone https://github.com/KwaiVGI/LivePortrait.git
cd LivePortrait

# 가상환경 생성
python3 -m venv venv
source venv/bin/activate

# 의존성 설치
pip install --upgrade pip
pip install -r requirements.txt

# PyTorch CUDA 확인 (필수)
python -c "import torch; print(f'CUDA: {torch.cuda.is_available()}, Device: {torch.cuda.get_device_name(0)}')"
```

PyTorch CUDA가 False이면 CUDA 버전에 맞는 PyTorch를 수동 설치:
```bash
# CUDA 12.x인 경우
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
# CUDA 11.8인 경우
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
```

### 3단계 — 체크포인트 다운로드

LivePortrait README의 "Pretrained Weights" 섹션 참조.
보통 `huggingface_hub`로 자동 다운로드되거나, 수동 다운로드 후 `pretrained_weights/` 에 배치.

```bash
# huggingface-cli가 없으면
pip install huggingface_hub

# README 지시에 따라 체크포인트 다운로드
# (README 확인 후 정확한 명령 실행)
```

### 4단계 — 테스트 추론

```bash
# LivePortrait 기본 예제로 테스트
# 제공되는 샘플 이미지 + 샘플 오디오 사용
python inference.py \
  --source assets/examples/source/s1.jpg \
  --driving assets/examples/driving/d1.mp4 \
  --output results/

# 결과 확인
ls -la results/
```

오디오 기반 립싱크 추론 (audio-driven mode):
```bash
# audio-driven 모드 지원 여부 확인
# LivePortrait의 audio2motion 파이프라인 확인
# README에서 audio-driven 옵션 탐색 후 실행
```

> **참고**: LivePortrait가 audio-driven을 직접 지원하지 않는 버전이면,
> SadTalker(`pip install sadtalker`)를 대안으로 설치하여 테스트.
> SadTalker는 사진+오디오 → 립싱크를 기본 지원.

### 5단계 — 결과물 전송

```bash
# 렌더링된 영상을 iMac으로 전송
scp results/*.mp4 imac:~/Desktop/철창이/
# 또는
scp results/*.mp4 smuse73@<iMac-IP>:~/Desktop/철창이/
```

## 보고 형식

```
[2026-04-26 HH:MM KST] 4060/막내N → 작가님

✅ 완료 항목
❌ 실패 항목 + 원인
📌 GPU/VRAM/디스크 상태
💡 audio-driven 지원 여부 + 대안
📁 결과물 경로
⏳ 추가 필요 사항
```

## ⚠️ 준수 조항

- 헌법 4조 2항: 파괴적 명령 금지 (`rm -rf` 등)
- 4060은 다른 서비스(n8n 등)도 돌고 있을 수 있음 — 기존 환경 건드리지 말 것
- 새 가상환경(`venv`)으로 격리 설치
- 디스크/GPU 메모리 부족 시 무리하지 말고 보고

## 참조

- LivePortrait: https://github.com/KwaiVGI/LivePortrait
- SadTalker (대안): https://github.com/OpenTalker/SadTalker
- 음성 소스: ElevenLabs (작가님이 별도 생성)
- 이미지 소스: 몽코스 이미지 프로 (작가님이 별도 생성)

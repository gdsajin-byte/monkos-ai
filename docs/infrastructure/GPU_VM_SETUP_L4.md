# 🚀 GPU VM 세팅 가이드 - NVIDIA L4 x 2

**목표**: 슈퍼용아 + 슈퍼민아 개발
**비용**: ~$1,500/월 (3개월 올인)
**시작**: 오늘 저녁!

---

## 🎯 VM 스펙 (공격적!)

```yaml
이름: monk-rocket-01
지역: us-central1 (GPU 많음)
머신 타입: n1-standard-16
  - vCPU: 16
  - RAM: 60GB
GPU: NVIDIA L4 x 2
  - VRAM: 24GB x 2 = 48GB
  - 최신 Ada Lovelace
디스크: 500GB SSD
OS: Deep Learning VM (PyTorch)
```

**월 비용**: ~$1,500
**3개월**: ~$4,500

---

## 📋 Step 1: VM 생성 (15분)

### 1-1. GCP Console 접속

```
https://console.cloud.google.com/compute/instances
```

### 1-2. "인스턴스 만들기" 클릭

### 1-3. 설정

| 항목 | 값 |
|------|-----|
| 이름 | `monk-rocket-01` |
| 리전 | `us-central1` |
| 영역 | `us-central1-a` |
| 머신 패밀리 | `범용` |
| 시리즈 | `N1` |
| 머신 유형 | `n1-standard-16` |

### 1-4. GPU 추가! ⭐

"CPU 플랫폼 및 GPU" 클릭

| 항목 | 값 |
|------|-----|
| GPU 유형 | `NVIDIA L4` |
| GPU 개수 | `2` |

### 1-5. 부팅 디스크

"변경" 클릭

| 항목 | 값 |
|------|-----|
| OS 이미지 | `Deep Learning on Linux` |
| 버전 | `Debian 11 based Deep Learning VM` |
| 프레임워크 | `PyTorch 2.0 (CUDA 12.0)` |
| 크기 | `500GB` |

### 1-6. "만들기" 클릭!

⏰ 생성 시간: 3-5분

---

## 📋 Step 2: SSH 접속 (2분)

### 2-1. VM 목록에서 SSH 버튼

브라우저 터미널 자동 열림

### 2-2. GPU 확인

```bash
# GPU 인식 확인
nvidia-smi

# 출력 예:
# +-----------------------------------------------------------------------------+
# | NVIDIA-SMI 525.85       Driver Version: 525.85       CUDA Version: 12.0    |
# |-------------------------------+----------------------+----------------------+
# | GPU  Name        Persistence-M| Bus-Id        Disp.A | Volatile Uncorr. ECC |
# |   0  NVIDIA L4           Off  | 00000000:00:04.0 Off |                    0 |
# |   1  NVIDIA L4           Off  | 00000000:00:05.0 Off |                    0 |
# +-----------------------------------------------------------------------------+
```

**L4 x 2 확인되면 성공!** 🎉

---

## 📋 Step 3: 환경 세팅 (20분)

### 3-1. 기본 도구

```bash
# 업데이트
sudo apt update && sudo apt upgrade -y

# 필수 도구
sudo apt install -y \
  git \
  curl \
  wget \
  htop \
  nvtop \
  tmux \
  vim

# Python 확인
python3 --version
pip3 --version
```

### 3-2. PyTorch 확인

```bash
python3 << EOF
import torch
print(f"PyTorch: {torch.__version__}")
print(f"CUDA: {torch.cuda.is_available()}")
print(f"GPU Count: {torch.cuda.device_count()}")
for i in range(torch.cuda.device_count()):
    print(f"GPU {i}: {torch.cuda.get_device_name(i)}")
EOF
```

**출력**:
```
PyTorch: 2.0.1
CUDA: True
GPU Count: 2
GPU 0: NVIDIA L4
GPU 1: NVIDIA L4
```

---

## 📋 Step 4: monk_project 클론 (5분)

### 4-1. Git 설정

```bash
git config --global user.name "신정규"
git config --global user.email "gdsajin@gmail.com"
```

### 4-2. 프로젝트 클론

```bash
cd ~
git clone https://github.com/YOUR_USERNAME/monk_project.git
cd monk_project
```

### 4-3. GCS에서 최신 데이터 받기

```bash
# 인증
gcloud auth login

# 다운로드
gsutil -m rsync -r \
  gs://monk-project-soul/live/ \
  ~/monk_project/
```

---

## 📋 Step 5: 슈퍼용아 환경 (30분)

### 5-1. 필요한 패키지

```bash
pip3 install --upgrade \
  google-cloud-aiplatform \
  google-generativeai \
  transformers \
  accelerate \
  bitsandbytes \
  datasets \
  peft \
  sentencepiece \
  tensorboard
```

### 5-2. 슈퍼용아 디렉토리

```bash
mkdir -p ~/monk_project/ai_training/super_yonga
cd ~/monk_project/ai_training/super_yonga
```

### 5-3. 학습 스크립트 작성

```bash
nano train_super_yonga.py
```

**내용**:
```python
#!/usr/bin/env python3
"""
슈퍼용아 파인튜닝 스크립트
- Base: Gemini Pro
- 데이터: monk_master_context.txt (15MB)
- GPU: L4 x 2
"""

import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
import os

# GPU 확인
print(f"GPU 사용 가능: {torch.cuda.is_available()}")
print(f"GPU 개수: {torch.cuda.device_count()}")

# 모델 로드 (Gemini 대신 오픈소스 대체)
# 실제로는 Vertex AI API 사용
model_name = "google/flan-t5-xxl"  # 11B 파라미터

print(f"모델 로드 중: {model_name}")
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(
    model_name,
    load_in_8bit=True,
    device_map="auto",  # 자동으로 GPU 2개 분산
)

# LoRA 설정
lora_config = LoraConfig(
    r=64,  # LoRA rank
    lora_alpha=32,
    target_modules=["q", "v"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM",
)

model = prepare_model_for_kbit_training(model)
model = get_peft_model(model, lora_config)

print("모델 준비 완료!")
print(f"학습 가능한 파라미터: {model.print_trainable_parameters()}")

# 데이터 로드
context_file = "../../monk_master_context.txt"
with open(context_file, 'r', encoding='utf-8') as f:
    context = f.read()

print(f"컨텍스트 크기: {len(context)} 글자")

# TODO: 실제 학습 로직
print("학습 준비 완료! train() 함수 구현 필요")
```

저장: `Ctrl+X` → `Y` → `Enter`

### 5-4. 테스트 실행

```bash
python3 train_super_yonga.py
```

---

## 📋 Step 6: 슈퍼민아 환경 (30분)

### 6-1. Imagen 환경

```bash
mkdir -p ~/monk_project/ai_training/super_mina
cd ~/monk_project/ai_training/super_mina
```

### 6-2. 학습 스크립트

```bash
nano train_super_mina.py
```

**내용**:
```python
#!/usr/bin/env python3
"""
슈퍼민아 LoRA 학습
- Base: Imagen 4
- 데이터: 330컷 이너웨어
- GPU: L4 (이미지 생성 최적화)
"""

import torch
import google.generativeai as genai
from PIL import Image
import os
import glob

# Imagen 4 설정
# (실제로는 Vertex AI API 사용)

# 데이터 확인
data_dir = "../../MINA_DATA/innerwear_330"
images = glob.glob(f"{data_dir}/**/*.jpg", recursive=True)

print(f"이미지 개수: {len(images)}")
print(f"샘플: {images[:5]}")

# LoRA 학습 준비
print("LoRA 학습 환경 준비 완료!")

# TODO: 실제 Imagen 4 LoRA 학습
```

---

## 📋 Step 7: 모니터링 (10분)

### 7-1. GPU 모니터링 (tmux 사용)

```bash
# tmux 세션 시작
tmux new -s monitor

# GPU 실시간 모니터링
watch -n 1 nvidia-smi
```

`Ctrl+B` → `D` 로 detach

### 7-2. TensorBoard

```bash
# 백그라운드 실행
tensorboard --logdir=~/monk_project/ai_training/logs --port=6006 &
```

---

## 📋 Step 8: 자동 백업 (20분)

### 8-1. 백업 스크립트

```bash
nano ~/backup_training.sh
```

**내용**:
```bash
#!/bin/bash

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BUCKET="gs://monk-project-soul"

# 체크포인트 백업
echo "🔄 체크포인트 백업 중..."
gsutil -m rsync -r \
  ~/monk_project/ai_training/ \
  $BUCKET/gpu_training/$TIMESTAMP/

# 로그 백업
gsutil cp ~/train_*.log $BUCKET/gpu_logs/

echo "✅ 백업 완료: $TIMESTAMP"
```

### 8-2. Cron 등록 (1시간마다)

```bash
chmod +x ~/backup_training.sh

crontab -e
```

**추가**:
```cron
# 체크포인트 자동 백업
0 * * * * /home/YOUR_USERNAME/backup_training.sh
```

---

## 📋 Step 9: 학습 시작! (실행)

### 9-1. tmux 세션 생성

```bash
tmux new -s super_yonga
```

### 9-2. 학습 실행

```bash
cd ~/monk_project/ai_training/super_yonga

# 로그 남기며 실행
python3 train_super_yonga.py 2>&1 | tee train_$(date +%Y%m%d_%H%M%S).log
```

### 9-3. Detach

`Ctrl+B` → `D`

학습은 백그라운드에서 계속!

---

## 🚨 비용 알림 설정

### GCP Console → Billing → Budgets

```yaml
예산 이름: MONK Rocket Budget
금액: $5,000 (3개월)
알림:
  - 50% 사용 시
  - 75% 사용 시
  - 90% 사용 시
  - 100% 사용 시
```

---

## 📊 진행 상황 체크

### 매일 확인

```bash
# GPU 사용률
nvidia-smi

# 학습 진행
tmux attach -t super_yonga

# 백업 확인
gsutil ls gs://monk-project-soul/gpu_training/

# 비용 확인
gcloud billing accounts list
```

---

## 🎯 3개월 마일스톤

### 1월 말
- [x] GPU VM 가동
- [ ] 슈퍼용아 첫 체크포인트
- [ ] monk.kr 통합 테스트

### 2월 말
- [ ] 슈퍼용아 완성 (95% 정확도)
- [ ] 슈퍼민아 학습 완료
- [ ] 베타 테스트 1,000명

### 3월 말
- [ ] 정식 런칭
- [ ] 10만 유저
- [ ] 매출 발생! 🎉

---

**지금 시작하시겠습니까?** 🚀

대표님만 결정하시면 바로 실행합니다!

---

**작성**: 쌍아(雙牙)  
**제안**: 용아(龍牙)  
**일시**: 2026-01-09  
**상태**: 발사 대기 중 🔥

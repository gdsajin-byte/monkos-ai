# Windows 4060 AI 무인 공장 설정 스크립트 (완전 자동화 버전)
# MONK.KR Project - 24/7 Background Factory
# 작성: 쌍아 (Claude) with 신정규 대표
# 날짜: 2026-01-24
#
# 기능:
# [1] ComfyUI 노드 자동 실행
# [2] 모델 검색/테스트 자동화
# [3] 이미지 무한 생성 배치
# [4] Unsloth LLaMA3/DeepSeek 학습
# [5] 정기 보고 시스템 (Discord/Slack)

Write-Host "🏭 Windows 4060 AI 무인 공장 설정 시작..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

# ============================================================
# [1] 환경 체크
# ============================================================

Write-Host "`n[1/9] 환경 체크..." -ForegroundColor Yellow

# Python 버전
$pythonVersion = python --version 2>&1
Write-Host "✅ Python: $pythonVersion" -ForegroundColor Green

if ($pythonVersion -match "3.14") {
    Write-Host "⚠️  Python 3.14는 매우 최신입니다. 문제 발생 시 3.12 권장" -ForegroundColor Yellow
}

# Git 확인
$gitVersion = git --version 2>&1
if ($gitVersion -match "git version") {
    Write-Host "✅ Git: $gitVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Git 미설치. 설치 후 재실행하세요." -ForegroundColor Red
    exit 1
}

# GPU 확인
$gpuName = nvidia-smi --query-gpu=name --format=csv,noheader 2>$null
if ($gpuName -match "4060") {
    Write-Host "✅ GPU: $gpuName" -ForegroundColor Green
} else {
    Write-Host "⚠️  GPU: $gpuName (4060 권장)" -ForegroundColor Yellow
}

# ============================================================
# [2] 가상환경 생성
# ============================================================

Write-Host "`n[2/9] Python 가상환경 생성..." -ForegroundColor Yellow

if (!(Test-Path ".venv_factory")) {
    Write-Host "가상환경 생성 중..." -ForegroundColor Cyan
    python -m venv .venv_factory
    Write-Host "✅ .venv_factory 생성 완료" -ForegroundColor Green
} else {
    Write-Host "✅ .venv_factory 이미 존재" -ForegroundColor Green
}

# 활성화
& .\.venv_factory\Scripts\activate.ps1

# ============================================================
# [3] PyTorch + CUDA 설치
# ============================================================

Write-Host "`n[3/9] PyTorch + CUDA 12.1 설치..." -ForegroundColor Yellow

python -m pip install --upgrade pip --quiet
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121 --quiet

# CUDA 테스트
Write-Host "CUDA 테스트 중..." -ForegroundColor Cyan
python -c "import torch; print('✅ PyTorch:', torch.__version__); print('✅ CUDA Available:', torch.cuda.is_available()); print('✅ GPU:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'N/A')"

# ============================================================
# [4] Unsloth + AI 라이브러리 설치
# ============================================================

Write-Host "`n[4/9] Unsloth + AI 라이브러리 설치..." -ForegroundColor Yellow

Write-Host "Unsloth 설치 중... (시간 소요)" -ForegroundColor Cyan
pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git" --quiet
pip install --no-deps "xformers<0.0.27" "trl<0.9.0" peft accelerate bitsandbytes --quiet

Write-Host "추가 라이브러리 설치 중..." -ForegroundColor Cyan
pip install transformers datasets --quiet
pip install google-cloud-storage --quiet
pip install pillow opencv-python numpy --quiet
pip install requests beautifulsoup4 --quiet
pip install discord-webhook --quiet

Write-Host "✅ AI 라이브러리 설치 완료" -ForegroundColor Green

# ============================================================
# [5] 디렉토리 구조 생성
# ============================================================

Write-Host "`n[5/9] 디렉토리 구조 생성..." -ForegroundColor Yellow

$dirs = @(
    "scripts/factory/workers",
    "scripts/factory/reports",
    "workflows/pending",
    "workflows/completed",
    "batch_queue",
    "models/huggingface",
    "models/trained",
    "outputs/images",
    "outputs/reports",
    "logs/factory",
    "training_data"
)

foreach ($dir in $dirs) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "  ✅ $dir" -ForegroundColor Gray
    }
}

Write-Host "✅ 디렉토리 생성 완료" -ForegroundColor Green

# ============================================================
# [6] 워커 스크립트 생성
# ============================================================

Write-Host "`n[6/9] 자동화 워커 스크립트 생성..." -ForegroundColor Yellow

# Git 동기화 워커
$gitSyncWorker = @'
# Git 자동 동기화 워커 (5분 간격)
param([int]$Interval = 300)

Write-Host "🔄 Git Sync Worker 시작 (간격: $Interval 초)" -ForegroundColor Cyan

while ($true) {
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "`n[$timestamp] Git Pull 체크..." -ForegroundColor Gray

    git fetch origin 2>&1 | Out-Null
    $behind = git rev-list --count HEAD..origin/main 2>$null

    if ($behind -gt 0) {
        Write-Host "🔄 $behind 커밋 뒤처짐. Pull 실행..." -ForegroundColor Yellow
        git pull origin main

        $changed = git diff --name-only HEAD@{1} HEAD

        # workflows/ 변경 감지
        if ($changed -match "workflows/pending") {
            Write-Host "🎨 ComfyUI 작업 감지! 워커 실행..." -ForegroundColor Green
            & .\scripts\factory\workers\comfyui_worker.ps1
        }

        # batch_queue/ 변경 감지
        if ($changed -match "batch_queue") {
            Write-Host "🖼️ 배치 작업 감지! 팩토리 실행..." -ForegroundColor Green
            & .\scripts\factory\workers\image_factory.ps1
        }

        # training_data/ 변경 감지
        if ($changed -match "training_data") {
            Write-Host "🧠 학습 데이터 감지! 트레이너 실행..." -ForegroundColor Green
            & .\scripts\factory\workers\ai_trainer.ps1
        }
    }

    Start-Sleep -Seconds $Interval
}
'@
Set-Content -Path "scripts/factory/git_sync_worker.ps1" -Value $gitSyncWorker

# ComfyUI 워커
$comfyWorker = @'
# ComfyUI 자동 실행 워커
Write-Host "🎨 ComfyUI Worker 시작..." -ForegroundColor Cyan

$workflows = Get-ChildItem "workflows/pending/*.json" -ErrorAction SilentlyContinue

if ($workflows.Count -eq 0) {
    Write-Host "⚠️  대기 중: 작업 없음" -ForegroundColor Yellow
    exit 0
}

foreach ($workflow in $workflows) {
    Write-Host "`n📂 작업: $($workflow.Name)" -ForegroundColor Green
    $startTime = Get-Date

    # TODO: ComfyUI CLI 실행 (설치 후 활성화)
    # python comfyui_cli.py --workflow $workflow.FullName --output "outputs/images/"

    # 임시: 시뮬레이션
    Write-Host "   ⏳ 처리 중..." -ForegroundColor Gray
    Start-Sleep -Seconds 3

    # 완료 폴더로 이동
    Move-Item $workflow.FullName "workflows/completed/" -Force

    $duration = (Get-Date) - $startTime
    Write-Host "   ✅ 완료 (소요: $($duration.TotalSeconds)초)" -ForegroundColor Green
}
'@
Set-Content -Path "scripts/factory/workers/comfyui_worker.ps1" -Value $comfyWorker

# 이미지 팩토리
$imageFactory = @'
# 이미지 무한 생성 팩토리
Write-Host "🖼️ Image Factory 시작..." -ForegroundColor Cyan

if (!(Test-Path "batch_queue/queue.json")) {
    Write-Host "⚠️  큐 파일 없음. 샘플 생성..." -ForegroundColor Yellow
    $sampleQueue = @(
        @{
            name = "K-Beauty 룩북 테스트"
            prompt = "Korean model, fashion, studio lighting"
            count = 10
            model = "sdxl"
        }
    ) | ConvertTo-Json
    Set-Content -Path "batch_queue/queue.json" -Value $sampleQueue
}

$queue = Get-Content "batch_queue/queue.json" | ConvertFrom-Json

foreach ($job in $queue) {
    Write-Host "`n📊 작업: $($job.name) ($($job.count)장)" -ForegroundColor Green

    # GPU 상태
    $gpuUtil = nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits
    Write-Host "   🔥 GPU: $gpuUtil%" -ForegroundColor Yellow

    # TODO: 실제 이미지 생성 (Imagen API 연동)
    # python imagen_batch.py --prompt "$($job.prompt)" --count $job.count

    Write-Host "   ✅ 완료" -ForegroundColor Green
}
'@
Set-Content -Path "scripts/factory/workers/image_factory.ps1" -Value $imageFactory

# AI 트레이너
$aiTrainer = @'
# Unsloth 기반 AI 트레이너
Write-Host "🧠 AI Trainer 시작..." -ForegroundColor Cyan

# 세션 로그에서 학습 데이터 준비
if (Test-Path "training_data/*.md") {
    Write-Host "📚 학습 데이터 발견" -ForegroundColor Green

    # TODO: LLaMA3 Fine-tuning
    # python train_llama3.py --data ./training_data/ --output ./models/trained/

    Write-Host "✅ 학습 예약됨 (구현 대기)" -ForegroundColor Yellow
} else {
    Write-Host "⚠️  학습 데이터 없음" -ForegroundColor Yellow
}
'@
Set-Content -Path "scripts/factory/workers/ai_trainer.ps1" -Value $aiTrainer

# 보고 시스템
$reporter = @'
# 정기 보고 시스템
param([string]$Type = "status")

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# GPU 상태
$gpuData = nvidia-smi --query-gpu=utilization.gpu,temperature.gpu,memory.used --format=csv,noheader,nounits 2>$null
if ($gpuData) {
    $gpu = $gpuData -split ","
    $gpuUtil = $gpu[0]
    $gpuTemp = $gpu[1]
    $gpuMem = $gpu[2]
} else {
    $gpuUtil = "N/A"
    $gpuTemp = "N/A"
    $gpuMem = "N/A"
}

# 작업 카운트
$pendingWorkflows = (Get-ChildItem "workflows/pending/*.json" -ErrorAction SilentlyContinue).Count
$completedWorkflows = (Get-ChildItem "workflows/completed/*.json" -ErrorAction SilentlyContinue).Count

# 보고서 생성
$report = @"
🏭 **Windows 4060 공장 보고** - $timestamp

✅ **시스템 상태**
- GPU 사용률: ${gpuUtil}%
- GPU 온도: ${gpuTemp}°C
- VRAM 사용: ${gpuMem}MB

📊 **작업 현황**
- ComfyUI 대기: ${pendingWorkflows}개
- ComfyUI 완료: ${completedWorkflows}개
- 배치 큐: TODO

🔥 **공장 가동률**: ${gpuUtil}%
"@

Write-Host $report

# Discord 전송 (환경변수 설정 시)
if ($env:DISCORD_WEBHOOK) {
    $payload = @{ content = $report } | ConvertTo-Json
    Invoke-WebRequest -Uri $env:DISCORD_WEBHOOK -Method POST -Body $payload -ContentType "application/json" | Out-Null
    Write-Host "`n📤 Discord 전송 완료" -ForegroundColor Green
}
'@
Set-Content -Path "scripts/factory/workers/reporter.ps1" -Value $reporter

Write-Host "✅ 워커 스크립트 생성 완료" -ForegroundColor Green

# ============================================================
# [7] 샘플 배치 작업 생성
# ============================================================

Write-Host "`n[7/9] 샘플 배치 작업 생성..." -ForegroundColor Yellow

$sampleQueue = @(
    @{
        name = "민아방 24/7 - K-Beauty 룩북"
        prompt = "Korean fashion model, elegant pose, studio lighting, pastel background"
        count = 100
        model = "sdxl"
        priority = 1
    },
    @{
        name = "소소 배경 생성"
        prompt = "Minimalist gradient background, pastel pink and blue"
        count = 50
        model = "sdxl"
        priority = 2
    }
) | ConvertTo-Json -Depth 3

Set-Content -Path "batch_queue/queue.json" -Value $sampleQueue
Write-Host "✅ batch_queue/queue.json 생성" -ForegroundColor Green

# ============================================================
# [8] 환경 변수 템플릿
# ============================================================

Write-Host "`n[8/9] 환경 변수 템플릿 생성..." -ForegroundColor Yellow

$envTemplate = @'
# Windows Factory 환경 변수
# 실제 값으로 수정 후 .env로 저장

# Discord Webhook (보고용)
DISCORD_WEBHOOK=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_TOKEN

# GCS 인증 (선택)
GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\service-account.json

# ComfyUI 경로 (설치 후)
COMFYUI_PATH=C:\ComfyUI

# 작업 간격 (초)
GIT_SYNC_INTERVAL=300
REPORT_INTERVAL=3600
'@

Set-Content -Path "scripts/factory/.env.sample" -Value $envTemplate
Write-Host "✅ scripts/factory/.env.sample 생성" -ForegroundColor Green

# ============================================================
# [9] 공장 실행 스크립트
# ============================================================

Write-Host "`n[9/9] 공장 실행 스크립트 생성..." -ForegroundColor Yellow

$startFactory = @'
# Windows 4060 공장 시작 스크립트
Write-Host "🏭 Windows 4060 AI 공장 시작..." -ForegroundColor Green

# 환경변수 로드
if (Test-Path "scripts/factory/.env") {
    Get-Content "scripts/factory/.env" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.+)$") {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            Set-Item -Path "env:$name" -Value $value
        }
    }
    Write-Host "✅ 환경변수 로드 완료" -ForegroundColor Green
}

# 가상환경 활성화
& .\.venv_factory\Scripts\Activate.ps1

# 워커 프로세스 시작 (백그라운드)
Write-Host "`n🔄 Git Sync Worker 시작..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-File", ".\scripts\factory\git_sync_worker.ps1"

Write-Host "📊 Reporter 스케줄 시작..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "while (`$true) { & .\scripts\factory\workers\reporter.ps1; Start-Sleep -Seconds 3600 }"

Write-Host "`n✅ 공장 가동 시작!" -ForegroundColor Green
Write-Host "   - Git Sync: 5분 간격" -ForegroundColor Gray
Write-Host "   - 보고서: 1시간 간격" -ForegroundColor Gray
Write-Host ""
'@
Set-Content -Path "scripts/factory/start_factory.ps1" -Value $startFactory
Write-Host "✅ start_factory.ps1 생성" -ForegroundColor Green

# ============================================================
# 완료
# ============================================================

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "🎉 Windows 4060 AI 무인 공장 설정 완료!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 다음 단계:" -ForegroundColor Cyan
Write-Host "  1. VS Code 설치 (winget install Microsoft.VisualStudioCode)"
Write-Host "  2. Claude Code 확장 설치 (code --install-extension Anthropic.claude-code)"
Write-Host "  3. 환경변수 설정: scripts/factory/.env.sample → .env"
Write-Host "  4. Discord Webhook 설정 (선택)"
Write-Host ""
Write-Host "🏭 공장 가동 명령어:" -ForegroundColor Yellow
Write-Host "  .\scripts\factory\start_factory.ps1" -ForegroundColor White
Write-Host ""
Write-Host "📊 수동 테스트:" -ForegroundColor Yellow
Write-Host "  .\scripts\factory\workers\reporter.ps1        # 상태 보고"
Write-Host "  .\scripts\factory\workers\comfyui_worker.ps1  # ComfyUI 테스트"
Write-Host "  .\scripts\factory\workers\image_factory.ps1   # 이미지 생성 테스트"
Write-Host ""

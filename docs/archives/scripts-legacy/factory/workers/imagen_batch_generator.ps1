# Imagen 배치 이미지 생성 워커
# MONK.KR - 한국여성 23세 패션모델 100컷 생성
# 작성: 쌍아 (Claude) - 첫밤 테스트
# 날짜: 2026-01-24

param(
    [int]$Count = 100,
    [string]$Prompt = "23-year-old Korean female fashion model, elegant pose, studio lighting, pastel background, K-beauty makeup, photorealistic, high quality, 8K resolution",
    [string]$AspectRatio = "9:16",
    [string]$Style = "realistic",
    [string]$OutputDir = "outputs/images/fashion_model_100"
)

Write-Host "🖼️ Imagen 배치 생성 시작..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "생성 개수: $Count" -ForegroundColor Yellow
Write-Host "프롬프트: $Prompt" -ForegroundColor Gray
Write-Host "비율: $AspectRatio, 스타일: $Style" -ForegroundColor Gray
Write-Host ""

# ============================================================
# 참고: Cloudflare Worker에서 인증 처리
# ============================================================
# GEMINI_API_KEY는 Cloudflare Worker 환경변수에 설정되어 있음
# 이 스크립트는 Worker 엔드포인트만 호출하면 됨
# https://monk-imagen-proxy.gdsajin.workers.dev

# ============================================================
# 출력 디렉토리 생성
# ============================================================

if (!(Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
    Write-Host "✅ 출력 폴더 생성: $OutputDir" -ForegroundColor Green
}

# ============================================================
# 로그 파일 초기화
# ============================================================

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$logFile = "logs/factory/imagen_batch_$timestamp.log"

if (!(Test-Path "logs/factory")) {
    New-Item -ItemType Directory -Path "logs/factory" -Force | Out-Null
}

function Write-Log {
    param([string]$Message)
    $logMessage = "[$(Get-Date -Format 'HH:mm:ss')] $Message"
    Add-Content -Path $logFile -Value $logMessage
    Write-Host $logMessage
}

Write-Log "🚀 배치 생성 시작 (총 $Count 개)"
Write-Log ""

# ============================================================
# 프롬프트 변형 생성
# ============================================================

# 다양한 포즈/스타일 변형
$promptVariations = @(
    "standing pose",
    "sitting pose",
    "walking pose",
    "side profile",
    "three-quarter view",
    "front view",
    "elegant pose",
    "dynamic pose",
    "natural smile",
    "serious expression"
)

# ============================================================
# 배치 생성 함수
# ============================================================

function Generate-Image {
    param(
        [int]$Index,
        [string]$BasePrompt,
        [string]$Variation
    )

    $fullPrompt = "$BasePrompt, $Variation"

    Write-Log "[$Index/$Count] 생성 중: $Variation"

    $body = @{
        prompt = $fullPrompt
        aspectRatio = $AspectRatio
        style = $Style
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod `
            -Uri "https://monk-imagen-proxy.gdsajin.workers.dev" `
            -Method POST `
            -Headers @{ "Content-Type" = "application/json" } `
            -Body $body `
            -TimeoutSec 60

        if ($response.imageUrl) {
            # Base64 디코딩 및 저장
            $base64 = $response.imageUrl -replace "^data:image/png;base64,", ""
            $imageBytes = [Convert]::FromBase64String($base64)

            $filename = "$OutputDir/model_$($Index.ToString('000')).png"
            [System.IO.File]::WriteAllBytes($filename, $imageBytes)

            Write-Log "   ✅ 저장: $filename"

            return @{
                index = $Index
                filename = $filename
                originalPrompt = $response.originalPrompt
                improvedPrompt = $response.improvedPrompt
                success = $true
                timestamp = Get-Date -Format "HH:mm:ss"
            }
        } else {
            Write-Log "   ❌ 이미지 URL 없음"
            return @{ index = $Index; success = $false; error = "No imageUrl" }
        }
    } catch {
        Write-Log "   ❌ 오류: $($_.Exception.Message)"
        return @{ index = $Index; success = $false; error = $_.Exception.Message }
    }
}

# ============================================================
# 메인 생성 루프
# ============================================================

$startTime = Get-Date
$results = @()
$successCount = 0
$failCount = 0

for ($i = 1; $i -le $Count; $i++) {
    # GPU 상태 확인 (10개마다)
    if ($i % 10 -eq 1) {
        $gpuData = nvidia-smi --query-gpu=utilization.gpu,temperature.gpu,memory.used --format=csv,noheader,nounits 2>$null
        if ($gpuData) {
            $gpu = $gpuData -split ","
            Write-Log ""
            Write-Log "🔥 GPU 상태 - 사용률: $($gpu[0])%, 온도: $($gpu[1])°C, VRAM: $($gpu[2])MB"
            Write-Log ""
        }
    }

    # 변형 선택 (순환)
    $variation = $promptVariations[($i - 1) % $promptVariations.Count]

    # 이미지 생성
    $result = Generate-Image -Index $i -BasePrompt $Prompt -Variation $variation
    $results += $result

    if ($result.success) {
        $successCount++
    } else {
        $failCount++
    }

    # 진행률 표시
    $progress = [math]::Round(($i / $Count) * 100, 1)
    Write-Log "진행률: $progress% ($i/$Count) - 성공: $successCount, 실패: $failCount"
    Write-Log ""

    # Rate limiting (3초 대기)
    if ($i -lt $Count) {
        Write-Host "   ⏳ 3초 대기 (Rate Limiting)..." -ForegroundColor Gray
        Start-Sleep -Seconds 3
    }
}

$endTime = Get-Date
$duration = $endTime - $startTime

# ============================================================
# 결과 요약
# ============================================================

Write-Log ""
Write-Log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Log "✅ 배치 생성 완료!"
Write-Log ""
Write-Log "📊 통계"
Write-Log "  총 개수: $Count"
Write-Log "  성공: $successCount"
Write-Log "  실패: $failCount"
Write-Log "  소요 시간: $($duration.Hours)시간 $($duration.Minutes)분 $($duration.Seconds)초"
Write-Log "  평균 속도: $(([math]::Round($Count / $duration.TotalMinutes, 1))) 개/분"
Write-Log ""
Write-Log "📁 저장 위치: $OutputDir"
Write-Log "📝 로그 파일: $logFile"
Write-Log ""

# 결과 JSON 저장
$resultJson = @{
    timestamp = $timestamp
    totalCount = $Count
    successCount = $successCount
    failCount = $failCount
    duration = $duration.ToString()
    outputDir = $OutputDir
    prompt = $Prompt
    aspectRatio = $AspectRatio
    style = $Style
    results = $results
} | ConvertTo-Json -Depth 5

$resultFile = "$OutputDir/batch_result_$timestamp.json"
Set-Content -Path $resultFile -Value $resultJson

Write-Log "💾 결과 저장: $resultFile"
Write-Log ""

# ============================================================
# 코드 개선사항 보고
# ============================================================

$improvementReport = @"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 코드 개선사항 보고

## 현재 로직 분석

✅ **장점**:
1. Gemini로 프롬프트 자동 개선 (품질 향상)
2. Cloudflare Workers 프록시 (CORS 해결, 보안)
3. Base64 직접 반환 (별도 스토리지 불필요)

⚠️ **개선 필요**:
1. **Rate Limiting**:
   - 현재: 3초 대기 (수동)
   - 개선안: Cloudflare Workers에서 429 응답 시 자동 재시도

2. **병렬 처리**:
   - 현재: 순차 처리 (100개 = 약 5분)
   - 개선안: 5개씩 병렬 처리 (PowerShell Jobs 활용)

3. **에러 핸들링**:
   - 현재: 실패 시 로그만 기록
   - 개선안: 실패한 이미지 자동 재시도 (최대 3회)

4. **프롬프트 다양성**:
   - 현재: 10가지 변형 순환
   - 개선안: Gemini로 동적 변형 생성

5. **GCS 업로드**:
   - 현재: 로컬 저장만
   - 개선안: 생성 즉시 GCS 업로드 (백업)

## 추천 개선 순서

1. 병렬 처리 (속도 5배 향상)
2. 자동 재시도 (안정성)
3. GCS 업로드 (영구 저장)
4. 동적 프롬프트 (다양성)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"@

Write-Log $improvementReport

$improvementFile = "$OutputDir/improvement_report_$timestamp.txt"
Set-Content -Path $improvementFile -Value $improvementReport

Write-Log "📄 개선사항 보고서: $improvementFile"
Write-Log ""

# Factory Logger 호출
if (Test-Path "scripts/factory/workers/factory_logger.ps1") {
    & .\scripts\factory\workers\factory_logger.ps1 `
        -Type task `
        -TaskType "imagen_batch" `
        -TaskName "fashion_model_100" `
        -Data @{
            StartTime = $startTime.ToString("yyyy-MM-dd HH:mm:ss")
            EndTime = $endTime.ToString("yyyy-MM-dd HH:mm:ss")
            Duration = $duration.ToString()
            Status = if ($successCount -eq $Count) { "✅ 성공" } else { "⚠️ 부분 성공" }
            InputInfo = "총 $Count 개, 성공 $successCount, 실패 $failCount"
            ExecutionLog = "로그: $logFile"
            Output = "결과: $OutputDir"
        }
}

Write-Host "✅ 배치 생성 완료! 🎉" -ForegroundColor Green

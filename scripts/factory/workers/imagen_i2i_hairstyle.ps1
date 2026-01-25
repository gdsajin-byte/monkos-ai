# Imagen i2i 헤어스타일 변주 워커
# MONK.KR - 베스트컷 5장 → 헤어스타일 10가지 변주 → 총 50장
# 작성: 쌍아 (Claude Code) - 밤샘 자동화
# 날짜: 2026-01-24

param(
    [string]$InputDir = "outputs/images/fashion_model_100",
    [int]$BestCount = 5,
    [int]$StyleVariations = 10,
    [string]$AspectRatio = "1:1",
    [string]$Resolution = "2K",
    [string]$OutputDir = "outputs/images/hairstyle_variations"
)

Write-Host "💇 Imagen i2i 헤어스타일 변주 시작..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "입력: $InputDir" -ForegroundColor Yellow
Write-Host "베스트컷: $BestCount, 변주: $StyleVariations" -ForegroundColor Gray
Write-Host "출력: $OutputDir (1:1, 2K)" -ForegroundColor Gray
Write-Host ""

# ============================================================
# 베스트 5컷 자동 선정 (파일 크기 기준)
# ============================================================

Write-Host "🔍 베스트 5컷 선정 중..." -ForegroundColor Yellow

$allImages = Get-ChildItem "$InputDir/model_*.png" -ErrorAction SilentlyContinue |
    Where-Object { $_.Length -gt 0 } |
    Sort-Object Length -Descending |
    Select-Object -First $BestCount

if ($allImages.Count -lt $BestCount) {
    Write-Host "❌ 이미지가 $BestCount 개 미만입니다 (현재: $($allImages.Count))" -ForegroundColor Red
    exit 1
}

Write-Host "✅ 베스트 $BestCount 컷 선정 완료" -ForegroundColor Green
$allImages | ForEach-Object {
    $sizeMB = [math]::Round($_.Length / 1MB, 2)
    Write-Host "   - $($_.Name) ($sizeMB MB)" -ForegroundColor Gray
}
Write-Host ""

# ============================================================
# 헤어스타일 프롬프트 (트렌드 2026)
# ============================================================

$hairstyles = @(
    @{
        name = "long_straight"
        prompt = "long straight hair, sleek and shiny, middle part, Korean beauty style"
    },
    @{
        name = "wavy_bob"
        prompt = "shoulder-length wavy bob, soft waves, volume at roots, trendy Korean style"
    },
    @{
        name = "short_pixie"
        prompt = "short pixie cut, textured layers, modern and chic, K-beauty inspired"
    },
    @{
        name = "curly_perm"
        prompt = "medium-length curly perm, bouncy curls, natural volume, Korean salon style"
    },
    @{
        name = "blunt_cut"
        prompt = "blunt cut bob, sharp edges, chin-length, sophisticated Korean look"
    },
    @{
        name = "layered_long"
        prompt = "long layered hair, face-framing layers, soft movement, Korean actress style"
    },
    @{
        name = "half_up"
        prompt = "half-up half-down hairstyle, soft curls, elegant and feminine, K-drama style"
    },
    @{
        name = "side_swept"
        prompt = "side-swept bangs, long hair, romantic waves, Korean model style"
    },
    @{
        name = "messy_bun"
        prompt = "messy bun updo, loose strands, effortless chic, Korean street style"
    },
    @{
        name = "sleek_ponytail"
        prompt = "high sleek ponytail, smooth finish, modern and clean, K-pop inspired"
    }
)

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
$logFile = "logs/factory/i2i_hairstyle_$timestamp.log"

if (!(Test-Path "logs/factory")) {
    New-Item -ItemType Directory -Path "logs/factory" -Force | Out-Null
}

function Write-Log {
    param([string]$Message)
    $logMessage = "[$(Get-Date -Format 'HH:mm:ss')] $Message"
    Add-Content -Path $logFile -Value $logMessage
    Write-Host $logMessage
}

Write-Log "🚀 i2i 헤어스타일 변주 시작 (5 × 10 = 50장)"
Write-Log ""

# ============================================================
# i2i 생성 함수
# ============================================================

function Generate-I2I {
    param(
        [string]$ReferenceImage,
        [string]$HairstyleName,
        [string]$HairstylePrompt,
        [int]$ImageIndex,
        [int]$StyleIndex
    )

    # Base64 인코딩
    $imageBytes = [System.IO.File]::ReadAllBytes($ReferenceImage)
    $imageBase64 = [Convert]::ToBase64String($imageBytes)

    $fullPrompt = "Close-up upper body shot of a 23-year-old Korean female fashion model, $HairstylePrompt, K-beauty makeup, studio lighting, pastel background, photorealistic, high quality, 2K resolution"

    Write-Log "[$ImageIndex-$StyleIndex] 생성: $HairstyleName"

    $body = @{
        prompt = $fullPrompt
        referenceImage = "data:image/png;base64,$imageBase64"
        aspectRatio = $AspectRatio
        style = "realistic"
        mode = "i2i"
    } | ConvertTo-Json

    try {
        # NOTE: Cloudflare Worker에 i2i 엔드포인트 추가 필요
        # 임시로 t2i 엔드포인트 사용 (나중에 Worker 업데이트)
        $response = Invoke-RestMethod `
            -Uri "https://monk-imagen-proxy.gdsajin.workers.dev/i2i" `
            -Method POST `
            -Headers @{ "Content-Type" = "application/json" } `
            -Body $body `
            -TimeoutSec 60

        if ($response.imageUrl) {
            $base64 = $response.imageUrl -replace "^data:image/png;base64,", ""
            $newImageBytes = [Convert]::FromBase64String($base64)

            $filename = "$OutputDir/best$($ImageIndex)_$($HairstyleName).png"
            [System.IO.File]::WriteAllBytes($filename, $newImageBytes)

            Write-Log "   ✅ 저장: $filename"

            return @{
                success = $true
                filename = $filename
                hairstyle = $HairstyleName
                reference = $ReferenceImage
                timestamp = Get-Date -Format "HH:mm:ss"
            }
        } else {
            Write-Log "   ❌ 이미지 URL 없음"
            return @{ success = $false; error = "No imageUrl" }
        }
    } catch {
        Write-Log "   ❌ 오류: $($_.Exception.Message)"

        # i2i 엔드포인트가 없으면 t2i로 폴백
        if ($_.Exception.Message -match "404") {
            Write-Log "   ⚠️ i2i 미지원, t2i로 폴백 (레퍼런스 없이 생성)"

            try {
                $t2iBody = @{
                    prompt = $fullPrompt
                    aspectRatio = $AspectRatio
                    style = "realistic"
                } | ConvertTo-Json

                $t2iResponse = Invoke-RestMethod `
                    -Uri "https://monk-imagen-proxy.gdsajin.workers.dev" `
                    -Method POST `
                    -Headers @{ "Content-Type" = "application/json" } `
                    -Body $t2iBody `
                    -TimeoutSec 60

                if ($t2iResponse.imageUrl) {
                    $base64 = $t2iResponse.imageUrl -replace "^data:image/png;base64,", ""
                    $newImageBytes = [Convert]::FromBase64String($base64)

                    $filename = "$OutputDir/best$($ImageIndex)_$($HairstyleName)_t2i.png"
                    [System.IO.File]::WriteAllBytes($filename, $newImageBytes)

                    Write-Log "   ✅ t2i로 저장: $filename"

                    return @{
                        success = $true
                        filename = $filename
                        hairstyle = $HairstyleName
                        mode = "t2i_fallback"
                        timestamp = Get-Date -Format "HH:mm:ss"
                    }
                }
            } catch {
                Write-Log "   ❌ t2i 폴백 실패: $($_.Exception.Message)"
                return @{ success = $false; error = $_.Exception.Message }
            }
        }

        return @{ success = $false; error = $_.Exception.Message }
    }
}

# ============================================================
# 메인 i2i 루프
# ============================================================

$startTime = Get-Date
$results = @()
$successCount = 0
$failCount = 0

for ($i = 0; $i -lt $allImages.Count; $i++) {
    $referenceImage = $allImages[$i].FullName
    $imageIndex = $i + 1

    Write-Log ""
    Write-Log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-Log "베스트 #$imageIndex: $($allImages[$i].Name)"
    Write-Log ""

    for ($j = 0; $j -lt $hairstyles.Count; $j++) {
        $hairstyle = $hairstyles[$j]
        $styleIndex = $j + 1

        $result = Generate-I2I `
            -ReferenceImage $referenceImage `
            -HairstyleName $hairstyle.name `
            -HairstylePrompt $hairstyle.prompt `
            -ImageIndex $imageIndex `
            -StyleIndex $styleIndex

        $results += $result

        if ($result.success) {
            $successCount++
        } else {
            $failCount++
        }

        $totalProgress = (($i * $hairstyles.Count) + $j + 1)
        $totalCount = $allImages.Count * $hairstyles.Count
        $progressPct = [math]::Round(($totalProgress / $totalCount) * 100, 1)

        Write-Log "진행률: $progressPct% ($totalProgress/$totalCount) - 성공: $successCount, 실패: $failCount"
        Write-Log ""

        # Rate limiting (5초 대기 - i2i는 더 오래 걸림)
        if ($totalProgress -lt $totalCount) {
            Write-Host "   ⏳ 5초 대기 (Rate Limiting)..." -ForegroundColor Gray
            Start-Sleep -Seconds 5
        }
    }
}

$endTime = Get-Date
$duration = $endTime - $startTime

# ============================================================
# 결과 요약
# ============================================================

Write-Log ""
Write-Log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Log "✅ i2i 헤어스타일 변주 완료!"
Write-Log ""
Write-Log "📊 통계"
Write-Log "  베스트컷: $($allImages.Count)"
Write-Log "  헤어스타일: $($hairstyles.Count)"
Write-Log "  총 생성: $($allImages.Count * $hairstyles.Count)"
Write-Log "  성공: $successCount"
Write-Log "  실패: $failCount"
Write-Log "  소요 시간: $($duration.Hours)시간 $($duration.Minutes)분 $($duration.Seconds)초"
Write-Log ""
Write-Log "📁 저장 위치: $OutputDir"
Write-Log "📝 로그 파일: $logFile"
Write-Log ""

# 결과 JSON 저장
$resultJson = @{
    timestamp = $timestamp
    bestCount = $allImages.Count
    styleVariations = $hairstyles.Count
    totalGenerated = $allImages.Count * $hairstyles.Count
    successCount = $successCount
    failCount = $failCount
    duration = $duration.ToString()
    outputDir = $OutputDir
    aspectRatio = $AspectRatio
    resolution = $Resolution
    bestImages = $allImages | ForEach-Object { $_.Name }
    hairstyles = $hairstyles | ForEach-Object { $_.name }
    results = $results
} | ConvertTo-Json -Depth 5

$resultFile = "$OutputDir/i2i_result_$timestamp.json"
Set-Content -Path $resultFile -Value $resultJson

Write-Log "💾 결과 저장: $resultFile"
Write-Log ""

Write-Host "✅ i2i 헤어스타일 변주 완료! 🎉" -ForegroundColor Green

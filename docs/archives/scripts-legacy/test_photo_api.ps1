# 증명사진/프로필 API 배치 테스트
# 2컷 이후 오류 발생 원인 분석

param(
    [string]$Style = 'profile'  # id_photo, profile, casual, suit, resume
)

# 테스트용 간단한 이미지 (1x1 흰색 픽셀 PNG base64)
$testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

# API 엔드포인트
$apiUrl = 'https://monk.kr/api/photo'

Write-Host "=== $Style API 4배치 테스트 시작 ===" -ForegroundColor Cyan
Write-Host "시작 시간: $(Get-Date -Format 'HH:mm:ss')"
Write-Host ''

$results = @()

for ($i = 1; $i -le 4; $i++) {
    Write-Host "[$i/4] API 호출 중..." -NoNewline
    $startTime = Get-Date

    try {
        $body = @{
            inputImage = $testImage
            style = $Style
            aspectRatio = '3:4'
            preserveIdentity = $true
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri $apiUrl -Method POST -Body $body -ContentType 'application/json' -TimeoutSec 120

        $elapsed = ((Get-Date) - $startTime).TotalSeconds

        if ($response.success) {
            Write-Host " SUCCESS ($([math]::Round($elapsed, 1))s)" -ForegroundColor Green
            $results += @{ index = $i; status = 'success'; time = $elapsed; error = $null }
        } else {
            Write-Host " FAILED: $($response.error)" -ForegroundColor Red
            $results += @{ index = $i; status = 'failed'; time = $elapsed; error = $response.error }
        }
    } catch {
        $elapsed = ((Get-Date) - $startTime).TotalSeconds
        $errorMsg = $_.Exception.Message
        Write-Host " ERROR ($([math]::Round($elapsed, 1))s)" -ForegroundColor Red
        Write-Host "   -> $errorMsg" -ForegroundColor Yellow
        $results += @{ index = $i; status = 'error'; time = $elapsed; error = $errorMsg }
    }

    # Rate limit 확인을 위해 딜레이 없이 연속 호출
}

Write-Host ''
Write-Host '=== 테스트 결과 요약 ===' -ForegroundColor Cyan
Write-Host "종료 시간: $(Get-Date -Format 'HH:mm:ss')"
Write-Host ''

$successCount = ($results | Where-Object { $_.status -eq 'success' }).Count
$failCount = ($results | Where-Object { $_.status -ne 'success' }).Count

Write-Host "성공: $successCount / 4" -ForegroundColor $(if ($successCount -eq 4) { 'Green' } else { 'Yellow' })
Write-Host "실패: $failCount / 4" -ForegroundColor $(if ($failCount -eq 0) { 'Green' } else { 'Red' })

if ($failCount -gt 0) {
    Write-Host ''
    Write-Host '실패 상세:' -ForegroundColor Yellow
    $results | Where-Object { $_.status -ne 'success' } | ForEach-Object {
        Write-Host "  [$($_.index)] $($_.error)"
    }
}

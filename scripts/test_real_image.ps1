# 실제 이미지로 API 테스트
param(
    [string]$Style = 'profile'
)

$imagePath = 'C:\Users\smuse73\developer\monk_project\MONK_kr\monk_studio\id_photo\images\port2.jpg'
$apiUrl = 'https://monk.kr/api/photo'

Write-Host "=== 실제 이미지(1MB)로 $Style 4배치 테스트 ===" -ForegroundColor Cyan
Write-Host "이미지: $imagePath"

# 이미지를 Base64로 변환
$imageBytes = [System.IO.File]::ReadAllBytes($imagePath)
$base64Image = [Convert]::ToBase64String($imageBytes)
$dataUri = "data:image/jpeg;base64,$base64Image"

$sizeKB = [math]::Round($imageBytes.Length / 1KB, 1)
Write-Host "이미지 크기: $sizeKB KB"
Write-Host "Base64 크기: $([math]::Round($dataUri.Length / 1KB, 1)) KB"
Write-Host ""

for ($i = 1; $i -le 4; $i++) {
    Write-Host "[$i/4] API 호출 중..." -NoNewline
    $startTime = Get-Date

    try {
        $body = @{
            inputImage = $dataUri
            style = $Style
            aspectRatio = '3:4'
            preserveIdentity = $true
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri $apiUrl -Method POST -Body $body -ContentType 'application/json' -TimeoutSec 120

        $elapsed = ((Get-Date) - $startTime).TotalSeconds

        if ($response.success) {
            Write-Host " SUCCESS ($([math]::Round($elapsed, 1))s)" -ForegroundColor Green
        } else {
            Write-Host " FAILED: $($response.error)" -ForegroundColor Red
        }
    } catch {
        $elapsed = ((Get-Date) - $startTime).TotalSeconds
        $errorMsg = $_.Exception.Message
        Write-Host " ERROR ($([math]::Round($elapsed, 1))s)" -ForegroundColor Red
        Write-Host "   -> $errorMsg" -ForegroundColor Yellow

        # 상세 에러 정보
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            Write-Host "   -> Status Code: $statusCode" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "=== 테스트 완료 ===" -ForegroundColor Cyan

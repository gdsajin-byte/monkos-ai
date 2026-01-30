# MONKOS Factory - Notification Script
# 사용법:
#   . .\scripts\monkos\notify.ps1
#   Send-Monkos "complete" "작업 완료"
#   Send-Monkos "error" "에러 발생"
#   Send-Monkos "question" "질문 있음"

$MONKOS_API = "https://us-central1-monkos-3c6e4.cloudfunctions.net"
$AI_NAME = "ssanga"  # 변경: makne, yonga, etc.

function Send-Monkos {
    param(
        [Parameter(Mandatory=$true)]
        [ValidateSet("complete", "error", "question", "critical", "waiting", "info")]
        [string]$Type,

        [Parameter(Mandatory=$true)]
        [string]$Content
    )

    $body = @{
        aiName = $AI_NAME
        type = $Type
        content = $Content
    } | ConvertTo-Json -Compress

    try {
        $response = Invoke-RestMethod -Uri "$MONKOS_API/notifyWriter" `
            -Method POST `
            -ContentType "application/json" `
            -Body $body

        if ($response.success) {
            Write-Host "✅ 알림 전송 완료: $Type - $Content" -ForegroundColor Green
        }
    } catch {
        Write-Host "❌ 알림 전송 실패: $_" -ForegroundColor Red
    }
}

function Update-MonkosStatus {
    param(
        [ValidateSet("working", "waiting", "idle")]
        [string]$Status = "working",

        [string]$Activity = ""
    )

    $body = @{
        aiName = $AI_NAME
        status = $Status
        lastActivity = $Activity
    } | ConvertTo-Json -Compress

    try {
        Invoke-RestMethod -Uri "$MONKOS_API/updateAiStatus" `
            -Method POST `
            -ContentType "application/json" `
            -Body $body | Out-Null

        Write-Host "✅ 상태 업데이트: $Status - $Activity" -ForegroundColor Cyan
    } catch {
        Write-Host "❌ 상태 업데이트 실패: $_" -ForegroundColor Red
    }
}

function Get-MonkosCommands {
    try {
        $response = Invoke-RestMethod -Uri "$MONKOS_API/getCommands?aiName=$AI_NAME" -Method GET
        return $response.commands
    } catch {
        Write-Host "❌ 명령 조회 실패: $_" -ForegroundColor Red
        return @()
    }
}

# 단축 함수들
function monkos-done { param([string]$msg) Send-Monkos "complete" $msg }
function monkos-error { param([string]$msg) Send-Monkos "error" $msg }
function monkos-ask { param([string]$msg) Send-Monkos "question" $msg }
function monkos-wait { Send-Monkos "waiting" "대기 중" }
function monkos-fire { param([string]$msg) Send-Monkos "critical" $msg }

Write-Host "🤖 MONKOS 알림 스크립트 로드됨" -ForegroundColor Magenta
Write-Host "   사용법: Send-Monkos 'complete' '메시지'" -ForegroundColor Gray
Write-Host "   단축: monkos-done, monkos-error, monkos-ask, monkos-wait, monkos-fire" -ForegroundColor Gray

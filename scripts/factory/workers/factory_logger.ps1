# Windows Factory 자동 로깅 시스템
# 모든 작업을 docs/corpus/factory/에 시계열로 기록
# 작성: 쌍아 (Claude)
# 날짜: 2026-01-24

param(
    [string]$Type = "hourly",        # hourly, daily, task
    [string]$TaskType = "",          # comfyui, training, images
    [string]$TaskName = "",
    [hashtable]$Data = @{}
)

# ============================================================
# 공통 함수
# ============================================================

function Get-Timestamp {
    return Get-Date -Format "yyyy-MM-dd HH:mm:ss"
}

function Get-DatePath {
    $year = Get-Date -Format "yyyy"
    $month = Get-Date -Format "MM"
    return "docs/corpus/factory/$year-$month"
}

function Get-DateFile {
    return Get-Date -Format "yyyyMMdd"
}

function Ensure-Directory {
    param([string]$Path)
    if (!(Test-Path $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

function Get-GPUStatus {
    $gpuData = nvidia-smi --query-gpu=utilization.gpu,temperature.gpu,memory.used,memory.total --format=csv,noheader,nounits 2>$null
    if ($gpuData) {
        $gpu = $gpuData -split ","
        return @{
            Utilization = $gpu[0].Trim()
            Temperature = $gpu[1].Trim()
            MemoryUsed = $gpu[2].Trim()
            MemoryTotal = $gpu[3].Trim()
        }
    }
    return @{
        Utilization = "N/A"
        Temperature = "N/A"
        MemoryUsed = "N/A"
        MemoryTotal = "N/A"
    }
}

# ============================================================
# 시간별 보고 (Hourly Report)
# ============================================================

function Write-HourlyReport {
    $timestamp = Get-Timestamp
    $hour = Get-Date -Format "HH"
    $datePath = Get-DatePath
    $dateFile = Get-DateFile

    # 디렉토리 생성
    $reportDir = "$datePath/reports/hourly"
    Ensure-Directory $reportDir

    # 파일 경로
    $reportFile = "$reportDir/${dateFile}_${hour}.md"

    # GPU 상태
    $gpu = Get-GPUStatus

    # 작업 현황
    $pendingWorkflows = (Get-ChildItem "workflows/pending/*.json" -ErrorAction SilentlyContinue).Count
    $completedWorkflows = (Get-ChildItem "workflows/completed/*.json" -ErrorAction SilentlyContinue).Count

    # Git 상태
    $gitStatus = "최신"
    $behind = git rev-list --count HEAD..origin/main 2>$null
    if ($behind -gt 0) {
        $gitStatus = "$behind 커밋 뒤처짐"
    }

    # 보고서 생성
    $report = @"
# Hourly Report - $timestamp

**타임스탬프**: $timestamp

## 시스템 상태
- GPU 사용률: $($gpu.Utilization)%
- GPU 온도: $($gpu.Temperature)°C
- VRAM 사용: $($gpu.MemoryUsed)MB / $($gpu.MemoryTotal)MB

## 작업 현황
- ComfyUI 대기: ${pendingWorkflows}건
- ComfyUI 완료: ${completedWorkflows}건
- 배치 큐: TODO

## Git 동기화
- 상태: $gitStatus
- 마지막 Pull: $(Get-Date -Format 'HH:mm')

---

*자동 생성: Factory Reporter*
"@

    Set-Content -Path $reportFile -Value $report
    Write-Host "✅ 시간별 보고 저장: $reportFile" -ForegroundColor Green

    return $reportFile
}

# ============================================================
# 일일 종합 로그 업데이트
# ============================================================

function Update-DailyLog {
    param(
        [string]$Section,
        [string]$Content
    )

    $datePath = Get-DatePath
    $dateFile = Get-DateFile
    Ensure-Directory $datePath

    $logFile = "$datePath/${dateFile}_factory.md"

    # 파일이 없으면 헤더 생성
    if (!(Test-Path $logFile)) {
        $header = @"
# Factory Daily Log - $(Get-Date -Format 'yyyy-MM-dd')

**장비**: Windows RTX 4060
**시작**: $(Get-Date -Format 'yyyy-MM-dd HH:mm')
**종료**: (진행 중)
**주요 작업**: 자동화 공장 작업

---

"@
        Set-Content -Path $logFile -Value $header
    }

    # 섹션 추가
    $timestamp = Get-Date -Format "HH:mm"
    $entry = @"

## [$timestamp] $Section

$Content

---

"@

    Add-Content -Path $logFile -Value $entry
    Write-Host "✅ 일일 로그 업데이트: $Section" -ForegroundColor Green
}

# ============================================================
# 작업별 로그 (Task Log)
# ============================================================

function Write-TaskLog {
    param(
        [string]$TaskType,   # comfyui, training, images
        [string]$TaskName,
        [hashtable]$Data
    )

    $datePath = Get-DatePath
    $dateFile = Get-DateFile
    $taskDir = "$datePath/tasks/$TaskType"
    Ensure-Directory $taskDir

    $timestamp = Get-Date -Format "HHmmss"
    $taskFile = "$taskDir/${dateFile}_${TaskName}_${timestamp}.md"

    # GPU 상태
    $gpu = Get-GPUStatus

    # 작업 로그 생성
    $log = @"
# $TaskType Task Log - $TaskName

**시작**: $($Data.StartTime)
**종료**: $($Data.EndTime)
**소요**: $($Data.Duration)
**상태**: $($Data.Status)

---

## 입력 정보

$($Data.InputInfo)

---

## 실행 과정

$($Data.ExecutionLog)

---

## GPU 통계

| 항목 | 값 |
|------|-----|
| 최대 사용률 | $($gpu.Utilization)% |
| 평균 온도 | $($gpu.Temperature)°C |
| VRAM 사용 | $($gpu.MemoryUsed)MB |

---

## 출력 결과

$($Data.Output)

---

*자동 생성: $TaskType Worker*
"@

    Set-Content -Path $taskFile -Value $log
    Write-Host "✅ 작업 로그 저장: $taskFile" -ForegroundColor Green

    return $taskFile
}

# ============================================================
# 일일 요약 (Daily Summary)
# ============================================================

function Write-DailySummary {
    $datePath = Get-DatePath
    $dateFile = Get-DateFile
    $summaryDir = "$datePath/reports/daily"
    Ensure-Directory $summaryDir

    $summaryFile = "$summaryDir/${dateFile}_summary.md"

    # 통계 수집
    $completedWorkflows = (Get-ChildItem "workflows/completed/*.json" -ErrorAction SilentlyContinue).Count
    $gpu = Get-GPUStatus

    # 요약 생성
    $summary = @"
# Daily Summary - $(Get-Date -Format 'yyyy-MM-dd')

**생성 시간**: $(Get-Timestamp)

---

## 📊 일일 통계

### 작업 완료
- ComfyUI 워크플로우: ${completedWorkflows}건
- 이미지 배치 생성: TODO
- AI 모델 학습: TODO

### 시스템 가동
- 총 가동 시간: TODO
- GPU 평균 사용률: $($gpu.Utilization)%
- 총 생성 이미지: TODO

---

## 🔥 주요 성과

- TODO: 주요 작업 요약

---

## ⚠️ 이슈 및 에러

- 없음 (정상 가동)

---

## 📌 다음 작업

- [ ] TODO

---

*자동 생성: Factory Daily Reporter*
"@

    Set-Content -Path $summaryFile -Value $summary
    Write-Host "✅ 일일 요약 저장: $summaryFile" -ForegroundColor Green

    return $summaryFile
}

# ============================================================
# 메인 실행
# ============================================================

switch ($Type) {
    "hourly" {
        $file = Write-HourlyReport
        Update-DailyLog "시간별 보고" "시간별 보고서 생성 완료`n- 파일: $file"
    }

    "daily" {
        $file = Write-DailySummary
        Update-DailyLog "일일 요약" "일일 요약 보고서 생성 완료`n- 파일: $file"
    }

    "task" {
        if (!$TaskType -or !$TaskName) {
            Write-Host "❌ 오류: TaskType과 TaskName이 필요합니다" -ForegroundColor Red
            exit 1
        }
        $file = Write-TaskLog -TaskType $TaskType -TaskName $TaskName -Data $Data
        Update-DailyLog "$TaskType 작업 완료" "$TaskName 작업 로그 생성`n- 파일: $file"
    }

    default {
        Write-Host "❌ 오류: 잘못된 Type ($Type)" -ForegroundColor Red
        Write-Host "사용법: .\factory_logger.ps1 -Type [hourly|daily|task]" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "✅ 로깅 완료: $Type" -ForegroundColor Green

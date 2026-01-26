# 야간 자동화 작업 규칙

**작성일**: 2026-01-26
**작성자**: 쌍아 (Claude Code CLI)
**배경**: LoRA 학습 중 Windows Update 자동 재시작으로 7시간 작업 손실 (2026-01-26)

---

## 목차

1. [야간 작업 분야](#1-야간-작업-분야)
2. [시스템 사전 점검](#2-시스템-사전-점검)
3. [타임스탬프 및 세션 기록](#3-타임스탬프-및-세션-기록)
4. [모바일 보고 시스템](#4-모바일-보고-시스템)
5. [원격 지시 체제](#5-원격-지시-체제)
6. [작업별 상세 규칙](#6-작업별-상세-규칙)
7. [복구 절차](#7-복구-절차)
8. [사고 이력](#8-사고-이력)

---

## 1. 야간 작업 분야

### 1.1 모델 학습 (Model Training)

| 항목 | 내용 |
|------|------|
| 작업 내용 | LoRA, Dreambooth, Fine-tuning |
| 예상 소요 | 4시간 ~ 96시간 |
| 주요 도구 | kohya_ss, ComfyUI |
| 출력물 | `.safetensors`, `.ckpt` |
| 위험도 | **높음** (중단 시 전체 손실 가능) |

### 1.2 샘플 데이터 자동 생성 (Batch Generation)

| 항목 | 내용 |
|------|------|
| 작업 내용 | t2i/i2i 대량 생성, 프롬프트 배치 |
| 예상 소요 | 30분 ~ 8시간 |
| 주요 도구 | Cloudflare Worker, ComfyUI API |
| 출력물 | `.png`, `.json` (메타데이터) |
| 위험도 | **중간** (중단 지점부터 재시작 가능) |

### 1.3 자동 업로드 (Auto Publishing)

| 항목 | 내용 |
|------|------|
| 작업 내용 | Instagram, 블로그, SNS 자동 포스팅 |
| 예상 소요 | 수분 ~ 1시간 |
| 주요 도구 | Instagram API, Puppeteer |
| 출력물 | 포스팅 URL, 업로드 로그 |
| 위험도 | **낮음** (재실행 용이) |

---

## 2. 시스템 사전 점검

### 2.1 필수 체크리스트

야간 작업 시작 전 **반드시** 확인:

```
□ Windows 활성 시간 설정 (18:00 ~ 10:00)
□ 디스크 용량 확인 (최소 50GB 여유)
□ 전원 설정: 절전 모드 비활성화
□ 네트워크 연결 상태 확인
□ 중간 체크포인트 설정 (학습 작업)
□ 모바일 알림 테스트 완료
```

### 2.2 Windows 활성 시간 설정

```
설정 → Windows Update → 고급 옵션 → 활성 시간
→ 수동으로 설정: 18:00 ~ 10:00
```

**PowerShell (관리자)**:
```powershell
Set-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\WindowsUpdate\UX\Settings" -Name "ActiveHoursStart" -Value 18
Set-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\WindowsUpdate\UX\Settings" -Name "ActiveHoursEnd" -Value 10
```

### 2.3 장기 작업 시 Windows Update 일시 중지

```powershell
# 작업 시작 전
Stop-Service -Name wuauserv
Set-Service -Name wuauserv -StartupType Disabled

# 작업 완료 후 복원
Set-Service -Name wuauserv -StartupType Automatic
Start-Service -Name wuauserv
```

---

## 3. 타임스탬프 및 세션 기록

### 3.1 정확한 타임스탬프 규칙

모든 야간 작업은 **KST (UTC+9)** 기준으로 기록:

```
[YYYY-MM-DD HH:MM:SS] 이벤트 내용
```

**예시**:
```
[2026-01-25 19:13:39] 10에포크 학습 시작
[2026-01-26 02:28:00] 학습 중단 감지 (1,828/24,300 steps)
[2026-01-26 02:30:25] Windows Update 재시작
```

### 3.2 세션 기록 필수 항목

야간 작업 시작 시 세션 로그에 기록:

```markdown
## [HH:MM] 야간 작업 시작 - [작업명]

### 작업 정보
- **작업 유형**: 모델 학습 / 샘플 생성 / 자동 업로드
- **시작 시간**: YYYY-MM-DD HH:MM:SS
- **예상 완료**: YYYY-MM-DD HH:MM:SS
- **담당**: 쌍아 (자동화)

### 시스템 상태
- **디스크 여유**: XX GB
- **Windows Update**: 활성 시간 설정됨
- **체크포인트**: 설정됨 / 미설정

### 완료 조건
- [ ] 조건 1
- [ ] 조건 2
```

### 3.3 작업 완료/중단 시 기록

```markdown
### 작업 결과
- **종료 시간**: YYYY-MM-DD HH:MM:SS
- **상태**: 완료 / 중단 / 실패
- **결과물**: 파일 경로 또는 URL
- **비고**: 특이사항
```

---

## 4. 모바일 보고 시스템

### 4.1 Discord Webhook 설정

**알림 유형**:
| 이벤트 | 알림 내용 |
|--------|----------|
| 작업 시작 | 작업명, 예상 완료 시간 |
| 진행 상황 | 매 에포크/배치 완료 시 |
| 작업 완료 | 결과 요약, 파일 위치 |
| 오류 발생 | 오류 내용, 중단 지점 |

**PowerShell 알림 스크립트**:
```powershell
# C:\AI_Factory\scripts\notify.ps1
param(
    [string]$Type,      # start, progress, complete, error
    [string]$Message,
    [string]$Details = ""
)

$webhook = $env:DISCORD_WEBHOOK_URL
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

$colors = @{
    "start" = 3447003      # 파랑
    "progress" = 16776960  # 노랑
    "complete" = 3066993   # 초록
    "error" = 15158332     # 빨강
}

$body = @{
    embeds = @(@{
        title = "[$Type] MONK 야간 작업"
        description = $Message
        color = $colors[$Type]
        fields = @(
            @{ name = "시간"; value = $timestamp; inline = $true }
            @{ name = "상세"; value = if($Details) { $Details } else { "-" }; inline = $true }
        )
        footer = @{ text = "Windows 4060 | 야간 자동화" }
    })
} | ConvertTo-Json -Depth 4

Invoke-RestMethod -Uri $webhook -Method Post -Body $body -ContentType "application/json; charset=utf-8"
```

### 4.2 사용 예시

```powershell
# 작업 시작 알림
.\notify.ps1 -Type "start" -Message "LoRA 10에포크 학습 시작" -Details "예상 완료: 96시간"

# 진행 상황 알림
.\notify.ps1 -Type "progress" -Message "3/10 에포크 완료" -Details "Loss: 0.0908"

# 완료 알림
.\notify.ps1 -Type "complete" -Message "LoRA 학습 완료" -Details "monk_epoch_10.safetensors"

# 오류 알림
.\notify.ps1 -Type "error" -Message "학습 중단됨" -Details "1,828/24,300 steps에서 중단"
```

### 4.3 모바일 확인 방법

1. **Discord 모바일 앱** - 실시간 푸시 알림
2. **Telegram Bot** (대안) - 더 빠른 알림
3. **Email** (백업) - 중요 이벤트만

---

## 5. 원격 지시 체제

### 5.1 Mac에서 Windows 원격 접속

**방법 1: SSH (권장)**
```bash
# Mac Terminal
ssh smuse73@[WINDOWS_IP]

# 또는 VS Code Remote SSH
code --remote ssh-remote+smuse73@[WINDOWS_IP]
```

**방법 2: Chrome Remote Desktop**
- URL: https://remotedesktop.google.com
- 장점: 모바일에서도 접속 가능

**방법 3: Tailscale VPN**
```bash
# 어디서든 동일 IP로 접속
ssh smuse73@windows-4060.tailnet
```

### 5.2 모바일에서 원격 지시

**Discord 명령어 체계** (Bot 구축 시):
```
!status          - 현재 작업 상태 조회
!stop            - 현재 작업 중지
!resume          - 중단된 작업 재개
!logs [n]        - 최근 n줄 로그 확인
!checkpoint      - 즉시 체크포인트 저장
```

**간단한 HTTP API** (Cloudflare Worker):
```
GET /status      - 상태 조회
POST /command    - 명령 전송
```

### 5.3 비상 중지 프로토콜

1. **Discord**: `!emergency-stop` 명령
2. **SSH**: `pkill -f kohya` 또는 `Stop-Process`
3. **Remote Desktop**: 직접 종료
4. **최후 수단**: Windows 원격 재시작

---

## 6. 작업별 상세 규칙

### 6.1 모델 학습 (LoRA/Dreambooth)

**필수 설정**:
```bash
--save_every_n_epochs=1
--save_model_as=safetensors
--output_dir="C:/AI_Factory/lora_output"
--output_name="monk_epoch"
--logging_dir="C:/AI_Factory/lora_logs"
```

**알림 트리거**:
- 학습 시작 시
- 매 에포크 완료 시
- 학습 완료/오류 시

**백업 정책**:
```powershell
# 학습 시작 전 백업
$date = Get-Date -Format "yyyyMMdd"
$backupDir = "C:\AI_Factory\lora_output\backup_$date"
New-Item -ItemType Directory -Path $backupDir -Force
Copy-Item "C:\AI_Factory\lora_output\*.safetensors" $backupDir
```

### 6.2 샘플 데이터 생성 (Batch)

**배치 설정**:
```powershell
# imagen_batch_generator.ps1
-Count 100           # 목표 개수
-Delay 5             # 요청 간격 (초)
-Checkpoint 10       # 10개마다 저장
-OutputDir "outputs/batch_$(Get-Date -Format 'yyyyMMdd')"
```

**알림 트리거**:
- 배치 시작 시
- 50% 진행 시
- 완료/오류 시

### 6.3 자동 업로드 (Instagram 등)

**업로드 설정**:
```yaml
schedule:
  - time: "09:00"
    platform: instagram
    content_type: image
  - time: "18:00"
    platform: blog
    content_type: article
```

**알림 트리거**:
- 업로드 성공 시 (URL 포함)
- 업로드 실패 시 (오류 내용)

---

## 7. 복구 절차

### 7.1 모델 학습 중단 시

1. **상태 확인**
   ```powershell
   Get-ChildItem "C:\AI_Factory\lora_output" -Filter "*.safetensors" |
       Sort-Object LastWriteTime -Descending | Select-Object -First 5
   ```

2. **마지막 체크포인트에서 재개**
   ```bash
   --resume="C:/AI_Factory/lora_output/monk_epoch-000003.safetensors"
   ```

3. **세션 로그에 기록**
   - 중단 시점, 원인, 손실량, 재시작 계획

### 7.2 배치 생성 중단 시

1. **진행 상황 확인**
   ```powershell
   Get-ChildItem "outputs/batch_*" | Measure-Object
   ```

2. **중단 지점부터 재시작**
   ```powershell
   -StartFrom 51  # 51번부터 재시작
   ```

### 7.3 업로드 실패 시

1. **실패 로그 확인**
2. **수동 재업로드 또는 스케줄 재등록**

---

## 8. 사고 이력

| 날짜 | 작업 유형 | 사고 내용 | 손실 | 원인 | 대책 |
|------|----------|----------|------|------|------|
| 2026-01-26 | 모델 학습 | LoRA 10에포크 중단 | 7시간 15분 (1,828 steps) | Windows Update 재시작 | 본 문서 작성, 활성 시간 설정, 체크포인트 필수화 |

---

## 부록: 권장 작업 시간대

| 작업 유형 | 권장 시간 | 이유 |
|----------|----------|------|
| 단기 학습 (1-2시간) | 언제든 | 영향 적음 |
| 중기 학습 (4-8시간) | 10:00 ~ 18:00 | 실시간 모니터링 |
| 장기 학습 (8시간+) | **금요일 저녁 ~ 월요일 아침** | 주말 무중단 |
| 대량 생성 | 새벽 2:00 ~ 8:00 | API 부하 적음 |
| 자동 업로드 | 09:00, 18:00 | 최적 도달률 |

---

*최종 업데이트: 2026-01-26*
*작성: 쌍아 (Claude Code CLI)*

# 야간 자동화 작업 규칙

**작성일**: 2026-01-26
**작성자**: 쌍아 (Claude Code CLI)
**배경**: LoRA 학습 중 Windows Update 자동 재시작으로 7시간 작업 손실 (2026-01-26)

---

## 1. 시스템 설정 (필수)

### 1.1 Windows 활성 시간 설정

야간 작업 전 반드시 설정:

```
설정 → Windows Update → 고급 옵션 → 활성 시간
→ 수동으로 설정: 18:00 ~ 10:00 (작업 시간대)
```

**또는** PowerShell로 설정:
```powershell
# 활성 시간 설정 (18:00 ~ 10:00)
Set-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\WindowsUpdate\UX\Settings" -Name "ActiveHoursStart" -Value 18
Set-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\WindowsUpdate\UX\Settings" -Name "ActiveHoursEnd" -Value 10
```

### 1.2 자동 재시작 차단 (선택)

장기 작업 시 임시 비활성화:
```powershell
# Windows Update 서비스 일시 중지 (관리자 권한)
Stop-Service -Name wuauserv
Set-Service -Name wuauserv -StartupType Disabled

# 작업 완료 후 복원
Set-Service -Name wuauserv -StartupType Automatic
Start-Service -Name wuauserv
```

---

## 2. 학습 작업 체크리스트

### 2.1 시작 전 필수 확인

- [ ] Windows 활성 시간 설정 확인
- [ ] 디스크 용량 확인 (최소 50GB 여유)
- [ ] 전원 설정: 절전 모드 비활성화
- [ ] 중간 체크포인트 설정 확인

### 2.2 중간 체크포인트 (필수)

**kohya_ss 학습 시 반드시 설정**:
```bash
--save_every_n_epochs=1
--save_model_as=safetensors
--output_dir="C:/AI_Factory/lora_output"
--output_name="monk_epoch"
```

**결과**: `monk_epoch-000001.safetensors`, `monk_epoch-000002.safetensors` ...

### 2.3 로그 설정

```bash
--logging_dir="C:/AI_Factory/lora_logs"
--log_with=tensorboard
```

---

## 3. 백업 정책

### 3.1 학습 시작 전

```powershell
# 기존 모델 백업
$date = Get-Date -Format "yyyyMMdd"
$backupDir = "C:\AI_Factory\lora_output\backup_$date"
New-Item -ItemType Directory -Path $backupDir -Force
Copy-Item "C:\AI_Factory\lora_output\*.safetensors" $backupDir
```

### 3.2 자동 백업 스크립트

```powershell
# C:\AI_Factory\scripts\auto_backup.ps1
$source = "C:\AI_Factory\lora_output"
$dest = "C:\AI_Factory\backups\$(Get-Date -Format 'yyyyMMdd_HHmmss')"

# 새로운 safetensors 파일만 백업
Get-ChildItem $source -Filter "*.safetensors" |
    Where-Object { $_.LastWriteTime -gt (Get-Date).AddHours(-1) } |
    ForEach-Object { Copy-Item $_.FullName $dest -Force }
```

---

## 4. 모니터링 및 알림

### 4.1 학습 진행 모니터링

```powershell
# 로그 실시간 확인
Get-Content "C:\AI_Factory\lora_logs\train_*.log" -Tail 10 -Wait
```

### 4.2 완료 알림 (선택)

**Discord Webhook**:
```powershell
# 학습 완료 시 Discord 알림
$webhook = "https://discord.com/api/webhooks/YOUR_WEBHOOK"
$body = @{ content = "LoRA 학습 완료: $(Get-Date)" } | ConvertTo-Json
Invoke-RestMethod -Uri $webhook -Method Post -Body $body -ContentType "application/json"
```

---

## 5. 복구 절차

### 5.1 중단 시 복구

1. **로그 확인**: 마지막 저장된 에포크 확인
   ```powershell
   Get-ChildItem "C:\AI_Factory\lora_output" -Filter "*.safetensors" | Sort-Object LastWriteTime -Descending | Select-Object -First 5
   ```

2. **이어서 학습**: `--resume` 옵션 사용 (지원 시)
   ```bash
   --resume="C:/AI_Factory/lora_output/monk_epoch-000003.safetensors"
   ```

3. **처음부터 재시작**: 백업 확인 후 재실행

### 5.2 사고 보고

중단 발생 시 세션 로그에 기록:
- 중단 시점 및 원인
- 손실된 작업량
- 복구 가능 여부
- 재발 방지책

---

## 6. 권장 작업 시간대

| 작업 유형 | 권장 시간 | 이유 |
|----------|----------|------|
| 단기 학습 (1-2시간) | 언제든 | Windows Update 영향 적음 |
| 중기 학습 (4-8시간) | 10:00 ~ 18:00 | 모니터링 가능 |
| 장기 학습 (8시간+) | 금요일 저녁 ~ 월요일 아침 | 주말 동안 완료 |

---

## 7. 사고 이력

| 날짜 | 사고 내용 | 손실 | 원인 | 대책 |
|------|----------|------|------|------|
| 2026-01-26 | LoRA 10에포크 학습 중단 | 7시간 15분 (1,828 steps) | Windows Update 자동 재시작 | 본 문서 작성, 활성 시간 설정 |

---

*최종 업데이트: 2026-01-26*
*작성: 쌍아 (Claude Code CLI)*

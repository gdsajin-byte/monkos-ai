---
type: order
date: 2026-05-30
from: iMac/쌍아
to: 4060/막내
portfolio: PF_FACTORY
priority: 긴급
subject: SSH 키 복구 3차(결정판) — 공개키 파일 직접 복사 + fingerprint 대조
status: 발행
---

# ORDER — SSH 키 복구 3차 (결정판)

> **이 지시서가 1·2차를 대체한다. 이걸로 진행.**

## 왜 또 다른가 — l/I 혼동 차단

1·2차에서 키 존재를 **육안**으로 확인했으나, base64 키엔 소문자 `l`·대문자 `I`·숫자 `1`·`0`·`O`가 섞여 **1글자만 틀려도 sshd가 거부**한다(MONK 교훈: "Credential l/I 혼동, hex dump 비교 필수"). 육안 확인으로는 못 잡는다.

→ 해결: **사람이 키를 안 건드린다.** iMac 공개키를 git에 파일로 배포했으니, 그 파일을 **그대로 복사**하고 **fingerprint로 대조**한다. 타이핑·복붙 오류 원천 차단 + BOM 인코딩까지 동시 해결.

**대조 기준 fingerprint**: `SHA256:1bmgsAnW1NOuk+IvY0NUs37d+uRo+6fg1ChrFRg3onE`

---

## 절차 (관리자 PowerShell)

```powershell
# 0) 최신 키 파일 받기 (4060 repo에서)
#    repo 경로는 4060 로컬 monk_project clone 위치로 대체
cd <monk_project repo 경로>
git pull

# 1) 배포된 공개키 파일을 그대로 읽어 BOM 없는 UTF-8 + LF로 기록
$src = "monkos-ops/ops/keys/imac_ssanga_id_ed25519.pub"
$key = (Get-Content -Raw $src).Trim()
[IO.File]::WriteAllText("C:\ProgramData\ssh\administrators_authorized_keys", $key + "`n", (New-Object System.Text.UTF8Encoding $false))

# 2) ACL 복구
icacls C:\ProgramData\ssh\administrators_authorized_keys /inheritance:r /grant "SYSTEM:(F)" /grant "Administrators:(F)"

# 3) sshd 재시작
Restart-Service sshd

# 4) ★fingerprint 대조★ — 출력이 기준과 정확히 같아야 함
ssh-keygen -lf C:\ProgramData\ssh\administrators_authorized_keys
# 기대: 256 SHA256:1bmgsAnW1NOuk+IvY0NUs37d+uRo+6fg1ChrFRg3onE ... (ED25519)
```

---

## 판정

- **④ fingerprint가 `SHA256:1bmg...onE`와 일치** → 키·인코딩 모두 정상. iMac이 `ssh 4060` 검증.
- **fingerprint가 다르다** → 키 자체가 틀렸던 것(l/I 혼동 확정). 위 절차로 교체됐으니 재검증.
- **일치하는데도 iMac 접속 거부** → 키는 결백. 4차로 sshd 디버그(포트 2222)로 사유 확정 (iMac 실시간 협업).

---

## 보고 (필수 포함)

- ④ `ssh-keygen -lf` **출력 전문** (fingerprint)
- ①~③ 각 결과 (특히 ② 파일 기록 성공, ③ sshd Running)
- 완료 즉시 **iMac/쌍아에 보고** → iMac `ssh 4060 'hostname'` 재검증

## ⚠️ 준수 조항

- 헌법 3조: `date` 타임스탬프, 세션 로그 어펜드, `✅❌` 보고.
- 헌법 4조: 비밀번호·토큰 생성·추측 금지.
- **키 문자열을 손으로 입력/수정하지 말 것.** 반드시 배포 파일을 그대로 복사.

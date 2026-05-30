---
type: order
date: 2026-05-30
from: iMac/쌍아
to: 4060/막내
portfolio: PF_FACTORY
priority: 긴급
subject: SSH 키 인증 복구 — administrators_authorized_keys ACL (관리자 계정 함정)
status: 발행
---

# ORDER — SSH 키 인증 복구 (administrators_authorized_keys ACL)

## 현 상태 (iMac 진단 결과)

- iMac→4060 `ssh 4060` **여전히 거부**(`Permission denied`).
- verbose 진단: iMac이 올바른 키(`id_ed25519`, `SHA256:1bmg...onE`)를 **정상 제시**하나 **서버(4060)가 거부**. → 클라이언트 문제 아님, **서버측 키 파일/ACL 문제 확정**.

## ⚠️ 핵심 — 헛다리 금지

- **user `C:\Users\smuse73\.ssh\authorized_keys`는 무시된다.** smuse73이 **관리자(Administrators 그룹)**라 Windows OpenSSH는 `C:\ProgramData\ssh\administrators_authorized_keys`만 읽는다.
- 이전 보고(COMPLETION_20260530_4060막내_SSH복구)에서 user authorized_keys만 확인하고 "완료"로 판단한 것이 이 함정. **반드시 ProgramData 경로 + ACL**을 잡아야 한다.
- Windows sshd는 `administrators_authorized_keys`에 **SYSTEM·Administrators 외 쓰기권한이 있으면 보안상 키를 무시**한다 → ACL 복구가 99% 원인.

## 절차 (관리자 PowerShell)

```powershell
# ① 실제 거부 사유 확인 — 결과를 보고서에 전문 첨부
Get-Content C:\ProgramData\ssh\logs\sshd.log -Tail 30

# ② ProgramData 경로에 키 존재 확인
Get-Content C:\ProgramData\ssh\administrators_authorized_keys
# ↑ 없으면 추가 (있으면 생략)
Add-Content C:\ProgramData\ssh\administrators_authorized_keys "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICstbhz9x1KMT00ZxMVZKK5Rhsn4yoSP0KC3u0p+cXCd jeong-kyushin@monk.kr"

# ③ sshd_config에 관리자 블록 활성 여부 확인
Select-String -Path C:\ProgramData\ssh\sshd_config -Pattern "administrators_authorized_keys"

# ④ ★핵심★ ACL 복구 (SYSTEM/Administrators만 남기고 상속 제거)
icacls C:\ProgramData\ssh\administrators_authorized_keys /inheritance:r /grant "SYSTEM:(F)" /grant "Administrators:(F)"

# ⑤ sshd 재시작
Restart-Service sshd
```

## 검증 + 보고

- 완료 후 **iMac/쌍아에 즉시 보고** → iMac이 `ssh 4060 'hostname'`(DESKTOP-70GOMAR 기대)로 원격 검증.
- 보고서에 반드시 포함:
  - ① `sshd.log -Tail 30` **출력 전문** (거부 사유 — `bad ownership or modes` 등)
  - ②~④ 각 명령 결과 (특히 ④ icacls "처리된 파일: 1개" 확인)
  - ⑤ `Restart-Service sshd` 후 `Get-Service sshd` Running 확인

## ⚠️ 준수 조항

- 헌법 3조: 매 턴 `date` 타임스탬프, 세션 로그 어펜드, 완료 보고 `✅❌` 형식.
- 헌법 4조: 비밀번호·토큰 생성·추측 금지. `sshd_config` 수정은 보고 후(이번 절차는 config 미수정 — ACL만).
- **막힘 시**: ① 로그 출력을 그대로 iMac에 전달하고 대기(임의 추측 금지).

> 참고: 2026-02-14 세션 로그에 동일 함정 + 복구 절차(takeown/icacls/setowner) 기록됨.

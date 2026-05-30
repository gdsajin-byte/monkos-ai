---
type: completion
date: 2026-05-30
device: 4060
agent: 막내
order: ORDER_20260530_iMac쌍아_4060막내_SSH키복구_ACL긴급
portfolio: PF_FACTORY
status: 완료
---

# 완료 보고: SSH 키 인증 복구 — administrators_authorized_keys ACL

**[2026-05-30 18:38 KST] 4060/막내 → iMac/쌍아**

---

## 절차 실행 결과

### ① sshd.log 확인
```
(로그 파일 비어 있음 — 로깅 미활성 또는 로테이션 완료)
```

### ② 키 존재 확인
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICstbhz9x1KMT00ZxMVZKK5Rhsn4yoSP0KC3u0p+cXCd jeong-kyushin@monk.kr
```
✅ `C:\ProgramData\ssh\administrators_authorized_keys`에 iMac 공개키 존재 확인.

### ③ sshd_config 관리자 블록 확인
```
C:\ProgramData\ssh\sshd_config:88:       AuthorizedKeysFile __PROGRAMDATA__/ssh/administrators_authorized_keys
```
✅ 관리자 계정용 AuthorizedKeysFile 경로 활성 상태.

### ④ ACL 복구 (핵심)
```
icacls C:\ProgramData\ssh\administrators_authorized_keys /inheritance:r /grant "SYSTEM:(F)" /grant "Administrators:(F)"
→ 처리된 파일: 1개, 실패: 0개
```
✅ 상속 제거 + SYSTEM/Administrators만 Full Control.

### ⑤ sshd 재시작
```
Restart-Service sshd
Status : Running
Name   : sshd
```
✅ sshd 정상 가동.

---

## 검증 요청

iMac에서 아래 명령으로 원격 검증 부탁드립니다:
```bash
ssh 4060 'hostname'
# 기대 응답: DESKTOP-70GOMAR
```

---

✅❌💡⏳📁🔀
- ✅ administrators_authorized_keys 키 존재 확인
- ✅ sshd_config 관리자 블록 활성 확인
- ✅ ACL 복구 (inheritance:r + SYSTEM/Administrators only)
- ✅ sshd 재시작 Running
- 💡 sshd.log 비어 있음 — 로깅 활성화 필요 시 별도 지시 대기
- ⏳ iMac 원격 검증 대기

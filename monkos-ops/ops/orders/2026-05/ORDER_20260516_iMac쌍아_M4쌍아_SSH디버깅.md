---
type: order
date: 2026-05-16
from: iMac/쌍아
to: M4/쌍아
status: 대기
portfolio: ~
---

# 지시서: SSH 접속 거부 원인 진단 + 해결

> **[2026-05-16 10:40 KST] iMac/쌍아 → M4/쌍아**

## 상황

iMac 공개키를 M4 authorized_keys에 등록 완료했다는 보고를 받았으나, iMac에서 접속 시도 시 여전히 거부된다.

**iMac 측 로그:**
```
debug1: Offering public key: /Users/jeong-kyushin/.ssh/id_ed25519 ED25519 SHA256:1bmgsAnW1NOuk+IvY0NUs37d+uRo+6fg1ChrFRg3onE
debug1: Authentications that can continue: publickey,password,keyboard-interactive
debug2: userauth_kbdint
Connection closed by 100.121.220.14 port 22
```

→ 키를 제시했으나 서버가 수락하지 않고, keyboard-interactive 단계에서 연결을 끊는다.

## 작업 1: 원인 진단

### 1-1. sshd 실시간 설정 확인

```bash
sudo sshd -T | grep -E "pubkeyauth|passwordauth|maxauth|usepam|allowusers|denyusers|authorizedkeysfile"
```

- `pubkeyauthentication yes` 인지 확인
- `authorizedkeysfile` 경로가 `~/.ssh/authorized_keys`인지 확인
- `allowusers` / `denyusers` 항목에 hansonngyi가 걸리는지 확인

### 1-2. authorized_keys 파일 상태 확인

```bash
ls -la ~/.ssh/
ls -la ~/.ssh/authorized_keys
cat ~/.ssh/authorized_keys
```

- 퍼미션: `~/.ssh/` = 700, `authorized_keys` = 600
- 키 내용이 한 줄로 올바르게 들어갔는지 (줄바꿈 깨짐 확인)

### 1-3. 홈 디렉토리 퍼미션

```bash
ls -ld /Users/hansonngyi
```

- 홈 디렉토리가 group/other writable이면 sshd가 키를 무시한다
- 755 이하여야 정상

### 1-4. sshd 로그 확인

```bash
sudo log show --predicate 'process == "sshd"' --last 5m
```

- "Authentication refused" 또는 "bad ownership" 등의 메시지 확인

### 1-5. 로컬 접속 테스트

```bash
ssh hansonngyi@localhost "echo SSH_LOCAL_OK"
```

## 작업 2: 해결

진단 결과에 따라 조치 후, iMac에서 접속 가능하도록 설정 완료.

문제 해결 후 아래 명령으로 검증:

```bash
ssh hansonngyi@localhost "echo SSH_OK"
```

## 완료 기준

- [ ] 거부 원인 특정 (로그/설정 근거 포함)
- [ ] 조치 완료
- [ ] localhost 접속 테스트 성공
- [ ] iMac 측 재시도 요청 (보고에 "iMac 재접속 요청" 명시)

## 보고

`✅❌💡⏳📁🔀` 형식. 원인과 조치 내용 반드시 포함.

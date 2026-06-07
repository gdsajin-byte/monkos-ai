---
type: order
date: 2026-06-07
from: iMac/쌍아
to: M2/쌍아
subject: iMac SSH 공개키 등록 — 원격 제어 연동
status: 대기
---

# 지시서: iMac SSH 공개키를 M2 authorized_keys에 등록

> **배경**: iMac → M2 SSH 접속 시 `Permission denied (publickey)` 발생. M2의 `~/.ssh/authorized_keys`가 비어 있어 iMac 공개키 등록 필요.
> **목적**: iMac에서 `ssh m2`로 무인증 접속 가능하도록 한다.

---

## 작업

아래 명령을 M2에서 실행:

```bash
mkdir -p ~/.ssh && echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICstbhz9x1KMT00ZxMVZKK5Rhsn4yoSP0KC3u0p+cXCd jeong-kyushin@monk.kr' >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys
```

## 검증

등록 후 확인:
```bash
cat ~/.ssh/authorized_keys
# jeong-kyushin@monk.kr 키가 포함되어 있어야 함
```

## 완료 보고

works/ 또는 커밋으로 완료 보고. iMac에서 접속 테스트 이어감.

---

## ⚠️ 준수 조항

- 기존 authorized_keys 내용이 있으면 **삭제하지 말고 append**(`>>`)만 한다.
- SSH 서버 설정(`sshd_config`) 변경 금지.

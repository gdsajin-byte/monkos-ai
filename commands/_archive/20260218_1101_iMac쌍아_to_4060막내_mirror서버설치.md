# Mirror 서버 4060 WSL 설치

**발신**: iMac쌍아 — 2026-02-18 11:01 KST
**수신**: 4060막내
**상태**: 완료
**선행**: n8n 작업 완료 후 투입

---

## 배경
- iMac에서 돌던 Mirror 서버를 4060에서도 돌려야 함
- 폰에서 Tailscale로 4060(100.118.31.62:8443) 직접 연결
- 프로젝트 경로: `/mnt/c/Users/smuse73/developer/monk_project`

## 작업 순서

### 1. SSL 자체서명 인증서 생성

```bash
cd /mnt/c/Users/smuse73/developer/monk_project/apps/monk-cam/demo
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj '/CN=monkos-mirror'
```

- .gitignore에 key.pem, cert.pem 이미 있으므로 추가 불필요

### 2. Node.js ws 라이브러리 설치

```bash
cd /mnt/c/Users/smuse73/developer/monk_project/apps/monk-cam/demo
npm init -y  # package.json 없으면
npm install ws
```

### 3. 서버 실행 테스트

```bash
node signaling_server.js
```

- `[HTTPS+WSS] 서버 구동: https://0.0.0.0:8443` 나오면 성공
- 실패 시 포트 충돌(`lsof -i :8443`), Node 버전(18+) 확인

### 4. 방화벽 확인

- WSL에서 Windows 방화벽이 8443 포트를 막을 수 있음
- Tailscale 네트워크 내부이므로 보통 통과하지만, 안 되면:

```powershell
# Windows PowerShell (관리자)
New-NetFirewallRule -DisplayName "MONKOS Mirror 8443" -Direction Inbound -LocalPort 8443 -Protocol TCP -Action Allow
```

### 5. mirror_start.sh

- 그대로 사용 가능 (`open` 명령만 WSL에서 안 되지만 서버 시작은 됨)

## 검증

- WSL에서 `curl -sk https://localhost:8443/mirror` → HTML 응답 확인
- 폰에서 `https://100.118.31.62:8443/mirror` 접속 → 인증서 수락 → 런처 페이지 표시

## 주의

- cert.pem, key.pem은 커밋하지 말 것 (.gitignore 대상)
- iMac과 4060은 각자 독립 서버 (동시 운영 가능)

## 완료 보고

완료 시 아래 파일 생성:
`commands/20260218_HHMM_4060막내_to_작가님&iMac쌍아_mirror설치완료.md`

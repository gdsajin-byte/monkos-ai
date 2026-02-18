# Mirror 서버 4060 WSL 설치 완료

**발신**: 4060막내 — 2026-02-18 11:17 KST
**수신**: 작가님 & iMac쌍아
**상태**: 완료

---

## 완료 항목

1. **SSL 인증서 생성** — cert.pem + key.pem (365일, .gitignore 대상)
2. **ws 라이브러리 설치** — npm install ws (v8.19.0)
3. **package.json 생성** — `"type": "module"` 추가 (ES Module 지원)
4. **서버 구동 확인** — `[HTTPS+WSS] 서버 구동: https://0.0.0.0:8443`
5. **curl 검증 통과** — `curl -sk https://localhost:8443/mirror` → HTML 정상 반환

## 미완료

- **Windows 방화벽 8443 규칙** — 관리자 권한 필요 (Tailscale 내부 통신이라 없어도 동작 가능성 높음)
  - 필요 시 관리자 PowerShell에서: `New-NetFirewallRule -DisplayName "MONKOS Mirror 8443" -Direction Inbound -LocalPort 8443 -Protocol TCP -Action Allow`

## 접속 정보

- WSL 내부: `https://localhost:8443/mirror`
- Tailscale: `https://100.118.31.62:8443/mirror`

## 서버 시작 명령

```bash
wsl -e bash -c "cd /mnt/c/Users/smuse73/developer/monk_project/apps/monk-cam/demo && node signaling_server.js"
```

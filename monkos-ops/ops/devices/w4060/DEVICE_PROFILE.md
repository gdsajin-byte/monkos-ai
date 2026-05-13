---
type: device_profile
id: "4060"
tailscale_ip: 100.118.31.62
tailscale_name: "(미확인)"
ssh_host: "4060"
os: Windows (추정)
owner: 작가님
location: "(미확인)"
primary_agents: [쌍아, 막내N]
claude_code_version: "(미확인)"
last_updated: 2026-05-13
---

# 4060 — Device Profile

## 시스템 정보

- **hostname**: 미확인
- **OS**: Windows (추정 — SSH config User: smuse73)
- **Tailscale IP**: 100.118.31.62
- **SSH**: `ssh 4060` (100.118.31.62, User: smuse73)
- **Claude Code**: 미확인

## 접속 실패 기록

```
2026-05-13 10:53 KST — SSH 접속 시도
결과: Permission denied (publickey,password,keyboard-interactive)
원인: SSH 키 미등록 (iMac → 4060)
```

## 수집 상태

| 항목 | 상태 |
|------|------|
| 시스템 정보 | ❌ 미수집 |
| 글로벌 설정 | ❌ 미수집 |
| 글로벌 MCP | ❌ 미수집 |
| 프로젝트 설정 | ❌ 미수집 |
| MEMORY.md | ❌ 미수집 |

## 후속 조치 필요

1. iMac → 4060 SSH 키 등록 (작가님 또는 물리 접근 필요)
2. Windows 환경 Claude Code 설정 경로 확인 필요:
   - `%APPDATA%\claude\settings.json`
   - `%USERPROFILE%\.claude\settings.json`
   - WSL 내부: `~/.claude/settings.json`
3. 키 등록 후 재수집 예정

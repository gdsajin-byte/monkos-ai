---
type: device_profile
id: "4060"
tailscale_ip: 100.118.31.62
tailscale_name: DESKTOP-70GOMAR
ssh_host: "4060"
os: Windows 11
owner: 작가님
location: "(미확인)"
primary_agents: [쌍아, 막내N]
claude_code_version: "2.1.52"
last_updated: 2026-05-13
---

# 4060 — Device Profile

## 시스템 정보

- **hostname**: DESKTOP-70GOMAR
- **OS**: Windows 11
- **Tailscale IP**: 100.118.31.62
- **SSH**: `ssh 4060` (User: smuse73) — 비밀번호 인증 (키 미등록)
- **Claude Code**: 2.1.52 (`C:\Users\smuse73\AppData\Roaming\npm\claude`)
- **역할**: GPU 서버 (AI Factory) — 모델 벤치마크, SDXL, LLM 추론

## 글로벌 설정 (`C:\Users\smuse73\.claude\settings.json`)

```json
{
  "permissions": {
    "allow": [
      "Bash(tasklist:*)",
      "Bash(git rebase:*)",
      "Bash(git pull:*)",
      "Read(//d//**)",
      "Read(//d/MONKOS_CHAT//**)",
      "Bash(taskkill //PID 62100 //F)",
      "Read(//d/MONKOS_CHAT/**)",
      "Bash(./monkos-chat.exe ...)",
      "Bash(chrome.exe ...)",
      "Bash(cp ... monkos-chat ...)"
    ],
    "additionalDirectories": ["\\tmp"]
  },
  "skipDangerousModePermissionPrompt": true
}
```

**특이사항**:
- model 미지정 (기본값 사용)
- MONKOS_CHAT 관련 권한 집중 (로컬 LLM 챗봇 실험)
- D: 드라이브 전체 Read 허용

## MCP 설정

- `mcp.json`: **없음**

## 프로젝트 설정

- 프로젝트 경로: `c:\Users\smuse73\developer\monk_project`
- `settings.local.json`: 미확인 (projects 디렉토리에 memory만 존재)

## MEMORY.md

- 위치: `C:\Users\smuse73\.claude\projects\c--Users-smuse73-developer-monk-project\memory\MEMORY.md`
- 규모: 충실 (에이전트 체계, 앱 구조, 벤치마크 이력, AI Factory 역할 상세)
- **4060 고유 정보**: SDXL 벤치마크 결과, LLM 분석, 5090 도입 근거 축적 전략

## 비교 분석 (vs iMac)

| 항목 | iMac | 4060 | 비고 |
|------|------|------|------|
| model | opus-4-6[1m] | 미지정 | **통일 필요** |
| CLI 버전 | 2.1.126 | 2.1.52 | **업데이트 필요** |
| 배포 권한 | ✅ | ❌ | 적절 (GPU 서버) |
| MCP | chrome-devtools | 없음 | 적절 |
| SSH 키 | — | 미등록 | 비밀번호 인증 중 |

## 통일 권장

| 우선순위 | 항목 |
|----------|------|
| P1 | model → `claude-opus-4-6[1m]` |
| P1 | CLI 업데이트 (2.1.52 → 최신) |
| P2 | Windows SSH authorized_keys 등록 (키 인증 전환) |

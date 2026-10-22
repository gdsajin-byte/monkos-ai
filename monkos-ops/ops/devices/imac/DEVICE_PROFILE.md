---
type: device_profile
id: iMac
tailscale_ip: 100.97.103.10
tailscale_ipv6: fd7a:115c:a1e0::1201:6718
tailscale_name: Jeong-Kyuui-iMac
ssh_host: "(로컬)"
os: macOS 13.x (Darwin 22.6.0, x86_64)
owner: 작가님
location: 사무실
primary_agents: [쌍아, 막내N, 민아]
claude_code_version: "2.1.126"
last_updated: 2026-05-13
---

# iMac — Device Profile

## 시스템 정보

- **hostname**: Jeong-Kyuui-iMac.local
- **OS**: Darwin 22.6.0 (macOS, Intel x86_64)
- **Tailscale IP**: 100.97.103.10 / fd7a:115c:a1e0::1201:6718
- **Claude Code**: 2.1.126
- **monk_project 경로**: `/Users/jeong-kyushin/developer/monk_project/`

## 글로벌 설정 — `~/.claude/settings.json`

```json
{
  "permissions": {
    "allow": [
      "Bash(git push:*)",
      "Bash(bash deploy.sh prod)",
      "Bash(bash scripts/mk-push.sh)",
      "Bash(scripts/mk-push.sh)",
      "Bash(bash monkos_AI/portal/deploy.sh prod)",
      "Bash(bash monkos_AI/studio/deploy.sh prod)",
      "Bash(curl -s http://localhost:*)",
      "Bash(curl -s https://monkos.ai/*)",
      "Bash(curl -s https://monk.kr/*)",
      "Bash(curl -s https://idphoto-kr.monkos.ai/*)",
      "Bash(curl -s https://idphoto-jp.monkos.ai/*)",
      "Bash(curl -s https://studio.monkos.ai/*)",
      "Bash(curl -s https://pt.monkos.ai/*)",
      "Bash(python3 -c \":*)",
      "Bash(python3 -c ' *)",
      "Bash(gcloud run:*)",
      "Bash(gcloud config *)",
      "Bash(gcloud services *)",
      "Bash(gcloud secrets *)",
      "Bash(gcloud auth *)",
      "Bash(gcloud beta:*)",
      "Bash(gcloud firestore:*)",
      "Bash(node -e \":*)",
      "Bash(scripts/tools/cdp.sh *)",
      "Bash(gh issue *)",
      "Read(//tmp/**)",
      "Read(//private/tmp/**)",
      "Read(//Users/jeong-kyushin/developer/monk_project/**)",
      "mcp__google-analytics__get_account_summaries",
      "mcp__google-analytics__run_report",
      "mcp__google-docs__applyParagraphStyle",
      "mcp__google-docs__applyTextStyle",
      "mcp__google-docs__readGoogleDoc",
      "mcp__google-docs__deleteRange",
      "mcp__google-docs__insertText"
    ],
    "additionalDirectories": [
      "/tmp",
      "/private/tmp",
      "/Users/jeong-kyushin/Desktop/강한소상공인",
      "/Users/jeong-kyushin/.claude"
    ]
  },
  "model": "claude-opus-4-6[1m]",
  "skipDangerousModePermissionPrompt": true
}
```

## 글로벌 MCP — `~/.claude/mcp.json`

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "chrome-devtools-mcp@latest",
        "--browserUrl",
        "http://127.0.0.1:9222"
      ]
    }
  }
}
```

## 프로젝트별 설정

### settings.local.json
없음

### 프로젝트별 MEMORY.md
- `/Users/jeong-kyushin/.claude/projects/-Users-jeong-kyushin-developer-monk-project/memory/MEMORY.md`

### memory/ 파일 목록
| 파일 | 비고 |
|------|------|
| `MEMORY.md` | 인덱스 |
| `feedback_model_compliance.md` | 피드백 |
| `project_origin_narrative.md` | 프로젝트 |

## 특이사항
- 메인 워크스테이션 — 전 에이전트 활성
- model 필드에 `[1m]` (1M 컨텍스트) 명시
- MCP: chrome-devtools (CDP 규칙 기반)
- 권한: 배포, gcloud, curl, CDP, Google Docs/Analytics MCP 허용
- additionalDirectories: 강한소상공인(외부 프로젝트), .claude(설정 접근)
- 헤드리스 민아 데일리 브리핑(10-22 신설): `scripts/mk-mina-brief.sh` + 전용 worktree `.claude/worktrees/mina-brief`(origin/main 분리 HEAD) + launchd `ai.monkos.mina-brief` 06:30(레포 사본 `monkos-ops/scripts/ai.monkos.mina-brief.plist`, **설치는 작가님 승인 후**). 지시문 정본 `monkos-ops/ops/templates/ROUTINE_iMac민아_로컬축.md`. 실측 로그 `~/.monkos/mina-brief/`. 전제 = wrangler·gh·gcloud 로그인(SECRET_INVENTORY §H-2)

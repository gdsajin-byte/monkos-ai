---
type: device_profile
id: M1
tailscale_ip: 100.76.80.99
tailscale_ipv6: fd7a:115c:a1e0::6d01:5097
tailscale_name: Macminiui-Macmini
ssh_host: m1
os: macOS 15.x (Darwin 25.2.0, ARM64 T8103)
owner: 작가님
location: 집
primary_agents: [쌍아, 막내N, 민아, 소넷이]
claude_code_version: "(미설치)"
last_updated: 2026-05-13
---

# M1 — Device Profile

## 시스템 정보

- **hostname**: Macminiui-Macmini.local
- **OS**: Darwin 25.2.0 (macOS, ARM64 M1 — T8103)
- **Tailscale IP**: 100.76.80.99 / fd7a:115c:a1e0::6d01:5097
- **SSH**: `ssh m1` (100.76.80.99, User: macmini)
- **Claude Code**: 미설치 (명령어 없음)
- **monk_project 경로**: `/Users/developer/monk_project/`

## 글로벌 설정 — `~/.claude/settings.json`

```json
{
  "permissions": {
    "allow": [
      "Bash(dig AAAA monkos.ai +short)",
      "Bash(grep -i toss echo \"---\")",
      "Read(//private/tmp/**)",
      "Read(//Users/developer/**)",
      "mcp__google-search-console__list_sites",
      "Read(//Users/macmini/.config/gcloud/**)"
    ]
  },
  "effortLevel": "high",
  "skipDangerousModePermissionPrompt": true,
  "model": "claude-opus-4-6"
}
```

## 글로벌 MCP — `~/.claude/mcp.json`
없음

## 프로젝트별 설정

### settings.local.json
없음

### 프로젝트별 MEMORY.md
- `/Users/macmini/.claude/projects/-Users-macmini/memory/MEMORY.md` (홈 프로젝트)
- `/Users/macmini/.claude/projects/-Users-developer-monk-project/memory/MEMORY.md` (monk_project)

### memory/ 파일 목록 (monk_project)
| 파일 | 비고 |
|------|------|
| `MEMORY.md` | 인덱스 |
| `project_agenda_file_architecture_workflow.md` | 프로젝트 |
| `monkos_philosophy.md` | 프로젝트 |
| `feedback_turn_logging.md` | 피드백 |
| `security_principle.md` | 보안 |
| `project_parallel_projects_vision.md` | 프로젝트 |
| `feedback_hold_judgment.md` | 피드백 |
| `feedback_rollback_is_coding.md` | 피드백 |
| `feedback_directive_system_purpose.md` | 피드백 |
| `ssanga_identity.md` | 에이전트 |
| `project_cdp_breakthrough_pattern.md` | 프로젝트 |
| `compacting_defense.md` | 운영 |
| `project_monkkr_status.md` | 프로젝트 |
| `reference_works_folder.md` | 참조 |
| `order_report_process.md` | 프로세스 |
| `feedback_rebase_head_direction.md` | 피드백 |
| `user_work_pattern.md` | 사용자 |
| `roadmap.md` | 로드맵 |
| `device_m1.md` | 디바이스 |
| `feedback_file_split_design.md` | 피드백 |
| `reference_cowork_outputs.md` | 참조 |
| `feedback_mina_identity.md` | 피드백 |
| `task_rules.md` | 운영 |
| `feedback_execution_vs_outcome.md` | 피드백 |
| `feedback_session_start_gitpull.md` | 피드백 |
| `feedback_session_close_push.md` | 피드백 |
| `refactoring_protocol.md` | 프로토콜 |

### memory/ 파일 목록 (홈 프로젝트)
| 파일 | 비고 |
|------|------|
| `MEMORY.md` | 인덱스 |
| `feedback_blue_links.md` | 피드백 |

## 특이사항
- Claude Code CLI 미설치 — VSCode 확장으로만 운용 중인 것으로 추정
- model: `claude-opus-4-6` (1M 컨텍스트 미지정)
- effortLevel: `high` (iMac에는 없는 필드)
- MCP 서버 미설정
- 권한: 최소한 — dig, grep, Read, GSC만 허용
- memory 파일 28개로 iMac(3개) 대비 훨씬 풍부 — M1이 주 운용 디바이스였던 이력 반영
- worktree 잔재 존재: `bold-euler`, `tender-engelbart`, `vigilant-bassi`
- 중첩 클론: `/Users/developer/monk_project/monk_project/` 존재

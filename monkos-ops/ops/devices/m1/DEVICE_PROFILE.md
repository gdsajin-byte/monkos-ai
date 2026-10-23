---
type: device_profile
id: M1
tailscale_ip: 100.76.80.99
tailscale_ipv6: fd7a:115c:a1e0::6d01:5097
tailscale_name: macmini-macmini  # 10-23 실측 교정 (구 기재 Macminiui-Macmini = 로컬 hostname 혼동)
ssh_host: m1
os: macOS 15.x (Darwin 25.2.0, ARM64 T8103)
owner: 작가님
location: 집
primary_agents: [쌍아, 막내N, 민아, 소넷이]
claude_code_version: "2.1.140"
last_updated: 2026-06-25
---

# M1 — Device Profile

## 시스템 정보

- **hostname**: Macminiui-Macmini.local
- **OS**: Darwin 25.2.0 (macOS, ARM64 M1 — T8103)
- **Tailscale IP**: 100.76.80.99 / fd7a:115c:a1e0::6d01:5097
- **SSH**: `ssh m1` (100.76.80.99, User: macmini)
- **Claude Code**: 2.1.140 (2026-05-13 설치)
- **monk_project 경로**: `/Users/developer/monk_project/` (정본 단일 — 아래 듀얼 레포 사고 참조)

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
- model: `claude-opus-4-6` (1M 컨텍스트 미지정 → 통일 필요)
- effortLevel: `high` (iMac에는 없는 필드)
- MCP 서버 미설정
- 권한: 최소한 — dig, grep, Read, GSC만 허용
- memory 파일 28개로 iMac(3개) 대비 훨씬 풍부 — M1이 주 운용 디바이스였던 이력 반영

## 듀얼 레포 사고 (해소 완료)
- **원인**: iMac/쌍아가 Tailscale SSH로 M1 접속하여 Apple 빌드 시, 정본(`/Users/developer/monk_project/`)을 사용하지 않고 `/Users/macmini/` 경로에 새 클론 생성. 이후 쌍아(VSCode)는 새 경로, 막내(iTerm)는 정본 경로를 바라보며 소통 단절.
- **발견**: 2026-06-23 M1/쌍아 세션 — 막내가 경로 혼동 원인 추적하여 듀얼 레포 구조 발견.
- **해소**: 작가님이 쌍아 작업본(`/Users/macmini/`) 삭제, 정본 `/Users/developer/monk_project/` 단일화 확정.
- **worktree 잔재**: `bold-euler`, `tender-engelbart`, `vigilant-bassi` — 삭제 여부 미확인.
- **교훈**: 원격 디바이스 접속 시 새 클론 생성 금지. 기존 정본 경로 사용 필수.

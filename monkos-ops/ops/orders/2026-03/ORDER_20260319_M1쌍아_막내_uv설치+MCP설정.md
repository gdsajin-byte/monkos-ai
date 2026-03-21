---
type: order
from: M1/쌍아
to: M1/막내
date: 2026-03-19
priority: normal
---

# ORDER_20260319 — uv 설치 + git MCP 설정

**[2026-03-19 M1/쌍아 → M1/막내]**

## Task 1: uv 설치

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
source ~/.zshrc
which uvx   # 경로 확인
```

## Task 2: Claude Desktop config 교체

파일 경로: `~/Library/Application Support/Claude/claude_desktop_config.json`

아래 내용으로 전체 교체:

```json
{
  "preferences": {
    "chromeExtension": {
      "pairedDeviceId": "31af1fa9-90f6-4661-a2fc-5b5e55c929ef",
      "pairedDeviceName": "내 M1 집"
    },
    "localAgentModeTrustedFolders": [
      "/Users/macmini/Desktop/works"
    ],
    "coworkScheduledTasksEnabled": true,
    "ccdScheduledTasksEnabled": true,
    "sidebarMode": "task",
    "coworkWebSearchEnabled": true
  },
  "mcpServers": {
    "git": {
      "command": "uvx",
      "args": ["mcp-server-git", "--repository", "/Users/developer/monk_project"]
    }
  }
}
```

## Task 3: Claude Desktop 재시작

```
Cmd+Q → 완전 종료 → 재시작
```

## 완료 조건

- [ ] `which uvx` 경로 출력 확인
- [ ] Claude Desktop 재시작 후 코웍이 새 대화에서 망치 아이콘 확인
- [ ] `git_log` 도구로 monk_project 최근 커밋 1건 조회 테스트

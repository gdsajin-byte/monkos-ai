---
type: order
date: 2026-05-13
from: iMac/쌍아
to: iMac/막내
status: 대기
subject: 전 디바이스 Claude Code 설정값 전수 수집
---

# 지시서: 전 디바이스 Claude Code 설정값 전수 수집

## 목적

디바이스별 `~/.claude/` 설정이 파편화되어 있어, 전 디바이스 설정을 수집하여 `monkos-ops/ops/devices/`에 정본화한다.

## 선행 작업: M1 SSH 등록

M1(macmini-macmini)의 SSH 호스트가 미등록 상태다. 먼저 등록한다.

```bash
# ~/.ssh/config에 추가
cat >> ~/.ssh/config << 'EOF'

Host m1
    HostName 100.76.80.99
    User macmini
    StrictHostKeyChecking no
EOF

# SSH 접속 테스트 (SSH 키 등록 완료 상태)
ssh m1 "echo 'M1 SSH OK' && hostname"
```

## 수집 대상 디바이스

| # | 디바이스 | 접근 방법 | 비고 |
|---|----------|----------|------|
| 1 | iMac | 로컬 | 이미 수집됨 — 정리만 |
| 2 | M1 | `ssh m1` (등록 후) | 온라인 |
| 3 | M2 | `ssh m2` | offline 83일 — 실패 시 기록 |
| 4 | 4060 | `ssh 4060` | Windows — 경로 다름 |

## 수집 항목 (디바이스당)

각 디바이스에서 아래를 수집하여 텍스트로 덤프한다.

### A. 시스템 정보
```bash
hostname && uname -a
tailscale ip 2>/dev/null || /Applications/Tailscale.app/Contents/MacOS/Tailscale ip 2>/dev/null
claude --version 2>/dev/null  # Claude Code 버전
```

### B. 글로벌 설정
```bash
cat ~/.claude/settings.json 2>/dev/null || echo "(없음)"
cat ~/.claude/mcp.json 2>/dev/null || echo "(없음)"
```

### C. 프로젝트별 설정
```bash
# 프로젝트별 settings.local.json (Git 미추적, 디바이스 고유)
find ~/.claude/projects -name 'settings.local.json' -type f 2>/dev/null | while read f; do
  echo "--- $f ---"
  cat "$f"
done

# 프로젝트별 MEMORY.md
find ~/.claude/projects -name 'MEMORY.md' -type f 2>/dev/null | while read f; do
  echo "--- $f ---"
  cat "$f"
done

# 프로젝트별 memory 파일 목록
find ~/.claude/projects -path '*/memory/*.md' -type f 2>/dev/null
```

### D. 프로젝트 공유 설정 (Git 추적 — 동일할 것이나 확인)
```bash
# monk_project가 클론되어 있는지, 경로가 어디인지
find ~ -maxdepth 4 -name 'CLAUDE.md' -path '*/monk_project/*' 2>/dev/null
```

### E. 4060 전용 (Windows)
Windows의 Claude Code 설정 경로는 다를 수 있다:
```powershell
# Windows 경로 후보
type %APPDATA%\claude\settings.json 2>nul
type %USERPROFILE%\.claude\settings.json 2>nul
# 또는 WSL 내부
cat ~/.claude/settings.json 2>/dev/null
```

## 산출물

### 폴더 구조 생성
```
monkos-ops/ops/devices/
├── README.md                     # 디바이스 일람표 (인덱스)
├── DEVICE_CHANGELOG.md           # 세팅 변경 로그 (append-only)
├── global/
│   └── GLOBAL_SETTINGS.md        # 전 디바이스 공통 설정 정리
├── imac/
│   └── DEVICE_PROFILE.md         # 수집 결과 + 프로필
├── m1/
│   └── DEVICE_PROFILE.md
├── m2/
│   └── DEVICE_PROFILE.md
└── w4060/
    └── DEVICE_PROFILE.md
```

### DEVICE_PROFILE.md 형식
```yaml
---
type: device_profile
id: {디바이스명}
tailscale_ip: {IP}
tailscale_name: {Tailscale 호스트명}
ssh_host: {SSH 호스트}
os: {macOS/Windows}
owner: {소유자}
location: {위치}
primary_agents: [{에이전트 목록}]
claude_code_version: {버전}
last_updated: 2026-05-13
---
```

본문에 수집된 설정값 전문을 기록한다.

### README.md (인덱스)
전 디바이스 요약 테이블 + 글로벌/로컬 설정 분기점 비교표.

### GLOBAL_SETTINGS.md
전 디바이스 공통으로 적용되어야 할 설정 기준선. 현재 iMac 기준.

## 작업 순서

1. `monkos-ops/ops/devices/` 폴더 구조 생성
2. iMac 데이터 정리 → `imac/DEVICE_PROFILE.md` 작성
3. M1 SSH 등록 시도 → 수집 → `m1/DEVICE_PROFILE.md`
4. 4060 SSH 수집 → `w4060/DEVICE_PROFILE.md`
5. M2 SSH 시도 → 실패 시 "offline" 기록 → `m2/DEVICE_PROFILE.md`
6. 비교 분석 → `global/GLOBAL_SETTINGS.md` + `README.md` 작성
7. `DEVICE_CHANGELOG.md` 초기화 (오늘 날짜로 첫 기록)

## ⚠️ 준수 조항

- **헌법 4조 1항**: SSH 비밀번호/키 생성·추측 금지. 접속 실패 시 보고.
- **헌법 4조 2항**: `rm -rf`, `git push --force` 금지.
- **ch7 3조**: 수집만 한다. 타 디바이스 설정을 변경하지 않는다.

## 완료 기준

- [ ] 4개 디바이스 프로필 작성 (접속 불가 시 사유 기록)
- [ ] 글로벌 vs 로컬 분기점 비교표 완성
- [ ] README.md 인덱스 완성
- [ ] DEVICE_CHANGELOG.md 초기 기록
- [ ] 커밋 + 푸시

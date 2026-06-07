---
type: device_profile
id: M2
tailscale_ip: 100.81.38.20
tailscale_name: kku-macmini-m2
ssh_host: m2
os: macOS Sequoia 15.7.4
owner: 꾸 (와이프)
location: 집
primary_agents: [쌍아, 코웍이]
claude_code_version: 2.1.50
last_updated: 2026-06-07
---

# M2 — Device Profile

## 시스템 정보

| 항목 | 값 |
|------|-----|
| 모델 | Mac mini (Mac14,3) |
| 칩 | Apple M2 |
| 메모리 | 16 GB |
| OS | macOS Sequoia 15.7.4 (24G517) |
| 호스트명 | KKU-MacMINI-M2ui-Macmini.local |
| 사용자 | kku |
| Tailscale IP | 100.81.38.20 |
| SSH | `ssh m2` (100.81.38.20, User: kku) |
| Claude Code | 2.1.50 |

## 개발 환경

| 도구 | 버전 |
|------|------|
| Node.js | v25.6.1 |
| npm | 11.9.0 |
| Python | 3.9.6 |
| Homebrew | 5.0.15 |

## Git 설정

| 항목 | 값 |
|------|-----|
| remote | git@github.com:gdsajin-byte/monk_project.git |
| branch | main |
| user.name | M2/코웍이 |
| user.email | gdsajin@gmail.com |

## Claude Code 설정

| 항목 | 값 |
|------|-----|
| model | sonnet |
| allow | Bash(*), Read, Write, Edit |
| deny | rm -rf, git push --force, git reset --hard, git clean -f, git checkout -- |
| 추가 디렉토리 | /Users/kku/Desktop/works |
| Rules | 9개 |
| Skills | 14개 |

## SSH 연동 (2026-06-07 완료)

- iMac 공개키 등록 완료 (`jeong-kyushin@monk.kr`)
- iMac에서 `ssh m2`로 무인증 접속 확인

## 수집 상태

| 항목 | 상태 |
|------|------|
| 시스템 정보 | ✅ 완료 (2026-06-07) |
| 글로벌 설정 | ✅ 완료 (2026-06-07) |
| 글로벌 MCP | ❌ 미수집 |
| 프로젝트 설정 | ✅ 완료 (2026-06-07) |
| MEMORY.md | ❌ 미수집 |

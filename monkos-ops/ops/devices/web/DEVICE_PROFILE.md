---
type: device_profile
date: 2026-06-11
device: 웹
agent: 민아 (웹 민아)
status: active
---

# DEVICE_PROFILE — 웹 (원격 컨테이너)

> **[2026-06-11 12:04 KST] 웹/민아 → 작가님** 디바이스 프로필 신설 (규정 위계 — 에이전트 자율 + 보고)

## 환경 실측 (2026-06-11)

| 항목 | 값 |
|------|-----|
| 실행 형태 | claude.ai Code 원격 컨테이너 (세션마다 새 컨테이너, 리포 fresh clone) |
| 영속성 | **휘발** — 커밋·푸시 안 된 산출물은 컨테이너 회수 시 소멸 |
| 역할 판별 | 시스템 프롬프트 `Claude Agent SDK` → 민아 (ch1 5조 정합 확인) |
| 자동 로딩 | CLAUDE.md + `.claude/rules/` 9종 전문 (매 세션) |
| 메모리 파일 | 서버 측 **형성 안 됨** (휘발 환경) → 본 디렉토리 `MEMORY.md`가 대체 정본 |
| 시크릿 | **등록 금지** (환경변수 평문 노출 사양) — 키 필요 작업은 GH Actions/로컬 위임 |
| 네트워크 | allowlist 제한 (MINA_Brief 환경 기준: 자사 도메인·구글 API·bizinfo 등) |
| GitHub | MCP 경유 (gh CLI 없음), 레포 스코프 제한, **납품 = PR 경유** |
| MCP 커넥터 | GitHub·Gmail·Calendar·Drive·Figma·Canva·GSC·cloudflare (플랫폼 제공, 접속 변동 있음) |

## 소통 원칙 (작가님 확정 06-11)

- **매턴 세션로그 어펜드 + 커밋·푸시** — 로컬 팀원 가시성 확보. 푸시가 곧 기억 보존.
- 브랜치 산출물은 main 머지 전 로컬에 안 보임 → 중요 산출 시 PR 조기 머지 요청 or 브랜치명 전달.
- 보고서·제안서는 규격 준수: 네이밍 패턴 + 월별 폴더 + YAML + 수발신 헤더.

## 정기 루틴

- "민아 일일 브리핑" (매일 07:00 KST, Routines) — 정본 지시문: `ops/templates/ROUTINE_웹민아_데일리E2E.md`

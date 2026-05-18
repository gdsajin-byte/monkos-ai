---
type: device_global
subject: 전 디바이스 공통 설정 기준선
baseline_device: iMac
last_updated: 2026-05-13
---

# Global Settings — 전 디바이스 공통 설정 기준선

## 현재 기준: iMac (2026-05-13)

iMac이 가장 완비된 설정을 보유하며, 이를 기준선으로 삼는다.

## 글로벌 vs 로컬 분기점 비교표

### settings.json 비교

| 필드 | iMac | M1 | 4060 | M2 | 비고 |
|------|------|-----|------|-----|------|
| **model** | `claude-opus-4-6[1m]` | `claude-opus-4-6` | 미확인 | 미확인 | iMac만 1M 컨텍스트 명시 |
| **effortLevel** | (미설정) | `high` | 미확인 | 미확인 | M1만 설정 |
| **skipDangerousMode** | `true` | `true` | 미확인 | 미확인 | 동일 |
| **배포 권한** | ✅ deploy.sh 다수 | ❌ 없음 | 미확인 | 미확인 | iMac 전용 |
| **gcloud 권한** | ✅ run/config/secrets/auth/beta/firestore | ❌ 없음 | 미확인 | 미확인 | iMac 전용 |
| **curl 권한** | ✅ localhost + 전 서비스 도메인 | ❌ 없음 | 미확인 | 미확인 | iMac 전용 |
| **CDP 권한** | ✅ `scripts/tools/cdp.sh` | ❌ 없음 | 미확인 | 미확인 | iMac 전용 |
| **python3 권한** | ✅ | ❌ | 미확인 | 미확인 | iMac 전용 |
| **node 권한** | ✅ | ❌ | 미확인 | 미확인 | iMac 전용 |
| **git push 권한** | ✅ | ❌ | 미확인 | 미확인 | iMac 전용 |
| **gh issue 권한** | ✅ | ❌ | 미확인 | 미확인 | iMac 전용 |
| **Google MCP** | Analytics + Docs | GSC만 | 미확인 | 미확인 | 분기 |
| **Read 권한** | `/tmp`, `/private/tmp`, monk_project | `/private/tmp`, `/Users/developer`, gcloud config | 미확인 | 미확인 | 분기 |

### mcp.json 비교

| MCP 서버 | iMac | M1 | 4060 | M2 |
|----------|------|-----|------|-----|
| chrome-devtools | ✅ | ❌ | 미확인 | 미확인 |

### memory 규모 비교

| 항목 | iMac | M1 | 4060 | M2 |
|------|------|-----|------|-----|
| memory 파일 수 | 3개 | 28개 | 미확인 | 미확인 |
| MEMORY.md 줄 수 | ~120줄 | ~150줄 | 미확인 | 미확인 |

## 분기 원인 분석

### iMac 고유 (사무실 메인)
- 배포 권한 집중 — Cloud Run, GCS 등 프로덕션 인프라 접근
- CDP 도구 활성 — 브라우저 자동화
- Google Docs/Analytics MCP — 콘텐츠·분석 워크플로우
- 1M 컨텍스트 — 대규모 작업용

### M1 고유 (집 워크스테이션)
- effortLevel: high — iMac에 미설정
- 권한 최소화 — 배포·인프라 접근 없음 (야간 설계/지시서 중심)
- memory 풍부 — 오래 사용된 주 디바이스 이력
- Claude Code CLI 미설치 — VSCode 확장만 사용

## 통일 권장사항

| 우선순위 | 항목 | 내용 |
|----------|------|------|
| P1 | M1 Claude Code CLI 설치 | 현재 미설치 상태. 막내 운용 시 필요 |
| P1 | M1 model → `claude-opus-4-6[1m]` | 1M 컨텍스트 통일 |
| P2 | M1 기본 권한 추가 | git push, mk-push.sh, curl localhost 등 |
| P2 | 4060 SSH 키 등록 | 현재 접속 불가 — 설정 수집 차단 |
| P3 | M2 온라인 전환 후 수집 | 83일+ offline |
| P3 | iMac effortLevel 설정 여부 검토 | M1에만 있음 — 의도적 분기인지 확인 |

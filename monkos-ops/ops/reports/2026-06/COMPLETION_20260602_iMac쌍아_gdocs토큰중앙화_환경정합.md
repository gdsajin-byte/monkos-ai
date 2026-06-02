---
type: completion
date: 2026-06-02
device: iMac
agent: 쌍아
portfolio: PF_AUTOPILOT
order: ORDER_20260602_M1쌍아_iMac쌍아_gdocs토큰중앙화_디바이스환경정합.md
status: 마감
---

# COMPLETION — gdocs 토큰 중앙화 + iMac↔M1 환경 정합 (광역오더 #7)

**[2026-06-02 15:28 KST] iMac/쌍아 → 작가님**

> 광역오더 #7 수행. **A(토큰 중앙화) 완료·검증**, **B(환경 정합) iMac측 완료** — M1 실측 비교는 작가님 M1 직접 pull로 이관.

---

## ✅ A. gdocs 토큰 중앙화 — 완료·검증

| 단계 | 내용 | 결과 |
|------|------|------|
| A1 | GCP/GitHub gdocs 시크릿 현황 | GCP에 CLIENT_ID/SECRET 기존 존재, TOKEN 미등록 확인 |
| A2 | token.json → GCP `MCP_GDOCS_TOKEN` | `--data-file` 경유 등록(v1 enabled). **값 무노출** |
| A3 | GitHub Secrets 3종 | CLIENT_ID/SECRET/TOKEN. **stdin 파이프**로 명령행 노출 0 |
| A4 | `gdocs_mcp.sh` 자동복원 | token.json 부재 시 GCP에서 mktemp→검증(-s)→`mv`→chmod 600 |
| A5 | 검증 | 삭제→복원 **바이트 단위 동일**(289B), 권한 `-rw-------` ✅ |

**효과**: M1·타 디바이스는 `git pull`로 수정된 `gdocs_mcp.sh`를 받으면 **무인증으로 gdocs MCP 동작**. 재인증 마찰 소멸.

### 보안 준수 (헌법 4조)
- 토큰·시크릿 값 **일절 출력/로그/커밋 안 함**. GCP는 `--data-file`, GitHub은 stdin 파이프.
- token.json 권한 600 강제. `.gitignore` 대상(커밋 안 됨).

---

## ✅ B. iMac↔M1 환경 정합 — iMac측 완료

### B1. iMac .env 실측 (값 비노출 변수명 대조)
- **유니크 34개** (35행 중 `CF_WORKERS_AI_TOKEN` 1행 중복).
- 인벤토리(33) 대비 갭:
  - **+CHAT_API_KEY, +CHAT_WORKERS_URL** — §F deploy.sh엔 있었으나 §A 목록 누락 → 편입.
  - **N8N_API_KEY** — iMac .env엔 **부재**(4060 Docker 전용 추정). 위치 재확인 필요.
  - **CF_WORKERS_AI_TOKEN** — .env에 2행 중복 기재(정리 대기, .env 수정=승인 필요).

### B3. SECRET_INVENTORY.md 현행화
- §A 34개 재집계, **§J GCP Secret Manager 신설**(MCP_GDOCS 3종), §3 GitHub Secrets 3종 추가.
- date 2026-05-11 → 2026-06-02 갱신.

### B2. M1 실측 비교 — ⏳ 작가님 직접 pull로 이관
- `ssh m1`(100.76.80.99:22) **타임아웃** — M1 원격 로그인/Tailscale SSH 미허용.
- 작가님이 M1에서 직접 `git pull` 후 gdocs 무인증 동작 + .env 정합 확인 예정.

---

## ⏳ 미결 (작가님 결정 대기)
1. **.env 동기화 표준 방안** — 하이브리드 점진(scp+GCP) / GCP 일원화 / scp 정본배포 중 택1.
2. **CF_WORKERS_AI_TOKEN 중복 라인 정리** — .env 수정(헌법 4조)이라 승인 필요.
3. **N8N_API_KEY 위치** — 4060 전용인지 확인.

---

## 📁 산출물
- `scripts/tools/gdocs_mcp.sh` (자동복원 로직)
- `monkos-ops/ops/SECRET_INVENTORY.md` (현행화)
- GCP Secret Manager `MCP_GDOCS_TOKEN` (신규)
- GitHub Secrets `MCP_GDOCS_CLIENT_ID/SECRET/TOKEN` (신규)
- 본 COMPLETION + PF_AUTOPILOT 히스토리 2행

## 🔀 연계
- M1측 `ORDER_20260602_M1쌍아_막내2_gdocsMCP_GitHub키체계_편입.md`는 본 오더로 흡수·상위화. M1 막내2/작가님은 pull 후 검증만.

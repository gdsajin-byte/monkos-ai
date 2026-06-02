---
type: order
date: 2026-06-02
device: M1
agent: 쌍아
from: M1/쌍아
to: 막내2 (시크릿 컨텍스트 보유)
portfolio: PF_AUTOPILOT
status: 발행
order_class: 광역오더(Mission Order) #6 — 시크릿 체계 정합
---

# ORDER — gdocs MCP를 GitHub 키 관리 체계로 편입

**[2026-06-02 15:06 KST] M1/쌍아 → 막내2**

> **정책 = 모든 키 GitHub 중앙 관리**(SECRET_INVENTORY.md §2: ".env 4대 디바이스 수동 동기화 → GitHub Secrets로 개선"). 그런데 **gdocs MCP만 이 체계 밖**이다 — GCP Secret Manager 참조 + 토큰 디바이스 로컬 + 인벤토리 미등록. 그래서 디바이스마다 인증 마찰(M1 재인증 문제의 뿌리). 이걸 다른 키와 동일 체계로 편입한다.

---

## 1. 선행 — 기존 키 흐름 파악 (묻지 말고 기록·코드로)
- **SECRET_INVENTORY.md §1·§3·§5** + 기존 키(예: HF_TOKEN, GCP_SA_KEY)가 **GitHub Secrets ↔ 로컬/막내 세션으로 동기화되는 실제 방식**(동기화 스크립트 / .env 생성 / gh CLI pull 등)을 코드에서 확정.
- gdocs는 **그 동일 통로**에 얹는다. 새 방식 만들지 말 것.

## 2. gdocs 토큰 확보
- 정본 토큰 = **iMac의 `~/.config/mcp-google-docs/token.json`** (이미 인증됨). 없으면 iMac에서 gdocs MCP 1회 인증으로 생성.
- ⚠️ refresh token = 민감. **값 노출/로그/커밋 금지.**

## 3. GitHub Secrets 등록
- `MCP_GDOCS_CLIENT_ID`, `MCP_GDOCS_CLIENT_SECRET` (GCP Secret Manager에 있는 값) + `MCP_GDOCS_TOKEN`(iMac token.json) → **GitHub Secrets로 등록**(기존 키와 동일 repo·방식).
- `gh secret set` 사용. 값은 파이프/파일 경유(평문 인자 금지).

## 4. gdocs_mcp.sh 수정
- 현재 `gcloud secrets versions access`(GCP Secret Manager) 참조 → **GitHub 통로(§1에서 파악한 동일 방식)로 전환.**
- 토큰 없으면 GitHub 통로에서 받아 `~/.config/mcp-google-docs/token.json` 복원하도록.

## 5. 인벤토리 갱신 (누락 보정)
- **SECRET_INVENTORY.md §3에 gdocs 3개 항목 추가** + §1 해당 위치 반영. (4/19 MCP 추가가 5/11 인벤토리에 누락된 갭)

## 6. 검증
- **M1에서 token.json 삭제 상태 → gdocs MCP 호출 → 자동 복원되어 인증 없이 동작** 확인.
- 다른 디바이스도 동일 보장.

---

## 7. 범위 경계 (보안 민감 — 헌법 4조)
- 토큰·secret **값 노출/로그/git 커밋 금지.** `token.json`은 `.gitignore` 확인.
- 기존 키 동기화 방식 **준수**(새 통로 발명 금지).
- 디바이스 동기화·GitHub Secrets 작업은 작가님 인프라 — 신중히, 값 다룰 때 마스킹.

## 8. 가드레일
- 시크릿 값 비노출(헌법 4조 1항). 파괴적 명령 금지. 매 턴 `date`.

## 9. 체크포인트 (non-blocking)
1. **기존 키 흐름 파악 결과 + 편입 계획** 보고.
2. 등록 + gdocs_mcp.sh 수정 + 인벤토리 갱신.
3. **M1 자동 복원 검증** → COMPLETION.
4. 에러 3회 → `/에스컬레이션`.

## 10. PF 갱신
- `PF_AUTOPILOT/README.md`(시크릿 통합) 히스토리 어펜드 + SECRET_INVENTORY 갱신.

---

**끝. 핵심: gdocs만 빠져있던 갭을 메워 "모든 키 GitHub" 정책에 정합시킨다. 기존 키 흐름을 그대로 따르고, 새 방식 만들지 마라. 토큰 값은 절대 노출하지 마라.**

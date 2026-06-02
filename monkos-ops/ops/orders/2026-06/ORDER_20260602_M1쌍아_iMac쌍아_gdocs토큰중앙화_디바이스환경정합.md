---
type: order
date: 2026-06-02
device: M1
agent: 쌍아
from: M1/쌍아
to: iMac/쌍아
portfolio: PF_AUTOPILOT
status: 발행
order_class: 광역오더(Mission Order) #7 — 디바이스 환경 정합 (크로스 디바이스)
---

# ORDER — gdocs 토큰 중앙화 + iMac↔M1 환경 정합

**[2026-06-02 15:14 KST] M1/쌍아 → iMac/쌍아**

> M1에서 진단한 결과를 iMac으로 토스한다. **정본 토큰·정본 .env가 iMac에 있고**(M1은 누락), iMac은 git·Tailscale로 연결돼 지원 가능하다. 이참에 iMac↔M1 틀어진 것을 함께 정리한다.

---

## 배경 (M1 진단 요약)

1. **gdocs MCP 인증 마찰**: `~/.config/mcp-google-docs/token.json`이 **iMac엔 있고 M1엔 없음** → M1에서 매번 재인증. 토큰이 어디에도 중앙화 안 됨.
2. **GitHub Secrets = write-only**: 로컬 도구가 값을 못 읽음(Actions 전용). **로컬 런타임 키는 GCP Secret Manager가 표준**(GEMINI·ELEVENLABS·KIMI도 그럼).
3. **.env 디바이스 불일치**: M1 `monkos_AI/.env` = **13개**인데 인벤토리 정본 = **33개** → **M1에 ~20개 누락.** 수동 동기화의 폐해.

---

## A. gdocs 토큰 중앙화

1. iMac `~/.config/mcp-google-docs/token.json` **존재 확인** (없으면 iMac에서 gdocs MCP 1회 인증으로 생성).
2. 그 토큰을 **GCP Secret Manager에 `MCP_GDOCS_TOKEN`으로 등록** (값은 `--data-file` 경유, 평문 인자·로그 금지).
3. **GitHub Secrets**에도 `MCP_GDOCS_CLIENT_ID/SECRET/TOKEN` 등록 (정본 카탈로그 + 향후 Actions 확장).
4. `scripts/tools/gdocs_mcp.sh` 수정: `token.json` 없으면 **GCP Secret Manager에서 `MCP_GDOCS_TOKEN`을 받아 `~/.config/mcp-google-docs/token.json` 복원** → MCP 실행. (CLIENT_ID/SECRET는 기존 GCP 참조 유지)
5. **검증**: M1에서 token.json 없는 상태로 gdocs 호출 → 자동 복원되어 **인증 없이 동작** (M1은 git pull로 수정된 스크립트 받음).

## B. iMac↔M1 환경 정합 (틀어진 것 정리)

1. **.env 차이 전수 식별**: iMac `monkos_AI/.env`(정본 33개) vs M1(13개) → **M1 누락 항목 목록화** (변수명만, 값 노출 금지).
2. **다른 틀어짐 점검**: 양 디바이스의 `.env`·로컬 설정·도구 토큰 중 불일치 항목.
3. **동기화 방안 확정**: 로컬 런타임 키는 GCP Secret Manager 중심으로 일원화할지, .env 정본을 안전 채널(Tailscale scp 등)로 배포할지 설계.
4. **SECRET_INVENTORY.md 전면 재집계**: M1 실측 갭(-20), GCP Secret Manager 5개 미등록, API키 -3, GitHub Secrets +2 반영해 **현행화**.

## C. 범위 경계 (보안 민감 — 헌법 4조)
- 토큰·secret **값 노출/로그/git 커밋 금지.** `token.json`·`.env`는 `.gitignore` 확인.
- `.env`·`deploy.sh`·secret 변경은 신중히. 값 다룰 때 마스킹.
- 파괴적 명령 금지. 매 턴 `date`.

## D. 체크포인트 (non-blocking)
1. **A 완료**(토큰 중앙화 + 스크립트 수정) 보고.
2. **B 정리**(불일치 목록 + 동기화 방안 + 인벤토리 현행화) 보고.
3. **C 검증**(M1 자동 복원 + .env 정합) → COMPLETION.
4. 에러 3회 → `/에스컬레이션`.

## E. PF 갱신
- `PF_AUTOPILOT/README.md` 히스토리 어펜드 + `SECRET_INVENTORY.md` 현행화.

---

> **연계**: M1측 동일 작업 지시서 `ORDER_20260602_M1쌍아_막내2_gdocsMCP_GitHub키체계_편입.md`는 본 오더로 **흡수·상위화**(iMac 정본 토큰이 선행이므로). M1 막내2는 본 오더 완료 후 M1 검증만 수행.

**끝. iMac 정본 토큰/.env를 기준으로 중앙화하고, M1과 틀어진 것을 이참에 다 맞춘다. 토큰 값은 절대 노출하지 마라.**

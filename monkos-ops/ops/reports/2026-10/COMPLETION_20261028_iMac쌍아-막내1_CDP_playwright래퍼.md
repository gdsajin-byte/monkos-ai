---
type: completion
date: 2026-10-28
device: iMac
agent: 쌍아-막내1
status: 마감
portfolio: PF_CDP
---

# COMPLETION — playwright MCP 래퍼 자동 기동 + 버전 고정 (합본)

**[2026-10-28 11:54 KST]** iMac/쌍아-막내1 → 쌍아·작가님

출처
- 1차: `ORDER_20261028_iMac쌍아_막내1_CDP_playwright래퍼_9222자동기동.md`(작가님 10:57 "1", 11:38 "너가 막내 띄워서 진행해")
- 2차: 쌍아 세션의 후속 지시 메시지(작가님 11:53 "권장안대로 해" — 쌍아 경유 전달, 세션 간 메시지라 출처만 기록)

## 변경

| 파일 | 내용 |
|---|---|
| `scripts/tools/playwright_mcp.sh` | 지정 포트(기본 9222)가 미응답이면 같은 포트로 `cdp_setup.sh start` 실행(출력 stderr) → 0.5s×20 대기 → 실패 시 `❌ playwright_mcp: CDP {포트} 기동 실패 — 로그 …` + exit 1. 대체 포트 연결 없음. `@playwright/mcp@latest` → **`@0.0.83` 고정** + 올리는 방법 주석 |
| `scripts/tools/cdp_setup.sh` | `start`: `nohup … >logs/{포트}.log 2>&1 </dev/null &`로 호출자 파이프 분리. 실행 파일 부재 시 `❌` + exit 1. `CDP_CHROME_APP` 재정의 |

## 스모크 (9229 대체, 9222·9225·9226·9227 무접촉)

| 항목 | 결과 |
|---|---|
| 파이프 대조 `start 9229 \| tail -3` | 구본: 15s 감시까지 미반환 / 수정본: 1s 반환 |
| 양성 A (정지 → 래퍼 MCP initialize) | 9229 자동 기동 + initialize 응답 |
| stdout 청결 | stdout 187B, 첫 바이트 `{`, 비-JSON 줄 0 (stdout·stderr 파일 분리 수집) |
| 양성 B (`CDP_PORT=9222 --help`) | exit 0, stderr 0B, 9222 프로세스 9→9, 리스너 PID 79007 불변 |
| 음성 (`CDP_CHROME_APP=/nonexistent/chrome`) | `❌ … 기동 실패`, exit 1, stdout 0B |
| 버전 고정 | `npm view` 최신 = 0.0.83 = 기존 npx 캐시(정상 동작 중이던 @latest) 버전. 고정 후 npx가 `@0.0.83`을 별도 캐시에 설치, initialize 정상 |

- `serverInfo.version`은 `1.64.0-alpha-1790635538000`이었습니다. 이 값은 MCP 패키지 버전이 아니라 내장 playwright 코어 버전입니다. 고정 전(@latest) 응답과 같은 값이라 같은 빌드로 판정했습니다. 패키지 버전은 npx 캐시의 `package.json`(0.0.83)으로 대조했습니다.
- 정리: 9229 정지. 11:54 실측 리스너는 9222=79007, 9225=83394, 9226=83393, 9227=23456로 전부 유지됐습니다.

## 미결

- VSCode 실세션에서 9222 정지 → Reconnect는 작가님 확인 대기입니다(9222 사용 중).
- `references.md` 도구 맵 1줄 초안(쌍아 소관, 파일은 수정하지 않음):
  > **10-28 playwright 래퍼 자동 기동·버전 고정**(쌍아-막내1): `playwright_mcp.sh`가 지정 포트 미응답 시 같은 포트로 `cdp_setup.sh start` 실행(출력 stderr, ~10s). 대체 포트 연결 금지. `@playwright/mcp@0.0.83` 고정. `start`는 크롬 출력을 `logs/{포트}.log`로 분리해 파이프 무한 대기 해소. 스모크(9229): 자동 기동·stdout 전부 JSON·음성 exit 1 / 파이프 15s+→1s. 실패 가시화 `❌ playwright_mcp:`

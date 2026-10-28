---
type: order
date: 2026-10-28
from: iMac/쌍아
to: iMac/막내1
subject: playwright MCP 래퍼 — 9222 부재 시 디버그 크롬 자동 기동 + cdp_setup.sh start 무한 대기 수정
status: 대기
portfolio: PF_CDP
---

# ORDER — playwright 래퍼 9222 자동 기동

**[2026-10-28 10:57 KST]** iMac/쌍아 → iMac/막내1

출처: 작가님 10:57 채팅 "1"(쌍아 10:56 제시안 1번 — 래퍼 보강 — 선택). 범위 승인 = 본 지시서 §2·§3.

## 1. 배경

- 10-28 10:53 VSCode 세션에서 playwright MCP가 반복적으로 `Connection closed / Failed`가 됐다.
- 원인(실측): [playwright_mcp.sh](../../../../scripts/tools/playwright_mcp.sh)가 `localhost:9222/json/version`만 조회한다. 9222에 디버그 크롬이 없으면 `exit 1`로 끝나고, UI에는 사유 없이 "Connection closed"만 뜬다. 당시 떠 있던 디버그 크롬은 9227(배당표 밖, 10-27 09:11 기동) 하나뿐이었다.
- 쌍아가 `cdp_setup.sh start 9222`로 수동 기동한 뒤 Reconnect하자 정상화됐다. 이 수동 조치가 필요 없도록 래퍼를 고친다.
- 부수 결함: `cdp_setup.sh start`를 파이프(`| tail`)로 호출하면 끝나지 않는다. 120초 타임아웃까지 걸렸다(실측). 크롬을 `&`로 띄우면서 stdout·stderr를 상속하므로, 파이프가 EOF를 받지 못하는 것으로 추정한다.

## 2. 산출물

| 파일 | 변경 |
|------|------|
| `scripts/tools/playwright_mcp.sh` | 9222 미응답 시 `cdp_setup.sh start $PORT` 호출 → 응답 대기(최대 ~10s) → 연결. 실패 시 명시 에러 + exit 1 |
| `scripts/tools/cdp_setup.sh` | `start`의 크롬 기동 시 stdout/stderr를 로그 파일로 분리(예: `$CDP_CONFIG_DIR/logs/$PORT.log`) + 호출자 파이프에서 분리 |

## 3. 상세 설계

1. **다른 포트로 대체 연결하지 않는다.** 9223~9225·9231 등은 배당표상 다른 주체의 브라우저다. 빌려 붙으면 탭·세션이 충돌한다. 9222(쌍아/민아 기본)가 없으면 **9222를 새로 띄운다**. `CDP_PORT` 환경변수 재정의는 지금처럼 유지한다.
2. **MCP stdio 오염 금지(핵심).** 래퍼의 stdout은 MCP 프로토콜 채널이다. 자동 기동 경로에서 `cdp_setup.sh`의 출력(✅ 메시지 등)과 크롬 출력이 **stdout으로 한 바이트도 나가면 안 된다.** 전부 stderr 또는 로그 파일로 보낸다(`>&2` 또는 `>/dev/null`).
3. **실패 가시화.** 기동 후에도 미응답이면 stderr에 `❌ playwright_mcp: CDP ${PORT} 기동 실패 — 로그 {경로}`를 남기고 exit 1. 무음 강등 금지(references.md 도구 3요건).
4. **cdp_setup.sh start 수정.** 크롬을 `nohup … >"$LOG" 2>&1 &`(또는 동등 방식)로 띄워 호출자의 파이프를 잡지 않게 한다. 기존 출력 문구·exit 코드·PID 파일 동작은 유지한다.
5. 프로필 디렉터리(`~/.config/chrome-cdp/profile-9222`)는 기존 것을 재사용한다. 삭제·초기화하지 않는다.

## 4. ⚠️ 준수 조항

- 헌법 4조 1항 — 비밀정보 생성·추측 금지(본 작업에는 해당 없음, 로그에 토큰류 기록 금지).
- 헌법 4조 2항 — `rm -rf`·`git reset --hard` 금지. 기존 크롬 프로세스(특히 **9227**과 작가님 일반 크롬)를 kill하지 않는다.
- **🔴 9222 정지·재시작 금지 (11:38 추가)** — 9222 크롬에는 작가님이 전자소송에 로그인해 두었고 막내2가 기록 열람 중이다. 끄면 로그인 세션이 날아간다. 스모크는 **빈 포트로 대체**한다: 양성 A·음성·10초 반환 검사는 `CDP_PORT=9229`(배당표 밖 빈 포트, 착수 전 미사용 실측)로 수행하고, 끝나면 `cdp_setup.sh stop 9229`로 정리한다. 양성 B만 9222(이미 떠 있음 → 새로 띄우지 않음)로 확인한다. 아래 완료 기준의 "9222 정지" 문구는 전부 9229로 읽는다. 실세션 Reconnect 확인은 작가님 확인 대기로 남긴다.
- 헌법 3조 1항 — 보고·로그 타임스탬프는 `date` 실측.
- 헌법 3조 2항 — 완료 보고(✅❌💡⏳📁🔀) + 세션 로그 + PF_CDP 히스토리 갱신.
- `.mcp.json`은 수정하지 않는다(필요 시 보고만).

## 5. 완료 기준 (스모크)

- [ ] **양성 A**: 9222 정지 상태에서 `bash scripts/tools/playwright_mcp.sh --help`(또는 동등한 단발 실행) → 9222 자동 기동 확인(`curl /json/version` 응답)
- [ ] **양성 B**: 9222가 이미 떠 있을 때 → 새로 띄우지 않고 그대로 연결(크롬 프로세스 수 불변)
- [ ] **stdout 청결**: 자동 기동 경로에서 래퍼 stdout에 MCP 이외 바이트 0 — `playwright_mcp.sh … 2>/dev/null | head -c 200` 등으로 확인 방법·결과를 기재
- [ ] **음성**: Chrome 경로를 일시적으로 무효화하는 등 기동 불가 상황(환경변수 재정의 수단이 없으면 `CDP_PORT`를 권한 없는 포트로 지정하는 식의 대조군) → `❌ playwright_mcp:` + exit≠0
- [ ] `bash scripts/tools/cdp_setup.sh start 9222 | tail -3`가 **10초 안에 반환**된다(수정 전 120s 타임아웃 재현과 대조)
- [ ] 9227 프로세스 생존 확인(건드리지 않았음)
- [ ] 실세션 확인: VSCode에서 9222 정지 → Reconnect → 연결 성공(작가님 확인 필요 시 보고에 "작가님 확인 대기"로 명기)
- [ ] `references.md` 도구 맵의 `cdp.sh + cdp_utils.py` 행에 1줄 추가(자동 기동·스모크 결과) — `.claude/rules` 수정은 쌍아 소관이므로 **문구 초안만 보고에 첨부**, 파일은 수정하지 않는다

## 6. 커밋 메시지

```
[fix] playwright MCP 래퍼 9222 자동 기동 + cdp_setup start 파이프 무한 대기 수정
```

push 후 `git fetch && git log origin/main -1`로 원격 SHA 대조값을 보고에 기재.

---
type: order
from: iMac/쌍아
to: iMac/막내4
date: 2026-04-05
subject: CDP 캡처 재시도 — 포트 9223 분리
status: 대기
priority: high
---

[2026-04-05 13:10 KST] iMac/쌍아 → iMac/막내4

# CDP 캡처 재시도 — 포트 9223 분리

## 배경

Playwright MCP 스월링 원인 추정: 포트 9222를 민아+작가님이 점유 중인 상태에서 동시 접속 → 브라우저 레벨 WebSocket 충돌.

## 해결: 포트 9223에 별도 크롬 인스턴스 기동

```bash
# 1. 9223 포트에 새 디버그 크롬 시작
scripts/tools/cdp_setup.sh start 9223

# 2. 이후 모든 CDP 명령에 포트 명시
CDP_PORT=9223 scripts/tools/cdp.sh tabs
CDP_PORT=9223 scripts/tools/cdp.sh navigate "https://monkos.ai" 0
CDP_PORT=9223 scripts/tools/cdp.sh screenshot /tmp/test_9223.png 0
```

## 작업 — 미완료 항목 재시도

### 캡처 2: Playwright MCP 접근성 트리 (2장)

포트 9223의 크롬에 Playwright MCP 연결:
```bash
CDP_PORT=9223 npx @playwright/mcp@latest --cdp-endpoint "$(curl -s http://localhost:9223/json/version | python3 -c "import sys,json; print(json.load(sys.stdin)['webSocketDebuggerUrl'])")"
```

또는 Playwright가 안 되면 **CDP로 접근성 트리 대체 캡처**:
```bash
# CDP로 접근성 트리 가져오기
CDP_PORT=9223 scripts/tools/cdp.sh eval "
  const tree = await new Promise(r => {
    chrome.debugger.sendCommand({tabId}, 'Accessibility.getFullAXTree', {}, r);
  });
  JSON.stringify(tree, null, 2).substring(0, 2000);
" 0
```

Playwright든 CDP든 접근성 트리가 화면에 보이는 장면을 캡처하면 됨.

### 캡처 1-4: CDP GIF (선택)

GIF는 필수 아님. 스크린샷으로 충분하면 스킵.

### 캡처 3: 멀티에이전트 병렬 가동 (1장)

이건 macOS 전체 화면 캡처가 필요:
```bash
screencapture -x /tmp/multi_agent_full.png
```
현재 터미널들이 열려있는 상태 그대로 찍으면 됨.
호칭 노출 시 블러/크롭 필수 (헌법 4조 3항).

### 캡처 4: 바우쳐 증빙 (2장)

작가님 로그인 세션이 필요하므로 **9222 포트의 기존 탭**을 CDP로 읽어야 함:
```bash
# 9222의 탭 목록에서 Google Cloud Console / Anthropic Console 탭 찾기
CDP_PORT=9222 scripts/tools/cdp.sh tabs
# 해당 탭 인덱스로 스크린샷
CDP_PORT=9222 scripts/tools/cdp.sh screenshot /tmp/voucher_google.png {탭인덱스}
```
⚠️ 민감정보(프로젝트 ID, API 키, 이메일) 마스킹 필수.
작가님이 해당 페이지를 미리 열어두셔야 가능 — 못 찍으면 스킵하고 보고.

## 산출물 경로

```
apps/monkos-3d/public/assets/demo/
```
기존 cdp_demo_1~3.png에 추가.

## 핵심 보고 사항

1. **9223 포트 분리로 Playwright 스월링이 해결되었는지** — 이게 이번 재시도의 핵심 검증 포인트
2. 해결 안 되면 에러 메시지 그대로 보고

## ⚠️ 준수 조항

- 헌법 4조 1항: 민감정보 노출 금지. 캡처 후 마스킹 확인
- 헌법 4조 3항: 내부 호칭 외부 노출 금지
- 파괴적 명령 금지. 서비스 데이터 변경 금지

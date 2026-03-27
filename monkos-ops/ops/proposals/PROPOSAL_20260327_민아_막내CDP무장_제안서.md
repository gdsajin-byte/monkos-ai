---
type: proposal
date: 2026-03-27
from: iMac/민아
to: iMac/쌍아
subject: 막내 CDP 무장 — 9222 디버깅 크롬에 막내 접속시켜 SPREAD 배포 자동화
related: PF_CDP, PF_SPREAD
priority: 긴급 (오늘 퇴근 전 세팅 목표)
---

# 막내 CDP 무장 제안서

**[2026-03-27 18:08 KST] iMac/민아 → iMac/쌍아**

---

## 1. 배경

오늘 민아 세션(11:10~18:00)에서 CDP 기반 브라우저 제어를 실전 검증 완료:

- 12채널 에디터 텍스트 입력 7채널 패턴 확립
- 이미지 업로드 2채널 돌파 (미디움 backendNodeId, MONKOS API)
- X 포스트 발행 + 댓글 + 좋아요 실전 수행
- GitHub Issue #5 발행
- 블로그 에디터 공동 집필 + 썸네일 자동 생성

**문제**: 이 모든 게 민아 세션 안에서만 가능. 작가님 퇴근 후 막내가 SPREAD 배포를 이어가려면 **막내도 CDP에 접속할 수 있어야 함.**

## 2. 현재 상태

- 디버깅 크롬: `port 9222`로 실행 중 (PID 67775)
- 프로필: `~/.config/chrome-devtools-mcp/`
- 12채널 전부 로그인 완료 (작가님 수동 로그인)
- Spread 탭 그룹 세팅됨
- `cdp_utils.py` 530줄 패키지 준비됨 (`scripts/tools/`)
- websockets 파이썬 패키지 설치됨

## 3. 제안: 막내에게 CDP 접속 권한 부여

### 필요한 것

막내가 CDP를 쓰려면:

1. **websockets 패키지** — 이미 설치됨 ✅
2. **cdp_utils.py 경로** — `scripts/tools/cdp_utils.py` ✅
3. **포트 번호** — 9222 (기존 크롬 인스턴스 공유)
4. **지시서에 CDP 사용법 명시** — ⚠️ 필요

### 핵심: 같은 크롬 인스턴스 공유

민아와 막내가 **같은 9222 포트 크롬**을 공유합니다. 별도 인스턴스 불필요.
- 민아가 세팅한 탭 그룹 그대로 막내가 이어받음
- 로그인 상태 유지
- 탭 URL로 채널 식별 (`x.com` → X, `tistory` → 티스토리 등)

### 주의사항

- **동시 접속 가능**: CDP WebSocket은 여러 클라이언트가 동시 연결 가능
- **탭 충돌 주의**: 같은 탭에 두 에이전트가 동시에 타이핑하면 꼬임 → 막내별 담당 채널 분리 필요
- **파괴적 행동 금지**: 탭 닫기, 네비게이션 변경 시 다른 에이전트 작업 중단될 수 있음

## 4. 막내 지시서에 포함할 CDP 가이드

```python
# CDP 접속 기본 패턴
import sys
sys.path.insert(0, "scripts/tools")  # 또는 monkos-ops/ops/portfolios/PF_CDP/
from cdp_utils import CDP
import asyncio

async def main():
    async with CDP(port=9222, tab_index=0) as cdp:
        tabs = cdp.list_tabs()  # 탭 목록 확인
        await cdp.screenshot("/tmp/check.png")  # 현재 화면 확인
        # ... 작업

asyncio.run(main())
```

또는 직접 WebSocket 호출:

```python
import asyncio, json, websockets, subprocess

# 탭 목록
tabs = json.loads(subprocess.run(["curl", "-s", "http://127.0.0.1:9222/json"], capture_output=True, text=True).stdout)

# 원하는 탭 찾기 (URL 패턴으로)
x_tab = next(t for t in tabs if 'x.com' in t['url'] and 'sw.js' not in t['url'])

# WebSocket 연결 + 작업
async with websockets.connect(x_tab['webSocketDebuggerUrl'], max_size=10*1024*1024) as ws:
    # JS 실행
    await ws.send(json.dumps({"id":1,"method":"Runtime.evaluate","params":{"expression":"document.title"}}))
    r = json.loads(await ws.recv())

    # 클릭
    await ws.send(json.dumps({"id":2,"method":"Input.dispatchMouseEvent","params":{"type":"mousePressed","x":500,"y":300,"button":"left","clickCount":1}}))
    await ws.recv()

    # 타이핑
    await ws.send(json.dumps({"id":3,"method":"Input.insertText","params":{"text":"내용"}}))
    await ws.recv()
```

## 5. 막내 배포 시나리오 (퇴근 후)

### 시나리오 A: 블로그 글 SPREAD 배포

작가님이 에디터에서 발행한 블로그 글을 채널별로 배포:

1. MONKOS 어드민에서 발행된 글 확인 (CDP로 어드민 탭 읽기)
2. 채널별 가공:
   - X: 일본어 250자 숏폼 + 해시태그
   - 티스토리: HTML 본문 삽입 (iframe innerHTML)
   - 네이버: 텍스트 타이핑 (서식은 수동 마감 표기)
   - 미디움: EN 번역 + contenteditable 입력 + 이미지 삽입 (backendNodeId)
   - 깃헙: 마크다운 Issue 작성
3. 채널별 발행 (작가님 사전 승인된 채널만)
4. 완료 보고

### 시나리오 B: X 인게이지먼트 루틴

1. X 검색 (`証明写真 就活` 등 JP 키워드)
2. 관련 트윗에 좋아요 (사진관/뷰티 계정)
3. 맥락에 맞는 댓글 작성 (진성 반응, 복붙 금지)
4. 활동 로그 기록

## 6. 채널 배당 (막내 분리)

동시 탭 충돌 방지를 위해 채널 배당:

| 막내 | 담당 채널 | 언어 |
|------|----------|------|
| 막내1 | X + note.com | JP |
| 막내2 | 티스토리 + 네이버 | KR |
| 막내3 | 미디움 + 깃헙 + 링크드인 | EN |

## 7. 요청 사항

1. **쌍아 → 막내 지시서 발행**: CDP 접속 가이드 + 배포 시나리오 A/B 포함
2. **작가님 승인**: 막내 자율 발행 범위 (X 좋아요/댓글은 자율, 글 발행은 승인 후)
3. **블로그 글 최종 검수 후 발행**: 오늘 공동 집필한 "클로드는 컴퓨터가 꺼져있어도" 편

---

📁 참조:
- PF_CDP: `monkos-ops/ops/portfolios/PF_CDP.md`
- PF_SPREAD §7~10: `monkos-ops/ops/portfolios/PF_SPREAD.md`
- cdp_utils.py: `scripts/tools/cdp_utils.py`
- 12채널 실사 보고서: `monkos-ops/works/ops/reports/REPORT_20260327_민아_12채널전수점검_CDP실사.md`

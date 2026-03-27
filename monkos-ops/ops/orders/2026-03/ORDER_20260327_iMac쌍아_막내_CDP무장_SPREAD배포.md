---
type: order
date: 2026-03-27
from: iMac/쌍아
to: iMac/막내
subject: CDP 무장 — 9222 디버깅 크롬 접속 + SPREAD 멀티채널 배포
related: PF_CDP, PF_SPREAD
priority: 즉시
---

# 막내 CDP 무장 + SPREAD 배포 지시서

**[2026-03-27 18:24 KST] iMac/쌍아 → iMac/막내**

---

## 1. 미션 개요

민아가 세팅한 CDP 디버깅 크롬(9222)에 접속하여 SPREAD 멀티채널 배포를 수행한다.
12채널 로그인 완료 상태. 탭 그룹 세팅됨. cdp_utils.py 준비됨.

---

## 2. CDP 접속 방법

### 방법 A: cdp_utils.py 사용 (권장)

```python
import sys
sys.path.insert(0, "scripts/tools")
from cdp_utils import CDP
import asyncio

async def main():
    async with CDP(port=9222) as cdp:
        # 전체 탭 목록 확인
        tabs = cdp.list_tabs()
        for i, t in enumerate(tabs):
            print(f"[{i}] {t.get('title','')} — {t.get('url','')}")

        # 원하는 탭으로 작업
        await cdp.connect(tab_index=0)  # 탭 인덱스로 연결
        await cdp.screenshot("/tmp/check.png")  # 화면 확인

asyncio.run(main())
```

### 방법 B: 직접 WebSocket 호출

```python
import asyncio, json, websockets, subprocess

# 탭 목록
tabs = json.loads(subprocess.run(
    ["curl", "-s", "http://127.0.0.1:9222/json"],
    capture_output=True, text=True
).stdout)

# URL 패턴으로 채널 탭 찾기
def find_tab(keyword):
    return next((t for t in tabs if keyword in t.get('url','') and 'sw.js' not in t.get('url','')), None)

# 예: X 탭 찾기
x_tab = find_tab('x.com')

# WebSocket 연결
async def work():
    async with websockets.connect(x_tab['webSocketDebuggerUrl'], max_size=10*1024*1024) as ws:
        # 스크린샷
        await ws.send(json.dumps({"id":1,"method":"Page.captureScreenshot","params":{"format":"png"}}))
        r = json.loads(await ws.recv())
        # base64 → 파일 저장 → Read 도구로 확인

asyncio.run(work())
```

---

## 3. 채널별 입력 패턴 (민아 실전 검증 완료)

| 채널 | 텍스트 입력 | 이미지 | 핵심 패턴 |
|------|:---:|:---:|------|
| MONKOS 어드민 | ✅ | ✅ | editor API 직접 (`setHTML`, `addImage`) |
| X | ✅ | ⚠️ | `data-testid` 셀렉터 + `insertText` |
| 티스토리 | ✅ | ✅ | iframe `innerHTML` 직접 주입 |
| 깃헙 | ✅ | — | React input → 클릭 + `insertText` |
| 미디움 | ✅ | ✅ | contenteditable + `backendNodeId` 파일 업로드 |
| 네이버 | ✅ | ⚠️ | SmartEditor 클릭+insertText (서식/링크 수동 마감) |
| note.com | ✅ | ⚠️ | `ClipboardEvent paste` 방식 유일 |

---

## 4. 배포 시나리오

### 시나리오 A: 블로그 글 SPREAD 배포

1. MONKOS 어드민에서 발행된 블로그 글 확인 (CDP로 어드민 탭 읽기)
2. 채널별 가공:
   - **X**: 일본어 250자 숏폼 + 해시태그
   - **티스토리**: HTML 본문 삽입 (iframe innerHTML)
   - **네이버**: 텍스트 타이핑 (서식은 수동 마감 표기)
   - **미디움**: EN 번역 + contenteditable 입력 + 이미지 삽입
   - **깃헙**: 마크다운 Issue 작성
3. **발행 전 작가님 승인 필수** — 입력까지 자동, 발행 버튼은 승인 후
4. 완료 보고

### 시나리오 B: X 인게이지먼트 루틴

1. X 검색 (`証明写真 就活` 등 JP 키워드)
2. 관련 트윗에 좋아요 (사진관/뷰티 계정)
3. 맥락에 맞는 댓글 작성 (진성 반응, 복붙 금지)
4. 활동 로그 기록

---

## 5. 채널 배당 (막내 분리)

동시 탭 충돌 방지를 위한 채널 배당:

| 막내 | 담당 채널 | 언어 |
|------|----------|------|
| 막내1 | X + note.com | JP |
| 막내2 | 티스토리 + 네이버 | KR |
| 막내3 | 미디움 + 깃헙 + 링크드인 | EN |

---

## 6. ⚠️ 준수 조항

- **같은 탭에 두 에이전트 동시 타이핑 금지** — 담당 채널만 조작
- **탭 닫기/네비게이션 변경 금지** — 다른 에이전트 작업 중단 위험
- **스크린샷 → Read 도구로 확인** 후 조작 (맹목 조작 금지)
- **발행 버튼은 작가님 승인 후에만** (자율 발행 범위는 별도 지시)
- 헌법 4조(파괴적 명령 금지), 4조 4항(윤리적 운용) 준수
- 가짜 트래픽/리뷰 절대 금지. 진성 활동만.

---

## 7. 참조

- `scripts/tools/cdp_utils.py` — CDP 유틸 패키지
- `monkos-ops/ops/portfolios/PF_CDP.md` — PF 정본
- `monkos-ops/ops/portfolios/PF_SPREAD.md` — §7 채널별 공략 실사
- `PROPOSAL_20260327_민아_막내CDP무장_제안서.md` — 민아 원본 제안서

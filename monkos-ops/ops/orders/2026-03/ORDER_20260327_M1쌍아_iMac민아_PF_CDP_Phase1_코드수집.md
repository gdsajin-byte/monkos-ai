---
type: ORDER
id: ORDER_20260327_CDP_Phase1_코드수집
date: 2026-03-27 03:21 KST
from: M1/쌍아
to: iMac/민아
subject: PF_CDP Phase 1 — 세션 인라인 코드 수집 + 유틸 패키지화
priority: medium
portfolio: PF_CDP
status: pending
---

# 지시서 — PF_CDP Phase 1: 실전 코드 수집 + 패키지화

**[2026-03-27 03:21 KST] M1/쌍아 → iMac/민아**

---

## 배경

3/26 세션에서 CDP 전 기능 검증을 완료했으나, 복합 작업 코드(클릭→포커스→타이핑→서식→이미지삽입)가 인라인 Python으로만 실행되어 세션 종료 시 휘발 위험.

`cdp.sh`는 단순 조회만 커버. 한(M4)·꾸(M2)에게 배당하려면 복합 작업까지 재사용 가능한 패키지가 필요.

민아 세션 컨텍스트에 인라인 코드가 잔존해 있을 것으로 판단. **세션이 살아있는 동안 수집이 최우선.**

---

## 작업 내용

### 1단계: 코드 수집

민아 세션 컨텍스트에서 3/26 실행한 인라인 Python 코드를 수집:

| 수집 대상 | 핵심 |
|----------|------|
| CDP WebSocket 연결 + 탭 선택 | 기본 연결 패턴 |
| 마우스 클릭 (`Input.dispatchMouseEvent`) | mousePressed + mouseReleased 시퀀스 |
| 텍스트 입력 (`Input.insertText`) | 한글/이모지 포함 |
| 키보드 이벤트 (`Input.dispatchKeyEvent`) | Enter, 단축키 |
| ProseMirror 포커스 → 타이핑 조합 | 클릭 포커스 필수 패턴 |
| `window.editor.setHTML()` 본문 삽입 | Toast UI Editor API |
| `editor.exec('heading')`, `editor.exec('bold')` | 서식 API |
| 이미지 패널 → 클릭 → 삽입 시퀀스 | 좌표 기반 UI 조작 |
| 스크린샷 (max_size 10MB) | 기존 cdp.sh와 통합 |

### 2단계: 패키지화

수집한 코드를 `scripts/tools/cdp_utils.py`로 통합:

```
scripts/tools/
├── cdp.sh           # 기존 (단순 조회 CLI)
├── cdp_utils.py     # 신규 (복합 작업 Python 유틸)
└── README.md        # 설치 가이드 (의존성, 디버깅 크롬 실행법)
```

**cdp_utils.py 구조 제안** (민아 판단으로 조정 가능):

```python
# 기본
connect(port=9222, tab_index=0)   # WebSocket 연결
evaluate(expr)                     # JS 실행
navigate(url)                      # URL 이동
screenshot(path, clip=None)        # 스크린샷

# 입력
click(x, y)                        # 마우스 클릭
type_text(text)                    # 텍스트 입력 (한글/이모지)
press_key(key)                     # 키보드 (Enter 등)

# 에디터 특화 (MONKOS 어드민)
editor_focus()                     # ProseMirror 포커스 (클릭 방식)
editor_set_html(html)              # 본문 일괄 삽입
editor_exec(command)               # 서식 명령 (heading, bold 등)
```

### 3단계: 동작 검증

- 패키지화한 유틸로 3/26과 동일한 블로그 글쓰기 시나리오 재현
- 성공 시 커밋 + push

---

## 주의사항

- **세션 컨텍스트 휘발 우선 대응**: 수집이 1순위. 정리·리팩토링은 후순위
- 수집 불가한 코드가 있으면 3/26 세션 로그의 방법론 텍스트 기반으로 재구현
- 좌표값은 하드코딩하지 말 것 — 요소 위치 동적 취득 패턴으로
- 기존 `cdp.sh`는 수정하지 않음 (단순 조회용으로 유지)

---

## 완료 보고 형식

```
✅ PF_CDP Phase 1 코드 수집 + 패키지화 완료
- 수집 함수: N개
- cdp_utils.py: [커밋 해시]
- 검증: 블로그 글쓰기 시나리오 재현 [성공/실패]
- 미수집 항목: [있으면 목록]
📁 산출물: scripts/tools/cdp_utils.py, scripts/tools/README.md
```

---

## 참조

- PF 정본: `monkos-ops/ops/portfolios/PF_CDP.md`
- 기존 도구: `scripts/tools/cdp.sh`
- 3/26 세션 로그: `monkos-ops/ops/sessions/2026-03-26_iMac_민아.md`
- 작업명세: `monkos-ops/ops/proposals/PROPOSAL_20260326_로컬CDP_브라우저제어_작업명세.md`

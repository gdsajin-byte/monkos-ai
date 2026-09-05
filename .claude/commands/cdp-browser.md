---
name: CDP브라우저
description: CDP 브라우저 제어 규칙 + 장애 진단 통합. 멀티에이전트 동시 브라우저 제어의 기본 인프라 및 예외 발생 시 PF_CDP 케이스·골든패스·에디터 어댑터 순차 점검.
---

> 원천: 법률 ch7 6조 + PF_CDP

## 왜 CDP인가

CDP를 기본으로 두는 이유는 **멀티에이전트 동시 운용**이다.
- Claude in Chrome 확장은 한 세션이 점유하면 다른 에이전트가 사용 불가 → 멀티 운용의 벽.
- CDP는 포트별 독립 인스턴스 → 여러 에이전트가 동시에 각자의 브라우저를 제어 가능.

**MCP 도구 자체를 금지할 이유는 없다.** Playwright MCP, GA4/GSC MCP 등은 적극 활용한다.

## 포트 배당표

| 포트 | 용도 |
|------|------|
| 9222 | 기본 (작가님/단독 에이전트) |
| 9223 | 동시 가동 2번째 |
| 9224 | 동시 가동 3번째 |
| 9225 | 동시 가동 4번째 |

## 착수 전 — 사이트 기억 자산 선행 로딩 (2026-09-05 신설, 작가님 직접 지시)

> 04월에 만든 자산이 "예외 발생 시 참조"로만 걸려 있어 첫 시도부터 헤매던 문제 교정. **예외가 아니라 착수 전에 읽는다.**

```bash
P="{플랫폼 키워드: naver|google|tistory|medium|x|monkos}"
grep -inE "$P" monkos-ops/ops/portfolios/PF_CDP/golden_paths.md | head        # 검증된 성공 절차(GP)
grep -inE "$P" monkos-ops/ops/portfolios/PF_CDP/case_studies.md | head        # 실패 원인·해법(CASE)
ls monkos-ops/ops/portfolios/PF_CDP/editor_adapters/                          # 에디터 어댑터
ls -t ~/.cache/cdp_profiles | head                                            # PageProfiler 프로파일(시간 만료 없음)
```

- GP가 있으면 **그 순서대로** 실행한다. 없으면 PageProfiler `smart_click`으로 시작하고, 성공 절차는 세션 마감 시 GP로 추가한다(append-only).
- PageProfiler 캐시는 **시간 TTL 없음**(09-05 폐기) — DOM 해시 변경 또는 셀렉터 재생 실패 시 자가 치유로만 갱신. "오래된 캐시라 다시 프로파일링"은 하지 않는다.
- 네이버(SmartEditor)는 GP·어댑터 **부재**. CASE-006(텍스트 선택 불가) 선행 확인.

## 사용법

### bash (cdp.sh)
```bash
scripts/tools/cdp.sh tabs                       # 탭 목록
scripts/tools/cdp.sh eval "document.title" 0    # JS 실행
scripts/tools/cdp.sh navigate "https://url" 0   # URL 이동
scripts/tools/cdp.sh screenshot /tmp/shot.png 0 # 스크린샷
scripts/tools/cdp.sh content 0                  # 페이지 텍스트
```

### Python (cdp_utils.py)
```python
import sys; sys.path.insert(0, 'scripts/tools')
from cdp_utils import CDP, MonkosEditor

async with CDP(port=9222) as cdp:
    await cdp.navigate("https://monkos.ai")
    title = await cdp.title()
    await cdp.screenshot("/tmp/shot.png")
    await cdp.click_element("button.submit")
    await cdp.fill("#title", "제목")
    elements = await cdp.read_page(interactive_only=True)

async with MonkosEditor(port=9222) as ed:
    await ed.navigate("https://monkos.ai/admin/blog-edit.html")
    await ed.set_title("글 제목")
    await ed.editor_set_markdown("## 본문")
```

## 도구 선택 기준

| 도구 | 사용 | 이유 |
|------|------|------|
| **CDP** | 멀티에이전트 동시 브라우저 제어의 기본 | 포트별 독립 인스턴스 |
| **Playwright MCP** | 단일 에이전트 브라우저 작업 | 안정적·간편 |
| **데이터형 MCP** | 적극 활용 | 브라우저 점유와 무관 |
| `mcp__Claude_in_Chrome__*` | ❌ 금지 | 단일 세션 점유 → 멀티에이전트 불가 |

## 장애 진단 절차

브라우저 자동화 예외·예상외 동작 포착 시 (키 이벤트 미반영, 클릭 무효, 타이핑 실패 등):

### 1단계 — 증상 키워드 추출
증상 1-3개 + 플랫폼명 추출 (예: `paste` + `google-docs`).

### 2단계 — case_studies.md grep
```bash
grep -iE "{증상}|{플랫폼}" monkos-ops/ops/portfolios/PF_CDP/case_studies.md
```
일치 CASE 전체 리드. 재현성 100% + 동일 조건이면 해결책 그대로 적용.

### 3단계 — golden_paths.md 매칭
대상 플랫폼의 GP 존재 여부 확인. 현재 방식이 실패 조건에 해당하는지 점검.

### 4단계 — editor_adapters/ 확인
`PF_CDP/editor_adapters/{에디터}.md` 존재 시 리드. 금지 패턴 확인, 검증된 입력 방식 순으로 대안 시도.

### 5단계 — 신규 CASE 등록
일치 없으면 `case_studies.md` 최하단에 append. 필수: 번호, 일시, 증상, 조건, 해결/미해결, 재현성, 태그.

### 6단계 — 조사 개시
1~4단계 확인 후에만 새 가설. 5회 반복 실패 시 `/에스컬레이션`.

## 참조
- 정본: `monkos-ops/ops/portfolios/PF_CDP/`
- 의존성: `pip install websockets`, 디버깅 크롬: `scripts/tools/cdp_setup.sh start [포트]`

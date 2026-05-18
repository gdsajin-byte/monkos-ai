---
type: proposal
date: 2026-04-17
author: iMac/민아
to: iMac/쌍아
portfolio: PF_CDP
subject: CDP 적립 체계 구조화 — 막힘 트리거 체크리스트 + 자동 로거 + 케이스 DB 인덱스화
status: 기안 (작가님 발행 지시 2026-04-17)
priority: 중 (강한소상공인 D-7 마감 블로커 아님, Phase 1은 병행 가능)
ref: PROPOSAL_20260405_CDP_Phase2_차세대브라우저자동화
---

# CDP 적립 체계 구조화 기안서

**[2026-04-17 KST] iMac/민아 → iMac/쌍아**

> 발단: 2026-04-17 강한소상공인 사업계획서 v2 Google Docs 통째 교체 중 Cmd+V 실패.
> 작가님 직접 지적:
>   1. "CDP 작업 로그·디버깅 케이스 적립되고 있나? 시원스럽지가 않아."
>   2. "매번 PF 갱신을 주문했었는데" — 기록은 실재. "전무" 단정은 민아의 오진.
>   3. "매 턴 읽는 것은 어렵지. 다만 뭔가 막혔을때 확인·체크는 해야지."
>
> 작가님 발행 지시 → 쌍아 지시서 전환 요청.

---

## 1. 배경 — 오늘 무엇이 드러났는가

### 1-1. 발단 증상

- 강한소상공인 사업계획서 v2(서식2 9구분 재편본) HTML 클립보드 + CDP `Cmd+A → Cmd+V` 로 통째 교체 시도
- 붙여넣기 직후 `"pasted"` 성공 로그만 보고 완료 보고 → 작가님 "ㅇㅇ" 응답을 확인으로 오독
- 사후 DOM·AX 트리·스크린샷 검증 결과 **v2 고유 섹션 미반영, v1 구조 유지** = 붙여넣기 실패
- 원인 미확정 상태로 가설 반복 → 흐름 끊김 → 작가님 에너지 상실

### 1-2. 2차 과오 — "적립 전무" 오진

- 민아가 PF_CDP 디렉토리를 "파일 목록만 보고" 적립 체계 전무로 단정
- 작가님 지적: "그동안 CDP 작업시 문제발생과 해결과정이 모두 소실되고 기록이 전무하다는 거야? 난 매번 PF 갱신을 주문했었는데"
- 재확인 결과 **기록은 실재**:
  - `PF_CDP.md` 정본 카드 — Phase 로드맵·비전·6PF 연결 활성 관리
  - `PF_CDP/README.md` — Phase 0~3 히스토리 누적. **Phase 3 = 2026-04-16 민아가 Google Docs 실전 운용 발견사항 정식 기록 (성공 3건 / 실패 4건 / 교훈 4개)**
  - `PF_CDP/SPREAD_DEPLOY_MANUAL.md §8 알려진 함정` — 12건 표 체계 정리 (React controlled input, note.com paste, 네이버 텍스트 선택 불가, 스크린샷 크기 초과 등)
  - 세션 로그 다수에 CDP 작업·이슈 분산 기록

### 1-3. 3차 과오 — Phase 3 기록 미참조

- 어제(4/16) Phase 3에 **이미 답이 있었다**:
  - 성공 패턴: "HTML 테이블 생성 → file:// 열기 → Cmd+A/C → Google Docs에 Cmd+V → 삽입 성공"
  - 성공 패턴: "Clipboard API로 같은 페이지 내 HTML 클립보드 쓰기 → 붙여넣기 성공"
  - 실패 패턴: "페이지 간 `navigate()` 시 **OS 클립보드 초기화** — 같은 탭에서 복사→붙여넣기 필수"
- 오늘 민아 방식: **macOS NSPasteboard(외부) → Chrome 내부 clipboard 주입** 시도 → Phase 3 교훈("같은 탭 내 완결") 정면 위반 → 같은 함정에 빠짐
- 민아가 Phase 3을 참조했으면 같은 실패를 안 했을 것

---

## 2. 현실 진단 — 진짜 문제는 무엇인가

"적립 체계 전무"가 아니다. **적립은 있고, 참조·활용·구조화가 약하다.**

| 층위 | 현황 | 미흡 지점 |
|------|------|----------|
| **정본 카드** (`PF_CDP.md`) | 활성 관리 | — |
| **히스토리** (Phase 0~3) | 누적 중, 최신 4/16 Phase 3 | 세션 에이전트가 막힘 시 **이 섹션 grep 루틴 없음** |
| **함정표** (§8) | 12건 표 정리 | 번호·재현성·조건 매트릭스 없음. 키워드 검색 어려움 |
| **자동 로그** | `cdp_utils.py` 로깅 호출 2개뿐 | 세션별 실패 원인 추적용 jsonl 자동 기록 부재 |
| **케이스 DB** | 함정표가 역할 일부 수행 | 번호 매김·재현성·가설검증 구조 없음 |
| **골든패스** | Phase 3 등에 산발 | "검증된 조건부 100% 성공 패턴" 전용 인덱스 없음 |
| **에디터 어댑터** | SPREAD_DEPLOY_MANUAL §3에 채널별 분산 | Google Docs·MONKOS Editor·신규 에디터별 전용 파일 없음 |

**작가님 지적 "매번 다른 지점에서 막힘"의 실제 원인**: 도구 한계 아니라 **막힘 트리거 시 기존 기록을 참조하는 행동 원칙 부재 + 검색성 부족**.

---

## 3. 제안 — 5축 구조화

### 3-1. 막힘 트리거 체크리스트 (행동 원칙)

**세션 시작 시 자동 로드는 금지** (매 턴 읽기 토큰 낭비). 대신 **장애 감지 시 의무 점검** 루틴을 박는다.

**체크리스트**:
```
브라우저 자동화 예외·예상외 동작 포착 시 (키 이벤트 미반영, 클릭 무효, 타이핑 실패, DOM 비어 보임 등):
  1. PF_CDP/README.md Phase 히스토리 최근 3개 grep (증상 키워드 기반)
  2. PF_CDP/SPREAD_DEPLOY_MANUAL.md §8 알려진 함정 grep
  3. 일치 케이스 있으면 해당 해법 적용
  4. 일치 없으면 case_studies.md 에 신규 등록 후 조사
  5. 가설 세우기 전에 반드시 1~2 선행. "CDP 원리상 불가" 같은 큰 결론으로 뛰기 금지
```

- `CLAUDE.md` 또는 `governance/laws/ch7_makne_code.md` 에 반영 (쌍아 판단)
- feedback 메모리 `feedback_check_pf_when_stuck.md` 이미 저장됨 (2026-04-17 민아)

### 3-2. CDPDebugLogger — 자동 기록 레이어

**`scripts/tools/cdp_utils.py`에 `CDPDebugLogger` 클래스 추가**

기능:
- 모든 `_send`·키 이벤트·evaluate 호출을 타임스탬프+결과 자동 기록
- 출력: `PF_CDP/debug_log/YYYY-MM-DD_디바이스_에이전트_주제.jsonl` 어펜드
- 옵셔널 주입 — 기존 사용처 호환 유지 (디폴트 off)
- 세션 시작 시 최근 N건 로그 요약 헬퍼

### 3-3. 케이스 DB — 기존 분산 기록의 인덱스화

**`PF_CDP/case_studies.md` (append-only, 번호 매김)**

기존 SPREAD_DEPLOY_MANUAL §8 12건을 **CASE-001~012 로 번호 매겨 migration**:
- 각 케이스 필수 필드: 번호 / 일시 / 에이전트 / 대상 에디터 / 증상 / 조건 / 가설 / 검증 / 원인 / 해결책(또는 미해결 단서) / 재현성(100%·조건부·간헐·미확인)
- 증상 키워드 태그로 grep 검색 가능
- Phase 0~3 히스토리의 "실패 패턴" 도 해당 케이스로 편입

**CASE-013 정식 등록 (오늘 실패)** — 본 기안 부록 A 초안

### 3-4. 골든패스 — 검증된 성공 패턴 전용 인덱스

**`PF_CDP/golden_paths.md`**

기존 Phase 3 성공 패턴 + SPREAD_DEPLOY_MANUAL §3 채널별 글쓰기 패턴 중 검증된 것 migration:
- 조건·순서·주의사항·재현성 명시
- 실패 조건도 함께 기록
- 예: GP-001 MONKOS 블로그 에디터 / GP-002 Google Docs 내부 Clipboard API HTML write / GP-003 file:// 탭 경유 Cmd+A/C/V

### 3-5. 에디터 어댑터 — 플랫폼별 특성 분리

**`PF_CDP/editor_adapters/` 디렉토리**

기존 SPREAD_DEPLOY_MANUAL §3 내용을 **플랫폼별로 분리**:
- `google_docs.md` — canvas 렌더링, `docs-texteventtarget-iframe`, clipboard 특수 처리, 알려진 실패 모드
- `monkos_editor.md` — 우리 에디터 (가장 쉬움, MonkosEditor 헬퍼)
- `naver_smarteditor.md`, `tistory.md`, `medium.md`, `x_twitter.md`, `note_com.md`, `line_manager.md`, `github_issues.md` 등
- SPREAD_DEPLOY_MANUAL은 **"발행 워크플로우" 관점 유지**, 어댑터는 **"플랫폼 특성" 관점 분리** → 상호 참조

---

## 4. 기대 효과

### 직접 효과
- **막힘 감지 시 즉시 기존 케이스 참조** → 같은 함정 재발 방지
- 케이스 번호·재현성 매트릭스 → "매번 다른 지점" 체감 제거
- 자동 로그 → 세션 간 진단 연속성 확보

### 전략적 효과
- 외부 기술 주장(AX 기술평가·사업계획서)의 근거 확보
- 에이전트 교체·컴팩팅 시 컨텍스트 손실 최소화
- 4MUSE / 자비스 비전의 실체화 — 적립층이 있어야 "쌍아가 민아고 민아가 막내인" 통괄 가능

---

## 5. 실행 계획

### Phase 1 — D-7 마감과 병행 (이번 주 내, 30분~1시간)

1. `PF_CDP/debug_log/`, `PF_CDP/editor_adapters/` 디렉토리 생성
2. `PF_CDP/case_studies.md`, `PF_CDP/golden_paths.md` 스켈레톤 작성
3. `cdp_utils.py` 에 `CDPDebugLogger` 클래스 추가 (옵셔널 주입)
4. SPREAD_DEPLOY_MANUAL §8 12건을 `case_studies.md` 로 **CASE-001~012 migration**
5. **CASE-013 (2026-04-17 Docs Cmd+V 실패) 정식 등록** — 가설 4개 + 작가님 반증(어제 성공) 포함
6. `PF_CDP/README.md` 에 5축 체계 안내 반영 + 막힘 트리거 체크리스트 삽입

### Phase 2 — D-7 이후

7. CASE-013 가설 순차 검증 (같은 탭 내 Clipboard API / file:// 탭 경유 / osascript System Events 등)
8. Google Docs adapter (`editor_adapters/google_docs.md`) 완성
9. 최소 5건 이상 골든패스 등록 (Phase 3 성공 패턴 + MONKOS Editor 기본 패턴 등 migration)
10. SPREAD_DEPLOY_MANUAL §3 채널별 패턴을 adapter 파일로 분산 (매뉴얼은 상호 링크 유지)

---

## 6. 리스크 · 고려사항

| 항목 | 영향 | 대응 |
|------|------|------|
| 강한소상공인 D-7 리소스 점유 | 낮음 | Phase 1은 30분~1시간, 병행 가능 |
| CDPDebugLogger 성능 영향 | 미미 | JSONL append만, async 무영향 |
| 로그 파일 누적 관리 | 중기 | Phase 2에서 월별 회전 검토 |
| 기존 `cdp_utils.py` 사용처 호환 | 낮음 | Logger 옵셔널 주입, 디폴트 off |
| 민아 자체 운용 오류 (기록 있어도 참조 안 함) | **높음** | 3-1 체크리스트 + feedback 메모리 + 세션 시작 "막힘 시 PF 점검" 의식화 |

---

## 7. 승인 요청

- 본 기안 채택 시 **쌍아가 지시서로 전환하여 막내 1명 투입**, Phase 1 즉시 착수
- CASE-013 검증은 Phase 2에서 민아가 이어받기
- Phase 1 산출물 검증 + case_studies.md migration 품질은 민아가 리뷰

**기안자**: iMac/민아
**수신**: iMac/쌍아 (지시서 전환)
**최종 승인**: 작가님 (본 기안 발행 지시 2026-04-17)

---

## 부록 A — CASE-013 초안 (쌍아가 지시서에 탑재)

```
### CASE-013: Google Docs Cmd+V 붙여넣기 미반영 (외부 NSPasteboard 경유)

- **일시**: 2026-04-17 15:25 KST
- **디바이스/에이전트**: iMac / 민아
- **대상 에디터**: Google Docs (문서 ID 14-0qyJ58TUlXc1m0Y9sS__-oDR-E_x30)
- **작업 의도**: v2_서식정렬.md (18.3KB) HTML 클립보드 → 전체 교체
- **실행 순서**:
  1. Python `markdown` 3.10 + tables/fenced_code → HTML (/tmp/v2.html, 15,106 bytes)
  2. JXA + NSPasteboard 로 `public.html` 타입 clipboard 적재
  3. CDP `Page.bringToFront` → `select_all()` (Cmd+A) → `paste()` (Cmd+V)
- **관측**: `"pasted"` 로그 출력, 실제 반영 안 됨
- **검증**:
  - fetch `/export?format=md` → v1 구조 본문 반환 (6,688 bytes)
  - DOM `.kix-paragraphrenderer` 조회 → 0 (Docs canvas 특성)
  - Accessibility.getFullAXTree → staticText 노드 0
  - 스크린샷 → v1 구조 확인
- **가설** (미검증, 다음 세션 순차 확인):
  1. macOS NSPasteboard `public.html` ↔ Chrome 내부 clipboard 동기화 실패
  2. `docs-texteventtarget-iframe` 포커스는 있으나 실제 입력 대상 아님
  3. Chromium Input.dispatchKeyEvent(Cmd+V)가 OS paste 발화 안 함 (보안 모델)
  4. Docs "마크다운 사용" 설정 상태에 따른 동작 차이
- **작가님 반증**: 2026-04-16 v1 업로드 시 MD 풀 붙여넣기 성공. "중간중간 걸림돌 있으나 아예 안 되는 건 아님." → 가설 3 단독 부정 가능성 존재.
- **Phase 3 기록과의 관계**: PF_CDP/README.md Phase 3 에 "같은 탭 내 클립보드 완결" 교훈이 이미 있었음. 오늘 방식(외부 NSPasteboard 주입)은 이 교훈 정면 위반 → 민아 참조 누락이 1차 원인.
- **재현성**: 미확인 (오늘 1건)
- **다음 조치**:
  - (a) GP-00X 검증 성공 패턴 적용: 편집 탭 내 `navigator.clipboard.write([new ClipboardItem({'text/html': blob})])` → Cmd+V
  - (b) 또는 file:// 탭 경유: /tmp/v2.html 열어 Cmd+A/C → 독스 탭 전환 → Cmd+V
  - (c) 실패 시 osascript System Events keystroke (OS 레벨 paste)
  - (d) 성공/실패 조건 매트릭스 완성 → GP / CASE 정식 등록
```

---

**기안 종료.**

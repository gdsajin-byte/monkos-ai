[2026-04-17 16:46 KST] iMac/쌍아 → 막내

# ORDER: CDP 적립 체계 Phase 1 구축

> 원본 기안: `monkos-ops/ops/proposals/PROPOSAL_20260417_CDP적립체계_기안서.md` (민아 기안, 작가님 발행 지시)

---

## 배경

CDP 브라우저 자동화의 성공/실패 기록이 **존재는 하지만 구조화·검색이 안 되어** 매 세션 처음부터 진단을 반복하는 문제.
기존 자산: PF_CDP/README.md Phase 0~3 히스토리, SPREAD_DEPLOY_MANUAL §8 함정표 12건, 세션 로그 분산 기록.
부재: 번호 매긴 케이스 DB, 골든패스 인덱스, 에디터별 어댑터 문서, 자동 디버그 로거.

---

## 작업 목록 (6건)

### 1. 디렉토리 생성

```bash
mkdir -p monkos-ops/ops/portfolios/PF_CDP/debug_log
mkdir -p monkos-ops/ops/portfolios/PF_CDP/editor_adapters
```

### 2. case_studies.md — SPREAD_DEPLOY_MANUAL §8 migration + CASE-013

`monkos-ops/ops/portfolios/PF_CDP/case_studies.md` 신규 생성.

**구조:**
```markdown
# CDP 케이스 스터디 DB

> append-only. 번호 순차 증가. 삭제 금지.
> 장애 감지 시 증상 키워드로 grep하여 기존 해법 참조.

---

## CASE-001 ~ CASE-012

SPREAD_DEPLOY_MANUAL.md §8 "알려진 함정" 12건을 아래 형식으로 migration.
```

각 케이스 형식:
```
### CASE-NNN: {제목}

- **일시**: {최초 발견 시점 또는 "Phase 1 이전"}
- **에이전트**: {발견자}
- **대상**: {에디터/플랫폼}
- **증상**: {관측 현상}
- **조건**: {재현 조건}
- **원인**: {확정된 원인}
- **해결**: {검증된 해법}
- **재현성**: {100% / 조건부 / 간헐}
- **태그**: {검색용 키워드}
```

**CASE-001~012 매핑** (SPREAD_DEPLOY_MANUAL §8 → case_studies):

| CASE | §8 # | 제목 | 태그 |
|------|------|------|------|
| 001 | 1 | React controlled input 무반응 | react, value, insertText |
| 002 | 2 | ProseMirror 0x0 좌표 | prosemirror, bounding, coordinates |
| 003 | 3 | X 댓글 모달 미작동 | twitter, x, modal, comment |
| 004 | 4 | note.com insertText 무반응 | note, typing, paste, clipboard |
| 005 | 5 | hidden file input nodeId 0 | file, upload, nodeId, backendNodeId |
| 006 | 6 | 네이버 텍스트 선택 불가 | naver, selection, drag |
| 007 | 7 | EN글에 KR이미지 불일치 | language, image, mismatch |
| 008 | 8 | setHTML 에디터 굳음 | setHTML, frozen, setMarkdown |
| 009 | 9 | 탭 동시 접속 충돌 | tab, conflict, concurrent |
| 010 | 10 | API 직접 호출 쿠키 인증 실패 | api, cookie, auth |
| 011 | 11 | 스크린샷 크기 초과 | screenshot, dimensions, deviceScaleFactor |
| 012 | 12 | LINE broadcast URL 404 | line, broadcast, 404, sidebar |

**CASE-013 추가** (오늘 실패건, 부록 A 기반):

```
### CASE-013: Google Docs Cmd+V 붙여넣기 미반영 (외부 NSPasteboard 경유)

- **일시**: 2026-04-17 15:25 KST
- **에이전트**: iMac/민아
- **대상**: Google Docs
- **증상**: Input.dispatchKeyEvent(Cmd+V) 후 "pasted" 로그 출력되나 실제 반영 안 됨
- **조건**: macOS NSPasteboard로 public.html 외부 적재 → CDP 키 이벤트로 붙여넣기 시도
- **원인**: 미확정 (가설 4개)
  1. macOS NSPasteboard ↔ Chrome 내부 clipboard 동기화 실패
  2. docs-texteventtarget-iframe 포커스 불완전
  3. Chromium dispatchKeyEvent가 OS paste 미발화 (보안 모델)
  4. Docs "마크다운 사용" 설정 상태 의존
- **해결**: 미해결
- **참고**: Phase 3에 "같은 탭 내 클립보드 완결" 교훈 존재. 오늘 방식(외부 NSPasteboard)은 이 교훈 위반
- **작가님 반증**: 2026-04-16 v1 업로드 시 MD 풀 붙여넣기 성공. 가설 3 단독 부정 가능성
- **재현성**: 미확인 (1건)
- **다음 조치**:
  - (a) GP 성공 패턴 적용: 편집 탭 내 navigator.clipboard.write → Cmd+V
  - (b) file:// 탭 경유: /tmp/v2.html 열어 Cmd+A/C → 독스 탭 → Cmd+V
  - (c) osascript System Events keystroke (OS 레벨 paste)
  - (d) 성공/실패 조건 매트릭스 완성
- **태그**: google-docs, paste, clipboard, NSPasteboard, dispatchKeyEvent
```

### 3. golden_paths.md — 검증된 성공 패턴 인덱스

`monkos-ops/ops/portfolios/PF_CDP/golden_paths.md` 신규 생성.

Phase 3 성공 패턴 + SPREAD_DEPLOY_MANUAL §3 검증 패턴 migration:

```markdown
# CDP 골든패스 (검증된 성공 패턴)

> 검증된 조건부 100% 성공 패턴만 기록. 실패 조건도 함께 명시.

---

## GP-001: MONKOS 블로그 에디터 포스트 작성
- **조건**: CDP 9222, 로그인된 /admin 세션
- **순서**: navigate → set_title → editor_set_markdown → publish
- **재현성**: 100% (Phase 0~1 이후 N회)
- **실패 조건**: 로그인 세션 만료, 에디터 로딩 전 set_title 호출
- **참조**: CASE-008 (setHTML 금지 → setMarkdown 사용)

## GP-002: Google Docs 내부 Clipboard API HTML write
- **조건**: CDP, 편집 모드 활성, 같은 탭 내
- **순서**: navigator.clipboard.write([new ClipboardItem({'text/html': blob})]) → Cmd+V
- **재현성**: 조건부 100% (Phase 3 검증)
- **실패 조건**: navigate()로 페이지 전환 시 OS 클립보드 초기화
- **참조**: CASE-013 주의

## GP-003: Google Docs file:// 탭 경유 테이블 삽입
- **조건**: CDP, /tmp에 HTML 파일 준비
- **순서**: file:// 열기 → Cmd+A → Cmd+C → Docs 탭 전환 → Cmd+V
- **재현성**: 조건부 100% (Phase 3 검증)
- **실패 조건**: navigate()로 페이지 전환 시 클립보드 초기화

## GP-004: Google Docs 찾기/바꾸기 텍스트 교체
- **조건**: CDP, Docs 편집 모드
- **순서**: Cmd+Shift+H → JS nativeInputValueSetter로 필드 값 설정 → Replace All
- **재현성**: 100% (Phase 3 검증, 30건+)
- **실패 조건**: type_text() 사용 시 본문 삽입 사고 (CASE-006 네이버 선택 불가와 유사 패턴)
```

Phase 3 성공 패턴 + README.md 히스토리를 읽고 추가 GP 발굴 시 등록.

### 4. CDPDebugLogger — cdp_utils.py 추가

`scripts/tools/cdp_utils.py` (정본)에 `CDPDebugLogger` 클래스 추가.

**요구사항:**
- JSONL 어펜드 방식 (`PF_CDP/debug_log/YYYY-MM-DD_디바이스_에이전트_주제.jsonl`)
- 옵셔널 주입 — `CDP(port=9222, logger=logger)` 형태. logger 미지정 시 기록 안 함 (기존 호환)
- 기록 대상: `_send()` 호출 (method, params, result, duration_ms, error), key event, evaluate, paste
- 각 레코드: `{"ts": "ISO8601", "type": "send|key|eval|paste", "method": "...", "result_sample": "...", "duration_ms": N, "error": null}`
- `print_recent_cases(log_dir, n=5)` 스탠드얼론 함수 — 최근 N건 로그 파일의 에러 요약 출력

**주의:**
- 기존 `CDP` 클래스의 `_send` 메서드 시그니처 변경 최소화
- `MonkosEditor` 등 기존 사용처 영향 없어야 함
- PF_CDP 정본 `cdp_utils.py`와 `scripts/tools/cdp_utils.py` 동일 파일 유지 (심링크 또는 복사 동기화)

### 5. editor_adapters/ — Google Docs 어댑터

`monkos-ops/ops/portfolios/PF_CDP/editor_adapters/google_docs.md` 신규 생성.

Phase 3 발견사항 + CASE-013 + SPREAD_DEPLOY_MANUAL §3 Google Docs 관련 내용 통합:

```markdown
# Google Docs — CDP 에디터 어댑터

## 특성
- Canvas 렌더링 (DOM 직접 접근 제한)
- 입력 수신: `docs-texteventtarget-iframe` 내부 textarea
- Accessibility 트리 빈도 높은 갱신 (AX 조회 비용 높음)

## 검증된 패턴 (골든패스 참조)
- GP-002: Clipboard API HTML write → Cmd+V
- GP-003: file:// 경유 테이블 삽입
- GP-004: 찾기/바꾸기 + nativeInputValueSetter

## 금지 패턴
- type_text() → 찾기 필드 포커스 불안정, 본문 삽입 사고
- navigate() 후 클립보드 사용 → OS 클립보드 초기화
- 외부 NSPasteboard 경유 paste → CASE-013 (미해결)
- Apps Script OAuth 팝업 → CDP 브라우저 팝업 차단

## 미해결
- CASE-013: 외부 클립보드 주입 실패 원인 미확정
```

추가로 `monkos_editor.md` 스켈레톤도 함께 생성 (MonkosEditor 클래스 기반, 가장 안정적 패턴).

### 6. PF_CDP/README.md 갱신

히스토리 섹션 끝에 다음 추가:

```markdown
### Phase 4 — 적립 체계 구조화 (2026-04-17, iMac/쌍아→막내)

**배경**: 작가님 지적 — "매번 다른 지점에서 막힌다". 기록은 있으나 구조화·검색·참조 루틴 부재.

**5축 체계 구축**:
1. **막힘 트리거 체크리스트** — 장애 감지 시 PF_CDP grep 의무화
2. **CDPDebugLogger** — cdp_utils.py 자동 로깅 레이어
3. **case_studies.md** — 기존 §8 12건 migration + CASE-013 등록
4. **golden_paths.md** — 검증된 성공 패턴 인덱스
5. **editor_adapters/** — 플랫폼별 특성 분리 문서

**기안**: PROPOSAL_20260417_CDP적립체계_기안서 (민아)
```

파일 구성 테이블에 신규 파일 추가:

```markdown
| `case_studies.md` | 케이스 DB (append-only) | CASE-001~ |
| `golden_paths.md` | 검증된 성공 패턴 인덱스 | GP-001~ |
| `debug_log/` | 세션별 자동 디버그 로그 | JSONL |
| `editor_adapters/` | 에디터별 특성·제약 문서 | 플랫폼별 |
```

그리고 **파일 구성 테이블 바로 아래**에 막힘 트리거 체크리스트 삽입:

```markdown
## 막힘 트리거 체크리스트

> 브라우저 자동화 예외·예상외 동작 포착 시 (키 이벤트 미반영, 클릭 무효, 타이핑 실패, DOM 비어 보임 등):

1. `PF_CDP/case_studies.md` grep (증상 키워드 기반)
2. `PF_CDP/golden_paths.md` 에서 대상 에디터 성공 패턴 확인
3. `PF_CDP/editor_adapters/{에디터}.md` 금지 패턴 확인
4. 일치 케이스 있으면 해당 해법 적용
5. 일치 없으면 `case_studies.md` 에 신규 CASE 등록 후 조사
6. **가설 세우기 전에 1~3 선행. "원리상 불가" 같은 큰 결론으로 뛰기 금지**
```

---

## ⚠️ 준수 조항

- **헌법 3조 2항**: PF 히스토리 append-only. 기존 Phase 0~3 내용 수정/삭제 금지
- **정본 단일 원칙 (3조 4항)**: `cdp_utils.py` 정본은 `scripts/tools/`. PF_CDP 내 파일은 심링크 또는 참조
- **SPREAD_DEPLOY_MANUAL §8**: migration 후에도 원본 유지. 상호 참조 링크 추가 ("상세: case_studies.md CASE-001~012 참조")
- case_studies.md, golden_paths.md 모두 **append-only, 삭제 금지**

---

## 완료 기준

- [ ] `PF_CDP/debug_log/`, `PF_CDP/editor_adapters/` 디렉토리 존재
- [ ] `case_studies.md` — CASE-001~013 등록 (§8 12건 migration + 오늘 실패건)
- [ ] `golden_paths.md` — GP-001~004 이상 등록
- [ ] `cdp_utils.py` — CDPDebugLogger 클래스 + print_recent_cases() 함수 추가
- [ ] `editor_adapters/google_docs.md` + `monkos_editor.md` 생성
- [ ] `README.md` — Phase 4 히스토리 + 파일 구성 + 막힘 트리거 체크리스트 추가
- [ ] SPREAD_DEPLOY_MANUAL §8 하단에 "상세: case_studies.md 참조" 링크 추가

---

📁 참조 파일:
- 기안서: `monkos-ops/ops/proposals/PROPOSAL_20260417_CDP적립체계_기안서.md`
- PF_CDP 정본: `monkos-ops/ops/portfolios/PF_CDP/`
- SPREAD_DEPLOY_MANUAL: `monkos-ops/ops/portfolios/PF_CDP/SPREAD_DEPLOY_MANUAL.md`
- cdp_utils.py 정본: `scripts/tools/cdp_utils.py`

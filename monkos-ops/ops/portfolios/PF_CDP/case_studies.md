# CDP 케이스 스터디 DB

> append-only. 번호 순차 증가. 삭제 금지.
> 장애 감지 시 증상 키워드로 grep하여 기존 해법 참조.

---

## CASE-001 ~ CASE-012: SPREAD_DEPLOY_MANUAL §8 migration

> 원본: [SPREAD_DEPLOY_MANUAL.md §8](./SPREAD_DEPLOY_MANUAL.md) — 원본 유지, 상호 참조.

---

### CASE-001: React controlled input 무반응

- **일시**: Phase 1 이전
- **에이전트**: iMac/민아
- **대상**: GitHub Issues (React 기반 폼)
- **증상**: `value` 세팅해도 UI 안 바뀜. React 상태와 DOM 불일치.
- **조건**: React controlled input에 JS로 `.value` 직접 설정 시
- **원인**: React가 자체 가상 DOM 상태를 관리하므로, 직접 value 세팅은 React 상태에 반영 안 됨
- **해결**: 클릭 + `Input.insertText` 방식으로 입력. React가 입력 이벤트를 정상 감지함
- **재현성**: 100%
- **태그**: react, value, insertText, controlled-input, github

---

### CASE-002: ProseMirror 0x0 좌표

- **일시**: Phase 1 이전
- **에이전트**: iMac/민아
- **대상**: MONKOS 어드민 에디터 (Toast UI / ProseMirror)
- **증상**: `getBoundingClientRect()` → `{x:0, y:0, width:0, height:0}` 반환
- **조건**: ProseMirror 에디터 내 요소에 직접 좌표 쿼리 시
- **원인**: ProseMirror 에디터의 내부 노드가 가상 위치를 가짐
- **해결**: `ww-container` 좌표(674, 500 근처)로 직접 클릭
- **재현성**: 100%
- **태그**: prosemirror, bounding, coordinates, toastui, getBoundingClientRect

---

### CASE-003: X 댓글 모달 미작동

- **일시**: Phase 1 이전
- **에이전트**: iMac/민아
- **대상**: X (Twitter)
- **증상**: 댓글 버튼 CDP 클릭 시 모달이 뜨지 않음
- **조건**: 타임라인에서 댓글 아이콘 클릭 시
- **원인**: X 모달 시스템이 CDP 이벤트에 반응하지 않음 (네이티브 클릭 이벤트 요구)
- **해결**: 트윗 상세 페이지 진입 후 댓글 영역에서 직접 타이핑. 타임스탬프 링크로 상세 페이지 이동
- **재현성**: 100%
- **태그**: twitter, x, modal, comment, reply

---

### CASE-004: note.com insertText 무반응

- **일시**: Phase 1 이전
- **에이전트**: iMac/민아
- **대상**: note.com
- **증상**: `Input.insertText`, `document.execCommand('insertText')` 둘 다 텍스트 미삽입
- **조건**: note.com contenteditable 에디터에 타이핑 시도 시
- **원인**: note.com 에디터가 표준 입력 이벤트를 무시하고 자체 입력 처리 사용
- **해결**: `ClipboardEvent('paste')` + `DataTransfer.setData('text/plain', ...)` 방식으로 텍스트 주입
- **재현성**: 100%
- **태그**: note, typing, paste, clipboard, insertText, execCommand

---

### CASE-005: hidden file input nodeId 0

- **일시**: Phase 1 이전
- **에이전트**: iMac/민아
- **대상**: 미디움 이미지 업로드
- **증상**: `DOM.querySelector` 반환 nodeId가 0. `DOM.setFileInputFiles` 실패
- **조건**: hidden `<input type="file">` 요소에 파일 업로드 시
- **원인**: hidden 요소의 nodeId가 정상 반환되지 않음 (크롬 버그/제한)
- **해결**: `Runtime.evaluate` → `DOM.describeNode(objectId)` → `backendNodeId` 방식으로 우회
- **재현성**: 100%
- **태그**: file, upload, nodeId, backendNodeId, hidden-input, medium

---

### CASE-006: 네이버 텍스트 선택 불가

- **일시**: Phase 1 이전
- **에이전트**: iMac/민아
- **대상**: 네이버 블로그 (SmartEditor)
- **증상**: CDP 마우스 드래그, 키보드 Shift+Arrow 등으로 텍스트 선택 안 됨
- **조건**: 네이버 SmartEditor에서 서식 적용을 위해 텍스트 선택 시도 시
- **원인**: SmartEditor가 자체 선택 모델 사용. CDP 이벤트 기반 선택과 호환 안 됨
- **해결**: 서식(H2/볼드/링크) 적용 불가 인정. 기호(■, ▶ 등)로 대체하거나 수동 마감
- **재현성**: 100%
- **태그**: naver, selection, drag, smarteditor, format

---

### CASE-007: EN글에 KR이미지 불일치

- **일시**: Phase 1 이전
- **에이전트**: iMac/민아
- **대상**: 다국어 포스트 SPREAD 배포
- **증상**: 영어 포스트에 한국어 이미지 삽입, 또는 그 반대
- **조건**: 다국어 배포 시 이미지 파일 할당 실수
- **원인**: 에이전트의 이미지-언어 매칭 검증 누락
- **해결**: 발행 전 검수 체크리스트 #4 (이미지-언어 일치 확인) 필수 수행
- **재현성**: 조건부 (검수 누락 시)
- **태그**: language, image, mismatch, multilingual, spread

---

### CASE-008: setHTML 에디터 굳음

- **일시**: Phase 1 이전
- **에이전트**: iMac/민아
- **대상**: MONKOS 어드민 에디터 (Toast UI)
- **증상**: `setHTML` 후 에디터가 편집 불가 상태로 굳음
- **조건**: Toast UI Editor에 `setHTML()`로 본문 삽입 시
- **원인**: `setHTML`이 에디터 내부 상태를 불완전하게 갱신하여 ProseMirror 상태 불일치
- **해결**: `setMarkdown()` 사용 권장. 마크다운으로 넣으면 에디터가 정상 파싱하여 상태 유지
- **재현성**: 조건부 (HTML 구조 복잡도에 따라)
- **태그**: setHTML, frozen, setMarkdown, toastui, prosemirror, editor-state

---

### CASE-009: 탭 동시 접속 충돌

- **일시**: Phase 1 이전
- **에이전트**: 복수 에이전트
- **대상**: 동일 브라우저 탭
- **증상**: 두 에이전트가 같은 탭에서 동시 타이핑 → 입력 혼선, 예측 불가 동작
- **조건**: 동일 WebSocket 타겟에 복수 에이전트 동시 접속
- **원인**: CDP WebSocket은 단일 타겟에 대한 동시 제어를 직렬화하지 않음
- **해결**: 채널별 탭 배당으로 분리. 에이전트당 전용 포트(9222~9225) 사용
- **재현성**: 100% (동시 접속 시)
- **태그**: tab, conflict, concurrent, multi-agent, port

---

### CASE-010: API 직접 호출 쿠키 인증 실패

- **일시**: Phase 1 이전
- **에이전트**: iMac/민아
- **대상**: MONKOS 어드민 API
- **증상**: `curl`로 API 직접 호출 시 인증 실패 (401/403)
- **조건**: CDP 브라우저 세션의 쿠키 없이 직접 API 호출 시
- **원인**: 서버 세션 쿠키가 CDP 크롬에만 존재. 외부 curl에 전달 안 됨
- **해결**: `Network.getCookies`로 CDP 브라우저에서 쿠키 추출 → curl 헤더에 전달
- **재현성**: 100%
- **태그**: api, cookie, auth, curl, Network.getCookies

---

### CASE-011: 스크린샷 크기 초과

- **일시**: Phase 1 이전
- **에이전트**: iMac/민아
- **대상**: CDP 스크린샷 → Claude API 전송
- **증상**: "image dimensions exceed max allowed size: 2000 pixels" 에러
- **조건**: `deviceScaleFactor:2` 이상으로 고해상도 스크린샷 캡처 후 Claude API에 전송 시
- **원인**: Claude API 이미지 크기 제한 (2000px 초과)
- **해결**: `deviceScaleFactor:1`로 낮추거나, `clip`으로 영역 제한, 또는 스크린샷 대신 DOM `innerText`로 확인
- **재현성**: 조건부 (고해상도 설정 시)
- **태그**: screenshot, dimensions, deviceScaleFactor, claude-api, image-size

---

### CASE-012: LINE broadcast URL 404

- **일시**: Phase 1 이전
- **에이전트**: iMac/민아
- **대상**: LINE Official Account Manager
- **증상**: broadcast/create 페이지 URL 직접 접근 시 404
- **조건**: LINE 메시지 작성 URL을 `Page.navigate`로 직접 이동 시
- **원인**: LINE Manager SPA가 직접 URL 진입을 지원하지 않음 (사이드바 내비게이션 필수)
- **해결**: 사이드바 "새 전체 메시지" 클릭으로 접근. 또는 정확한 URL: `manager.line.biz/account/@208xpvko/broadcast/create`
- **재현성**: 100%
- **태그**: line, broadcast, 404, sidebar, spa, navigation

---

## 신규 케이스

---

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

---

### CASE-014: addScriptToEvaluateOnNewDocument 무효 + Page.enable 시 응답 오염 (cdp_utils)

- **일시**: 2026-07-25 15:20 KST
- **에이전트**: iMac/막내2
- **대상**: 자체 서비스 (specs 퍼널 dev 검증)
- **증상**: ① `Page.addScriptToEvaluateOnNewDocument`로 콘솔 수집기를 주입했는데 페이지에서 `typeof window.__errs === 'undefined'` ② `Page.enable` 호출 시 `cdp.url()`·`evaluate()`가 `{}` 등 엉뚱한 값 반환
- **조건**: `scripts/tools/cdp_utils.py`의 `CDP._send()` 사용. 이 메서드는 send 직후 `recv()` **1회**로 응답을 읽는다
- **원인**:
  - ① Page 도메인 미활성 상태에서는 addScriptToEvaluateOnNewDocument가 등록되어도 주입되지 않음
  - ② Page/Runtime/Log 도메인을 켜면 이벤트 메시지가 응답 자리에 먼저 도착 → id 매칭 없이 읽으므로 결과가 뒤엉킴
- **위험**: 수집기가 주입되지 않은 채 `window.__errs || []`를 읽으면 **항상 빈 배열** → "콘솔 에러 0건"이 거짓 합격으로 보고된다. 검증 게이트가 무력화되는 유형
- **해결**: 이벤트/응답을 분리하는 리더 태스크 기반 클라이언트로 대체. 사본: `PF_CDP/tools/monkcdp.py` (id→future 매칭, 이벤트는 별도 큐 적재 후 `console_problems()`로 추출)
- **재현성**: 100%
- **태그**: cdp_utils, addScriptToEvaluateOnNewDocument, Page.enable, 응답오염, 콘솔수집, 거짓합격

---

### CASE-015: CDP 크롬에서 GA4 /g/collect 일괄 ERR_ABORTED — 계측 도달 검증 불가

- **일시**: 2026-07-25 15:53 KST
- **에이전트**: iMac/막내2
- **대상**: monkos.ai (prod) + monkos-portal-dev
- **증상**: gtag 라이브러리는 200으로 로드되나 `https://analytics.google.com/g/collect` 요청이 전부 `net::ERR_ABORTED`. GA4 실시간 리포트 카운트도 증가하지 않음
- **조건**: `cdp_setup.sh start {포트}`로 띄운 크롬. 프로필 9224·9225 양쪽 동일. `curl`로 같은 엔드포인트 POST 시 **204 정상** → 머신 네트워크 문제 아님
- **원인**: 미확정 (CDP 부착 크롬에서 keepalive/beacon 전송이 중단되는 것으로 추정)
- **핵심**: **prod(무변경 코드)에서도 동일 증상** → 특정 배포·코드의 결함이 아니라 CDP 환경 요인으로 확정
- **해결**: 미해결. 우회 = 코드 레벨 검증으로 대체
  - `Network.requestWillBeSent`의 `postData`에서 `en`(이벤트명)·`ep.*`(파라미터) 실측 → 페이로드 정확성까지는 CDP로 증명 가능
  - **GA4 실제 수신 확인은 사람의 실브라우저 1회 조작 필요**
- **재현성**: 100% (프로필 2종 × dev/prod 4회)
- **태그**: ga4, gtag, collect, ERR_ABORTED, 계측검증, 실브라우저필요

---

### CASE-016: cdp_utils._send 가 이벤트 스트림과 응답을 구분하지 않아 모든 결과가 한 칸씩 밀림

- **일시**: 2026-09-19 13:15 KST
- **에이전트**: iMac/막내1
- **대상**: `scripts/tools/cdp_utils.py` (CDP 클래스 전반)
- **증상**: `Page.enable` 이후 모든 `evaluate()` 반환값이 `{}` 또는 직전 호출의 결과. `DOM.getDocument` 결과에 `root` 키가 없다는 `KeyError: 'root'` 로 터짐
- **조건**: 이벤트를 발생시키는 도메인을 enable 한 뒤(`Page.enable`, `Network.enable` 등) 명령을 연속 전송할 때. 100% 재현
- **원인**: `_send()` 가 `resp = json.loads(await self.ws.recv())` 로 **다음 메시지 1건을 곧 응답으로 가정**한다. CDP는 응답과 이벤트를 같은 소켓으로 섞어 보내므로, 이벤트가 하나 끼면 이후 모든 응답이 어긋난다
- **해결**: 보낸 메시지의 `id` 와 일치하는 메시지가 올 때까지 드레인한다(이벤트는 별도 버퍼에 적재)
  ```python
  await ws.send(json.dumps({"id": mid, "method": m, "params": p}))
  while True:
      msg = json.loads(await ws.recv())
      if msg.get("id") == mid: return msg.get("result", {})
      if "method" in msg: events.append(msg)   # 이벤트는 버린다/모은다
  ```
  본 세션에서는 최소 클라이언트(`CDPX`)로 우회했다. **cdp_utils 본체 수정은 쌍아 소관(막내 범위 밖)** — 개정 청구 대상
- **회피(수정 전까지)**: 이벤트 도메인을 enable 하지 않는다. 네트워크 계측이 필요하면 `Page.addScriptToEvaluateOnNewDocument` 로 페이지 안에서 `fetch` 를 래핑해 수집하고, GA4는 `window.dataLayer` 를 직접 읽는다(gtag는 함수 선언이라 접근자 후킹이 통하지 않는다 — CASE-015 보완)
- **재현성**: 100% (뷰포트 4종 × 2회)
- **태그**: cdp_utils, _send, 이벤트, 응답밀림, Page.enable, dataLayer, gtag

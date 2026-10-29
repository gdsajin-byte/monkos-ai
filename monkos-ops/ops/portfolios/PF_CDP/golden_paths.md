# CDP 골든패스 (검증된 성공 패턴)

> 검증된 조건부 100% 성공 패턴만 기록. 실패 조건도 함께 명시.
> append-only. 삭제 금지.

---

## GP-001: MONKOS 블로그 에디터 포스트 작성

- **조건**: CDP 9222, 로그인된 /admin 세션
- **순서**: navigate → set_title → editor_set_markdown → publish
- **재현성**: 100% (Phase 0~1 이후 N회)
- **실패 조건**: 로그인 세션 만료, 에디터 로딩 전 set_title 호출
- **참조**: CASE-008 (setHTML 금지 → setMarkdown 사용)

---

## GP-002: Google Docs 내부 Clipboard API HTML write

- **조건**: CDP, 편집 모드 활성, 같은 탭 내
- **순서**: `navigator.clipboard.write([new ClipboardItem({'text/html': blob})]) → Cmd+V`
- **재현성**: 조건부 100% (Phase 3 검증)
- **실패 조건**: navigate()로 페이지 전환 시 OS 클립보드 초기화
- **참조**: CASE-013 주의 (외부 NSPasteboard 경유는 실패)

---

## GP-003: Google Docs file:// 탭 경유 테이블 삽입

- **조건**: CDP, /tmp에 HTML 파일 준비
- **순서**: `file:// 열기 → Cmd+A → Cmd+C → Docs 탭 전환 → Cmd+V`
- **재현성**: 조건부 100% (Phase 3 검증)
- **실패 조건**: navigate()로 페이지 전환 시 클립보드 초기화

---

## GP-004: Google Docs 찾기/바꾸기 텍스트 교체

- **조건**: CDP, Docs 편집 모드
- **순서**: `Cmd+Shift+H → JS nativeInputValueSetter로 필드 값 설정 → Replace All`
- **재현성**: 100% (Phase 3 검증, 30건+)
- **실패 조건**: type_text() 사용 시 본문 삽입 사고 (CASE-006 네이버 선택 불가와 유사 패턴)

---

## GP-005: X (Twitter) 타임라인 포스트 작성

- **조건**: CDP, X 로그인 세션 활성
- **순서**: `data-testid="tweetTextarea_0"` 좌표 클릭 → `Input.insertText` → `data-testid="tweetButtonInline"` 클릭
- **재현성**: 100% (Phase 1 이후 SPREAD 배포에서 반복 검증)
- **실패 조건**: 로그인 세션 만료, data-testid 셀렉터 변경 (드묾)
- **참조**: CASE-003 (댓글 모달은 안 됨 → 상세 페이지 진입)

---

## GP-006: 티스토리 iframe innerHTML 직접 주입

- **조건**: CDP, 티스토리 에디터 로그인 상태
- **순서**: `#post-title-inp` value 세팅 → `#editor-tistory_ifr` iframe contentDocument body.innerHTML 직접 주입
- **재현성**: 100% (가장 쉬운 채널)
- **실패 조건**: 에디터 로딩 전 접근, iframe cross-origin 이슈 (없음 — same origin)

---

## GP-007: 미디움 이미지 업로드 (backendNodeId 패턴)

- **조건**: CDP, 미디움 new-story 페이지 활성
- **순서**: + 버튼 → "Add an image" 클릭 → `Runtime.evaluate` objectId 취득 → `DOM.describeNode` → `backendNodeId` → `DOM.setFileInputFiles`
- **재현성**: 100%
- **실패 조건**: nodeId 직접 사용 시 0 반환 (CASE-005)
- **참조**: CASE-005 (hidden file input 우회 필수)

---

## GP-008: CDP 스크린샷 기반 썸네일 생성

- **조건**: CDP, about:blank 탭
- **순서**: `Page.setDocumentContent(HTML)` → `Emulation.setDeviceMetricsOverride(1280x670, scale:2)` → `Page.captureScreenshot(clip)` → base64 디코드 → 파일 저장
- **재현성**: 100%
- **실패 조건**: deviceScaleFactor:2 + 전체 페이지 캡처 시 Claude API 이미지 크기 초과 (CASE-011)

---

## GP-009: 디버그 크롬 주인 표시 (창 이름·테마 색·탭 그룹 칩)

- **조건**: Chrome 156(macOS), 포트별 user-data-dir 디버그 크롬. 10-29 iMac/쌍아 9229 시험(작가님 요청 — "탭이 아닌 크롬 자체에 누구 브라우저인지").
- **순서**:
  1. 기동 플래그 `--window-name="[9222] iMac/쌍아"` → 맥 창 목록·미션 컨트롤·Dock 메뉴에 창 이름. 탭 이동 후에도 유지(실측).
  2. 기동 플래그 `--enable-unsafe-extension-debugging` → 브라우저 WS로 `Extensions.loadUnpacked {path}` → 확장 id 반환.
  3. 테마 확장(manifest `theme.colors.frame`) → 창 테두리 색 변경(캡처 실측).
  4. 탭 그룹 확장(`permissions: tabs, tabGroups`, SW에서 묶이지 않은 탭을 `chrome.tabs.group` → `tabGroups.update{title,color}`, `tabs.onCreated`·`tabGroups.onRemoved` 때 재실행) → Claude in Chrome식 색 칩. `tabGroups.query` 실측 `["민아 · 9229","purple"]`, 창 이름에 "민아 · 9229 그룹에 속함".
- **재현성**: 1회 실측(시험 포트). 스크립트화 미착수 — 작가님 10-29 "메인 이슈 아님, 기록만".
- **실패 조건**:
  - `--load-extension`은 Chrome 156에서 무시됨(`--disable-features=DisableLoadExtensionCommandLineSwitch` 병용도 무시) → CDP `Extensions.loadUnpacked`만 동작.
  - 액션 배지(`chrome.action.setBadgeText`)는 퍼즐 메뉴 안에 숨음(고정 안 됨). 프로필 이름(`Local State` info_cache 프리셋)은 툴바에 안 뜨고 로그인 권유 칩이 자리 차지.
  - 탭 그룹 색은 크롬 9색 한정(grey·blue·red·yellow·green·pink·purple·cyan·orange).
  - `--enable-unsafe-extension-debugging`은 CDP로 확장 설치·제거를 허용 — 로컬(127.0.0.1) 전용 디버그 프로필 한정 사용.
- **적용 시 위치**: `scripts/tools/cdp_setup.sh start {포트} {주인}` 인자 확장(미구현).

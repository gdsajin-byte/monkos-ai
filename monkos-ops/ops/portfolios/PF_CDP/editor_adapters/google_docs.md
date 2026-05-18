# Google Docs — CDP 에디터 어댑터

## 특성

- Canvas 렌더링 (DOM 직접 접근 제한)
- 입력 수신: `docs-texteventtarget-iframe` 내부 textarea
- Accessibility 트리 빈도 높은 갱신 (AX 조회 비용 높음)
- 테이블 행 추가/삭제: CDP 우클릭 컨텍스트 메뉴 미작동 → HTML 테이블 통째 교체 또는 작가님 수동
- Apps Script OAuth 팝업: CDP 브라우저에서 팝업 차단

## 검증된 패턴 (골든패스 참조)

- **GP-002**: Clipboard API HTML write → Cmd+V (같은 탭 내에서)
- **GP-003**: file:// 경유 테이블 삽입 (Cmd+A/C → Docs 탭 → Cmd+V)
- **GP-004**: 찾기/바꾸기 + nativeInputValueSetter (30건+ 검증)

## 금지 패턴

| 패턴 | 이유 | 참조 |
|------|------|------|
| `type_text()` → 찾기 필드 입력 | 포커스 불안정, 본문 삽입 사고 | Phase 3 교훈 |
| `navigate()` 후 클립보드 사용 | OS 클립보드 초기화 | Phase 3 교훈 |
| 외부 NSPasteboard 경유 paste | CDP 키 이벤트가 OS paste 미발화 | CASE-013 |
| Apps Script OAuth 팝업 | CDP 브라우저 팝업 차단 | Phase 3 |
| 테이블 행 추가/삭제 (우클릭 메뉴) | CDP 컨텍스트 메뉴 미작동 | Phase 3 |

## 검증된 입력 방식 우선순위

1. **찾기/바꾸기** (`Cmd+Shift+H` + `nativeInputValueSetter`) — 텍스트 교체에 가장 안정적
2. **Clipboard API** (`navigator.clipboard.write` → `Cmd+V`) — HTML 삽입 (같은 탭 필수)
3. **file:// 경유** — 테이블 등 복잡 HTML 삽입
4. **Google Docs API** — gcloud 토큰 scope 부족 (현실적 대안 아님)

## 미해결

- **CASE-013**: 외부 클립보드 주입 실패 원인 미확정
  - 가설: NSPasteboard ↔ Chrome 동기화 실패 / iframe 포커스 / Chromium 보안 모델 / 마크다운 설정
  - 작가님 반증: 2026-04-16 MD 풀 붙여넣기 성공 → 가설 3 단독 부정 가능성
  - 다음 조치: GP 성공 패턴 적용, file:// 경유, osascript 시도, 조건 매트릭스 완성

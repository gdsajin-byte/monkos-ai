# MONKOS 어드민 에디터 — CDP 에디터 어댑터

## 특성

- Toast UI Editor (ProseMirror 기반 WYSIWYG)
- ES 모듈 스코프로 에디터 인스턴스 비노출 → `import('./js/blog-editor.js')` 동적 노출 필요
- `cdp_utils.py`의 `MonkosEditor` 클래스가 전용 제어 API 제공

## 검증된 패턴 (골든패스 참조)

- **GP-001**: navigate → set_title → editor_set_markdown → publish (100% 안정)
- **GP-008**: CDP 스크린샷 기반 썸네일 생성

## 에디터 인스턴스 노출

```python
# MonkosEditor._ensure_editor() 내부 동작
await cdp._send("Runtime.evaluate", {
    "expression": "import('./js/blog-editor.js').then(m => { window.__editor = m.getEditor(); ... })",
    "awaitPromise": True
})
```

## 입력 방식

| 방식 | 안정성 | 비고 |
|------|--------|------|
| `editor_set_markdown(md)` | 100% | **정석** — 에디터 상태 정상 유지 |
| `editor_set_html(html)` | 불안정 | CASE-008 — 에디터 굳음 가능성 |
| `type_text()` (포커스 후) | 100% | 짧은 텍스트 추가 시 |
| `editor_exec('addTable', ...)` | 100% | 테이블 삽입 |

## 금지 패턴

| 패턴 | 이유 | 참조 |
|------|------|------|
| `setHTML()` 사용 | 에디터 상태 꼬임 → 편집 불가 | CASE-008 |
| 에디터 로딩 전 set_title 호출 | 셀렉터 미존재 에러 | GP-001 실패 조건 |
| ProseMirror 내부 노드 좌표 직접 사용 | getBoundingClientRect 0x0 | CASE-002 |

## 메타 필드 셀렉터

| 필드 | 셀렉터 | 방식 |
|------|--------|------|
| 제목 | `#title` | click → selectAll → type_text |
| 카테고리 | `#category` | fill (select) |
| 언어 | `#language` | fill |
| SEO 요약 | `#seo-description` | fill |
| 태그 | `#tags` | fill |
| URL 슬러그 | `#slug` | fill |

## MonkosEditor 클래스 (cdp_utils.py)

```python
async with MonkosEditor(port=9222) as ed:
    await ed.navigate("https://monkos.ai/admin/blog-edit.html")
    await ed.set_title("글 제목")
    await ed.set_category("AI")
    await ed.set_language("ko")
    await ed.editor_set_markdown("## 본문\n\n내용")
    await ed.save_draft()  # 임시저장
```

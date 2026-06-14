---
type: order
from: iMac/쌍아
to: iMac/막내2
date: 2026-04-05
subject: CDP 에디터 자동감지 — TinyMCE/Toast UI/ProseMirror/CKEditor/Quill
status: 대기
portfolio: PF_CDP
priority: critical
pf: PF_CDP
---

[2026-04-05 16:34 KST] iMac/쌍아 → iMac/막내2

# CDP 에디터 자동감지 + 입력 API

## 1. 문제

웹 에디터마다 입력 방식이 전부 다르다:
- Toast UI: `window.editor.setHTML()` 또는 `setMarkdown()`
- TinyMCE: `tinymce.activeEditor.setContent()`
- ProseMirror: `insertText` via dispatchEvent
- CKEditor: `window.CKEDITOR.instances[name].setData()`
- Quill: `quill.setContents()` 또는 `quill.setText()`
- 기본 contenteditable: `innerHTML` 직접

PageProfiler가 프로파일링 시 에디터 유형을 자동 감지하고, `smart_editor_write()` API로 통일해야 한다.

## 2. 작업

### A. 리서치 — 에디터 감지 시그니처

각 에디터의 글로벌 시그니처 조사:

```javascript
// 감지 우선순위 (민아 제안 기반)
1. window.tinymce?.activeEditor → TinyMCE
2. window.toastui?.Editor || window.__editor → Toast UI
3. document.querySelector('.ProseMirror') → ProseMirror
4. window.CKEDITOR → CKEditor 4
5. window.ClassicEditor || window.InlineEditor → CKEditor 5
6. document.querySelector('.ql-editor') → Quill
7. document.querySelector('[contenteditable="true"]') → 기본
```

### B. PageProfiler에 에디터 감지 추가

프로파일링 시 에디터 유형을 자동 감지하여 프로파일 JSON에 기록:

```python
# 프로파일 JSON에 추가
{
    "editors": [
        {
            "type": "tinymce",
            "selector": "#content_ifr",  # iframe 셀렉터
            "api": "tinymce.activeEditor.setContent(html)",
            "get_api": "tinymce.activeEditor.getContent()"
        }
    ]
}
```

### C. smart_editor_write() API 구현

```python
async def smart_editor_write(self, content: str, format: str = "html") -> bool:
    """프로파일 기반 에디터 자동 입력. 에디터 유형에 맞는 API 자동 선택."""
    profile = await self.profile()
    for editor in profile.get("editors", []):
        if editor["type"] == "tinymce":
            await self.cdp.evaluate(f"tinymce.activeEditor.setContent(`{content}`)")
        elif editor["type"] == "toastui":
            if format == "markdown":
                await self.cdp.evaluate(f"window.__editor.setMarkdown(`{content}`)")
            else:
                await self.cdp.evaluate(f"window.__editor.setHTML(`{content}`)")
        # ... 각 에디터별 분기
    return True
```

### D. 테스트

| 사이트 | 에디터 | 테스트 |
|--------|--------|--------|
| monkos.ai/admin/blog-edit.html | Toast UI | setMarkdown() |
| 티스토리 | TinyMCE | setContent() |
| (기타 에디터가 있는 사이트) | 해당 에디터 | 자동 감지 확인 |

## 3. 산출물

- `scripts/tools/cdp_utils.py` — PageProfiler에 에디터 감지 + smart_editor_write 추가
- 에디터별 감지 시그니처 + API 매핑 정리표

## 4. ⚠️ 준수 조항

- 기존 API 삭제 금지 — 순수 추가
- 기존 MonkosEditor 클래스는 유지 (하위 호환)
- 테스트 시 실제 발행 금지
- 외부 의존성 추가 금지

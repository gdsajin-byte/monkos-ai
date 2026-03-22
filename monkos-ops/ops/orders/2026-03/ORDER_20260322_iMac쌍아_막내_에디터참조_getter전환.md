---
type: order
from: iMac/쌍아
to: 막내1
date: 2026-03-22
status: 대기
priority: 긴급
---

# 지시서: editor 참조 — export let → getter 함수 전환

> **[2026-03-22 14:52 KST] iMac/쌍아 → 막내1**

## 근본 원인

콘솔에서 `[blog-image] editor 미초기화 — 재시도 대기`가 **66회** 반복. `editor`가 영원히 `undefined`.

ESM `export let editor`의 라이브 바인딩이 정상 동작하지 않는 것으로 판단. `blog-editor.js`에서 `editor = new toastui.Editor(...)` 할당 후에도 `blog-image.js`에서 import한 `editor`가 `undefined`로 남아있음.

## 수정

### 1. blog-editor.js — editor를 getter 함수로 제공

**현재 (11행):**
```javascript
export let editor;
```

**변경:**
```javascript
let editor;
export function getEditor() { return editor; }
```

`export let editor;` 라인 삭제. `getEditor()` 함수 추가. 기존에 `editor`를 직접 export하던 것을 함수로 감싸서 **호출 시점에 현재 값을 반환**.

**blog-editor.js 내부**에서 `editor`를 사용하는 부분은 그대로 (같은 모듈 스코프이므로).

### 2. blog-image.js — import 변경 + 전체 editor 참조 변경

**현재 (3행):**
```javascript
import { editor, updatePreview } from './blog-editor.js';
```

**변경:**
```javascript
import { getEditor, updatePreview } from './blog-editor.js';
```

그리고 파일 전체에서 `editor.` 사용하는 곳을 `getEditor().`로 교체:

- 53행: `const md = editor.getMarkdown();` → `const md = getEditor().getMarkdown();`
- 55행: `editor.setMarkdown(md + imgTag);` → `getEditor().setMarkdown(md + imgTag);`
- 192행: `const md = editor.getMarkdown();` → `const md = getEditor().getMarkdown();`
- 197행: `editor.setMarkdown(newMd);` → `getEditor().setMarkdown(newMd);`
- 203행: `editor.setMarkdown(fallbackMd);` → `getEditor().setMarkdown(fallbackMd);`
- 204행: `editor.setMarkdown(md);` → `getEditor().setMarkdown(md);`
- 284행: `editor.on('change', ...` → `getEditor().on('change', ...`

### 3. setupImageHandlers() — 재시도 로직 수정

**현재 (278~281행):**
```javascript
  if (!editor) {
    console.warn('[blog-image] editor 미초기화 — 재시도 대기');
    setTimeout(setupImageHandlers, 200);
    return;
  }
```

**변경:**
```javascript
  if (!getEditor()) {
    console.warn('[blog-image] editor 미초기화 — 재시도 대기');
    setTimeout(setupImageHandlers, 200);
    return;
  }
```

### 4. blog-edit.html — 캐시 버스팅

`?v=20260322m` → `?v=20260322n` (HTML도 바뀌므로 GFE 캐시 대응 필수)

**중요: blog-edit.html 자체의 GFE 캐시 문제가 있음.** HTML에도 캐시 버스팅을 걸 수 없으므로, 아래 확인 필수:

```bash
curl -s https://monkos.ai/admin/blog-edit.html | grep "v=20260322"
```

`20260322n`이 나와야 함. 구버전이 나오면 GFE 캐시가 아직 안 풀린 것.

## 커밋 + 배포

```bash
git add monkos_AI/portal/public/admin/js/blog-editor.js monkos_AI/portal/public/admin/js/blog-image.js monkos_AI/portal/public/admin/blog-edit.html
git commit -m "[fix] editor 참조 — export let → getEditor() getter 전환 (ESM 바인딩 문제 해소)"
cd monkos_AI/portal && ./deploy.sh prod
```

## 배포 후 검증

```bash
# HTML 캐시 버스팅 확인
curl -s https://monkos.ai/admin/blog-edit.html | grep "v=20260322"

# blog-image.js에 getEditor 반영 확인
curl -s https://monkos.ai/admin/js/blog-image.js | grep "getEditor"
```

브라우저에서:
1. 하드 리프레시
2. 콘솔에 `editor 미초기화 재시도` 경고가 **없거나 1~2회만** 나오는지
3. 확대뷰에서 "본문 삽입" 클릭 → 이미지 삽입되는지
4. 콘솔에 `[insertImage] 호출됨` 로그 확인

## ⚠️ 준수 조항
- 헌법 제1조 1항: 매 턴 타임스탬프
- 배포 후 작가님 확인 요청 필수

---
type: manual
date: 2026-03-27
author: iMac/민아
subject: SPREAD 배포 실전 매뉴얼 — 막내용 CDP 작업 내역서
related: PF_CDP, PF_SPREAD
version: 1.0
---

# SPREAD 배포 실전 매뉴얼 — 막내용

> 2026-03-27 민아 실전 세션에서 검증된 패턴만 수록.
> 추정·이론 없음. 전부 실행 완료된 코드.

---

## 0. 사전 조건

```bash
# CDP 크롬이 살아있는지 확인
curl -s http://127.0.0.1:9222/json | python3 -c "import sys,json; tabs=json.load(sys.stdin); print(f'{len(tabs)}개 탭 활성')"
```

- 9222 포트 크롬이 실행 중이어야 함 (죽어있으면 `scripts/tools/cdp_setup.sh start`)
- 각 채널 로그인 상태 유지 중 (작가님이 수동 로그인 완료)
- `websockets` 파이썬 패키지 설치됨

---

## 1. 탭 찾기 (공통 패턴)

모든 작업의 시작: **URL 패턴으로 탭 찾기**

```python
import subprocess, json

tabs = json.loads(subprocess.run(["curl", "-s", "http://127.0.0.1:9222/json"], capture_output=True, text=True).stdout)

# 채널별 탭 찾기
def find_tab(url_keyword):
    for t in tabs:
        if url_keyword in t['url'] and t.get('webSocketDebuggerUrl') and 'sw.js' not in t['url'] and 'blob:' not in t['url']:
            return t
    return None

# 예시
x_tab = find_tab('x.com')
tistory_tab = find_tab('tistory.com')
naver_tab = find_tab('blog.naver')
medium_tab = find_tab('medium.com')
github_tab = find_tab('github.com')
note_tab = find_tab('note.com')
monkos_tab = find_tab('monkos.ai/admin')
```

---

## 2. WebSocket 기본 패턴

```python
import asyncio, json, websockets

async def with_tab(ws_url, callback):
    async with websockets.connect(ws_url, max_size=10*1024*1024) as ws:
        return await callback(ws)

# JS 실행
async def evaluate(ws, expr, mid=1):
    await ws.send(json.dumps({"id":mid,"method":"Runtime.evaluate","params":{"expression":expr,"returnByValue":True}}))
    r = json.loads(await ws.recv())
    return r.get("result",{}).get("result",{}).get("value","")

# 클릭
async def click(ws, x, y, mid=99):
    await ws.send(json.dumps({"id":mid,"method":"Input.dispatchMouseEvent","params":{"type":"mousePressed","x":x,"y":y,"button":"left","clickCount":1}}))
    await ws.recv()
    await ws.send(json.dumps({"id":mid+1,"method":"Input.dispatchMouseEvent","params":{"type":"mouseReleased","x":x,"y":y,"button":"left","clickCount":1}}))
    await ws.recv()

# 타이핑
async def type_text(ws, text, mid=200):
    await ws.send(json.dumps({"id":mid,"method":"Input.insertText","params":{"text":text}}))
    await ws.recv()

# Enter
async def enter(ws, mid=300):
    await ws.send(json.dumps({"id":mid,"method":"Input.dispatchKeyEvent","params":{"type":"keyDown","key":"Enter","code":"Enter","windowsVirtualKeyCode":13}}))
    await ws.recv()
    await ws.send(json.dumps({"id":mid+1,"method":"Input.dispatchKeyEvent","params":{"type":"keyUp","key":"Enter","code":"Enter"}}))
    await ws.recv()
```

---

## 3. 채널별 글쓰기 패턴

### 3-1. MONKOS 어드민 (monkos.ai/admin)

**방식**: Toast UI Editor API — `setHTML` 또는 `setMarkdown`

```python
# 에디터 인스턴스 가져오기 (ES 모듈 스코프 우회)
await evaluate(ws, """(async function(){
    var m = await import('/admin/js/blog-editor.js');
    if(m.getEditor) window.__realEditor = m.getEditor();
})()""")
await asyncio.sleep(1)

# 마크다운으로 본문 설정
await evaluate(ws, f"window.__realEditor.setMarkdown({json.dumps(markdown_content)}); 'done'")

# 제목 설정
await evaluate(ws, f"""
    var t = document.querySelector('#title');
    t.value = {json.dumps(title)};
    t.dispatchEvent(new Event('input', {{bubbles:true}}));
""")

# 카테고리
await evaluate(ws, "document.querySelector('#category').value = 'AI'; document.querySelector('#category').dispatchEvent(new Event('change', {bubbles:true}));")

# 표 삽입
await evaluate(ws, "window.__realEditor.exec('addTable', {rowCount: 7, columnCount: 4});")
```

**⚠️ 주의**:
- `setHTML`로 넣으면 에디터 상태가 꼬여서 편집 불가 될 수 있음 → `setMarkdown` 권장
- ProseMirror `getBoundingClientRect`가 0x0 반환 → `ww-container` 좌표(674, 500 근처)로 클릭
- 작가님이 에디터를 먼저 클릭해야 포커스 잡히는 경우 있음

### 3-2. X (@MONKOS_AI)

**방식**: data-testid 셀렉터 + insertText

```python
# 타임라인 텍스트박스 찾기
pos = await evaluate(ws, """(function(){
    var tb = document.querySelector('[data-testid="tweetTextarea_0"]');
    if(!tb) {
        var divs = document.querySelectorAll('[contenteditable="true"][role="textbox"]');
        for(var d of divs) { var r = d.getBoundingClientRect(); if(r.width > 200) return JSON.stringify({x:r.x+50, y:r.y+15}); }
    }
    var r = tb.getBoundingClientRect();
    return JSON.stringify({x:r.x+50, y:r.y+15});
})()""")

# 클릭 + 타이핑
await click(ws, pos['x'], pos['y'])
await type_text(ws, "포스트 내용")

# Post 버튼
btn = await evaluate(ws, """(function(){
    var b = document.querySelector('[data-testid="tweetButtonInline"]');
    var r = b.getBoundingClientRect();
    return JSON.stringify({x:r.x+r.width/2, y:r.y+r.height/2});
})()""")
await click(ws, btn['x'], btn['y'])  # ⚠️ 작가님 승인 후에만!
```

**X 댓글 패턴** (모달 안 뜸 → 트윗 상세 페이지 진입):
```python
# 트윗 상세 페이지로 이동 (타임스탬프 링크)
link = await evaluate(ws, """(function(){
    var articles = document.querySelectorAll('article[data-testid="tweet"]');
    for(var a of articles) {
        var text = a.querySelector('[data-testid="tweetText"]');
        if(text && text.textContent.includes('검색어')) {
            var timeLink = a.querySelector('a[href*="/status/"] time');
            if(timeLink) return timeLink.parentElement.href;
        }
    }
})()""")
await ws.send(json.dumps({"id":1,"method":"Page.navigate","params":{"url":link}}))
# 3초 대기 → 댓글 영역 찾기 → insertText → Reply 버튼
```

**⚠️ 주의**:
- 댓글 버튼 클릭 시 모달이 CDP에서 안 뜸 → 반드시 트윗 상세 페이지 진입
- `data-testid`가 유일한 안정 셀렉터 — className은 해시값이라 수시 변경

### 3-3. 티스토리 (monkos.tistory.com)

**방식**: iframe 에디터 innerHTML 직접 주입 ✅ 가장 쉬움

```python
# 제목
await evaluate(ws, f"""
    var title = document.querySelector('#post-title-inp');
    title.value = {json.dumps(title)};
    title.dispatchEvent(new Event('input', {{bubbles:true}}));
""")

# 본문 (iframe)
await evaluate(ws, f"""
    var iframe = document.querySelector('#editor-tistory_ifr');
    var doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.querySelector('body').innerHTML = {json.dumps(html_body)};
""")

# 태그 (Enter로 추가)
tags = ['AI증명사진', '여권사진', 'MONKOS']
for tag in tags:
    await evaluate(ws, f"document.querySelector('#tagText').value = '{tag}'; document.querySelector('#tagText').dispatchEvent(new KeyboardEvent('keydown', {{key:'Enter', keyCode:13, bubbles:true}}));")
```

### 3-4. 네이버 블로그 (@monkos_ai)

**방식**: SmartEditor — 클릭 + insertText (서식/링크 불가)

```python
# 글쓰기 페이지 이동
await ws.send(json.dumps({"id":1,"method":"Page.navigate","params":{"url":"https://blog.naver.com/monkos_ai/postwrite"}}))
await asyncio.sleep(3)

# 제목 (se-title-text 영역 클릭)
await click(ws, 869, 250)  # se-title-text 좌표
await type_text(ws, title)

# 본문 (se-section-text 영역 클릭)
await click(ws, 869, 370)
# 단락별 Enter로 분리하며 입력
for para in paragraphs:
    if para == "":
        await enter(ws)
    else:
        await type_text(ws, para)
        await enter(ws)
```

**⚠️ 주의**:
- 텍스트 선택 → 프로퍼티 툴바 **불가** (CDP 마우스/키보드로 선택 안 됨)
- 서식(H2/볼드) 적용 불가 → 기호(■, ▶ 등)로 대체하거나 수동 마감 필요
- 링크 삽입 불가 → URL 텍스트로만 표기

### 3-5. 미디움 (@gdsajin)

**방식**: contenteditable + 클릭 타이핑

```python
# new-story 페이지
await ws.send(json.dumps({"id":1,"method":"Page.navigate","params":{"url":"https://medium.com/new-story"}}))
await asyncio.sleep(3)

# 제목 (graf--h3, 약 y=120)
await click(ws, 869, 120)
await type_text(ws, title)

# 본문 (graf--p, 약 y=180)
await click(ws, 869, 180)
for para in paragraphs:
    if para == "":
        await enter(ws)
    else:
        await type_text(ws, para)
        await enter(ws)
```

### 3-6. 깃헙 Issues (monkos-ai)

**방식**: React controlled input → 클릭 + insertText (value 세팅 안 먹힘!)

```python
await ws.send(json.dumps({"id":1,"method":"Page.navigate","params":{"url":"https://github.com/gdsajin-byte/monkos-ai/issues/new"}}))
await asyncio.sleep(3)

# 제목 (#_r_1_ 또는 placeholder="Title")
await click(ws, 731, 260)  # 제목 필드 좌표
await type_text(ws, title)

# 본문 (#_r_c_ 또는 placeholder="Type your description")
await click(ws, 731, 400)
await type_text(ws, markdown_body)

# Create 버튼
btn = await evaluate(ws, """(function(){
    var btns = document.querySelectorAll('button');
    for(var b of btns) { if(b.textContent.includes('Create')) { var r = b.getBoundingClientRect(); return JSON.stringify({x:r.x+r.width/2, y:r.y+r.height/2}); }}
})()""")
await click(ws, btn['x'], btn['y'])  # ⚠️ 승인 후에만!
```

**⚠️ 주의**: `value` 직접 세팅은 React가 무시함. 반드시 클릭+insertText.

### 3-7. note.com

**방식**: ClipboardEvent paste — insertText/execCommand 둘 다 안 먹힘!

```python
await evaluate(ws, f"""(function(){{
    var editor = document.querySelector('[contenteditable="true"][role="textbox"]');
    if(editor) {{
        editor.focus();
        var dt = new DataTransfer();
        dt.setData('text/plain', {json.dumps(text)});
        editor.dispatchEvent(new ClipboardEvent('paste', {{clipboardData: dt, bubbles: true}}));
        return 'pasted';
    }}
}})()""")
```

**⚠️ 주의**: 서식(H2/볼드) paste 미검증. HTML paste 가능 여부 탐색 필요.

---

## 4. 이미지 업로드 패턴

### 4-1. MONKOS 어드민 — API 직접 호출 (가장 확실)

```python
import subprocess

# 쿠키 가져오기 (에디터 탭에서)
# ... (CDP Network.getCookies)

# curl로 직접 업로드
result = subprocess.run([
    "curl", "-s", "-X", "POST",
    "https://monkos.ai/api/admin/upload",
    "-H", f"Cookie: {cookie_str}",
    "-F", "image=@/tmp/thumbnail.png;type=image/png",
], capture_output=True, text=True)

data = json.loads(result.stdout)
gcs_url = data["url"]
# → 이미지 뱅크에도 자동 등록됨
```

### 4-2. 미디움 — backendNodeId 패턴

```python
# + 버튼 클릭 → "Add an image" 클릭
# → hidden file input 활성화

# 1. DOM.enable
await ws.send(json.dumps({"id":1,"method":"DOM.enable"}))
await ws.recv()

# 2. objectId
await ws.send(json.dumps({"id":2,"method":"Runtime.evaluate","params":{"expression":"document.querySelector('input[name=\"uploadedFile\"]')"}}))
r = json.loads(await ws.recv())
obj_id = r["result"]["result"]["objectId"]

# 3. backendNodeId
await ws.send(json.dumps({"id":3,"method":"DOM.describeNode","params":{"objectId":obj_id}}))
r = json.loads(await ws.recv())
backend_id = r["result"]["node"]["backendNodeId"]

# 4. setFileInputFiles
await ws.send(json.dumps({"id":4,"method":"DOM.setFileInputFiles","params":{"backendNodeId":backend_id,"files":["/tmp/image.jpg"]}}))
await ws.recv()
# 5초 대기 → 이미지 자동 삽입
```

**⚠️ 주의**: `querySelector` nodeId가 0 반환되면 `DOM.describeNode` + `backendNodeId` 방식으로 우회.

### 4-3. 에디터 본문 이미지 삽입

```python
# Toast UI Editor API
await evaluate(ws, f"""(function(){{
    var ed = window.__realEditor;
    ed.moveCursorToStart();
    ed.exec('addImage', {{imageUrl: '{gcs_url}', altText: '설명'}});
}})()""")
```

---

## 5. 썸네일 자동 생성

### HTML → CDP 스크린샷

```python
# 1. about:blank 탭에서 HTML 렌더링
await ws.send(json.dumps({"id":1,"method":"Page.setDocumentContent","params":{"frameId":tab_id,"html":THUMB_HTML}}))

# 2. 뷰포트 설정 (1280x670 @2x)
await ws.send(json.dumps({"id":2,"method":"Emulation.setDeviceMetricsOverride","params":{"width":1280,"height":670,"deviceScaleFactor":2,"mobile":False}}))

# 3. 스크린샷
await ws.send(json.dumps({"id":3,"method":"Page.captureScreenshot","params":{"format":"png","clip":{"x":0,"y":0,"width":1280,"height":670,"scale":1}}}))

# 4. base64 디코딩 → 파일 저장
```

### 다국어 버전 (텍스트만 변경)

HTML 템플릿의 `title_line1`, `title_line2`, `subtitle`, `brand_sub`만 교체:
- KR: 한국어 제목 + "AI Photo Studio"
- JP: 일본어 제목 + "AI証明写真スタジオ"
- EN: 영어 제목 + "AI Photo Studio"

---

## 6. 발행 전 검수 체크리스트

| # | 항목 | 확인 방법 |
|---|------|----------|
| 1 | 제목 들어갔는지 | `document.querySelector('#title').value` |
| 2 | 본문 비어있지 않은지 | `ww-container innerText.length > 100` |
| 3 | 이미지 깨지지 않았는지 | `img` 태그 naturalWidth > 0 확인 |
| 4 | **이미지-언어 일치** | KR글에 KR이미지, JP글에 JP이미지, EN글에 EN이미지 |
| 5 | 카테고리 설정됐는지 | `#category` value 확인 |
| 6 | 링크 동작하는지 | `a[href]` URL 패턴 확인 |
| 7 | 썸네일 설정됐는지 | `#thumbnail` value 비어있지 않은지 |
| 8 | SEO 요약 입력됐는지 | `#seo-description` 또는 해당 필드 |

```python
# 검수 자동화 예시
checks = await evaluate(ws, """(function(){
    return JSON.stringify({
        title: document.querySelector('#title')?.value?.length > 0,
        body: document.querySelector('.toastui-editor-ww-container')?.innerText?.length > 100,
        thumbnail: document.querySelector('#thumbnail')?.value?.length > 0,
        category: document.querySelector('#category')?.value !== '',
        images: [...document.querySelectorAll('.toastui-editor-ww-container img')].every(img => img.naturalWidth > 0),
    });
})()""")
```

---

## 7. 채널별 발행 버튼

| 채널 | 발행 방법 | 승인 필요 |
|------|----------|:---:|
| MONKOS 어드민 | "발행" 버튼 (에디터 상단) | ✅ |
| X | `[data-testid="tweetButtonInline"]` 클릭 | ✅ |
| X 좋아요 | `[data-testid="like"]` 클릭 | 자율 |
| 티스토리 | 에디터 내 발행 버튼 | ✅ |
| 깃헙 | "Create" 버튼 | ✅ |
| 미디움 | "Publish" 버튼 | ✅ |
| 네이버 | 에디터 내 발행 버튼 | ✅ |
| note.com | "公開に進む" 버튼 | ✅ |

**✅ = 작가님 사전 승인 없이 발행 금지. 지시서에 명시된 채널만 자율 발행.**

---

## 8. 알려진 함정 (반드시 읽을 것)

| # | 함정 | 증상 | 해법 |
|---|------|------|------|
| 1 | React controlled input | `value` 세팅해도 UI 안 바뀜 | 클릭 + insertText |
| 2 | ProseMirror 0x0 | getBoundingClientRect → 0,0,0,0 | ww-container 좌표로 클릭 |
| 3 | X 댓글 모달 | CDP 클릭으로 모달 안 뜸 | 트윗 상세 페이지 진입 후 댓글 |
| 4 | note.com insertText | 타이핑 안 먹힘 | ClipboardEvent paste만 유효 |
| 5 | hidden file input | nodeId 0 반환 | backendNodeId 패턴 사용 |
| 6 | 네이버 텍스트 선택 | CDP 드래그/키보드 선택 안 됨 | 서식/링크 수동 마감 |
| 7 | EN글에 KR이미지 | 언어-이미지 불일치 | 검수 체크리스트 #4 |
| 8 | setHTML 에디터 굳음 | 편집 불가 상태 | setMarkdown 사용 권장 |
| 9 | 탭 동시 접속 충돌 | 같은 탭에 두 에이전트 타이핑 | 채널 배당으로 분리 |
| 10 | API 직접 호출 시 쿠키 | 인증 실패 | CDP Network.getCookies로 추출 |
| 11 | CDP 스크린샷 → Claude API 전송 시 크기 초과 | "image dimensions exceed max allowed size: 2000 pixels" | `deviceScaleFactor:1`로 낮추거나, 스크린샷 대신 DOM innerText로 확인. clip으로 영역 제한도 가능 |
| 12 | LINE 메시지 작성 URL 직접 접근 404 | broadcast/create 페이지 404 | 사이드바 "새 전체 메시지" 클릭으로 접근. 또는 정확한 URL: `manager.line.biz/account/@208xpvko/broadcast/create` |

> 📌 **상세**: 각 함정의 구조화된 케이스 기록은 [case_studies.md](./case_studies.md) CASE-001~012 참조.

---

## 9. 완료 보고 형식

```
✅ SPREAD 배포 완료
- X 포스트: [URL]
- 티스토리: [URL]
- 깃헙 Issue: [URL]
- 미디움: [URL]
❌ 네이버: 서식 수동 마감 필요
⚠️ note.com: 이미지 미삽입
```

---

*v1.0 — 2026-03-27 민아 실전 검증 기반. 실무 진행하며 지속 갱신.*

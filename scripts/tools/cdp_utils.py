"""
CDP Utils — Chrome DevTools Protocol 직접 제어 유틸리티
MONK.KR / PF_CDP Phase 1

크롬 확장 없이 디버깅 포트(9222)로 브라우저를 제어한다.
에이전트별 독립 인스턴스 운용 가능.

의존성: pip install websockets (단일)
사용법:
    from cdp_utils import CDP
    async with CDP() as cdp:
        await cdp.navigate("https://monkos.ai")
        await cdp.screenshot("/tmp/shot.png")
"""

import asyncio
import json
import base64
import subprocess
import os
import hashlib
import time
from typing import Optional
from contextlib import asynccontextmanager
from urllib.parse import urlparse

try:
    import websockets
except ImportError:
    raise ImportError("websockets 패키지 필요: pip install websockets")


class CDP:
    """Chrome DevTools Protocol 클라이언트"""

    def __init__(self, port: int = 9222, host: str = "127.0.0.1", tab_index: int = 0):
        self.port = port
        self.host = host
        self.tab_index = tab_index
        self.base_url = f"http://{host}:{port}"
        self.ws = None
        self._msg_id = 0

    # ── 연결 ──

    async def __aenter__(self):
        await self.connect()
        return self

    async def __aexit__(self, *args):
        await self.close()

    async def connect(self, tab_index: Optional[int] = None):
        """WebSocket 연결"""
        idx = tab_index if tab_index is not None else self.tab_index
        tabs = self._get_tabs()
        if idx >= len(tabs):
            raise IndexError(f"탭 인덱스 {idx} 없음 (총 {len(tabs)}개)")
        ws_url = tabs[idx]["webSocketDebuggerUrl"]
        self.ws = await websockets.connect(ws_url, max_size=10 * 1024 * 1024)
        return self

    async def close(self):
        """연결 종료"""
        if self.ws:
            await self.ws.close()
            self.ws = None

    async def switch_tab(self, tab_index: int):
        """탭 전환 (재연결)"""
        await self.close()
        self.tab_index = tab_index
        await self.connect()

    # ── 탭 조회 (동기) ──

    def _get_tabs(self) -> list:
        """HTTP로 탭 목록 조회"""
        result = subprocess.run(
            ["curl", "-s", f"{self.base_url}/json"],
            capture_output=True, text=True
        )
        return json.loads(result.stdout)

    def list_tabs(self) -> list:
        """탭 목록 반환 [{id, url, title, webSocketDebuggerUrl}]"""
        return self._get_tabs()

    def print_tabs(self):
        """탭 목록 출력"""
        for i, t in enumerate(self._get_tabs()):
            print(f"[{i}] {t['id'][:12]}  {t['url']}")

    # ── CDP 메시지 ──

    async def _send(self, method: str, params: dict = None) -> dict:
        """CDP 메시지 전송 + 응답 수신"""
        if not self.ws:
            raise RuntimeError("연결 안 됨. connect() 먼저 호출")
        self._msg_id += 1
        msg = {"id": self._msg_id, "method": method}
        if params:
            msg["params"] = params
        await self.ws.send(json.dumps(msg))
        resp = json.loads(await self.ws.recv())
        if "error" in resp:
            raise RuntimeError(f"CDP 에러: {resp['error']}")
        return resp.get("result", {})

    # ── JS 실행 ──

    async def evaluate(self, expression: str):
        """JS 실행 후 값 반환"""
        result = await self._send("Runtime.evaluate", {"expression": expression})
        val = result.get("result", {})
        if val.get("type") == "undefined":
            return None
        return val.get("value", val)

    async def evaluate_json(self, expression: str):
        """JS 실행 후 JSON 파싱된 값 반환"""
        val = await self.evaluate(expression)
        if isinstance(val, str):
            return json.loads(val)
        return val

    # ── 네비게이션 ──

    async def navigate(self, url: str):
        """URL 이동"""
        return await self._send("Page.navigate", {"url": url})

    async def reload(self):
        """페이지 새로고침"""
        return await self._send("Page.reload")

    async def wait(self, seconds: float = 1.0):
        """대기"""
        await asyncio.sleep(seconds)

    # ── 스크린샷 ──

    async def screenshot(self, path: str = "/tmp/cdp_screenshot.png",
                         clip: dict = None, quality: int = 80) -> str:
        """스크린샷 저장. clip={x,y,width,height,scale}"""
        params = {"format": "png", "quality": quality}
        if clip:
            params["clip"] = clip
        result = await self._send("Page.captureScreenshot", params)
        data = result.get("data", "")
        with open(path, "wb") as f:
            f.write(base64.b64decode(data))
        return path

    async def screenshot_area(self, path: str, x: int, y: int,
                               width: int, height: int, scale: int = 2) -> str:
        """영역 스크린샷"""
        return await self.screenshot(path, clip={
            "x": x, "y": y, "width": width, "height": height, "scale": scale
        })

    # ── 페이지 정보 ──

    async def title(self) -> str:
        """현재 탭 타이틀"""
        return await self.evaluate("document.title")

    async def url(self) -> str:
        """현재 URL"""
        return await self.evaluate("window.location.href")

    async def text(self) -> str:
        """페이지 전체 텍스트"""
        return await self.evaluate("document.body.innerText")

    async def html(self) -> str:
        """페이지 HTML"""
        return await self.evaluate("document.documentElement.outerHTML")

    # ── 마우스 ──

    async def click(self, x: int, y: int, button: str = "left", click_count: int = 1):
        """마우스 클릭 (CSS 픽셀 좌표)"""
        await self._send("Input.dispatchMouseEvent", {
            "type": "mousePressed", "x": x, "y": y,
            "button": button, "clickCount": click_count
        })
        await self._send("Input.dispatchMouseEvent", {
            "type": "mouseReleased", "x": x, "y": y,
            "button": button, "clickCount": click_count
        })

    async def double_click(self, x: int, y: int):
        """더블클릭"""
        await self.click(x, y, click_count=2)

    async def click_element(self, selector: str):
        """CSS 셀렉터로 요소 중앙 클릭"""
        rect = await self.evaluate_json(
            f"JSON.stringify(document.querySelector('{selector}').getBoundingClientRect())"
        )
        cx = int(rect["x"] + rect["width"] / 2)
        cy = int(rect["y"] + rect["height"] / 2)
        await self.click(cx, cy)

    async def click_text(self, text: str, tag: str = "*"):
        """텍스트 내용으로 요소 찾아 클릭"""
        rect = await self.evaluate_json(f"""
            (function() {{
                var els = document.querySelectorAll('{tag}');
                for (var el of els) {{
                    if (el.children.length === 0 && el.textContent.trim() === '{text}' && el.offsetWidth > 0) {{
                        var r = el.getBoundingClientRect();
                        return JSON.stringify({{x: r.x + r.width/2, y: r.y + r.height/2}});
                    }}
                }}
                return null;
            }})()
        """)
        if rect is None:
            raise ValueError(f"텍스트 '{text}' 요소를 찾을 수 없음")
        await self.click(int(rect["x"]), int(rect["y"]))

    # ── 키보드 ──

    async def type_text(self, text: str):
        """텍스트 입력 (한글/이모지 지원)"""
        await self._send("Input.insertText", {"text": text})

    async def press_key(self, key: str, modifiers: int = 0):
        """키 누르기. modifiers: 1=Alt, 2=Ctrl, 4=Meta, 8=Shift"""
        await self._send("Input.dispatchKeyEvent", {
            "type": "keyDown", "key": key, "code": key, "modifiers": modifiers
        })
        await self._send("Input.dispatchKeyEvent", {
            "type": "keyUp", "key": key, "code": key, "modifiers": modifiers
        })

    async def enter(self):
        """Enter 키"""
        await self.press_key("Enter")

    async def backspace(self, count: int = 1):
        """Backspace 키"""
        for _ in range(count):
            await self.press_key("Backspace")

    async def select_all(self):
        """Ctrl+A (전체 선택)"""
        await self.press_key("a", modifiers=4)  # Meta on Mac

    async def copy(self):
        """Ctrl+C"""
        await self.press_key("c", modifiers=4)

    async def paste(self):
        """Ctrl+V"""
        await self.press_key("v", modifiers=4)

    # ── 폼 입력 ──

    async def fill(self, selector: str, value: str):
        """입력 필드에 값 설정 (JS)"""
        escaped = json.dumps(value)
        await self.evaluate(f"""
            (function() {{
                var el = document.querySelector('{selector}');
                el.value = {escaped};
                el.dispatchEvent(new Event('input', {{bubbles: true}}));
                el.dispatchEvent(new Event('change', {{bubbles: true}}));
            }})()
        """)

    async def select(self, selector: str, value: str):
        """select 요소 값 설정"""
        await self.fill(selector, value)

    # ── 요소 탐색 ──

    async def find_element(self, selector: str) -> dict:
        """요소 정보 반환 {x, y, width, height, text, tag}"""
        return await self.evaluate_json(f"""
            (function() {{
                var el = document.querySelector('{selector}');
                if (!el) return null;
                var r = el.getBoundingClientRect();
                return JSON.stringify({{
                    x: r.x, y: r.y, width: r.width, height: r.height,
                    text: el.textContent.trim().substring(0, 100),
                    tag: el.tagName, visible: el.offsetWidth > 0
                }});
            }})()
        """)

    async def find_all_text(self, text: str) -> list:
        """텍스트 포함 요소 위치 목록"""
        return await self.evaluate_json(f"""
            (function() {{
                var results = [];
                var els = document.querySelectorAll('*');
                for (var el of els) {{
                    if (el.children.length === 0 && el.textContent.trim().includes('{text}') && el.offsetWidth > 0) {{
                        var r = el.getBoundingClientRect();
                        results.push({{x: r.x + r.width/2, y: r.y + r.height/2, text: el.textContent.trim().substring(0, 50), tag: el.tagName}});
                    }}
                }}
                return JSON.stringify(results);
            }})()
        """)

    async def wait_for(self, selector: str, timeout: float = 5.0) -> bool:
        """요소가 나타날 때까지 대기"""
        elapsed = 0
        while elapsed < timeout:
            exists = await self.evaluate(
                f"document.querySelector('{selector}') !== null"
            )
            if exists:
                return True
            await asyncio.sleep(0.3)
            elapsed += 0.3
        return False

    # ── 스크롤 ──

    async def scroll(self, x: int = 0, y: int = 300):
        """스크롤"""
        await self.evaluate(f"window.scrollBy({x}, {y})")

    async def scroll_to(self, selector: str):
        """요소가 보이도록 스크롤"""
        await self.evaluate(
            f"document.querySelector('{selector}').scrollIntoView({{behavior: 'smooth', block: 'center'}})"
        )

    async def scroll_top(self):
        """최상단으로"""
        await self.evaluate("window.scrollTo(0, 0)")

    async def scroll_bottom(self):
        """최하단으로"""
        await self.evaluate("window.scrollTo(0, document.body.scrollHeight)")

    # ── Accessibility Tree ──

    async def get_accessibility_tree(self, depth: int = 8, node_id: int = None) -> dict:
        """접근성 트리 반환. 크롬 확장의 read_page에 해당."""
        await self._send("Accessibility.enable", {})
        if node_id:
            result = await self._send("Accessibility.getPartialAXTree", {
                "nodeId": node_id, "fetchRelatives": True
            })
        else:
            result = await self._send("Accessibility.getFullAXTree", {"depth": depth})
        return result.get("nodes", [])

    async def read_page(self, interactive_only: bool = False, max_items: int = 200) -> list:
        """페이지 요소 목록 반환. 크롬 확장의 read_page 대응.
        각 요소: {ref, role, name, x, y, w, h, interactive}"""
        nodes = await self.get_accessibility_tree(depth=10)
        elements = []
        ref_id = 0

        for node in nodes:
            role = node.get("role", {}).get("value", "")
            name_obj = node.get("name", {})
            name = name_obj.get("value", "") if isinstance(name_obj, dict) else str(name_obj)

            # 인터랙티브 필터
            interactive_roles = {
                "button", "link", "textbox", "combobox", "checkbox",
                "radio", "tab", "menuitem", "switch", "searchbox",
                "spinbutton", "slider", "option"
            }
            is_interactive = role in interactive_roles

            if interactive_only and not is_interactive:
                continue
            if not name and role in ("generic", "none", "presentation", ""):
                continue

            ref_id += 1
            el = {
                "ref": f"ref_{ref_id}",
                "role": role,
                "name": name[:80],
                "interactive": is_interactive,
                "backend_node_id": node.get("backendDOMNodeId"),
            }
            elements.append(el)

            if len(elements) >= max_items:
                break

        return elements

    async def find_by_role(self, role: str, name: str = None) -> list:
        """역할+이름으로 요소 검색. 크롬 확장의 find 대응."""
        elements = await self.read_page()
        results = []
        for el in elements:
            if el["role"] != role:
                continue
            if name and name.lower() not in el["name"].lower():
                continue
            # 좌표 가져오기
            if el.get("backend_node_id"):
                try:
                    box = await self._get_node_box(el["backend_node_id"])
                    if box:
                        el.update(box)
                except Exception:
                    pass
            results.append(el)
        return results

    async def find_interactive(self, query: str = None) -> list:
        """인터랙티브 요소만 검색. query가 있으면 이름 필터."""
        elements = await self.read_page(interactive_only=True)
        if query:
            elements = [e for e in elements if query.lower() in e["name"].lower()]
        # 좌표 가져오기
        for el in elements:
            if el.get("backend_node_id"):
                try:
                    box = await self._get_node_box(el["backend_node_id"])
                    if box:
                        el.update(box)
                except Exception:
                    pass
        return elements

    async def _get_node_box(self, backend_node_id: int) -> dict:
        """backendNodeId로 요소 좌표 가져오기"""
        try:
            result = await self._send("DOM.getBoxModel", {
                "backendNodeId": backend_node_id
            })
            content = result.get("model", {}).get("content", [])
            if len(content) >= 8:
                x1, y1 = content[0], content[1]
                x2, y2 = content[4], content[5]
                return {
                    "x": int(x1), "y": int(y1),
                    "w": int(x2 - x1), "h": int(y2 - y1),
                    "cx": int((x1 + x2) / 2), "cy": int((y1 + y2) / 2)
                }
        except Exception:
            pass
        return None

    async def click_accessible(self, role: str, name: str):
        """접근성 트리에서 역할+이름으로 찾아 클릭. 좌표 계산 불필요."""
        results = await self.find_by_role(role, name)
        if not results:
            raise ValueError(f"요소 없음: role={role}, name={name}")
        el = results[0]
        if "cx" in el:
            await self.click(el["cx"], el["cy"])
        else:
            raise ValueError(f"좌표 없음: {el}")

    # ── 마우스 고급 ──

    async def hover(self, x: int, y: int):
        """마우스 호버 (클릭 없이 이동)"""
        await self._send("Input.dispatchMouseEvent", {
            "type": "mouseMoved", "x": x, "y": y
        })

    async def hover_element(self, selector: str):
        """셀렉터로 요소 호버"""
        rect = await self.evaluate_json(
            f"JSON.stringify(document.querySelector('{selector}').getBoundingClientRect())"
        )
        await self.hover(int(rect["x"] + rect["width"] / 2), int(rect["y"] + rect["height"] / 2))

    async def drag(self, start_x: int, start_y: int, end_x: int, end_y: int, steps: int = 10):
        """드래그앤드롭"""
        await self._send("Input.dispatchMouseEvent", {
            "type": "mousePressed", "x": start_x, "y": start_y, "button": "left", "clickCount": 1
        })
        for i in range(1, steps + 1):
            ratio = i / steps
            x = int(start_x + (end_x - start_x) * ratio)
            y = int(start_y + (end_y - start_y) * ratio)
            await self._send("Input.dispatchMouseEvent", {
                "type": "mouseMoved", "x": x, "y": y, "button": "left"
            })
            await asyncio.sleep(0.02)
        await self._send("Input.dispatchMouseEvent", {
            "type": "mouseReleased", "x": end_x, "y": end_y, "button": "left", "clickCount": 1
        })

    # ── 네트워크 모니터링 ──

    async def enable_network(self):
        """네트워크 이벤트 수신 시작"""
        await self._send("Network.enable", {})
        self._network_requests = []

    async def get_network_requests(self, url_filter: str = None) -> list:
        """수집된 네트워크 요청 반환"""
        # 이벤트 기반이 아닌 직접 조회 방식 (간소화)
        result = await self.evaluate("""
            (function() {
                var entries = performance.getEntriesByType('resource');
                return JSON.stringify(entries.map(e => ({
                    name: e.name, type: e.initiatorType,
                    duration: Math.round(e.duration),
                    size: e.transferSize || 0,
                    status: e.responseStatus || 0
                })));
            })()
        """)
        requests = json.loads(result) if isinstance(result, str) else result
        if url_filter:
            requests = [r for r in requests if url_filter in r["name"]]
        return requests

    # ── 콘솔 로그 ──

    async def get_console_logs(self, level: str = None) -> list:
        """브라우저 콘솔 로그 수집. level: log, warn, error, info"""
        result = await self.evaluate("""
            (function() {
                if (!window.__cdp_console_logs) {
                    window.__cdp_console_logs = [];
                    var orig = {};
                    ['log','warn','error','info','debug'].forEach(function(m) {
                        orig[m] = console[m];
                        console[m] = function() {
                            window.__cdp_console_logs.push({
                                level: m, time: Date.now(),
                                text: Array.from(arguments).map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
                            });
                            orig[m].apply(console, arguments);
                        };
                    });
                    return JSON.stringify([]);
                }
                var logs = window.__cdp_console_logs;
                window.__cdp_console_logs = [];
                return JSON.stringify(logs);
            })()
        """)
        logs = json.loads(result) if isinstance(result, str) else result
        if level:
            logs = [l for l in logs if l["level"] == level]
        return logs

    # ── 파일 업로드 ──

    async def upload_file(self, selector: str, file_paths: list):
        """파일 input에 파일 업로드"""
        # DOM.getDocument로 노드 ID 획득
        doc = await self._send("DOM.getDocument", {})
        root_id = doc["root"]["nodeId"]
        result = await self._send("DOM.querySelector", {
            "nodeId": root_id, "selector": selector
        })
        node_id = result["nodeId"]
        await self._send("DOM.setFileInputFiles", {
            "nodeId": node_id, "files": file_paths
        })

    # ── 탭 관리 ──

    async def new_tab(self, url: str = "about:blank") -> str:
        """새 탭 열기"""
        result = await self._send("Target.createTarget", {"url": url})
        return result.get("targetId", "")

    async def close_tab(self, target_id: str = None):
        """탭 닫기"""
        if target_id is None:
            tabs = self._get_tabs()
            target_id = tabs[self.tab_index]["id"]
        await self._send("Target.closeTarget", {"targetId": target_id})

    # ── PageProfiler 통합 ──

    @property
    def profiler(self) -> 'PageProfiler':
        """프로파일러 접근. 첫 호출 시 인스턴스 생성."""
        if not hasattr(self, '_profiler'):
            self._profiler = PageProfiler(self)
        return self._profiler

    async def click_smart(self, name: str) -> bool:
        """프로파일 기반 스마트 클릭 — 캐시 히트 시 즉시, 미스 시 프로파일링 후 클릭"""
        return await self.profiler.smart_click(name)


# ── PageProfiler — 런타임 자동 프로파일링 + 캐시 (PF_CDP Phase 2) ──


class PageProfiler:
    """페이지 자동 프로파일링 + 캐시.

    CDP DevTools API로 페이지 구조를 자동으로 읽어내고 캐싱한다.
    첫 방문 = 학습, 재방문 = 캐시 즉시 동작, 페이지 변경 = 자동 갱신.
    LLM 호출 불필요, 순수 CDP API만으로, 비용 ₩0.
    """

    CACHE_DIR = os.path.expanduser("~/.cache/cdp_profiles")
    CACHE_TTL = 86400 * 7  # 7일

    # JS: 인터랙티브 요소 수집 + DOM 구조 해시 (단일 평가로 왕복 최소화)
    _COLLECT_JS = """
(function() {
    // ── DOM 구조 해시 (태그+id 트리, 텍스트 무시) ──
    function structHash(el, d) {
        if (d > 6 || !el) return '';
        var s = el.tagName || '';
        if (el.id) s += '#' + el.id;
        var ch = el.children;
        if (ch) for (var i = 0; i < Math.min(ch.length, 30); i++) s += structHash(ch[i], d+1);
        return s;
    }
    var raw = structHash(document.body, 0);
    var h = 0;
    for (var i = 0; i < raw.length; i++) h = ((h << 5) - h + raw.charCodeAt(i)) | 0;
    var domHash = String(Math.abs(h));

    // ── 인터랙티브 요소 수집 ──
    var SEL = 'button,a[href],input,select,textarea,[role="button"],[role="link"],[role="textbox"],' +
              '[role="combobox"],[role="checkbox"],[role="radio"],[role="tab"],[role="menuitem"],' +
              '[role="switch"],[role="searchbox"],[onclick],[tabindex]:not([tabindex="-1"])';
    var allEls = document.querySelectorAll(SEL);
    var results = [];

    for (var idx = 0; idx < allEls.length && results.length < 500; idx++) {
        var el = allEls[idx];
        var cs = getComputedStyle(el);
        if (el.offsetWidth === 0 && el.offsetHeight === 0) continue;
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;

        var rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;

        var tag = el.tagName.toLowerCase();
        var role = el.getAttribute('role') || '';
        if (!role) {
            if (tag === 'button' || el.type === 'submit' || el.type === 'button') role = 'button';
            else if (tag === 'a') role = 'link';
            else if (tag === 'input') {
                var t = (el.type || 'text').toLowerCase();
                role = (t === 'checkbox') ? 'checkbox' : (t === 'radio') ? 'radio' : 'textbox';
            }
            else if (tag === 'select') role = 'combobox';
            else if (tag === 'textarea') role = 'textbox';
            else role = 'widget';
        }

        var name = el.getAttribute('aria-label')
            || (role !== 'textbox' && role !== 'combobox' ? el.textContent.trim().substring(0,80) : '')
            || el.getAttribute('placeholder') || el.getAttribute('title')
            || el.getAttribute('alt') || el.name || '';

        // ── 셀렉터 체인 ──
        var sels = [];
        if (el.id) sels.push('#' + CSS.escape(el.id));
        if (el.name && tag !== 'a') sels.push(tag + '[name="' + el.name + '"]');
        var tid = el.getAttribute('data-testid');
        if (tid) sels.push('[data-testid="' + tid + '"]');
        for (var ai = 0; ai < el.attributes.length && sels.length < 5; ai++) {
            var an = el.attributes[ai].name;
            if (an.startsWith('data-') && an !== 'data-testid') {
                sels.push('[' + an + '="' + el.attributes[ai].value.substring(0,60) + '"]');
            }
        }
        var ariaLabel = el.getAttribute('aria-label');
        if (ariaLabel) sels.push('[aria-label="' + ariaLabel + '"]');

        // 텍스트 폴백 (링크/버튼만)
        if (name && name.length < 50 && (role === 'button' || role === 'link')) {
            sels.push('text:' + name);
        }

        var primary = sels[0] || tag;
        var fallbacks = sels.slice(1);

        results.push({
            name: name.substring(0,80),
            role: role,
            tag: tag,
            selector: primary,
            fallback_selectors: fallbacks,
            box: {x:Math.round(rect.x), y:Math.round(rect.y), w:Math.round(rect.width), h:Math.round(rect.height)},
            visible: true,
            enabled: !el.disabled,
            href: el.href || null,
            placeholder: el.placeholder || null,
            input_type: el.type || null
        });
    }
    return JSON.stringify({domHash: domHash, elements: results});
})()
"""

    def __init__(self, cdp: 'CDP'):
        self.cdp = cdp
        os.makedirs(self.CACHE_DIR, exist_ok=True)

    # ── 공개 API ──

    async def profile(self, url: str = None, force: bool = False) -> dict:
        """현재 페이지 프로파일링. 캐시 히트 시 로드, 미스/변경 시 재생성."""
        if url is None:
            url = await self.cdp.url()

        cache_path = self._cache_path(url)

        if not force and os.path.exists(cache_path):
            cached = self._load_cache(cache_path)
            if cached:
                changed = await self._detect_change(cached)
                if not changed:
                    cached["_cache_hit"] = True
                    return cached

        profile = await self._build_profile(url)
        self._save_cache(cache_path, profile)
        profile["_cache_hit"] = False
        return profile

    async def smart_click(self, name: str) -> bool:
        """프로파일 기반 즉시 클릭. 풀스캔 불필요."""
        profile = await self.profile()
        name_l = name.lower()
        # actions → navigation 순서 탐색
        for pool in ("actions", "navigation"):
            for el in profile.get(pool, []):
                if name_l in el["name"].lower():
                    if await self._try_selectors(el):
                        return True
        return False

    async def smart_fill(self, name: str, value: str) -> bool:
        """프로파일 기반 입력 필드 즉시 채우기."""
        profile = await self.profile()
        name_l = name.lower()
        for inp in profile.get("inputs", []):
            match = (name_l in inp["name"].lower()
                     or name_l in (inp.get("placeholder") or "").lower())
            if match:
                for sel in [inp["selector"]] + inp.get("fallback_selectors", []):
                    if sel.startswith("text:"):
                        continue
                    try:
                        await self.cdp.fill(sel, value)
                        return True
                    except Exception:
                        continue
        return False

    async def smart_navigate(self, name: str) -> bool:
        """프로파일 기반 네비게이션 링크 즉시 클릭."""
        profile = await self.profile()
        name_l = name.lower()
        for nav in profile.get("navigation", []):
            if name_l in nav["name"].lower():
                if await self._try_selectors(nav):
                    return True
        return False

    def list_actions(self, profile: dict) -> str:
        """프로파일의 actions/inputs/navigation 요약 (디버그용)"""
        lines = []
        for cat in ("actions", "inputs", "navigation"):
            items = profile.get(cat, [])
            if items:
                lines.append(f"\n[{cat}] ({len(items)}개)")
                for i, el in enumerate(items[:20]):
                    lines.append(f"  {i}: [{el['role']}] {el['name'][:40]} → {el['selector'][:50]}")
        return "\n".join(lines)

    def invalidate(self, url: str = None):
        """캐시 무효화. url 없으면 전체 삭제."""
        if url:
            path = self._cache_path(url)
            if os.path.exists(path):
                os.remove(path)
        else:
            for f in os.listdir(self.CACHE_DIR):
                os.remove(os.path.join(self.CACHE_DIR, f))

    # ── 내부 구현 ──

    async def _build_profile(self, url: str) -> dict:
        """페이지 프로파일 생성 — CDP JS 일괄 수집 + 파싱"""
        parsed = urlparse(url)

        raw = await self.cdp.evaluate(self._COLLECT_JS)
        data = json.loads(raw) if isinstance(raw, str) else raw

        dom_hash = data.get("domHash", "0")
        elements = data.get("elements", [])

        actions = []
        inputs = []
        navigation = []

        for el in elements:
            role = el.get("role", "")
            entry = {
                "name": el["name"],
                "role": role,
                "selector": el["selector"],
                "fallback_selectors": el.get("fallback_selectors", []),
                "box": el.get("box"),
                "visible": el.get("visible", True),
                "enabled": el.get("enabled", True),
            }

            if role in ("textbox", "searchbox", "combobox"):
                entry["placeholder"] = el.get("placeholder", "")
                entry["input_type"] = el.get("input_type", "text")
                inputs.append(entry)
            elif role == "link" and el.get("href"):
                entry["href"] = el["href"]
                navigation.append(entry)
            else:
                actions.append(entry)

        profile = {
            "url": url,
            "domain": parsed.netloc,
            "path": parsed.path or "/",
            "title": await self.cdp.title(),
            "profiled_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "dom_hash": dom_hash,
            "actions": actions,
            "inputs": inputs,
            "navigation": navigation,
            "stats": {
                "total_elements": len(elements),
                "actions": len(actions),
                "inputs": len(inputs),
                "navigation": len(navigation),
            },
        }
        return profile

    async def _try_selectors(self, element: dict) -> bool:
        """셀렉터 체인 순회 — 첫 번째 성공하는 것으로 클릭"""
        selectors = [element["selector"]] + element.get("fallback_selectors", [])
        for selector in selectors:
            try:
                if selector.startswith("text:"):
                    text = selector[5:]
                    await self.cdp.click_text(text)
                    return True
                else:
                    await self.cdp.click_element(selector)
                    return True
            except Exception:
                continue
        # 좌표 폴백
        box = element.get("box")
        if box and box.get("w", 0) > 0:
            cx = box["x"] + box["w"] // 2
            cy = box["y"] + box["h"] // 2
            try:
                await self.cdp.click(cx, cy)
                return True
            except Exception:
                pass
        return False

    async def _detect_change(self, cached: dict) -> bool:
        """DOM 구조 해시 비교로 페이지 변경 감지"""
        try:
            current_hash = await self.cdp.evaluate("""
                (function() {
                    function h(el, d) {
                        if (d > 6 || !el) return '';
                        var s = el.tagName || '';
                        if (el.id) s += '#' + el.id;
                        var c = el.children;
                        if (c) for (var i = 0; i < Math.min(c.length, 30); i++) s += h(c[i], d+1);
                        return s;
                    }
                    var r = h(document.body, 0), v = 0;
                    for (var i = 0; i < r.length; i++) v = ((v << 5) - v + r.charCodeAt(i)) | 0;
                    return String(Math.abs(v));
                })()
            """)
            return str(current_hash) != str(cached.get("dom_hash", ""))
        except Exception:
            return True  # 에러 시 재프로파일링

    def _cache_path(self, url: str) -> str:
        """URL → 캐시 파일 경로"""
        parsed = urlparse(url)
        key = hashlib.md5(f"{parsed.netloc}{parsed.path}".encode()).hexdigest()[:12]
        safe_domain = parsed.netloc.replace(":", "_")
        return os.path.join(self.CACHE_DIR, f"{safe_domain}_{key}.json")

    def _load_cache(self, path: str) -> dict:
        """캐시 파일 로드. TTL 초과 시 None."""
        try:
            with open(path) as f:
                cached = json.load(f)
            if time.time() - cached.get("_cached_at", 0) > self.CACHE_TTL:
                return None
            return cached
        except Exception:
            return None

    def _save_cache(self, path: str, profile: dict):
        """캐시 파일 저장"""
        profile["_cached_at"] = time.time()
        with open(path, "w") as f:
            json.dump(profile, f, ensure_ascii=False, indent=2)


# ── MONKOS 에디터 특화 ──

class MonkosEditor(CDP):
    """MONKOS 어드민 블로그 에디터 제어 (Toast UI Editor + ProseMirror)"""

    EDITOR_SELECTOR = ".toastui-editor-ww-container .ProseMirror.toastui-editor-contents"
    _editor_exposed = False

    async def _ensure_editor(self):
        """Toast UI Editor 인스턴스를 window.__editor로 노출 (ES 모듈 스코프 우회)"""
        if self._editor_exposed:
            check = await self.evaluate("typeof window.__editor?.setMarkdown")
            if check == "function":
                return
        result = await self._send("Runtime.evaluate", {
            "expression": "import('./js/blog-editor.js').then(m => { window.__editor = m.getEditor(); return typeof window.__editor?.setMarkdown; })",
            "awaitPromise": True
        })
        val = result.get("result", {}).get("value", "")
        if val == "function":
            self._editor_exposed = True
        else:
            raise RuntimeError(f"에디터 인스턴스 노출 실패: {val}")

    async def editor_focus(self):
        """에디터 본문 포커스 (반드시 마우스 클릭 방식)"""
        rect = await self.evaluate_json(
            f"JSON.stringify(document.querySelector('{self.EDITOR_SELECTOR}').getBoundingClientRect())"
        )
        await self.click(int(rect["x"] + 100), int(rect["y"] + 20))
        await self.wait(0.2)

    async def editor_clear(self):
        """에디터 본문 비우기"""
        await self._ensure_editor()
        await self.evaluate("window.__editor.setHTML('<p><br></p>')")

    async def editor_set_html(self, html: str):
        """에디터 본문 HTML 일괄 삽입"""
        await self._ensure_editor()
        escaped = json.dumps(html)
        await self.evaluate(f"window.__editor.setHTML({escaped})")

    async def editor_set_markdown(self, md: str):
        """에디터 본문 마크다운 일괄 삽입"""
        await self._ensure_editor()
        escaped = json.dumps(md)
        await self.evaluate(f"window.__editor.setMarkdown({escaped})")

    async def editor_get_html(self) -> str:
        """에디터 현재 HTML 반환"""
        await self._ensure_editor()
        return await self.evaluate("window.__editor.getHTML()")

    async def editor_get_markdown(self) -> str:
        """에디터 현재 마크다운 반환"""
        await self._ensure_editor()
        return await self.evaluate("window.__editor.getMarkdown()")

    async def editor_exec(self, command: str, payload: dict = None):
        """에디터 명령 실행 (heading, bold, italic 등)"""
        await self._ensure_editor()
        if payload:
            escaped = json.dumps(payload)
            await self.evaluate(f"window.__editor.exec('{command}', {escaped})")
        else:
            await self.evaluate(f"window.__editor.exec('{command}')")

    async def editor_heading(self, level: int = 2):
        """H2, H3 등 제목"""
        await self.editor_exec("heading", {"level": level})

    async def editor_bold(self):
        """볼드 토글"""
        await self.editor_exec("bold")

    async def editor_italic(self):
        """이탤릭 토글"""
        await self.editor_exec("italic")

    async def editor_paragraph(self):
        """일반 단락으로 복귀"""
        await self.editor_exec("paragraph")

    # ── 고수준 타이핑 ──

    async def type_heading(self, text: str, level: int = 2):
        """제목 타이핑 (서식 적용 → 입력 → Enter → 단락 복귀)"""
        await self.editor_heading(level)
        await self.wait(0.1)
        await self.type_text(text)
        await self.enter()
        await self.editor_paragraph()
        await self.wait(0.1)

    async def type_bold(self, text: str):
        """볼드 텍스트 타이핑"""
        await self.editor_bold()
        await self.wait(0.1)
        await self.type_text(text)
        await self.editor_bold()

    async def type_paragraph(self, text: str):
        """단락 타이핑 + Enter"""
        await self.type_text(text)
        await self.enter()
        await self.wait(0.1)

    # ── 메타 필드 ──

    async def set_title(self, title: str):
        """글 제목 입력 (클릭 → 기존 값 지우기 → 타이핑)"""
        await self.click_element("#title")
        await self.wait(0.2)
        await self.select_all()
        await self.wait(0.1)
        await self.type_text(title)

    async def set_category(self, category: str):
        """카테고리 설정"""
        await self.fill("#category", category)

    async def set_language(self, lang: str = "ko"):
        """언어 설정 (ko, ja, en)"""
        await self.fill("#language", lang)

    async def set_seo(self, description: str):
        """SEO 요약 입력"""
        await self.fill("#seo-description, [id*=seo], textarea[placeholder*=요약]", description)

    async def set_tags(self, tags: str):
        """태그 입력 (콤마 구분)"""
        await self.fill("#tags, [id*=tag], input[placeholder*=태그], input[placeholder*=콤마]", tags)

    async def set_url_slug(self, slug: str):
        """URL 주소 설정"""
        await self.fill("#slug, input[placeholder*=URL]", slug)

    # ── 이미지 패널 ──

    async def open_image_panel(self):
        """이미지 탭 열기"""
        await self.click_text("이미지", "button")
        await self.wait(0.5)

    async def open_seed_panel(self):
        """시드 탭 열기"""
        await self.click_text("시드", "button")
        await self.wait(0.5)

    async def open_research_panel(self):
        """리서치 탭 열기"""
        await self.click_text("리서치", "button")
        await self.wait(0.5)

    # ── 발행 ──

    async def save_draft(self):
        """임시저장"""
        await self.click_text("임시저장", "button")
        await self.wait(1)

    async def preview(self):
        """미리보기"""
        await self.click_text("미리보기", "button")
        await self.wait(1)


# ── 편의 함수 (동기 래퍼) ──

def run(coro):
    """asyncio.run 래퍼"""
    return asyncio.run(coro)


def quick_screenshot(path: str = "/tmp/cdp_screenshot.png", port: int = 9222, tab: int = 0):
    """스크린샷 한 방"""
    async def _do():
        async with CDP(port=port, tab_index=tab) as cdp:
            await cdp.screenshot(path)
    run(_do())
    return path


def quick_eval(expr: str, port: int = 9222, tab: int = 0):
    """JS 실행 한 방"""
    async def _do():
        async with CDP(port=port, tab_index=tab) as cdp:
            return await cdp.evaluate(expr)
    return run(_do())

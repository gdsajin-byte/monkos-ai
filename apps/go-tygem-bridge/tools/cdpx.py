# 최소 CDP 헬퍼 — 포트 9227 전용. 자격 값은 출력하지 않는다.
import asyncio, json, base64, urllib.request
import websockets

PORT = 9227
SHOTS = "/Users/jeong-kyushin/.monkos/tygem/shots"


def page_ws():
    tabs = json.load(urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json/list"))
    for t in tabs:
        if t.get("type") == "page":
            return t["webSocketDebuggerUrl"], t["id"]
    raise SystemExit("no page")


class C:
    def __init__(s, ws):
        s.ws, s.i = ws, 0

    async def send(s, method, **params):
        s.i += 1
        mid = s.i
        await s.ws.send(json.dumps({"id": mid, "method": method, "params": params}))
        while True:
            m = json.loads(await s.ws.recv())
            if m.get("id") == mid:
                if "error" in m:
                    raise RuntimeError(m["error"])
                return m.get("result", {})


async def connect():
    url, tid = page_ws()
    ws = await websockets.connect(url, max_size=64 * 1024 * 1024)
    return C(ws), tid


async def shot(c, name):
    r = await c.send("Page.captureScreenshot", format="png")
    path = f"{SHOTS}/{name}"
    open(path, "wb").write(base64.b64decode(r["data"]))
    return path


async def ev(c, expr):
    r = await c.send("Runtime.evaluate", expression=expr, returnByValue=True, awaitPromise=True)
    return r.get("result", {}).get("value")


async def click(c, x, y):
    await c.send("Input.dispatchMouseEvent", type="mouseMoved", x=x, y=y)
    for t in ("mousePressed", "mouseReleased"):
        await c.send("Input.dispatchMouseEvent", type=t, x=x, y=y, button="left", clickCount=1)

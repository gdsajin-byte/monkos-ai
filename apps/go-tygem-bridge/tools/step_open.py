import asyncio, sys
sys.path.insert(0, "/Users/jeong-kyushin/.monkos/tygem/tools")
from cdpx import connect, ev, shot


async def main():
    c, tid = await connect()
    w = await c.send("Browser.getWindowForTarget", targetId=tid)
    await c.send("Browser.setWindowBounds", windowId=w["windowId"],
                 bounds={"left": 40, "top": 30, "width": 1500, "height": 1000, "windowState": "normal"})
    await c.send("Page.bringToFront")
    await c.send("Page.enable")
    await c.send("Page.navigate", url="https://web.tygem.com/")
    await asyncio.sleep(8)
    print("title:", await ev(c, "document.title"))
    print("info:", await ev(c, "[innerWidth, innerHeight, document.querySelectorAll('canvas').length, [...document.querySelectorAll('input')].map(i=>i.type+':'+(i.name||i.id)).join(',')]"))
    print(await shot(c, "01_open.png"))

asyncio.run(main())

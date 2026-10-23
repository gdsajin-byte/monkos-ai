# 사용: snap.py 이름.png  — 현재 화면 캡처 + 제목·URL 출력
import asyncio, sys
sys.path.insert(0, "/Users/jeong-kyushin/.monkos/tygem/tools")
from cdpx import connect, ev, shot


async def main(name):
    c, _ = await connect()
    print("url:", await ev(c, "location.href"), "| title:", await ev(c, "document.title"))
    print(await shot(c, name))

asyncio.run(main(sys.argv[1]))

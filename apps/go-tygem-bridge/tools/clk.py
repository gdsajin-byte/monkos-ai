# 사용: clk.py X Y 이름.png [대기초]  — CSS 좌표 클릭 후 캡처
import asyncio, sys
sys.path.insert(0, "/Users/jeong-kyushin/.monkos/tygem/tools")
from cdpx import connect, ev, shot, click


async def main(x, y, name, wait):
    c, _ = await connect()
    await click(c, x, y)
    await asyncio.sleep(wait)
    print("url:", await ev(c, "location.href"))
    print(await shot(c, name))

a = sys.argv
asyncio.run(main(float(a[1]), float(a[2]), a[3], float(a[4]) if len(a) > 4 else 2.5))

# 사용: clicktext.py "텍스트" 이름.png [대기초] [n번째]  — 보이는 텍스트가 정확히 일치하는 가장 작은 요소를 DOM rect로 찾아 클릭 후 캡처(좌표 고정 금지)
import asyncio, json, sys
sys.path.insert(0, "/Users/jeong-kyushin/.monkos/tygem/tools")
from cdpx import connect, ev, shot, click

FIND = """(t=>{const els=[...document.querySelectorAll('body *')].filter(e=>e.offsetWidth>0&&e.offsetHeight>0&&(e.innerText||e.value||'').trim()===t);
const leaf=els.filter(e=>![...e.children].some(k=>els.includes(k)));
return leaf.map(e=>{const b=e.getBoundingClientRect();return [b.x+b.width/2,b.y+b.height/2,e.tagName]})})(%s)"""

async def main(text, name, wait, idx):
    c, _ = await connect()
    hits = await ev(c, FIND % json.dumps(text))
    print("후보:", hits)
    if not hits or idx >= len(hits):
        raise SystemExit(f"❌ clicktext: '{text}' 미발견 — 클릭 안 함")
    x, y, _ = hits[idx]
    await click(c, x, y)
    await asyncio.sleep(wait)
    print(await shot(c, name))

a = sys.argv
asyncio.run(main(a[1], a[2], float(a[3]) if len(a) > 3 else 2.5, int(a[4]) if len(a) > 4 else 0))

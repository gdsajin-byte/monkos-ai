import asyncio, sys
sys.path.insert(0, "/Users/jeong-kyushin/.monkos/tygem/tools")
from cdpx import connect, ev


async def main():
    c, _ = await connect()
    print(await ev(c, "(()=>{for(const s of ['#uid','#pwd']){const e=document.querySelector(s); if(e) e.value='';} return 'cleared'})()"))

asyncio.run(main())

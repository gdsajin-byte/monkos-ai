# 로그인 폼 구조만 출력 (값은 읽지 않음)
import asyncio, sys
sys.path.insert(0, "/Users/jeong-kyushin/.monkos/tygem/tools")
from cdpx import connect, ev


async def main():
    c, _ = await connect()
    print(await ev(c, """JSON.stringify([...document.querySelectorAll('input,button,a.btn,form')].map(e=>({tag:e.tagName,type:e.type||'',name:e.name||'',id:e.id||'',cls:(e.className||'').toString().slice(0,40),txt:(e.innerText||e.value&&e.type!='password'&&e.type!='text'?(e.innerText||''):'').slice(0,20),action:e.action||''})).slice(0,40))"""))

asyncio.run(main())

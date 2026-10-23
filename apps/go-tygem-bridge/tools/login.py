# 타이젬 로그인 — 자격은 secret.sh get으로 메모리에만 받고 출력·파일 기록 없음
import asyncio, subprocess, sys
sys.path.insert(0, "/Users/jeong-kyushin/.monkos/tygem/tools")
from cdpx import connect, ev, shot, click

REPO = "/Users/jeong-kyushin/developer/monk_project"


def secret(name):
    r = subprocess.run([f"{REPO}/scripts/secret.sh", "get", name], capture_output=True, text=True)
    if r.returncode != 0:
        raise SystemExit(f"❌ {name} 조회 실패")
    return r.stdout.rstrip("\n")


async def type_into(c, selector, value):
    await ev(c, f"(()=>{{const e=document.querySelector('{selector}'); e.focus(); e.value=''; return true}})()")
    await c.send("Input.insertText", text=value)


async def main():
    c, _ = await connect()
    uid, pwd = secret("TYGEM_ID"), secret("TYGEM_PASSWORD")
    await type_into(c, "#uid", uid)
    await type_into(c, "#pwd", pwd)
    ok = await ev(c, "document.querySelector('#uid').value.length>0 && document.querySelector('#pwd').value.length>0")
    uid = pwd = None
    print("입력 채움:", ok)
    r = await ev(c, """(()=>{const els=[...document.querySelectorAll('a,button,div,span,input[type=submit],input[type=image]')].filter(e=>(e.innerText||e.value||'').trim()==='로그인'&&e.offsetWidth>200);
      const e=els[els.length-1]; if(!e) return null; const b=e.getBoundingClientRect(); return [b.x+b.width/2,b.y+b.height/2,e.tagName]})()""")
    print("로그인 버튼:", r)
    if not r:
        raise SystemExit("❌ 로그인 버튼 미발견 — 제출 안 함")
    await click(c, r[0], r[1])
    await asyncio.sleep(6)
    print("url:", await ev(c, "location.href"))
    print(await shot(c, "03_after_login.png"))

asyncio.run(main())

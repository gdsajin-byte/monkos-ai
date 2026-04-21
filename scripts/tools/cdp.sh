#!/bin/bash
# CDP (Chrome DevTools Protocol) 직접 제어 스크립트
# 용도: 로컬 MCP 없이 디버깅 크롬을 직접 제어
# 사용: cdp.sh <command> [args]

CDP_HOST="127.0.0.1"
if [ -z "${CDP_PORT}" ]; then
  _cn="$(scutil --get ComputerName 2>/dev/null)"
  case "${_cn}" in
    *M4*) CDP_PORT=9230 ;;
    *M2*) CDP_PORT=9231 ;;
    *)    CDP_PORT=9222 ;;
  esac
  unset _cn
fi
CDP_BASE="http://${CDP_HOST}:${CDP_PORT}"

case "$1" in
  tabs|list)
    curl -s "${CDP_BASE}/json" | python3 -c "
import sys,json
tabs=json.load(sys.stdin)
for i,t in enumerate(tabs):
    print(f'[{i}] {t[\"id\"][:12]}  {t[\"url\"]}')
"
    ;;

  version)
    curl -s "${CDP_BASE}/json/version" | python3 -m json.tool
    ;;

  title)
    # 첫 번째 non-blank 탭의 title
    TAB_WS=$(curl -s "${CDP_BASE}/json" | python3 -c "
import sys,json
tabs=json.load(sys.stdin)
for t in tabs:
    if t['url'] != 'about:blank':
        print(t['webSocketDebuggerUrl']); break
")
    python3 -c "
import asyncio,json,websockets
async def run():
    async with websockets.connect('${TAB_WS}') as ws:
        await ws.send(json.dumps({'id':1,'method':'Runtime.evaluate','params':{'expression':'document.title'}}))
        r=json.loads(await ws.recv())
        print(r.get('result',{}).get('result',{}).get('value',''))
asyncio.run(run())
"
    ;;

  eval)
    # cdp.sh eval "document.title" [tab_index]
    EXPR="$2"
    IDX="${3:-0}"
    TAB_WS=$(curl -s "${CDP_BASE}/json" | python3 -c "
import sys,json
tabs=json.load(sys.stdin)
print(tabs[${IDX}]['webSocketDebuggerUrl'])
")
    python3 -c "
import asyncio,json,websockets
async def run():
    async with websockets.connect('${TAB_WS}') as ws:
        await ws.send(json.dumps({'id':1,'method':'Runtime.evaluate','params':{'expression':'''${EXPR}'''}}))
        r=json.loads(await ws.recv())
        val=r.get('result',{}).get('result',{})
        print(val.get('value', json.dumps(val)))
asyncio.run(run())
"
    ;;

  navigate|go)
    # cdp.sh navigate "https://example.com" [tab_index]
    URL="$2"
    IDX="${3:-0}"
    TAB_WS=$(curl -s "${CDP_BASE}/json" | python3 -c "
import sys,json
tabs=json.load(sys.stdin)
print(tabs[${IDX}]['webSocketDebuggerUrl'])
")
    python3 -c "
import asyncio,json,websockets
async def run():
    async with websockets.connect('${TAB_WS}') as ws:
        await ws.send(json.dumps({'id':1,'method':'Page.navigate','params':{'url':'${URL}'}}))
        r=json.loads(await ws.recv())
        print('Navigated:', r.get('result',{}).get('frameId','ok'))
asyncio.run(run())
"
    ;;

  content)
    # cdp.sh content [tab_index] — 페이지 텍스트 추출
    IDX="${2:-0}"
    TAB_WS=$(curl -s "${CDP_BASE}/json" | python3 -c "
import sys,json
tabs=json.load(sys.stdin)
print(tabs[${IDX}]['webSocketDebuggerUrl'])
")
    python3 -c "
import asyncio,json,websockets
async def run():
    async with websockets.connect('${TAB_WS}') as ws:
        await ws.send(json.dumps({'id':1,'method':'Runtime.evaluate','params':{'expression':'document.body.innerText'}}))
        r=json.loads(await ws.recv())
        print(r.get('result',{}).get('result',{}).get('value',''))
asyncio.run(run())
"
    ;;

  screenshot)
    # cdp.sh screenshot [output.png] [tab_index]
    OUT="${2:-/tmp/cdp_screenshot.png}"
    IDX="${3:-0}"
    TAB_WS=$(curl -s "${CDP_BASE}/json" | python3 -c "
import sys,json
tabs=json.load(sys.stdin)
print(tabs[${IDX}]['webSocketDebuggerUrl'])
")
    python3 -c "
import asyncio,json,websockets,base64
async def run():
    async with websockets.connect('${TAB_WS}', max_size=10*1024*1024) as ws:
        await ws.send(json.dumps({'id':1,'method':'Page.captureScreenshot','params':{'format':'png','quality':80}}))
        r=json.loads(await ws.recv())
        data=r.get('result',{}).get('data','')
        with open('${OUT}','wb') as f:
            f.write(base64.b64decode(data))
        print('Saved: ${OUT}')
asyncio.run(run())
"
    ;;

  *)
    echo "CDP 직접 제어 스크립트"
    echo "Usage: cdp.sh <command> [args]"
    echo ""
    echo "Commands:"
    echo "  tabs/list              탭 목록"
    echo "  version                크롬 버전 정보"
    echo "  title                  현재 탭 타이틀"
    echo "  eval <expr> [idx]      JS 실행"
    echo "  navigate <url> [idx]   URL 이동"
    echo "  content [idx]          페이지 텍스트"
    echo "  screenshot [out] [idx] 스크린샷"
    ;;
esac

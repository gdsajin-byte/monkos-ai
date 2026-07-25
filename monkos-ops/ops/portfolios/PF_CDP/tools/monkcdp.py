"""CDP 최소 클라이언트 — 이벤트/응답 분리 리더.

cdp_utils.CDP._send()는 send 직후 recv() 1회로 응답을 읽는다. Runtime/Log/Page 이벤트가
켜져 있으면 이벤트가 응답 자리에 끼어들어 결과가 뒤엉킨다(2026-07-25 실측). 또한 Page.enable
없이 Page.addScriptToEvaluateOnNewDocument를 호출하면 스크립트가 주입되지 않는다.
→ 리더 태스크로 이벤트를 배수하고 id로 응답을 매칭한다.
"""
import asyncio, json, urllib.request
import websockets


class MonkCDP:
    def __init__(self, port=9224):
        self.port = port
        self.ws = None
        self._id = 0
        self._pending = {}
        self.events = []

    async def __aenter__(self):
        tabs = json.load(urllib.request.urlopen(f'http://127.0.0.1:{self.port}/json'))
        tab = next(t for t in tabs if t['type'] == 'page')
        self.ws = await websockets.connect(tab['webSocketDebuggerUrl'], max_size=100 * 1024 * 1024)
        self._reader = asyncio.create_task(self._read())
        return self

    async def __aexit__(self, *a):
        self._reader.cancel()
        await self.ws.close()

    async def _read(self):
        async for raw in self.ws:
            msg = json.loads(raw)
            if 'id' in msg:
                fut = self._pending.pop(msg['id'], None)
                if fut and not fut.done():
                    fut.set_result(msg)
            else:
                self.events.append(msg)

    async def send(self, method, params=None, timeout=60):
        self._id += 1
        fut = asyncio.get_running_loop().create_future()
        self._pending[self._id] = fut
        await self.ws.send(json.dumps({'id': self._id, 'method': method, 'params': params or {}}))
        msg = await asyncio.wait_for(fut, timeout)
        if 'error' in msg:
            raise RuntimeError(f"CDP 에러 {method}: {msg['error']}")
        return msg.get('result', {})

    async def ev(self, expr, timeout=60):
        r = await self.send('Runtime.evaluate', {'expression': expr, 'returnByValue': True,
                                                 'awaitPromise': True}, timeout)
        if 'exceptionDetails' in r:
            raise RuntimeError('JS 예외: ' + json.dumps(r['exceptionDetails'])[:300])
        return r.get('result', {}).get('value')

    async def evj(self, expr, timeout=60):
        v = await self.ev(expr, timeout)
        return json.loads(v) if isinstance(v, str) else v

    async def navigate(self, url, wait=6.0):
        await self.send('Page.navigate', {'url': url})
        await asyncio.sleep(wait)

    def console_problems(self, since=0):
        """error/warning 콘솔 + 미처리 예외 + 로그 엔트리(error/warning)만 추출"""
        out = []
        for e in self.events[since:]:
            m, p = e.get('method'), e.get('params', {})
            if m == 'Runtime.consoleAPICalled' and p.get('type') in ('error', 'warning', 'assert'):
                txt = ' '.join(str(a.get('value', a.get('description', a.get('type'))))
                               for a in p.get('args', []))
                out.append(f"console.{p['type']}: {txt[:300]}")
            elif m == 'Runtime.exceptionThrown':
                d = p.get('exceptionDetails', {})
                out.append('exception: ' + str(d.get('text', '')) + ' ' +
                           str(d.get('exception', {}).get('description', ''))[:300])
            elif m == 'Log.entryAdded' and p.get('entry', {}).get('level') in ('error', 'warning'):
                en = p['entry']
                out.append(f"log.{en['level']}[{en.get('source')}]: {str(en.get('text'))[:200]} {str(en.get('url',''))[:120]}")
        return out

    def network_json(self, since=0):
        return [e for e in self.events[since:] if e.get('method', '').startswith('Network.')]

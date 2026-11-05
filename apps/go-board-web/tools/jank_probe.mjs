// 초읽기 멈칫(메인 스레드 정지) 측정기 — 격리된 헤드리스 크롬(별도 프로필)으로 테스트 인스턴스의 새 판을 열고
// 아이폰 화면 에뮬레이션 + CPU 감속 상태에서 longtask·프레임 간격·숫자 음성 호출 시각·느린 함수를 기록한다 (PF_GO, 11-05 11:16).
// 사용: node jank_probe.mjs BASE_URL SECONDS CPU_RATE OUT_JSON
//   BASE_URL은 테스트 인스턴스(예: http://127.0.0.1:8767) — 8765 금지
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const [, , BASE, SECS = '25', RATE = '6', OUT = '/dev/stdout'] = process.argv;
if (!BASE || /:8765\b/.test(BASE)) { console.error('❌ jank_probe: 테스트 인스턴스 주소 필요(8765 금지)'); process.exit(1); }
const PORT = 9341;
const prof = fs.mkdtempSync(path.join(process.env.CLAUDE_JOB_DIR ? path.join(process.env.CLAUDE_JOB_DIR, 'tmp') : os.tmpdir(), 'jank-'));
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${prof}`, '--no-first-run', '--autoplay-policy=no-user-gesture-required',
   '--mute-audio', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ver;
for (let i = 0; i < 50 && !ver; i++) { await sleep(200); try { ver = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(); } catch (e) {} }
if (!ver) { console.error('❌ jank_probe: 크롬 기동 실패'); chrome.kill(); process.exit(1); }
const tgt = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(tgt.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
let id = 0; const wait = new Map();
ws.addEventListener('message', ev => { const m = JSON.parse(ev.data); if (m.id && wait.has(m.id)) { wait.get(m.id)(m); wait.delete(m.id); } });
const cdp = (method, params = {}) => new Promise(r => { const i = ++id; wait.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async expr => { const r = await cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); return r.result && r.result.result ? r.result.result.value : r; };

await cdp('Page.enable'); await cdp('Runtime.enable');
await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
await cdp('Emulation.setTouchEmulationEnabled', { enabled: true });
await cdp('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' });
// 문서 시작 전에 관측기 설치(longtask·프레임)
await cdp('Page.addScriptToEvaluateOnNewDocument', { source: `
  window.__J = { lt: [], fr: [], v: [], slow: [], ls: [] };
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) __J.lt.push([+e.startTime.toFixed(1), +e.duration.toFixed(1)]); }).observe({ type: 'longtask', buffered: true }); } catch (e) {}
  (function f(prev) { requestAnimationFrame(t => { if (prev && t - prev > 50) __J.fr.push([+prev.toFixed(1), +(t - prev).toFixed(1)]); f(t); }); })(0);
  const st0 = AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start = function (when) { try { __J.au = __J.au || []; __J.au.push([+performance.now().toFixed(1), +(this.buffer ? this.buffer.duration : 0).toFixed(3), +((when || 0) - this.context.currentTime).toFixed(3)]); } catch (e) {} return st0.apply(this, arguments); };
  const si = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) { const t = performance.now(); si.call(this, k, v); const d = performance.now() - t; if (d > 2) __J.ls.push([+t.toFixed(1), +d.toFixed(1), k, String(v).length]); };
` });
await cdp('Page.navigate', { url: BASE + '/' });
await sleep(2500);
if (process.env.PACK) await ev(`localStorage.setItem('goBoardPack', ${JSON.stringify(process.env.PACK)})`);
const room = await ev(`fetch('/api/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ level: 'monkos', handicap: 0, time: { main: 0, byo: 10, periods: 5 }, color: 'B' }) }).then(r => r.json()).then(j => j.id || JSON.stringify(j))`);
if (!room || room.startsWith('{')) { console.error('❌ jank_probe: 방 생성 실패', room); chrome.kill(); process.exit(1); }
await cdp('Page.navigate', { url: `${BASE}/room/${room}${process.env.HANA ? "?hana=" + process.env.HANA : ""}` });
const tRoom = Date.now();
await sleep(3000);
await cdp('Emulation.setCPUThrottlingRate', { rate: Number(RATE) });
// 최상위 함수를 감싸 느린 호출(>30ms, 가장 바깥 호출 기준)과 음성 호출 시각을 남긴다
const wrapped = await ev(`(() => {
  let depth = 0, n = 0;
  const names = Object.keys(window).filter(k => { try { return typeof window[k] === 'function' && !/\\[native code\\]/.test(Function.prototype.toString.call(window[k])) && !k.startsWith('__'); } catch (e) { return false; } });
  for (const k of names) {
    const f = window[k];
    window[k] = function (...a) {
      if (k === 'voice') __J.v.push([+performance.now().toFixed(1), String(a[0]).split('/').pop(), +(a[1] || 0).toFixed(3)]);
      const t = performance.now(); depth++;
      try { return f.apply(this, a); } finally { depth--; const d = performance.now() - t; if (d > 30) __J.slow.push([+t.toFixed(1), +d.toFixed(1), k, depth]); }
    };
    n++;
  }
  try { audio(); } catch (e) {}
  return n;
})()`);
// 화면 시계 표시 표본(rAF마다, 바뀔 때만) — [t, 색, 남은 초, 남은 회, 수 번호]
await ev(`(() => { __J.disp = []; const last = {};
  (function f() { for (const col of ['B', 'W']) { const el = document.getElementById('time' + col); const tx = el ? el.textContent : '';
      if (last[col] !== tx) { last[col] = tx; const m = tx.match(/(\\d+):(\\d+)\\s*·\\s*(\\d+)회/);
        if (m) __J.disp.push([+performance.now().toFixed(1), col, +m[1] * 60 + +m[2], +m[3], S ? S.moveNo : -1]); } }
    requestAnimationFrame(f); })(); return 1; })()`);
const t0 = await ev('performance.now()');
// MOVES=초 — 내 차례마다 그 초만큼 셈을 듣고 빈 점에 둔다(엔진 계산·분석이 내 셈과 겹치는 실제 흐름). 0이면 두지 않음
const MV = Number(process.env.MOVES || 0);
if (MV > 0) await ev(`(() => { __J.mv = []; let since = 0;
  setInterval(() => { if (!S || S.result || busy || S.toMove !== S.user) { since = 0; return; }
    if (!since) since = performance.now();
    if (performance.now() - since < ${MV * 1000}) return;
    since = 0;
    const pts = []; for (let y = 3; y < N - 3; y++) for (let x = 3; x < N - 3; x++) if (!S.board[y][x]) pts.push([x, y]);
    const p = pts[Math.floor(Math.random() * pts.length)]; __J.mv.push(+performance.now().toFixed(1)); tapAt(p[0], p[1]); }, 50); return 1; })()`);
await sleep(Number(SECS) * 1000);
await cdp('Emulation.setCPUThrottlingRate', { rate: 1 });
const J = await ev('JSON.stringify(window.__J)');
const pk = await ev('packName');
const res = { room, pack: pk, navAt: await ev('performance.timeOrigin'), cpu: Number(RATE), secs: Number(SECS), wrapped, t0, ...JSON.parse(J) };
fs.writeFileSync(OUT, JSON.stringify(res));
// 판 정리: 기권(진행 중 판으로 남지 않게)
await ev(`fetch('/api/resign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }).then(r => r.status).catch(e => 0)`);
ws.close(); chrome.kill();
await sleep(800); try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) {}
console.error(`room ${room} · longtask ${res.lt.length} · 프레임>50ms ${res.fr.length} · 음성 ${res.v.length} · 느린 함수 ${res.slow.length} · localStorage>2ms ${res.ls.length}`);

// 테스트 인스턴스 화면 캡처 — 격리 헤드리스 크롬으로 방을 열고(선택) 앱 함수 하나를 부른 뒤 PNG (PF_GO, 11-05 계가 마무리 화면 확인)
// 사용: node ui_shot.mjs BASE_URL ROOM_ID OUT_PNG ['자바스크립트 식(예: call("/api/score"))'] [대기초]   — 8765 금지
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const [, , BASE, ROOM, OUT, EXPR = '', WAIT = '2'] = process.argv;
if (!BASE || /:8765\b/.test(BASE)) { console.error('❌ ui_shot: 테스트 인스턴스 주소 필요(8765 금지)'); process.exit(1); }
const PORT = 9343;
const prof = fs.mkdtempSync(path.join(process.env.CLAUDE_JOB_DIR ? path.join(process.env.CLAUDE_JOB_DIR, 'tmp') : os.tmpdir(), 'ui-'));
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${prof}`, '--no-first-run', '--mute-audio', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
for (let i = 0; i < 50; i++) { await sleep(200); try { await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(); break; } catch (e) {} }
const tgt = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(tgt.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
let id = 0; const wait = new Map();
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && wait.has(m.id)) { wait.get(m.id)(m); wait.delete(m.id); } });
const cdp = (method, params = {}) => new Promise(r => { const i = ++id; wait.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await cdp('Page.enable');
await cdp('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await cdp('Page.navigate', { url: `${BASE}/room/${ROOM}` });
await sleep(3000);
if (EXPR) await cdp('Runtime.evaluate', { expression: `(async () => { await (${EXPR}); return 1; })()`, awaitPromise: true });
await sleep(Number(WAIT) * 1000);
const r = await cdp('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(OUT, Buffer.from(r.result.data, 'base64'));
ws.close(); chrome.kill(); await sleep(500); try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) {}
console.log(OUT);

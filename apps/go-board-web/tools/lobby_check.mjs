// 대기실 재현 — 격리 헤드리스 크롬으로 '/'를 열어 스크립트 오류·콘솔 경고·대기실 참여자 행 수·캡처 (PF_GO, 11-05 20:10 "대기실에 참여 봇들이 사라졌어")
// 사용: node lobby_check.mjs BASE_URL OUT_PNG [폭 높이]   — 8765 금지
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const [, , BASE, OUT, W = '1280', H = '900'] = process.argv;
if (!BASE || (/:8765\b/.test(BASE) && process.env.READONLY_OK !== '1')) { console.error('❌ lobby_check: 테스트 인스턴스 주소 필요(8765 금지)'); process.exit(1); }
const PORT = 9344;
const prof = fs.mkdtempSync(path.join(process.env.CLAUDE_JOB_DIR ? path.join(process.env.CLAUDE_JOB_DIR, 'tmp') : os.tmpdir(), 'lb-'));
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${prof}`, '--no-first-run', '--mute-audio', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
for (let i = 0; i < 50; i++) { await sleep(200); try { await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(); break; } catch (e) {} }
const tgt = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(tgt.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
let id = 0; const wait = new Map(); const errs = [];
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && wait.has(m.id)) { wait.get(m.id)(m); wait.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') { const d = m.params.exceptionDetails; errs.push(`예외 ${d.lineNumber}:${d.columnNumber} ${(d.exception && d.exception.description || d.text || '').split('\n')[0]}`); }
  if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type)) errs.push(`콘솔 ${m.params.type}: ${m.params.args.map(a => a.value || a.description || '').join(' ').slice(0, 200)}`);
});
const cdp = (method, params = {}) => new Promise(r => { const i = ++id; wait.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await cdp('Page.enable'); await cdp('Runtime.enable');
await cdp('Emulation.setDeviceMetricsOverride', { width: Number(W), height: Number(H), deviceScaleFactor: 1, mobile: Number(W) < 600 });
await cdp('Page.navigate', { url: `${BASE}/` });
await sleep(4000);
const r = await cdp('Runtime.evaluate', { expression: `(() => { const el = document.getElementById('lobbyPeople'); return JSON.stringify({ rows: el ? el.querySelectorAll('.lobby-row').length : null, text: el ? el.innerText.slice(0, 300) : null, lobbyHidden: el ? !!el.closest('[hidden]') : null }); })()`, returnByValue: true });
const shot = await cdp('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(OUT, Buffer.from(shot.result.data, 'base64'));
console.log(JSON.stringify({ lobby: JSON.parse(r.result.result.value), errors: errs }, null, 1));
ws.close(); chrome.kill(); await sleep(500); try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) {}

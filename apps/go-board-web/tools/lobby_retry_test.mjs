// 대기실 목록 실패 → 자동 복귀 시험 — 처음 BLOCK초 동안 /api/rooms·/api/presence를 막았다가 풀고(서버 재기동 순간 흉내),
// 새로고침 없이 참여자 AI 행이 돌아오는지 1초 간격으로 잰다 (PF_GO, 11-05 20:13). 사용: node lobby_retry_test.mjs BASE_URL [BLOCK초] [관찰초] — 8765 금지
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const [, , BASE, BLOCK = '8', WATCH = '40'] = process.argv;
if (!BASE || (/:8765\b/.test(BASE) && process.env.READONLY_OK !== '1')) { console.error('❌ lobby_retry_test: 테스트 인스턴스 주소 필요(8765 금지)'); process.exit(1); }
const PORT = 9345;
const prof = fs.mkdtempSync(path.join(process.env.CLAUDE_JOB_DIR ? path.join(process.env.CLAUDE_JOB_DIR, 'tmp') : os.tmpdir(), 'lr-'));
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
await cdp('Page.enable'); await cdp('Network.enable');
await cdp('Network.setBlockedURLs', { urls: ['*/api/rooms*', '*/api/presence*'] });
await cdp('Page.navigate', { url: `${BASE}/` });
const rows = async () => (await cdp('Runtime.evaluate', { expression: `(() => { const el = document.getElementById('lobbyPeople'); return el ? [...el.querySelectorAll('.lobby-row .t1')].map(x => x.textContent).join('|') : 'none'; })()`, returnByValue: true })).result.result.value;
const t0 = Date.now(), log = [];
let unblocked = false, back = null;
while ((Date.now() - t0) / 1000 < Number(WATCH)) {
  const s = (Date.now() - t0) / 1000;
  if (!unblocked && s >= Number(BLOCK)) { await cdp('Network.setBlockedURLs', { urls: [] }); unblocked = true; log.push(`${s.toFixed(1)}s 차단 해제`); }
  const r = await rows();
  if (log.length === 0 || !log[log.length - 1].endsWith(r)) log.push(`${s.toFixed(1)}s 행: ${r || '(없음)'}`);
  if (unblocked && back === null && /MONKOS Go/.test(r)) back = +(s - Number(BLOCK)).toFixed(1);
  await sleep(1000);
}
console.log(log.join('\n'));
console.log(back === null ? '❌ 새로고침 없이 AI 행 미복귀' : `✅ 차단 해제 ${back}초 뒤 AI 행 복귀(새로고침 없음)`);
ws.close(); chrome.kill(); await sleep(500); try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) {}

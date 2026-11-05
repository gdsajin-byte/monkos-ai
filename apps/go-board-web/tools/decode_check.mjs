// 브라우저 디코더로 팩 파일을 실제로 풀어 말소리 시작(−20dB)·길이를 잰다 — 형식 바꿀 때 시작 위치 유지 확인용 (PF_GO, 11-05)
// 사용: node decode_check.mjs DIR_A DIR_B   (같은 이름 파일을 짝지어 비교, 확장자 무관)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const [, , A, B] = process.argv;
const PORT = 9342;
const prof = fs.mkdtempSync(path.join(process.env.CLAUDE_JOB_DIR ? path.join(process.env.CLAUDE_JOB_DIR, 'tmp') : os.tmpdir(), 'dec-'));
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${prof}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ok = false;
for (let i = 0; i < 50 && !ok; i++) { await sleep(200); try { await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(); ok = true; } catch (e) {} }
const tgt = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(tgt.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
let id = 0; const wait = new Map();
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && wait.has(m.id)) { wait.get(m.id)(m); wait.delete(m.id); } });
const cdp = (method, params = {}) => new Promise(r => { const i = ++id; wait.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const dec = async file => {
  const b64 = fs.readFileSync(file).toString('base64');
  const r = await cdp('Runtime.evaluate', { awaitPromise: true, returnByValue: true, expression: `(async () => {
    const ctx = new OfflineAudioContext(1, 48000, 48000);
    const bin = Uint8Array.from(atob('${b64}'), c => c.charCodeAt(0));
    const buf = await ctx.decodeAudioData(bin.buffer);
    const x = buf.getChannelData(0), w = Math.round(buf.sampleRate * 0.005);
    let mx = 0; const r = new Float32Array(x.length);
    let acc = 0; for (let i = 0; i < x.length; i++) { acc += x[i] * x[i]; if (i >= w) acc -= x[i - w] * x[i - w]; r[i] = Math.sqrt(Math.max(acc, 0) / w); if (r[i] > mx) mx = r[i]; }
    let on = 0; while (on < x.length && r[on] < mx * 0.1) on++;
    return { sr: buf.sampleRate, ch: buf.numberOfChannels, len: +(buf.duration * 1000).toFixed(1), on: +((on - w / 2) / buf.sampleRate * 1000).toFixed(1) };
  })()` });
  return r.result.result.value || r.result;
};
const names = fs.readdirSync(A).filter(f => /\.(wav|mp3|m4a)$/.test(f)).map(f => f.replace(/\.\w+$/, ''));
const pick = (d, n) => ['m4a', 'mp3', 'wav'].map(e => path.join(d, `${n}.${e}`)).find(f => fs.existsSync(f));
const rows = [];
for (const n of names.sort()) {
  const fa = pick(A, n), fb = pick(B, n);
  if (!fa || !fb) continue;
  const a = await dec(fa), b = await dec(fb);
  rows.push({ n, a, b, don: +(b.on - a.on).toFixed(1), dlen: +(b.len - a.len).toFixed(1) });
}
ws.close(); chrome.kill(); await sleep(500); try { fs.rmSync(prof, { recursive: true, force: true }); } catch (e) {}
console.log(JSON.stringify({ ua: 'headless chrome', rows }));

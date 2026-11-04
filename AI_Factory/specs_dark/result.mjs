// 결과 화면 검증 — 공개 사진 업로드 → 무료 생성 1회 → 같은 화면에서 라이트/다크 × 375/1280 캡처 + 감사(밝은 면·글자 대비)
// node result.mjs <base> <photo> <outdir>
import { writeFileSync } from 'node:fs';
const [base, photo, OUT, mode] = process.argv.slice(2); // mode=nogen: 이미 결과 화면이면 재생성 없이 캡처·감사만
const t = (await (await fetch('http://127.0.0.1:9333/json/list')).json()).find((x) => x.type === 'page');
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pend = new Map();
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result?.result?.value;
await send('Page.enable'); await send('Runtime.enable'); await send('DOM.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
const scheme = async (s) => send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: s }] });
const size = async (w) => send('Emulation.setDeviceMetricsOverride', { width: w, height: w < 800 ? 800 : 900, deviceScaleFactor: 1, mobile: w < 800 });
if (mode !== 'nogen') {
await scheme('light'); await size(375);
await send('Page.navigate', { url: base + '/specs/passport/kr' }); await sleep(5000);
const doc = await send('DOM.getDocument', { depth: -1 });
const q = await send('DOM.querySelector', { nodeId: doc.result.root.nodeId, selector: '#v2-file-input' });
await send('DOM.setFileInputFiles', { nodeId: q.result.nodeId, files: [photo] });
await ev(`document.getElementById('v2-file-input').dispatchEvent(new Event('change', { bubbles: true }))`);
let st = '';
for (let i = 0; i < 120; i++) { await sleep(1000);
  st = await ev(`(() => { const b = document.getElementById('v2-fit-make'); const r = document.getElementById('v2-result-after-img');
    if (r && r.src && r.src.startsWith('data:')) return 'result';
    if (b && b.offsetParent && !b.disabled) return 'make'; return 'wait'; })()`);
  if (st === 'make') { await ev(`document.getElementById('v2-fit-make').click()`); st = 'clicked'; }
  if (st === 'result') break; }
console.log('결과 상태:', st);
if (st !== 'result') { const s = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(`${OUT}/result_fail.png`, Buffer.from(s.result.data, 'base64')); process.exit(1); }
}
await ev(`(() => { const i = document.getElementById('ip-free-img') || [...document.images].find(x => x.src.startsWith('data:image') && x.offsetParent); i.setAttribute('data-audit-result', '1'); return 1; })()`);
await sleep(2000);
const AUD = `(() => {
  const P = (c) => { const m = c.match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const v = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; };
  const L = (c) => { const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const over = (a, b) => ({ r: a.r * a.a + b.r * (1 - a.a), g: a.g * a.a + b.g * (1 - a.a), b: a.b * a.a + b.b * (1 - a.a), a: 1 });
  const dark = matchMedia('(prefers-color-scheme: dark)').matches;
  const vis = (e) => { const s = getComputedStyle(e); const b = e.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0.05 && b.width > 2 && b.height > 2; };
  const name = (e) => (e.tagName + (e.id ? '#' + e.id : '') + '.' + [...e.classList].join('.')).slice(0, 60);
  const bgOf = (e) => { const st = []; let n = e; while (n && n.nodeType === 1) { const c = P(getComputedStyle(n).backgroundColor); if (c && c.a > 0) { st.push(c); if (c.a >= .99) break; } n = n.parentElement; }
    let acc = dark ? { r: 20, g: 19, b: 26, a: 1 } : { r: 255, g: 255, b: 255, a: 1 }; for (let i = st.length - 1; i >= 0; i--) acc = over(st[i], acc); return acc; };
  const light = [], low = [];
  for (const e of document.querySelectorAll('body *')) { if (!vis(e)) continue; if (['IMG','IFRAME','SVG','CANVAS','svg','path','rect','line','g','circle','text','image'].includes(e.tagName)) continue;
    const c = P(getComputedStyle(e).backgroundColor); if (c && c.a >= .5 && L(c) > .6) light.push(name(e) + ' ' + getComputedStyle(e).backgroundColor);
    if ([...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1)) { const s = getComputedStyle(e); const fg = P(s.color); const bg = bgOf(e); const f = fg.a < 1 ? over(fg, bg) : fg;
      const cr = (Math.max(L(f), L(bg)) + .05) / (Math.min(L(f), L(bg)) + .05); const big = parseFloat(s.fontSize) >= 24 || (parseFloat(s.fontSize) >= 18.66 && +s.fontWeight >= 700);
      if (cr < (big ? 3 : 4.5)) low.push(name(e) + ' "' + e.textContent.trim().slice(0, 24) + '" ' + cr.toFixed(2)); } }
  const img = document.querySelector('[data-audit-result]'); const is = getComputedStyle(img);
  const chain = []; let n = img; for (let k = 0; k < 4 && n; k++) { chain.push(name(n)); n = n.parentElement; }
  return { light, low, imgPad: is.padding, imgBg: is.backgroundColor, imgBorder: is.borderTopColor, chain }; })()`;
const rep = {};
for (const s of ['light', 'dark']) for (const w of [375, 1280]) {
  await scheme(s); await size(w); await sleep(700);
  await ev(`document.querySelector('[data-audit-result]').scrollIntoView({ block: 'center' })`); await sleep(500);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(`${OUT}/result_${s}_${w}.png`, Buffer.from(shot.result.data, 'base64'));
  rep[`${s}@${w}`] = await ev(AUD);
  console.log(s, w, '밝은 면', rep[`${s}@${w}`].light.length, '· 대비 미달', rep[`${s}@${w}`].low.length, '· 사진 받침', rep[`${s}@${w}`].imgPad, rep[`${s}@${w}`].imgBg);
}
writeFileSync(`${OUT}/result_audit.json`, JSON.stringify(rep, null, 1));
ws.close();

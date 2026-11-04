// 전 요소 계산 색 속성 덤프 — node styles.mjs <base> <none|repo> <light|dark> <page> <width> → JSON 경로 출력
import { writeFileSync, readFileSync } from 'node:fs';
const [base, ovr, scheme, page, width] = process.argv.slice(2);
const W = '/Users/jeong-kyushin/developer/monk_project/.claude/worktrees/makne8-passport-fov-align/monkos_AI/portal/public';
const ALL = { us: '/specs/visa/us', kr: '/specs/passport/kr', en: '/en/specs/visa/us', hub: '/specs' };
const t = (await (await fetch('http://127.0.0.1:9333/json/list')).json()).find((x) => x.type === 'page');
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pend = new Map();
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data);
  if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); return; }
  if (d.method === 'Fetch.requestPaused') { const f = /\/css\/(specs-funnel|specs-base)\.css/.exec(d.params.request.url);
    if (f && ovr === 'repo') send('Fetch.fulfillRequest', { requestId: d.params.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'text/css; charset=utf-8' }], body: readFileSync(`${W}/css/${f[1]}.css`).toString('base64') });
    else send('Fetch.continueRequest', { requestId: d.params.requestId }); } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await send('Page.enable'); await send('Runtime.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Fetch.enable', { patterns: [{ urlPattern: '*specs-*.css*', requestStage: 'Request' }] });
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: scheme }] });
const w = Number(width);
await send('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: w < 800 });
await send('Page.navigate', { url: base + ALL[page] }); await sleep(5000);
const r = await send('Runtime.evaluate', { returnByValue: true, expression: `(() => {
  const P = ['color','backgroundColor','backgroundImage','borderTopColor','borderRightColor','borderBottomColor','borderLeftColor','outlineColor','boxShadow','textShadow','fill','stroke','caretColor','textDecorationColor','columnRuleColor'];
  const out = [];
  const els = [document.documentElement, ...document.querySelectorAll('*')];
  els.forEach((e, i) => { for (const pseudo of [null, '::before', '::after', '::placeholder']) { let s; try { s = getComputedStyle(e, pseudo); } catch { continue; }
    if (pseudo && (s.content === 'none' || s.content === 'normal') && pseudo !== '::placeholder') continue;
    out.push(i + (pseudo || '') + ' ' + e.tagName + '.' + [...e.classList].join('.') + ' | ' + P.map(p => s[p]).join(' | ')); } });
  return out; })()` });
const f = `/Users/jeong-kyushin/.claude/jobs/66441cd2/tmp/dark/styles_${ovr}_${scheme}_${page}_${width}.json`;
writeFileSync(f, JSON.stringify(r.result.result.value)); console.log(f, r.result.result.value.length); ws.close();

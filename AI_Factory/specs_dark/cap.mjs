// 다크 테마 검증 캡처 — 별도 헤드리스 크롬(:9333). 공유 브라우저 미사용.
// node cap.mjs <base> <label> <light|dark> <none|repo> [pages=us,kr,en,hub] [widths=375,1280] [mode=full|view]
// repo: Fetch 가로채기로 /css/specs-funnel.css·specs-base.css 를 워크트리 파일로 대체(배포 전 검증)
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
const [base, label, scheme, ovr, pagesArg = 'us,kr,en,hub', widthsArg = '375,1280', shot = 'full'] = process.argv.slice(2);
const W = '/Users/jeong-kyushin/developer/monk_project/.claude/worktrees/makne8-passport-fov-align/monkos_AI/portal/public';
const OUT = '/Users/jeong-kyushin/.claude/jobs/66441cd2/tmp/dark/shots'; mkdirSync(OUT, { recursive: true });
const ALL = { us: '/specs/visa/us', kr: '/specs/passport/kr', en: '/en/specs/visa/us', hub: '/specs' };
const t = (await (await fetch('http://127.0.0.1:9333/json/list')).json()).find((x) => x.type === 'page');
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pend = new Map();
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
ws.addEventListener('message', async (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); return; }
  if (d.method === 'Fetch.requestPaused') {
    const u = d.params.request.url; const f = /\/css\/(specs-funnel|specs-base)\.css/.exec(u);
    if (f && ovr === 'repo') {
      const body = Buffer.from(readFileSync(`${W}/css/${f[1]}.css`)).toString('base64');
      send('Fetch.fulfillRequest', { requestId: d.params.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'text/css; charset=utf-8' }], body });
    } else send('Fetch.continueRequest', { requestId: d.params.requestId });
  }
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result?.result?.value;
await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Fetch.enable', { patterns: [{ urlPattern: '*specs-*.css*', requestStage: 'Request' }] });
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: scheme }] });
for (const p of pagesArg.split(',')) for (const w of widthsArg.split(',').map(Number)) {
  const mobile = w < 800;
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: mobile ? 800 : 900, deviceScaleFactor: 1, mobile });
  await send('Page.navigate', { url: base + ALL[p] });
  for (let i = 0; i < 60; i++) { await sleep(250); if ((await ev('document.readyState')) === 'complete') break; }
  await sleep(1500);
  await ev(`document.fonts ? document.fonts.ready.then(() => 1) : 1`);
  await ev(`(async () => { for (const img of document.images) { img.loading = 'eager'; } window.scrollTo(0, document.body.scrollHeight); await new Promise(r => setTimeout(r, 600)); window.scrollTo(0, 0); await new Promise(r => setTimeout(r, 600)); return 1; })()`);
  let params = { format: 'png' };
  if (shot === 'full') {
    const h = await ev('Math.ceil(document.documentElement.scrollHeight)');
    params = { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: w, height: Math.min(h, 16000), scale: 1 } };
  }
  const s = await send('Page.captureScreenshot', params);
  writeFileSync(`${OUT}/${label}_${scheme}_${p}_${w}.png`, Buffer.from(s.result.data, 'base64'));
  console.log(`${label} ${scheme} ${p}@${w} ok`);
}
ws.close();

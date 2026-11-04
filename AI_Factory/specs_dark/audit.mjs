// 다크·라이트 감사 — 별도 헤드리스 크롬(:9333). node audit.mjs <base> <none|repo> <light|dark> <page> <width>
// ① 밝은 면 잔존: 배경 휘도 > 0.6이고 화면에 보이는 요소(이미지·iframe·svg·canvas 제외)
// ② 글자 대비: 텍스트 노드를 가진 요소의 글자색 vs 실제 바탕(조상 따라 첫 불투명 배경, 반투명은 합성) — WCAG 대비
import { readFileSync, writeFileSync } from 'node:fs';
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
await send('Page.enable'); await send('Runtime.enable'); await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Fetch.enable', { patterns: [{ urlPattern: '*specs-*.css*', requestStage: 'Request' }] });
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: scheme }] });
const w = Number(width);
await send('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: w < 800 });
await send('Page.navigate', { url: base + ALL[page] }); await new Promise((r) => setTimeout(r, 5000));
const r = await send('Runtime.evaluate', { returnByValue: true, expression: `(() => {
  const P = (c) => { const m = c.match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const v = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return { r: v[0], g: v[1], b: v[2], a: v.length > 3 ? v[3] : 1 }; };
  const L = (c) => { const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const over = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 });
  const vis = (e) => { const s = getComputedStyle(e); const b = e.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0.05 && b.width > 2 && b.height > 2; };
  const name = (e) => (e.tagName + (e.id ? '#' + e.id : '') + '.' + [...e.classList].join('.')).slice(0, 60);
  const bgOf = (e) => { const stack = []; let n = e; let img = false;
    while (n && n.nodeType === 1) { const s = getComputedStyle(n); if (s.backgroundImage && s.backgroundImage !== 'none' && !s.backgroundImage.startsWith('linear-gradient') ) img = true;
      const c = P(s.backgroundColor); if (c && c.a > 0) { stack.push(c); if (c.a >= 0.99) break; } n = n.parentElement; }
    let acc = { r: 255, g: 255, b: 255, a: 1 }; if (n === null || !stack.length || stack[stack.length - 1].a < 0.99) acc = ${JSON.stringify(scheme)} === 'dark' ? { r: 20, g: 19, b: 26, a: 1 } : { r: 255, g: 255, b: 255, a: 1 };
    for (let i = stack.length - 1; i >= 0; i--) acc = over(stack[i], acc); return { c: acc, img }; };
  const light = [];
  for (const e of document.querySelectorAll('body *')) { if (['IMG', 'IFRAME', 'SVG', 'CANVAS', 'VIDEO', 'PICTURE', 'path', 'rect', 'line', 'text', 'g', 'circle', 'image', 'svg'].includes(e.tagName)) continue;
    if (!vis(e)) continue; const c = P(getComputedStyle(e).backgroundColor); if (!c || c.a < 0.5) continue;
    if (L(c) > 0.6) { const b = e.getBoundingClientRect(); light.push({ el: name(e), bg: getComputedStyle(e).backgroundColor, area: Math.round(b.width * b.height), y: Math.round(b.top + scrollY) }); } }
  const txt = [];
  for (const e of document.querySelectorAll('body *')) { if (!vis(e)) continue; const own = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1); if (!own) continue;
    const s = getComputedStyle(e); const fg = P(s.color); if (!fg) continue; const bg = bgOf(e); const f = fg.a < 1 ? over(fg, bg.c) : fg;
    const l1 = L(f), l2 = L(bg.c); const cr = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const big = parseFloat(s.fontSize) >= 24 || (parseFloat(s.fontSize) >= 18.66 && +s.fontWeight >= 700);
    txt.push({ el: name(e), text: [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join(' ').slice(0, 30), fg: s.color, bg: 'rgb(' + [bg.c.r, bg.c.g, bg.c.b].map(Math.round).join(',') + ')', cr: +cr.toFixed(2), size: s.fontSize, big, onImg: bg.img }); }
  return { light, txt }; })()` });
const v = r.result.result.value;
const f = `/Users/jeong-kyushin/.claude/jobs/66441cd2/tmp/dark/audit_${ovr}_${scheme}_${page}_${width}.json`;
writeFileSync(f, JSON.stringify(v));
const low = v.txt.filter((x) => !x.onImg && x.cr < (x.big ? 3 : 4.5));
console.log(`${page}@${width} ${scheme}/${ovr}: 밝은 면 ${v.light.length} · 글자 ${v.txt.length} · 대비 미달 ${low.length}`);
ws.close();

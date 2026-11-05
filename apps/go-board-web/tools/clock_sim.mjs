// 초읽기 재생 시뮬레이터 — index.html의 실제 함수(tickClock·clockTick·syncClocks·sayOnce)를 그대로 떼어 와
// 가짜 시계(100ms 타이머)·5초 서버 동기화(오차 주입)로 돌려 사건별 재생 시각을 기록한다 (PF_GO, 11-05).
// 사용: node clock_sim.mjs INDEX_HTML BYO PERIODS [SYNC_ERR_SEC] [TICK_PHASE_MS]
// 출력: JSON {events:[{t, ev, file, late}]} — t는 내 차례 시작 기준 초, late는 정확한 경계 뒤 몇 ms에 재생했나
import fs from 'node:fs';
const [, , html, byoS, perS, errS = '0', phaseS = '0', durS = '{}'] = process.argv;
const DUR = JSON.parse(durS);  // 팩 파일 길이(초) — 안내 뒤 '하나' 지연 계산용
const src = fs.readFileSync(html, 'utf8');
const grab = name => {
  const m = src.match(new RegExp(`^function ${name}\\b[\\s\\S]*?^}\\n`, 'm'));
  if (!m) throw new Error('no ' + name);
  return m[0];
};
const hasSaid = /^function sayOnce\b/m.test(src);
const decl = hasSaid ? src.match(/^const SAID = [^\n]*\n/m)[0] + (src.match(/^(let annEnd|const spanCache|let HANA_DELAY|const HANA_DELAY|try \{ const q = Number|let ANN_MODE|const ANN_TO_HANA|try \{ if \(new URLSearchParams|const CLOCK_LOOKAHEAD|let annEnd|const CLOCK_SNAP|const clockTot|const byoGrace|const byoFull)[^\n]*\n/gm) || []).join('') : '';
const grabOpt = name => (new RegExp(`^function ${name}\\b`, 'm').test(src) ? grab(name) : '');
const BYO = Number(byoS), PER = Number(perS), ERR = Number(errS), PHASE = Number(phaseS);
let NOW = 0;  // 가짜 performance.now (ms)
const events = [];
const env = `
let S, clocks = null, clockTimer = null, clockLast = 0, clockMv = -1, busy = false, SND;
const performance = { now: () => NOW() };
function renderClocks() {}
const location = { search: ${JSON.stringify('?' + (process.env.HANA ? 'hana=' + process.env.HANA + '&' : '') + (process.env.ANN ? 'ann=' + process.env.ANN : ''))} };
function requestAnimationFrame() {}
function clockFrame() {}
function call() {}
function voice(url, delay) { LOG(url, delay || 0); return true; }
const decoded = new Proxy({}, { get: (o, k) => { const v = DUR[k]; if (!v) return null; return typeof v === 'object' ? { duration: v.d, span: { on: v.on, end: v.end } } : { duration: v, span: { on: 70, end: v * 1000 - 150 } }; } });
${decl}${grabOpt('speechSpan')}${grabOpt('sayOnce')}${grab('tickClock')}${grab('clockTick')}${grab('syncClocks')}
return { setS: v => { S = v; }, getClocks: () => clocks, syncClocks, clockTick, setSND: v => { SND = v; }, setTimer: v => { clockTimer = v; } };
`;
let lastUrl = null;
const api = new Function('NOW', 'LOG', 'setInterval', 'DUR', env)(() => NOW, (u, d) => { lastUrl = u; events.push({ t: +(NOW / 1000 + d).toFixed(3), file: u }); }, () => 1, DUR);
const SND = { count: {}, remain: {} };
for (let i = 1; i <= 10; i++) SND.count[i] = `count${i}`;
for (let i = 1; i <= 3; i++) SND.remain[i] = `remain${i}`;
if (DUR.byo) SND.byo = 'byo';
api.setSND(SND);
// 내 차례 시작: 서버 시계 = 초읽기 회 시작
const serverAt = tSec => {  // 서버가 보는 내 시계(정확한 값) + 주입 오차
  let left = PER, rem = BYO - tSec;
  while (rem <= 0 && left > 1) { left--; rem += BYO; }
  return { B: { main: 0, period: BYO, left: PER, inByo: true }, W: { main: 0, period: BYO, left: PER, inByo: true }, running: 'B', elapsed: tSec + ERR };
};
const S = { room: 'r', kind: process.env.KIND || 'ai', moveNo: 1, user: 'B', toMove: 'B', time: { main: 0, byo: BYO, periods: PER }, result: null, scoring: false, clock: serverAt(0), stale: false };
api.setS(S);
NOW = PHASE;
S.clock = serverAt(0); S.clock.elapsed = 0;
api.syncClocks();
const END = BYO * PER + 1.5;
let nextSync = 5000;
for (NOW = PHASE + 100; NOW <= END * 1000 + PHASE; NOW += 100) {
  api.clockTick();
  if (NOW - PHASE >= nextSync) {  // 5초마다 서버 핑 → 동기화(오차 ERR초)
    S.clock = serverAt((NOW - PHASE) / 1000);
    api.syncClocks();
    nextSync += 5000;
  }
  const c = api.getClocks().B;
  if (c.flagged) break;
}
// 정확한 경계 시각과 비교
const exact = {};
for (let L = PER; L >= 1; L--) {
  const base = (PER - L) * BYO;
  for (let k = 10; k >= 1; k--) if (BYO >= k && k < BYO) exact[`${L}:count${11 - k}`] = base + (BYO - k);
  if (L < PER) exact[`${L}:remain${L}`] = base;
}
const out = events.map(e => e.t - PHASE / 1000);
console.log(JSON.stringify({ byo: BYO, periods: PER, err: ERR, phase: PHASE, events: events.map(e => ({ t: +(e.t - PHASE / 1000).toFixed(3), file: e.file })) }));

// 착수 왕복 시뮬레이터 — 상대 수가 서버 지연(lat)을 두고 화면에 도착하고, 내가 think초 뒤 착수하는 판을
// index.html의 실제 함수(tickClock·clockTick·syncClocks·sayOnce·clockMoved)로 돌린다 (PF_GO, 11-05 10:59 지시).
// 사용: node clock_sim_turns.mjs INDEX_HTML BYO PERIODS 'TURNS_JSON' [PHASE_MS] [DUR_JSON]
//   TURNS_JSON = [[lat, think], ...]  (lat: 상대 착수→내 화면 반영 지연 초, think: 반영 뒤 내가 두기까지 초)
// 출력: 턴별 {arrive, moveAt, said:[[t(반영 기준), 파일]]}
import fs from 'node:fs';
const [, , html, byoS, perS, turnsS, phaseS = '0', durS = '{}'] = process.argv;
const DUR = JSON.parse(durS), TURNS = JSON.parse(turnsS);
const src = fs.readFileSync(html, 'utf8');
const grab = name => {
  const m = src.match(new RegExp(`^function ${name}\\b[\\s\\S]*?^}\\n`, 'm'));
  if (!m) throw new Error('no ' + name);
  return m[0];
};
const decl = src.match(/^const SAID = [^\n]*\n/m)[0] + (src.match(/^(let HANA_DELAY|const HANA_DELAY|try \{ const q = Number|const CLOCK_LOOKAHEAD|let annEnd|const CLOCK_SNAP|const clockTot)[^\n]*\n/gm) || []).join('');
const BYO = Number(byoS), PER = Number(perS), PHASE = Number(phaseS);
let NOW = PHASE;
const env = `
let S, clocks = null, clockTimer = null, clockLast = 0, clockMv = -1, busy = false, SND, actx = null;
const performance = { now: () => NOW() };
function renderClocks() {}
const location = { search: ${JSON.stringify(process.env.HANA ? '?hana=' + process.env.HANA : '')} };
function requestAnimationFrame() {}
function clockFrame() {}
function call() {}
function cancelPendingVoice() { CANCEL(); }
function voice(url, delay) { LOG(url, delay || 0); return true; }
const decoded = new Proxy({}, { get: (o, k) => (DUR[k] ? { duration: DUR[k] } : null) });
${decl}${grab('sayOnce')}${grab('tickClock')}${grab('clockTick')}${grab('syncClocks')}${grab('clockMoved')}
return { setS: v => { S = v; }, syncClocks, clockTick, clockMoved, setSND: v => { SND = v; }, clocks: () => clocks };
`;
const said = [];
let pend = [];
const api = new Function('NOW', 'LOG', 'CANCEL', 'setInterval', 'DUR', env)(
  () => NOW,
  (u, d) => { const e = { t: NOW / 1000 + d, file: u }; said.push(e); if (d > 0) pend.push(e); },
  () => { const n = NOW / 1000; for (const e of pend) if (e.t > n + 0.005) e.cancelled = true; pend = []; },
  () => 1, DUR);
const SND = { count: {}, remain: {} };
for (let i = 1; i <= 10; i++) SND.count[i] = `count${i}`;
for (let i = 1; i <= 3; i++) SND.remain[i] = `remain${i}`;
api.setSND(SND);
const clk = (running, elapsed, left) => ({
  B: { main: 0, period: BYO, left, inByo: true }, W: { main: 0, period: BYO, left: PER, inByo: true }, running, elapsed });
const S = { room: 'r', kind: process.env.KIND || 'ai', lastColor: null, moveNo: 0, user: 'B', toMove: 'W', time: { main: 0, byo: BYO, periods: PER }, result: null, scoring: false, stale: false, clock: clk('W', 0, PER) };
api.setS(S);
api.syncClocks();
const out = [];
let left = PER;
const step = until => { while (NOW + 100 <= until) { NOW += 100; api.clockTick(); } };
for (const [lat, think] of TURNS) {
  const tStart = NOW / 1000 + 0.5;            // 상대가 생각 0.5초 뒤 착수(서버 시각)
  step(Math.round((tStart + lat) * 1000) + (PHASE % 100));
  const arrive = NOW / 1000;
  S.moveNo += 1; S.lastColor = 'W'; S.toMove = 'B'; S.clock = clk('B', +(arrive - tStart).toFixed(3), left);
  api.syncClocks();                           // 상대 수 화면 반영(새 moveNo)
  const from = said.length;
  let nextSync = arrive + 5;
  const moveAt = arrive + think;
  while (NOW / 1000 + 0.1 <= moveAt + 1e-9) {
    NOW += 100; api.clockTick();
    if (NOW / 1000 >= nextSync) {  // 5초 핑 — 서버는 tStart 기준으로 잰 값
      const el = NOW / 1000 - tStart; S.clock = clk('B', +el.toFixed(3), left); api.syncClocks(); nextSync += 5;
    }
  }
  api.clockMoved('B');                         // 내 착수
  left = api.clocks().B.left;
  S.moveNo += 1; S.lastColor = 'B'; S.toMove = 'W'; S.clock = clk('W', 0, left);
  api.syncClocks();
  out.push({ lat, think, arrive: +arrive.toFixed(3), said: said.slice(from).map(e => [+(e.t - arrive).toFixed(3), e.file + (e.cancelled ? '(취소)' : '')]) });
}
console.log(JSON.stringify(out));

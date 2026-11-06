#!/usr/bin/env node
// 해설 문장 임베딩 — 유튜브 해설 대화록(해설 화자 구간)을 Vertex text-multilingual-embedding-002(기존 scripts/retrieval/embeddings.js)로 벡터화.
//   NODE_PATH=<본 체크아웃>/scripts/retrieval/node_modules node embed_commentary.js build        # 벡터 생성(비용 상한 검사 후)
//   NODE_PATH=... node embed_commentary.js search "귀와 변의 바꿔치기" [k]                         # 유사 해설 문장
// 단가(실측 2026-11-07 Cloud Billing Catalog, SKU 'Embeddings for Text - Predictions'): $0.000025 / 1,000자(count=문자). 상한 $2 넘으면 중단.
// 출력(레포 밖): ~/.monkos/go-board/analysis/commentary_v0/emb/{vectors.f32, meta.jsonl, cost.json}
const fs = require('fs');
const path = require('path');
const os = require('os');
const { embedTexts } = require(path.join(__dirname, '..', '..', 'scripts', 'retrieval', 'embeddings.js'));

const YT = path.join(os.homedir(), '.monkos/go-commentary-yt/answers/corrected.jsonl');
const OUT = path.join(os.homedir(), '.monkos/go-board/analysis/commentary_v0/emb');
const PRICE_PER_CHAR = 0.000025 / 1000;
const CAP_USD = 2.0;
const DIM = 768;
const CONC = 8;   // 동시 요청(요청당 5문장 — embeddings.js BATCH_SIZE)
const MIN_CHARS = 12;

function loadLines() {
  const out = [];
  for (const x of fs.readFileSync(YT, 'utf8').split('\n')) {
    if (!x.trim()) continue;
    const d = JSON.parse(x);
    if (d.speaker !== '해설' || !d.text || d.text.startsWith('[') || d.text.length < MIN_CHARS) continue;
    out.push({ id: d.id, commentator: d.commentator, t: d.t_start, t_end: d.t_end, text: d.text });
  }
  return out;
}

async function build() {
  const lines = loadLines();
  const chars = lines.reduce((a, l) => a + l.text.length, 0);
  const est = chars * PRICE_PER_CHAR;
  console.log(`구간 ${lines.length} · ${chars}자 · 예상 $${est.toFixed(4)} (상한 $${CAP_USD})`);
  if (est > CAP_USD) { console.error('❌ embed: 예상 비용이 상한 초과 — 중단'); process.exit(1); }
  fs.mkdirSync(OUT, { recursive: true });
  const vec = new Float32Array(lines.length * DIM);
  const t0 = Date.now();
  let done = 0;
  const chunks = [];
  for (let i = 0; i < lines.length; i += 5) chunks.push(i);
  let next = 0;
  async function worker() {
    while (next < chunks.length) {
      const i = chunks[next++];
      const batch = lines.slice(i, i + 5).map(l => l.text);
      let tries = 0;
      for (;;) {
        try {
          const v = await embedTexts(batch);
          v.forEach((e, j) => vec.set(e, (i + j) * DIM));
          break;
        } catch (e) {
          if (++tries > 5) throw e;
          await new Promise(r => setTimeout(r, 1000 * tries));
        }
      }
      done += batch.length;
      if (done % 1000 < 5) process.stdout.write(`  ${done}/${lines.length} ${((Date.now() - t0) / 1000).toFixed(0)}s\n`);
    }
  }
  await Promise.all(Array.from({ length: CONC }, worker));
  fs.writeFileSync(path.join(OUT, 'vectors.f32'), Buffer.from(vec.buffer));
  fs.writeFileSync(path.join(OUT, 'meta.jsonl'), lines.map(l => JSON.stringify(l)).join('\n') + '\n');
  const cost = { segments: lines.length, chars, usd: +(chars * PRICE_PER_CHAR).toFixed(4), price: '$0.000025/1k chars (Cloud Billing Catalog SKU Embeddings for Text - Predictions, 2026-11-06 eff)', model: 'text-multilingual-embedding-002', sec: (Date.now() - t0) / 1000, at: new Date().toISOString() };
  fs.writeFileSync(path.join(OUT, 'cost.json'), JSON.stringify(cost, null, 1));
  console.log('완료', cost);
}

function load() {
  const meta = fs.readFileSync(path.join(OUT, 'meta.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
  const buf = fs.readFileSync(path.join(OUT, 'vectors.f32'));
  const vec = new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4);
  return { meta, vec };
}

async function search(q, k) {
  const { meta, vec } = load();
  const [qv] = await embedTexts([q]);
  let qn = 0; for (let j = 0; j < DIM; j++) qn += qv[j] * qv[j]; qn = Math.sqrt(qn);
  const sc = meta.map((m, i) => {
    let s = 0, n = 0;
    for (let j = 0; j < DIM; j++) { const a = vec[i * DIM + j]; s += a * qv[j]; n += a * a; }
    return [s / (Math.sqrt(n) * qn), i];
  }).sort((a, b) => b[0] - a[0]).slice(0, k);
  return sc.map(([s, i]) => ({ score: +s.toFixed(3), ...meta[i] }));
}

(async () => {
  const [cmd, q, k] = process.argv.slice(2);
  if (cmd === 'build') await build();
  else if (cmd === 'search') console.log(JSON.stringify(await search(q, +(k || 8)), null, 1));
  else console.log('사용: build | search "질의" [k]');
})().catch(e => { console.error('❌ embed:', e.message); process.exit(1); });

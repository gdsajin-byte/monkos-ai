#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Database = require('better-sqlite3');
const matter = require('gray-matter');

const SCAN_DIRS = [
  path.resolve(__dirname, '../../monkos-ops'),
  path.resolve(__dirname, '../../governance'),
  path.resolve(__dirname, '../../docs'),
];
const DB_PATH = path.join(__dirname, 'monk_index.db');
const PORTFOLIOS_README = path.resolve(__dirname, '../../monkos-ops/ops/portfolios/README.md');

const PF_PATTERN = /PF_([A-Z0-9_]+)/g;
const DATE_FROM_FOLDER = /(\d{4}-\d{2})/;
const DATE_FROM_FILENAME = /(\d{8})/;
const SESSION_TURN_RE = /(?=\*\*\[\d{4}-\d{2}-\d{2} \d{2}:\d{2} KST\]\*\*)/;
const TURN_ANCHOR_RE = /\*\*\[(\d{4}-\d{2}-\d{2}) (\d{2}):(\d{2}) KST\]\*\*/;
const CHUNK_MAX = 4000;

const embedMode = process.argv.includes('--embed');

// 출력 경로 재정의: --out <path> 또는 MONK_INDEX_OUT. 기본은 정본 monk_index.db.
// 빌드는 항상 <out>.building.tmp 스테이징 파일에 쓰고 성공 시에만 rename → 중단(kill)돼도 기존 DB가 빈 파일로 대체되지 않는다.
function resolveOutPath() {
  const idx = process.argv.indexOf('--out');
  if (idx >= 0 && process.argv[idx + 1]) return path.resolve(process.argv[idx + 1]);
  if (process.env.MONK_INDEX_OUT) return path.resolve(process.env.MONK_INDEX_OUT);
  return DB_PATH;
}
const OUT_PATH = resolveOutPath();
const STAGING_PATH = `${OUT_PATH}.building.tmp`;

function unlinkQuiet(p) {
  try { fs.unlinkSync(p); } catch {}
}
function removeSqliteSet(p) {
  unlinkQuiet(p); unlinkQuiet(`${p}-wal`); unlinkQuiet(`${p}-shm`);
}

function scanMarkdownFiles(dir) {
  const results = [];
  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        walk(fullPath);
      } else if (entry.name.endsWith('.md')) {
        results.push(fullPath);
      }
    }
  }
  walk(dir);
  return results;
}

function extractPFFromFilename(filename) {
  const matches = [];
  let m;
  while ((m = PF_PATTERN.exec(filename)) !== null) {
    matches.push(`PF_${m[1]}`);
  }
  PF_PATTERN.lastIndex = 0;
  return matches;
}

function inferDateFromPath(filePath) {
  const folderMatch = filePath.match(DATE_FROM_FOLDER);
  if (folderMatch) {
    return folderMatch[1] + '-01';
  }
  const fnMatch = path.basename(filePath).match(DATE_FROM_FILENAME);
  if (fnMatch) {
    const d = fnMatch[1];
    return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
  }
  return null;
}

function parsePortfolioField(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(v => String(v).trim());
  return String(val).split(',').map(v => v.trim()).filter(Boolean);
}

function contentHash(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function toKebab(str) {
  return str.replace(/[^\w\s가-힣-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60);
}

// --- Chunking ---

function splitChunks(content, type, relPath) {
  const isGovernance = relPath.startsWith('governance/');
  const isPFReadme = /portfolios\/PF_[A-Z0-9_]+\/README\.md$/.test(relPath);

  let chunks;
  if (type === 'session_log') {
    chunks = splitByTurns(content);
  } else if (isPFReadme) {
    chunks = splitPFReadme(content);
  } else if (isGovernance) {
    chunks = splitByHeading(content, '### ');
  } else if (['order', 'completion', 'report', 'proposal', 'design', 'spec', 'petition'].includes(type)) {
    chunks = splitByHeading(content, '## ');
  } else {
    chunks = splitSlidingWindow(content);
  }

  const result = [];
  for (const chunk of chunks) {
    if (chunk.content.length > CHUNK_MAX) {
      const subs = splitSlidingWindow(chunk.content);
      for (let i = 0; i < subs.length; i++) {
        result.push({
          content: subs[i].content,
          anchor: chunk.anchor ? `${chunk.anchor}-${i + 1}` : `#chunk-${result.length + 1}`,
        });
      }
    } else if (chunk.content.trim()) {
      result.push(chunk);
    }
  }

  return result.length > 0 ? result : [{ content: content.slice(0, CHUNK_MAX), anchor: null }];
}

function splitByTurns(content) {
  const parts = content.split(SESSION_TURN_RE).filter(p => p.trim());
  if (parts.length <= 1) return [{ content, anchor: null }];
  return parts.map(part => {
    const m = part.match(TURN_ANCHOR_RE);
    const anchor = m ? `#${m[1]}-${m[2]}${m[3]}` : null;
    return { content: part.trim(), anchor };
  });
}

function splitByHeading(content, prefix) {
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(?=^${escaped}\\S)`, 'gm');
  const parts = content.split(regex).filter(p => p.trim());
  if (parts.length <= 1) return [{ content, anchor: null }];
  return parts.map(part => {
    const hMatch = part.match(new RegExp(`^${escaped}(.+)`, 'm'));
    const anchor = hMatch ? `#${toKebab(hMatch[1])}` : null;
    return { content: part.trim(), anchor };
  });
}

function splitPFReadme(content) {
  const h2Chunks = splitByHeading(content, '## ');
  const result = [];

  for (const chunk of h2Chunks) {
    const lines = chunk.content.split('\n');
    const isTableSep = l => /^\|[\s-:|]+$/.test(l.trim());
    const isTableRow = l => l.trim().startsWith('|') && !isTableSep(l);
    const dataRows = lines.filter(isTableRow);

    if (dataRows.length > 31) {
      const tableStart = lines.findIndex(l => l.trim().startsWith('|'));
      let tableEnd = tableStart;
      for (let i = tableStart + 1; i < lines.length; i++) {
        if (lines[i].trim().startsWith('|')) tableEnd = i;
        else break;
      }
      const preTable = lines.slice(0, tableStart).join('\n').trim();
      const allTable = lines.slice(tableStart, tableEnd + 1);
      const postTable = lines.slice(tableEnd + 1).join('\n').trim();

      let headerEnd = 1;
      if (allTable.length > 1 && isTableSep(allTable[1])) headerEnd = 2;
      const header = allTable.slice(0, headerEnd);
      const data = allTable.slice(headerEnd);

      let num = 1;
      for (let i = 0; i < data.length; i += 30) {
        const batch = data.slice(i, i + 30);
        let c = '';
        if (i === 0 && preTable) c += preTable + '\n\n';
        c += header.join('\n') + '\n' + batch.join('\n');
        if (i + 30 >= data.length && postTable) c += '\n\n' + postTable;
        result.push({ content: c.trim(), anchor: chunk.anchor ? `${chunk.anchor}-${num}` : `#table-${num}` });
        num++;
      }
    } else {
      result.push(chunk);
    }
  }

  return result;
}

function splitSlidingWindow(content, windowSize = 2000, overlap = 500) {
  if (content.length <= windowSize) return [{ content, anchor: '#chunk-1' }];
  const chunks = [];
  let start = 0;
  let idx = 1;
  while (start < content.length) {
    const end = Math.min(start + windowSize, content.length);
    chunks.push({ content: content.slice(start, end), anchor: `#chunk-${idx}` });
    if (end >= content.length) break;
    start += windowSize - overlap;
    idx++;
  }
  return chunks;
}

// --- Axis mapping ---

function loadAxisMapping() {
  if (!fs.existsSync(PORTFOLIOS_README)) return new Map();
  const raw = fs.readFileSync(PORTFOLIOS_README, 'utf8');
  const lines = raw.split('\n');
  const mapping = new Map();
  let colMap = null;

  for (const line of lines) {
    if (!line.trim().startsWith('|')) continue;
    const cells = line.split('|').slice(1, -1).map(c => c.trim());
    if (!colMap) {
      const pfIdx = cells.findIndex(c => c === 'PF');
      const axisIdx = cells.findIndex(c => c === '축');
      if (pfIdx >= 0 && axisIdx >= 0) colMap = { pf: pfIdx, axis: axisIdx };
      continue;
    }
    if (cells[0] && /^[-:\s]+$/.test(cells[0])) continue;
    if (cells.length > Math.max(colMap.pf, colMap.axis)) {
      const pfCell = cells[colMap.pf].replace(/\*\*/g, '');
      const axisCell = cells[colMap.axis].replace(/\*\*/g, '').trim();
      const pfMatch = pfCell.match(/(PF_[A-Z0-9_]+)/);
      if (pfMatch && axisCell && axisCell !== '—' && axisCell !== '-') {
        mapping.set(pfMatch[1], axisCell);
      }
    }
  }
  return mapping;
}

// --- Embedding cache (영속 사이드카 DB, content_hash 키) ---
// 09-27 교정: 캐시가 인덱스 DB 안에만 있으면 타임아웃 kill 시 스테이징과 함께 진행분이 폐기되어
// [B]가 매 회차 처음부터 재시작 → 영구 미완. 배치마다 사이드카에 커밋해 중단돼도 진행분이 남고 다음 회차가 이어간다.
// 키 = content_hash + model: 경로·앵커가 바뀌어도(이동·개명) 내용이 같으면 재임베딩하지 않는다.

const EMBED_CACHE_PATH = process.env.MONK_EMBED_CACHE
  ? path.resolve(process.env.MONK_EMBED_CACHE)
  : path.join(__dirname, 'embed_cache.db');
const { MODEL: EMBED_MODEL } = require('./embeddings');

function openEmbedCache() {
  const cache = new Database(EMBED_CACHE_PATH);
  cache.pragma('journal_mode = WAL');
  cache.pragma('busy_timeout = 5000');
  cache.exec(`
    CREATE TABLE IF NOT EXISTS embed_cache (
      content_hash TEXT NOT NULL,
      model TEXT NOT NULL,
      embedding BLOB NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (content_hash, model)
    );
  `);
  seedCacheFromIndex(cache);
  return cache;
}

// 구 방식(인덱스 DB 내 chunk_embeddings)에 벡터가 있으면 사이드카로 1회 이관 — INSERT OR IGNORE라 반복 실행 무해
function seedCacheFromIndex(cache) {
  if (!fs.existsSync(DB_PATH)) return;
  let oldDb;
  try {
    oldDb = new Database(DB_PATH, { readonly: true });
    const hasTable = oldDb.prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='chunk_embeddings'`
    ).get();
    if (!hasTable) return;
    const rows = oldDb.prepare('SELECT content_hash, embedding FROM chunk_embeddings').all();
    const ins = cache.prepare(
      `INSERT OR IGNORE INTO embed_cache (content_hash, model, embedding, created_at) VALUES (?, ?, ?, ?)`
    );
    const now = new Date().toISOString();
    let added = 0;
    cache.transaction(() => {
      for (const r of rows) added += ins.run(r.content_hash, EMBED_MODEL, r.embedding, now).changes;
    })();
    if (added > 0) console.log(`   임베딩 캐시 이관: 인덱스 DB → 사이드카 ${added}건`);
  } catch (e) {
    console.error(`⚠️ 임베딩 캐시 이관 실패(무시하고 진행): ${e.message}`);
  } finally {
    if (oldDb) oldDb.close();
  }
}

// --- Main build ---

async function buildIndex() {
  // 임베딩 캐시는 사이드카에서 읽는다 — --embed 없이도 해시 일치 벡터는 로컬 이월(네트워크 불요)
  const embedCache = openEmbedCache();
  const cacheSize = embedCache.prepare('SELECT COUNT(*) AS cnt FROM embed_cache WHERE model = ?').get(EMBED_MODEL).cnt;
  const carryOver = !embedMode && cacheSize > 0;

  removeSqliteSet(STAGING_PATH);

  const db = new Database(STAGING_PATH);
  // 스테이징은 rename 전까지 폐기 가능한 파일 — 저널을 메모리에 두어 kill 시 -wal/-shm/-journal 잔재(gitignore 밖)를 남기지 않는다
  db.pragma('journal_mode = MEMORY');
  db.pragma('synchronous = OFF');

  db.exec(`
    CREATE TABLE documents (
      id INTEGER PRIMARY KEY,
      path TEXT UNIQUE NOT NULL,
      filename TEXT NOT NULL,
      type TEXT,
      date TEXT,
      device TEXT,
      agent TEXT,
      status TEXT,
      subject TEXT,
      from_agent TEXT,
      to_agent TEXT,
      content_preview TEXT
    );

    CREATE TABLE doc_portfolios (
      doc_id INTEGER REFERENCES documents(id),
      portfolio TEXT NOT NULL
    );

    CREATE TABLE chunks (
      id INTEGER PRIMARY KEY,
      doc_id INTEGER REFERENCES documents(id),
      chunk_index INTEGER NOT NULL,
      anchor TEXT,
      content TEXT NOT NULL,
      content_hash TEXT NOT NULL
    );

    CREATE VIRTUAL TABLE chunks_fts USING fts5(
      content,
      content='chunks', content_rowid='id'
    );

    CREATE TRIGGER chunks_ai AFTER INSERT ON chunks BEGIN
      INSERT INTO chunks_fts(rowid, content)
      VALUES (new.id, new.content);
    END;

    CREATE TABLE pf_axis (
      portfolio TEXT PRIMARY KEY,
      axis TEXT NOT NULL
    );

    CREATE INDEX idx_doc_date ON documents(date);
    CREATE INDEX idx_doc_type ON documents(type);
    CREATE INDEX idx_dp_portfolio ON doc_portfolios(portfolio);
    CREATE INDEX idx_dp_doc_id ON doc_portfolios(doc_id);
    CREATE INDEX idx_chunk_doc ON chunks(doc_id);
  `);

  if (embedMode || carryOver) {
    db.exec(`
      CREATE TABLE chunk_embeddings (
        chunk_id INTEGER PRIMARY KEY REFERENCES chunks(id),
        embedding BLOB NOT NULL,
        content_hash TEXT NOT NULL
      );
    `);
  }

  const insertDoc = db.prepare(`
    INSERT INTO documents (path, filename, type, date, device, agent, status, subject, from_agent, to_agent, content_preview)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertPF = db.prepare(`INSERT INTO doc_portfolios (doc_id, portfolio) VALUES (?, ?)`);
  const insertChunk = db.prepare(`INSERT INTO chunks (doc_id, chunk_index, anchor, content, content_hash) VALUES (?, ?, ?, ?, ?)`);
  const insertAxis = db.prepare(`INSERT OR IGNORE INTO pf_axis (portfolio, axis) VALUES (?, ?)`);

  const files = [];
  for (const dir of SCAN_DIRS) {
    if (fs.existsSync(dir)) files.push(...scanMarkdownFiles(dir));
  }

  const chunkRecords = [];

  const insertAll = db.transaction(() => {
    for (const fullPath of files) {
      const relPath = path.relative(path.resolve(__dirname, '../..'), fullPath);
      const filename = path.basename(fullPath);

      let raw;
      try { raw = fs.readFileSync(fullPath, 'utf8'); } catch { continue; }

      let frontmatter = {};
      let content = raw;
      try {
        const parsed = matter(raw);
        frontmatter = parsed.data || {};
        content = parsed.content || '';
      } catch {}

      const type = frontmatter.type || null;
      let date = null;
      if (frontmatter.date) {
        date = frontmatter.date instanceof Date
          ? frontmatter.date.toISOString().slice(0, 10)
          : String(frontmatter.date).slice(0, 10);
      } else {
        date = inferDateFromPath(fullPath);
      }
      const device = frontmatter.device || null;
      const agent = frontmatter.agent || null;
      const status = frontmatter.status || null;
      const subject = frontmatter.subject || null;
      const fromAgent = frontmatter.from || null;
      const toAgent = frontmatter.to || null;
      const contentPreview = content.replace(/\s+/g, ' ').trim().slice(0, 2000);

      const result = insertDoc.run(relPath, filename, type, date, device, agent, status, subject, fromAgent, toAgent, contentPreview);
      const docId = result.lastInsertRowid;

      const portfolios = new Set();
      for (const pf of parsePortfolioField(frontmatter.portfolio)) portfolios.add(pf);
      for (const pf of extractPFFromFilename(filename)) portfolios.add(pf);
      for (const pf of portfolios) insertPF.run(docId, pf);

      const chunks = splitChunks(content, type, relPath);
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const hash = contentHash(chunk.content);
        const chunkResult = insertChunk.run(docId, i, chunk.anchor, chunk.content, hash);
        if (embedMode || carryOver) {
          chunkRecords.push({ chunkId: Number(chunkResult.lastInsertRowid), content: chunk.content, hash });
        }
      }
    }
  });

  insertAll();

  // Axis mapping
  const axisMap = loadAxisMapping();
  const insertAxisTx = db.transaction(() => {
    for (const [pf, axis] of axisMap) insertAxis.run(pf, axis);
  });
  insertAxisTx();

  const docCount = db.prepare('SELECT COUNT(*) as cnt FROM documents').get().cnt;
  const chunkCount = db.prepare('SELECT COUNT(*) as cnt FROM chunks').get().cnt;
  const pfLinks = db.prepare('SELECT COUNT(*) as cnt FROM doc_portfolios').get().cnt;
  const uniquePFs = db.prepare('SELECT COUNT(DISTINCT portfolio) as cnt FROM doc_portfolios').get().cnt;
  const axisCount = db.prepare('SELECT COUNT(*) as cnt FROM pf_axis').get().cnt;

  console.log(`✅ 인덱스 빌드 완료`);
  console.log(`   문서: ${docCount}건`);
  console.log(`   청크: ${chunkCount}건`);
  console.log(`   PF 링크: ${pfLinks}건 (${uniquePFs}개 PF)`);
  console.log(`   축 매핑: ${axisCount}건`);

  let embedError = null;
  if (embedMode) {
    try {
      await buildEmbeddings(db, chunkRecords, embedCache);
    } catch (e) {
      // 임베딩 실패는 BM25 테이블을 훼손하지 않는다 — 부분 삽입분은 그대로 두고 명시 경고. 완료 배치는 사이드카에 적립됨
      embedError = e;
      console.error(`\n🔴 임베딩 실패 — BM25 인덱스는 유지, 벡터는 부분/0건 (완료 배치는 캐시 적립): ${e.message}`);
    }
  } else if (carryOver) {
    const insertEmb = db.prepare(
      `INSERT INTO chunk_embeddings (chunk_id, embedding, content_hash) VALUES (?, ?, ?)`
    );
    const getCached = embedCache.prepare('SELECT embedding FROM embed_cache WHERE content_hash = ? AND model = ?');
    let reused = 0;
    db.transaction(() => {
      for (const rec of chunkRecords) {
        const cached = getCached.get(rec.hash, EMBED_MODEL);
        if (cached) { insertEmb.run(rec.chunkId, cached.embedding, rec.hash); reused++; }
      }
    })();
    console.log(`   임베딩 캐시 이월: ${reused}/${chunkRecords.length}건 (네트워크 미사용)`);
  }
  embedCache.close();

  const hasEmbTable = db.prepare(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='chunk_embeddings'`
  ).get();
  const totalEmb = hasEmbTable
    ? db.prepare('SELECT COUNT(*) as cnt FROM chunk_embeddings').get().cnt
    : 0;
  if (totalEmb === 0 && embedMode) {
    console.error('⚠️ 임베딩 0건 — --embed 요청했으나 벡터 없음');
  }

  // 마무리: 단일 파일 상태로 close → 원자적 rename. 구 정본의 -wal/-shm 잔재도 제거.
  db.close();
  fs.renameSync(STAGING_PATH, OUT_PATH);
  unlinkQuiet(`${OUT_PATH}-wal`); unlinkQuiet(`${OUT_PATH}-shm`);

  const embedLabel = embedMode ? (embedError ? '임베딩 실패' : '임베딩 완료') : (carryOver ? '임베딩 캐시 이월' : 'BM25 전용');
  console.log(`📊 인덱스 요약: 문서 ${docCount} · 청크 ${chunkCount} · 임베딩 ${totalEmb} · ${embedLabel} · DB ${OUT_PATH}`);

  if (embedError) process.exitCode = 2; // 2 = BM25 정상·임베딩 실패 (호출측이 구분 가능)
}

async function buildEmbeddings(db, chunkRecords, cache) {
  const { embedTexts } = require('./embeddings');
  const insertEmb = db.prepare(
    `INSERT INTO chunk_embeddings (chunk_id, embedding, content_hash) VALUES (?, ?, ?)`
  );
  const getCached = cache.prepare('SELECT embedding FROM embed_cache WHERE content_hash = ? AND model = ?');
  const putCache = cache.prepare(
    `INSERT OR REPLACE INTO embed_cache (content_hash, model, embedding, created_at) VALUES (?, ?, ?, ?)`
  );

  // 동일 내용 청크는 1회만 임베딩 (hash → 해당 chunkId 목록)
  const needByHash = new Map();
  let reusedCount = 0;

  db.transaction(() => {
    for (const rec of chunkRecords) {
      const cached = getCached.get(rec.hash, EMBED_MODEL);
      if (cached) {
        insertEmb.run(rec.chunkId, cached.embedding, rec.hash);
        reusedCount++;
      } else if (needByHash.has(rec.hash)) {
        needByHash.get(rec.hash).chunkIds.push(rec.chunkId);
      } else {
        needByHash.set(rec.hash, { text: rec.content, hash: rec.hash, chunkIds: [rec.chunkId] });
      }
    }
  })();

  const needEmbed = [...needByHash.values()];
  console.log(`\n🧠 임베딩 진행: ${chunkRecords.length}건 (캐시 ${reusedCount}건, 신규/변경 고유 ${needEmbed.length}건) · 캐시 ${EMBED_CACHE_PATH}`);

  if (needEmbed.length > 0) {
    const BATCH = 20;
    for (let i = 0; i < needEmbed.length; i += BATCH) {
      const batch = needEmbed.slice(i, i + BATCH);
      const texts = batch.map(b => b.text);
      const embeddings = await embedTexts(texts);
      const now = new Date().toISOString();

      // 사이드카 커밋을 먼저 — 이 직후 kill돼도 이 배치는 다음 회차에 재사용된다
      cache.transaction(() => {
        for (let j = 0; j < batch.length; j++) {
          putCache.run(batch[j].hash, EMBED_MODEL, Buffer.from(embeddings[j].buffer), now);
        }
      })();
      db.transaction(() => {
        for (let j = 0; j < batch.length; j++) {
          const buf = Buffer.from(embeddings[j].buffer);
          for (const chunkId of batch[j].chunkIds) insertEmb.run(chunkId, buf, batch[j].hash);
        }
      })();

      const done = Math.min(i + BATCH, needEmbed.length);
      process.stdout.write(`   임베딩: ${done}/${needEmbed.length}\r`);
    }
    console.log(`   임베딩: ${needEmbed.length}/${needEmbed.length} 완료`);
  }

  const embCount = db.prepare('SELECT COUNT(*) as cnt FROM chunk_embeddings').get().cnt;
  console.log(`   임베딩 벡터: ${embCount}건`);
}

// 주의: SIGTERM 핸들러를 달지 않는다 — 동기 빌드 구간(~14s)에서 Node는 시그널을 이벤트루프까지 지연시켜
// 타임아웃 kill이 무효화된다(09-27 실측). 기본 처분(즉시 종료)을 유지하고, 스테이징 잔재는 다음 빌드 시작 시 제거한다.

buildIndex().catch(err => {
  console.error(`🔴 인덱스 빌드 실패 — 기존 DB 미변경 (스테이징 파일 폐기): ${err.message}`);
  removeSqliteSet(STAGING_PATH);
  process.exit(1);
});

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

// --- Embedding cache (chunks-based) ---

function loadExistingEmbeddings() {
  if (!fs.existsSync(DB_PATH)) return new Map();
  try {
    const oldDb = new Database(DB_PATH, { readonly: true });
    const hasTable = oldDb.prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='chunk_embeddings'`
    ).get();
    if (!hasTable) { oldDb.close(); return new Map(); }

    const rows = oldDb.prepare(`
      SELECT d.path, c.anchor, ce.embedding, ce.content_hash
      FROM chunk_embeddings ce
      JOIN chunks c ON c.id = ce.chunk_id
      JOIN documents d ON d.id = c.doc_id
    `).all();
    oldDb.close();

    const cache = new Map();
    for (const row of rows) {
      const key = row.anchor ? `${row.path}#${row.anchor}` : row.path;
      cache.set(key, { embedding: row.embedding, contentHash: row.content_hash });
    }
    return cache;
  } catch {
    return new Map();
  }
}

// --- Main build ---

async function buildIndex() {
  const embeddingCache = embedMode ? loadExistingEmbeddings() : new Map();

  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

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

  if (embedMode) {
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
        if (embedMode) {
          const cacheKey = chunk.anchor ? `${relPath}#${chunk.anchor}` : relPath;
          chunkRecords.push({ chunkId: Number(chunkResult.lastInsertRowid), cacheKey, content: chunk.content, hash });
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

  if (embedMode) {
    await buildEmbeddings(db, chunkRecords, embeddingCache);
  }

  const hasEmbTable = db.prepare(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='chunk_embeddings'`
  ).get();
  const totalEmb = hasEmbTable
    ? db.prepare('SELECT COUNT(*) as cnt FROM chunk_embeddings').get().cnt
    : 0;
  if (totalEmb === 0) {
    console.error('⚠️ 임베딩 0건 — --embed 플래그 확인 필요');
  }

  console.log(`   DB: ${DB_PATH}`);
  db.close();
}

async function buildEmbeddings(db, chunkRecords, cache) {
  const { embedTexts } = require('./embeddings');
  const insertEmb = db.prepare(
    `INSERT INTO chunk_embeddings (chunk_id, embedding, content_hash) VALUES (?, ?, ?)`
  );

  const needEmbed = [];
  const reused = [];

  for (const rec of chunkRecords) {
    const cached = cache.get(rec.cacheKey);
    if (cached && cached.contentHash === rec.hash) {
      reused.push({ chunkId: rec.chunkId, embedding: cached.embedding, hash: rec.hash });
    } else {
      needEmbed.push({ chunkId: rec.chunkId, text: rec.content, hash: rec.hash });
    }
  }

  console.log(`\n🧠 임베딩 진행: ${chunkRecords.length}건 (신규/변경 ${needEmbed.length}건, 캐시 ${reused.length}건)`);

  const insertCached = db.transaction(() => {
    for (const r of reused) insertEmb.run(r.chunkId, r.embedding, r.hash);
  });
  insertCached();

  if (needEmbed.length > 0) {
    const BATCH = 20;
    for (let i = 0; i < needEmbed.length; i += BATCH) {
      const batch = needEmbed.slice(i, i + BATCH);
      const texts = batch.map(b => b.text);
      const embeddings = await embedTexts(texts);

      const insertBatch = db.transaction(() => {
        for (let j = 0; j < batch.length; j++) {
          const buf = Buffer.from(embeddings[j].buffer);
          insertEmb.run(batch[j].chunkId, buf, batch[j].hash);
        }
      });
      insertBatch();

      const done = Math.min(i + BATCH, needEmbed.length);
      process.stdout.write(`   임베딩: ${done}/${needEmbed.length}\r`);
    }
    console.log(`   임베딩: ${needEmbed.length}/${needEmbed.length} 완료`);
  }

  const embCount = db.prepare('SELECT COUNT(*) as cnt FROM chunk_embeddings').get().cnt;
  console.log(`   임베딩 벡터: ${embCount}건`);
}

buildIndex();

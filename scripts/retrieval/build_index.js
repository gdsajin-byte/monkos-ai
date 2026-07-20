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

const PF_PATTERN = /PF_([A-Z0-9_]+)/g;
const DATE_FROM_FOLDER = /(\d{4}-\d{2})/;
const DATE_FROM_FILENAME = /(\d{8})/;

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

function loadExistingEmbeddings() {
  if (!fs.existsSync(DB_PATH)) return new Map();
  try {
    const oldDb = new Database(DB_PATH, { readonly: true });
    const hasTable = oldDb.prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='doc_embeddings'`
    ).get();
    if (!hasTable) { oldDb.close(); return new Map(); }

    const rows = oldDb.prepare(`
      SELECT d.path, e.embedding, e.content_hash
      FROM doc_embeddings e JOIN documents d ON d.id = e.doc_id
    `).all();
    oldDb.close();

    const cache = new Map();
    for (const row of rows) {
      cache.set(row.path, { embedding: row.embedding, contentHash: row.content_hash });
    }
    return cache;
  } catch {
    return new Map();
  }
}

function contentHash(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

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

    CREATE VIRTUAL TABLE documents_fts USING fts5(
      path, filename, subject, content_preview,
      content='documents', content_rowid='id'
    );

    CREATE TRIGGER documents_ai AFTER INSERT ON documents BEGIN
      INSERT INTO documents_fts(rowid, path, filename, subject, content_preview)
      VALUES (new.id, new.path, new.filename, new.subject, new.content_preview);
    END;

    CREATE INDEX idx_doc_date ON documents(date);
    CREATE INDEX idx_doc_type ON documents(type);
    CREATE INDEX idx_dp_portfolio ON doc_portfolios(portfolio);
    CREATE INDEX idx_dp_doc_id ON doc_portfolios(doc_id);
  `);

  if (embedMode) {
    db.exec(`
      CREATE TABLE doc_embeddings (
        doc_id INTEGER PRIMARY KEY REFERENCES documents(id),
        embedding BLOB NOT NULL,
        content_hash TEXT NOT NULL
      );
    `);
  }

  const insertDoc = db.prepare(`
    INSERT INTO documents (path, filename, type, date, device, agent, status, subject, from_agent, to_agent, content_preview)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertPF = db.prepare(`
    INSERT INTO doc_portfolios (doc_id, portfolio) VALUES (?, ?)
  `);

  const files = [];
  for (const dir of SCAN_DIRS) {
    if (fs.existsSync(dir)) {
      files.push(...scanMarkdownFiles(dir));
    }
  }

  const docRecords = [];

  const insertAll = db.transaction(() => {
    for (const fullPath of files) {
      const relPath = path.relative(path.resolve(__dirname, '../..'), fullPath);
      const filename = path.basename(fullPath);

      let raw;
      try {
        raw = fs.readFileSync(fullPath, 'utf8');
      } catch {
        continue;
      }

      let frontmatter = {};
      let content = raw;
      try {
        const parsed = matter(raw);
        frontmatter = parsed.data || {};
        content = parsed.content || '';
      } catch {
        // no frontmatter
      }

      const type = frontmatter.type || null;
      let date = null;
      if (frontmatter.date) {
        if (frontmatter.date instanceof Date) {
          date = frontmatter.date.toISOString().slice(0, 10);
        } else {
          date = String(frontmatter.date).slice(0, 10);
        }
      } else {
        date = inferDateFromPath(fullPath);
      }
      const device = frontmatter.device || null;
      const agent = frontmatter.agent || null;
      const status = frontmatter.status || null;
      const subject = frontmatter.subject || null;
      const fromAgent = frontmatter.from || null;
      const toAgent = frontmatter.to || null;
      const contentPreview = content.replace(/\s+/g, ' ').trim().slice(0, 500);

      const result = insertDoc.run(
        relPath, filename, type, date, device, agent, status, subject, fromAgent, toAgent, contentPreview
      );
      const docId = result.lastInsertRowid;

      const portfolios = new Set();
      for (const pf of parsePortfolioField(frontmatter.portfolio)) {
        portfolios.add(pf);
      }
      for (const pf of extractPFFromFilename(filename)) {
        portfolios.add(pf);
      }

      for (const pf of portfolios) {
        insertPF.run(docId, pf);
      }

      if (embedMode) {
        docRecords.push({ docId, path: relPath, contentPreview });
      }
    }
  });

  insertAll();

  const docCount = db.prepare('SELECT COUNT(*) as cnt FROM documents').get().cnt;
  const pfLinks = db.prepare('SELECT COUNT(*) as cnt FROM doc_portfolios').get().cnt;
  const uniquePFs = db.prepare('SELECT COUNT(DISTINCT portfolio) as cnt FROM doc_portfolios').get().cnt;

  console.log(`✅ 인덱스 빌드 완료`);
  console.log(`   문서: ${docCount}건`);
  console.log(`   PF 링크: ${pfLinks}건 (${uniquePFs}개 PF)`);

  if (embedMode) {
    await buildEmbeddings(db, docRecords, embeddingCache);
  }

  const hasEmbTable = db.prepare(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='doc_embeddings'`
  ).get();
  const totalEmb = hasEmbTable
    ? db.prepare('SELECT COUNT(*) as cnt FROM doc_embeddings').get().cnt
    : 0;
  if (totalEmb === 0) {
    console.error('⚠️ 임베딩 0건 — --embed 플래그 확인 필요');
  }

  console.log(`   DB: ${DB_PATH}`);
  db.close();
}

async function buildEmbeddings(db, docRecords, cache) {
  const { embedTexts } = require('./embeddings');
  const insertEmb = db.prepare(
    `INSERT INTO doc_embeddings (doc_id, embedding, content_hash) VALUES (?, ?, ?)`
  );

  const needEmbed = [];
  const reused = [];

  for (const rec of docRecords) {
    const hash = contentHash(rec.contentPreview || '');
    const cached = cache.get(rec.path);
    if (cached && cached.contentHash === hash) {
      reused.push({ docId: rec.docId, embedding: cached.embedding, hash });
    } else {
      needEmbed.push({ docId: rec.docId, text: rec.contentPreview || '', hash });
    }
  }

  console.log(`\n🧠 임베딩 진행: ${docRecords.length}건 (신규/변경 ${needEmbed.length}건, 캐시 ${reused.length}건)`);

  const insertCached = db.transaction(() => {
    for (const r of reused) {
      insertEmb.run(r.docId, r.embedding, r.hash);
    }
  });
  insertCached();

  if (needEmbed.length > 0) {
    const BATCH = 100;
    for (let i = 0; i < needEmbed.length; i += BATCH) {
      const batch = needEmbed.slice(i, i + BATCH);
      const texts = batch.map(b => b.text);
      const embeddings = await embedTexts(texts);

      const insertBatch = db.transaction(() => {
        for (let j = 0; j < batch.length; j++) {
          const buf = Buffer.from(embeddings[j].buffer);
          insertEmb.run(batch[j].docId, buf, batch[j].hash);
        }
      });
      insertBatch();

      const done = Math.min(i + BATCH, needEmbed.length);
      process.stdout.write(`   임베딩: ${done}/${needEmbed.length}\r`);
    }
    console.log(`   임베딩: ${needEmbed.length}/${needEmbed.length} 완료`);
  }

  const embCount = db.prepare('SELECT COUNT(*) as cnt FROM doc_embeddings').get().cnt;
  console.log(`   임베딩 벡터: ${embCount}건`);
}

buildIndex();

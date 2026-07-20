const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, 'monk_index.db');

const queryVectorCache = new Map();

function openDB() {
  if (!fs.existsSync(DB_PATH)) {
    return null;
  }
  return new Database(DB_PATH, { readonly: true });
}

function hasEmbeddings(db) {
  const table = db.prepare(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='doc_embeddings'`
  ).get();
  if (!table) return false;
  const cnt = db.prepare('SELECT COUNT(*) as cnt FROM doc_embeddings').get().cnt;
  return cnt > 0;
}

function searchByFilters(db, args) {
  const conditions = [];
  const params = [];

  if (args.pf) {
    conditions.push(`d.id IN (SELECT doc_id FROM doc_portfolios WHERE portfolio = ?)`);
    params.push(args.pf);
  }
  if (args.type) {
    conditions.push(`d.type = ?`);
    params.push(args.type);
  }
  if (args.from) {
    conditions.push(`d.date >= ?`);
    params.push(args.from);
  }
  if (args.to) {
    conditions.push(`d.date <= ?`);
    params.push(args.to);
  }
  if (args.agent) {
    conditions.push(`d.agent = ?`);
    params.push(args.agent);
  }
  if (args.device) {
    conditions.push(`d.device = ?`);
    params.push(args.device);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `SELECT d.path, d.type, d.date, d.subject FROM documents d ${where} ORDER BY d.date DESC, d.path`;
  return db.prepare(sql).all(...params);
}

function searchBM25(db, query, args) {
  const conditions = [];
  const params = [];

  let baseSql = `
    SELECT d.id, d.path, d.type, d.date, d.subject, d.content_preview, rank
    FROM documents_fts fts
    JOIN documents d ON d.id = fts.rowid
    WHERE documents_fts MATCH ?
  `;
  params.push(query);

  if (args.pf) {
    conditions.push(`d.id IN (SELECT doc_id FROM doc_portfolios WHERE portfolio = ?)`);
    params.push(args.pf);
  }
  if (args.type) {
    conditions.push(`d.type = ?`);
    params.push(args.type);
  }
  if (args.from) {
    conditions.push(`d.date >= ?`);
    params.push(args.from);
  }
  if (args.to) {
    conditions.push(`d.date <= ?`);
    params.push(args.to);
  }

  if (conditions.length > 0) {
    baseSql += ` AND ${conditions.join(' AND ')}`;
  }

  baseSql += ` ORDER BY rank LIMIT 20`;
  return db.prepare(baseSql).all(...params);
}

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function searchVector(db, query, limit = 20) {
  let queryVec = queryVectorCache.get(query);
  if (!queryVec) {
    const { embedQuery } = require('./embeddings');
    queryVec = await embedQuery(query);
    queryVectorCache.set(query, queryVec);
  }

  const rows = db.prepare(`
    SELECT e.doc_id, e.embedding, d.path, d.type, d.date, d.subject, d.content_preview
    FROM doc_embeddings e JOIN documents d ON d.id = e.doc_id
  `).all();

  const scored = rows.map(row => {
    const docVec = new Float32Array(row.embedding.buffer, row.embedding.byteOffset, row.embedding.length / 4);
    const similarity = cosineSimilarity(queryVec, docVec);
    return { id: row.doc_id, path: row.path, type: row.type, date: row.date, subject: row.subject, content_preview: row.content_preview, similarity };
  });

  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.slice(0, limit);
}

function rrfFusion(bm25Results, vectorResults, k = 60) {
  const scores = new Map();
  const meta = new Map();

  bm25Results.forEach((r, idx) => {
    const rank = idx + 1;
    scores.set(r.id, (scores.get(r.id) || 0) + 1 / (k + rank));
    meta.set(r.id, { path: r.path, type: r.type, date: r.date, subject: r.subject, content_preview: r.content_preview });
  });

  vectorResults.forEach((r, idx) => {
    const rank = idx + 1;
    scores.set(r.id, (scores.get(r.id) || 0) + 1 / (k + rank));
    if (!meta.has(r.id)) {
      meta.set(r.id, { path: r.path, type: r.type, date: r.date, subject: r.subject, content_preview: r.content_preview });
    }
  });

  const now = Date.now();
  const fused = [];
  for (const [id, score] of scores) {
    const m = meta.get(id);
    let recencyBoost = 1;
    if (m.date) {
      const daysDiff = (now - new Date(m.date).getTime()) / 86400000;
      if (daysDiff >= 0) recencyBoost = 1 + 0.3 * Math.exp(-daysDiff / 90);
    }
    fused.push({ id, path: m.path, type: m.type, date: m.date, subject: m.subject, content_preview: m.content_preview, rrfScore: score * recencyBoost });
  }

  fused.sort((a, b) => b.rrfScore - a.rrfScore);
  return fused.slice(0, 20);
}

function searchRelations(db, pfName) {
  const sql = `
    SELECT dp2.portfolio, COUNT(*) as shared_docs
    FROM doc_portfolios dp1
    JOIN doc_portfolios dp2 ON dp1.doc_id = dp2.doc_id
    WHERE dp1.portfolio = ? AND dp2.portfolio != ?
    GROUP BY dp2.portfolio
    ORDER BY shared_docs DESC
  `;
  return db.prepare(sql).all(pfName, pfName);
}

module.exports = {
  DB_PATH,
  openDB,
  hasEmbeddings,
  searchBM25,
  searchVector,
  rrfFusion,
  cosineSimilarity,
  searchByFilters,
  searchRelations,
};

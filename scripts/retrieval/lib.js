const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, 'monk_index.db');

const queryVectorCache = new Map();

function openDB() {
  if (!fs.existsSync(DB_PATH)) return null;
  return new Database(DB_PATH, { readonly: true });
}

function hasEmbeddings(db) {
  const table = db.prepare(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='chunk_embeddings'`
  ).get();
  if (!table) return false;
  const cnt = db.prepare('SELECT COUNT(*) as cnt FROM chunk_embeddings').get().cnt;
  return cnt > 0;
}

function applyPerDocLimit(results, maxPerDoc) {
  const counts = new Map();
  const limited = [];
  for (const r of results) {
    const docId = r.doc_id;
    const count = counts.get(docId) || 0;
    if (count < maxPerDoc) {
      limited.push(r);
      counts.set(docId, count + 1);
    }
  }
  return limited;
}

function buildAxisFilter(args, conditions, params) {
  if (args.axis) {
    conditions.push(`d.id IN (
      SELECT doc_id FROM doc_portfolios dp
      JOIN pf_axis pa ON dp.portfolio = pa.portfolio
      WHERE pa.axis = ?
    )`);
    params.push(args.axis);
  }
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
  buildAxisFilter(args, conditions, params);

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `SELECT d.path, d.type, d.date, d.subject FROM documents d ${where} ORDER BY d.date DESC, d.path`;
  return db.prepare(sql).all(...params);
}

function searchBM25(db, query, args) {
  const conditions = [];
  const params = [];

  let baseSql = `
    SELECT c.id, c.doc_id, d.path, c.anchor, d.type, d.date, d.subject,
           substr(c.content, 1, 500) as content_preview, rank
    FROM chunks_fts fts
    JOIN chunks c ON c.id = fts.rowid
    JOIN documents d ON d.id = c.doc_id
    WHERE chunks_fts MATCH ?
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
  buildAxisFilter(args, conditions, params);

  if (conditions.length > 0) {
    baseSql += ` AND ${conditions.join(' AND ')}`;
  }

  baseSql += ` ORDER BY rank LIMIT 40`;
  const results = db.prepare(baseSql).all(...params);
  return applyPerDocLimit(results, 2);
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

async function searchVector(db, query, args = {}, limit = 20) {
  let queryVec = queryVectorCache.get(query);
  if (!queryVec) {
    const { embedQuery } = require('./embeddings');
    queryVec = await embedQuery(query);
    queryVectorCache.set(query, queryVec);
  }

  const filterConds = [];
  const filterParams = [];
  if (args.pf) {
    filterConds.push(`d.id IN (SELECT doc_id FROM doc_portfolios WHERE portfolio = ?)`);
    filterParams.push(args.pf);
  }
  if (args.axis) {
    filterConds.push(`d.id IN (
      SELECT doc_id FROM doc_portfolios dp
      JOIN pf_axis pa ON dp.portfolio = pa.portfolio
      WHERE pa.axis = ?
    )`);
    filterParams.push(args.axis);
  }

  const filterWhere = filterConds.length > 0 ? `AND ${filterConds.join(' AND ')}` : '';

  const rows = db.prepare(`
    SELECT ce.chunk_id, ce.embedding, c.doc_id, d.path, c.anchor,
           d.type, d.date, d.subject, substr(c.content, 1, 500) as content_preview
    FROM chunk_embeddings ce
    JOIN chunks c ON c.id = ce.chunk_id
    JOIN documents d ON d.id = c.doc_id
    WHERE 1=1 ${filterWhere}
  `).all(...filterParams);

  const scored = rows.map(row => {
    const docVec = new Float32Array(row.embedding.buffer, row.embedding.byteOffset, row.embedding.length / 4);
    const similarity = cosineSimilarity(queryVec, docVec);
    return {
      id: row.chunk_id, doc_id: row.doc_id, path: row.path, anchor: row.anchor,
      type: row.type, date: row.date, subject: row.subject,
      content_preview: row.content_preview, similarity,
    };
  });

  scored.sort((a, b) => b.similarity - a.similarity);
  return applyPerDocLimit(scored.slice(0, limit * 2), 2).slice(0, limit);
}

function rrfFusion(bm25Results, vectorResults, k = 60) {
  const scores = new Map();
  const meta = new Map();

  bm25Results.forEach((r, idx) => {
    const rank = idx + 1;
    scores.set(r.id, (scores.get(r.id) || 0) + 1 / (k + rank));
    meta.set(r.id, {
      doc_id: r.doc_id, path: r.path, anchor: r.anchor,
      type: r.type, date: r.date, subject: r.subject, content_preview: r.content_preview,
    });
  });

  vectorResults.forEach((r, idx) => {
    const rank = idx + 1;
    scores.set(r.id, (scores.get(r.id) || 0) + 1 / (k + rank));
    if (!meta.has(r.id)) {
      meta.set(r.id, {
        doc_id: r.doc_id, path: r.path, anchor: r.anchor,
        type: r.type, date: r.date, subject: r.subject, content_preview: r.content_preview,
      });
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
    fused.push({
      id, doc_id: m.doc_id, path: m.path, anchor: m.anchor,
      type: m.type, date: m.date, subject: m.subject, content_preview: m.content_preview,
      rrfScore: score * recencyBoost,
    });
  }

  fused.sort((a, b) => b.rrfScore - a.rrfScore);
  return applyPerDocLimit(fused, 2).slice(0, 20);
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

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

// MONK_INDEX_DB 환경변수로 DB 경로 재정의 가능 (임시 빌드 산출물 스모크용)
const DB_PATH = process.env.MONK_INDEX_DB
  ? path.resolve(process.env.MONK_INDEX_DB)
  : path.join(__dirname, 'monk_index.db');

const REBUILD_CMD = 'node scripts/retrieval/build_index.js';
const REBUILD_HINT = `재빌드: 레포 루트에서 \`${REBUILD_CMD}\` (약 15초, 네트워크 불요). 복구 전까지 grep 폴백 사용 사실을 보고에 명시할 것.`;

const queryVectorCache = new Map();

function openDB() {
  if (!fs.existsSync(DB_PATH)) return null;
  return new Database(DB_PATH, { readonly: true });
}

// 인덱스 헬스체크 — 테이블 부재·0행을 "no such table" 원문 대신 명시 에러로 승격 (09-26 9시간 무음 공백 재발 방지)
function checkIndexHealth(db) {
  const tables = new Set(
    db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all().map(r => r.name)
  );
  const missing = ['documents', 'chunks', 'chunks_fts'].filter(t => !tables.has(t));
  if (missing.length > 0) {
    return { ok: false, reason: `테이블 부재(${missing.join(', ')}) — 빌드가 중단되어 빈 DB만 남은 상태`, documents: 0, chunks: 0 };
  }
  const documents = db.prepare('SELECT COUNT(*) as cnt FROM documents').get().cnt;
  const chunks = db.prepare('SELECT COUNT(*) as cnt FROM chunks').get().cnt;
  if (documents === 0 || chunks === 0) {
    return { ok: false, reason: `문서 ${documents}건 · 청크 ${chunks}건 — 빈 인덱스`, documents, chunks };
  }
  return { ok: true, reason: null, documents, chunks };
}

function indexErrorMessage(health) {
  return `❌ retrieval 인덱스 비정상: ${health.reason}. ${REBUILD_HINT}`;
}

// 파일 부재 → 헬스 실패 형태로 통일
function openHealthyDB() {
  const db = openDB();
  if (!db) {
    return { db: null, health: { ok: false, reason: `DB 파일 없음 (${DB_PATH})`, documents: 0, chunks: 0 } };
  }
  let health;
  try {
    health = checkIndexHealth(db);
  } catch (e) {
    health = { ok: false, reason: `SQLite 오류: ${e.message}`, documents: 0, chunks: 0 };
  }
  if (!health.ok) { db.close(); return { db: null, health }; }
  return { db, health };
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

// FTS5 쿼리 토큰화 — 연산자·따옴표 제거 후 안전한 어절 배열
function ftsTerms(query) {
  return String(query)
    .replace(/["'*^:(){}\[\]]/g, ' ')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t && !/^(AND|OR|NOT|NEAR)$/i.test(t));
}

// 엄격(원문 AND) → 접두 AND → 접두 OR 순 폴백.
// 배경: unicode61 토크나이저는 한국어 조사("배포는")를 분리하지 못하고, 암묵 AND라 어절 하나만 빠져도 0건이 된다.
// 반환: { results, mode, ftsQuery } — mode는 출력 헤더에 표기 (무음 강등 금지).
function searchBM25WithFallback(db, query, args) {
  const attempts = [];
  attempts.push({ mode: 'strict', ftsQuery: query });

  const terms = ftsTerms(query);
  if (terms.length > 0) {
    const prefixed = terms.map(t => `"${t}"*`);
    if (terms.length > 1) attempts.push({ mode: 'prefix-AND', ftsQuery: prefixed.join(' ') });
    attempts.push({ mode: terms.length > 1 ? 'OR 폴백' : 'prefix', ftsQuery: prefixed.join(' OR ') });
  }

  let lastError = null;
  for (const attempt of attempts) {
    let results;
    try {
      results = searchBM25(db, attempt.ftsQuery, args);
    } catch (e) {
      lastError = e;
      continue;
    }
    if (results.length > 0) return { results, mode: attempt.mode, ftsQuery: attempt.ftsQuery };
  }
  const last = attempts[attempts.length - 1];
  return { results: [], mode: lastError ? `strict 구문오류(${lastError.message}) → ${last.mode}` : last.mode, ftsQuery: last.ftsQuery };
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
  REBUILD_CMD,
  openDB,
  openHealthyDB,
  checkIndexHealth,
  indexErrorMessage,
  hasEmbeddings,
  searchBM25,
  searchBM25WithFallback,
  ftsTerms,
  searchVector,
  rrfFusion,
  cosineSimilarity,
  searchByFilters,
  searchRelations,
};

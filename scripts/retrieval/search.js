#!/usr/bin/env node
const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, 'monk_index.db');

function openDB() {
  if (!require('fs').existsSync(DB_PATH)) {
    console.error('❌ 인덱스 없음. 먼저 build_index.js를 실행하세요.');
    process.exit(1);
  }
  return new Database(DB_PATH, { readonly: true });
}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const key = argv[i];
    if (key.startsWith('--')) {
      const name = key.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args[name] = next;
        i++;
      } else {
        args[name] = true;
      }
    }
  }
  return args;
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
    SELECT d.id, d.path, d.type, d.date, d.subject, rank
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
  const { embedQuery } = require('./embeddings');
  const queryVec = await embedQuery(query);

  const rows = db.prepare(`
    SELECT e.doc_id, e.embedding, d.path, d.type, d.date, d.subject
    FROM doc_embeddings e JOIN documents d ON d.id = e.doc_id
  `).all();

  const scored = rows.map(row => {
    const docVec = new Float32Array(row.embedding.buffer, row.embedding.byteOffset, row.embedding.length / 4);
    const similarity = cosineSimilarity(queryVec, docVec);
    return { id: row.doc_id, path: row.path, type: row.type, date: row.date, subject: row.subject, similarity };
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
    meta.set(r.id, { path: r.path, type: r.type, date: r.date, subject: r.subject });
  });

  vectorResults.forEach((r, idx) => {
    const rank = idx + 1;
    scores.set(r.id, (scores.get(r.id) || 0) + 1 / (k + rank));
    if (!meta.has(r.id)) {
      meta.set(r.id, { path: r.path, type: r.type, date: r.date, subject: r.subject });
    }
  });

  const fused = [];
  for (const [id, score] of scores) {
    const m = meta.get(id);
    fused.push({ id, path: m.path, type: m.type, date: m.date, subject: m.subject, rrfScore: score });
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

function formatResults(results) {
  if (results.length === 0) {
    console.log('  (결과 없음)');
    return;
  }
  for (const r of results) {
    const date = r.date || '----';
    const type = (r.type || '-').padEnd(12);
    const subject = r.subject ? ` — ${r.subject}` : '';
    console.log(`  ${date}  ${type} ${r.path}${subject}`);
  }
  console.log(`\n  총 ${results.length}건`);
}

async function main() {
  const args = parseArgs(process.argv);
  const db = openDB();

  if (args.relations) {
    console.log(`\n🔗 ${args.relations} 관계 맵:\n`);
    const relations = searchRelations(db, args.relations);
    if (relations.length === 0) {
      console.log('  (연결된 PF 없음)');
    } else {
      for (const r of relations) {
        console.log(`  ${r.portfolio.padEnd(20)} 공유 문서 ${r.shared_docs}건`);
      }
    }
    db.close();
    return;
  }

  if (args.query) {
    const embAvailable = hasEmbeddings(db);
    const mode = args.mode || (embAvailable ? 'hybrid' : 'bm25');

    if (mode === 'bm25') {
      console.log(`\n🔍 BM25 검색: "${args.query}"\n`);
      const results = searchBM25(db, args.query, args);
      formatResults(results);

    } else if (mode === 'vector') {
      if (!embAvailable) {
        console.error('❌ 임베딩 없음. build_index.js --embed를 먼저 실행하세요.');
        db.close();
        process.exit(1);
      }
      console.log(`\n🔍 벡터 검색: "${args.query}"\n`);
      const results = await searchVector(db, args.query);
      formatResults(results);

    } else {
      if (!embAvailable) {
        console.log(`\n🔍 BM25 검색: "${args.query}" (임베딩 없음 — BM25 폴백)\n`);
        const results = searchBM25(db, args.query, args);
        formatResults(results);
      } else {
        console.log(`\n🔍 하이브리드 검색: "${args.query}" (BM25 + Vector RRF)\n`);
        const bm25Results = searchBM25(db, args.query, args);
        const vectorResults = await searchVector(db, args.query);
        const fused = rrfFusion(bm25Results, vectorResults);
        formatResults(fused);
      }
    }
  } else if (args.pf || args.type || args.from || args.to || args.agent || args.device) {
    const filters = [];
    if (args.pf) filters.push(`PF=${args.pf}`);
    if (args.type) filters.push(`type=${args.type}`);
    if (args.from) filters.push(`from=${args.from}`);
    if (args.to) filters.push(`to=${args.to}`);
    console.log(`\n📋 필터 검색: ${filters.join(', ')}\n`);
    const results = searchByFilters(db, args);
    formatResults(results);
  } else {
    console.log(`
사용법:
  node search.js --pf PF_SPREAD
  node search.js --from 2026-06-14 --to 2026-06-15
  node search.js --query "IndexNow sitemap"
  node search.js --query "증명사진 품질"                    # hybrid (임베딩 있으면)
  node search.js --query "증명사진 품질" --mode bm25        # BM25만
  node search.js --query "증명사진 품질" --mode vector      # 벡터만
  node search.js --query "증명사진 품질" --mode hybrid      # 명시적 hybrid
  node search.js --pf PF_IDPHOTO --type order
  node search.js --relations PF_OPUS
    `);
  }

  db.close();
}

main();

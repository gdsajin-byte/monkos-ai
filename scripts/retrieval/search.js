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

function searchByQuery(db, query, args) {
  const conditions = [];
  const params = [];

  let baseSql = `
    SELECT d.path, d.type, d.date, d.subject, rank
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

function main() {
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
    console.log(`\n🔍 BM25 검색: "${args.query}"\n`);
    const results = searchByQuery(db, args.query, args);
    formatResults(results);
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
  node search.js --pf PF_IDPHOTO --type order
  node search.js --relations PF_OPUS
    `);
  }

  db.close();
}

main();

#!/usr/bin/env node
const {
  openDB, hasEmbeddings,
  searchBM25, searchVector, rrfFusion,
  searchByFilters, searchRelations,
} = require('./lib');

const KNOWN_FLAGS = new Set([
  'query', 'mode', 'pf', 'type', 'from', 'to', 'agent', 'device',
  'axis', 'limit', 'relations',
]);

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const key = argv[i];
    if (key.startsWith('--')) {
      const name = key.slice(2);
      if (!KNOWN_FLAGS.has(name)) {
        console.error(`❌ 알 수 없는 플래그: --${name}`);
        process.exit(1);
      }
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

function formatResults(results) {
  if (results.length === 0) {
    console.log('  (결과 없음)');
    return;
  }
  for (const r of results) {
    const date = r.date || '----';
    const type = (r.type || '-').padEnd(12);
    const anchor = r.anchor ? `#${r.anchor}` : '';
    const subject = r.subject ? ` — ${r.subject}` : '';
    console.log(`  ${date}  ${type} ${r.path}${anchor}${subject}`);
  }
  console.log(`\n  총 ${results.length}건`);
}

async function main() {
  const args = parseArgs(process.argv);
  const db = openDB();
  if (!db) {
    console.error('❌ 인덱스 없음. 먼저 build_index.js를 실행하세요.');
    process.exit(1);
  }

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
  node search.js --query "크롭 배치" --axis IDPHOTO        # 축 필터
  node search.js --pf PF_IDPHOTO --type order
  node search.js --relations PF_OPUS
    `);
  }

  db.close();
}

main();

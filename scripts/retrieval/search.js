#!/usr/bin/env node
// --db <path>는 lib 로드 전에 환경변수로 반영해야 한다 (DB_PATH는 모듈 로드 시 고정)
{
  const i = process.argv.indexOf('--db');
  if (i >= 0 && process.argv[i + 1]) process.env.MONK_INDEX_DB = process.argv[i + 1];
}
const {
  DB_PATH, REBUILD_CMD,
  openDB, openHealthyDB, indexErrorMessage, hasEmbeddings,
  searchBM25WithFallback, searchVector, rrfFusion,
  searchByFilters, searchRelations,
} = require('./lib');

const KNOWN_FLAGS = new Set([
  'query', 'mode', 'pf', 'type', 'from', 'to', 'agent', 'device',
  'axis', 'limit', 'relations', 'smoke', 'db',
]);

// 스모크 기준 쿼리 — 인덱스가 살아 있으면 반드시 히트해야 하는 문자열 (mk-push.sh가 빌드 직후 호출)
const SMOKE_QUERY = 'required reviewer';

function runSmoke() {
  const failures = [];
  const { db, health } = openHealthyDB();
  console.log(`🩺 retrieval 스모크 — DB ${DB_PATH}`);
  if (!db) {
    console.log(`  ❌ 헬스: ${health.reason}`);
    console.log(`🔴 retrieval 스모크 FAIL — 인덱스 비정상. ${REBUILD_CMD} 로 재빌드`);
    process.exit(1);
  }
  console.log(`  ✅ 헬스: 문서 ${health.documents}건 · 청크 ${health.chunks}건`);

  const strict = searchBM25WithFallback(db, SMOKE_QUERY, {});
  if (strict.results.length > 0 && strict.mode === 'strict') {
    console.log(`  ✅ 기준 쿼리 "${SMOKE_QUERY}" strict ${strict.results.length}건`);
  } else {
    failures.push(`기준 쿼리 "${SMOKE_QUERY}" strict 0건 (mode=${strict.mode})`);
    console.log(`  ❌ 기준 쿼리 "${SMOKE_QUERY}" strict 0건 (mode=${strict.mode})`);
  }

  const multi = searchBM25WithFallback(db, '버튼 배포 승인 신원 분리 required reviewer 불수용', {});
  if (multi.results.length > 0) {
    console.log(`  ✅ 다어절 한국어 쿼리 ${multi.results.length}건 (mode=${multi.mode})`);
  } else {
    failures.push(`다어절 한국어 쿼리 0건 — OR 폴백 미작동`);
    console.log(`  ❌ 다어절 한국어 쿼리 0건 (mode=${multi.mode})`);
  }

  const emb = hasEmbeddings(db);
  console.log(`  ℹ️ 임베딩: ${emb ? '있음' : '없음 (BM25 전용)'}`);
  db.close();

  if (failures.length > 0) {
    console.log(`🔴 retrieval 스모크 FAIL — ${failures.join(' / ')}`);
    process.exit(1);
  }
  console.log('🟢 retrieval 스모크 PASS');
  process.exit(0);
}

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
    const anchor = r.anchor ? (r.anchor.startsWith('#') ? r.anchor : `#${r.anchor}`) : '';
    const subject = r.subject ? ` — ${r.subject}` : '';
    console.log(`  ${date}  ${type} ${r.path}${anchor}${subject}`);
  }
  console.log(`\n  총 ${results.length}건`);
}

function printBM25(results, mode, label) {
  const suffix = mode === 'strict' ? '' : ` [모드: ${mode}]`;
  console.log(`\n🔍 ${label}${suffix}\n`);
  formatResults(results);
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.smoke) return runSmoke();

  const { db, health } = openHealthyDB();
  if (!db) {
    console.error(indexErrorMessage(health));
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
      const r = searchBM25WithFallback(db, args.query, args);
      printBM25(r.results, r.mode, `BM25 검색: "${args.query}"`);

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
        const r = searchBM25WithFallback(db, args.query, args);
        printBM25(r.results, r.mode, `BM25 검색: "${args.query}" (임베딩 없음 — BM25 폴백)`);
      } else {
        const bm = searchBM25WithFallback(db, args.query, args);
        const suffix = bm.mode === 'strict' ? '' : ` [BM25 모드: ${bm.mode}]`;
        console.log(`\n🔍 하이브리드 검색: "${args.query}" (BM25 + Vector RRF)${suffix}\n`);
        const vectorResults = await searchVector(db, args.query);
        const fused = rrfFusion(bm.results, vectorResults);
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
  node search.js --smoke                                   # 헬스체크 + 기준 쿼리 (PASS/FAIL, exit 0/1)
  node search.js --smoke --db /path/to/other.db            # 임시 빌드 산출물 검사 (또는 MONK_INDEX_DB=...)

  다어절 쿼리가 strict(AND) 0건이면 접두 AND → 접두 OR로 자동 폴백하며 헤더에 [모드: ...]를 표기한다.
    `);
  }

  db.close();
}

main();

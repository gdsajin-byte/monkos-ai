#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');
const {
  DB_PATH, openHealthyDB, indexErrorMessage, hasEmbeddings,
  searchBM25WithFallback, searchVector, rrfFusion,
  searchByFilters, searchRelations,
} = require('./lib');

// 인덱스 부재·빈 DB → SQLite 원문("no such table") 대신 재빌드 명령을 담은 한국어 에러 (도구 3요건 #3 실패 가시화)
function indexError(health) {
  return { content: [{ type: 'text', text: indexErrorMessage(health) }], isError: true };
}

const PROJECT_ROOT = path.resolve(__dirname, '../..');

const server = new McpServer({
  name: 'monk-retrieval',
  version: '1.0.0',
});

server.tool(
  'monk_search',
  'MONK 운영 문서 청크 단위 하이브리드 검색. PF·유형·날짜·축 필터 지원.',
  {
    query: z.string().describe('검색 쿼리 (자연어)'),
    mode: z.enum(['hybrid', 'bm25', 'vector']).optional().describe('검색 모드 (기본: hybrid)'),
    pf: z.string().optional().describe('PF 필터 (예: PF_CITADEL)'),
    type: z.string().optional().describe('문서 유형 필터 (예: order, session_log, design)'),
    from: z.string().optional().describe('시작일 (YYYY-MM-DD)'),
    to: z.string().optional().describe('종료일 (YYYY-MM-DD)'),
    axis: z.string().optional().describe('PF 축 필터 (IDPHOTO/OPUS/AUTOPILOT/STYLER/PARTNER)'),
    limit: z.number().optional().describe('결과 수 (기본 10, 최대 20)'),
  },
  async ({ query, mode, pf, type, from, to, axis, limit }) => {
    const { db, health } = openHealthyDB();
    if (!db) return indexError(health);

    try {
      const embAvailable = hasEmbeddings(db);
      const effectiveMode = mode || (embAvailable ? 'hybrid' : 'bm25');
      const effectiveLimit = Math.min(limit || 10, 20);
      const args = { pf, type, from, to, axis };

      let results;
      let usedMode = effectiveMode;

      if (effectiveMode === 'vector' && !embAvailable) {
        return { content: [{ type: 'text', text: '❌ 임베딩 없음. build_index.js --embed를 먼저 실행하세요.' }] };
      }

      const bm25Label = (r) => r.mode === 'strict' ? '' : ` [BM25 모드: ${r.mode}]`;

      if (effectiveMode === 'bm25') {
        const r = searchBM25WithFallback(db, query, args);
        results = r.results.slice(0, effectiveLimit);
        usedMode = `bm25${bm25Label(r)}`;
      } else if (effectiveMode === 'vector') {
        results = await searchVector(db, query, args, effectiveLimit);
      } else {
        if (!embAvailable) {
          const r = searchBM25WithFallback(db, query, args);
          results = r.results.slice(0, effectiveLimit);
          usedMode = `bm25 (임베딩 없음 폴백)${bm25Label(r)}`;
        } else {
          const r = searchBM25WithFallback(db, query, args);
          try {
            const vectorResults = await searchVector(db, query, args);
            results = rrfFusion(r.results, vectorResults).slice(0, effectiveLimit);
            usedMode = `hybrid${bm25Label(r)}`;
          } catch (vecErr) {
            results = r.results.slice(0, effectiveLimit);
            usedMode = `bm25 (벡터 실패 폴백: ${vecErr.message})${bm25Label(r)}`;
          }
        }
      }

      const output = results.map(r => ({
        path: r.anchor ? `${r.path}${r.anchor.startsWith('#') ? '' : '#'}${r.anchor}` : r.path,
        type: r.type || null,
        date: r.date || null,
        subject: r.subject || null,
        content_preview: (r.content_preview || '').slice(0, 200),
      }));

      const text = `🔍 ${usedMode} 검색: "${query}" — ${output.length}건\n\n` +
        JSON.stringify(output, null, 2);

      return { content: [{ type: 'text', text }] };
    } finally {
      db.close();
    }
  }
);

server.tool(
  'monk_lookup',
  '인덱스에 등록된 문서의 전문을 읽는다. monk_search 결과의 path를 입력.',
  {
    path: z.string().describe('문서 상대 경로 (monk_search 결과의 path)'),
  },
  async ({ path: docPath }) => {
    const fullPath = path.join(PROJECT_ROOT, docPath);
    try {
      let content = fs.readFileSync(fullPath, 'utf8');
      let truncated = false;
      if (content.length > 10000) {
        content = content.slice(0, 10000);
        truncated = true;
      }
      const text = truncated ? content + '\n\n[...truncated — 10,000자 제한]' : content;
      return { content: [{ type: 'text', text }] };
    } catch {
      return { content: [{ type: 'text', text: `❌ 파일 없음: ${docPath}` }] };
    }
  }
);

server.tool(
  'monk_relations',
  '특정 PF와 문서를 공유하는 관련 PF 목록. 프로젝트 간 연결 파악용.',
  {
    pf: z.string().describe('PF명 (예: PF_CITADEL)'),
  },
  async ({ pf }) => {
    const { db, health } = openHealthyDB();
    if (!db) return indexError(health);

    try {
      const relations = searchRelations(db, pf);
      const text = `🔗 ${pf} 관계 맵 — ${relations.length}개 PF\n\n` +
        JSON.stringify(relations, null, 2);
      return { content: [{ type: 'text', text }] };
    } finally {
      db.close();
    }
  }
);

server.tool(
  'monk_stats',
  '현재 인덱스 상태 — 문서 수, 청크 수, PF 수, 임베딩 수, 축 매핑 수, 최종 빌드 시각.',
  {},
  async () => {
    const { db, health } = openHealthyDB();
    if (!db) return indexError(health);

    try {
      const documents = health.documents;
      const chunks = health.chunks;
      const pfLinks = db.prepare('SELECT COUNT(*) as cnt FROM doc_portfolios').get().cnt;
      const uniquePfs = db.prepare('SELECT COUNT(DISTINCT portfolio) as cnt FROM doc_portfolios').get().cnt;
      const hasAxis = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='pf_axis'`).get();
      const axisCount = hasAxis ? db.prepare('SELECT COUNT(*) as cnt FROM pf_axis').get().cnt : 0;

      let embeddings = 0;
      if (hasEmbeddings(db)) {
        embeddings = db.prepare('SELECT COUNT(*) as cnt FROM chunk_embeddings').get().cnt;
      }

      const stat = fs.statSync(DB_PATH);
      const dbUpdated = stat.mtime.toISOString();

      const stats = { health: 'ok', documents, chunks, pf_links: pfLinks, unique_pfs: uniquePfs, axis_mappings: axisCount, embeddings, search_mode: embeddings > 0 ? 'hybrid' : 'bm25 전용', db_updated: dbUpdated };
      return { content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }] };
    } finally {
      db.close();
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main();

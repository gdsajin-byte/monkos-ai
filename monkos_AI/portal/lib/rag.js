/**
 * CS 지식 RAG (Firestore cs_knowledge + episode_catalog)
 * 담당: 막내3 (리파인)
 */

import { firestore, log } from './shared/config.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const csKnowledgeCollection = firestore.collection('cs_knowledge');
let csKnowledgeCache = [];
let csCacheLastUpdate = 0;
const CS_CACHE_TTL = 10 * 60 * 1000;

// === 에피소드 카탈로그 로드 (서버 기동 시 1회) ===
let episodeKnowledge = [];
try {
  const catalogPath = join(__dirname, '../public/admin/data/episode_catalog.json');
  const episodes = JSON.parse(readFileSync(catalogPath, 'utf-8'));
  episodeKnowledge = episodes.map(ep => ({
    id: `episode_${ep.id}`,
    title: ep.title,
    content: `${ep.summary}\n${ep.insight || ''}`,
    keywords: [
      ...(ep.title || '').split(/[\s—·→+/]+/).filter(w => w.length > 1),
      ep.category || '',
    ].map(w => w.toLowerCase()),
  }));
  log(`[RAG] 에피소드 카탈로그 로드: ${episodeKnowledge.length}건`);
} catch (err) {
  log(`[RAG] 에피소드 카탈로그 로드 실패: ${err.message}`);
}

export async function loadCsKnowledge() {
  const now = Date.now();
  if (csKnowledgeCache.length > 0 && now - csCacheLastUpdate < CS_CACHE_TTL) {
    return csKnowledgeCache;
  }
  try {
    const snapshot = await csKnowledgeCollection.get();
    csKnowledgeCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    csCacheLastUpdate = now;
    log(`[RAG] 지식 로드 완료: ${csKnowledgeCache.length}건`);
  } catch (err) {
    log(`[RAG] 지식 로드 실패: ${err.message}`);
  }
  return csKnowledgeCache;
}

// === 단어 겹침 점수 기반 검색 ===
function scoreDocument(queryWords, doc) {
  const keywords = doc.keywords || [];
  const title = (doc.title || '').toLowerCase();
  const content = (doc.content || '').toLowerCase();
  let score = 0;

  for (const qw of queryWords) {
    // 키워드 정확 매칭 (가장 높은 점수)
    if (keywords.some(kw => kw.toLowerCase().includes(qw) || qw.includes(kw.toLowerCase()))) score += 10;
    // 제목 매칭
    if (title.includes(qw)) score += 5;
    // 본문 매칭
    if (content.includes(qw)) score += 2;
  }

  // 쿼리 커버리지 보너스 (매칭된 단어 비율)
  const matched = queryWords.filter(qw =>
    keywords.some(kw => kw.toLowerCase().includes(qw)) || title.includes(qw) || content.includes(qw)
  ).length;
  if (queryWords.length > 0) score += (matched / queryWords.length) * 3;

  return score;
}

export function searchCsKnowledge(query) {
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 1);
  if (queryWords.length === 0) return [];

  // Firestore 지식 + 에피소드 카탈로그 통합 검색
  const allDocs = [...csKnowledgeCache, ...episodeKnowledge];

  const scored = allDocs.map(doc => ({
    ...doc,
    score: scoreDocument(queryWords, doc),
  }));

  return scored.filter(d => d.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
}

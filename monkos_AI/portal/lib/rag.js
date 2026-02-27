/**
 * CS 지식 RAG (Firestore cs_knowledge)
 * 담당: 막내3 (리파인)
 */

import { firestore, log } from './shared/config.js';

const csKnowledgeCollection = firestore.collection('cs_knowledge');
let csKnowledgeCache = [];
let csCacheLastUpdate = 0;
const CS_CACHE_TTL = 10 * 60 * 1000;

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

export function searchCsKnowledge(query) {
  const q = query.toLowerCase();
  const scored = csKnowledgeCache.map(doc => {
    let score = 0;
    const keywords = doc.keywords || [];
    for (const kw of keywords) {
      if (q.includes(kw.toLowerCase())) score += 10;
    }
    const title = (doc.title || '').toLowerCase();
    const content = (doc.content || '').toLowerCase();
    if (q.split(/\s+/).some(w => title.includes(w))) score += 5;
    if (q.split(/\s+/).some(w => content.includes(w))) score += 2;
    return { ...doc, score };
  });
  return scored.filter(d => d.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);
}

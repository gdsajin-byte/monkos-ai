#!/usr/bin/env node
/**
 * vol36 안경 클러스터 정비 — 2026-07-24 지시서(ORDER_20260724 모바일컨테이너_블로그서식) 건 2
 *
 * 라이브 실측(2026-07-24) 기준 실제 결함:
 *  - ko /blog/vol36 = 클린(7/14 재작성 반영) — updatedAt만 갱신(사이트맵 lastmod 신호)
 *  - en/ja vol36 = 구서식(###### 헤딩·이스케이프) — 기계 정정 + updatedAt 갱신
 *  - can-i-wear-glasses-for-my-resume-photo (ko/en/ja) = vol36 중복(동일 제목)·구서식
 *    → unpublish (301은 redirects.js BLOG_REDIRECTS에서 처리)
 *
 * 사용: node scripts/fix_vol36_cluster.js            (dry-run — 변경 없음, 상태 출력)
 *       node scripts/fix_vol36_cluster.js --apply    (실제 적용)
 */
import { Firestore } from '@google-cloud/firestore';

const PROJECT_ID = 'monkos';
const firestore = new Firestore({ projectId: PROJECT_ID });
const blogCollection = firestore.collection('blog_posts');

const APPLY = process.argv.includes('--apply');
const NOW_ISO = new Date().toISOString();

// 서식 기계 정정: h6 핵 제거 + 마크다운 이스케이프 해제
function fixFormatting(md) {
  let out = md;
  // 1) '######' 헤딩 핵: h6 → h3 (전 단락 h6 벽 — h2 범람 방지, 페이지 h1/h2 구조 보존)
  out = out.replace(/^######\s*/gm, '### ');
  // 2) 이미지/링크 이스케이프 파손: !\[ → ![ , \] → ] , \_ → _
  out = out.replace(/!\\\[/g, '![').replace(/\\\]/g, ']').replace(/\\_/g, '_');
  // 3) 헤딩 직후 개행 누락 보정: '## 제목텍스트본문' 케이스는 건드리지 않음(오탐 위험) — 헤딩 치환만.
  return out;
}

function summarize(id, d) {
  const c = d.content || '';
  return {
    id,
    lang: d.lang,
    published: d.published,
    title: (d.title || '').slice(0, 40),
    updatedAt: d.updatedAt || '(없음)',
    createdAt: d.createdAt,
    thumbnail: (d.thumbnail || '').split('/').pop(),
    len: c.length,
    h6: (c.match(/^######/gm) || []).length,
    escBroken: (c.match(/!\\\[|\\\]|\\_/g) || []).length,
  };
}

const rows = [];
const snapshot = await blogCollection.get();
snapshot.docs.forEach((doc) => {
  const d = doc.data();
  const hay = `${doc.id} ${d.baseSlug || ''} ${d.originalSlug || ''} ${d.title || ''}`;
  if (/glasses|vol36|안경/i.test(hay)) rows.push({ doc, sum: summarize(doc.id, d) });
});

console.log(`[스캔] 안경/vol36 클러스터 ${rows.length}건:`);
rows.forEach((r) => console.log(JSON.stringify(r.sum)));

const isDupSlug = (id) => /can-i-wear-glasses-for-my-resume-photo/.test(id);
const isVol36 = (id, d) => id === 'vol36' || ((d.baseSlug === 'vol36' || d.originalSlug === 'vol36' || /^vol36/.test(id)) && !isDupSlug(id));

for (const { doc, sum } of rows) {
  const d = doc.data();
  if (isDupSlug(doc.id) && d.published !== false) {
    console.log(`[처방 A] ${doc.id} (${d.lang}) → unpublish (vol36 중복, 301은 redirects.js)`);
    if (APPLY) await doc.ref.update({ published: false, updatedAt: NOW_ISO });
  } else if (isVol36(doc.id, d)) {
    if (sum.h6 > 0 || sum.escBroken > 0) {
      const fixed = fixFormatting(d.content || '');
      console.log(`[처방 B] ${doc.id} (${d.lang}) → 서식 정정 (h6 ${sum.h6}건·이스케이프 ${sum.escBroken}건) + updatedAt 갱신`);
      if (APPLY) await doc.ref.update({ content: fixed, updatedAt: NOW_ISO });
    } else {
      console.log(`[처방 C] ${doc.id} (${d.lang}) → 클린 — updatedAt만 갱신 (사이트맵 lastmod 신호)`);
      if (APPLY) await doc.ref.update({ updatedAt: NOW_ISO });
    }
  } else {
    console.log(`[스킵] ${doc.id} (${d.lang}) — 클러스터 인접이나 대상 아님`);
  }
}

console.log(APPLY ? '[완료] 적용됨' : '[dry-run] 변경 없음 — --apply로 실행');

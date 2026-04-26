/**
 * 블로그 시드 스크립트 — 2026-04-24 콘텐츠 파이프라인 1차 (KR 3건 + JP 1건)
 *
 * 실행: GOOGLE_APPLICATION_CREDENTIALS 설정 후
 *   node monkos-ops/contents/blog/seed_blog_20260424.js
 *
 * 기존 slug가 있으면 skip합니다.
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

initializeApp({ credential: cert(JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'))) });
const db = getFirestore();
const col = db.collection('blog_posts');

const posts = [
  {
    slug: 'selfie-to-id-photo-ai-guide',
    title: '셀카 한 장으로 증명사진 만들기 — AI 증명사진 완전 가이드',
    summary: '스마트폰 셀카 한 장으로 취업용 증명사진을 만드는 방법. 사진관 방문 없이 배경·의상 변경까지 가능한 AI 증명사진 서비스 사용법을 사진 전문가가 안내합니다.',
    lang: 'ko',
    category: 'AI',
    tags: ['AI 증명사진', '셀카 증명사진', '여권사진 셀카', '증명사진 앱', 'MONKOS'],
    file: 'blog_20260424_selfie-to-id-photo-ai-guide_KR.md',
  },
  {
    slug: 'ai-vs-studio-id-photo',
    title: 'AI 증명사진 vs 사진관 증명사진 — 현직 사진작가가 솔직 비교합니다',
    summary: 'AI 증명사진과 사진관 증명사진의 비용, 시간, 품질, 커스터마이징을 현직 사진작가가 비교합니다. 20년 경력 사진 전문가가 만든 AI 서비스의 차이점.',
    lang: 'ko',
    category: 'AI',
    tags: ['AI 증명사진', '증명사진 비교', '사진관 증명사진', '증명사진 앱', 'MONKOS'],
    file: 'blog_20260424_ai-vs-studio-id-photo_KR.md',
  },
  {
    slug: 'id-photo-size-guide-passport-visa',
    title: '증명사진 규격 총정리 — 여권·이력서·비자 사이즈 가이드 (2026)',
    summary: '한국 여권, 이력서, 각국 비자 증명사진 규격을 한눈에 정리했습니다. 사이즈, 배경색, 얼굴 비율, 해상도까지 공식 기준 기반 완전 가이드.',
    lang: 'ko',
    category: '사진',
    tags: ['증명사진 규격', '여권사진 크기', '비자사진 규격', '증명사진 사이즈', 'MONKOS'],
    file: 'blog_20260424_id-photo-size-guide_KR.md',
  },
  {
    slug: 'shushoku-shomei-shashin-kitei-guide',
    title: '就活証明写真の規定完全ガイド — サイズ・背景・服装・髪型・表情',
    summary: '日本の就活証明写真に必要な規定を完全網羅。サイズ、背景色、リクルートスーツ、ヘアスタイル、表情まで、写真スタジオ10年運営のプロが解説します。',
    lang: 'ja',
    category: '사진',
    tags: ['就活写真', '証明写真', 'AI証明写真', '就活準備', 'MONKOS'],
    file: 'blog_20260424_shushoku-shomei-shashin-kitei_JP.md',
  },
];

async function seed() {
  const now = new Date().toISOString();

  for (const p of posts) {
    const existing = await col.doc(p.slug).get();
    if (existing.exists) {
      console.log(`[SKIP] ${p.slug} — 이미 존재`);
      continue;
    }

    const raw = readFileSync(join(__dirname, p.file), 'utf8');
    const content = raw.replace(/^---[\s\S]*?---\n*/, '');

    await col.doc(p.slug).set({
      slug: p.slug,
      title: p.title,
      content,
      summary: p.summary,
      thumbnail: '',
      tags: p.tags,
      lang: p.lang,
      published: true,
      author: 'MONKOS',
      pinned: false,
      category: p.category,
      createdAt: now,
      updatedAt: now,
      viewCount: 0,
    });
    console.log(`[OK] ${p.slug}`);
  }

  console.log('\n시드 완료. KR 발행 시 자동번역(ja/en)이 CMS 서버에서 트리거됩니다.');
}

seed().catch(console.error);

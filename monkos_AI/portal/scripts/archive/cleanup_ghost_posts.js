/**
 * 블로그 Firestore 클린업 — 작가님 승인 기반 삭제
 *
 * 사용법:
 *   cd monkos_AI/portal && node scripts/cleanup_ghost_posts.js
 *   cd monkos_AI/portal && node scripts/cleanup_ghost_posts.js --execute
 *
 * 기본: dry-run (목록만 출력). --execute 시에만 실제 삭제.
 * ⚠️ 프로덕션 Firestore에 직접 접근합니다.
 *   GCP 인증 필요: gcloud auth application-default login
 *
 * 2026-03-20 작가님 승인 삭제 목록:
 *   A. 미발행 + lang 불일치 4건
 *   B. JA 헤어스타일 중복 1건 (3/17 구버전)
 *   C. EN Baby Passport 중복 2건 (최신 1건만 보존)
 */

import { Firestore } from '@google-cloud/firestore';

const execute = process.argv.includes('--execute');
const db = new Firestore({ projectId: 'monkos' });
const blogCollection = db.collection('blog_posts');

// 작가님 승인 삭제 대상 (2026-03-20 22:28 KST)
const DELETE_TARGETS = [
  // A. 미발행 + lang 불일치 (ko인데 JA 제목, slug=untitled 등)
  { id: 'monkosai', reason: '미발행, lang=ko인데 JA 제목' },
  { id: 'monkosai-en', reason: '미발행, 위 글의 EN 번역' },
  { id: 'untitled', reason: '미발행, lang=ko인데 JA 제목, slug=untitled' },
  { id: 'untitled-en', reason: '미발행, 위 글의 EN 번역' },

  // B. JA 헤어스타일 중복 — 3/19(최신) 보존, 3/17 삭제
  { id: '증명사진-헤어스타일-메이크업-다음은-헤어-인상을-완성하는-마지막-한-수-ja', reason: 'JA 헤어스타일 중복 (3/17 구버전, 3/19 최신 보존)' },

  // C. EN Baby Passport 중복 — mmxg1mrn-en(3/19 12:26, 최신) 보존, 나머지 2건 삭제
  { id: '一度は悩む赤ちゃんのパスポト写真-写真館に行かなくても家で撮れた話-en', reason: 'EN Baby Passport 중복 (3/19 12:24, 최신 아님)' },
  { id: '한번쯤-고민하게-되는-아기-여권사진-사진관-안-가도-집에서-찍은-이야기-en', reason: 'EN Baby Passport 중복 (3/18, 구버전)' },
];

async function main() {
  console.log(`\n========================================`);
  console.log(`  블로그 Firestore 클린업`);
  console.log(`  모드: ${execute ? '⚠️  EXECUTE (실제 삭제)' : '🔍 DRY RUN (조회만)'}`);
  console.log(`  대상: ${DELETE_TARGETS.length}건 (작가님 승인)`);
  console.log(`========================================\n`);

  // 삭제 전 존재 확인
  const exists = [];
  const missing = [];

  for (const target of DELETE_TARGETS) {
    const docRef = blogCollection.doc(target.id);
    const doc = await docRef.get();
    if (doc.exists) {
      const data = doc.data();
      exists.push({ ...target, title: data.title, lang: data.lang, published: data.published });
      console.log(`  ✅ 존재: ${target.id}`);
      console.log(`     제목: ${(data.title || '').substring(0, 60)}`);
      console.log(`     사유: ${target.reason}\n`);
    } else {
      missing.push(target);
      console.log(`  ⚠️  미존재: ${target.id}\n`);
    }
  }

  console.log(`========================================`);
  console.log(`  존재: ${exists.length}건 / 미존재: ${missing.length}건`);
  console.log(`========================================\n`);

  if (exists.length === 0) {
    console.log('삭제 대상 없음. 종료.');
    return;
  }

  if (!execute) {
    console.log('🔍 DRY RUN 완료. 실제 삭제하려면 --execute 플래그를 추가하세요.');
    console.log('   node scripts/cleanup_ghost_posts.js --execute\n');
    return;
  }

  // 실제 삭제
  console.log('⚠️  삭제 실행 중...\n');
  const batch = db.batch();
  for (const target of exists) {
    batch.delete(blogCollection.doc(target.id));
  }
  await batch.commit();
  console.log(`✅ ${exists.length}건 삭제 완료.\n`);

  // 삭제 후 검증
  const postSnap = await blogCollection.get();
  console.log(`[검증] 삭제 후 blog_posts: ${postSnap.docs.length}건\n`);
}

main().catch(err => {
  console.error('[cleanup_ghost_posts] 에러:', err.message);
  process.exit(1);
});

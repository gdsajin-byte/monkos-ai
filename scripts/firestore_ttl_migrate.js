/**
 * 1회성 마이그레이션: 기존 Firestore 문서에 expireAt 필드 백필
 *
 * 대상 컬렉션:
 *   - chat_conversations (90일 TTL)
 *   - cs_conversations (3년 TTL)
 *   - kakao_conversations (90일 TTL)
 *   - idphoto_kr_conversations (90일 TTL)
 *   - prep_conversations (90일 TTL)
 *   - telegramGateCodes (24시간 TTL)
 *
 * 사용법:
 *   node scripts/firestore_ttl_migrate.js [--dry-run]
 *
 * ⚠️ 실행 전 확인:
 *   - PROJECT_ID 환경변수 또는 ADC 설정 필요
 *   - --dry-run으로 먼저 영향 범위 확인 권장
 */

import { Firestore } from '@google-cloud/firestore';

const PROJECT_ID = process.env.PROJECT_ID || 'monkos';
const DRY_RUN = process.argv.includes('--dry-run');

const firestore = new Firestore({ projectId: PROJECT_ID });

const TTL_90_DAYS = 90 * 24 * 60 * 60 * 1000;
const TTL_24_HOURS = 24 * 60 * 60 * 1000;
const GRACE_7_DAYS = 7 * 24 * 60 * 60 * 1000;

const now = Date.now();

/**
 * 컬렉션의 모든 문서에 expireAt 백필
 */
async function migrateCollection(collectionName, ttlMs, graceMs) {
  console.log(`\n--- ${collectionName} (TTL: ${ttlMs / 86400000}일) ---`);

  const snapshot = await firestore.collection(collectionName).get();
  console.log(`  총 문서: ${snapshot.size}`);

  let updated = 0;
  let alreadySet = 0;
  let graced = 0;

  const batch = firestore.batch();
  let batchCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();

    // expireAt 이미 설정된 문서는 스킵
    if (data.expireAt) {
      alreadySet++;
      continue;
    }

    // updatedAt 기준으로 expireAt 계산
    const updatedAtStr = data.updatedAt || data.createdAt;
    let expireAt;

    if (updatedAtStr) {
      const updatedAtMs = new Date(updatedAtStr).getTime();
      const naturalExpire = updatedAtMs + ttlMs;

      if (naturalExpire < now) {
        // 이미 TTL 경과 → 유예 기간 부여
        expireAt = new Date(now + graceMs);
        graced++;
      } else {
        expireAt = new Date(naturalExpire);
      }
    } else {
      // updatedAt 없는 문서 → 유예 기간 부여
      expireAt = new Date(now + graceMs);
      graced++;
    }

    if (!DRY_RUN) {
      batch.update(doc.ref, { expireAt });
      batchCount++;

      // Firestore batch 500개 제한
      if (batchCount >= 500) {
        await batch.commit();
        batchCount = 0;
      }
    }
    updated++;
  }

  if (!DRY_RUN && batchCount > 0) {
    await batch.commit();
  }

  console.log(`  업데이트 대상: ${updated}`);
  console.log(`  이미 설정됨: ${alreadySet}`);
  console.log(`  유예 적용: ${graced}`);
  if (DRY_RUN) console.log(`  [DRY RUN] 실제 변경 없음`);
}

/**
 * telegramGateCodes는 used + 24시간 경과 문서에 TTL 설정
 */
async function migrateGateCodes() {
  const collectionName = 'telegramGateCodes';
  console.log(`\n--- ${collectionName} (TTL: 24시간) ---`);

  const snapshot = await firestore.collection(collectionName).get();
  console.log(`  총 문서: ${snapshot.size}`);

  let updated = 0;
  let alreadySet = 0;

  const batch = firestore.batch();
  let batchCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();

    if (data.expireAt) {
      alreadySet++;
      continue;
    }

    const createdAtMs = data.createdAt ? new Date(data.createdAt).getTime() : now;
    const expireAt = new Date(createdAtMs + TTL_24_HOURS);

    if (!DRY_RUN) {
      batch.update(doc.ref, { expireAt });
      batchCount++;

      if (batchCount >= 500) {
        await batch.commit();
        batchCount = 0;
      }
    }
    updated++;
  }

  if (!DRY_RUN && batchCount > 0) {
    await batch.commit();
  }

  console.log(`  업데이트 대상: ${updated}`);
  console.log(`  이미 설정됨: ${alreadySet}`);
  if (DRY_RUN) console.log(`  [DRY RUN] 실제 변경 없음`);
}

async function main() {
  console.log(`=== Firestore TTL 마이그레이션 ===`);
  console.log(`프로젝트: ${PROJECT_ID}`);
  console.log(`모드: ${DRY_RUN ? 'DRY RUN (변경 없음)' : '실행'}`);
  console.log(`시각: ${new Date().toISOString()}`);

  // 90일 TTL 컬렉션들 (유예: 7일)
  await migrateCollection('chat_conversations', TTL_90_DAYS, GRACE_7_DAYS);
  await migrateCollection('kakao_conversations', TTL_90_DAYS, GRACE_7_DAYS);
  await migrateCollection('idphoto_kr_conversations', TTL_90_DAYS, GRACE_7_DAYS);
  await migrateCollection('prep_conversations', TTL_90_DAYS, GRACE_7_DAYS);

  // CS 대화도 90일 TTL (유예: 7일) — 거래 장부(payments, transactions)와 별도
  await migrateCollection('cs_conversations', TTL_90_DAYS, GRACE_7_DAYS);

  // 24시간 TTL
  await migrateGateCodes();

  console.log(`\n=== 마이그레이션 ${DRY_RUN ? '시뮬레이션' : ''} 완료 ===`);
}

main().catch(err => {
  console.error('마이그레이션 에러:', err);
  process.exit(1);
});

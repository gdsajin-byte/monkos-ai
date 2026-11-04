import { Storage } from '@google-cloud/storage';
import { firestore, log, CUSTOMER_GCS_BUCKET } from './shared/config.js';
import { isDevService } from './gen-origin.js';

const storage = new Storage();
const bucket = storage.bucket(CUSTOMER_GCS_BUCKET);
const gensCol = firestore.collection('generations');

function toBuffer(base64) {
  const raw = base64.includes(',') ? base64.split(',')[1] : base64;
  return Buffer.from(raw, 'base64');
}

export async function saveImages(service, userId, style, originalImage, generatedImage, extras) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  // 저장 경로도 귀속 기준으로 통일 (2026-08-26) — 종전에는 게이트값(specs-visitor)을 그대로 써서
  // 로그인 유저의 무료 생성물이 전부 한 폴더에 섞였다. 기존 파일 경로는 그대로 유지되고 신규분부터 적용.
  const pathOwner = (!userId || userId === 'specs-visitor') ? (extras?.authUserId || userId || 'specs-visitor') : userId;
  const basePath = `${service}/${pathOwner}`;
  const originalPath = `${basePath}/${timestamp}_${style}_original.jpg`;
  const generatedPath = `${basePath}/${timestamp}_${style}_generated.png`;
  const meta = { userId, service, style, createdAt: new Date().toISOString() };

  const tasks = [
    bucket.file(originalPath).save(toBuffer(originalImage), { contentType: 'image/jpeg', metadata: meta }),
    bucket.file(generatedPath).save(toBuffer(generatedImage), { contentType: 'image/png', metadata: meta }),
  ];

  let t1RawPath = null;
  if (extras?.t1Raw) {
    t1RawPath = `${basePath}/${timestamp}_${style}_t1_raw.png`;
    tasks.push(bucket.file(t1RawPath).save(toBuffer(extras.t1Raw), { contentType: 'image/png', metadata: meta }));
  }

  await Promise.all(tasks);

  // 귀속 우선순위: 게이트 uid > 로그인 uid(무료 트랙) > 익명 세션 (2026-08-26)
  // 무료 트랙은 gateUserId가 'specs-visitor' 고정이라 로그인 유저도 익명으로 기록돼 왔다.
  // sessionId를 별도 필드로 남겨 비로그인 구간도 세션 단위로 이어붙일 수 있게 한다.
  const gateAnonymous = !userId || userId === 'specs-visitor';
  const ownerId = gateAnonymous ? (extras?.authUserId || null) : userId;
  const genDoc = {
    userId: ownerId || `anonymous_${extras?.sessionId || 'unknown'}`,
    sessionId: extras?.sessionId || null,
    authenticated: !!ownerId,
    gate: extras?.gate || null,
    creditSource: extras?.creditSource || null, // 'welcome' | 'purchased' | null (gate=credits 한정, 2026-09-26)
    service,
    style,
    slug: extras?.slug || null,
    channel: extras?.channel || 'monkos',
    gcsOriginal: originalPath,
    gcsGenerated: generatedPath,
    gcsT1Raw: t1RawPath || null,
    status: 'active',
    // 출처·시험 딱지 (ORDER_20261105) — 호출부가 generationOrigin(req)로 계산해 extras.origin에 싣는다.
    // 호출부 누락 시에도 실행 서비스는 남긴다(dev면 isTest). 필드가 없는 과거 문서는 손대지 않는다.
    originService: extras?.origin?.originService ?? (process.env.K_SERVICE || null),
    isTest: extras?.origin ? extras.origin.isTest === true : isDevService(process.env.K_SERVICE),
    testReason: extras?.origin ? (extras.origin.testReason || null) : (isDevService(process.env.K_SERVICE) ? 'dev_service' : null),
    createdAt: new Date().toISOString(),
  };

  try {
    await gensCol.add(genDoc);
  } catch (e) {
    log(`[GCS] generations 기록 실패 (무시): ${e.message}`, 'WARNING');
  }

  // 딱지 값도 로그에 — Firestore 직접 조회 없이(ch4 10조) 저장 내용을 확인할 수 있게
  log(`[GCS] 병렬 저장 완료: ${basePath}/ (원본+생성${t1RawPath ? '+나노원본' : ''}) origin=${genDoc.originService || '-'} isTest=${genDoc.isTest}${genDoc.testReason ? `(${genDoc.testReason})` : ''}`);
  return { originalPath, generatedPath, t1RawPath };
}

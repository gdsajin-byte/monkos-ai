/**
 * find_admin_uids.js — admin 권한 등록용 Google sub UID 조회
 *
 * 용도:
 *   ADMIN_UIDS 환경변수에 등록할 사용자의 Google sub(21자리 숫자) UID를 찾는다.
 *   Firebase Auth가 아닌 portal Firestore users 컬렉션 직접 조회 (문서 ID = Google sub).
 *
 * 사용법:
 *   1. 아래 targets 배열에 검색할 이메일/이름 키워드 추가 (부분 일치)
 *   2. cd monkos_AI/portal && node scripts/find_admin_uids.js
 *   3. 출력된 uid를 ADMIN_UIDS에 콤마 구분으로 등록:
 *      gcloud run services update monkos-portal --region=us-central1 \
 *        --update-env-vars="^@@^ADMIN_UIDS=uid1,uid2,uid3"
 *      (콤마가 dict 구분자라 ^@@^ 이스케이프 필수)
 *
 * 최초 작성: 2026-04-10 (admin 봉인 사고 대응 — 4f71cbc 버그)
 */

import { firestore } from '../lib/shared/config.js';

const targets = ['gdsajin@gmail.com', 'oneflower0411@gmail.com'];

const snap = await firestore.collection('users').get();
const found = [];
snap.forEach(d => {
  const data = d.data();
  const email = (data.email || '').toLowerCase();
  const name = (data.name || '').toLowerCase();
  if (targets.some(t => email.includes(t.toLowerCase()) || name.includes(t.toLowerCase()))) {
    found.push({ uid: d.id, email: data.email, name: data.name, provider: data.provider });
  }
});

console.log('=== 매칭 결과 ===');
console.log(JSON.stringify(found, null, 2));
console.log(`\n총 users: ${snap.size}, 매칭: ${found.length}`);
process.exit(0);

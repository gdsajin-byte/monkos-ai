---
type: order
date: 2026-07-15
device: iMac
agent: 쌍아
recipient: 막내
portfolio: PF_PORTAL
subject: T0 — generations 컬렉션 신설 + saveImages 동시 기록 + GCS 백필
status: 발행
---

# T0 — generations 인덱스 신설

**[2026-07-15 13:39 KST]** iMac/쌍아 → 막내

> 작가님 확정 (7/15): 기본 무기한 보관 + 고객 선택 삭제. 백필 전량. 어드민 먼저.
> 설계서: `monkos-ops/tech/designs/2026-07/DESIGN_20260715_유저프로필_통합데이터모델_대시보드재설계.md`
> 민아 검토: 트랙1 병행 안전 — gcs-save.js 내부 한정, server.js 무접촉

---

## 목표

생성 이미지를 GCS에 저장할 때 Firestore `generations` 컬렉션에 동시 기록하여, "이 유저가 뭘 만들었는지" 조회 가능하게 한다. 기존 GCS 이미지도 전량 백필.

---

## 작업 1: `saveImages()` 보강 — generations 동시 기록

**파일**: `monkos_AI/portal/lib/gcs-save.js` (이 파일만 수정)

### 현행

```javascript
export async function saveImages(service, userId, style, originalImage, generatedImage, extras) {
  // GCS 저장만 하고 return { originalPath, generatedPath, t1RawPath }
}
```

### 변경

GCS 저장 완료 후, Firestore `generations` 컬렉션에 1건 기록.

```javascript
import { firestore } from './shared/config.js';

const gensCol = firestore.collection('generations');

export async function saveImages(service, userId, style, originalImage, generatedImage, extras) {
  // ... 기존 GCS 저장 로직 그대로 ...

  await Promise.all(tasks);

  // generations 인덱스 기록 (fire-and-forget 아님 — 인덱스 누락 방지)
  const isAnonymous = !userId || userId === 'specs-visitor';
  const genDoc = {
    userId: isAnonymous ? `anonymous_${extras?.sessionId || 'unknown'}` : userId,
    service,
    style,
    slug: extras?.slug || null,
    channel: extras?.channel || 'monkos',
    gcsOriginal: originalPath,
    gcsGenerated: generatedPath,
    gcsT1Raw: t1RawPath || null,
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  try {
    await gensCol.add(genDoc);
  } catch (e) {
    log(`[GCS] generations 기록 실패 (무시): ${e.message}`, 'WARNING');
  }

  log(`[GCS] 병렬 저장 완료: ${basePath}/ (원본+생성${t1RawPath ? '+나노원본' : ''})`);
  return { originalPath, generatedPath, t1RawPath };
}
```

### 호출부 변경

**server.js 834행** — `extras`에 `sessionId`와 `slug` 전달 추가:

```javascript
// 현행:
await saveImages('idphoto', gateUserId, slug || format || 'passport', norm.rawBase64, finalBase64, t1RawForSave ? { t1Raw: t1RawForSave } : undefined);

// 변경:
await saveImages('idphoto', gateUserId, slug || format || 'passport', norm.rawBase64, finalBase64, {
  ...(t1RawForSave && { t1Raw: t1RawForSave }),
  sessionId: req.sessionId,
  slug: slug || null,
});
```

**⚠️ server.js 변경은 이 1행만.** 다른 라우트·로직 일체 수정 금지.

---

## 작업 2: Firestore 복합 인덱스 생성

`firestore.indexes.json`에 추가 (또는 Firestore 콘솔에서 생성):

```json
{
  "collectionGroup": "generations",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "userId", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

---

## 작업 3: GCS 백필 스크립트

**파일**: `monkos_AI/portal/scripts/backfill-generations.js` (신규)

기존 GCS `monk-customer-photos` 버킷의 모든 객체를 스캔하여 `generations` 컬렉션에 기록.

```javascript
// 의사코드
const [files] = await bucket.getFiles({ prefix: '' });

for (const file of files) {
  // _original.jpg 파일만 처리 (generated는 같은 timestamp로 매칭)
  if (!file.name.endsWith('_original.jpg')) continue;

  const parts = file.name.split('/');
  // {service}/{userId}/{timestamp}_{style}_original.jpg
  const service = parts[0];
  const userId = parts[1];
  const filename = parts[2];
  const match = filename.match(/^(.+)_(.+)_original\.jpg$/);
  if (!match) continue;

  const [, timestamp, style] = match;
  const generatedPath = file.name.replace('_original.jpg', '_generated.png');

  // 중복 체크
  const existing = await gensCol
    .where('userId', '==', userId)
    .where('gcsOriginal', '==', file.name)
    .limit(1).get();
  if (!existing.empty) continue;

  await gensCol.add({
    userId,
    service,
    style,
    slug: null,  // 과거 데이터는 slug 미기록
    channel: 'monkos',
    gcsOriginal: file.name,
    gcsGenerated: generatedPath,
    gcsT1Raw: null,
    status: 'active',
    createdAt: timestamp.replace(/-/g, (m, i) => i < 13 ? (i === 4 || i === 7 ? '-' : ':') : ':') || new Date().toISOString(),
  });
}
```

**실행**: 로컬에서 1회 실행 (`node scripts/backfill-generations.js`). SA 인증 필요.

---

## ⚠️ 준수 조항

1. **gcs-save.js 내부 한정**: server.js는 extras 전달 1행만 변경. 라우트·로직 추가 금지 — 트랙1 병행 안전 조건.
2. **비로그인 처리**: `userId === 'specs-visitor'`이면 `anonymous_{sessionId}`로 마킹. null이나 빈 문자열로 저장 금지.
3. **generations 기록 실패는 GCS 저장을 막지 않음**: try-catch로 감싸되 WARNING 로그. 사진 저장이 인덱스 기록보다 우선.
4. **Firestore 직접 접근**: 서비스 코드(gcs-save.js) 내 접근이므로 ch4 10조 6항 "서비스 코드는 대상 아님"에 부합.
5. **배포**: `./deploy.sh prod` 경유 필수.

---

## 산출물 체크리스트

- [ ] `gcs-save.js` — generations 동시 기록 추가
- [ ] `server.js:834` — extras에 sessionId, slug 전달 (1행만)
- [ ] Firestore 복합 인덱스 (userId + createdAt desc)
- [ ] `scripts/backfill-generations.js` — 백필 스크립트 작성
- [ ] 백필 실행 (로컬, 1회)
- [ ] dev 배포 → 생성 1회 → Firestore에 generations 문서 확인
- [ ] prod 배포

---

## 참조 파일

| 파일 | 용도 |
|------|------|
| `monkos_AI/portal/lib/gcs-save.js` | 수정 대상 (핵심) |
| `monkos_AI/portal/server.js:834` | 호출부 extras 전달 (1행) |
| `monkos_AI/portal/lib/shared/config.js` | firestore import |
| `monkos_AI/portal/lib/tracking.js` | BQ 패턴 참조 (fire-and-forget 아닌 패턴) |
| `DESIGN_20260715_유저프로필_통합데이터모델_대시보드재설계.md` | 설계 정본 |

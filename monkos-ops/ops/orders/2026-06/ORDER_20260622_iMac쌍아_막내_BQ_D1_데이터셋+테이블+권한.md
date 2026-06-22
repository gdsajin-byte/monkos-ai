---
type: order
date: 2026-06-22
from: iMac/쌍아
to: 막내
status: 대기
portfolio: PF_PORTAL
---

# 지시서: BigQuery 유저 트래킹 D1 — 데이터셋·테이블·권한 세팅

## 배경
- 자체 유저 트래킹 시스템 구축 (설계서: DESIGN_20260622_유저트래킹_BigQuery_어드민대시보드.md)
- 저장소: BigQuery, 프로젝트: `monkos` (작가님 확정)
- D1 = BQ 인프라 세팅 (이후 D2~D7의 선결 조건)

## 작업 항목

### 1. 포털에 @google-cloud/bigquery 설치

```bash
cd monkos_AI/portal && npm install @google-cloud/bigquery
```

### 2. BigQuery 데이터셋 생성

```bash
bq mk --dataset --location=asia-northeast3 --description="MONKOS 유저 트래킹 이벤트" monkos:monkos_tracking
```

- 프로젝트: `monkos`
- 데이터셋: `monkos_tracking`
- 위치: `asia-northeast3` (서울)

### 3. events 테이블 생성

```bash
bq mk --table \
  --time_partitioning_field=event_date \
  --time_partitioning_type=DAY \
  --clustering_fields=user_id,event_name \
  --description="유저 행동 이벤트 (streaming insert)" \
  monkos:monkos_tracking.events \
  event_id:STRING,event_name:STRING,event_timestamp:TIMESTAMP,event_date:DATE,user_id:STRING,session_id:STRING,page_path:STRING,lang:STRING,region:STRING,service:STRING,referer:STRING,user_agent:STRING,ip_country:STRING,params:JSON
```

### 4. identity_map 테이블 생성

```bash
bq mk --table \
  --description="익명 세션 → 가입 유저 매핑" \
  monkos:monkos_tracking.identity_map \
  session_id:STRING,user_id:STRING,linked_at:TIMESTAMP
```

### 5. SA 권한 확인

포털의 Cloud Run SA (`monk-image-engine@monkos.iam.gserviceaccount.com` 또는 포털이 사용하는 SA)에 BigQuery 권한 부여:

```bash
# 먼저 포털 SA 확인
gcloud run services describe monkos-portal --region=us-central1 --project=monkos --format="value(spec.template.spec.serviceAccountName)"

# SA에 BQ 권한 부여
gcloud projects add-iam-policy-binding monkos \
  --member="serviceAccount:{SA이메일}" \
  --role="roles/bigquery.dataEditor"

# 쿼리 권한 (어드민 대시보드에서 SELECT용)
gcloud projects add-iam-policy-binding monkos \
  --member="serviceAccount:{SA이메일}" \
  --role="roles/bigquery.jobUser"
```

### 6. 포털에 BQ 클라이언트 모듈 생성

**새 파일**: `monkos_AI/portal/lib/tracking.js`

```javascript
import { BigQuery } from '@google-cloud/bigquery';
import { log } from './shared/config.js';

const PROJECT_ID = process.env.PROJECT_ID || 'monkos';
const bq = new BigQuery({ projectId: PROJECT_ID });
const dataset = bq.dataset('monkos_tracking');
const eventsTable = dataset.table('events');
const identityTable = dataset.table('identity_map');

export async function trackEvent({ eventName, userId, sessionId, pagePath, lang, region, service, referer, userAgent, ipCountry, params }) {
  const now = new Date();
  const row = {
    event_id: crypto.randomUUID(),
    event_name: eventName,
    event_timestamp: now.toISOString(),
    event_date: now.toISOString().slice(0, 10),
    user_id: userId || null,
    session_id: sessionId || null,
    page_path: pagePath || null,
    lang: lang || null,
    region: region || null,
    service: service || 'portal',
    referer: referer || null,
    user_agent: userAgent || null,
    ip_country: ipCountry || null,
    params: params ? JSON.stringify(params) : null,
  };

  try {
    await eventsTable.insert([row]);
  } catch (err) {
    log(`[BQ] 이벤트 적재 실패: ${err.message}`, 'WARNING');
  }
}

export async function linkIdentity(sessionId, userId) {
  try {
    await identityTable.insert([{
      session_id: sessionId,
      user_id: userId,
      linked_at: new Date().toISOString(),
    }]);
  } catch (err) {
    log(`[BQ] identity 매핑 실패: ${err.message}`, 'WARNING');
  }
}

export { bq, dataset };
```

### 7. 동작 검증

```javascript
// 포털 디렉토리에서 테스트
node -e "
import { trackEvent } from './lib/tracking.js';
await trackEvent({
  eventName: 'test_ping',
  sessionId: 'test-session',
  pagePath: '/test',
  lang: 'ko',
  region: 'kr',
  service: 'portal',
});
console.log('✅ BQ 적재 테스트 완료');
"
```

```bash
# BQ에서 확인
bq query --use_legacy_sql=false "SELECT * FROM monkos.monkos_tracking.events WHERE event_name = 'test_ping' LIMIT 5"
```

## ⚠️ 준수 조항
- SA 키 JSON 코드 포함 금지 (헌법 4조 1항) — ADC (Application Default Credentials) 사용
- 배포: `deploy.sh` 경유 (ch5 2조)
- 테스트 데이터는 검증 후 삭제

## 검증
- [ ] `bq ls monkos:monkos_tracking` — events, identity_map 테이블 확인
- [ ] 테스트 이벤트 적재 → BQ 쿼리로 조회 정상
- [ ] 포털 배포 후 tracking.js import 에러 없음

## 대상 파일
1. `monkos_AI/portal/package.json` — @google-cloud/bigquery 추가
2. `monkos_AI/portal/lib/tracking.js` — **신규** (BQ 클라이언트 + trackEvent/linkIdentity)

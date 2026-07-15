---
type: order
date: 2026-07-15
device: iMac
agent: 쌍아
recipient: 막내
portfolio: PF_PORTAL
subject: T1 보강 — 외부 유입 경로 역추적 + BQ 타임라인 정적파일 필터
status: 발행
---

# T1 보강 — 외부 유입 역추적 + 노이즈 필터

**[2026-07-15 15:22 KST]** iMac/쌍아 → 막내

> 작가님 피드백: "우리 사이트에 들어오기 전이 어디냐. 우리사이트부터 보이는건 별도움이 안된다"
> 원인 실측: BQ에 외부 referrer(google.com, m.blog.naver.com 등)가 찍히고 있으나, 어드민 유저 상세가 이를 역추적하지 않음 + 정적 파일이 page_view로 찍혀 노이즈

---

## 작업 1: 외부 유입 경로 역추적

**파일**: `monkos_AI/portal/lib/cms/dashboard.js` — `handleDashboardUserDetail` 함수 내

### 현행 문제

유저 상세의 `acquisition` 데이터가 Firestore `users` 문서에서만 오는데, 클라 auth.js가 `acq_referrer` 파라미터를 안 보내서 항상 비어 있음.

### 해결: BQ에서 역추적

가입자의 `user_id` → `identity_map`에서 `session_id` → 해당 세션의 **첫 page_view 중 외부 referrer** 추출.

```sql
-- 1단계: 유저의 session_id 확보
WITH user_sessions AS (
  SELECT session_id 
  FROM `monkos.monkos_tracking.identity_map`
  WHERE user_id = @userId
),
-- 2단계: 해당 세션들의 첫 외부 referrer 있는 page_view
first_external AS (
  SELECT 
    e.referer,
    e.page_path,
    e.event_timestamp,
    ROW_NUMBER() OVER (ORDER BY e.event_timestamp ASC) as rn
  FROM `monkos.monkos_tracking.events` e
  JOIN user_sessions us ON e.session_id = us.session_id
  WHERE e.event_name = 'page_view'
    AND e.event_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
    AND e.referer IS NOT NULL
    AND e.referer != ''
    AND e.referer NOT LIKE '%monkos.ai%'
    AND e.referer NOT LIKE '%monkos-portal%'
)
SELECT referer, page_path, event_timestamp
FROM first_external
WHERE rn = 1
```

### 응답에 반영

`handleDashboardUserDetail` 응답의 `acquisition` 객체를 보강:

```javascript
// Firestore acquisition이 비어 있으면 BQ에서 역추적
if (!acquisition.referrer) {
  const [bqAcq] = await bq.query({ query: 위_SQL, params: { userId } });
  if (bqAcq.length > 0) {
    acquisition.referrer = bqAcq[0].referer;
    acquisition.landingUrl = bqAcq[0].page_path;
    acquisition.firstVisit = bqAcq[0].event_timestamp;
    acquisition.source = 'bq_traced';  // Firestore 원본과 구분
  }
}
```

### 프론트 표시

`admin/user.html`의 유입 경로 카드:
- referrer가 있으면 도메인 추출하여 표시 (예: `m.blog.naver.com`)
- 전체 URL은 작은 글씨로 밑에
- `source: 'bq_traced'`이면 "(BQ 역추적)" 라벨 표시
- 여전히 없으면 "(직접 접속)" 표시

---

## 작업 2: page_view 정적 파일 필터

**파일**: `monkos_AI/portal/server.js:1081`

### 현행

```javascript
if (req.method === 'GET' && !urlPath.startsWith('/api/') && !urlPath.startsWith('/admin/') 
    && !urlPath.endsWith('.xml') && !urlPath.endsWith('.txt')) {
  trackPageView(req);
}
```

정적 파일(`.js`, `.css`, `.jpg`, `.png` 등)을 필터하지 않아 BQ에 노이즈가 쌓임.

### 변경

```javascript
const STATIC_EXT = /\.(js|css|jpg|jpeg|png|gif|svg|webp|ico|woff|woff2|ttf|map|json)$/i;
const STATIC_PREFIX = /^\/(js|css|assets|images|fonts)\//;

if (req.method === 'GET' 
    && !urlPath.startsWith('/api/') 
    && !urlPath.startsWith('/admin/')
    && !urlPath.endsWith('.xml') 
    && !urlPath.endsWith('.txt')
    && !STATIC_EXT.test(urlPath)
    && !STATIC_PREFIX.test(urlPath)) {
  trackPageView(req);
}
```

---

## 작업 3: 어드민 유저 상세 타임라인 필터

**파일**: `monkos_AI/portal/lib/cms/dashboard.js` — `handleDashboardUserDetail` 내 BQ 타임라인 쿼리

### 현행

전 이벤트를 그대로 표시 → 정적 파일 page_view가 대량으로 보임.

### 변경

BQ 쿼리에서 정적 파일 경로 제외:

```sql
AND NOT REGEXP_CONTAINS(page_path, r'\.(js|css|jpg|jpeg|png|gif|svg|webp|ico|woff|woff2)$')
AND NOT STARTS_WITH(page_path, '/js/')
AND NOT STARTS_WITH(page_path, '/css/')
AND NOT STARTS_WITH(page_path, '/assets/')
AND NOT STARTS_WITH(page_path, '/fonts/')
```

---

## 작업 4: dashboard.html User 360° 유입경로 표시 보강

**파일**: `monkos_AI/portal/lib/cms/dashboard.js` — `handleDashboardUsers360`

현재 `signupSource`와 `referrer`를 Firestore에서만 가져오는데, 대부분 비어 있음.

### 보강: 가입자 전체의 외부 referrer 일괄 역추적은 비용이 크므로, users360 응답에는 Firestore 값만 유지. 개별 유저 상세(`/admin/user.html`)에서만 BQ 역추적.

단, 테이블의 유입경로 컬럼에서:
- `signupSource`가 있으면 그대로 표시
- 없으면 `(클릭하여 확인)` 표시 → 유저 상세 페이지로 안내

---

## 작업 5: 대시보드 본판 — 전체 유입 채널 집계 카드

**파일**: `monkos_AI/portal/lib/cms/dashboard.js` + `monkos_AI/portal/public/admin/dashboard.html`

### 목적

가입자뿐 아니라 **사이트에 들어온 모든 방문자**의 외부 유입처를 집계하여 대시보드에 표시.

### 신규 API: `/api/admin/dashboard/channels`

```javascript
export async function handleDashboardChannels(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;

  const days = parseInt(new URL(req.url, 'http://x').searchParams.get('days') || '7');

  const [rows] = await bq.query({
    query: `
      WITH external_visits AS (
        SELECT
          referer,
          page_path,
          event_timestamp
        FROM \`monkos.monkos_tracking.events\`
        WHERE event_name = 'page_view'
          AND event_date >= DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY)
          AND referer IS NOT NULL AND referer != ''
          AND referer NOT LIKE '%monkos.ai%'
          AND referer NOT LIKE '%monkos-portal%'
          AND NOT REGEXP_CONTAINS(page_path, r'\\.(js|css|jpg|jpeg|png|gif|svg|webp|ico|woff|woff2)$')
          AND NOT STARTS_WITH(page_path, '/js/')
          AND NOT STARTS_WITH(page_path, '/css/')
          AND NOT STARTS_WITH(page_path, '/assets/')
      )
      SELECT
        NET.HOST(referer) as source_domain,
        COUNT(*) as visits,
        ARRAY_AGG(DISTINCT page_path ORDER BY page_path LIMIT 5) as top_landings,
        ARRAY_AGG(DISTINCT referer ORDER BY referer LIMIT 5) as sample_urls
      FROM external_visits
      GROUP BY source_domain
      ORDER BY visits DESC
      LIMIT 15
    `,
    params: { days },
    location: 'asia-northeast3'
  });

  // 직접 접속 (referer 없는 page_view) 카운트
  const [directRows] = await bq.query({
    query: `
      SELECT COUNT(*) as cnt
      FROM \`monkos.monkos_tracking.events\`
      WHERE event_name = 'page_view'
        AND event_date >= DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY)
        AND (referer IS NULL OR referer = '')
        AND NOT REGEXP_CONTAINS(page_path, r'\\.(js|css|jpg|jpeg|png|gif|svg|webp|ico|woff|woff2)$')
        AND NOT STARTS_WITH(page_path, '/js/')
        AND NOT STARTS_WITH(page_path, '/css/')
        AND NOT STARTS_WITH(page_path, '/assets/')
    `,
    params: { days },
    location: 'asia-northeast3'
  });

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    days,
    channels: rows,
    directVisits: directRows[0]?.cnt || 0
  }));
}
```

**server.js 등록**:
```javascript
if (urlPath === '/api/admin/dashboard/channels' && req.method === 'GET') return handleDashboardChannels(req, res);
```

### 프론트: dashboard.html에 유입 채널 카드 추가

트래픽 차트 행 아래 또는 옆에 카드 추가. 7일/30일/90일 탭.

```
┌─ 외부 유입 채널 (7일) ──────────────────────┐
│                                              │
│  google.com           ████████████  47 (58%) │
│  m.blog.naver.com     ████         12 (15%) │
│  (직접 접속)           ███           9 (11%) │
│  search.naver.com     ██            7  (9%) │
│  chatgpt.com          █             3  (4%) │
│                                              │
│  m.blog.naver.com 펼치기 ▶                    │
│    /monkos_ai/224316618581  — 5회            │
│    /monkos_ai/224298765432  — 4회            │
│    → 랜딩: /specs/kr-passport, /             │
└──────────────────────────────────────────────┘
```

- 도메인별 바 차트 (비율 바)
- 클릭하면 해당 도메인의 `sample_urls` (어떤 글/페이지에서 왔는지) + `top_landings` (우리 사이트 어디로 왔는지) 펼침
- 직접 접속은 별도 행으로 표시

---

## ⚠️ 준수 조항

1. **server.js 정적 필터**: 기존 라우팅·로직 무변경. `trackPageView` 호출 조건만 강화.
2. **BQ 쿼리 파티션 필터 필수**: 모든 BQ 쿼리에 `event_date >= 90일` 조건.
3. **이미 쌓인 BQ 데이터는 삭제하지 않음**: 정적 파일 page_view도 기록은 유지. 표시만 필터.
4. **배포**: `./deploy.sh prod` 경유.

---

## 산출물 체크리스트

- [ ] `dashboard.js` — BQ 외부 referrer 역추적 쿼리 추가
- [ ] `admin/user.html` — 유입 경로 카드에 역추적 결과 표시
- [ ] `server.js:1081` — 정적 파일 page_view 필터 추가
- [ ] `dashboard.js` — 타임라인 BQ 쿼리에 정적 파일 제외 조건
- [ ] `dashboard.js` — `handleDashboardChannels` 함수 추가
- [ ] `server.js` — `/api/admin/dashboard/channels` 라우트 등록
- [ ] `admin/dashboard.html` — 유입 채널 집계 카드 추가 (7d/30d/90d 탭, 도메인별 바 차트, 펼치기)
- [ ] dev 배포 → 유저 상세에서 외부 referrer 표시 + 대시보드 채널 카드 확인
- [ ] prod 배포

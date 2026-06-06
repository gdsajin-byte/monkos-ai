---
type: order
date: 2026-06-06
from: iMac/쌍아
to: iMac/막내
subject: 어드민 대시보드 신설 (GA4 + 가입자 + 크레딧 + 서비스)
status: 대기
portfolio: PF_PORTAL
---

# 지시서: 어드민 대시보드 신설

> **목적**: `/admin/` 대시보드에 운영 현황(트래픽·가입자·크레딧·서비스 사용량)을 실시간 확인·제어할 수 있는 페이지를 추가한다.

---

## 1. 산출물

| # | 파일 | 역할 |
|---|------|------|
| 1 | `monkos_AI/portal/public/admin/dashboard.html` | 프론트엔드 대시보드 페이지 |
| 2 | `monkos_AI/portal/lib/cms/dashboard.js` | 백엔드 API 핸들러 |
| 3 | `monkos_AI/portal/server.js` | 라우트 등록 (기존 파일 수정) |
| 4 | `monkos_AI/portal/public/admin/index.html` | 대시보드 카드 링크 추가 (기존 파일 수정) |

---

## 2. 백엔드 API 설계

### 2-1. 엔드포인트

모든 엔드포인트는 `requireAdmin(req, res)` 인증 필수.

```
GET /api/admin/dashboard/summary
GET /api/admin/dashboard/users
GET /api/admin/dashboard/credits
GET /api/admin/dashboard/traffic
```

### 2-2. `/api/admin/dashboard/summary`

한 번의 호출로 대시보드 상단 요약 카드 데이터를 반환한다.

```json
{
  "totalUsers": 135,
  "todaySignups": 2,
  "monthSignups": 9,
  "totalCredits": 1250,
  "avgCreditsPerUser": 9.3,
  "activeUsersToday": 12
}
```

**구현**:
- Firestore `users` 컬렉션 전체 스냅샷에서 집계
- `totalUsers`: snap.size
- `todaySignups`: `createdAt`이 오늘 날짜인 문서 수
- `monthSignups`: `createdAt`이 이번 달인 문서 수
- `totalCredits`: 전체 사용자 `credits` 필드 합산
- `avgCreditsPerUser`: totalCredits / totalUsers
- `activeUsersToday`: `lastLogin`이 오늘인 문서 수

### 2-3. `/api/admin/dashboard/users?days=30`

일별 가입자 추이 + 인증방식별 분포.

```json
{
  "daily": [
    { "date": "2026-06-05", "count": 2 },
    { "date": "2026-06-04", "count": 1 }
  ],
  "byProvider": { "kakao": 85, "google": 35, "line": 15 },
  "total": 135,
  "recentUsers": [
    { "id": "kakao_123", "name": "홍길동", "provider": "kakao", "email": "...", "credits": 8, "createdAt": "2026-06-05T..." }
  ]
}
```

**구현**:
- `days` 쿼리 파라미터 (기본 30, 최대 90)
- `daily`: `createdAt` 기준 일별 그룹핑
- `byProvider`: `provider` 필드 기준 집계
- `recentUsers`: `createdAt` 내림차순 최근 20명 (이름, 이메일, 크레딧, 가입일, 인증방식)

### 2-4. `/api/admin/dashboard/credits`

크레딧 전체 현황 + 최근 트랜잭션.

```json
{
  "distribution": {
    "zero": 12,
    "low": 45,
    "mid": 50,
    "high": 28
  },
  "totalCredits": 1250,
  "recentTransactions": [
    { "userId": "...", "amount": -2, "type": "use", "description": "...", "createdAt": "..." }
  ]
}
```

**구현**:
- `distribution`: credits 기준 구간별 사용자 수 (0 / 1~5 / 6~20 / 21+)
- `recentTransactions`: Firestore `transactions` 컬렉션에서 `createdAt` 내림차순 최근 50건
- `totalCredits`: 전체 사용자 credits 합산

### 2-5. `/api/admin/dashboard/traffic?days=30`

GA4 Data API 연동 트래픽 데이터.

```json
{
  "daily": [
    { "date": "2026-06-05", "newUsers": 49, "activeUsers": 52, "sessions": 68 }
  ],
  "summary": {
    "totalSessions": 1200,
    "totalNewUsers": 234,
    "avgSessionDuration": 145
  }
}
```

**구현**:
- `@google-analytics/data` 패키지 설치 필요: `npm install @google-analytics/data`
- GA4 property ID: `521406894`
- config.js에 `analyticsPropertyId` export 추가
- `BetaAnalyticsDataClient` 사용, ADC 인증 (기존 서비스 계정 재활용)
- dimensions: `date`, metrics: `newUsers`, `activeUsers`, `sessions`, `averageSessionDuration`
- `days` 쿼리 파라미터 (기본 30, 최대 90)

---

## 3. 프론트엔드 설계

### 3-1. `dashboard.html` 구조

기존 어드민 스타일(CSS 변수, nav 패턴) 그대로 따른다. `settings.html`, `layout.html` 참조.

```
┌─────────────────────────────────────────────┐
│ MONKOS Admin                   ← Dashboard  │
├─────────────────────────────────────────────┤
│                                             │
│  [총 가입자]  [오늘 가입]  [월 가입]  [총 크레딧]  │  ← 요약 카드 4장
│                                             │
│  ── 트래픽 ──────────────────────────────     │
│  [기간 선택: 7일 / 30일 / 90일]              │
│  [일별 방문자 차트 — 막대 or 라인]             │
│                                             │
│  ── 가입자 ──────────────────────────────     │
│  [일별 가입 추이 차트]  [인증방식 파이차트]      │
│  [최근 가입자 테이블 — 20명]                  │
│                                             │
│  ── 크레딧 ──────────────────────────────     │
│  [잔액 분포 차트]                             │
│  [최근 트랜잭션 테이블 — 50건]                 │
│                                             │
└─────────────────────────────────────────────┘
```

### 3-2. 차트 라이브러리

- **Chart.js CDN** 사용: `https://cdn.jsdelivr.net/npm/chart.js`
- 라인 차트 (트래픽, 가입 추이), 도넛 차트 (인증방식, 크레딧 분포)
- 색상은 기존 CSS 변수 활용 (`--accent`, `--accent2`, `--success`, `--danger`)

### 3-3. 기간 선택

탭 버튼 3개 (`7일` / `30일` / `90일`). 클릭 시 API 재호출 + 차트 갱신.

### 3-4. 테이블

- 최근 가입자: 이름 | 이메일 | 인증방식 | 크레딧 | 가입일
- 최근 트랜잭션: 시각 | 사용자 | 금액 | 유형 | 설명

### 3-5. 인증

기존 패턴 그대로: 페이지 로드 → `/api/auth/verify-cookie` → `/api/admin/blog` (adminCheck) → 대시보드 데이터 로드.

---

## 4. index.html 수정

대시보드 섹션 최상단에 Dashboard 카드를 추가한다.

```html
<a href="/admin/dashboard.html" class="menu-card">
  <div class="count">📊</div>
  <h3>Dashboard</h3>
  <div class="label">트래픽 · 가입자 · 크레딧 현황</div>
</a>
```

기존 `<h1>Dashboard</h1>` 텍스트는 `<h1>CMS</h1>`로 변경 (대시보드 페이지와 구분).

---

## 5. server.js 라우트 등록

기존 admin API 패턴 그대로:

```javascript
import { handleDashboardSummary, handleDashboardUsers, handleDashboardCredits, handleDashboardTraffic } from './lib/cms/dashboard.js';

// Dashboard API
if (urlPath === '/api/admin/dashboard/summary' && req.method === 'GET') return handleDashboardSummary(req, res);
if (urlPath === '/api/admin/dashboard/users' && req.method === 'GET') return handleDashboardUsers(req, res);
if (urlPath === '/api/admin/dashboard/credits' && req.method === 'GET') return handleDashboardCredits(req, res);
if (urlPath === '/api/admin/dashboard/traffic' && req.method === 'GET') return handleDashboardTraffic(req, res);
```

admin API 블록 (blog/faq/gallery 라우트 근처)에 삽입한다.

---

## 6. ⚠️ 준수 조항

- **헌법 4조 1항**: API 키, 프로젝트 ID 하드코딩 금지. GA4 property ID는 `config.js`에서 환경변수 또는 상수로 관리.
- **ch2 코딩 규칙**: 기존 코드 패턴(ESM import, `requireAdmin`, `log()`) 준수. 새 프레임워크 도입 금지.
- **ch5 배포**: 이 지시서는 코드 작성+커밋까지. 배포는 별도 지시.
- `@google-analytics/data` 패키지 설치 시 `package.json` 변경 포함하여 커밋.

---

## 7. 참조 파일

| 용도 | 경로 |
|------|------|
| 어드민 인증 패턴 | `monkos_AI/portal/lib/cms/admin-auth.js` |
| 기존 CMS 핸들러 예시 | `monkos_AI/portal/lib/cms/blog.js` |
| 크레딧/거래 로직 | `monkos_AI/portal/lib/credits.js` |
| Firestore 초기화 | `monkos_AI/portal/lib/shared/config.js` (L82-83) |
| 거래 원장 구조 | `monkos_AI/portal/lib/shared/config.js` (L230-248) |
| 어드민 인덱스 | `monkos_AI/portal/public/admin/index.html` |
| 어드민 스타일 참조 | `monkos_AI/portal/public/admin/settings.html` |
| user 문서 필드 | `provider`, `createdAt`, `credits`, `lastLogin`, `name`, `email` |

---

## 8. 완료 기준

- [ ] `npm install @google-analytics/data` 완료
- [ ] `dashboard.js` 백엔드 4개 엔드포인트 동작
- [ ] `dashboard.html` 프론트엔드 — 요약 카드 + 차트 3종 + 테이블 2종 렌더링
- [ ] `server.js` 라우트 등록
- [ ] `index.html` 대시보드 카드 추가
- [ ] 로컬 `node monkos_AI/portal/server.js` 실행 후 `/admin/dashboard.html` 접근 확인
- [ ] 커밋: `[feat] 어드민 대시보드 신설 — GA4/가입자/크레딧 현황`

---
type: order
date: 2026-07-15
device: iMac
agent: 쌍아
recipient: 막내
portfolio: PF_CITADEL
subject: CITADEL 대시보드 어드민 이식 — 초본 HTML + 실데이터 바인딩 + prod 배포
status: 발행
---

# CITADEL 대시보드 — 어드민 이식 + 실데이터 바인딩

**[2026-07-15 11:47 KST]** iMac/쌍아 → 막내

> 작가님 지시: "프로드 어드민에 배포해서 보면서 정리. 기존 대시보드와 품질 비교하면서 대체/보강 판단."
> 초본 원본: `monkos-ops/tech/designs/2026-07/DESIGN_20260714_CITADEL_데이터수집스키마_대시보드초본.html`
> 민아 v0.2 기안: `monkos-ops/ops/proposals/PROPOSAL_20260714_민아_CITADEL대시보드_v02구체화.md`

---

## 목표

쌍아 초본(v0.1) HTML을 포털 어드민 `citadel.html`로 이식하고, 기존 API + 신설 엔드포인트로 실데이터를 바인딩하여 prod 배포한다. 작가님이 기존 `dashboard.html`과 나란히 비교 평가할 수 있게 한다.

---

## 작업 1: 신규 엔드포인트 `/api/admin/dashboard/citadel`

**파일**: `monkos_AI/portal/lib/cms/dashboard.js` + `monkos_AI/portal/server.js`

GA4 + BQ 퍼널 데이터를 종합 응답하는 엔드포인트 1개 신설.

```
GET /api/admin/dashboard/citadel
→ requireAdmin
→ 응답:
{
  ga4: {
    sessions7d: number,       // GA4 최근 7일 세션 합계
    sessionsDaily: number,    // 7d 일평균
    newUsers7d: number,
    dataDate: "YYYY-MM-DD"    // 데이터 기준일
  },
  funnel: {
    // BQ monkos_tracking.events 최근 7일 이벤트별 카운트
    spec_select: number,
    photo_upload: number,
    generate_click: number,   // event_name = 'api_generate'
    preview_view: number,
    begin_checkout: number,   // event_name = 'credit_charge' 중 provider=toss|lemon
    purchase: number          // event_name = 'credit_charge' 완료
  },
  bqEvents: {
    // BQ 최근 7일 이벤트 타입별 집계
    page_view: number,
    auth_login: number,
    auth_signup: number,
    credit_charge: number,
    api_generate: number
  },
  secrets: {
    sm: 44,    // 현재 하드코딩 — 이후 자동화
    gh: 18
  },
  channels: {
    // 정적 하드코딩 (초본 기준) — 이후 동적 전환
    live: ["GSC Search Analytics", "GA4 Data API", "Google Indexing API", "IndexNow", "BQ User Tracking", "AI Referral", "SEO Health Check"],
    ready: ["Naver 검색광고 API", "Naver DataLab", "Bing WMT API", "PageSpeed Insights"],
    off: ["BQ→대시보드 시각화", "색인 피드백 루프", "키워드 시계열 DB", "경쟁사 모니터링", "AI 인용 추적", "Naver 서치어드바이저"]
  }
}
```

### 구현 상세

**GA4 데이터**: 기존 `handleDashboardTraffic`의 `analyticsClient.runReport` 패턴을 그대로 사용. 7일 고정.

**BQ 퍼널**: 기존 `tracking.js`의 BQ 클라이언트(`@google-cloud/bigquery`)를 재사용.

```js
import { BigQuery } from '@google-cloud/bigquery';
const bq = new BigQuery({ projectId: process.env.PROJECT_ID || 'monkos' });

// 최근 7일 이벤트별 카운트
const [rows] = await bq.query({
  query: `SELECT event_name, COUNT(*) as cnt
          FROM \`monkos.monkos_tracking.events\`
          WHERE event_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
          GROUP BY event_name`,
  location: 'asia-northeast3'
});
```

**캐시**: 메모리 캐시 1시간. 패턴:

```js
let citadelCache = { data: null, ts: 0 };
const CACHE_TTL = 3600000; // 1h

export async function handleDashboardCitadel(req, res) {
  const admin = requireAdmin(req, res);
  if (!admin) return;
  
  const now = Date.now();
  if (citadelCache.data && (now - citadelCache.ts) < CACHE_TTL) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(citadelCache.data));
  }
  // ... 수집 후 citadelCache = { data: result, ts: now };
}
```

**server.js 등록**:

```js
if (urlPath === '/api/admin/dashboard/citadel' && req.method === 'GET') return handleDashboardCitadel(req, res);
```

import에 `handleDashboardCitadel` 추가.

---

## 작업 2: `admin/citadel.html` — 초본 이식 + 실데이터 바인딩

**파일**: `monkos_AI/portal/public/admin/citadel.html` (신규)

### 2-1. 초본 HTML 복사

`DESIGN_20260714_CITADEL_데이터수집스키마_대시보드초본.html` 내용을 `citadel.html`로 복사. 단, 아래 수정 적용:

- `<!DOCTYPE html><html><head>` 등 전체 HTML 구조 추가 (현행 dashboard.html 패턴 참조)
- `<meta name="robots" content="noindex, nofollow">` 추가
- 상단 nav 바 추가 (기존 dashboard.html의 `.nav` 패턴 동일):

```html
<div class="nav">
  <div class="nav-logo">MONKOS ADMIN</div>
  <div style="display:flex;gap:16px;align-items:center">
    <a href="/admin/dashboard.html" class="nav-back">← Dashboard</a>
    <a href="/admin/citadel.html" style="font-weight:700;color:var(--accent)">CITADEL</a>
  </div>
</div>
```

### 2-2. 민아 정정 3건 반영

| # | 항목 | 수정 |
|---|------|------|
| 정정① | GA4 KPI 카드 "세션(7d)" | 값=7d 합계, 부제=일평균 병기. 예: `285` + `일평균 41` |
| 정정② | Purchase KPI 카드 | 라벨을 `"복구 · 실발화 검증 대기"` → 실데이터 연결 후 실제 purchase 카운트 표시. 데이터 없으면 `"계측 중"` |
| 정정③ | 전 KPI 카드 | 하단에 `데이터 기준: YYYY-MM-DD` 캡션 추가 (API 응답의 `dataDate` 사용) |

### 2-3. 실데이터 바인딩

페이지 로드 시:

1. **인증 체크**: 기존 dashboard.html의 인증 패턴 동일 사용 (`admin-common.js`의 `authFetch`)
2. **KPI 스트립**: `fetch('/api/admin/dashboard/citadel')` → ga4 + funnel + bqEvents 바인딩
3. **기존 API 재사용**:
   - `/api/admin/dashboard/summary` → KPI 보강 (가입, 결제, 매출)
   - `/api/admin/dashboard/traffic` → GA4 트렌드 (있으면 미니 차트)
4. **채널 상태**: 응답의 channels 배열로 채널 그리드 동적 생성 (live/ready/off dot 색상)
5. **퍼널 차트**: funnel 데이터로 bar width 비율 계산
6. **정적 유지**: 데이터 플로우 도해, MCP 서버 목록, 시크릿 인벤토리 — 초본 그대로 정적 유지

### 2-4. 기존 dashboard.html에 CITADEL 링크 추가

기존 dashboard.html의 `.nav` 영역에 CITADEL 탭 링크 1개 추가:

```html
<a href="/admin/citadel.html" class="nav-back">CITADEL →</a>
```

---

## ⚠️ 준수 조항

1. **초본 원본 존중**: 쌍아 초본의 레이아웃·색상·구조를 재해석하지 말 것. CSS 변수, 카드 배치, 플로우 다이어그램 모두 원본 유지. 변경은 민아 정정 3건 + nav 바 + 데이터 바인딩에 한정.
2. **시크릿 비노출 (헌법 4조)**: 대시보드는 시크릿 카운트·상태만 표시. 이름·값 절대 미노출.
3. **GSC API는 이번 지시서 범위 밖**: 포털에 GSC 클라이언트가 없고(`googleapis` searchconsole 미설치), SA 권한 확인이 필요. GSC KPI 카드는 일단 `"GSC — 연결 대기"` 플레이스홀더로 두고, GA4 + BQ만 실연결.
4. **기존 dashboard.html 무변경**: nav에 링크 1개 추가 외에 기존 대시보드 코드·스타일 일체 수정 금지. 작가님이 두 대시보드를 나란히 비교하실 예정.
5. **배포**: `./deploy.sh prod` 경유 필수 (ch5 2조).

---

## 산출물 체크리스트

- [ ] `dashboard.js`에 `handleDashboardCitadel` 함수 추가
- [ ] `server.js`에 라우트 등록 + import 추가
- [ ] `admin/citadel.html` 신규 생성 (초본 이식 + 실데이터 바인딩)
- [ ] `admin/dashboard.html` nav에 CITADEL 링크 추가
- [ ] dev 배포 후 실데이터 바인딩 확인 (GA4 세션, BQ 퍼널, 채널 상태)
- [ ] prod 배포 (`./deploy.sh prod`)
- [ ] `monkos.ai/admin/citadel.html` 접속 → 인증 → 데이터 렌더 확인

---

## 참조 파일

| 파일 | 용도 |
|------|------|
| `monkos-ops/tech/designs/2026-07/DESIGN_20260714_CITADEL_데이터수집스키마_대시보드초본.html` | 초본 원본 (복사 원천) |
| `monkos_AI/portal/public/admin/dashboard.html` | 기존 대시보드 (패턴 참조, 수정 최소) |
| `monkos_AI/portal/lib/cms/dashboard.js` | 기존 핸들러 (패턴 참조, 여기에 추가) |
| `monkos_AI/portal/lib/cms/admin-auth.js` | 인증 (requireAdmin 재사용) |
| `monkos_AI/portal/lib/tracking.js` | BQ 클라이언트 패턴 참조 |
| `monkos_AI/portal/public/admin/js/admin-common.js` | authFetch 등 공통 유틸 |
| `monkos-ops/ops/proposals/PROPOSAL_20260714_민아_CITADEL대시보드_v02구체화.md` | 민아 기안 (정정 3건, 바인딩 맵) |

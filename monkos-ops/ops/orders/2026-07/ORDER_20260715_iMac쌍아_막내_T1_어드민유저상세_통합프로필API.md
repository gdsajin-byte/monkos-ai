---
type: order
date: 2026-07-15
device: iMac
agent: 쌍아
recipient: 막내
portfolio: PF_PORTAL
subject: T1 — 어드민 유저 상세 페이지 + 통합 프로필 API + 대시보드 유입경로 보강
status: 발행
---

# T1 — 어드민 유저 상세 페이지 + 통합 프로필 API

**[2026-07-15 14:14 KST]** iMac/쌍아 → 막내

> 선행 완료: T0 generations 인덱스 (prod 00479, 329건 백필)
> 설계서: `monkos-ops/tech/designs/2026-07/DESIGN_20260715_유저프로필_통합데이터모델_대시보드재설계.md` §3~5
> 작가님 핵심 지시: "최근 가입한 사람이 어느 사이트에서 어떤 경로로 왔나, 로그인 가입 하는지, 무료만 보는지 한눈에"

---

## 목표

1. 유저 1명의 유입경로 → 내부 동선 → 생성 이력 → 결제 내역을 한 페이지에서 보는 **어드민 유저 상세 페이지** 신설
2. 기존 dashboard.html의 User 360° 테이블에 **유입경로 컬럼 추가** + 클릭 시 유저 상세 페이지로 이동 (사이드패널 대체)

---

## 작업 1: 통합 프로필 API `/api/admin/dashboard/user/:userId`

**파일**: `monkos_AI/portal/lib/cms/dashboard.js` + `monkos_AI/portal/server.js`

### 응답 스키마

```json
{
  "profile": {
    "id": "kakao_12345",
    "name": "홍길동",
    "email": "user@naver.com",
    "provider": "kakao",
    "picture": "https://...",
    "credits": 10,
    "createdAt": "2026-07-14T10:16:00Z",
    "lastLogin": "2026-07-14T10:16:00Z",
    "isTest": false
  },
  "acquisition": {
    "signupSource": "/specs/kr-passport",
    "referrer": "https://blog.naver.com/...",
    "landingUrl": "/specs/kr-passport",
    "firstVisit": "2026-07-14T10:10:00Z"
  },
  "funnelStage": 3,
  "funnelLabels": ["방문", "가입", "생성", "결제", "다운로드"],
  "stats": {
    "generateCount": 5,
    "totalPaid": 9900,
    "chargeCount": 1,
    "lastActivity": "2026-07-14T10:20:00Z"
  },
  "generations": [
    {
      "id": "gen_abc",
      "service": "idphoto",
      "style": "kr-passport-35x45",
      "slug": "kr-passport",
      "gcsOriginal": "idphoto/kakao_12345/2026-07-14T10-16-00_kr-passport_original.jpg",
      "gcsGenerated": "idphoto/kakao_12345/2026-07-14T10-16-00_kr-passport_generated.png",
      "status": "active",
      "createdAt": "2026-07-14T10:16:00Z",
      "originalUrl": "https://storage.googleapis.com/...(서명URL)...",
      "generatedUrl": "https://storage.googleapis.com/...(서명URL)..."
    }
  ],
  "transactions": [
    {
      "type": "charge",
      "amount": 10,
      "createdAt": "2026-07-14T10:16:00Z",
      "description": "가입 보너스",
      "provider": null
    }
  ],
  "timeline": [
    {
      "eventName": "page_view",
      "timestamp": "2026-07-14T10:10:00Z",
      "pagePath": "/specs/kr-passport",
      "referer": "https://blog.naver.com/..."
    }
  ]
}
```

### 구현 상세

**데이터 소스 4개 조인**:

1. **Firestore `users/{userId}`** → profile, acquisition
2. **Firestore `transactions`** → 최근 50건, where userId == 요청 userId
3. **Firestore `generations`** → 최근 50건, where userId == 요청 userId, orderBy createdAt desc. **각 건에 대해 GCS 서명 URL 생성** (1시간 만료):
   ```javascript
   const [signedUrl] = await bucket.file(gen.gcsOriginal).getSignedUrl({
     action: 'read', expires: Date.now() + 3600000
   });
   ```
4. **BQ `monkos_tracking.events`** → 최근 90일, where user_id = userId OR session_id IN (identity_map), orderBy event_timestamp desc, LIMIT 200. **파티션 필터 필수**:
   ```sql
   WHERE event_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
     AND (user_id = @userId OR session_id IN (
       SELECT session_id FROM `monkos.monkos_tracking.identity_map`
       WHERE user_id = @userId
     ))
   ORDER BY event_timestamp DESC LIMIT 200
   ```

**캐시**: 없음 (유저 상세는 최신 데이터가 중요).

**server.js 등록**:
```javascript
if (urlPath.startsWith('/api/admin/dashboard/user/') && req.method === 'GET') {
  const userId = decodeURIComponent(urlPath.split('/').pop());
  return handleDashboardUserDetail(req, res, userId);
}
```

---

## 작업 2: 어드민 유저 상세 페이지 `/admin/user.html`

**파일**: `monkos_AI/portal/public/admin/user.html` (신규)

### 레이아웃

기존 dashboard.html 스타일 체계 준수 (CSS 변수, 폰트, 카드 스타일 동일).

```
┌─────────────────────────────────────────────────────────────┐
│ ← Dashboard                     MONKOS ADMIN     CITADEL   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─[프로필 카드]──────────┐  ┌─[유입 경로]────────────────┐ │
│  │ 이름 / 이메일           │  │ referrer: blog.naver.com   │ │
│  │ 채널 뱃지 (카카오/구글)  │  │ 랜딩: /specs/kr-passport   │ │
│  │ 가입일 / 최근활동       │  │ 첫 방문: 2026-07-14 10:10  │ │
│  │ 크레딧 잔액: 10c        │  │ 가입 경로: specs 페이지     │ │
│  │ 총 결제: ₩9,900        │  │                            │ │
│  └────────────────────────┘  └────────────────────────────┘ │
│                                                             │
│  ┌─[퍼널 진행]──────────────────────────────────────────────┐│
│  │  ●──────●──────●──────○──────○                          ││
│  │  방문    가입    생성    결제    다운로드                   ││
│  └──────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─[생성 갤러리]────────────────────────────────────────────┐│
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                   ││
│  │  │ 원본 │ │ 결과 │ │ 원본 │ │ 결과 │  ...               ││
│  │  │      │ │      │ │      │ │      │                    ││
│  │  └──────┘ └──────┘ └──────┘ └──────┘                   ││
│  │  규격: kr-passport · 스타일: formal · 2026-07-14 10:16   ││
│  └──────────────────────────────────────────────────────────┘│
│                                                             │
│  ┌─[거래 내역]──────────────┐  ┌─[BQ 동선 타임라인]────────┐│
│  │ 07/14 충전 +10c 가입보너스│  │ 10:10 page_view /        ││
│  │ 07/14 사용 -1c 생성       │  │ 10:11 page_view /specs.. ││
│  │ ...                      │  │ 10:15 spec_select        ││
│  │                          │  │ 10:16 api_generate       ││
│  └──────────────────────────┘  └────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 데이터 바인딩

```javascript
const userId = new URLSearchParams(location.search).get('id');
const data = await authFetch(`/api/admin/dashboard/user/${encodeURIComponent(userId)}`);
// → profile, acquisition, funnelStage, stats, generations, transactions, timeline 바인딩
```

### 갤러리 이미지

generations 배열의 `originalUrl`, `generatedUrl` (서명 URL)을 `<img src>` 로 표시.
한 행에 원본-결과 페어로 배치. 서비스·스타일·생성일 라벨.

### 타임라인

BQ 이벤트를 시간순 리스트로 표시. 이벤트명·페이지·referrer.
`page_view`, `api_generate`, `credit_charge` 등 주요 이벤트는 색상/아이콘 구분.

---

## 작업 3: 기존 dashboard.html 보강

**파일**: `monkos_AI/portal/public/admin/dashboard.html`

### 3-1. User 360° 테이블에 유입경로 컬럼 추가

현행 컬럼: 유저 / 채널 / 가입(KST) / 퍼널 / 생성 / 결제 / 잔액 / 최근활동

추가: **유입경로** 컬럼 (signupSource 또는 acquisition.referrer에서 도메인 추출)

```
blog.naver.com | google.com | (직접) | m.search.naver.com | ...
```

### 3-2. 행 클릭 → 유저 상세 페이지로 이동

현행: 사이드패널(420px) 열림 → **변경**: `/admin/user.html?id={userId}` 로 이동

사이드패널 코드는 제거하지 말고 남겨둘 것 (폴백). 클릭 핸들러만 변경.

### 3-3. handleDashboardUsers360 보강

**파일**: `monkos_AI/portal/lib/cms/dashboard.js`

users360 응답에 `signupSource`, `referrer` 필드 추가 (users 문서에서 가져오기):

```javascript
// 기존 user 데이터에 추가
signupSource: u.signupSource || null,
referrer: u.acquisition?.referrer || null,
```

---

## ⚠️ 준수 조항

1. **기존 dashboard.html 최소 변경**: 유입경로 컬럼 추가 + 클릭 핸들러 변경만. 기존 KPI·차트·테이블 구조 일체 수정 금지.
2. **사이드패널 코드 보존**: 제거하지 말 것. 클릭 동작만 변경.
3. **GCS 서명 URL**: generations의 이미지 URL은 **조회 시점에 서명 생성** (1시간 만료). Firestore에 서명 URL 저장 금지.
4. **BQ 쿼리 파티션 필터 필수**: `WHERE event_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)` 반드시 포함.
5. **시크릿 비노출 (헌법 4조)**: 유저 상세에 SA 키·토큰 등 내부 정보 노출 금지.
6. **배포**: `./deploy.sh prod` 경유 필수.

---

## 산출물 체크리스트

- [ ] `dashboard.js` — `handleDashboardUserDetail` 함수 추가 (4소스 조인)
- [ ] `dashboard.js` — `handleDashboardUsers360` 보강 (signupSource, referrer 추가)
- [ ] `server.js` — `/api/admin/dashboard/user/:userId` 라우트 등록
- [ ] `admin/user.html` — 유저 상세 페이지 신규 생성
- [ ] `admin/dashboard.html` — 유입경로 컬럼 추가 + 클릭→유저상세 이동
- [ ] dev 배포 → 유저 클릭 → 상세 페이지 데이터 확인 (프로필·갤러리·타임라인)
- [ ] prod 배포

---

## 참조 파일

| 파일 | 용도 |
|------|------|
| `monkos_AI/portal/lib/cms/dashboard.js` | 기존 핸들러 확장 |
| `monkos_AI/portal/lib/gcs-save.js` | GCS 버킷·경로 참조 |
| `monkos_AI/portal/lib/tracking.js` | BQ 클라이언트 패턴 참조 |
| `monkos_AI/portal/public/admin/dashboard.html` | 기존 대시보드 보강 |
| `monkos_AI/portal/public/admin/js/admin-common.js` | authFetch 유틸 |
| `DESIGN_20260715_유저프로필_통합데이터모델_대시보드재설계.md` | 설계 정본 §3~5 |

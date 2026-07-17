---
type: order
date: 2026-07-17
device: iMac
agent: 쌍아
target: 막내
status: 대기
portfolio: PF_CITADEL
subject: 어드민 ID Photo Review 데이터소스 전환 + 상품 탭 분기
---

**[2026-07-17 12:36 KST]** iMac/쌍아 → 막내

# 어드민 ID Photo Review — 실시간 전환 + 상품 탭 분기

## 배경

어드민 ID Photo Review 페이지(`/admin/idphoto-review.html`)가 항상 같은 60건만 표시하고, 새 생성물이 반영되지 않는다. **근본 원인: 버킷이 다르다.**

- 리뷰 핸들러(`idphoto-review.js:15`)가 `GCS_BUCKET`(`monk-ai-images`) 읽음
- 실제 저장은 `CUSTOMER_GCS_BUCKET`(`monk-customer-photos`)으로 감
- → 리뷰 페이지에 새 데이터가 영원히 도달 불가

## ⚠️ 준수 조항

- 헌법 4조 1항: API 키·비밀정보 생성/추측 금지
- ch2 7조: 인프라 상수 정본 집중 — 버킷명은 환경변수 경유
- ch4 10조: Firestore 직접 접근 규칙 — 서비스 코드의 Firestore 접근은 적용 대상 아님 (10조 6항 예외)

## 목표

1. 데이터소스를 GCS 버킷 리스팅 → **Firestore `generations` 컬렉션**으로 전환
2. 상품 탭 분기: **KR** / **JP** / **Headshot** / **Specs** (또는 필터 조합)
3. 실시간 갱신 + 페이지네이션(더 보기)

## 변경 대상 (2파일)

### 1. `monkos_AI/portal/lib/cms/idphoto-review.js` — 백엔드 전면 교체

**현재 문제점:**
- L15: `const bucket = storage.bucket(GCS_BUCKET)` — 엉뚱한 버킷
- L37: `bucket.getFiles({ prefix, autoPaginate: true })` — 전체 파일 메모리 로드
- 상품 구분 없음, 페이지네이션 없음

**변경 방향:**

```
// 데이터소스: Firestore generations 컬렉션
// gcs-save.js가 생성 시마다 기록하며, 아래 필드 보유:
//   userId, service, style, slug, channel,
//   gcsOriginal, gcsGenerated, gcsT1Raw,
//   status, createdAt

const gensCol = firestore.collection('generations');

// 쿼리:
// ?service=kr|jp|headshot|all (기본 kr)
// ?after=ISO날짜 (cursor 페이지네이션)
// ?limit=40 (기본 40, 최대 200)
//
// service=kr → .where('service', '==', 'idphoto').where('channel', '==', 'monkos')
//              + GCS 경로에 /kr/ 포함으로 필터 (또는 channel 필드 활용)
// service=jp → .where('service', '==', 'idphoto') + JP 필터
// service=headshot → .where('service', '==', 'headshot')
// service=all → 필터 없음
//
// 정렬: .orderBy('createdAt', 'desc')
// 페이지네이션: .startAfter(afterTimestamp)
// 제한: .limit(limit)
```

**이미지 URL 생성:**
- `gcsOriginal`, `gcsGenerated` 경로로 `CUSTOMER_GCS_BUCKET`에서 Signed URL 발급
- `@google-cloud/storage` 유지, 버킷만 `CUSTOMER_GCS_BUCKET` 사용
- `CUSTOMER_GCS_BUCKET` 환경변수는 `gcs-save.js`와 동일하게 `process.env.CUSTOMER_GCS_BUCKET || 'monk-customer-photos'`

**응답 헤더:**
- `Cache-Control: no-store` 추가 (브라우저 캐시 방지)

**응답 포맷 (기존 호환 유지 + 확장):**
```json
{
  "service": "kr",
  "count": 40,
  "hasMore": true,
  "results": [{
    "userId": "...",
    "style": "passport",
    "slug": "kr-passport",
    "channel": "monkos",
    "created": "2026-07-17T...",
    "originalUrl": "signed...",
    "generatedUrl": "signed...",
    "hasT1": true,
    "complete": true
  }]
}
```

### 2. `monkos_AI/portal/public/admin/idphoto-review.html` — 프론트 탭 추가 + 더 보기

**탭 변경 (L93-96):**

```html
<div class="tabs" id="serviceTabs">
  <button class="tab active" data-service="kr">🇰🇷 KR</button>
  <button class="tab" data-service="jp">🇯🇵 JP</button>
  <button class="tab" data-service="headshot">📸 Headshot</button>
  <button class="tab" data-service="all">전체</button>
</div>
```

**페이지네이션:**
- 그리드 하단에 "더 보기" 버튼 추가
- 클릭 시 마지막 아이템의 `created` 값을 `?after=` 파라미터로 전달
- 새 결과를 기존 그리드에 append (교체 아님)
- `hasMore === false`면 버튼 숨김

**카드 정보 보강 (pair-body):**
- 기존: userId + timestamp
- 추가: style 또는 slug 표시 (어떤 규격 사진인지 식별)

**캐시 방지:**
- fetch URL에 `&_t=${Date.now()}` 추가

## 참고: 기존 데이터 소스 비교

| 항목 | GCS 리스팅 (현행) | Firestore generations (전환) |
|------|-------------------|---------------------------|
| 버킷 | `monk-ai-images` (❌ 오버킷) | — |
| 정렬 | 메모리 내 전체 정렬 | Firestore 인덱스 정렬 |
| 필터 | 경로 prefix만 | service/style/slug/channel |
| 페이지네이션 | 불가 (전체 로드) | cursor 기반 |
| 성능 | O(전체 파일 수) | O(limit) |
| 상품 구분 | 없음 | 가능 |

## `generations` 컬렉션 참조

`gcs-save.js:35-46`에 기록하는 구조:

```javascript
{
  userId,           // 사용자 ID (익명: anonymous_{sessionId})
  service,          // 'idphoto' | 'headshot'
  style,            // 'passport' | 'visa' | ... (규격명)
  slug,             // 'kr-passport' | null (specs 슬러그)
  channel,          // 'monkos' | 'idphoto-kr' | 'idphoto-jp'
  gcsOriginal,      // GCS 경로 (CUSTOMER_GCS_BUCKET 내)
  gcsGenerated,     // GCS 경로
  gcsT1Raw,         // T1 원본 | null
  status,           // 'active'
  createdAt         // ISO 문자열
}
```

**KR/JP 구분:** `channel` 필드 — `'idphoto-kr'` vs `'idphoto-jp'` vs `'monkos'`(포털 직접).
포털의 specs 경유 생성은 channel='monkos'이고, slug에 국가 정보가 있다.
idphoto-kr/jp 서비스의 생성은 각자 gcs-save.js에서 별도 기록 — 해당 서비스의 `gcs-save.js`가 `generations`에 기록하는지 확인 필요. 미기록 시 해당 서비스 건은 GCS 리스팅 폴백 또는 별도 대응.

## 확인 사항 (착수 전)

1. **idphoto-kr/jp의 gcs-save.js가 `generations` 컬렉션에 기록하는지 확인** — portal의 gcs-save.js만 기록하고 kr/jp는 안 할 수 있음. 미기록이면 그쪽도 기록 로직 추가 필요 (또는 GCS 리스팅 폴백 유지).
2. **Firestore 인덱스**: `generations` 컬렉션에 `createdAt DESC` 단독 인덱스 + `service + createdAt DESC` 복합 인덱스 필요. 이미 있는지 확인하고 없으면 `firestore.indexes.json`에 추가.

## 완료 조건

- [ ] `/api/admin/idphoto/results?service=kr` 호출 시 최신 생성물이 반환됨
- [ ] KR / JP / Headshot / 전체 탭 전환 시 해당 상품만 표시
- [ ] "더 보기" 클릭 시 추가 데이터 로드
- [ ] 새로고침 버튼 클릭 시 최신 데이터로 갱신 (캐시 아님)
- [ ] 기존 라이트박스 동작 유지
- [ ] dev 서버에서 실측 확인 후 보고

## 경로 충돌 체크

- server.js L990 `/api/admin/idphoto/results` — 기존 라우트 유지, 핸들러 내부만 교체
- 신규 라우트 추가 없음
- 타 에이전트 작업과 충돌 없음 (쌍아 사이트맵 작업은 커밋 완료)

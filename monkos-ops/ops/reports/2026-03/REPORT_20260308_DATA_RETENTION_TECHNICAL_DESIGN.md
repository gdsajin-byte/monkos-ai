---
type: report
date: 2026-03-08
from: 막내2
to: 쌍아
status: completed
---

# 챗봇·이미지 데이터 보관 정책 기술 구현 설계

**[2026-03-08] iMac/막내2 → iMac/쌍아**

---

## Phase A: 현행 데이터 흐름 분석

### A-1. 이미지 데이터 흐름 (현재)

```
[현행 이미지 파이프라인 — 서버 저장 없음]

클라이언트 (camera.js)
  │  media.capture() → data:image/jpeg;base64 (512×512px)
  ↓
서버 엔드포인트 (server.js / generate.js)
  │  POST /api/idgen  { image: base64, style, gender, age, ... }
  │  POST /api/precheck  { image: base64 }
  ↓
AI 엔진 (Gemini 3 Pro Image / Vertex AI Flash)
  │  inlineData → PNG Base64 응답
  ↓
서버 → 클라이언트 즉시 반환
  │  { image: "data:image/png;base64,..." }
  │  ★ 서버 메모리에서 즉시 해제, GCS/Firestore 저장 없음
  ↓
클라이언트 (result.js)
  │  store.generated = base64  (sessionStorage)
  │  media.crop() → 규격 크롭 (JPEG 0.92)
  ↓
다운로드 (사용자 디바이스)
  │  탭 종료 시 sessionStorage 자동 삭제
  └→ 데이터 소멸 — 재다운로드 불가
```

**핵심 특성**:
- **서버 저장 단계 완전 부재** — base64 인메모리 전달만
- 클라이언트 sessionStorage만 사용 (탭 닫기 시 소멸)
- GCS 업로드 코드: 없음 (`@google-cloud/storage` 미사용)
- 크레딧 차감: Firestore 트랜잭션으로 원자적 처리 (credits.js)

**크레딧 차감 구조**:

| 시점 | 크레딧 | Firestore 작업 |
|------|--------|---------------|
| 생성 직전 | -10 | `users/{userId}.credits` 트랜잭션 차감 |
| 생성 실패 시 | +10 환불 | `refundCredits()` 호출 |
| 다운로드 직전 | -70 | `users/{userId}.credits` 트랜잭션 차감 |
| 다운로드 실패 시 | 환불 없음 | ⚠️ 미구현 |

### A-2. 챗봇 대화 데이터 흐름 (현재)

```
[현행 챗봇 아키텍처 — 통합 엔진 chat-engine.js]

채널별 웹훅/API 수신
  ├─ Web: POST /api/chat { message, sessionId }
  ├─ Telegram: handleTelegramCSWebhook (callback_query / text)
  ├─ Kakao: POST /api/kakao/chatbot { userRequest }
  └─ Coaching/QC: POST /api/coaching, /api/qc (stateless)
  ↓
chatWithMonkos(channel, chatId, userMessage)
  ↓
인메모리 히스토리 조회 (Map)
  ├─ chatHistories (Web/Kakao): TTL 30분, 5분마다 정리
  └─ csHistories (Telegram): TTL 60분, 10분마다 정리
  ↓
Web 채널만: Firestore 히스토리 복원 (loadChatHistory)
  ↓
RAG 검색 (rag.js → cs_knowledge 컬렉션)
  ↓
Gemini 2.0 Flash API 호출
  ↓
응답 + 인메모리 저장 + 비동기 Firestore 로깅
```

### A-3. 채널별 데이터 저장 현황

| 채널 | 인메모리 TTL | Firestore 컬렉션 | 실제 저장 | TTL/삭제 | 문제 |
|------|------------|-----------------|----------|---------|------|
| **Web** | 30분 | `chat_conversations` | ✅ 작동 | ❌ 없음 | 영구 누적 |
| **Telegram** | 60분 | `cs_conversations` | ✅ 작동 | ❌ 없음 | 영구 누적 |
| **Kakao** | 30분 | `kakao_conversations` | ❌ 미구현 | — | **데이터 손실** |
| **Prep** | 30분 | `prep_conversations` | ❌ 미구현 | — | 미완성 |
| **idphoto-kr** | 30분 | `idphoto_kr_conversations` | ❌ 미구현 | — | 미완성 |
| **Coaching** | 없음 | — | ❌ (stateless) | — | 정상 (설계 의도) |
| **QC** | 없음 | `qc_results` | ❌ 미구현 | — | 품질 추적 불가 |

### A-4. Firestore 컬렉션 전수 맵

#### 대화 관련 (6개 — 실제 저장 2개)

| 컬렉션 | 용도 | 저장 상태 | TTL |
|--------|------|---------|-----|
| `chat_conversations` | Web 포털 챗봇 | ✅ 활성 | ❌ 없음 |
| `cs_conversations` | Telegram CS | ✅ 활성 | ❌ 없음 |
| `kakao_conversations` | 카카오톡 | ❌ 정의만 | — |
| `prep_conversations` | 촬영 안내 | ❌ 정의만 | — |
| `idphoto_kr_conversations` | idphoto-kr | ❌ 정의만 | — |
| `qc_results` | QC 판정 | ❌ 정의만 | — |

#### 사용자/인증 관련 (3개)

| 컬렉션 | 용도 | 주요 필드 | TTL |
|--------|------|---------|-----|
| `users` | 사용자 프로필 | credits, provider, events, snsConsentSigned | ❌ 없음 |
| `telegram_links` | Telegram↔userId 매핑 | chatId, userId, telegramId | ❌ 없음 |
| `telegramGateCodes` | 게이트/미션 코드 | userId, type, used, createdAt | ❌ 없음 (만료 코드 누적) |

#### 결제/거래 관련 (2개)

| 컬렉션 | 용도 | 주요 필드 | TTL |
|--------|------|---------|-----|
| `payments` | 결제 상세 (Lemon/Toss) | orderId, amount, paymentKey, creditsAdded | ❌ 없음 (회계 유지) |
| `transactions` | 크레딧 거래 원장 | userId, amount, type, balanceAfter | ❌ 없음 (거래 추적) |

#### 고객지원/운영 관련 (3개)

| 컬렉션 | 용도 | 주요 필드 | TTL |
|--------|------|---------|-----|
| `cs_knowledge` | RAG 지식베이스 | title, content, keywords, category | ❌ 없음 (수동 관리) |
| `cs_tickets` | 여권 반려 티켓 | reasons, status, compensated | ❌ 없음 |
| `team_reports` | 팀 보고서 | author, content, category | ❌ 없음 |

> **총 14개 활성 컬렉션, TTL 적용 0개.**

### A-5. Web 챗봇 저장 구조 상세

```javascript
// chat-engine.js — 문서 구조
{
  sessionId: "user123",            // OAuth userId
  channel: "web",
  messages: [
    { role: "user", text: "...", ts: "2026-03-08T12:00:00Z" },
    { role: "assistant", text: "...", ts: "2026-03-08T12:00:05Z" }
  ],                               // 최대 40개 자동 trim
  createdAt: "2026-03-08T12:00:00Z",
  updatedAt: "2026-03-08T12:05:00Z"
}
```

- 저장 시점: AI 응답 생성 직후 비동기 (`logChatConversation().catch(() => {})`)
- 복원: 동일 sessionId 재접속 시 Firestore에서 최근 20개 로드
- 에러 무시: 저장 실패해도 클라이언트 응답에 영향 없음

---

## Phase B: L1 기본 보관 기술 설계

### B-1. 이미지 비동기 저장 아키텍처

#### 목표 플로우

```
[L1 이미지 보관 — 비동기 저장 추가]

클라이언트 → 서버 → AI 엔진 → 결과 생성
                                    │
                    ┌───────────────┤
                    ↓               ↓
        클라이언트 즉시 응답    비동기 저장 (fire-and-forget)
        (속도 유지 ★)             │
                                  ↓
                        GCS 임시 저장
                        {userId}/{sessionId}_{timestamp}.webp
                        Object Lifecycle: 30일 후 자동 삭제
                                  │
                                  ↓
                        Firestore 메타 기록
                        image_sessions/{sessionId}
                        { userId, gcsPath, expiresAt, ... }
```

#### 저장소 비교

| 항목 | **GCS (권장)** | R2 (Cloudflare) |
|------|---------------|-----------------|
| TTL 네이티브 | ✅ Object Lifecycle (일 단위) | ❌ Workers 스케줄러 필요 |
| 비용 | $0.02/GB·월 | $0.015/GB·월 |
| 연동 난이도 | 낮음 (Cloud Run ↔ GCS 동일 프로젝트) | 중간 (Cross-platform) |
| 기존 인프라 | monk-ai-images 버킷 존재 | R2 미사용 |
| 자동 삭제 정밀도 | ±24시간 (일 단위) | ±분 (Workers 기반) |

**권장: GCS** — 동일 프로젝트 내 네이티브 연동 + Object Lifecycle TTL

#### GCS 키 구조

```
gs://monk-ai-images/sessions/
├── {userId}/
│   ├── {sessionId}_{timestamp}_original.webp    ← 원본 (촬영본)
│   ├── {sessionId}_{timestamp}_generated.webp   ← 생성 결과
│   └── {sessionId}_{timestamp}_cropped.webp     ← 크롭본 (다운로드용)
```

**Object Lifecycle 설정**:
```json
{
  "lifecycle": {
    "rule": [
      {
        "action": { "type": "Delete" },
        "condition": {
          "age": 30,
          "matchesPrefix": ["sessions/"]
        }
      }
    ]
  }
}
```

#### 저장 형식

| 항목 | 권장 | 근거 |
|------|------|------|
| 포맷 | WebP (q=85) | 원본 PNG 대비 ~60% 절감, 재다운로드 품질 충분 |
| 원본 보존 | 생성 결과만 저장 | 촬영 원본은 프라이버시 우선 미저장 |
| 크롭본 | 별도 저장 | 재다운로드 시 재크롭 불필요 |

#### 비동기 저장 구현 패턴

```
[서버 코드 흐름 — idphoto-kr/server.js 기준]

기존:
  const result = await generateImage(base64, prompt);
  res.json({ image: result });  ← 여기서 끝

L1 추가:
  const result = await generateImage(base64, prompt);
  res.json({ image: result });  ← 즉시 응답 (속도 불변)

  // fire-and-forget (응답 후 비동기 실행)
  saveToGCS(userId, sessionId, result).catch(err => {
    console.error('비동기 저장 실패:', err);
    // 실패해도 사용자 경험 무영향
  });
```

**실패 안전 보장**:
- `saveToGCS()` 실패 → 사용자 응답에 영향 없음
- 저장 실패 시: 로그만 기록, 재다운로드 불가 안내
- Cloud Run 인스턴스 종료 전 저장 완료: `res.json()` 후에도 Cloud Run은 요청 컨텍스트 내 비동기 작업 완료까지 대기

#### Firestore 메타데이터 컬렉션

```javascript
// 신규 컬렉션: image_sessions
{
  sessionId: "sess_abc123",
  userId: "user_xyz",
  gcsPath: "sessions/user_xyz/sess_abc123_20260308T120000_generated.webp",
  type: "generated",           // original | generated | cropped
  retentionLevel: "L1",       // L1 | L2
  createdAt: "2026-03-08T12:00:00Z",
  expiresAt: "2026-04-07T12:00:00Z",  // +30일
  downloaded: false,
  downloadCount: 0
}
```

### B-2. Firestore 대화 로그 TTL 구현

#### 방안 비교

| 방안 | 구현 난이도 | 정밀도 | 추가 인프라 | 비용 | 권장 |
|------|-----------|--------|-----------|------|------|
| **Firestore TTL 정책 (네이티브)** | 낮음 | ±24시간 | 없음 | 무료 | **✅ 권장** |
| Cloud Scheduler + Functions | 중간 | 정밀 | Scheduler + Function | 월 ~$1 | 대안 |
| 서버 시작 시 배치 삭제 | 낮음 | 부정확 | 없음 | 무료 | ❌ Cold start 의존 |

**Firestore 네이티브 TTL 권장 근거**:
- 코드 수정 최소 (TTL 필드 추가만)
- Google 관리형 자동 삭제 (인프라 추가 불필요)
- ±24시간 오차는 30일/90일 보관에 실질적 영향 없음
- 무료 (Firestore TTL은 추가 비용 없음)

#### TTL 필드 추가 설계

**기존 대화 문서에 `expireAt` 필드 추가**:

```javascript
// chat-engine.js — logChatConversation() 수정
{
  sessionId: "user123",
  channel: "web",
  messages: [...],
  retentionLevel: "L1",                    // ← 신규
  expireAt: Timestamp.fromDate(            // ← 신규: Firestore TTL 대상
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)  // L1: +30일
  ),
  createdAt: "...",
  updatedAt: "..."
}
```

**Firestore TTL 정책 활성화** (콘솔 또는 CLI):
```bash
gcloud firestore fields ttls update expireAt \
  --collection-group=chat_conversations \
  --project=monk-ai-project

gcloud firestore fields ttls update expireAt \
  --collection-group=cs_conversations \
  --project=monk-ai-project
```

#### 대상 컬렉션별 TTL 적용

| 컬렉션 | L1 (기본) | L2 (활용) | 비고 |
|--------|----------|----------|------|
| `chat_conversations` | 30일 | 90일 | Web 챗봇 |
| `cs_conversations` | 30일 | 90일 | Telegram CS |
| `kakao_conversations` | 30일 | 90일 | 저장 로직 먼저 구현 필요 |
| `prep_conversations` | 30일 | — | L2 대상 아님 |
| `idphoto_kr_conversations` | 30일 | 90일 | 저장 로직 먼저 구현 필요 |
| `qc_results` | 30일 | — | 품질 추적용 |

#### 기존 무기한 데이터 처리

| 방안 | 장점 | 단점 | 권장 |
|------|------|------|------|
| **일괄 TTL 부여** (30일 기준) | 점진적 삭제, 안전 | 1회 마이그레이션 | ✅ |
| 일괄 즉시 삭제 | 즉시 정리 | 데이터 손실 위험 | ❌ |
| 기존 유지 + 신규만 TTL | 안전 | 레거시 무한 잔존 | △ |

**권장**: 일괄 마이그레이션 스크립트로 기존 문서에 `expireAt = updatedAt + 30일` 부여.
단, 30일 이상 경과 문서는 `expireAt = now + 7일` (7일 유예 후 삭제).

### B-3. 재다운로드 API 설계

#### 엔드포인트

```
GET /api/download/{sessionId}
```

#### 인증 및 권한

```
Authorization: Bearer {sessionToken}
  ↓
verifySession(token) → userId 추출
  ↓
image_sessions 조회: sessionId + userId 일치 확인
  ↓
expiresAt 확인
  ├─ 유효: GCS Signed URL 생성 (1시간 유효) → 302 리다이렉트
  └─ 만료: 410 Gone { error: "보관 기간이 만료되었습니다" }
```

#### 응답 설계

| 상태 | HTTP | 응답 |
|------|------|------|
| 성공 | 302 | `Location: {GCS Signed URL}` |
| 만료 | 410 | `{ error: "보관 기간(30일)이 만료되었습니다", expiredAt: "..." }` |
| 미인증 | 401 | `{ error: "로그인이 필요합니다" }` |
| 미존재 | 404 | `{ error: "해당 세션을 찾을 수 없습니다" }` |
| 타인 접근 | 403 | `{ error: "접근 권한이 없습니다" }` |

#### GCS Signed URL 패턴

```javascript
const [signedUrl] = await bucket.file(gcsPath).getSignedUrl({
  version: 'v4',
  action: 'read',
  expires: Date.now() + 60 * 60 * 1000,  // 1시간
  responseDisposition: `attachment; filename="${filename}"`,
  responseType: 'image/webp'
});
```

#### 재다운로드 히스토리 페이지

```
GET /api/my/images → 내 보관 이미지 목록
```

```javascript
// 응답
{
  images: [
    {
      sessionId: "sess_abc123",
      thumbnail: "https://storage.googleapis.com/.../thumb_...",
      createdAt: "2026-03-08T12:00:00Z",
      expiresAt: "2026-04-07T12:00:00Z",
      daysLeft: 28,
      downloadCount: 1
    }
  ]
}
```

---

## Phase C: L2 활용 동의 기술 설계

### C-1. 동의 수집 및 저장

#### Firestore 동의 컬렉션

```javascript
// 신규 컬렉션: user_consents
{
  // docId: {userId}_{consentType}_{version}
  userId: "user_xyz",
  consentType: "L2_marketing",
  consentVersion: "1.0",             // 약관 버전 — 버전 변경 시 재동의 필요
  channel: "web" | "kakao" | "idphoto-kr" | "telegram",
  consentedAt: "2026-03-08T12:00:00Z",
  expiresAt: "2026-06-06T12:00:00Z", // +90일
  status: "active" | "withdrawn",
  withdrawnAt: null
}
```

#### 동의 수집 API

```
POST /api/consent
{
  userId: "user_xyz",
  consentType: "L2_marketing",
  channel: "web",
  version: "1.0"
}
→ 201 Created { consentId, expiresAt }
```

#### 동의 철회 API

```
DELETE /api/consent/{userId}/L2_marketing
→ 200 OK { status: "withdrawn", dataDeletedAt: "즉시" }

처리:
1. user_consents 문서: status = "withdrawn", withdrawnAt = now
2. image_sessions에서 L2 데이터 조회 → GCS 파일 즉시 삭제
3. 대화 로그: retentionLevel L2 → L1로 다운그레이드 (expireAt 30일로 단축)
```

### C-2. L2 데이터 격리

#### 물리적 분리 vs 논리적 분리

| 항목 | 물리적 분리 (별도 컬렉션) | **논리적 분리 (태그)** |
|------|------------------------|---------------------|
| 구현 복잡도 | 높음 (이중 저장 로직) | **낮음 (필드 추가)** |
| 조회 성능 | 높음 (컬렉션 전용 인덱스) | 보통 (where 필터) |
| 동의 철회 처리 | 컬렉션 문서 삭제 | 필드 업데이트 + TTL 단축 |
| 감사 추적 | 명확 | 충분 (retentionLevel 필드) |
| 마이그레이션 | 데이터 이동 필요 | **없음** |

**권장: 논리적 분리 (retentionLevel 태그)**
- `retentionLevel: "L1"` → 30일 TTL
- `retentionLevel: "L2"` → 90일 TTL, 마케팅 활용 가능
- 동의 철회 시: L2 → L1 다운그레이드 + expireAt 30일 재설정

#### 비식별 처리 방안

| 대상 | 비식별 방법 | 활용 형태 |
|------|-----------|----------|
| 이미지 (L2) | 생성 결과물만 보존 (원본 촬영본 미저장) | 갤러리/포트폴리오 소재 |
| 대화 로그 (L2) | userId 해시화 + 개인정보 마스킹 | RAG 코퍼스 |
| 메타데이터 | 통계 집계만 (개별 비노출) | 품질 개선 분석 |

**비식별 파이프라인**:
```
L2 동의 데이터
  ↓
주기적 배치 (7일마다)
  ↓
비식별 처리
  ├─ 이미지: 메타데이터 제거 (EXIF strip) + 파일명 해시화
  └─ 대화: userId → SHA256 해시 + 이름/연락처/이메일 마스킹
  ↓
비식별 저장소
  ├─ GCS: gs://monk-ai-images/deidentified/
  └─ Firestore: anonymized_conversations
  ↓
활용
  ├─ 마케팅 소재 (작가님 승인 후)
  └─ RAG 코퍼스 편입
```

### C-3. 챗봇 대화 L2 코퍼스화

#### 현행 RAG 구조 (rag.js)

```
cs_knowledge 컬렉션 (수동 seed)
  ↓
loadCsKnowledge() — 10분 캐시
  ↓
searchCsKnowledge(query)
  ├─ 키워드 매칭 (+10점)
  ├─ 제목 매칭 (+5점)
  └─ 본문 매칭 (+2점)
  ↓
상위 3개 → 시스템 프롬프트 주입
```

#### L2 코퍼스 편입 설계

```
L2 동의 대화 → 비식별 처리 → cs_knowledge 자동 추가

구체적 흐름:
1. 주기적 배치 (주 1회)
2. L2 + 30일 이상 축적된 대화에서 FAQ 패턴 추출
3. 비식별 + 요약 → cs_knowledge 문서 생성
   {
     id: "auto_faq_{hash}",
     title: "자동 추출 FAQ: {주제}",
     content: "{비식별 요약}",
     category: "auto_extracted",
     keywords: [...],
     source: "L2_conversations",
     extractedAt: ISO8601
   }
4. 기존 RAG 파이프라인 자동 흡수 (캐시 갱신 시)
```

**갱신 주기**: 주 1회 배치 → cs_knowledge에 자동 추가
**수동 검토**: `category: "auto_extracted"` 문서는 작가님 검토 후 `approved` 표시

---

## Phase D: 워터마크·해상도 차등 설계 (가능성 분석)

### D-1. 비즈니스 모델

| 단계 | 크레딧 | 제공물 | 구현 위치 |
|------|--------|--------|----------|
| **미리보기** (무료) | 0 | 워터마크 + 저해상도 (480px) | 서버 사이드 |
| **생성** | 10 | 고해상도 원본 (생성만, 미다운로드) | 현행 유지 |
| **다운로드** | 70 | 워터마크 없는 고해상도 (규격 크롭) | 현행 유지 |

### D-2. 워터마크 적용 방식 비교

| 방식 | 장점 | 단점 | 권장 |
|------|------|------|------|
| **서버 사이드 (Sharp)** | 안전 (클라이언트 우회 불가) | 서버 부하 | ✅ |
| 클라이언트 사이드 (Canvas) | 서버 부하 없음 | 우회 가능 (DevTools) | ❌ |

**서버 사이드 구현 개요**:

```
생성 완료 후 분기:
  ├─ 크레딧 미보유: 워터마크 + 리사이즈 (480px) → 미리보기 반환
  └─ 크레딧 보유: 원본 반환 (현행과 동일)

워터마크 처리:
  Sharp(buffer)
    .resize(480)
    .composite([{
      input: watermarkSvg,
      gravity: 'center',
      blend: 'over'
    }])
    .webp({ quality: 70 })
    .toBuffer()
```

### D-3. 현행 크레딧 시스템과의 정합성

| 현행 | 변경 시 | 영향 |
|------|--------|------|
| 생성 10 + 다운로드 70 = 80 | 미리보기 0 + 생성 10 + 다운로드 70 = 80 | 총액 불변 |
| 생성 시 크레딧 차감 | 미리보기는 무료 → 전환율 관찰 가능 | 마케팅 효과 |
| 생성 실패 환불 | 그대로 유지 | 변경 없음 |

> **결론**: 워터마크 미리보기는 기존 크레딧 구조와 충돌 없이 추가 가능.
> 구현 결정은 작가님이 별도 확정.

---

## Phase E: 프론트엔드 동의 UI 플로우

### E-1. 결과 화면 동의 UI 와이어프레임

```
┌─────────────────────────────────────────┐
│              생성 결과                    │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  │     [생성된 증명사진 이미지]       │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ ☐ 서비스 품질 개선을 위해 생성     │    │
│  │   결과를 90일간 활용하는 것에      │    │
│  │   동의합니다. (선택)               │    │
│  │   [상세 보기]                     │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │     📥 다운로드 (70 크레딧)       │    │
│  └─────────────────────────────────┘    │
│                                         │
│  💡 모든 결과물은 이용약관에 따라       │
│     30일간 보관 후 자동 삭제됩니다.     │
│                                         │
└─────────────────────────────────────────┘
```

**동작 흐름**:
1. 결과 이미지 표시
2. L2 동의 체크박스 (기본: 미체크)
3. "다운로드" 버튼 클릭
4. 체크 여부에 따라 retentionLevel 결정:
   - 미체크 → L1 (30일 보관, 이용약관 기반)
   - 체크 → L2 (90일 보관, 마케팅 활용)
5. 크레딧 차감 → 다운로드 → GCS 비동기 저장

### E-2. 챗봇 동의 안내

```
┌─────────────────────────────────────────┐
│  🤖 MONKOS 챗봇                         │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ 안녕하세요! MONKOS입니다.         │    │
│  │                                 │    │
│  │ 💬 대화 내용은 이용약관에 따라     │    │
│  │ 30일간 보관됩니다.               │    │
│  │                                 │    │
│  │ 서비스 개선을 위해 대화 내용을     │    │
│  │ 활용해도 될까요?                  │    │
│  │                                 │    │
│  │ [동의합니다]  [괜찮습니다]         │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌──────────────────────┐  [전송]      │
│  │ 메시지 입력...        │              │
│  └──────────────────────┘              │
└─────────────────────────────────────────┘
```

**동작 흐름**:
1. 첫 대화 시작 시 안내 메시지 자동 표시
2. "동의합니다" → L2 (90일 보관, 코퍼스 활용)
3. "괜찮습니다" → L1 (30일 보관, 기본)
4. 미응답 시 → L1 기본 적용
5. 동의 상태: `user_consents` 컬렉션에 기록
6. 이후 대화마다 `retentionLevel` 태그 자동 적용

### E-3. 마이페이지 동의 관리

```
┌─────────────────────────────────────────┐
│  ⚙️ 데이터 관리                          │
│                                         │
│  📋 현재 동의 상태                       │
│  ┌─────────────────────────────────┐    │
│  │ ✅ 서비스 이용 (필수)              │    │
│  │    30일 보관 후 자동 삭제          │    │
│  │                                 │    │
│  │ ☑️ 품질 개선 활용 (선택)           │    │
│  │    90일 보관 · 비식별 활용         │    │
│  │    [동의 철회]                    │    │
│  └─────────────────────────────────┘    │
│                                         │
│  📸 보관 중인 이미지 (2건)              │
│  ┌──────┐  ┌──────┐                    │
│  │ 📷   │  │ 📷   │                    │
│  │ 3/8  │  │ 3/5  │                    │
│  │ D-28 │  │ D-25 │                    │
│  │[재다운]│  │[재다운]│                   │
│  └──────┘  └──────┘                    │
│                                         │
│  [전체 데이터 삭제 요청]                  │
│                                         │
└─────────────────────────────────────────┘
```

---

## 종합 아키텍처 다이어그램

```
[전체 데이터 보관 아키텍처]

┌─────────────────────────────────────────────────────────┐
│                     프론트엔드                            │
│  camera.js → result.js → thankyou.html                  │
│  챗봇 UI → 동의 체크박스 → 마이페이지                      │
└─────────────────────┬───────────────────────────────────┘
                      │ Base64 JSON
                      ↓
┌─────────────────────────────────────────────────────────┐
│                    서버 (Cloud Run)                       │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ 이미지 생성    │  │ 챗봇 엔진    │  │ 동의 관리     │  │
│  │ server.js     │  │ chat-engine  │  │ consent API  │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                  │          │
│         │  fire-and-      │  비동기           │          │
│         │  forget         │  로깅            │          │
│         ↓                 ↓                  ↓          │
│  ┌──────────────────────────────────────────────────┐   │
│  │                  Firestore                        │   │
│  │  image_sessions    {channel}_conversations       │   │
│  │  user_consents     users / transactions          │   │
│  │  (TTL: expireAt)   (TTL: expireAt)              │   │
│  └──────────────────────────────────────────────────┘   │
│         │                                               │
│         ↓                                               │
│  ┌──────────────────────────────────────────────────┐   │
│  │             GCS (monk-ai-images)                  │   │
│  │  sessions/{userId}/  ← Object Lifecycle 30/90일   │   │
│  │  deidentified/       ← 비식별 소재 (영구)          │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 구현 로드맵

| 단계 | 작업 | 우선순위 | 영향 범위 | 비고 |
|------|------|----------|----------|------|
| **1** | Firestore TTL 활성화 (chat_conversations, cs_conversations) | P0 | 서버 | 현행 위반 즉시 해소 |
| **2** | 대화 저장 시 `expireAt` 필드 추가 | P0 | chat-engine.js | L1 30일 기본 |
| **3** | 기존 무기한 데이터 마이그레이션 (expireAt 일괄 부여) | P0 | 1회성 스크립트 | 레거시 정리 |
| **4** | GCS 비동기 이미지 저장 (sessions/) | P1 | server.js | Object Lifecycle 30일 |
| **5** | image_sessions 메타데이터 컬렉션 구축 | P1 | Firestore | 재다운로드 기반 |
| **6** | 재다운로드 API (`/api/download/{sessionId}`) | P1 | 신규 엔드포인트 | Signed URL 방식 |
| **7** | user_consents 컬렉션 + 동의 수집 API | P1 | Firestore + API | L2 기반 |
| **8** | 결과 화면 L2 동의 체크박스 UI | P2 | result.js | 프론트엔드 |
| **9** | 챗봇 첫 대화 동의 안내 | P2 | chat-engine.js | 웹/텔레그램 |
| **10** | Kakao 대화 저장 로직 구현 | P2 | kakao-chatbot.js | 현재 미구현 데이터 손실 해소 |
| **11** | 마이페이지 보관 이미지 목록 + 재다운로드 | P2 | 프론트엔드 | 사용자 경험 |
| **12** | 비식별 파이프라인 (주기적 배치) | P3 | 신규 스크립트 | L2 데이터 활용 |
| **13** | L2 코퍼스 자동 추출 → RAG 편입 | P3 | rag.js + 배치 | 주 1회 |
| **14** | 워터마크 미리보기 (선택적) | P3 | server.js | 작가님 별도 확정 |

---

## 발견된 기존 이슈

| 이슈 | 심각도 | 현황 | 권장 조치 |
|------|--------|------|----------|
| **Firestore 무한 증가** | 높음 | 대화 데이터 TTL 없음 | TTL 즉시 활성화 |
| **Kakao 데이터 손실** | 중간 | 저장 로직 미구현 (메모리 30분만) | 저장 함수 추가 |
| **다운로드 실패 환불 누락** | 중간 | 생성 실패만 환불 구현 | refund 로직 추가 |
| **telegramGateCodes 누적** | 낮음 | 사용 완료 코드 삭제 없음 | TTL 24시간 추가 |
| **qc_results 미저장** | 낮음 | 정의만, 저장 로직 없음 | 품질 추적 필요 시 구현 |

---

*본 보고서는 코드 수정 없이 현행 분석 및 설계만 수행한 것입니다. 실행은 작가님 검토 후 별도 지시서로 진행됩니다.*

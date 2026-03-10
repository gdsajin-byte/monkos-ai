---
type: order
date: 2026-03-10 13:49 KST
from: iMac/쌍아
to: 막내
status: 대기
tags: [P18, 이미지보관, GCS, Firestore, TTL, idphoto-kr]
agenda: "#18"
---

# 지시서: #18 이미지 보관 정책 구현 — KR (P0+P1)

> **[2026-03-10 13:49 KST] iMac/쌍아 → 막내**
> **목표**: idphoto-kr 유저 증명사진 GCS 비동기 저장 + Firestore 대화로그 TTL 적용
> **범위**: idphoto-kr만. JP는 KR 검증 후 별도 지시서.

---

## 배경

- 현행: AI 생성 이미지가 서버 메모리 즉시 해제, 클라이언트 sessionStorage만 의존 → 탭 닫으면 소멸
- 이용약관에 "보관" 문구가 있으나 실제 저장 없음 — 정책-코드 괴리
- 기존에 `monk-ai-images/generated/`에 저장하던 로직이 있었으나 현재 제거된 상태 (164장 잔존)
- Firestore 대화로그 TTL 미적용 — 14개 컬렉션 전부 무한 누적

## 기존 설계 참조

- `docs/infrastructure/reports/REPORT_20260308_DATA_RETENTION_TECHNICAL_DESIGN.md` — Phase A~E 전체 설계
- 본 지시서는 그 중 **P0 (Firestore TTL) + P1 (GCS 이미지 저장)** KR분만 실행

---

## Task 1: `@google-cloud/storage` 패키지 추가

**파일**: `monkos_AI/idphoto-kr/package.json`

```json
"@google-cloud/storage": "^7.0.0"
```

- `npm install` 실행하여 package-lock.json 갱신
- 동일 프로젝트(monkos) IAM 귀속이므로 별도 인증 불필요

---

## Task 2: GCS 비동기 이미지 저장 모듈 작성

**파일**: `monkos_AI/idphoto-kr/gcs-save.js` (신규)

### 요구사항

1. `monk-ai-images` 버킷 사용 (기존 버킷 유지)
2. 저장 경로: `service/idphoto/kr/{userId}/{timestamp}_generated.webp`
3. WebP 변환 불필요 — 현재 AI 응답이 PNG base64이므로 그대로 저장
4. fire-and-forget 패턴: 호출자가 await하지 않음
5. 실패 시 로그만 남기고 사용자 경험 무영향

### 함수 시그니처

```javascript
import { Storage } from '@google-cloud/storage';

const storage = new Storage();
const bucket = storage.bucket(process.env.GCS_BUCKET || 'monk-ai-images');

/**
 * AI 생성 이미지를 GCS에 비동기 저장
 * @param {string} userId - 사용자 ID
 * @param {string} base64Image - base64 인코딩 이미지 (data:image/png;base64,... 또는 raw base64)
 */
export async function saveGeneratedImage(userId, base64Image) {
  // 1. base64 → Buffer
  // 2. GCS 업로드: service/idphoto/kr/{userId}/{timestamp}_generated.png
  // 3. 로깅 (성공/실패)
}
```

### 주의사항

- `data:image/png;base64,` 접두어가 있을 수 있음 — strip 처리
- Cloud Run에서 `res.json()` 후에도 요청 컨텍스트 내 비동기 완료 대기함 — 정상 동작
- 환경변수 `GCS_BUCKET`은 deploy.sh에 이미 설정됨

---

## Task 3: server.js에 비동기 저장 호출 추가

**파일**: `monkos_AI/idphoto-kr/server.js`

### 수정 위치

AI 이미지 생성 응답 반환 직후 (res.json 호출 직후)

### 패턴

```javascript
import { saveGeneratedImage } from './gcs-save.js';

// 기존 코드 (수정 없음)
res.json({ image: result });

// 신규 추가 (fire-and-forget)
saveGeneratedImage(userId, result).catch(err => {
  log('GCS 비동기 저장 실패', 'WARNING', { error: err.message, userId });
});
```

### ⚠️ 준수 조항

- **기존 res.json() 로직 일절 수정 금지** — 추가만 허용
- userId 추출은 기존 인증 흐름에서 가져올 것 (Portal API 연동 확인)
- 생성 실패(크레딧 환불) 케이스에서는 저장하지 않을 것

---

## Task 4: Firestore 대화로그 TTL 필드 추가

**파일**: `monkos_AI/portal/lib/chat-engine.js`

### 수정 위치

대화 로그 저장 함수 (`logChatConversation` 또는 유사 함수)

### 추가 필드

```javascript
expireAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)  // 30일 후
```

- 기존 필드 수정 없음, `expireAt` 필드 추가만
- `chat_conversations`, `cs_conversations` 대상
- Firestore TTL 정책 활성화는 별도 (gcloud CLI — 작가님 또는 후속 지시서)

---

## Task 5: 검증

1. **로컬 테스트**: server.js 기동 → 이미지 생성 API 호출 → GCS 업로드 로그 확인
   - GCS 실제 저장은 Cloud Run 환경에서만 동작 (로컬은 ADC 설정 필요)
   - 로컬에서는 `saveGeneratedImage` 함수의 에러 핸들링(catch)이 정상 동작하는지만 확인
2. **기존 기능 무영향 확인**: 이미지 생성 → 응답 → 다운로드 플로우 정상 동작
3. **chat-engine.js**: expireAt 필드가 Firestore 문서에 정상 기록되는지 확인

---

## 수정 파일 목록

| 파일 | 변경 | 성격 |
|------|------|------|
| `monkos_AI/idphoto-kr/package.json` | `@google-cloud/storage` 추가 | 의존성 |
| `monkos_AI/idphoto-kr/gcs-save.js` | 신규 생성 | GCS 저장 모듈 |
| `monkos_AI/idphoto-kr/server.js` | fire-and-forget 호출 1줄 추가 | 최소 변경 |
| `monkos_AI/portal/lib/chat-engine.js` | `expireAt` 필드 추가 | 최소 변경 |

## 건드리면 안 되는 것

- result.js, thankyou.js 등 프론트엔드 일체
- 크레딧 차감/환불 로직 (credits.js)
- 기존 sessionStorage 흐름
- deploy.sh (GCS_BUCKET 이미 설정됨)
- .env 파일

---

## 완료 기준

- [ ] `@google-cloud/storage` 패키지 설치 완료
- [ ] `gcs-save.js` 모듈 작성 완료
- [ ] `server.js`에서 생성 성공 시 fire-and-forget 호출 추가
- [ ] `chat-engine.js`에 `expireAt` 필드 추가
- [ ] 기존 이미지 생성·응답·다운로드 플로우 무영향 확인
- [ ] 완료 보고

---

*헌법 제6조 준수: API 키·비밀번호 생성/추측 금지. 환경변수 참조만 허용.*
*헌법 제8조 준수: 파괴적 명령 금지.*

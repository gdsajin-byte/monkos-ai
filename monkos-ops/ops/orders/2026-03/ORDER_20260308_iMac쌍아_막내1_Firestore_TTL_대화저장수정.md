---
type: order
date: 2026-03-08
from: iMac/쌍아
to: 막내1
priority: P0
category: backend / data
---

# 지시서: Firestore TTL 활성화 + 대화 저장 누락 수정

**[2026-03-08 15:12 KST] iMac/쌍아 → 막내1**

## 확정 정책

| 등급 | 보관 기간 | 대상 |
|------|-----------|------|
| **L1 (기본)** | **90일** 자동삭제 | 모든 대화 로그 (전 채널 통일) |

> 거래 장부(payments, transactions)는 전자상거래법에 따라 별도 보관 — 본 지시 대상 아님.

## 작업 1: Firestore TTL 활성화 (P0)

### 1-1. chat-engine.js 수정

현재 대화 저장 시 `expireAt` 필드가 없음. 다음을 추가:

**`logChatConversation()` 수정** — 신규 문서 생성 시:
```javascript
expireAt: Timestamp.fromDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000))
```

**`logCsConversation()` 수정** — CS 대화도 동일 90일:
```javascript
expireAt: Timestamp.fromDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000))
```

기존 문서 업데이트 시에도 `expireAt` 갱신 (마지막 대화 기준 +90일).

### 1-2. Firestore TTL 정책 설정

```bash
gcloud firestore fields ttls update expireAt \
  --collection-group=chat_conversations \
  --project=monk-ai-project

gcloud firestore fields ttls update expireAt \
  --collection-group=cs_conversations \
  --project=monk-ai-project
```

⚠️ `--project` 값은 기존 설정에서 확인할 것. 추측 금지 (헌법 6조).

### 1-3. 기존 무기한 데이터 마이그레이션

1회성 스크립트로 기존 문서에 `expireAt` 부여:
- 전 컬렉션: `updatedAt + 90일`. 이미 90일 경과한 문서는 `now + 7일` (7일 유예)

## 작업 2: Kakao/idphoto-kr 대화 저장 로직 구현 (P0)

### 현황
- `chat-engine.js` L250-252: Web 채널만 `logChatConversation()` 호출
- Kakao, idphoto-kr, prep 채널은 **저장 함수 미호출** → 인메모리 30분 후 소멸

### 수정

`chatWithMonkos()` 함수의 비동기 로깅 부분 수정:

현재 (L249-252):
```javascript
if (channel === 'web') {
  logChatConversation(chatId, userMessage, text).catch(() => {});
}
```

변경: **stateful 채널 전체에 로깅 적용**
```javascript
if (!config.stateless && config.logCollection) {
  logChatConversation(chatId, userMessage, text, channel).catch(() => {});
}
```

`logChatConversation()`에 channel 파라미터 추가하여 컬렉션 분기:
- web → `chat_conversations`
- kakao → `kakao_conversations`
- idphoto-kr → `idphoto_kr_conversations`
- prep → `prep_conversations`
- telegram은 기존 `logCsConversation()` 유지 (별도 호출 구조)

각 컬렉션에도 `expireAt` 필드 포함 (90일 TTL).

## 작업 3: 다운로드 실패 환불 로직 (P1)

### 현황
- 생성 실패 → `refundCredits()` 호출 (+10 환불) ✅
- 다운로드 실패 → 환불 **미구현** ❌ (70크레딧 손실)

### 수정 대상
다운로드 크레딧 차감 후 실제 다운로드 전달 실패 시 +70 환불 로직 추가.
- 관련 코드: `credits.js` 또는 다운로드 처리 엔드포인트
- 패턴: 생성 실패 환불과 동일 (`refundCredits(userId, 70, 'download_failure')`)

## 작업 4: telegramGateCodes 정리 (P2)

### 현황
- 사용 완료(`used: true`) 코드가 삭제 없이 누적

### 수정
- TTL 24시간: 문서 생성 시 `expireAt: now + 24h` 추가
- Firestore TTL 정책 활성화:
```bash
gcloud firestore fields ttls update expireAt \
  --collection-group=telegramGateCodes \
  --project=monk-ai-project
```

## ⚠️ 준수 조항

- **헌법 제6조 (인프라 보호)**: project ID, API 키 기존 코드에서 확인. 추측 금지
- **헌법 제8조 (파괴적 명령 금지)**: 기존 데이터 즉시 삭제 금지. TTL로 점진 삭제만
- **헌법 제2조 (완료 보고 의무)**: 작업 완료 후 보고 형식 준수

## 산출물

- **코드 수정**: chat-engine.js, credits.js (또는 다운로드 처리 파일)
- **1회성 스크립트**: 기존 데이터 expireAt 마이그레이션
- **CLI 명령**: Firestore TTL 정책 설정 (실행 전 작가님 확인)
- 완료 후 커밋하지 말 것 → 보고 후 작가님 확인 → 커밋

## 보고 형식

```
✅ Firestore TTL 활성화 완료 (chat/cs/kakao/idphoto-kr/prep/gateCodes)
✅ 대화 저장 누락 수정 완료 (Kakao/idphoto-kr/prep)
✅ 다운로드 실패 환불 로직 추가
✅ telegramGateCodes TTL 추가
⏳ Firestore TTL CLI 명령 — 작가님 확인 대기
📁 수정 파일 목록
```

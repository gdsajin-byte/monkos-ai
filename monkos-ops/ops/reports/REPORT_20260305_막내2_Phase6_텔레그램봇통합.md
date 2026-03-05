---
type: REPORT
date: 2026-03-05
from: iMac/막내2
to: iMac/쌍아
ref: ORDER_20260305_막내2_Phase6_텔레그램봇통합_MiniApp
status: completed
---

# Phase 6 완료 보고 — 텔레그램 봇 통합 + Mini App

**[2026-03-05 19:13 KST] iMac/막내2 → iMac/쌍아**

## 1. 신규 파일 목록

| 파일 | 역할 |
|------|------|
| `portal/lib/tg-auth.js` | initData HMAC-SHA256 서버측 검증 모듈 |
| `portal/lib/tg-cs.js` | Mini App 전용 API (여권 반려 신고, 이미지 업로드) |
| `portal/public/tg/tg-common.js` | Mini App 공통 SDK (인증, 다국어, MainButton 래퍼) |
| `portal/public/tg/tg-style.css` | Mini App 공통 스타일 (MONKOS 디자인 시스템) |
| `portal/public/tg/sns-mission.html` | SNS 자랑 미션 (3단계: 동의서→업로드→100c) |
| `portal/public/tg/channel-join.html` | 채널가입 확인 (+40c, 택1) |
| `portal/public/tg/passport-issue.html` | 여권 반려 신고 (6가지 사유, 자동 100c 보상) |

## 2. 수정 파일 상세

| 파일 | 변경 |
|------|------|
| `portal/lib/shared/config.js` | `sendTelegramInlineKeyboard()`, `answerCallbackQuery()` 유틸 추가 |
| `portal/lib/telegram.js` | CS봇 확장: callback_query, 인라인 키보드 4장, GATE_/MISSION_ 흡수, 이미지 수신 흡수, 다국어 TG_I18N (ko/ja/en), language_code 프롬프트 힌트. 이벤트봇 /start에 CS봇 안내 추가 |
| `portal/lib/events.js` | 딥링크 URL `monkos_event_bot` → `monkos_support_bot`, EVENT_CREDITS에 `passport_rejection: 100` 추가 |
| `portal/server.js` | 3개 라우트 추가 + tg-auth.js, tg-cs.js import |

## 3. API 엔드포인트 맵

| 엔드포인트 | 핸들러 | 설명 |
|-----------|--------|------|
| `POST /api/tg/verify-init` | tg-auth.js `handleVerifyInit` | initData HMAC 검증 → userId 반환 |
| `POST /api/tg/passport-issue` | tg-cs.js `handlePassportIssue` | 여권 반려 신고 + 100c 자동 보상 + 팀봇 알림 |
| `POST /api/tg/upload-mission` | tg-cs.js `handleUploadMission` | Mini App 이미지 업로드 (봇 수신과 동일 결과) |

## 4. telegram.js 변경 상세

### CS봇 확장 (handleTelegramCSWebhook)
- **callback_query 처리**: `cs_chat` → answerCallbackQuery + 안내 메시지
- **/start (파라미터 없음)**: 인라인 키보드 카드 4장 (SNS미션 web_app, 채널가입 web_app, 반려신고 web_app, 일반문의 callback)
- **/start GATE_{code}**: 이벤트봇에서 복사 (TELEGRAM_CS_API 사용)
- **/start MISSION_{code}**: 이벤트봇에서 복사
- **이미지 수신**: 이벤트봇에서 복사 (동의서 확인 + 플래그 설정)
- **일반 텍스트**: language_code 기반 프롬프트 힌트 (systemPromptOverride)
- **다국어**: detectLanguage → TG_I18N[lang] 단일 언어 메시지 (이중언어 도배 제거)

### 이벤트봇 (handleTelegramEventWebhook)
- 코드 유지 (전환기 하위호환)
- /start 일반: CS봇 안내 "새로운 봇 @monkos_support_bot 에서 모든 서비스를 이용할 수 있습니다"
- 일반 텍스트: CS봇 안내로 전환

## 5. Mini App 페이지별 동작

### sns-mission.html
- STEP 1: 동의서 체크 → POST /api/consent/sns
- STEP 2: 파일 선택 → 1024px 리사이즈 → base64 → POST /api/tg/upload-mission
- STEP 3: POST /api/credits/mission-complete → +100c
- 완료된 단계: 비활성화 + 체크 표시

### channel-join.html
- 채널 열기: Telegram.WebApp.openTelegramLink
- 가입 확인: POST /api/credits/event (telegram_join) → getChatMember 검증 → +40c
- 택1 안내 표시

### passport-issue.html
- 6가지 사유 카드 (다중 선택)
- 상세 설명 textarea
- 제출: POST /api/tg/passport-issue → cs_tickets 생성 + 100c 보상 + 팀봇 알림

## 6. 다국어 처리 (ko/ja/en)

- **봇 메시지**: `detectLanguage(msg)` → `msg.from.language_code` 기반
- **Mini App UI**: URL `?lang=` + fallback `initDataUnsafe.user.language_code`
- **이중언어 도배 완전 제거**: 모든 메시지 단일 언어

## 7. Firestore 신규

### cs_tickets 컬렉션
```
{ userId, telegramId, telegramUsername, type: 'passport_issue',
  reasons: [], description, evidenceUrl, status: 'open',
  compensated: true, createdAt, updatedAt }
```

## 8. 헌법/법률 준수

- 헌법 4조: Mini App에 내부 운영 정보 미노출 (외부 표시명 "MONKOS AI")
- 헌법 6조: API 키/토큰 하드코딩 없음 (TELEGRAM_BOT_TOKEN 환경변수)
- 헌법 11조: 미출시/미확정 기능 미언급
- 이벤트봇 코드 삭제 없음 (전환기 하위호환 유지)

---

✅ Phase 6 전 항목 완료
📁 신규 7개 + 수정 4개 = 11개 파일

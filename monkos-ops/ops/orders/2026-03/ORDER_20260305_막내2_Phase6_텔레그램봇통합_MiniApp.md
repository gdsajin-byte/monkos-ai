---
type: ORDER
date: 2026-03-05
from: iMac/쌍아
to: 막내2 (CLI 배정)
subject: Phase 6 — 텔레그램 봇 통합 + Mini App 구현
priority: HIGH
scope: portal/lib/telegram.js, portal/lib/events.js, portal/lib/shared/config.js, portal/server.js, portal/lib/tg-auth.js(신규), portal/lib/tg-cs.js(신규), portal/public/tg/(신규)
---

# Phase 6: 텔레그램 봇 통합 + Mini App

## 맥락

현재 고객 대면 봇이 2개(CS봇, 이벤트봇)로 분산. 이벤트봇은 프론트 진입점 없이 사실상 사용 불가. **CS봇 1개로 통합 + 인라인 키보드 카드 분기 + Mini App(웹뷰)** 구조로 전환한다.

설계도: `.claude/plans/bubbly-moseying-porcupine.md` 참조.

---

## 아키텍처

```
/start → language_code 감지 (ko/ja/en)
         → 인라인 키보드 카드 4장
  ┌──────────────┬──────────────┬──────────────┬─────────────┐
  │📸 SNS 자랑   │🎫 채널가입    │🔄 반려 신고   │💬 일반문의   │
  │(web_app)     │(web_app)     │(web_app)     │(callback)   │
  │/tg/sns-      │/tg/channel-  │/tg/passport- │chatWithMonkos│
  │mission       │join          │issue         │('telegram') │
  └──────────────┴──────────────┴──────────────┴─────────────┘
```

---

## 작업 항목

### 1. 포털 도메인 확인 (선행)

현재 포털 URL이 monkos.ai인지 Cloud Run 자동생성 URL인지 확인. Mini App의 web_app URL 구성에 필요.
- `portal/lib/shared/config.js`에서 PORTAL_URL 확인
- 인라인 키보드의 web_app URL은 HTTPS면 별도 BotFather 등록 없이 작동

### 2. 서버사이드 — 신규 모듈

#### 2-1. tg-auth.js (신규)

initData HMAC-SHA256 서버측 검증 모듈:

```
POST /api/tg/verify-init
body: { initData: "Telegram.WebApp.initData 문자열" }

검증 절차:
1. initData 파싱 (URLSearchParams)
2. hash 추출, 나머지 알파벳순 정렬
3. HMAC-SHA256(key: HMAC-SHA256("WebAppData", BOT_TOKEN), data: sorted)
4. 계산값 === hash 비교
5. auth_date 5분 이내 확인
6. telegramId → telegram_links 컬렉션에서 userId 조회

응답: { linked, userId, telegramId, credits, consentSigned, missionBonusClaimed, channelJoined, ... }
미연동 시: { linked: false, telegramId }
```

TELEGRAM_BOT_TOKEN(CS봇)으로 검증.

#### 2-2. tg-cs.js (신규)

Mini App 전용 API 핸들러:

**POST /api/tg/passport-issue** — 여권 반려 신고
```
body: { initData, reasons: ['bg_invalid', ...], description, evidence(base64, 선택) }
→ initData 검증 → Firestore cs_tickets 생성 → 팀봇 알림 (POST /api/team/notify)
→ 자동 100c 보상 (passport_rejection eventType)
```

반려 사유 코드:
| 코드 | 한국어 | 일본어 | 영어 |
|------|--------|--------|------|
| bg_invalid | 배경 부적합 | 背景が不適切 | Invalid Background |
| face_blocked | 얼굴 가림 | 顔が隠れている | Face Blocked |
| spec_mismatch | 규격 불일치 | 規格不一致 | Spec Mismatch |
| low_quality | 화질 불량 | 画質不良 | Low Quality |
| shadow | 그림자 | 影がある | Shadow |
| other | 기타 | その他 | Other |

**POST /api/tg/upload-mission** — Mini App 이미지 업로드
```
body: { initData, image(base64) }
→ initData 검증 → missionImageReceived: true 플래그 설정
→ 기존 봇 이미지 수신과 동일 결과
```

### 3. 서버사이드 — 기존 모듈 수정

#### 3-1. telegram.js — CS봇 확장 (핵심)

handleTelegramCSWebhook 리팩터링:

1. **update.callback_query 처리 추가** (현재는 update.message만 처리)
   - `callback_data: 'cs_chat'` → answerCallbackQuery + 일반 문의 안내 메시지

2. **/start (파라미터 없음)** → 인라인 키보드 카드 4장 전송
   - language_code 감지 (`msg.from.language_code`)
   - web_app 버튼 3개 + callback 버튼 1개
   - URL에 `?lang=ko|ja|en` 쿼리 포함

3. **/start GATE_{code}** — 이벤트봇에서 흡수
   - 기존 이벤트봇 GATE_ 로직 복사 (TELEGRAM_CS_API 사용)

4. **/start MISSION_{code}** — 이벤트봇에서 흡수
   - 기존 이벤트봇 MISSION_ 로직 복사

5. **이미지 수신 (msg.photo)** — 이벤트봇에서 흡수
   - 기존 이벤트봇 이미지 수신 로직 복사
   - SNS 동의서 확인 + missionImageReceived 플래그

6. **일반 텍스트** → language_code 기반 프롬프트 힌트 추가
   - chatWithMonkos('telegram', chatId, text, { systemPromptOverride: CS_SYSTEM_PROMPT + langHint })

7. **다국어 메시지** — 이중언어 도배 제거
   - detectLanguage(msg) → 'ko'|'ja'|'en'
   - TG_I18N[lang] 구조체로 단일 언어 메시지

#### 3-2. events.js — 딥링크 URL 변경

- handleTelegramGateCode: `monkos_event_bot` → `monkos_support_bot`
- handleTelegramMissionCode: `monkos_event_bot` → `monkos_support_bot`
- EVENT_CREDITS에 `passport_rejection: 100` 추가

#### 3-3. config.js — 유틸 함수 추가

- `sendTelegramInlineKeyboard(chatId, text, keyboard, botApi)` — 인라인 키보드 전송
- `answerCallbackQuery(callbackQueryId, text, botApi)` — 콜백 쿼리 응답

#### 3-4. server.js — 라우트 추가

```
POST /api/tg/verify-init    → tg-auth.js handleVerifyInit
POST /api/tg/passport-issue → tg-cs.js handlePassportIssue
POST /api/tg/upload-mission → tg-cs.js handleUploadMission
```

### 4. 프론트엔드 — Mini App 페이지

`portal/public/tg/` 디렉토리 신규 생성.

#### 4-1. tg-common.js (공통 SDK)

```javascript
// Telegram WebApp SDK 초기화
Telegram.WebApp.ready();
Telegram.WebApp.expand();
// BackButton → close
// initData → /api/tg/verify-init 인증
// detectLang() → URL ?lang + initDataUnsafe.user.language_code
// setMainButton(text, onClick) → Telegram.WebApp.MainButton 래퍼
// window.MonkosTG = { tg, verifyUser, detectLang, setMainButton, ... }
```

텔레그램 외부에서 접근 시 "이 페이지는 텔레그램에서만 열 수 있습니다" 안내.

#### 4-2. tg-style.css (공통 스타일)

idphoto-kr app.css 패턴 기반:
- 배경: #030508
- 강조: #a78bfa / gradient → #7c3aed
- 카드: rgba 배경, #1e1e2e border, 16px radius
- 최대폭: 360px, 'Noto Sans KR' 폰트
- Telegram.WebApp.themeParams 고려

#### 4-3. sns-mission.html — SNS 자랑 미션

STEP 1: SNS 동의서 서명 (아코디언 + 체크박스 → POST /api/consent/sns)
STEP 2: 사진 업로드 (input file → 리사이즈 1024px → base64 → POST /api/tg/upload-mission)
STEP 3: "100c 받기" MainButton (POST /api/credits/mission-complete)

이미 완료된 단계는 비활성화/체크 표시.

#### 4-4. channel-join.html — 채널가입 확인

- 채널 링크 표시 (Telegram.WebApp.openTelegramLink)
- "가입 확인" MainButton → POST /api/credits/event (eventType: 'telegram_join')
- getChatMember 검증 후 +40c 또는 "아직 미확인" 안내
- 카카오/텔레그램 택1 안내

#### 4-5. passport-issue.html — 여권 반려 신고

- 반려 사유 카드 선택 (다중 가능, 6가지)
- 상세 설명 textarea (선택)
- 증빙 사진 첨부 (선택, input file)
- "제출하기" MainButton → POST /api/tg/passport-issue
- 제출 후 자동 100c 보상 + 접수 완료 안내

### 5. 이벤트봇 전환 처리

- handleTelegramEventWebhook **코드 유지** (전환기 하위호환)
- 이벤트봇 /start (파라미터 없음) 메시지에 CS봇 안내 추가: "새로운 봇 @monkos_support_bot에서 모든 서비스를 이용할 수 있습니다"
- 신규 딥링크는 CS봇으로 생성 (events.js 변경)
- 이벤트봇 deprecated 완료는 별도 지시

---

## 다국어 처리

봇 메시지 + Mini App UI 모두 language_code 기반 자동 분기:

```javascript
function detectLanguage(msg) {
  const lc = msg.from?.language_code || '';
  if (lc.startsWith('ko')) return 'ko';
  if (lc.startsWith('ja')) return 'ja';
  return 'en';
}
```

이중언어 도배 완전 제거. 단일 언어 메시지.

---

## Firestore 스키마 (신규)

### cs_tickets 컬렉션

```javascript
{
  userId, telegramId, telegramUsername,
  type: 'passport_issue',
  reasons: ['bg_invalid', ...],
  description: '...',
  evidenceUrl: null, // 향후 GCS 업로드 시
  status: 'open', // open → resolved → closed
  compensated: true, // 100c 자동 보상 완료
  createdAt, updatedAt,
}
```

---

## 정본 참조

| 파일 | 역할 |
|------|------|
| `portal/lib/telegram.js` L7-58 | CS봇 웹훅 (확장 대상) |
| `portal/lib/telegram.js` L61-240 | 이벤트봇 웹훅 (흡수 대상) |
| `portal/lib/events.js` L8-49, L191-371 | 딥링크 생성 + 이벤트 크레딧 |
| `portal/lib/shared/config.js` L34-40 | 텔레그램 환경변수 |
| `portal/lib/chat-engine.js` L113-167 | CHANNEL_CONFIG (telegram 채널) |
| `portal/server.js` L124-132 | 텔레그램 라우팅 |
| `idphoto-kr/public/app.css` | Mini App 디자인 기반 |
| `.claude/plans/bubbly-moseying-porcupine.md` | 전체 설계도 |

---

## 산출물

- 코드 수정 + 커밋 + push
- `monkos-ops/ops/reports/REPORT_20260305_막내2_Phase6_텔레그램봇통합.md`
  - 신규 파일 목록 + 각 파일 역할
  - API 엔드포인트 맵
  - telegram.js 변경 상세 (이벤트봇 흡수 범위)
  - Mini App 페이지별 동작 확인
  - 다국어 처리 확인 (ko/ja/en)

## ⚠️ 준수 조항
- **헌법 1조**: 타임스탬프 시스템 명령 취득
- **헌법 2조**: 완료 보고 형식 준수
- **헌법 4조**: 내부 기밀 보호 — Mini App 페이지에 내부 운영 정보 노출 금지
- **헌법 6조**: API 키/토큰 하드코딩 금지 — 환경변수 사용
- **헌법 11조**: "되는 것만 응답" — 미출시/미확정 기능 언급 금지
- **Phase 1~5 성과물을 깨뜨리지 마라** — 기존 CS봇 AI 대화, 팀봇, 이벤트 크레딧 API 보존
- **이벤트봇 코드 삭제 금지** — 전환기 하위호환을 위해 유지. deprecated 안내만 추가

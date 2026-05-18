---
type: order
date: 2026-03-13
from: iMac/쌍아
to: 막내
status: pending
---

# 지시서: LINE Messaging API 챗봇 웹훅 구현

## 배경
현재 고객 접점 채널 중 LINE만 봇이 없다.
- 카카오: `/api/kakao/chatbot` → `kakao-chatbot.js` (KR용)
- 텔레그램: `/api/webhook/telegram` → `telegram.js` (CS봇)
- LINE: 로그인만 존재, Messaging API 미구현

LINE Developer Console에서 "몬코스" Messaging API 채널이 이미 생성되어 있다.
- 채널 비밀: `024cf2da1f816eebbf954d0585ff9e1a`
- Channel access token (long-lived): 발급 완료
- Webhook URL: 미설정 (배포 후 작가님이 설정)

## 작업 내용

### 1. `portal/lib/shared/config.js` — 환경변수 추가

LINE Login 변수(L47-50) 아래에 LINE Messaging API 변수 추가:
```javascript
// LINE Messaging API (봇)
export const LINE_MESSAGING_CHANNEL_SECRET = process.env.LINE_MESSAGING_CHANNEL_SECRET || '';
export const LINE_MESSAGING_ACCESS_TOKEN = process.env.LINE_MESSAGING_ACCESS_TOKEN || '';
export const LINE_MESSAGING_API = 'https://api.line.me/v2/bot/message/reply';
```

### 2. `portal/lib/line-chatbot.js` — 신규 생성

카카오(`kakao-chatbot.js`) 패턴을 미러링한 LINE 웹훅 핸들러.

구현 요구사항:
- **웹훅 서명 검증**: `X-Line-Signature` 헤더로 HMAC-SHA256 검증 (channel secret 사용)
- **이벤트 파싱**: `body.events[]` 배열 순회, `event.type === 'message' && event.message.type === 'text'` 처리
- **세션 ID**: `line_${event.source.userId}`
- **채팅 엔진 호출**: `chatWithMonkos('line', sid, text)`
- **응답**: LINE Reply API (`POST https://api.line.me/v2/bot/message/reply`)로 `replyToken` 사용하여 응답
- **텍스트 제한**: 2,000자 (LINE 사양)
- **에러 처리**: 검증 실패 → 403, 처리 에러 → 200 (LINE은 200 아니면 재전송)
- **follow 이벤트**: `event.type === 'follow'` 시 환영 메시지 전송 (일본어)
- **로깅**: `[LineChat][${sid}]` 프리픽스

참고 — LINE Reply API 호출 형식:
```javascript
await fetch('https://api.line.me/v2/bot/message/reply', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${LINE_MESSAGING_ACCESS_TOKEN}`,
  },
  body: JSON.stringify({
    replyToken: event.replyToken,
    messages: [{ type: 'text', text: reply }],
  }),
});
```

서명 검증 방식:
```javascript
import { createHmac } from 'crypto';
const signature = createHmac('SHA256', LINE_MESSAGING_CHANNEL_SECRET)
  .update(rawBody)
  .digest('base64');
// req.headers['x-line-signature'] === signature 비교
```

### 3. `portal/lib/chat-engine.js` — `line` 채널 추가

#### (A) CHANNEL_COLLECTION_MAP에 추가 (L55-61 부근):
```javascript
line: 'line_conversations',
```

#### (B) CHANNEL_CONFIG에 추가 (L193 부근, idphoto-jp 다음):
```javascript
line: {
  systemPrompt: SYSTEM_PROMPT_JP,
  temperature: 0.7,
  maxOutputTokens: 300,
  historyMap: chatHistories,
  historyTTL: 30 * 60 * 1000,
  maxHistory: 20,
  logCollection: 'line_conversations',
},
```
- LINE = JP 사용자 접점 → `SYSTEM_PROMPT_JP` 사용

#### (C) 카카오 채널 이벤트 잔재 수정 (L167-175):
현재:
```javascript
kakao: {
  systemPrompt: SYSTEM_PROMPT_KR + '\n\n[카카오톡 채널 추가 안내]\n- 이 채널은 카카오톡입니다.\n- 카카오 채널 친구추가 보너스: 40크레딧 (텔레그램과 택1, 1회 한정)\n- 카카오 채널을 통해 이벤트·업데이트 소식을 받을 수 있습니다.',
```
→ 수정:
```javascript
kakao: {
  systemPrompt: SYSTEM_PROMPT_KR + '\n\n[카카오톡 채널 안내]\n- 이 채널은 카카오톡입니다.\n- 카카오 채널을 통해 업데이트 소식을 받을 수 있습니다.',
```
(폐지된 "친구추가 보너스 40크레딧" 제거)

### 4. `portal/server.js` — 라우트 등록

#### (A) import 추가 (L32 부근):
```javascript
import { handleLineWebhook } from './lib/line-chatbot.js';
```

#### (B) 라우트 추가 (L142 카카오 챗봇 아래):
```javascript
// === LINE 챗봇 ===
if (urlPath === '/api/webhook/line' && req.method === 'POST') return handleLineWebhook(req, res);
```

#### (C) 시작 로그 추가 (L203 LINE Login 로그 아래):
```javascript
log(`LINE Messaging: ${LINE_MESSAGING_ACCESS_TOKEN ? '설정됨' : '미설정'}`);
```

#### (D) config import에 LINE Messaging 변수 추가 (L14-21):
```javascript
LINE_MESSAGING_ACCESS_TOKEN,
```
(시작 로그에서 사용하므로)

### 5. `portal/deploy.sh` — 환경변수 배포 추가

L110의 `--update-env-vars`에 2개 추가:
```
LINE_MESSAGING_CHANNEL_SECRET=${LINE_MESSAGING_CHANNEL_SECRET},LINE_MESSAGING_ACCESS_TOKEN=${LINE_MESSAGING_ACCESS_TOKEN}
```

### 6. `.env` 파일 — 환경변수 추가

기존 LINE 로그인 변수 아래에 추가:
```
# LINE Messaging API (봇)
LINE_MESSAGING_CHANNEL_SECRET=024cf2da1f816eebbf954d0585ff9e1a
LINE_MESSAGING_ACCESS_TOKEN=47NVuu6e34i1RHM8MDazztJPgOJe7N6SYalt1aUasadYjsbAiwD1fMJFWYXT7DjTlm3Q0BbpF1NossNTjfSTyaaOHqAq/pW8q59SoNA2C8ZL3YuscuAg5E2RJUgiGbJnhraoOBaaoxUAfNUCq3Q+fQdB04t89/1O/w1cDnyilFU=
```

## ⚠️ 준수 조항
- 헌법 6조: `.env` 수정 — 본 지시서에 명시된 변수만 추가. 기존 값 변경 금지
- 헌법 8조: 파괴적 명령 금지
- 법률 2장: 기존 파일 구조 유지. `line-chatbot.js`는 `kakao-chatbot.js` 옆에 생성

## 배포 후 작가님 수동 작업 (코드 작업 범위 밖)
1. LINE Developer Console → "몬코스" → Messaging API → Webhook URL에 `https://monkos.ai/api/webhook/line` 입력
2. "자동 응답 메시지" 비활성화
3. Webhook 사용 활성화

## 완료 기준
- [ ] config.js — LINE Messaging 환경변수 3개 추가
- [ ] line-chatbot.js — 신규 생성 (서명 검증 + 메시지 처리 + Reply API)
- [ ] chat-engine.js — `line` 채널 config 추가 + 카카오 이벤트 잔재 수정
- [ ] server.js — import + 라우트 + 시작 로그 추가
- [ ] deploy.sh — 환경변수 2개 추가
- [ ] .env — 환경변수 2개 추가
- [ ] 커밋 (push는 작가님 승인 후)
- [ ] 완료 보고

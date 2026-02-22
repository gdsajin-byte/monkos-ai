# 지시서: MONK_TeamChat 봇 구현 + portal dev 배포

```
[2026-02-22 12:24 KST] iMac/쌍아 → 막내2
```

## 역할 선언

> **너는 "막내2"이다. 쌍아가 아니다.**
> - 완료 보고: `{디바이스}/막내2 → iMac/쌍아` 형식
> - **네 수정 범위**: `monkos_AI/portal/server.js` + `monkos_AI/portal/deploy.sh`

## 작전 개요

| 항목 | 내용 |
|------|------|
| **작전명** | MONK_TeamChat 봇 구현 + portal dev 배포 |
| **수정 파일** | `monkos_AI/portal/server.js`, `monkos_AI/portal/deploy.sh` (2개) |
| **배포 대상** | portal dev |
| **브랜치** | `develop` |
| **긴급도** | 높음 |

## ⚠️ 준수 조항

- **헌법 제6조**: API 키/시크릿 절대 생성/추측 금지. 토큰은 `process.env`에서만 참조
- **헌법 제8조**: 파괴적 명령 금지
- **법률 제5장**: prod 배포 금지 (dev만)
- **법률 제7장 4조**: server.js 수정 — 본 지시서가 에스컬레이션 대체

---

## 선행 조건

> **BotFather 토큰**: 작가님이 별도로 생성하여 `.env`에 `TELEGRAM_TEAM_BOT_TOKEN=xxx` 추가 예정.
> **토큰 없어도 코드 작성 + 배포 가능** — 토큰 미설정 시 gracefully skip 되도록 구현할 것.

---

## 설계 명세 (쌍아 작성 — 그대로 따를 것)

### 아키텍처

MONK_TeamChat 봇(@monkos_team_bot)을 기존 portal/server.js에 통합한다.
기존 support_bot, event_bot과 동일한 패턴을 따른다.

```
MONK_TeamChat 그룹 (작가님 + 한송이 + 꾸)
    │ 메시지/명령
    ▼
Telegram → Cloud Run portal (/api/webhook/telegram-team)
    │
    ▼
handleTeamBotMessage()
    ├── /report [내용]  → Firestore team_reports 저장 + 확인 응답
    ├── /status         → 서비스 상태 요약 응답
    ├── /help           → 명령어 목록 응답
    └── 일반 메시지     → 무시 (그룹 잡담은 봇이 간섭 안 함)

에이전트 → POST /api/team/notify → 그룹에 알림 전송
```

### 기능 상세

#### 1. `/report [내용]` — 보고서 제출
```
사용: /report X 알고리즘 운영가이드 완성. 게시 주기, 최적 시간대, 해시태그 전략 정리.
응답: ✅ 보고서 접수 — 한송이 (2026-02-22 12:30)
저장: Firestore team_reports/{auto_id}
```

Firestore 문서 구조:
```json
{
  "author": "한송이",
  "authorUsername": "hansong",
  "chatId": 123456,
  "content": "X 알고리즘 운영가이드 완성...",
  "timestamp": "2026-02-22T03:30:00Z",
  "category": "auto"
}
```

#### 2. `/status` — 서비스 상태
```
응답:
📊 MONKOS 서비스 상태
━━━━━━━━━━━━━━
🟢 portal: 정상
🟢 idphoto-kr: 정상
🟢 idphoto-jp: 정상
━━━━━━━━━━━━━━
최근 보고서: 2건 (오늘)
```

상태 확인 방법: 각 서비스 `/health` 엔드포인트 fetch.
```
https://monkos-portal-4jeplpqpua-uc.a.run.app/health
https://monkos-idphoto-kr-4jeplpqpua-uc.a.run.app/health
https://monkos-idphoto-jp-4jeplpqpua-uc.a.run.app/health
```

#### 3. `/help` — 명령어 목록
```
응답:
🤖 MONK TeamChat 봇
━━━━━━━━━━━━━━
/report [내용] — 보고서 제출
/status — 서비스 상태 확인
/help — 이 도움말
```

#### 4. 일반 메시지 — 무시
그룹 채팅에서 명령어 없는 일반 메시지는 **무시**한다 (응답 안 함).
봇이 그룹 대화에 간섭하면 안 된다.

#### 5. `POST /api/team/notify` — 에이전트 알림 API
에이전트(막내/쌍아 등)가 그룹에 알림을 보내는 내부 API.

```
POST /api/team/notify
Content-Type: application/json

{
  "message": "✅ idphoto-kr dev 배포 완료 — healthy 확인",
  "sender": "막내1"
}
```

**보안**: 이 API는 내부 전용. `X-Team-Secret` 헤더로 간단히 보호.
시크릿 값: `process.env.TEAM_NOTIFY_SECRET || 'monkos-internal'` (dev용 기본값 허용).

**그룹 chatId**: `process.env.TEAM_CHAT_ID || ''` — 그룹 생성 후 설정.
chatId 미설정 시 로그만 남기고 skip.

---

## 작업 내역

### TASK 1: server.js 상단 — 상수 추가 (기존 패턴 따라)

기존 코드 (38~41줄 부근):
```js
// === Telegram CS Bot (@monkos_support_bot) ===
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
// === Telegram Event Bot (@monkos_event_bot) ===
const TELEGRAM_EVENT_BOT_TOKEN = process.env.TELEGRAM_EVENT_BOT_TOKEN || '';
```

아래에 추가:
```js
// === Telegram Team Bot (@monkos_team_bot) ===
const TELEGRAM_TEAM_BOT_TOKEN = process.env.TELEGRAM_TEAM_BOT_TOKEN || '';
const TEAM_CHAT_ID = process.env.TEAM_CHAT_ID || '';
const TEAM_NOTIFY_SECRET = process.env.TEAM_NOTIFY_SECRET || 'monkos-internal';
```

기존 API 상수 (303~304줄 부근):
```js
const TELEGRAM_CS_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
const TELEGRAM_EVENT_API = `https://api.telegram.org/bot${TELEGRAM_EVENT_BOT_TOKEN}`;
```

아래에 추가:
```js
const TELEGRAM_TEAM_API = `https://api.telegram.org/bot${TELEGRAM_TEAM_BOT_TOKEN}`;
```

### TASK 2: server.js — 팀봇 웹훅 핸들러 추가

기존 CS Bot 웹훅(1950줄) **앞에** 삽입 (이벤트봇 return 뒤, CS봇 앞):

```js
  // === Telegram Team Bot 웹훅 (@monkos_team_bot) — 팀 협업 전용 ===
  if (req.url === '/api/webhook/telegram-team' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const update = JSON.parse(body);
        const msg = update.message;
        if (!msg || !msg.text) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
          return;
        }

        const chatId = msg.chat.id;
        const username = msg.from?.username || msg.from?.first_name || '알수없음';
        const displayName = msg.from?.first_name || username;
        const text = msg.text.trim();

        // /report — 보고서 제출
        if (text.startsWith('/report')) {
          const content = text.replace(/^\/report\s*/, '').trim();
          if (!content) {
            await sendTelegramMessage(chatId, '사용법: /report [보고 내용]', TELEGRAM_TEAM_API);
          } else {
            await firestore.collection('team_reports').add({
              author: displayName,
              authorUsername: username,
              chatId,
              content,
              timestamp: new Date().toISOString(),
              category: 'auto'
            });
            const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
            await sendTelegramMessage(chatId, `✅ 보고서 접수 — ${displayName} (${now})`, TELEGRAM_TEAM_API);
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
          return;
        }

        // /status — 서비스 상태
        if (text === '/status') {
          let statusMsg = '📊 MONKOS 서비스 상태\n━━━━━━━━━━━━━━\n';
          const services = [
            { name: 'portal', url: 'https://monkos-portal-4jeplpqpua-uc.a.run.app/health' },
            { name: 'idphoto-kr', url: 'https://monkos-idphoto-kr-4jeplpqpua-uc.a.run.app/health' },
            { name: 'idphoto-jp', url: 'https://monkos-idphoto-jp-4jeplpqpua-uc.a.run.app/health' }
          ];
          for (const svc of services) {
            try {
              const r = await fetch(svc.url, { signal: AbortSignal.timeout(5000) });
              const ok = r.ok;
              statusMsg += `${ok ? '🟢' : '🔴'} ${svc.name}: ${ok ? '정상' : '이상'}\n`;
            } catch {
              statusMsg += `🔴 ${svc.name}: 응답없음\n`;
            }
          }
          // 오늘 보고서 수
          try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const snap = await firestore.collection('team_reports')
              .where('timestamp', '>=', today.toISOString())
              .get();
            statusMsg += `━━━━━━━━━━━━━━\n최근 보고서: ${snap.size}건 (오늘)`;
          } catch {
            statusMsg += '━━━━━━━━━━━━━━';
          }
          await sendTelegramMessage(chatId, statusMsg, TELEGRAM_TEAM_API);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
          return;
        }

        // /help — 도움말
        if (text === '/help' || text === '/start') {
          const helpMsg = '🤖 MONK TeamChat 봇\n━━━━━━━━━━━━━━\n/report [내용] — 보고서 제출\n/status — 서비스 상태 확인\n/help — 이 도움말';
          await sendTelegramMessage(chatId, helpMsg, TELEGRAM_TEAM_API);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
          return;
        }

        // 일반 메시지 — 그룹 대화 간섭 안 함 (무시)
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        log(`[TG-TEAM] 웹훅 에러: ${err.message}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      }
    });
    return;
  }
```

### TASK 3: server.js — 팀 알림 API 추가

CS봇 웹훅 뒤, 토스 결제 앞에 삽입:

```js
  // === Team 알림 API — 에이전트 → 그룹 알림 ===
  if (req.url === '/api/team/notify' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        // 간단 인증
        const secret = req.headers['x-team-secret'] || '';
        if (secret !== TEAM_NOTIFY_SECRET) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Forbidden' }));
          return;
        }

        const { message, sender } = JSON.parse(body);
        if (!message) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'message required' }));
          return;
        }

        if (!TEAM_CHAT_ID) {
          log(`[TG-TEAM] 알림 스킵 (TEAM_CHAT_ID 미설정): ${message}`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, skipped: true }));
          return;
        }

        const formatted = sender ? `[${sender}] ${message}` : message;
        await sendTelegramMessage(TEAM_CHAT_ID, formatted, TELEGRAM_TEAM_API);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        log(`[TG-TEAM] 알림 에러: ${err.message}`);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }
```

### TASK 4: server.js — 서버 시작 로그 추가

기존 로그 (2106~2107줄 부근):
```js
  log('  POST /api/webhook/telegram       — Telegram CS봇');
  log('  POST /api/webhook/telegram-event — Telegram 이벤트봇');
```

아래에 추가:
```js
  log('  POST /api/webhook/telegram-team  — Telegram 팀봇');
  log('  POST /api/team/notify            — 팀 그룹 알림 API');
```

기존 로그 (2112~2113줄 부근):
```js
  log(`Telegram CS Bot: ${TELEGRAM_BOT_TOKEN ? '설정됨' : '미설정'}`);
  log(`Telegram Event Bot: ${TELEGRAM_EVENT_BOT_TOKEN ? '설정됨' : '미설정'}`);
```

아래에 추가:
```js
  log(`Telegram Team Bot: ${TELEGRAM_TEAM_BOT_TOKEN ? '설정됨' : '미설정'}`);
  log(`Team Chat ID: ${TEAM_CHAT_ID ? '설정됨' : '미설정'}`);
```

### TASK 5: deploy.sh — 환경변수 추가

`monkos_AI/portal/deploy.sh` 110줄의 `--update-env-vars` 끝에 추가:

기존:
```
...,TX_API_KEY=${TX_API_KEY},TX_API_URL=${TX_API_URL}"
```

변경:
```
...,TX_API_KEY=${TX_API_KEY},TX_API_URL=${TX_API_URL},TELEGRAM_TEAM_BOT_TOKEN=${TELEGRAM_TEAM_BOT_TOKEN},TEAM_CHAT_ID=${TEAM_CHAT_ID},TEAM_NOTIFY_SECRET=${TEAM_NOTIFY_SECRET}"
```

### TASK 6: portal dev 배포

```bash
cd monkos_AI/portal
./deploy.sh dev
```

### TASK 7: 헬스체크 확인

```bash
curl -s https://monkos-portal-dev-4jeplpqpua-uc.a.run.app/health | python3 -m json.tool
```

`status: "healthy"` 확인.

---

## 금지 사항

- `prod` 배포 금지 (`./deploy.sh prod` 실행 금지)
- `.env` 수정 금지 (작가님 영역)
- API 키/토큰 하드코딩 금지 (`process.env`에서만 참조)
- `idphoto-kr/` 하위 파일 수정 금지 (막내1 영역)

---

## 마무리 절차 (필수)

| 순서 | 절차 | 필수 여부 |
|------|------|----------|
| 1 | server.js 수정 (TASK 1~4) | **필수** |
| 2 | deploy.sh 수정 (TASK 5) | **필수** |
| 3 | `develop` 커밋 + push | **필수** |
| 4 | portal dev 배포 (TASK 6) | **필수** |
| 5 | 헬스체크 확인 (TASK 7) | **필수** |
| 6 | 완료 보고 발신 (헌법 제2조 형식) | **필수** |

### 커밋 메시지 형식

```
[feat] MONK_TeamChat 봇 추가 — portal/server.js 팀 협업 봇 통합

- /report: 보고서 Firestore 저장
- /status: 서비스 상태 조회
- /api/team/notify: 에이전트 알림 API
지시서: TASK_20260222_막내2_teamchat_bot.md
```

---

## 완료 조건

1. server.js에 팀봇 웹훅 핸들러 동작
2. server.js에 `/api/team/notify` API 동작
3. deploy.sh에 환경변수 3개 추가
4. portal dev 헬스체크 `healthy`
5. develop 커밋 + push 완료
6. 완료 보고 발신

---

## 참고: 웹훅 등록 (봇 토큰 생성 후 — 작가님 실행)

```bash
# BotFather에서 @monkos_team_bot 생성 후:
curl "https://api.telegram.org/bot{TOKEN}/setWebhook?url=https://monkos-portal-4jeplpqpua-uc.a.run.app/api/webhook/telegram-team"
```

이 단계는 막내 영역이 아님. 작가님/쌍아가 토큰 생성 후 별도 실행.

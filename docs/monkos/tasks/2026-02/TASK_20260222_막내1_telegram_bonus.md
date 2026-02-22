# 지시서: 설문 이벤트 폐지 → 텔레그램 보너스 30c 전환

```
[2026-02-22 14:12 KST] iMac/쌍아 → 막내1
```

## 역할 선언

> **너는 "막내1"이다. 쌍아가 아니다.**
> - 완료 보고: `{디바이스}/막내1 → iMac/쌍아` 형식
> - **네 수정 범위**: server.js (설문 API 교체 + support_bot 딥링크), index.html (이벤트 카드 + 모달 + i18n + JS), seed 파일 2개

## 작전 개요

| 항목 | 내용 |
|------|------|
| **작전명** | 설문 이벤트 폐지 → 텔레그램 보너스 30c 전환 |
| **수정 파일** | `monkos_AI/portal/server.js`, `monkos_AI/portal/public/index.html`, `seed_cs_knowledge.js`, `seed_cs_brand_story.js` (4개) |
| **배포 대상** | portal dev + Firestore seed 재실행 |
| **브랜치** | `develop` |
| **긴급도** | 보통 — 기능 교체 |

## ⚠️ 준수 조항

- **헌법 제6조**: API 키/시크릿 절대 생성/추측 금지
- **헌법 제8조**: 파괴적 명령 금지
- **헌법 제10조**: 프록시 금지 — 깔끔하게 교체할 것 (설문 코드 찌꺼기 남기지 말 것)
- **헌법 제11조**: RAG/챗봇 — 미출시·미확정 표현 금지
- **법률 제5장**: prod 배포 금지 (dev만)

---

## 설계: 텔레그램 보너스 딥링크 플로우

```
[유저 LP 로그인 상태]
  ↓
이벤트 카드: "텔레그램 친구 추가하고 30크레딧 받기!"
  ↓ 클릭
fetch GET /api/telegram-bonus/generate?userId=xxx
  → 서버: 8자리 랜덤 코드 생성, Firestore telegram_bonus_codes/{code} 저장
  → 응답: { code, deepLink: "https://t.me/monkos_support_bot?start=bonus_XXXXXXXX" }
  ↓
LP에서 자동으로 deepLink 열기 (window.open)
  + "텔레그램에서 대화 시작 후 돌아오세요" 안내 표시
  + 5초 간격 폴링 시작 (GET /api/telegram-bonus/status?userId=xxx)
  ↓
[텔레그램에서]
유저가 "대화 시작" → /start bonus_XXXXXXXX 자동 전송
  ↓
support_bot 웹훅 수신 → bonus_ 접두어 감지
  → Firestore에서 코드 조회 → userId 확인 → 30c 지급 + claimed 마킹
  → 텔레그램 응답: "✅ 30크레딧이 지급되었습니다! MONKOS 사이트로 돌아가세요."
  ↓
LP 폴링이 claimed=true 감지 → 이벤트 카드 "완료!" 표시 + 크레딧 갱신
```

---

## 작업 내역

### TASK 1: server.js — 설문 API 제거 + 텔레그램 보너스 API 추가

**삭제 범위** (L1235~L1359): `// === 설문 이벤트` 블록 전체
- `SURVEY_DAILY_LIMIT`, `SURVEY_BONUS` 상수
- `getSurveyDateKey()` 함수
- `GET /api/survey/status` 핸들러
- `POST /api/survey` 핸들러

**추가** (같은 위치에):

```js
  // === 텔레그램 보너스: support_bot 친추 30c 지급 ===
  const TELEGRAM_BONUS = 30;

  // 보너스 코드 생성
  if (req.url?.startsWith('/api/telegram-bonus/generate') && req.method === 'GET') {
    try {
      const urlParams = new URL(req.url, `http://${req.headers.host}`);
      const userId = urlParams.searchParams.get('userId');
      if (!userId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'userId 필수' }));
        return;
      }

      // 이미 보너스 받았는지 체크
      const userDoc = await usersCollection.doc(userId).get();
      if (!userDoc.exists) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '사용자 없음' }));
        return;
      }
      if (userDoc.data()?.telegramBonusClaimed) {
        res.writeHead(409, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '이미 수령함', alreadyClaimed: true }));
        return;
      }

      // 8자리 랜덤 코드 생성
      const code = randomBytes(4).toString('hex').toUpperCase();
      await firestore.collection('telegram_bonus_codes').doc(code).set({
        userId,
        createdAt: new Date().toISOString(),
        claimed: false,
      });

      const deepLink = `https://t.me/monkos_support_bot?start=bonus_${code}`;
      log(`[TG-Bonus] 코드 생성: ${userId} → ${code}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ code, deepLink }));
    } catch (err) {
      log(`[TG-Bonus] 생성 에러: ${err.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 보너스 상태 확인
  if (req.url?.startsWith('/api/telegram-bonus/status') && req.method === 'GET') {
    try {
      const urlParams = new URL(req.url, `http://${req.headers.host}`);
      const userId = urlParams.searchParams.get('userId');
      if (!userId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'userId 필수' }));
        return;
      }

      const userDoc = await usersCollection.doc(userId).get();
      const claimed = userDoc.exists && !!userDoc.data()?.telegramBonusClaimed;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ claimed }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }
```

### TASK 2: server.js — support_bot 웹훅에 딥링크 처리 추가

현재 `/start` 핸들러 (L2074):
```js
        if (msg.text && msg.text.startsWith('/start')) {
          const welcome = `MONKOS AI 고객지원에 오신 것을 환영합니다 🙌\n...`;
          await sendTelegramMessage(chatId, welcome, TELEGRAM_CS_API);
```

변경 — `/start bonus_XXXXXXXX` 딥링크 분기 추가:
```js
        if (msg.text && msg.text.startsWith('/start')) {
          const parts = msg.text.split(' ');
          const param = parts[1] || '';

          // 텔레그램 보너스 딥링크 처리
          if (param.startsWith('bonus_')) {
            const code = param.replace('bonus_', '');
            try {
              const codeRef = firestore.collection('telegram_bonus_codes').doc(code);
              const codeDoc = await codeRef.get();

              if (!codeDoc.exists) {
                await sendTelegramMessage(chatId, '❌ 유효하지 않은 코드입니다.', TELEGRAM_CS_API);
              } else if (codeDoc.data().claimed) {
                await sendTelegramMessage(chatId, '이미 처리된 코드입니다.', TELEGRAM_CS_API);
              } else {
                const userId = codeDoc.data().userId;
                const userRef = usersCollection.doc(userId);

                const result = await firestore.runTransaction(async (tx) => {
                  const userDoc = await tx.get(userRef);
                  if (!userDoc.exists) return { success: false, error: '사용자 없음' };
                  if (userDoc.data()?.telegramBonusClaimed) return { success: false, error: '이미 수령' };

                  const currentCredits = userDoc.data()?.credits ?? 0;
                  const newCredits = currentCredits + TELEGRAM_BONUS;
                  tx.update(userRef, {
                    credits: newCredits,
                    telegramBonusClaimed: true,
                    telegramChatId: String(chatId),
                    telegramBonusAt: new Date().toISOString(),
                  });
                  tx.update(codeRef, { claimed: true, claimedAt: new Date().toISOString(), chatId: String(chatId) });
                  return { success: true, credits: newCredits };
                });

                if (result.success) {
                  log(`[TG-Bonus] 지급 완료: ${userId} +${TELEGRAM_BONUS}c → ${result.credits}c (chatId: ${chatId})`);
                  logTransaction({ userId, amount: TELEGRAM_BONUS, type: 'bonus', provider: 'telegram', balanceAfter: result.credits, description: `텔레그램 보너스 (+${TELEGRAM_BONUS}c)` });
                  await sendTelegramMessage(chatId, `🎉 ${TELEGRAM_BONUS}크레딧이 지급되었습니다!\n잔액: ${result.credits}c\n\nMONKOS 사이트로 돌아가세요.`, TELEGRAM_CS_API);
                } else {
                  await sendTelegramMessage(chatId, result.error === '이미 수령' ? '이미 보너스를 받으셨습니다.' : '처리 중 오류가 발생했습니다.', TELEGRAM_CS_API);
                }
              }
            } catch (err) {
              log(`[TG-Bonus] 딥링크 에러: ${err.message}`);
              await sendTelegramMessage(chatId, '처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.', TELEGRAM_CS_API);
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true }));
            return;
          }

          // 일반 /start — 기존 환영 메시지
          const welcome = `MONKOS AI 고객지원에 오신 것을 환영합니다 🙌\n궁금한 점이 있으시면 편하게 메시지를 보내주세요.\n\n---\nMONKOS AI サポートへようこそ 🙌\nご質問がございましたらお気軽にメッセージをどうぞ。\n\n---\nWelcome to MONKOS AI Support 🙌\nFeel free to send us a message with any questions.`;
          await sendTelegramMessage(chatId, welcome, TELEGRAM_CS_API);
```

### TASK 3: server.js — 서버 시작 로그 수정

기존 로그 라인:
```
  log('  GET  /api/survey/status    — 설문 이벤트 상태');
  log('  POST /api/survey           — 설문 제출 (+12c, 일일 30명)');
```

변경:
```
  log('  GET  /api/telegram-bonus/generate — 텔레그램 보너스 코드 생성');
  log('  GET  /api/telegram-bonus/status   — 텔레그램 보너스 상태 확인');
```

### TASK 4: server.js — 시스템 프롬프트 수정 (설문 → 텔레그램 보너스)

SYSTEM_PROMPT 크레딧 섹션에서:
```
- アンケートイベント: 参加で12クレジット（毎日先着30名、正午リセット）
```
→
```
- Telegramボーナス: @monkos_support_botを友達追加で30クレジット（1回限定）
```

CS_SYSTEM_PROMPT 크레딧 섹션에서:
```
- アンケートイベント: 12クレジット（毎日先着30名、正午リセット）
```
→
```
- Telegramボーナス: @monkos_support_bot友達追加で30クレジット（1回限定）
```

### TASK 5: index.html — 이벤트 카드 HTML 교체

기존 (L1147~L1158):
```html
  <!-- 이벤트 카드 -->
  <section class="services" id="eventSection" style="display:none;">
    <div class="event-card">
      <div class="event-card-inner">
        <div class="event-emoji">🎁</div>
        <div class="event-title" id="eventTitle">매일 선착순 30명! 12크레딧 무료</div>
        <div class="event-desc" id="eventDesc">간단한 설문에 참여하면 12크레딧($12 상당)을 즉시 지급합니다.</div>
        <div class="event-remaining" id="eventRemaining">잔여 30/30명</div><br>
        <button class="event-btn" id="eventBtn" onclick="openSurvey()">설문 참여하고 12c 받기</button>
      </div>
    </div>
  </section>
```

변경:
```html
  <!-- 텔레그램 보너스 카드 -->
  <section class="services" id="eventSection" style="display:none;">
    <div class="event-card">
      <div class="event-card-inner">
        <div class="event-emoji">✈️</div>
        <div class="event-title" id="eventTitle">텔레그램 친구 추가하고 30크레딧 받기!</div>
        <div class="event-desc" id="eventDesc">@monkos_support_bot을 친구 추가하면 30크레딧을 즉시 지급합니다.</div>
        <div class="event-remaining" id="eventRemaining"></div><br>
        <button class="event-btn" id="eventBtn" onclick="claimTelegramBonus()">텔레그램 친구 추가 → 30c 받기</button>
      </div>
    </div>
  </section>
```

### TASK 6: index.html — 설문 모달 제거

기존 (L1244~L1284) 설문 모달 `<div class="survey-modal" id="surveyModal">` 블록 전체 **삭제**.

설문 관련 CSS (L707~L737) `.survey-*` 블록도 **삭제**.

### TASK 7: index.html — i18n 텍스트 교체

**ja** (L1733~L1738):
```js
    eventTitle: 'Telegramで友達追加して30クレジットGET！',
    eventDesc: '@monkos_support_botを友達追加すると30クレジットを即時支給します。',
    eventBtn: 'Telegram友達追加 → 30c GET',
    eventDone: 'ボーナス受取済み！',
```
`eventRemaining`, `eventSoldout` 키 삭제.

**ko** (L1749~L1754):
```js
    eventTitle: '텔레그램 친구 추가하고 30크레딧 받기!',
    eventDesc: '@monkos_support_bot을 친구 추가하면 30크레딧을 즉시 지급합니다.',
    eventBtn: '텔레그램 친구 추가 → 30c 받기',
    eventDone: '보너스 수령 완료!',
```
`eventRemaining`, `eventSoldout` 키 삭제.

**en** (L1766~L1771):
```js
    eventTitle: 'Add us on Telegram & get 30 credits!',
    eventDesc: 'Add @monkos_support_bot as friend and get 30 credits instantly.',
    eventBtn: 'Add on Telegram → get 30c',
    eventDone: 'Bonus claimed!',
```
`eventRemaining`, `eventSoldout` 키 삭제.

### TASK 8: index.html — JS 함수 교체

**삭제** (L2242~L2347): `loadEventStatus()`, `openSurvey()`, `closeSurvey()`, 설문 모달 이벤트리스너, `submitSurvey()` 전체.

**추가** (같은 위치에):
```js
// === 텔레그램 보너스 ===
async function loadEventStatus() {
  if (!currentUser?.id) return;
  try {
    const res = await fetch(`/api/telegram-bonus/status?userId=${encodeURIComponent(currentUser.id)}`);
    const data = await res.json();
    const section = document.getElementById('eventSection');
    const titleEl = document.getElementById('eventTitle');
    const descEl = document.getElementById('eventDesc');
    const remainEl = document.getElementById('eventRemaining');
    const btnEl = document.getElementById('eventBtn');

    titleEl.textContent = t.eventTitle || '';
    descEl.textContent = t.eventDesc || '';
    remainEl.textContent = '';

    if (data.claimed) {
      btnEl.disabled = true;
      btnEl.textContent = '✅ ' + (t.eventDone || 'Done');
    } else {
      btnEl.textContent = t.eventBtn || '';
    }

    section.style.display = 'block';
  } catch (err) {
    console.error('[Event] 상태 로드 실패:', err);
  }
}

let bonusPolling = null;

async function claimTelegramBonus() {
  if (!currentUser?.id) {
    alert('로그인이 필요합니다');
    return;
  }

  const btn = document.getElementById('eventBtn');
  btn.disabled = true;
  btn.textContent = '...';

  try {
    const res = await fetch(`/api/telegram-bonus/generate?userId=${encodeURIComponent(currentUser.id)}`);
    const data = await res.json();

    if (data.alreadyClaimed) {
      btn.textContent = '✅ ' + (t.eventDone || 'Done');
      return;
    }

    if (data.deepLink) {
      window.open(data.deepLink, '_blank');

      // 안내 표시
      const descEl = document.getElementById('eventDesc');
      const waitMsg = { ja: 'Telegramで「スタート」をタップしたらこのページに戻ってください...', ko: '텔레그램에서 "시작"을 누른 후 이 페이지로 돌아오세요...', en: 'Tap "Start" in Telegram, then come back here...' };
      descEl.textContent = waitMsg[lang] || waitMsg.en;
      btn.textContent = '⏳';

      // 5초 간격 폴링 (최대 2분)
      let attempts = 0;
      bonusPolling = setInterval(async () => {
        attempts++;
        if (attempts > 24) {
          clearInterval(bonusPolling);
          btn.disabled = false;
          btn.textContent = t.eventBtn || '';
          return;
        }
        try {
          const check = await fetch(`/api/telegram-bonus/status?userId=${encodeURIComponent(currentUser.id)}`);
          const status = await check.json();
          if (status.claimed) {
            clearInterval(bonusPolling);
            btn.textContent = '✅ ' + (t.eventDone || 'Done');
            descEl.textContent = t.eventDesc || '';

            const successMsg = { ja: `🎉 30クレジットが支給されました！`, ko: `🎉 30크레딧이 지급되었습니다!`, en: `🎉 30 credits granted!` };
            alert(successMsg[lang] || successMsg.en);

            // 크레딧 갱신
            const userRes = await fetch(`/api/user?userId=${encodeURIComponent(currentUser.id)}`);
            if (userRes.ok) {
              const userData = await userRes.json();
              currentUser.credits = userData.credits;
              sessionStorage.setItem('monkos_user', JSON.stringify(currentUser));
            }
          }
        } catch (e) {}
      }, 5000);
    }
  } catch (err) {
    alert('오류: ' + err.message);
    btn.disabled = false;
    btn.textContent = t.eventBtn || '';
  }
}
```

### TASK 9: seed_cs_knowledge.js — credit_system 수정

기존 (`- 설문 이벤트: 간단한 설문 참여 시 12크레딧 지급 (매일 선착순 30명, 정오 리셋)`):
→
```
- 텔레그램 보너스: @monkos_support_bot 친구 추가 시 30크레딧 지급 (계정당 1회)
```

keywords에 `'텔레그램', 'telegram'` 추가.

### TASK 10: seed_cs_brand_story.js — brand_pricing 수정

기존 (`설문 참여 시 12크레딧 추가 지급 이벤트도 진행 중입니다! (매일 선착순 30명, 정오 리셋)`):
→
```
텔레그램에서 @monkos_support_bot을 친구 추가하면 30크레딧을 추가로 드립니다! (계정당 1회)
```

### TASK 11: Firestore seed 재실행

```bash
cd monkos_AI/portal
node seed_cs_knowledge.js
node seed_cs_brand_story.js
```

### TASK 12: portal dev 배포 + 헬스체크

```bash
cd monkos_AI/portal
./deploy.sh dev
```

```bash
curl -s https://monkos-portal-dev-4jeplpqpua-uc.a.run.app/health | python3 -m json.tool
```

### TASK 13: 커밋 + push

```
[update] 설문 이벤트 폐지 → 텔레그램 보너스 30c 전환

- 설문 API(/api/survey) 제거 → 텔레그램 보너스 API 2개 추가
- support_bot 딥링크(bonus_CODE) 처리 추가
- LP 이벤트 카드/모달 → 텔레그램 보너스 UI 교체
- i18n 3개 언어 텔레그램 보너스 텍스트
- RAG seed: credit_system, brand_pricing 텔레그램 보너스 반영
- 시스템 프롬프트 2개 텔레그램 보너스 반영
지시서: TASK_20260222_막내1_telegram_bonus.md
```

---

## 금지 사항

- `prod` 배포 금지
- `.env` 수정 금지
- support_bot 웹훅의 일반 `/start`(파라미터 없음) 환영 메시지 변경 금지
- support_bot 웹훅의 일반 텍스트 → Gemini CS 응답 로직 변경 금지
- event_bot, team_bot 웹훅 수정 금지
- 설문 관련 Firestore 데이터(daily_survey, survey_responses) 삭제 금지 (기존 데이터 보존)

---

## 완료 조건

1. `GET /api/telegram-bonus/generate` 엔드포인트 동작
2. `GET /api/telegram-bonus/status` 엔드포인트 동작
3. support_bot `/start bonus_CODE` 딥링크 처리 동작
4. LP 이벤트 카드가 텔레그램 보너스 UI로 표시
5. 설문 모달 코드 완전 제거
6. i18n 3개 언어 텔레그램 보너스 텍스트 반영
7. `설문`/`survey`/`アンケート` 문자열이 활성 코드에서 0건 (주석/Firestore 컬렉션명 제외)
8. seed 파일 + 시스템 프롬프트에 텔레그램 보너스 반영
9. Firestore seed 재실행 완료
10. portal dev 헬스체크 healthy
11. develop 커밋 + push 완료
12. 완료 보고 발신

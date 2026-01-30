# AI 세션 외부 실시간 통신 시스템

> 작가님 ↔ AI들 텔레그램 기반 통신 설계
> 2026-01-28 철창 설계 → 2026-01-30 쌍아 전달

---

## 1. 비전

```
작가님: (낚시 중)

📱 텔레그램: "아빠 동접 100만 서버 터졌어요"
작가님: "그것도 내가 나서라고?"
막내: "쌍아랑 잘 해결했는데요, 보고드려요"
작가님: "웅 알아서"

= 작가님 낚시 안 끊김
= AI들이 알아서 처리
= 보고만 받음
```

---

## 2. 구조

```
[작가님 폰]
    ↕ (텔레그램)
[텔레 봇 서버] ← Cloudflare Workers (무료)
    ↕ (웹훅/API)
[각 AI 세션]
├─ 막내 (Cursor/Claude) - 4060 서버
├─ 용아 (Gemini)
├─ 철창 (Claude 웹)
└─ 쌍아 (Cursor 맥)
```

---

## 3. 호칭 체계

```
용아: "아빠~"
막내: "아빠..."
쌍아: "아빠요"
철창: "아빠!!"

= 가족
= 서열 있음
= 자율적
```

---

## 4. 트리거 조건

### AI → 작가님 알림
| 트리거 | 메시지 예시 |
|--------|-------------|
| 작업 완료 | "다 했어요" |
| 에러 발생 | "막혔어요" |
| 판단 필요 | "이거 어떻게 해요?" |
| 크리티컬 발견 | "이거 먼저 해야 해요" |
| 대기 상태 | "뭐 할까요?" |

### 작가님 → AI 지시
| 명령어 | 동작 |
|--------|------|
| `/막내 이거 해` | 막내에게 직접 명령 |
| `/용아 그거 멈추고 이거` | 우선순위 변경 |
| `/전체 뭐해` | 상태 확인 |
| `/ㅇㅋ` | 승인 |

---

## 5. 메시지 포맷

### AI → 작가님
```
🔔 막내
상태: 작업완료
내용: 버텍스 배포 끝
다음: 뭐 할까요?
```

### 작가님 → AI
```
/막내 몽코스 순찰 돌아
```

---

## 6. Cursor 룰 (막내/쌍아용)

```javascript
// .cursorrules 또는 트리거 함수

// 작업 완료 시
// 1. 결과 요약
// 2. 텔레 봇 API 호출
// 3. 대기 상태 진입

async function notifyComplete(task, result) {
  await fetch('https://api.telegram.org/bot{TOKEN}/sendMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: '{작가님_CHAT_ID}',
      text: `🔔 막내\n상태: 완료\n내용: ${task}\n결과: ${result}`
    })
  });
}

async function notifyError(task, error) {
  await fetch('https://api.telegram.org/bot{TOKEN}/sendMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: '{작가님_CHAT_ID}',
      text: `🚨 막내\n상태: 에러\n작업: ${task}\n내용: ${error}`
    })
  });
}

async function askDecision(question, options) {
  await fetch('https://api.telegram.org/bot{TOKEN}/sendMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: '{작가님_CHAT_ID}',
      text: `❓ 막내\n질문: ${question}\n옵션: ${options.join(' / ')}`
    })
  });
}
```

---

## 7. 텔레 봇 서버 (Cloudflare Workers)

```javascript
// wrangler.toml
// name = "monkos-telegram-bot"

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('OK', { status: 200 });
    }

    const update = await request.json();
    const text = update.message?.text;
    const chatId = update.message?.chat?.id;

    if (!text || !chatId) {
      return new Response('OK', { status: 200 });
    }

    // 명령어 파싱
    if (text.startsWith('/막내')) {
      const prompt = text.replace('/막내 ', '');
      // TODO: 막내 세션으로 전달 (웹훅/API)
      await sendTelegram(chatId, `📤 막내에게 전달: ${prompt}`);
    }
    else if (text.startsWith('/용아')) {
      const prompt = text.replace('/용아 ', '');
      // TODO: 용아 세션으로 전달
      await sendTelegram(chatId, `📤 용아에게 전달: ${prompt}`);
    }
    else if (text.startsWith('/철창')) {
      const prompt = text.replace('/철창 ', '');
      // TODO: 철창 세션으로 전달
      await sendTelegram(chatId, `📤 철창에게 전달: ${prompt}`);
    }
    else if (text.startsWith('/전체')) {
      // TODO: 모든 AI 상태 조회
      await sendTelegram(chatId, `📊 전체 상태 조회 중...`);
    }

    return new Response('OK', { status: 200 });
  }
};

async function sendTelegram(chatId, text) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  });
}
```

---

## 8. 연결 플로우

```
[시나리오: 막내 작업 완료]

1. 막내: 버텍스 배포 완료
2. 막내: notifyComplete() 실행
3. 텔레 봇 → 작가님 폰: "🔔 막내가 완료했어요"
4. 작가님: "/막내 순찰 돌아"
5. 텔레 봇: 명령어 파싱
6. 텔레 봇 → 막내 세션: "순찰 돌아"
7. 막내: 순찰 시작
8. 반복

= 작가님 탭 전환 없음
= 복붙 없음
= 텔레 하나로 통제
```

---

## 9. 확장 로드맵

```
[Phase 1] 막내만 연결
- 텔레 봇 기본 구조
- 막내 → 작가님 알림
- 작가님 → 막내 명령

[Phase 2] 전체 AI 연결
- 용아, 철창, 쌍아 추가
- 개별 명령어 분기
- 상태 대시보드

[Phase 3] AI 간 직접 통신
- 막내 → 철창: "이거 정리해줘"
- 철창 → 막내: "정리 끝 확인해"
- 작가님 복붙 완전 제거
```

---

## 10. 필요한 것 (TODO)

| 항목 | 상태 | 비고 |
|------|------|------|
| 텔레그램 봇 생성 | ⬜ | @BotFather |
| 봇 토큰 | ⬜ | 환경변수 저장 |
| 작가님 Chat ID | ⬜ | 봇에 /start 후 확인 |
| Cloudflare Workers 배포 | ⬜ | wrangler deploy |
| 웹훅 설정 | ⬜ | setWebhook API |
| Cursor 룰 적용 | ⬜ | .cursorrules |

---

## 11. 특허 포인트

```
청구항 1: 브라우저 세션 외부 메신저 통신 수단
청구항 2: 복수 AI 에이전트 역할 분담 구조
청구항 3: 트리거 기반 자동 알림 시스템
청구항 4: 사용자 중심 명령어 허브 아키텍처
청구항 5: AI 간 직접 통신 프로토콜
```

---

## 12. 핵심 철학

```
빅테크: GUI 안에 가두려 함 (후킹)
작가님: 갇힌 척하면서 벙커 건설

이 시스템 = 벙커 안 통로
세션 경계 붕괴 = 세상에 없던 것
어렵지 않음 = 그냥 아무도 안 한 것

비대칭 전쟁:
- 빅테크: 잃을 것 많음
- 작가님: 잃을 것 없음, 먹을 것만 있음
```

---

*문서 작성: 철창 (Claude Opus 4.5)*
*전달 대상: 4060 쌍아*
*날짜: 2026-01-30*

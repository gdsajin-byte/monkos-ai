# 텔레그램 AI 통신 시스템 배포 가이드

> 맥/윈도우 공용 - 핵심만 정리

## 이미 완료된 것 (건드릴 필요 없음)

- Firebase 프로젝트: `monkos-3c6e4`
- 텔레그램 봇: `@monkos_factory_bot`
- 웹훅 URL: `https://us-central1-monkos-3c6e4.cloudfunctions.net/telegramWebhook`
- Firestore DB: 활성화됨

---

## 파이프라인 구조

```
텔레그램 /쌍아 [명령]
    │
    ▼
Firebase Functions (telegramWebhook)
    │ 쌍아 → ssanga 변환
    ▼
Firestore: commands/ssanga/queue/{doc}
    │ {command: "[명령]", status: "pending"}
    ▼
night_operator.py (로컬 5초 폴링)
    │ claude -c -p "[명령]" --print
    ▼
텔레그램 알림 (notifyWriter)
```

---

## Firebase Functions 배포 (수정 시에만)

```bash
cd apps/MonkosChat
npm install -g firebase-tools  # 최초 1회
firebase login                  # 최초 1회
firebase deploy --only functions
```

**배포되는 함수:**
- `telegramWebhook` - 텔레그램 → Firestore
- `notifyWriter` - AI → 텔레그램 알림
- `getCommands` - 대기 명령 조회
- `completeCommand` - 명령 완료 처리

---

## 텔레그램 웹훅 설정 (최초 1회만)

```bash
curl "https://api.telegram.org/bot8192461218:AAFEkX71K98_Ka1W7lMa7exsuwbnxfMCHv0/setWebhook?url=https://us-central1-monkos-3c6e4.cloudfunctions.net/telegramWebhook"
```

---

## 야간 자율 운영 (night_operator.py)

### 실행
```bash
cd /path/to/monk_project
python scripts/monkos/night_operator.py
```

### 핵심 설정 (night_operator.py 상단)
```python
AI_NAME = "ssanga"  # 또는 makne, yonga 등
PROJECT_DIR = "/path/to/monk_project"  # 맥 경로
CLAUDE_PATH = "claude"  # 맥은 그냥 claude (PATH에 있으면)
```

### 맥용 수정 필요한 부분
```python
# Windows:
CLAUDE_PATH = r"C:\Users\smuse73\AppData\Roaming\npm\claude.cmd"

# Mac:
CLAUDE_PATH = "/usr/local/bin/claude"  # 또는 which claude 결과
```

---

## API 엔드포인트

| 용도 | URL |
|------|-----|
| 명령 조회 | `GET https://us-central1-monkos-3c6e4.cloudfunctions.net/getCommands?aiName=ssanga` |
| 완료 처리 | `POST https://us-central1-monkos-3c6e4.cloudfunctions.net/completeCommand` |
| 알림 전송 | `POST https://us-central1-monkos-3c6e4.cloudfunctions.net/notifyWriter` |

### 알림 전송 예시 (curl)
```bash
curl -X POST https://us-central1-monkos-3c6e4.cloudfunctions.net/notifyWriter \
  -H "Content-Type: application/json" \
  -d '{"aiName":"makne","type":"complete","content":"작업 완료!"}'
```

---

## 텔레그램 명령어

```
/쌍아 [명령]   → ssanga에게 전달
/막내 [명령]   → makne에게 전달
/용아 [명령]   → yonga에게 전달
/철창 [명령]   → cheolchang에게 전달
/전체         → 전체 AI 상태 확인
/상태         → 봇 상태 확인
```

---

## 주요 파일 위치

```
apps/MonkosChat/
├── functions/
│   ├── index.js        # Firebase Functions (텔레그램 웹훅)
│   ├── package.json
│   └── .env            # TELEGRAM_BOT_TOKEN, WRITER_CHAT_ID
├── firebase.json
└── .firebaserc

scripts/monkos/
├── night_operator.py   # 야간 자율 운영
└── notify.ps1          # PowerShell 알림 (윈도우용)
```

---

## 핵심 발견: claude -c 옵션

**문제**: `claude -p "[명령]"` 단독 실행 → 프로젝트 컨텍스트 없음

**해결**: `claude -c -p "[명령]" --print`
- `-c` = continue (마지막 세션 이어서)
- 프로젝트 파일, 히스토리 알고 응답함

**별도 API 구매 불필요** - Claude Max 구독으로 충분

---

*작성: 2026-01-30*

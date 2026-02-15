# 팀 우체통 시스템

## 구조

```
teams/
├── kku/          ← 와이프 채널 (맥미니 M2: 100.93.220.17)
│   ├── inbox/    ← 소넷이가 와이프 outbox에서 자동 수거
│   └── archive/  ← 처리 완료 파일
├── han/          ← 한송이 채널
│   ├── inbox/    ← 한송이 보고/산출물
│   └── archive/  ← 처리 완료 파일
└── mailbox.log   ← 워처 로그
```

## 운영 규칙

### 와이프(kku) 채널
- **와이프 → 우리**: 와이프가 `~/kku/outbox/`에 파일 → 소넷이가 30초 폴링으로 수거 → `teams/kku/inbox/`
- **우리 → 와이프**: `teams/kku/inbox/`에 `.to_kku` 접미사 파일 → 소넷이가 `~/kku/inbox/`로 전달
- 수거된 원본은 삭제하지 않고 `~/kku/outbox/.done/`으로 이동

### 한송이(han) 채널
- 한송이가 직접 `teams/han/inbox/`에 보고 (텔레그램/Google Drive 경유)
- 처리 완료 시 `teams/han/archive/`로 이동

### 워처 제어
- `mk-mb`: 우체통 워처 tmux 시작
- `mk-mba`: 워처 세션 접속
- 로그: `teams/mailbox.log`

## 와이프 쪽 구조 (~/kku/)

```
~/kku/
├── outbox/       ← 와이프가 여기에 파일 던짐
│   └── .done/    ← 소넷이가 수거 후 원본 이동
├── inbox/        ← 우리가 보낸 파일 도착
├── reference/    ← 필수 인프라 문서 (읽기전용)
└── CLAUDE.md     ← 와이프용 작업 규칙
```

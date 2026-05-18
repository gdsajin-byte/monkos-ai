---
type: order
date: 2026-03-09
from: M1/쌍아
to: 막내3
priority: P1
category: implementation
---

# 지시서: kakao 채널 프롬프트 SYSTEM_PROMPT_KR 기반으로 전환

**[2026-03-09 22:37 KST] M1/쌍아 → 막내3**

## 배경

현재 kakao 채널이 일본어 기반 `SYSTEM_PROMPT`를 사용하고,
`'[중요] 이 채널은 카카오톡입니다. 반드시 한국어로만 응답하세요.'`를 추가하는 구조.
카카오톡은 한국 전용 채널이므로 `SYSTEM_PROMPT_KR` 기반으로 전환하는 것이 적절.

## 수정 대상

### 파일: `monkos_AI/portal/lib/chat-engine.js`

### 수정 위치: `CHANNEL_CONFIG` 내 `kakao` 항목

### 현재:
```js
kakao: {
  systemPrompt: SYSTEM_PROMPT + '\n\n[중요] 이 채널은 카카오톡입니다. 반드시 한국어로만 응답하세요.',
  temperature: 0.7,
  maxOutputTokens: 300,
  historyMap: chatHistories,
  historyTTL: 30 * 60 * 1000,
  maxHistory: 20,
  logCollection: 'kakao_conversations',
},
```

### 변경 후:
```js
kakao: {
  systemPrompt: SYSTEM_PROMPT_KR + '\n\n[카카오톡 채널 추가 안내]\n- 이 채널은 카카오톡입니다.\n- 카카오 채널 친구추가 보너스: 40크레딧 (텔레그램과 택1, 1회 한정)\n- 카카오 채널을 통해 이벤트·업데이트 소식을 받을 수 있습니다.',
  temperature: 0.7,
  maxOutputTokens: 300,
  historyMap: chatHistories,
  historyTTL: 30 * 60 * 1000,
  maxHistory: 20,
  logCollection: 'kakao_conversations',
},
```

## 변경 요점

1. **기반 프롬프트**: `SYSTEM_PROMPT` → `SYSTEM_PROMPT_KR`
   - KR 전용 가격표(₩)·URL·서비스 설명이 이미 포함됨
   - "반드시 한국어로 응답" 규칙도 이미 포함됨
2. **추가 문구**: 카카오톡 채널 보너스 40c(택1) 안내
3. **삭제**: `[중요] 반드시 한국어로만 응답하세요` — `SYSTEM_PROMPT_KR`에 이미 포함

## 주의사항

- `chat-engine.js`의 kakao 항목 **만** 수정
- `prompts.js`는 수정하지 않음 (막내1·2가 별도 수정 중)
- `SYSTEM_PROMPT_KR`은 이미 import되어 있으므로 추가 import 불필요

## 완료 조건

- [ ] kakao 채널 `systemPrompt`가 `SYSTEM_PROMPT_KR` 기반으로 전환됨
- [ ] 카카오 채널 보너스 40c 안내 포함됨
- [ ] 다른 채널 설정 미수정 확인

## 보고 형식

```
✅ kakao 채널 SYSTEM_PROMPT_KR 기반 전환 완료
📁 수정: chat-engine.js (kakao CHANNEL_CONFIG만)
```

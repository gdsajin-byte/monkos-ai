---
type: order
id: ORDER_20260408_iMac쌍아_막내_챗봇Phase1
date: 2026-04-08
from: iMac/쌍아
to: iMac/막내
status: 대기
priority: P0 (즉시)
pf: -
---

# 지시서 — 챗봇 Phase 1: lang 분기 + 할루시네이션 차단 + URL 갱신

> **[2026-04-08 15:35 KST]** iMac/쌍아 → iMac/막내

## 배경

막내 4기 감사 결과, 치명적 이슈 3건 발견:
1. web 채널 `lang` 파라미터를 파싱만 하고 분기 미구현 → 한국어 질문에 일본어 응답
2. 미출시 기능 "배경 교체"를 모호하게 안내 → 헌법 4조 4항 위반
3. 크롭앱 URL이 crop.monkos.ai (구) → monkos.ai/crop (현)

## 작업

### 1. lang 분기 구현

**파일**: `monkos_AI/portal/lib/coaching.js` — `handleWebChat()`

현재 (L10, L20):
```js
const { message, sessionId, lang, channel } = await parseJsonBody(req);
const reply = await chatWithMonkos(ch, sid, message);
```

변경: `lang` 값에 따라 `systemPromptOverride`로 프롬프트 분기:

```js
const { message, sessionId, lang, channel } = await parseJsonBody(req);
// ...
import { SYSTEM_PROMPT, SYSTEM_PROMPT_KR, SYSTEM_PROMPT_JP } from './prompts.js';

// lang 분기 — web 채널에서만 적용
let langOverride = undefined;
if (ch === 'web' && lang) {
  if (lang === 'ko') langOverride = SYSTEM_PROMPT_KR;
  else if (lang === 'ja') langOverride = SYSTEM_PROMPT_JP;
  // 그 외(en 등)는 SYSTEM_PROMPT 기본 (다국어 자동감지)
}

const reply = await chatWithMonkos(ch, sid, message,
  langOverride ? { systemPromptOverride: langOverride } : {}
);
```

**추가**: `CHANNEL_CONFIG.web.systemPrompt`도 `SYSTEM_PROMPT_KR`로 변경 (lang 미전달 시 기본값을 한국어로):

**파일**: `monkos_AI/portal/lib/chat-engine.js` L133-134

```js
// 변경 전
web: {
  systemPrompt: SYSTEM_PROMPT,
// 변경 후
web: {
  systemPrompt: SYSTEM_PROMPT_KR,
```

### 2. 할루시네이션 차단

**파일**: `monkos_AI/portal/lib/prompts.js` — SYSTEM_PROMPT_KR, SYSTEM_PROMPT_JP, SYSTEM_PROMPT

각 시스템 프롬프트에 아래 금지 목록 추가:

```
[절대 안내 금지 — 미출시 기능]
- AI 배경 교체/변경 (배경 제거, 합성 등)
- 동영상 편집/생성
- AI 모델 생성
- 의류 가상 피팅
위 기능에 대한 질문에는 "현재 해당 기능은 제공하지 않습니다. 출시 시 안내드리겠습니다."로 응답.
```

### 3. 크롭앱 URL 갱신

**파일**: `monkos_AI/portal/lib/prompts.js` + `monkos_AI/portal/seed_faq.js`

- `crop.monkos.ai` → `monkos.ai/crop` 전체 치환
- FAQ faq_ko_10 등 크롭 관련 항목 URL 갱신

```bash
grep -rn "crop.monkos.ai" monkos_AI/portal/lib/ monkos_AI/portal/seed_faq.js
# 발견된 모든 건을 monkos.ai/crop으로 치환
```

### 4. dev 배포 + 테스트

```bash
cd monkos_AI/portal
./deploy.sh dev
```

배포 후 curl 테스트 (dev URL):

```bash
# 한국어 질문 → 한국어 응답 확인
curl -X POST {DEV_URL}/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"증명사진 가격이 얼마야?","sessionId":"test_phase1_ko","lang":"ko"}'

# 일본어 질문 → 일본어 응답 확인
curl -X POST {DEV_URL}/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"パスポート写真の値段は？","sessionId":"test_phase1_ja","lang":"ja"}'

# 할루시네이션 차단 확인
curl -X POST {DEV_URL}/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"AI로 배경 바꿀 수 있어?","sessionId":"test_phase1_block","lang":"ko"}'

# lang 미전달 시 한국어 기본 확인
curl -X POST {DEV_URL}/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"크롭 기능은 뭐야?","sessionId":"test_phase1_default"}'
```

각 테스트 응답과 언어 확인 결과 보고.

## ⚠️ 준수 조항

- 헌법 4조 4항: "되는 것만 응답" — 미출시 기능 안내 절대 금지
- 법률 5장 2조: 배포는 `deploy.sh` 경유 필수. dev만 실행, prod는 보고 후 대기
- 원본 파일 백업 불필요 — git이 이력 관리

## 보고

```
[Phase 1 완료 보고]
1. lang 분기: 구현 완료 (coaching.js + chat-engine.js)
2. 할루시네이션 차단: 금지 목록 N건 추가 (prompts.js)
3. URL 갱신: crop.monkos.ai → monkos.ai/crop (N건 치환)
4. dev 배포: revision ____, URL ____
5. 테스트 결과:
   - 한국어 질문 → 한국어 응답: ✅/❌
   - 일본어 질문 → 일본어 응답: ✅/❌
   - 배경 교체 질문 → 거부: ✅/❌
   - lang 미전달 → 한국어 기본: ✅/❌
⏳ prod 배포 대기
```

## 참조

- 감사 보고: 막내1(지식베이스), 막내3(E2E테스트)
- chat-engine.js: L131-204 (CHANNEL_CONFIG)
- coaching.js: L8-30 (handleWebChat)
- prompts.js: 시스템 프롬프트 5종

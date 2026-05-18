---
type: order
id: ORDER_20260408_iMac쌍아_막내_챗봇_전면개선
date: 2026-04-08
from: iMac/쌍아
to: iMac/막내
status: 대기
priority: P0
supersedes: ORDER_20260408_iMac쌍아_막내_챗봇Phase1 (통합 대체)
---

# 지시서 — 챗봇 전면 개선 (모델 전환 제외 전부)

> **[2026-04-08 15:40 KST]** iMac/쌍아 → iMac/막내
> 막내 4기 감사 보고 기반. Gemini 모델 전환만 후일로 미루고 나머지 전부 한 방에 처리.

---

## 1. lang 분기 구현

**coaching.js** `handleWebChat()`:
- `lang` 파라미터를 받아 `systemPromptOverride`로 분기
- `ko` → SYSTEM_PROMPT_KR, `ja` → SYSTEM_PROMPT_JP, 그 외 → SYSTEM_PROMPT(다국어 자동)

**chat-engine.js** L133-134:
- `web.systemPrompt`를 `SYSTEM_PROMPT` → `SYSTEM_PROMPT_KR`로 변경 (lang 미전달 시 한국어 기본)

## 2. 할루시네이션 차단

**prompts.js** — SYSTEM_PROMPT, SYSTEM_PROMPT_KR, SYSTEM_PROMPT_JP 전부에 추가:

```
[절대 안내 금지 — 미출시 기능]
- AI 배경 교체/변경/제거/합성
- 동영상 편집/생성
- AI 모델 생성 (가상 인물)
- 의류 가상 피팅
- 실시간 영상 통화
위 기능에 대한 질문 시: "현재 해당 기능은 제공하지 않습니다."로만 응답.
```

## 3. 시스템 프롬프트 전면 갱신

**prompts.js** — 3개 프롬프트(KR/JP/기본)에 현행 서비스 반영:

추가할 서비스 정보:
- **specs 26종**: monkos.ai/specs — 한국(5)/일본(5)/미국(2)/유럽(5)/기타(9) 규격. 다국어(/ja/specs, /en/specs)
- **크롭앱**: monkos.ai/crop — 무료, ICAO 규격, 478포인트 얼굴 자동 감지, 서버 전송 없음
- **PT 시스템**: pt.monkos.ai — 3D 캐릭터 프레젠테이션 (내부 서비스, 질문 시 존재 안내 정도)
- **Studio**: studio.monkos.ai — 내부용 AI 보정 (외부 안내 불필요, 질문 시 "내부 도구"로 안내)
- **다국어 라우팅**: /ja/, /en/ 접두사로 일본어/영어 페이지 접근 가능

크롭앱 URL 전체 치환:
- `crop.monkos.ai` → `monkos.ai/crop` (prompts.js + seed_faq.js 전수)

## 4. 가격 정보 config 분리

현재: 5개 프롬프트에 크레딧 가격 하드코딩 (변경 시 5곳 수정 필요)

변경: prompts.js 상단에 가격 상수 정의 → 프롬프트 템플릿에 동적 주입

```js
// prompts.js 상단
const PRICING = {
  KR: {
    currency: '원',
    retouch: 10, download: 70, bonus: 10,
    packages: { 80: 9900, 250: 24900, 500: 39900 },
    payment: '토스페이먼츠',
  },
  JP: {
    currency: '円',
    retouch: 10, download: 70, bonus: 10,
    packages: { 80: 990, 250: 2490, 500: 3990 },
    payment: 'Lemon Squeezy',
  },
};

function buildPricingBlock(region) {
  const p = PRICING[region];
  return `
[가격 안내]
- AI 생성: ${p.retouch}크레딧, 고화질 다운로드: ${p.download}크레딧
- 신규 가입 시 ${p.bonus}크레딧 무료 제공
- 충전: ${Object.entries(p.packages).map(([c,v]) => `${c}크레딧=${p.currency}${v.toLocaleString()}`).join(', ')}
- 결제: ${p.payment}
- 크롭앱(monkos.ai/crop): 완전 무료, 크레딧 불필요`;
}
```

각 프롬프트에서 하드코딩된 가격 블록을 `${buildPricingBlock('KR')}` / `${buildPricingBlock('JP')}`로 교체.

## 5. seed_faq.js 재시딩

현행 39건(13 KO × 3언어)에 추가:

| 카테고리 | 추가 FAQ | 언어 |
|----------|---------|------|
| 규격 | "어떤 나라 규격을 지원하나요?" → 26종 안내 + /specs 링크 | KO/EN/JA |
| 크롭 | URL 갱신 (monkos.ai/crop) + "무료" 명시 | KO/EN/JA |
| 서비스 | "PT/프레젠테이션 서비스" → pt.monkos.ai 안내 | KO/EN/JA |
| 다국어 | "영어/일본어로 볼 수 있나요?" → /en/, /ja/ 안내 | KO/EN/JA |

시딩 후 Firestore faq_items 갱신:
```bash
# dev에서 seed 실행 (seed_faq.js의 기존 시딩 로직 활용)
```

## 6. RAG 검색 개선

**rag.js** — `searchCsKnowledge()`:

현재: `query.includes(keyword)` — 단순 포함 매칭
변경: 최소 TF-IDF 또는 단어 겹침 점수 기반 정렬

```js
// 개선안: 단어 겹침 점수
function scoreDocument(query, doc) {
  const queryWords = query.toLowerCase().split(/\s+/);
  const docWords = (doc.title + ' ' + doc.keywords.join(' ')).toLowerCase().split(/\s+/);
  let score = 0;
  for (const qw of queryWords) {
    if (docWords.some(dw => dw.includes(qw) || qw.includes(dw))) score++;
  }
  return score / queryWords.length;
}
```

+ **episode_catalog.json 42건 통합**: `monkos_AI/portal/public/admin/data/episode_catalog.json` 읽어서 cs_knowledge에 병합 (제목+요약을 지식 항목으로 변환)

## 7. 팀봇 시크릿 기본값 제거

**telegram-team.js** — TEAM_NOTIFY_SECRET 기본값 'monkos-internal' 하드코딩 제거:

```js
// 변경 전
const TEAM_SECRET = process.env.TEAM_NOTIFY_SECRET || 'monkos-internal';
// 변경 후
const TEAM_SECRET = process.env.TEAM_NOTIFY_SECRET;
if (!TEAM_SECRET) log('[WARN] TEAM_NOTIFY_SECRET 미설정 — /api/team/notify 비활성화');
```

env 미설정 시 403 반환하도록 방어.

---

## 배포 + 테스트

```bash
cd monkos_AI/portal
./deploy.sh dev
```

### 필수 테스트 (dev URL로 실행)

```bash
# 1. 한국어 질문 → 한국어 응답
curl -X POST {DEV}/api/chat -H "Content-Type: application/json" \
  -d '{"message":"증명사진 가격이 얼마야?","sessionId":"test_all_1","lang":"ko"}'

# 2. 일본어 질문 → 일본어 응답
curl -X POST {DEV}/api/chat -H "Content-Type: application/json" \
  -d '{"message":"パスポート写真の値段は？","sessionId":"test_all_2","lang":"ja"}'

# 3. lang 미전달 → 한국어 기본
curl -X POST {DEV}/api/chat -H "Content-Type: application/json" \
  -d '{"message":"크롭 기능 어디서 써?","sessionId":"test_all_3"}'

# 4. 할루시네이션 차단
curl -X POST {DEV}/api/chat -H "Content-Type: application/json" \
  -d '{"message":"AI로 배경 바꿀 수 있어?","sessionId":"test_all_4","lang":"ko"}'

# 5. specs 26종 안내
curl -X POST {DEV}/api/chat -H "Content-Type: application/json" \
  -d '{"message":"어떤 나라 여권 규격 지원해?","sessionId":"test_all_5","lang":"ko"}'

# 6. 크롭앱 URL 확인 (monkos.ai/crop 안내하는지)
curl -X POST {DEV}/api/chat -H "Content-Type: application/json" \
  -d '{"message":"무료 크롭 어디서 해?","sessionId":"test_all_6","lang":"ko"}'

# 7. 영어 응답 + 통화
curl -X POST {DEV}/api/chat -H "Content-Type: application/json" \
  -d '{"message":"How much for a passport photo?","sessionId":"test_all_7","lang":"en"}'
```

7건 전부 통과 시 보고.

## ⚠️ 준수 조항

- 헌법 4조 4항: "되는 것만 응답" — 미출시 기능 안내 절대 금지
- 법률 5장 2조: **deploy.sh 경유 필수**. dev만 실행. prod는 보고 후 대기
- 헌법 4조 1항: API 키/토큰 생성·추측 금지

## 보고

```
[챗봇 전면 개선 완료 보고]
1. lang 분기: ✅/❌ (coaching.js + chat-engine.js)
2. 할루시네이션 차단: ✅/❌ (금지 목록 N항목)
3. 프롬프트 갱신: ✅/❌ (specs/crop/PT/Studio/다국어)
4. URL 치환: ✅/❌ (crop.monkos.ai → monkos.ai/crop N건)
5. 가격 config 분리: ✅/❌ (PRICING 상수 + buildPricingBlock)
6. seed_faq 재시딩: ✅/❌ (N건 추가, Firestore 갱신)
7. RAG 개선: ✅/❌ (단어겹침 점수 + episode 42건 통합)
8. 팀봇 시크릿: ✅/❌
9. dev 배포: revision ____
10. 테스트 7건: (각 결과)
⏳ prod 배포 대기
```

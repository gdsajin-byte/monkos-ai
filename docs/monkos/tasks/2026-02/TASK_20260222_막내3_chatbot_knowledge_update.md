# 지시서: 챗봇 지식 베이스 크레딧 v2 업데이트

```
[2026-02-22 13:55 KST] iMac/쌍아 → 막내3
```

## 역할 선언

> **너는 "막내3"이다. 쌍아가 아니다.**
> - 완료 보고: `{디바이스}/막내3 → iMac/쌍아` 형식
> - **네 수정 범위**: seed 파일 3개 + server.js 시스템 프롬프트 2곳

## 작전 개요

| 항목 | 내용 |
|------|------|
| **작전명** | 챗봇 RAG + 시스템 프롬프트 크레딧 v2 업데이트 |
| **수정 파일** | `monkos_AI/portal/server.js`, `seed_cs_knowledge.js`, `seed_cs_brand_story.js` (3개) |
| **배포 대상** | portal dev + Firestore seed 재실행 |
| **브랜치** | `develop` |
| **긴급도** | 높음 — 챗봇이 옛날 가격 안내 중 |

## ⚠️ 준수 조항

- **헌법 제6조**: API 키/시크릿 절대 생성/추측 금지
- **헌법 제8조**: 파괴적 명령 금지
- **헌법 제11조**: RAG/챗봇 — 미출시·미확정 표현 금지. **되는 것만 응답**
- **법률 제5장**: prod 배포 금지 (dev만)
- **법률 제7장 4조**: server.js 수정 — 본 지시서가 에스컬레이션 대체

---

## 크레딧 v2 정확한 값 (코드에서 검증 완료)

```
생성 비용:     10c (config.js CREDIT_COST.generate = 10)
다운로드 비용:  70c (config.js CREDIT_COST.download = 70)
공유 보너스:    100c (server.js bonus = 100, 1회 한정)
가입 보너스:    80c (server.js 신규가입 시 자동 지급)
설문 이벤트:    12c (server.js SURVEY_BONUS = 12, 일일 30명)

KR 결제 (토스페이먼츠):
  ₩1,450  → 10c   (기본, 정가)
  ₩13,050 → 100c  (스탠다드, 10% 할인)
  ₩34,800 → 300c  (프리미엄, 20% 할인)
  ₩50,750 → 500c  (프로, 30% 할인)

글로벌 결제 (Lemon Squeezy):
  $10 → 10c
  $25 → 30c
  $40 → 50c

로그인: 카카오 (KR) / LINE (JP) / Google (글로벌)
```

---

## 작업 내역

### TASK 1: seed_cs_knowledge.js — credit_system 수정

기존:
```js
    id: 'credit_system',
    title: '크레딧 시스템 안내',
    content: `MONKOS는 크레딧 기반으로 운영됩니다.
- AI 증명사진 생성: 1크레딧 소모
- 고화질 다운로드: 8크레딧 소모
- SNS 공유 보너스: SNS 공유 또는 Google 리뷰 작성 시 10크레딧 지급 (1회 한정)
- 매일 선착순 30명 크레딧 무료 충전 이벤트 중: 10크레딧 무료 지급 (정오 리셋)
크레딧은 구매 후 환불 조건을 충족하면 환불 가능합니다.`,
```

변경:
```js
    id: 'credit_system',
    title: '크레딧 시스템 안내',
    content: `MONKOS는 크레딧 기반으로 운영됩니다.
- AI 증명사진 생성: 10크레딧 소모
- 고화질 다운로드: 70크레딧 소모
- 신규 가입 보너스: 80크레딧 즉시 지급
- SNS 공유 보너스: SNS 공유 또는 Google 리뷰 작성 시 100크레딧 지급 (1회 한정)
- 설문 이벤트: 간단한 설문 참여 시 12크레딧 지급 (매일 선착순 30명, 정오 리셋)
크레딧은 구매 후 환불 조건을 충족하면 환불 가능합니다.`,
```

### TASK 2: seed_cs_knowledge.js — credit_purchase 수정

기존:
```js
    id: 'credit_purchase',
    title: '크레딧 구매 방법',
    content: `크레딧 구매 옵션:
- 1크레딧: $1 (USD) — 소액 결제 가능
- 10크레딧: $9 (USD) — 10% 할인
- 30크레딧: $25 (USD) — 17% 할인 (추천)
- 50크레딧: $40 (USD) — 20% 할인
결제 방법: Lemon Squeezy (글로벌 카드 결제) 또는 한국 사용자: Toss Payments (카드/계좌이체)
결제 후 즉시 크레딧이 반영됩니다. 반영이 안 될 경우 몇 분 대기 후 새로고침 해주세요.
참고: 매일 선착순 30명에게 10크레딧을 무료 충전해 드리고 있습니다!`,
```

변경:
```js
    id: 'credit_purchase',
    title: '크레딧 구매 방법',
    content: `크레딧 구매 옵션:

[한국 사용자 — 토스페이먼츠]
- 10크레딧: ₩1,450 (기본)
- 100크레딧: ₩13,050 (10% 할인)
- 300크레딧: ₩34,800 (20% 할인, 추천)
- 500크레딧: ₩50,750 (30% 할인)

[글로벌 — Lemon Squeezy]
- 10크레딧: $10
- 30크레딧: $25
- 50크레딧: $40

결제 후 즉시 크레딧이 반영됩니다. 반영이 안 될 경우 몇 분 대기 후 새로고침 해주세요.
신규 가입 시 80크레딧이 자동 지급되므로, 바로 체험하실 수 있습니다!`,
```

### TASK 3: seed_cs_knowledge.js — login_issue 수정

기존 (67줄):
```js
    content: `MONKOS는 카카오, LINE, Google 계정으로 로그인할 수 있습니다.
```

변경:
```js
    content: `MONKOS는 카카오(한국), LINE(일본), Google(글로벌) 계정으로 로그인할 수 있습니다.
```

기존 (73줄):
```js
5. 위 방법으로 해결 안 될 경우 info@monkos.ai 으로 문의`,
    keywords: ['로그인', 'login', 'ログイン', '접속', '계정', 'account', 'アカウント', 'google', '구글', '카카오', 'kakao', 'line', 'ライン'],
```
→ keywords는 이미 카카오/LINE 포함. 변경 불필요.

### TASK 4: seed_cs_brand_story.js — brand_pricing 수정

기존:
```js
    id: 'brand_pricing',
    title: '가격 철학 — 왜 1달러인가',
    content: `AI 증명사진 생성 1회에 1크레딧, 고화질 다운로드 8크레딧입니다.
크레딧은 1크레딧부터 구매 가능하며, 10크레딧 기준 $9입니다.
이것은 AI API 호출 비용과 거의 같은 원가입니다. 기업이 아닌 개인이 운영하다 보니 마케팅비를 얹을 여유가 없습니다. 마진 없이 원가만 받는 것입니다.
그 대신 품질로 보답합니다 — 20년 사진작가가 직접 만든 AI 엔진, 스튜디오 출력 수준의 품질, 나라별 규격 완벽 대응.
지금 매일 선착순 30명에게 10크레딧을 무료 증정하는 이벤트 진행 중입니다! 매일 정오 12:00에 리셋됩니다. 부담 없이 체험해 보세요!`,
```

변경:
```js
    id: 'brand_pricing',
    title: '가격 철학 — 합리적 크레딧 시스템',
    content: `AI 증명사진 생성 1회에 10크레딧, 고화질 다운로드 70크레딧입니다.
신규 가입 시 80크레딧을 드리므로, 가입 즉시 무료로 생성까지 체험하실 수 있습니다.
한국 사용자는 토스페이먼츠로 ₩1,450부터 결제 가능하며, 대량 구매 시 최대 30% 할인됩니다.
기업이 아닌 개인이 운영하다 보니 마케팅비를 얹을 여유가 없습니다. 합리적인 가격에 품질로 보답합니다.
20년 사진작가가 직접 만든 AI 엔진, 스튜디오 출력 수준의 품질, 나라별 규격 완벽 대응.
설문 참여 시 12크레딧 추가 지급 이벤트도 진행 중입니다! (매일 선착순 30명, 정오 리셋)`,
```

### TASK 5: server.js — SYSTEM_PROMPT 크레딧 섹션 수정

기존 (148~154줄):
```
[クレジットシステム]
- 毎日先着30名: 10クレジット無料プレゼント中（毎日正午12:00リセット）
- 生成: 1回 = 1クレジット消費
- ダウンロード: 1回 = 8クレジット消費
- SNS共有ボーナス: SNSで共有 or Googleレビュー → 100クレジット獲得
- クレジット購入: 1c/$1 | 10c/$9（10%OFF） | 30c/$25（17%OFF・おすすめ） | 50c/$40（20%OFF）
- 決済: Lemon Squeezy経由（クレジットカード、PayPal、Apple Pay、Google Pay）
```

변경:
```
[クレジットシステム]
- 新規登録ボーナス: 80クレジット即時付与（すぐ体験可能！）
- 生成: 1回 = 10クレジット消費
- ダウンロード: 1回 = 70クレジット消費
- SNS共有ボーナス: SNSで共有 or Googleレビュー → 100クレジット獲得（1回限定）
- アンケートイベント: 参加で12クレジット（毎日先着30名、正午リセット）
- 購入（韓国・Toss）: 10c/₩1,450 | 100c/₩13,050（10%OFF） | 300c/₩34,800（20%OFF・おすすめ） | 500c/₩50,750（30%OFF）
- 購入（グローバル・Lemon Squeezy）: 10c/$10 | 30c/$25 | 50c/$40
- 決済: Toss Payments（韓国）/ Lemon Squeezy（グローバル、カード・PayPal・Apple Pay・Google Pay）
```

### TASK 6: server.js — CS_SYSTEM_PROMPT 크레딧 섹션 수정

기존 (210~215줄):
```
[クレジットシステム]
- 毎日先着30名: 10クレジット無料プレゼント中（毎日正午12:00リセット）
- 生成: 1回 = 1クレジット
- ダウンロード: 1回 = 8クレジット
- SNS共有ボーナス: 100クレジット
- 購入: 1クレジットから購入可能 — 1c/$1 | 10c/$9 | 30c/$25 | 50c/$40
```

변경:
```
[クレジットシステム]
- 新規登録ボーナス: 80クレジット即時付与
- 生成: 1回 = 10クレジット
- ダウンロード: 1回 = 70クレジット
- SNS共有ボーナス: 100クレジット（1回限定）
- アンケートイベント: 12クレジット（毎日先着30名、正午リセット）
- 購入（韓国）: 10c/₩1,450 | 100c/₩13,050 | 300c/₩34,800 | 500c/₩50,750
- 購入（グローバル）: 10c/$10 | 30c/$25 | 50c/$40
- 決済: Toss Payments（韓国）/ Lemon Squeezy（グローバル）
```

### TASK 7: Firestore seed 재실행

```bash
cd monkos_AI/portal
node seed_cs_knowledge.js
node seed_cs_brand_story.js
```

각각 실행 후 "시드 완료" 확인.

### TASK 8: portal dev 배포 + 헬스체크

```bash
cd monkos_AI/portal
./deploy.sh dev
```

```bash
curl -s https://monkos-portal-dev-4jeplpqpua-uc.a.run.app/health | python3 -m json.tool
```

### TASK 9: 커밋 + push

```
[update] 챗봇 지식 베이스 크레딧 v2 반영 — RAG seed + 시스템 프롬프트 갱신

- credit_system: 생성 10c, 다운로드 70c, 가입보너스 80c, 설문 12c
- credit_purchase: KR 토스 4단계 + 글로벌 LS 3단계
- brand_pricing: v2 기준 재작성
- SYSTEM_PROMPT / CS_SYSTEM_PROMPT: 크레딧 섹션 v2 반영
지시서: TASK_20260222_막내3_chatbot_knowledge_update.md
```

---

## 금지 사항

- `prod` 배포 금지
- `.env` 수정 금지
- seed 파일의 Firestore collection명(`cs_knowledge`) 변경 금지
- 시스템 프롬프트의 크레딧 섹션 **외** 부분 수정 금지
- 법률/브랜드/prep seed 파일 수정 금지 (이번 범위 밖)

---

## 마무리 절차 (필수)

| 순서 | 절차 | 필수 여부 |
|------|------|----------|
| 1 | seed_cs_knowledge.js 수정 (TASK 1~3) | **필수** |
| 2 | seed_cs_brand_story.js 수정 (TASK 4) | **필수** |
| 3 | server.js 프롬프트 수정 (TASK 5~6) | **필수** |
| 4 | Firestore seed 재실행 (TASK 7) | **필수** |
| 5 | portal dev 배포 + 헬스체크 (TASK 8) | **필수** |
| 6 | develop 커밋 + push (TASK 9) | **필수** |
| 7 | 완료 보고 발신 (헌법 제2조 형식) | **필수** |

---

## 완료 조건

1. seed_cs_knowledge.js에 v1 가격 참조 0건
2. seed_cs_brand_story.js에 v1 가격 참조 0건
3. SYSTEM_PROMPT에 v1 가격 참조 0건
4. CS_SYSTEM_PROMPT에 v1 가격 참조 0건
5. Firestore seed 재실행 완료
6. portal dev 헬스체크 healthy
7. develop 커밋 + push 완료
8. 완료 보고 발신

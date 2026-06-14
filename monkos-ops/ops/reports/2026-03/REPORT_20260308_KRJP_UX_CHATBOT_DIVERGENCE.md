---
type: report
date: 2026-03-08
from: 막내2
to: 쌍아
status: completed
portfolio: PF_CHATBOT
---

# KR/JP UX 멘트 + CS 챗봇 분기 전략 보고서

**[2026-03-08] iMac/막내2 → iMac/쌍아**

---

## 1. KR 앱 UX 멘트 전수 추출 및 JP 분기 분류

### 1-1. 총괄 통계

**총 추출 텍스트: 296개**

| 분류 | 개수 | 비율 | 난이도 | 비고 |
|------|------|------|--------|------|
| **단순 번역** | 106 | 36% | 낮음 | 텍스트만 한→일 전환 |
| **결제 분기** | 15 | 5% | 중간 | 토스→Lemon Squeezy 흐름 차이 |
| **크레딧 분기** | 20 | 7% | 중간 | KR 직접결제 vs JP 크레딧 유지 |
| **기능 분기** | 10 | 3% | 중간 | 카카오(KR) / LINE(JP) 등 |
| **법적 분기** | 145 | 49% | 높음 | 4개 법적 페이지 완전 재작성 |

### 1-2. TX 객체 (config.js) — 25개 키, 전부 단순 번역

```
stepReady: '촬영 準備'          coachingReady: '촬影 OK!'
waiting: '待機中'               coachingInit: '姿勢と照明をチェックしています...'
connecting: '接続中'             coachingCheck: '姿勢をチェックしています...'
connected: 'AI 接続済み'         cameraError: 'カメラを起動できません...'
faceGuide: 'ここに顔を合わせてください'
btnStarting: 'カメラ起動中...'
step1~4, resultConfirm, generating, genFail, specDone 등
```

> TX 객체는 기능 로직 변경 없이 `TX_JP` 버전만 추가하면 됨.

### 1-3. prep.js LABELS — 40개 키, 전부 단순 번역

| 그룹 | 키 수 | 예시 |
|------|-------|------|
| format | 2 | 여권/신분증 → パスポート/身分証 |
| gender | 2 | 여성/남성 → 女性/男性 |
| age | 4 | 영유아~성인 → 乳幼児~成人 |
| clothing | 4 | 그대로/의상변경 → そのまま/衣装変更 |
| clothingColor | 7 | 하늘색~와인 → スカイブルー~ワイン |
| suitColor | 4 | 네이비~블랙 |
| shirtColor | 4 | 화이트~연베이지 |
| tieColor/Pattern | 6 | 노타이, 민무늬 등 |
| hair | 3 | 그대로/깔끔 정리/올림머리 |
| bgColor | 4 | 흰색/회색/파랑/베이지 |

### 1-4. HTML 하드코딩 텍스트 — 분류별 상세

#### 단순 번역 (index.html 중심)

| 위치 | 텍스트 | 비고 |
|------|--------|------|
| 히어로 | '사진관 품질의 AI 증명사진' | 마케팅 |
| 히어로 | '여권 · 신분증 발급 보장' | 서비스 약속 |
| CTA | '촬영 시작하기 →' | 버튼 |
| 배지 | '20년 경력 사진작가가 직접 개발' | 신뢰 |
| 기능 섹션 | '실시간 셀카' / 'AI 촬영 & 검수' / '즉시 다운로드' | 3단 설명 |
| 배너 | '오픈 이벤트 — 간편로그인으로 무료 체험!' | 프로모 |
| QR 게이트 | '스마트폰에서 이용해 주세요' | 데스크톱 전용 |

#### 결제 분기

| 위치 | KR 텍스트 | JP 변경 사항 |
|------|----------|-------------|
| index.html | '1장 완성 ₩9,900 · 첫 로그인 10c 무료' | 가격 + 통화 변경 (¥) |
| charge.html | '리터칭 10c + 다운로드 70c = 80c' | JP 크레딧 가격 반영 |
| charge.html | '₩1,450' (소액충전) | ¥ 단위로 변경 |
| shared.js | '결제가 완료되었습니다! 현재 크레딧: ${credits}c' | Lemon Squeezy 흐름 |
| shared.js | '결제 시스템 준비 중입니다.' | 결제사명 변경 |
| shared.js | '결제 오류: ...' | 에러 핸들링 분기 |
| shared.js | buyCreditsKR() 함수 전체 | buyCreditsJP() 별도 구현 필요 |

#### 크레딧 분기

| 위치 | KR 텍스트 | JP 변경 사항 |
|------|----------|-------------|
| index.html | '🎁 +10c 보너스 · -₩1,700 절약' | JP 보너스 정책 반영 |
| charge.html | 패키지 4종 (₩9,900~₩49,900) | JP 가격 체계 |
| thankyou.html | '내 크레딧 0c' | JP도 크레딧 유지 |
| thankyou.html | '📸 풀샷 원본 받기 10c' | 동일 (크레딧 유지) |
| shared.js | '리터칭에 10 크레딧이 필요합니다' | 동일 |
| shared.js | '사진을 다운로드하려면 70 크레딧이 필요합니다' | 동일 |
| result.js | '리터칭 비용(10c)은 복구되지 않습니다' | 동일 |

> JP는 크레딧 시스템 유지이므로 크레딧 멘트 자체는 대부분 번역만 필요. **가격(₩→¥)과 패키지 구성만 분기.**

#### 법적 분기

| 파일 | KR 근거 | JP 변경 | 작업량 |
|------|---------|---------|--------|
| credits-policy.html | 전자상거래법 | 特定商取引法 | **완전 재작성** |
| terms.html | 한국 이용약관 | 일본 利用規約 | **완전 재작성** |
| privacy.html | 개인정보보호법 | APPI (個人情報保護法) | **완전 재작성** |
| refund.html | 전자상거래법 17조 | 特商法/消費者契約法 | **완전 재작성** |
| 사업자 정보 (3곳) | MONK STUDIO / 636-15-00574 | JP 법인 정보 | 확정 필요 |

#### 기능 분기

| 기능 | KR | JP | 변경 |
|------|----|----|------|
| 로그인 프로바이더 | 카카오 + Google + LINE | **LINE + Google** (카카오 제거) | config.js KAKAO_* 제거 |
| SNS 이벤트 | 텔레그램 연동 100c | LINE 공유? | 이벤트 채널 변경 |
| CS 채널 | 텔레그램 @monkos_support_bot | LINE CS? | thankyou.html 변경 |
| 인화 서비스 | '몽크사진관 공식 채널' | JP 대응 채널 | 미정 |

### 1-5. 사용자 미노출 (번역 불필요) — 15개+

- `Monk.log()` 개발자 로그 메시지
- `console.error()` 디버그 메시지
- 코드 주석

---

## 2. CS 챗봇 분기 전략

### 2-1. 현행 챗봇 아키텍처

```
[포털 통합 엔진: chat-engine.js]

CHANNEL_CONFIG:
├─ 'web'          → SYSTEM_PROMPT (일본어 기반, 글로벌)
├─ 'telegram'     → CS_SYSTEM_PROMPT (다국어 CS)
├─ 'prep'         → PREP_SYSTEM_PROMPT
├─ 'coaching'     → COACHING_INSTRUCTIONS (stateless)
├─ 'qc'           → QC 전용 (stateless, JSON)
├─ 'kakao'        → SYSTEM_PROMPT + KR 마커
├─ 'idphoto-kr'   → SYSTEM_PROMPT_KR (한국어 전용)
└─ 'idphoto-jp'   → ❌ 미등록
```

**핵심 발견**:
- `idphoto-jp` 채널이 CHANNEL_CONFIG에 **존재하지 않음**
- JP는 독립 서버(`idphoto-jp/server.js`)로 운영 중, 포털 챗봇 미연동
- 포털 기본 프롬프트(SYSTEM_PROMPT)는 일본어 기반이나, KR 전용 프롬프트(SYSTEM_PROMPT_KR)는 별도 존재

### 2-2. 방안 비교 (작가님 관심사항)

#### 방안 A: 채널 분기 (서브도메인 기반) — **권장**

```
[구현]
CHANNEL_CONFIG에 'idphoto-jp' 추가:
  systemPrompt: SYSTEM_PROMPT (기존 일본어 프롬프트)
  temperature: 0.7
  logCollection: 'idphoto_jp_conversations'

라우팅: 프론트엔드에서 channel='idphoto-jp' 명시 → 포털 API 호출
```

| 항목 | 평가 |
|------|------|
| 구현 난이도 | **낮음** — CHANNEL_CONFIG에 5줄 추가 |
| 프롬프트 분리 | ✅ KR/JP 각각 전용 프롬프트 |
| RAG 분기 | 채널별 언어 필터 추가 가능 |
| 대화 기록 | 컬렉션 분리 (`idphoto_kr_conversations` / `idphoto_jp_conversations`) |
| CS 품질 | ✅ 단일 엔진 — 지식 공유, 품질 일관 |
| 관리 부담 | 낮음 — 프롬프트만 분리, 엔진/RAG 공유 |

#### 방안 B: IP 기반 분기

| 항목 | 평가 |
|------|------|
| 구현 난이도 | 중간 — GeoIP 라이브러리 + 판별 로직 |
| 정확도 | ❌ VPN, 해외 교포, 여행자 오판 |
| 유지보수 | GeoIP DB 갱신 필요 |
| CS 품질 | 보통 — 오판 시 잘못된 언어 응답 |

> **비추천**: 정확도 이슈로 사용자 경험 저하 위험

#### 방안 C: 별도 봇 분리

| 항목 | 평가 |
|------|------|
| 구현 난이도 | 높음 — 봇 이원화, RAG 이중 유지 |
| 독립성 | ✅ 완전 독립 |
| CS 품질 | ❌ 작가님 우려: "cs 상 좋은것은 아닐듯" |
| 관리 부담 | 높음 — 지식 동기화, 프롬프트 이원 관리 |

> **비추천**: CS 품질 저하 + 관리 부담 이중화

### 2-3. 추천안: 방안 A (채널 분기)

**근거**:
1. **구현 최소**: CHANNEL_CONFIG 5줄 + 프론트엔드 channel 파라미터 1개
2. **CS 품질 유지**: 단일 엔진으로 일관된 품질, 지식 공유
3. **확장성**: 향후 ZH(중국어) 등 추가 시 동일 패턴
4. **작가님 의견 반영**: 별도 봇 분리의 CS 우려 해소

**구현 스케치**:

```javascript
// chat-engine.js — CHANNEL_CONFIG 추가
'idphoto-jp': {
  systemPrompt: SYSTEM_PROMPT,  // 기존 일본어 프롬프트
  temperature: 0.7,
  maxOutputTokens: 500,
  historyMap: chatHistories,
  historyTTL: 30 * 60 * 1000,
  maxHistory: 20,
  logCollection: 'idphoto_jp_conversations',
}
```

```javascript
// JP 프론트엔드 챗봇 호출 시
fetch('https://monkos.ai/api/chat', {
  body: JSON.stringify({
    message: userInput,
    sessionId: userId,
    channel: 'idphoto-jp'  // ← 이것만 변경
  })
});
```

---

## 3. RAG 지식 분기

### 3-1. 현행 cs_knowledge 카테고리

| 문서ID | 카테고리 | KR/JP 공통 | 분기 필요 |
|--------|---------|-----------|----------|
| credit_system | billing | ✅ 공통 (양쪽 크레딧) | — |
| credit_purchase | billing | — | ✅ KR: 토스 / JP: Lemon Squeezy |
| refund_policy | billing | ✅ 공통 (엄격 기준) | — |
| photo_quality | service | ✅ 공통 (촬영 기술) | — |
| login_issue | technical | — | ✅ KR: 카카오+Google / JP: LINE+Google |
| service_urls | general | — | ✅ 도메인별 URL |
| account_deletion | general | ✅ 공통 | — |
| prep_passport | prep_guide | ✅ 공통 (한·일 규격 명시) | — |
| prep_resume | prep_guide | ✅ 공통 | — |
| prep_student | prep_guide | ✅ 공통 | — |
| prep_baby | prep_guide | ✅ 공통 | — |
| law_japan_refund | legal_japan | — | ✅ JP 전용 |
| brand_story | brand | ✅ 공통 | — |

**공통 7개 / 분기 필요 4개 / JP 전용 1개**

### 3-2. 분기 방식 권장: 문서에 language 필드 추가

| 방안 | 장점 | 단점 | 권장 |
|------|------|------|------|
| **language 필드 추가** | 단일 컬렉션 유지, 필터만 추가 | 문서 수 증가 | **✅** |
| 컬렉션 분리 (cs_knowledge_kr/jp) | 완전 독립 | 공통 지식 이중 관리 | ❌ |
| 프롬프트 내 조건 분기 | 코드 변경 없음 | 프롬프트 복잡도 증가 | △ |

**구현**:
```javascript
// cs_knowledge 문서 구조 확장
{
  id: 'credit_purchase',
  title: '크레딧 구매 방법',
  language: 'ko',        // ← 신규 필드 ('ko' | 'ja' | null=공통)
  content: '토스페이먼츠를 통해...',
  keywords: ['충전', '결제', '토스'],
  category: 'billing'
}

// rag.js 검색 필터 추가
function searchCsKnowledge(query, lang = null) {
  return scored
    .filter(d => !d.language || d.language === lang)  // 공통 + 해당 언어만
    .filter(d => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
```

### 3-3. JP 전용 지식 추가 목록

| 문서ID | 제목 | 카테고리 | 내용 |
|--------|------|---------|------|
| credit_purchase_jp | クレジット購入方法 | billing | Lemon Squeezy 결제 안내 |
| login_issue_jp | ログイン問題 | technical | LINE + Google 로그인 |
| service_urls_jp | サービスURL | general | idphoto-jp.monkos.ai |
| law_refund_jp | 返金ポリシー | legal_japan | 特定商取引法 기반 |

---

## 4. 포털 진입 분기

### 4-1. 현행 포털 구조 (portal/public/index.html)

```
포털 메인 (monkos.ai)
├─ 언어 드롭다운: 🇯🇵 日本語 / 🇺🇸 English / 🇰🇷 한국어
├─ 지역 버튼: 🇰🇷 KR ← 클릭 시 region='kr' 설정
├─ 메인 CTA: "AI 증명사진 생성 시작"
│   ├─ region=kr → https://idphoto-kr.monkos.ai/app
│   └─ region=jp → https://idphoto-jp.monkos.ai/app
├─ 로그인:
│   ├─ region=kr → 카카오/Google 선택 모달
│   └─ 기본 → Google 바로 진행
└─ 챗봇:
    └─ channel='web' → SYSTEM_PROMPT (일본어)
    (region에 따른 챗봇 채널 분기 없음)
```

### 4-2. 개선 필요 사항

| 현행 | 개선 | 우선순위 |
|------|------|----------|
| 챗봇이 region 무시 (항상 'web') | region='kr' → channel='web-kr' 분기 | P1 |
| CTA 링크만 region별 분기 | 충전/정책 링크도 region별 분기 | P2 |
| hreflang 태그 있음 | 유지 (SEO 정상) | — |

### 4-3. JP 사용자 진입 동선 (KR 클론 후)

```
[현행 JP 사용자 동선]
idphoto-jp.monkos.ai → 독립 서버 (v0.79) → 챗봇 없음

[KR 클론 후 JP 사용자 동선]
1. monkos.ai (포탈) → region=jp → idphoto-jp.monkos.ai/app
2. idphoto-jp.monkos.ai → KR 코드 클론 (현지화 적용)
   ├─ 챗봇: channel='idphoto-jp' → 포탈 API 호출
   ├─ 결제: Lemon Squeezy
   ├─ 로그인: LINE + Google
   └─ 법적 페이지: JP 버전
```

---

## 5. 현행 JP (idphoto-jp) vs KR 구조 비교

| 항목 | idphoto-kr | idphoto-jp (현행 v0.79) |
|------|-----------|------------------------|
| 프레임워크 | Express | HTTP createServer |
| 코칭 모델 | gemini-2.0-flash-live-preview | 동일 |
| 생성 모델 | gemini-3-pro-image-preview | 동일 |
| QC | 있음 | 있음 |
| 챗봇 | 포탈 API 연동 | ❌ 없음 |
| 결제 | 토스페이먼츠 | Lemon Squeezy |
| 로그인 | 카카오 + Google + LINE | LINE + Google |
| 준비실 (prep) | 9필드 퍼널 | 간소화 버전 |
| 다국어 | 한국어 고정 | 일본어 고정 |
| 법적 페이지 | terms/refund/privacy/credits-policy | terms/refund/privacy (JP법) |

> KR 클론 시 **서버 구조(Express)가 JP에 없으므로** JP 서버도 Express로 전환하거나, KR 서버 코드를 JP에 이식해야 함.

---

## 6. 종합 로드맵

### Phase 1: 즉시 구현 가능 (1~2일)

| 작업 | 파일 | 난이도 |
|------|------|--------|
| CHANNEL_CONFIG에 'idphoto-jp' 추가 | chat-engine.js | 5줄 |
| cs_knowledge에 language 필드 추가 | seed 스크립트 | 마이그레이션 |
| searchCsKnowledge()에 언어 필터 | rag.js | 3줄 |

### Phase 2: TX/LABELS 번역 (2~3일)

| 작업 | 파일 | 항목 수 |
|------|------|---------|
| TX_JP 객체 작성 | config.js | 25키 |
| LABELS_JP 객체 작성 | prep.js | 40키 |
| 호스트 기반 언어 분기 | config.js | 조건 1개 |

### Phase 3: 결제/인증 분기 (3~5일)

| 작업 | 파일 | 비고 |
|------|------|------|
| buyCreditsJP() 함수 구현 | shared.js | Lemon Squeezy SDK |
| 카카오 로그인 제거 (JP) | config.js + index.html | KAKAO_* 삭제 |
| JP 가격 체계 설정 | config.js | CHARGE_OPTIONS_JP |

### Phase 4: HTML 현지화 (5~7일)

| 작업 | 파일 수 | 비고 |
|------|---------|------|
| index.html JP 버전 | 1 | 마케팅 텍스트 번역 + 가격 변경 |
| charge.html JP 버전 | 1 | Lemon Squeezy UI |
| thankyou.html JP 버전 | 1 | CS 채널 변경 |
| 기타 UI (camera, result 등) | 3 | TX 객체 기반 자동 전환 |

### Phase 5: 법적 페이지 (별도 일정)

| 작업 | 비고 |
|------|------|
| terms-jp.html | 特定商取引法 + 消費者契約法 기반 |
| refund-jp.html | 日本 환불 규정 |
| privacy-jp.html | APPI 준거 |
| credits-policy-jp.html | JP 크레딧/결제 정책 |

> 법적 페이지는 **법무 검토 필수**. 막내 단독 작성 불가.

---

## 7. 핵심 요약

### 챗봇 분기: **방안 A (채널 분기) 권장**

- 단일 엔진 유지, CHANNEL_CONFIG에 'idphoto-jp' 5줄 추가
- KR/JP 프롬프트 분리 + RAG 언어 필터
- CS 품질 일관성 유지 (작가님 우려 해소)
- 구현 난이도 최소 (5줄 + 3줄)

### UX 멘트 분기: **TX/LABELS 이원화 우선**

- TX 25개 + LABELS 40개 = 65개 키만 번역하면 앱 핵심 UX 전환 완료
- 호스트 기반 자동 분기 (`hostname.includes('jp')`)
- HTML 하드코딩 텍스트는 Phase 4에서 처리

### 법적 페이지: **완전 재작성 필요**

- 4개 페이지 × JP 법률 기반 재작성
- 법무 검토 필수 — 에이전트 단독 완성 불가
- 사업자 정보 확정 후 진행

---

*본 보고서는 코드 수정 없이 현행 분석 및 전략 설계만 수행한 것입니다.*

---
type: order
date: 2026-05-25
from: iMac/쌍아
to: iMac/막내1
status: 대기
subject: 챗봇 통합 설계 보고서 — 현황 감사 + RAG 설계 + 전체 구성도
---

# 지시서: 챗봇 통합 설계 보고서 (1/2) — 현황 감사 + RAG 설계 + 전체 구성도

## 배경

monk.kr(Gemma 3 → Gemma 4 전환 예정)과 monkos.ai(Gemini 2.0 → 통합 예정) 챗봇을 CF Workers AI 기반으로 통합한다. 이를 위해 현황 전수 조사 + 통합 RAG 설계 + 전체 챗봇 구성도가 필요하다.

**최종 방향**: CF Workers AI(Gemma 4 26B MoE) + D1(RAG 지식) 단일 엔진으로 통합. monkos.ai(Cloud Run)에서도 이 Workers 엔진을 호출하는 구조.

## Task 1: 전체 챗봇 구성도 제시

현재 가동 중인 모든 챗봇 채널을 조사하여 구성도를 작성하라.

### 조사 대상 파일
- `monkos_AI/portal/lib/chat-engine.js` — 통합 엔진 (CHANNEL_CONFIG)
- `monkos_AI/portal/lib/telegram.js` — 텔레그램 CS봇 + 이벤트봇
- `monkos_AI/portal/lib/telegram-team.js` — 팀봇 (내부용)
- `monkos_AI/portal/lib/kakao-chatbot.js` — 카카오 채널
- `monkos_AI/portal/lib/line-chatbot.js` — LINE 메신저
- `monkos_AI/portal/lib/coaching.js` — 멀티모달 코칭/QC
- `monkos_AI/portal/server.js` — Express 라우트
- `functions/api/chat.js` — monk.kr CF Pages 챗봇
- `MONK_kr/index.html` — monk.kr 프론트 채팅 패널
- `monkos_AI/portal/public/js/chat.js` — monkos.ai 프론트 채팅

### 구성도 포함 항목
각 채널별:
1. 채널명 + 플랫폼 (웹/텔레/카카오/LINE)
2. 현재 모델 + 인프라
3. RAG 사용 여부
4. 대화 기록 저장 방식
5. 시스템 프롬프트 출처
6. API 엔드포인트 / 웹훅 URL
7. 상태 (정상 운영 / 미확인 / 비활성)

**산출물**: 마크다운 테이블 + 아키텍처 다이어그램 (텍스트)

## Task 2: RAG 지식 현황 감사 — 배치되는 내용 찾기

현재 RAG에 들어있는 지식이 실제 서비스 현황과 배치되는 항목을 전수 조사하라.

### 조사 대상
- `monkos_AI/portal/seed_cs_knowledge.js` (171줄) — CS 일반 지식
- `monkos_AI/portal/seed_cs_legal.js` (289줄) — 법률/환불
- `monkos_AI/portal/seed_cs_brand_story.js` (114줄) — 브랜드 스토리
- `monkos_AI/portal/seed_cs_prep.js` (97줄) — 촬영 준비
- `monkos_AI/portal/public/admin/data/episode_catalog.json` — 에피소드 카탈로그
- `monkos_AI/portal/lib/prompts.js` — 시스템 프롬프트 (가격, 서비스 목록, 할루시네이션 차단)
- `functions/api/chat.js` — monk.kr 시스템 프롬프트

### 교차 확인 기준
아래 항목과 대조하여 **불일치 목록** 작성:
1. 가격/크레딧 단가 — `prompts.js`의 PRICING 객체 vs seed 데이터 vs 실서비스
2. 서비스 URL — 실제 접속 가능 여부 (idphoto-kr, idphoto-jp, crop, specs 등)
3. 몽크사진관 정보 — 주소, 전화, 영업시간, 서비스 메뉴
4. 몽코스 AI 서비스 범위 — 출시된 기능 vs 시스템 프롬프트 안내 범위
5. 환불 정책 — seed_cs_legal vs 실제 약관 페이지
6. 브랜드 스토리 — 현재 사업 구조와 맞는지

**산출물**: 불일치 항목 테이블 (파일, 항목, 현행 내용, 실제 현황, 수정 제안)

## Task 3: 통합 RAG 설계 — CF D1 기반

monk.kr + monkos.ai 통합 챗봇의 RAG 지식 체계를 D1 기반으로 설계하라.

### 포함해야 할 지식 카테고리
1. **서비스 안내** — 몽크사진관(오프라인) + MONKOS AI(온라인) 개념 구분 + 연결
2. **가격/크레딧** — KR/JP 각각
3. **증명사진 규격 DB** — `apps/MonkosCrop/MonkosCrop/Resources/countries.jsonl` (202개국, 여권/비자/면허 등). 이 데이터를 D1로 이관하여 챗봇이 규격 질문에 즉시 응답하도록 설계
4. **촬영 가이드** — 준비/코칭/QC
5. **법률/환불** — 이용약관, 환불 정책
6. **브랜드 스토리** — 20년 사진작가, MONK STUDIO 히스토리
7. **FAQ** — 채널별 자주 묻는 질문

### 설계 산출물
- D1 테이블 스키마 (테이블명, 컬럼, 인덱스)
- 검색 알고리즘 설계 (현행 BM25 대비 개선안)
- 데이터 시딩 전략 (기존 Firestore seed → D1 마이그레이션 방안)
- 202개국 규격 데이터의 RAG 활용 설계 (전체 덤프 vs 검색 기반 조회)

## Task 4: 몽크사진관 vs MONKOS AI 개념 정리

챗봇이 두 브랜드를 정확히 설명할 수 있도록 개념 정리 문서를 작성하라.

### 정리 항목
- **몽크사진관 (MONK STUDIO)**: monk.kr, 오프라인 사진관, 하남 미사, 방문 촬영
- **MONKOS AI**: monkos.ai, 온라인 AI 증명사진 플랫폼, 몽크사진관 노하우 기반
- **둘의 관계**: 같은 대표(신정규), 오프라인 노하우 → AI 서비스화
- **크롭앱**: monkos.ai/crop, 무료 도구, 독립 서비스
- **증명사진 규격 DB**: monkos.ai/specs, 정보 제공

## 보고 형식

```
REPORT_20260525_막내1_챗봇통합_현황감사_RAG설계.md
```

배치: `monkos-ops/ops/reports/2026-05/`

YAML frontmatter:
```yaml
type: report
date: 2026-05-25
device: iMac
agent: 막내1
subject: 챗봇 통합 설계 보고서 — 현황 감사 + RAG 설계 + 전체 구성도
```

## ⚠️ 준수 조항
- 헌법 4조 3항: 내부 기술명(Gemini, Imagen 등) 비공개. RAG 지식에도 적용.
- 헌법 4조 4항: "되는 것만 응답" 원칙 — 미출시 기능 RAG 등록 금지.
- ch7 3조: 지시서 범위 밖 작업 금지. 코드 수정 없이 조사+설계만 수행.

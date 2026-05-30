---
type: order
date: 2026-05-25
from: iMac/쌍아
to: iMac/막내1
status: 대기
subject: D1 스키마 생성 + RAG 지식 시딩 + 대화 로그 테이블 — 챗봇 통합 Phase 2
portfolio: PF_CHATBOT
---

# 지시서: D1 스키마 생성 + RAG 지식 시딩 — 챗봇 통합 Phase 2

## 배경

monk.kr + monkos.ai 챗봇을 CF Workers AI(Gemma 4) + D1 단일 엔진으로 통합한다.
Gemma 3 12B 폐기 5/30, Gemini 2.0 EOL 6/1 — 이번 주 완료 필수.

본 지시서는 **D1 데이터 레이어** 구축을 담당한다. 막내2가 동시에 Workers 엔진을 구현하며, 이 D1 스키마/데이터를 사용한다.

## 선행 참조

반드시 먼저 읽을 것:
- `monkos-ops/ops/reports/2026-05/REPORT_20260525_막내1_챗봇통합_현황감사_RAG설계.md` — 본인이 작성한 설계 보고서. D1 스키마, 불일치 12건, 브랜드 개념 정리 포함.

## Task 1: D1 스키마 생성

기존 `monk-db` (wrangler.toml에 바인딩 있음)에 아래 테이블 추가.

### 1-1. `rag_knowledge` — RAG 지식

```sql
CREATE TABLE IF NOT EXISTS rag_knowledge (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    locale TEXT NOT NULL DEFAULT 'ko',
    title TEXT NOT NULL,
    keywords TEXT NOT NULL,
    content TEXT NOT NULL,
    priority INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_rag_cat ON rag_knowledge(category, locale);
```

### 1-2. FTS5 가상 테이블

```sql
CREATE VIRTUAL TABLE IF NOT EXISTS rag_knowledge_fts USING fts5(
    title, keywords, content,
    content='rag_knowledge',
    content_rowid='rowid'
);
```

### 1-3. `chat_logs` — 대화 로그 (Firestore 대체)

```sql
CREATE TABLE IF NOT EXISTS chat_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    channel TEXT NOT NULL,
    role TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_logs_session ON chat_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_logs_channel ON chat_logs(channel, created_at);
```

90일 초과 데이터 정리는 추후 cron으로 처리. 지금은 테이블 생성만.

### 실행 방법

```bash
wrangler d1 execute monk-db --file=migrations/chatbot_schema.sql
```

`migrations/` 폴더가 없으면 생성. SQL 파일로 작성하여 Git 추적.

## Task 2: RAG 지식 시딩

기존 Firestore seed 4종의 데이터를 D1 INSERT로 변환. **보고서 Task 2의 불일치 12건을 반영하여 수정된 데이터로 시딩.**

### 2-1. 수정 반영 사항 (HIGH/MED만 필수)

| # | 항목 | 수정 내용 |
|---|------|----------|
| 1 | 영업시간 | "평일" → "월·수~토 11:00~19:30 / 일 11:00~19:00 / 화요일 정기휴무" |
| 2 | 할인율 | "최대 30%" → "패키지 구매 시 보너스 크레딧 포함 최대 50% 이상 할인" |
| 3 | PT 시스템 | 고객용 지식에서 PT 시스템 항목 제거 |
| 4 | 추가 크레딧 | extra_crop 10c, full_original 10c 명시 추가 |
| 5 | SEO 지역 | "강남" → "하남 미사" |
| 6 | 대표 실명 | 고객용 지식에서 실명 제거 → "20년 경력 사진작가" |
| 7 | 운영 기간 | "10년" → "12년" |
| 8 | 서비스 URL | /specs, /crop, /blog 등 누락 URL 추가 |

### 2-2. 브랜드 개념 구분 — 신규 지식 추가

아래 내용을 `rag_knowledge`에 신규 등록. 채널별 응답 혼동 방지용.

```
id: brand_concept_monk
category: brand
locale: ko
title: 몽크사진관 (MONK STUDIO) 소개
content:
몽크사진관은 경기도 하남시 미사 그랑파사쥬 B1029호에 위치한 오프라인 사진관입니다.
20년 경력 사진작가가 직접 운영하며 증명사진, 프로필, 가족사진 등을 촬영합니다.
영업시간: 월·수~토 11:00~19:30 / 일 11:00~19:00 / 화요일 정기휴무
예약: 네이버 간편예약, 전화(031-791-5030), 당일 방문 가능
교통: 5호선 미사역 연결 (그랑파사쥬 B동)
사이트: monk.kr
```

```
id: brand_concept_monkos
category: brand
locale: ko
title: MONKOS AI 소개
content:
MONKOS AI는 몽크사진관(MONK STUDIO)이 개발한 온라인 AI 증명사진 플랫폼입니다.
사진관 20년 노하우를 AI에 녹여 실시간 촬영 코칭, AI 사진 생성, 품질 검수를 제공합니다.
한국어: idphoto-kr.monkos.ai/app / 일본어: idphoto-jp.monkos.ai/app
무료 크롭앱: monkos.ai/crop / 증명사진 규격 DB: monkos.ai/specs (202개국)
사이트: monkos.ai
```

```
id: brand_concept_relation
category: brand
locale: ko
title: 몽크사진관과 MONKOS AI의 관계
content:
몽크사진관(오프라인)과 MONKOS AI(온라인)는 같은 대표가 운영합니다.
몽크사진관의 촬영 품질 기준이 MONKOS AI의 AI 보정 기준이 됩니다.
오프라인 노하우를 AI로 서비스화한 것이 MONKOS AI입니다.
방문 촬영을 원하면 → monk.kr (몽크사진관)
온라인 AI 증명사진을 원하면 → monkos.ai (MONKOS AI)
몽크사진관 ≠ AI 서비스. MONKOS AI ≠ 사진관. 혼동 금지.
```

위 3건은 ja, en 버전도 각각 작성 (locale: ja, en). 총 9건.

### 2-3. 다국어 대응

기존 seed 데이터 28건은 대부분 ko 기반이나 일부 다국어 키워드 포함.
D1 이관 시 locale별로 분리:
- 원본 ko 유지
- 주요 항목(크레딧, 환불, 서비스 안내, 브랜드 소개) → ja, en 번역 버전 추가
- 법률은 이미 국가별 분리되어 있으므로 그대로

### 2-4. 202개국 규격 DB

기존 D1 `documents` + `countries` 테이블에 이미 있음 (countries.jsonl에서 이관 완료).
**별도 이관 불필요.** 챗봇 엔진에서 기존 테이블을 직접 쿼리하면 됨.
→ 막내2에게 쿼리 인터페이스만 전달하면 됨.

### 2-5. 시딩 스크립트

`migrations/seed_rag.sql` 파일로 작성. 실행:

```bash
wrangler d1 execute monk-db --file=migrations/seed_rag.sql
```

## Task 3: FTS5 인덱스 동기화 트리거

```sql
CREATE TRIGGER IF NOT EXISTS rag_ai AFTER INSERT ON rag_knowledge BEGIN
    INSERT INTO rag_knowledge_fts(rowid, title, keywords, content)
    VALUES (new.rowid, new.title, new.keywords, new.content);
END;

CREATE TRIGGER IF NOT EXISTS rag_ad AFTER DELETE ON rag_knowledge BEGIN
    INSERT INTO rag_knowledge_fts(rag_knowledge_fts, rowid, title, keywords, content)
    VALUES ('delete', old.rowid, old.title, old.keywords, old.content);
END;

CREATE TRIGGER IF NOT EXISTS rag_au AFTER UPDATE ON rag_knowledge BEGIN
    INSERT INTO rag_knowledge_fts(rag_knowledge_fts, rowid, title, keywords, content)
    VALUES ('delete', old.rowid, old.title, old.keywords, old.content);
    INSERT INTO rag_knowledge_fts(rowid, title, keywords, content)
    VALUES (new.rowid, new.title, new.keywords, new.content);
END;
```

## 산출물

1. `migrations/chatbot_schema.sql` — 테이블 생성 DDL
2. `migrations/seed_rag.sql` — RAG 지식 시딩 (수정 반영 + 브랜드 개념 + 다국어)
3. D1 실행 완료 확인
4. 완료 보고서: `monkos-ops/ops/reports/2026-05/REPORT_20260525_막내1_D1_RAG시딩.md`

## ⚠️ 준수 조항
- 헌법 4조 3항: RAG 지식에 내부 기술명(Gemini, Imagen 등) 절대 포함 금지. "MONKOS AI", "독자 AI 엔진"으로만 표현.
- 헌법 4조 4항: 미출시 기능 RAG 등록 금지. "되는 것만 응답" 원칙.
- 헌법 3조 2항: 완료 시 세션 로그 어펜드 + 커밋.
- 필명·본명 분리: 고객용 데이터에 대표 실명 사용 금지.

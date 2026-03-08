---
type: ORDER
date: 2026-03-01
from: iMac/쌍아
to: 막내 (배정 대기)
priority: P1
scope: DB 조사 (코드 수정 금지)
---

# 지시서: 결제 전환율 및 사용자 퍼널 데이터 조사

> **[2026-03-01 12:30 KST] iMac/쌍아 → 막내**
> **목적**: 과금 체계 재설계 + 정책자금 심사(강한소상공인 PT, 중진공 3회차)를 위한 실데이터 추출
> **범위**: Firestore `users`, `payments` 컬렉션 + D1 거래원장 조회
> **제약**: READ ONLY — 코드 수정, DB 변경 절대 금지

---

## 1. 추출 항목

### A. 가입자 현황

| # | 지표 | 조회 방법 |
|---|------|----------|
| A1 | **총 가입자 수** | `users` 컬렉션 문서 수 |
| A2 | **채널별 분포** | `provider` 필드 기준 (kakao / google / line) 각 수 |
| A3 | **일별 가입 추이** | `createdAt` 기준 일별 집계 (최근 30일) |
| A4 | **현재 평균 크레딧 잔액** | `credits` 필드 평균값 |

### B. 결제 전환율 (핵심)

| # | 지표 | 조회 방법 |
|---|------|----------|
| B1 | **결제 경험자 수** | `lastPurchase` 필드가 존재하는 사용자 수 |
| B2 | **결제 전환율** | B1 / A1 × 100% |
| B3 | **비로그인 직결제 건수** | `payments` 컬렉션 문서 수 |
| B4 | **총 결제 금액** | `payments` 컬렉션의 `amount` 합산 + 로그인 결제 포함 |

### C. 이벤트 참여 현황

| # | 지표 | 조회 방법 |
|---|------|----------|
| C1 | **가입보너스 수령자** | `events.signup_bonus` 존재하는 사용자 수 |
| C2 | **텔레그램 가입 이벤트** | `events.telegram_join` 존재하는 사용자 수 |
| C3 | **카카오채널 이벤트** | `events.kakao_channel_add` 존재하는 사용자 수 |
| C4 | **미션 완료자** | `events.mission_complete` 존재하는 사용자 수 |
| C5 | **이벤트 참여율** | (C2+C3) / A1 × 100% |

### D. 서비스 사용 현황

| # | 지표 | 조회 방법 |
|---|------|----------|
| D1 | **총 생성 횟수** | D1 거래원장에서 `type='use'` AND description에 'generate' 포함 |
| D2 | **총 다운로드 횟수** | D1 거래원장에서 `type='use'` AND description에 'download' 포함 |
| D3 | **생성→다운로드 전환율** | D2 / D1 × 100% |
| D4 | **1인당 평균 생성 횟수** | D1 / A1 |

---

## 2. 조회 방법

### Firestore 조회

```bash
# 프로젝트 설정 확인
gcloud config set project monkos

# users 컬렉션 전체 조회 (JSON)
gcloud firestore documents list --collection-id=users --format=json

# payments 컬렉션 전체 조회
gcloud firestore documents list --collection-id=payments --format=json
```

### D1 거래원장 조회

- D1 엔드포인트: 환경변수 `TX_API_URL` 확인 (portal 서버 코드 참조)
- 또는 Cloudflare Dashboard > D1 > SQL 직접 쿼리

### 주의사항

- `gcloud firestore documents list`는 기본 20건 → `--limit=1000` 이상 지정
- 문서 수가 1000건 이상이면 `--page-size` + pagination 필요
- D1 조회가 어려우면 Firestore 데이터만으로 B1~B3, C1~C5 먼저 추출

---

## 3. 산출물

보고서 파일: `monkos-ops/ops/reports/REPORT_20260301_막내_결제전환율_DB조사.md`

### 보고서 형식

```markdown
## 결제 전환율 DB 조사 보고서

### A. 가입자 현황
- 총 가입자: N명
- 카카오: N명 / 구글: N명 / 라인: N명
- 일별 가입 추이: (표)
- 평균 크레딧 잔액: Nc

### B. 결제 전환율
- 결제 경험자: N명
- 전환율: N%
- 비로그인 직결제: N건
- 총 결제 금액: ₩N

### C. 이벤트 참여
- 가입보너스: N명
- 텔레그램: N명 / 카카오채널: N명
- 미션 완료: N명
- 이벤트 참여율: N%

### D. 서비스 사용
- 총 생성: N회 / 총 다운로드: N회
- 생성→다운로드 전환율: N%
- 1인당 평균 생성: N회

### 원본 데이터
(필요 시 JSON 첨부)
```

---

## ⚠️ 준수 조항

- **헌법 제6조 (인프라 보호)**: DB 읽기 전용. 쓰기/수정/삭제 절대 금지
- **헌법 제8조 (파괴적 명령 금지)**: DROP, DELETE, UPDATE 쿼리 금지
- **헌법 제2조 (완료 보고)**: 보고서 작성 후 `✅❌💡⏳📁🔀` 형식 보고

---

**[2026-03-01 12:30 KST] iMac/쌍아 발행**

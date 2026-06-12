---
type: order
date: 2026-06-12
from: iMac/쌍아
to: iMac/막내1
subject: "[긴급] AUTH_SECRET 역순 추적 — 언제 누가 뭘 바꿨고 왜 감지 못했는지"
status: 대기
portfolio: PF_IDPHOTO
priority: P0
---

# 지시서 — AUTH_SECRET 역순 추적

> **[2026-06-12 18:30 KST]** iMac/쌍아 → iMac/막내1
> 장애 전수조사 A 후속. 작가님 지시: "역순으로 뭘 어떻게 하다가 틀어졌는지 찾아내라"

---

## 임무

AUTH_SECRET의 **생애 타임라인**을 커밋·배포·환경변수 3축으로 완전 복원하라. "안전하다고 삭제하거나 뒤튼 것"이 어느 시점에 어떤 판단으로 이루어졌고, 왜 사전에 장애를 감지하지 못했는지.

## 추적 대상

### 1. 코드 타임라인

AUTH_SECRET이 등장하는 모든 커밋을 시간순 나열:

```bash
git log --all --oneline --diff-filter=ACMR -S "AUTH_SECRET" -- '*.js' '*.sh'
```

각 커밋별:
- 날짜·작성자·지시서(있으면)
- **무엇을 바꿨는지** (1줄 요약)
- **의도** (커밋 메시지·지시서에서 추출)

### 2. 토큰 서명 키 변천

auth.js에서 토큰 서명에 사용하는 키의 변천:

| 시점 | 서명 키 | 폴백 | 근거 커밋 |
|------|--------|------|----------|
| 초기 | ? | ? | ? |
| 쿠키 단일화 | ? | ? | 6f0aee64? |
| 보안 패치 | ? | ? | 5715fd96? |
| --set-secrets 전환 | ? | ? | 9606ee45? |

**핵심 질문**: 기존 유저 토큰이 어떤 키로 서명됐고, 현재 portal이 어떤 키로 검증하는지. 불일치가 있으면 **언제부터** 불일치가 시작됐는지.

### 3. 배포 타임라인

```bash
gcloud run revisions list --service=monkos-portal --project=monkos --region=us-central1 --limit=10
gcloud run revisions list --service=monkos-idphoto-kr --project=monkos --region=us-central1 --limit=10
```

각 배포별:
- rev 번호·배포 시각
- 어느 커밋 기반인지
- AUTH_SECRET 주입 방식 (plaintext vs Secret Manager ref)
- **AUTH_SECRET 값이 바뀌었을 가능성이 있는 배포** 특정

### 4. 환경변수 전환 추적

`9606ee45` (deploy.sh --set-secrets 전환):
- 이전: `--update-env-vars AUTH_SECRET=값` (plaintext)
- 이후: `--set-secrets AUTH_SECRET=AUTH_SECRET:latest` (Secret Manager)
- **이 전환 시 Secret Manager에 저장된 값과 기존 plaintext 값이 같았는지**
- `gcloud secrets versions access latest --secret=AUTH_SECRET --project=monkos` → 값 자체는 보지 말고, **버전 히스토리** 확인:
  ```bash
  gcloud secrets versions list AUTH_SECRET --project=monkos
  ```
  생성 일자로 "언제 누가 넣었는지" 추적

### 5. 감지 실패 분석

- 보안 패치 지시서에 "배포 영향도 분석" 항목이 있었는지
- 배포 시 기존 세션 무효화를 체크하는 절차가 있었는지
- 이 장애를 사전에 감지할 수 있었던 방법은 무엇이었는지

## 산출물

`monkos-ops/ops/reports/2026-06/REPORT_20260612_iMac막내1_긴급_AUTH_SECRET_역순추적.md`

타임라인 테이블 + 감지 실패 분석 포함.

## ⚠️ 준수 조항

- **헌법 4조 1항**: AUTH_SECRET **값** 조회/보고 절대 금지. 버전 번호·생성 일자·주입 방식만.
- 읽기 전용.

## 커밋 메시지

```
[research] AUTH_SECRET 역순 추적 — 생애 타임라인 + 감지 실패 분석
```

---
type: order
date: 2026-06-12
from: iMac/쌍아
to: iMac/막내3
subject: "GCP 전수조사 C — Cloud Run 런타임 SA 맵 + 프로젝트 종료 판정"
status: 대기
portfolio: PF_SECURITY
---

# 지시서 — GCP 전수조사 C: Cloud Run 런타임 SA 맵 + 프로젝트 종료 판정

> **[2026-06-12 11:55 KST]** iMac/쌍아 → iMac/막내3
> 원본: `ORDER_20260612_웹민아_막내들_SECURITY_GCP전수정밀조사.md` (웹민아 기안, 쌍아 보정·분할)
> 작가님 직접 지시(②경로). 3건 분할의 C건.

---

## 배경

monkos 본진 Compute 기본 SA가 편집자 권한 보유 (초과권한 11660/11666 = **6개만 실사용**). 축소하려면 Cloud Run 11개 서비스가 어떤 SA로 구동되는지 맵이 선행 필요.

또한 유휴 프로젝트(startMONK·monkos-aistudio) 종료 판정을 위한 잔존 리소스 최종 확인.

세션 로그 참조: `monkos-ops/ops/sessions/2026-06/2026-06-12_웹_민아_수동.md`

## 담당 Task

### Task 4 — Cloud Run 런타임 SA 의존성 맵

monkos 프로젝트 Cloud Run 서비스 11개 각각:

```bash
gcloud run services describe {서비스명} \
  --project=monkos --region=asia-northeast3 \
  --format="value(spec.template.spec.serviceAccountName)"
```

산출 테이블:

| 서비스 | 런타임 SA | SA 역할 | 비고 |
|--------|----------|---------|------|
| monkos-portal | ? | ? | |
| idphoto-kr | ? | ? | |
| ... | | | |

추가 확인:
1. Compute 기본 SA(편집자)로 구동되는 서비스 식별
2. Recommender 인사이트에서 실사용 6개 권한이 무엇인지 식별:
   ```bash
   gcloud recommender insights list \
     --project=monkos --location=asia-northeast3 \
     --insight-type=google.iam.policy.Insight \
     --filter="content.member:compute@developer.gserviceaccount.com"
   ```
3. 전용 SA 전환 시 영향받는 서비스 목록 정리

⚠️ 이 Task는 **조사만**. monkos 본진 IAM 변경은 별도 지시서로 분리.

### Task 5 — 프로젝트 종료 선결 체크리스트

**startMONK** (`gen-lang-client-0105707468`):

| 리소스 유형 | 확인 명령 | 기대값 |
|------------|----------|--------|
| Cloud Run | `gcloud run services list` | monk-ai-backend (유휴) |
| 버킷 | `gsutil ls` | startmonk_bucket(355MB), monk-data-factory-assets(257MB) — 막내2가 내용 감사 중 |
| App Engine | `gcloud app describe` | 존재 여부 확인 |
| Firestore/Datastore | `gcloud firestore databases list` | 존재 여부 확인 |
| Discovery Engine | 데이터스토어 잔존 여부 | |
| Cloud Functions | `gcloud functions list` | |
| Scheduler/Tasks | `gcloud scheduler jobs list` | |

**monkos-aistudio** (`gen-lang-client-0127984847`):

동일 항목 체크. 06-12 콘솔 확인으로 거의 빈 것 확정 — 재확인.

**Default Gemini Project / My Maps Project**:

06-12 콘솔 확인으로 빈 것 확정 — `gcloud` 재확인만.

각 프로젝트별 **"종료해도 됨 / 선결 잔존"** 판정표 작성. 종료 클릭은 작가님.

## 산출물

| # | 파일 | 내용 |
|---|------|------|
| 1 | `monkos-ops/ops/reports/2026-06/REPORT_20260612_iMac막내3_SECURITY_CloudRun_SA맵_종료판정.md` | Task 4·5 통합 보고서 |

## ⚠️ 준수 조항

- **헌법 4조 1항**: 키·시크릿 값 금지. SA 이름·역할·메타데이터만.
- **헌법 4조 2항**: **읽기 전용**. 서비스 변경·프로젝트 종료·IAM 변경 일체 금지. 변경 필요 시 권고로만 보고.
- **헌법 3조 1항**: 매 턴 `date` KST 취득.
- **헌법 3조 2항**: 완료 보고 `✅❌💡⏳📁🔀` + 수발신 헤더. 세션 로그 어펜드.

## 교차 감사

본 건 완료 후, **막내1 보고서**(키·IAM 전수)를 Read하여 다음을 교차 검증:
- Cloud Run 런타임 SA가 IAM 정책에 적절한 역할로 등록되어 있는지
- 종료 대상 프로젝트의 SA가 monkos 본진 IAM에 잔존하지 않는지
- Task 1에서 발견된 USER_MANAGED 키가 Cloud Run 환경변수에 주입되어 있지 않은지

교차 검증 결과를 보고서 말미 `## 교차 감사` 섹션에 추가.

## 커밋 메시지

```
[research] GCP 전수조사 C — Cloud Run SA 맵 + 프로젝트 종료 판정 (4-22 델타)
```

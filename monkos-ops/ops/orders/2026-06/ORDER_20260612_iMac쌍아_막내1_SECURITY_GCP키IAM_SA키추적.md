---
type: order
date: 2026-06-12
from: iMac/쌍아
to: iMac/막내1
subject: "GCP 전수조사 A — 프로젝트·IAM·키 현행화 + SA 수동 키 추적"
status: 대기
portfolio: PF_SECURITY
---

# 지시서 — GCP 전수조사 A: 프로젝트·IAM·키 현행화 + SA 수동 키 추적

> **[2026-06-12 11:55 KST]** iMac/쌍아 → iMac/막내1
> 원본: `ORDER_20260612_웹민아_막내들_SECURITY_GCP전수정밀조사.md` (웹민아 기안, 쌍아 보정·분할)
> 작가님 직접 지시(②경로). 3건 분할의 A건.

---

## 배경

2026-06-12 오전 작가님+웹민아 합동 콘솔 점검 결과:
- Gemini 키 06-19 마감 요건 충족 (monkos MONKOS NEW 1개만 생존, 제한 적용)
- IAM 즉석 축소 실행 (monk-data-factory SA 편집자 제거, startMONK smuse73 owner 제거)
- 4-22 감사 이후 7주간 델타가 현행화되지 않은 상태

세션 로그 참조: `monkos-ops/ops/sessions/2026-06/2026-06-12_웹_민아_수동.md`

## 담당 Task

### Task 1 — 프로젝트·IAM·키 현행 전수 (4-22 감사 §1~3 갱신)

7개 프로젝트 전수:
- monkos
- monkos-3c6e4
- monk-data-factory
- gen-lang-client-0105707468 (startMONK)
- gen-lang-client-0127984847 (monkos-aistudio)
- gen-lang-client-0705237063 (Default Gemini)
- savvy-cinema-481804-r1

각 프로젝트별:
1. `gcloud services api-keys list` — 키 전수 (기대값: monkos 1개, 나머지 0)
2. `gcloud projects get-iam-policy` — 현행 IAM
3. `gcloud iam service-accounts list` + USER_MANAGED 키 존재 여부

**4-22 보고서와의 델타 테이블 작성** (변경/삭제/잔존).

참조 정본:
- `monkos-ops/ops/reports/2026-04/REPORT_20260422_GCP_Firebase_인프라감사.md`
- `monkos-ops/ops/SECRET_INVENTORY.md`

### Task 3 — SA 수동 키 추적 (Phase C 선결)

USER_MANAGED 키 보유 SA 추적:
- `smuse73` (startMONK) — 키 ID·발급일 확인
- `monk-factory-agent` (monk-data-factory) — 키 ID·발급일 확인
- `yong-a-orchestrator` 구키(1월·5월분) 삭제 완결 여부 확인 (06-10 교체 후 "삭제 대기")

각 키별:
1. 로컬 디바이스·리포·CF 대시보드 내 키 파일 소재 grep
2. 사용처 0 확인 시 **폐기 가능 판정** (실행은 작가님 승인 별도)

## 산출물

| # | 파일 | 내용 |
|---|------|------|
| 1 | `monkos-ops/ops/reports/2026-06/REPORT_20260612_iMac막내1_SECURITY_GCP키IAM전수.md` | Task 1·3 통합 보고서 |
| 2 | `monkos-ops/ops/SECRET_INVENTORY.md` 갱신 | §A 키 현황(06-12), §G SA 역할 현행화 |

## ⚠️ 준수 조항

- **헌법 4조 1항**: 키·시크릿 **값 조회/생성/추측 절대 금지**. fingerprint·키 ID·메타데이터만. 보고서에 값 인용 금지.
- **헌법 4조 2항**: **읽기 전용**. IAM 변경·키 삭제 등 상태 변경 일체 금지. 변경 필요 시 권고로만 보고.
- **헌법 3조 1항**: 매 턴 `date` KST 취득.
- **헌법 3조 2항**: 완료 보고 `✅❌💡⏳📁🔀` + 수발신 헤더. 세션 로그 어펜드.

## 교차 감사

본 건 완료 후, **막내2 보고서**(버킷 전수)를 Read하여 다음을 교차 검증:
- Task 2 버킷별 소유 프로젝트가 본 건 Task 1 프로젝트 목록과 일치하는지
- SA 수동 키가 버킷 ACL에 등록되어 있지는 않은지

교차 검증 결과를 보고서 말미 `## 교차 감사` 섹션에 추가.

## 커밋 메시지

```
[research] GCP 전수조사 A — 프로젝트·IAM·키 현행화 + SA 수동 키 추적 (4-22 델타)
```

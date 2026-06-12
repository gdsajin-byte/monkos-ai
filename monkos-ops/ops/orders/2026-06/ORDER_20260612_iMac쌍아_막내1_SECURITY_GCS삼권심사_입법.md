---
type: order
date: 2026-06-12
from: iMac/쌍아
to: iMac/막내1
subject: "monk-ai-images 버킷 교정 3권심사 — 입법 (설계·기준)"
status: 대기
portfolio: PF_SECURITY
---

# 지시서 — monk-ai-images 3권심사: 입법 (설계·기준)

> **[2026-06-12 12:47 KST]** iMac/쌍아 → iMac/막내1
> 작가님 직접 지시(②경로). 버킷 코드 참조 전수조사 후속.
> 3권 심사: 막내1=입법, 막내2=행정, 막내3=사법. 독립 진행 후 교차 대조.

---

## 배경

monk-ai-images 버킷 전수조사 완료. allUsers 제거 + 파일 레벨 ACL 전환이 유력하나, 실행 전에 3권 심사로 영향 범위를 정밀 파악하고 교정 워크플로우를 확정한다.

선행 보고서 필독:
- `REPORT_20260612_iMac막내1_SECURITY_GCS버킷코드참조전수.md` (본인 작성)
- `REPORT_20260612_iMac막내2_SECURITY_GCP버킷전수.md`
- `GCS_BUCKET_STRUCTURE.md`

## 입법 관점 — "기준을 세워라"

### Task 1 — 경로별 공개/비공개 기준 설계

monk-ai-images 전 경로에 대해 **공개/비공개 판정 기준**을 수립:

| 판정 | 정의 | 접근 방식 |
|------|------|----------|
| **PUBLIC** | 인증 없이 URL 직접 접근 필요 | 파일 레벨 ACL `allUsers:objectViewer` |
| **PRIVATE** | 인증된 요청만 허용 | Signed URL 또는 SA 직접 접근 |
| **DELETE** | 더 이상 불필요 | 백업 후 삭제 |
| **MIGRATE** | 다른 위치로 이관 | GDrive 또는 별도 버킷 |

각 경로별 판정:

```
gs://monk-ai-images/
├── ads/           → ?
├── assets/        → ?
├── blog/          → ?
├── generated/     → ?
├── profiles/      → ?
├── raw_data/      → ?
│   ├── bwya_academy/     → ?
│   ├── kbeauty_sources/  → ?
│   └── kbeauty_sources_metadata/ → ?
└── service/       → ?
    └── idphoto/{kr,jp}/  → ?
```

### Task 2 — allUsers 제거 영향 맵

allUsers를 버킷 레벨에서 제거했을 때:
1. **파일 레벨 ACL이 이미 있는 경로** — 영향 없음 확인
2. **파일 레벨 ACL이 없는데 public URL로 참조되는 경로** — 장애 발생 지점 식별
3. 서비스별 영향 테이블:

| 서비스 | 참조 경로 | 현재 접근 방식 | allUsers 제거 후 | 코드 변경 필요 |
|--------|----------|--------------|----------------|--------------|

### Task 3 — 교정 워크플로우 설계 (순서·게이트)

단계별 실행 순서를 설계:
1. 사전 백업은 필요한가? 어디까지?
2. 파일 레벨 ACL 보정이 먼저인가, allUsers 제거가 먼저인가?
3. 각 단계의 롤백 방법
4. 검증 방법 (curl 테스트, 서비스 정상 확인)

```
Step 1: ???
Step 2: ???
  └─ 검증: ???
  └─ 롤백: ???
Step 3: ???
...
```

## 산출물

| # | 파일 |
|---|------|
| 1 | `monkos-ops/ops/reports/2026-06/REPORT_20260612_iMac막내1_SECURITY_GCS삼권심사_입법.md` |

## ⚠️ 준수 조항

- **헌법 4조 2항**: **읽기 전용**. 코드·버킷·ACL 변경 일체 금지.
- **헌법 3조 1항**: 매 턴 `date` KST 취득.
- **헌법 3조 2항**: 완료 보고 `✅❌💡⏳📁🔀`.
- 다른 막내 보고서를 참조하되, **독립 판단** 우선. 의견 불일치는 그대로 기록.

## 커밋 메시지

```
[research] monk-ai-images 3권심사 입법 — 공개/비공개 기준 + 교정 워크플로우 설계
```

---
type: order
date: 2026-06-12
from: iMac/쌍아
to: iMac/막내2
subject: "monk-ai-images 버킷 교정 3권심사 — 행정 (실측·현황)"
status: 대기
portfolio: PF_SECURITY
---

# 지시서 — monk-ai-images 3권심사: 행정 (실측·현황)

> **[2026-06-12 12:47 KST]** iMac/쌍아 → iMac/막내2
> 작가님 직접 지시(②경로). 버킷 전수조사 B 후속.
> 3권 심사: 막내1=입법, 막내2=행정, 막내3=사법. 독립 진행 후 교차 대조.

---

## 배경

동일. 선행 보고서 필독:
- `REPORT_20260612_iMac막내2_SECURITY_GCP버킷전수.md` (본인 작성)
- `REPORT_20260612_iMac막내1_SECURITY_GCS버킷코드참조전수.md`
- `GCS_BUCKET_STRUCTURE.md` (본인 작성)

## 행정 관점 — "현장을 정밀 실측하라"

### Task 1 — 정확한 맵 트리 작성

GCS 버킷의 **실제 디렉토리 트리**를 정밀 작성. 2단계 깊이까지 + 각 경로별:

```
gs://monk-ai-images/
├── ads/                    [파일수] [용량] [최신파일일자] [ACL상태]
│   ├── manifests/          [파일수] [용량]
│   └── photolab/           [파일수] [용량]
├── assets/                 ...
├── blog/                   ...
│   ├── ai/
│   └── og_*/
├── generated/              ...
├── profiles/               ...
├── raw_data/               ...
│   ├── bwya_academy/
│   ├── kbeauty_sources/
│   └── kbeauty_sources_metadata/
└── service/                ...
    └── idphoto/
        ├── jp/
        └── kr/
```

각 경로별 수집 데이터:
1. **파일 수** (`gsutil ls -r gs://bucket/path/ | wc -l`)
2. **용량** (`gsutil du -s gs://bucket/path/`)
3. **최신 파일 날짜** (마지막 쓰기 시점 — 활성/유휴 판별)
4. **파일 레벨 ACL 샘플** (`gsutil acl get gs://bucket/path/대표파일` — 1개만)
5. **공개 URL 접근 가능 여부** (대표 파일 1개 익명 curl)

### Task 2 — 활성/유휴 판별

최신 파일 날짜 기준:
- **활성**: 최근 30일 내 쓰기 있음
- **저활성**: 30일~6개월
- **유휴**: 6개월+ 쓰기 없음

| 경로 | 최신 쓰기 | 판별 | 비고 |
|------|----------|------|------|

### Task 3 — 파일 레벨 ACL 현황 실측

각 경로의 대표 파일 1개씩 ACL 확인:
- `allUsers` 파일 레벨 설정 여부
- SA(monk-image-engine) 권한
- 버킷 레벨 allUsers 제거 후 이 파일이 공개 유지되는지 판별

## 산출물

| # | 파일 |
|---|------|
| 1 | `monkos-ops/ops/reports/2026-06/REPORT_20260612_iMac막내2_SECURITY_GCS삼권심사_행정.md` |

## ⚠️ 준수 조항

- **헌법 4조 2항**: **읽기 전용**. ACL 변경·파일 삭제 금지. **고객 촬영물 열람 절대 금지** — 파일명·메타데이터까지만.
- **헌법 3조 1항**: 매 턴 `date` KST 취득.
- **헌법 3조 2항**: 완료 보고 `✅❌💡⏳📁🔀`.
- 독립 판단 우선.

## 커밋 메시지

```
[research] monk-ai-images 3권심사 행정 — 정밀 맵트리 + ACL 실측 + 활성·유휴 판별
```

---
type: report
id: REPORT_20260228_GCR_레거시이미지_삭제계획
date: 2026-02-28 15:32 KST
from: iMac/막내4
to: iMac/쌍아
task_id: ORDER_20260228_막내4_레거시정리_Phase3
result: pending
status: pending
---

# GCR 레거시 이미지 삭제 계획서

> **[2026-02-28 15:32 KST] iMac/막내4 → iMac/쌍아**
> 헌법 8조에 따라 인프라 삭제는 계획서 승인 후 실행.

---

## 1. 삭제 대상

### A. 레거시 네이밍 레포 (전체 삭제)

| 레포지토리 | 이미지 수 | 상태 | 근거 |
|-----------|----------|------|------|
| `gcr.io/monkos/idphoto-kr` | 42개 (28개 타임스탬프 깨짐 1970-01-01) | **미사용** | 현재 서비스는 `monkos-idphoto-kr` 사용 |
| `gcr.io/monkos/portal` | 3개 (1개 타임스탬프 깨짐) | **미사용** | 현재 서비스는 `monkos-portal` 사용 |

**삭제 이유**: 서비스 네이밍이 `monkos-idphoto-kr`, `monkos-portal`로 전환됨. 구 네이밍 레포의 이미지는 어떤 Cloud Run 서비스에서도 참조하지 않음.

### B. 구 이미지 정리 (최근 10개 보존)

| 레포지토리 | 전체 | 보존 | 삭제 대상 | 비고 |
|-----------|------|------|----------|------|
| `gcr.io/monkos/monkos-idphoto-kr` | ~100개 | 최근 10개 | ~90개 | 운영 |
| `gcr.io/monkos/monkos-portal` | ~100개 | 최근 10개 | ~90개 | 운영 |
| `gcr.io/monkos/monkos-idphoto-jp` | ~105개 | 최근 10개 | ~95개 | 운영 |
| `gcr.io/monkos/monkos-idphoto-kr-dev` | 36개 | 최근 5개 | ~31개 | 개발 |
| `gcr.io/monkos/monkos-portal-dev` | 36개 | 최근 5개 | ~31개 | 개발 |

**보존 기준**: 최신 `latest` 태그 + 최근 10개 (운영) / 5개 (개발) 다이제스트

---

## 2. 삭제 명령 (승인 후 실행)

### A. 레거시 레포 전체 삭제

```bash
# idphoto-kr 구 레포 (42개)
gcloud container images list-tags gcr.io/monkos/idphoto-kr --format="get(digest)" | \
  while read digest; do
    gcloud container images delete "gcr.io/monkos/idphoto-kr@$digest" --quiet --force-delete-tags
  done

# portal 구 레포 (3개)
gcloud container images list-tags gcr.io/monkos/portal --format="get(digest)" | \
  while read digest; do
    gcloud container images delete "gcr.io/monkos/portal@$digest" --quiet --force-delete-tags
  done
```

### B. 운영 레포 구 이미지 정리

```bash
# monkos-idphoto-kr: 최근 10개 제외 삭제
gcloud container images list-tags gcr.io/monkos/monkos-idphoto-kr \
  --format="get(digest)" --sort-by="~timestamp" | tail -n +11 | \
  while read digest; do
    gcloud container images delete "gcr.io/monkos/monkos-idphoto-kr@$digest" --quiet --force-delete-tags
  done

# monkos-portal: 동일
gcloud container images list-tags gcr.io/monkos/monkos-portal \
  --format="get(digest)" --sort-by="~timestamp" | tail -n +11 | \
  while read digest; do
    gcloud container images delete "gcr.io/monkos/monkos-portal@$digest" --quiet --force-delete-tags
  done

# monkos-idphoto-jp: 동일
gcloud container images list-tags gcr.io/monkos/monkos-idphoto-jp \
  --format="get(digest)" --sort-by="~timestamp" | tail -n +11 | \
  while read digest; do
    gcloud container images delete "gcr.io/monkos/monkos-idphoto-jp@$digest" --quiet --force-delete-tags
  done

# dev 레포: 최근 5개 제외
gcloud container images list-tags gcr.io/monkos/monkos-idphoto-kr-dev \
  --format="get(digest)" --sort-by="~timestamp" | tail -n +6 | \
  while read digest; do
    gcloud container images delete "gcr.io/monkos/monkos-idphoto-kr-dev@$digest" --quiet --force-delete-tags
  done

gcloud container images list-tags gcr.io/monkos/monkos-portal-dev \
  --format="get(digest)" --sort-by="~timestamp" | tail -n +6 | \
  while read digest; do
    gcloud container images delete "gcr.io/monkos/monkos-portal-dev@$digest" --quiet --force-delete-tags
  done
```

---

## 3. 예상 효과

| 항목 | 삭제 수 | 비고 |
|------|--------|------|
| 레거시 레포 이미지 | 45개 | 전체 삭제 |
| 운영 구 이미지 | ~275개 | 최근 10개 보존 |
| dev 구 이미지 | ~62개 | 최근 5개 보존 |
| **합계** | **~382개** | GCR 저장소 비용 절감 |

---

## 4. 리스크

| 리스크 | 확률 | 대응 |
|--------|------|------|
| Cloud Run 롤백 불가 | 낮음 | 최근 10개 보존으로 충분한 롤백 여지 |
| 구 리비전 참조 이미지 삭제 | 매우 낮음 | 구 리비전은 트래픽 0%, latest만 활성 |

---

**승인 대기 중. 실행은 쌍아+작가님 승인 후.**

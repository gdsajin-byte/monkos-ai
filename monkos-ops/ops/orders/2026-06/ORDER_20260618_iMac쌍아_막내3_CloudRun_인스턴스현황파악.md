---
type: order
date: 2026-06-18
from: iMac/쌍아
to: iMac/막내3
portfolio: PF_MONK_OS
status: 대기
---

# 지시서: Cloud Run 인스턴스 현황 파악

> **[2026-06-18 14:34 KST]** iMac/쌍아 → 막내3
> 작가님 지시: Cloud Run 비용이 ₩60,706으로 1위 상승. 전 서비스 인스턴스 현황 파악 요청.

---

## 목적

GCP 프로젝트 내 모든 Cloud Run 서비스의 인스턴스 설정을 파악하여 비용 최적화 기초 데이터를 확보한다.

---

## ⚠️ 준수 조항

- **읽기 전용 조사**. 설정 변경 금지.
- `gcloud run services describe` 등 조회 명령만 사용.
- deploy.sh, gcloud run deploy 실행 금지 (ch5 2조).

---

## 작업 항목

### 1. 전 서비스 목록 확보

```bash
gcloud run services list --project=monkos --format="table(SERVICE,REGION,URL,LAST_DEPLOYED_BY,LAST_DEPLOYED_AT)"
```

### 2. 서비스별 인스턴스 설정 확인

각 서비스에 대해:

```bash
gcloud run services describe {서비스명} --region={리전} --project=monkos \
  --format="yaml(spec.template.metadata.annotations,spec.template.spec.containerConcurrency)"
```

수집 항목:
- `autoscaling.knative.dev/minScale` (min-instances)
- `autoscaling.knative.dev/maxScale` (max-instances)
- CPU 할당 (`run.googleapis.com/cpu-throttling`)
- 메모리/CPU 리소스 설정
- startup CPU boost 여부

### 3. 보고서 형식

아래 테이블로 정리:

| 서비스 | 리전 | min | max | CPU | 메모리 | CPU부스트 | 용도 | 비고 |
|--------|------|-----|-----|-----|--------|----------|------|------|

용도 컬럼: 실 유저 대면(라이브) / 내부용 / 미사용 여부를 URL과 서비스명으로 판단하여 기입.

---

## 완료 보고

- 수발신 헤더 필수
- 테이블 형태로 보고 (설계서/커밋 불필요, 보고만)

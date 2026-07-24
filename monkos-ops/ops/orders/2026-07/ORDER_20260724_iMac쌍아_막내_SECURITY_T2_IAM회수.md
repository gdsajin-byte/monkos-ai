---
type: order
date: 2026-07-24
device: iMac
agent: 쌍아
receiver: 막내
status: 발행
portfolio: PF_SECURITY
---

# 지시서 — SECURITY T2: IAM 과권한 회수 + SM 잔재 정리

**[2026-07-24 11:25 KST]** iMac/쌍아 → 막내

> 근거: [REPORT_20260724_iMac민아_시크릿SA_종합감사](../reports/2026-07/REPORT_20260724_iMac민아_시크릿SA_종합감사.md) T2 항목
> 실측 데이터: 민아 sa_audit 11:13 스냅샷 기반

## ⚠️ 준수 조항
- 헌법 4조 1항 (비밀정보 보호)
- 헌법 4조 2항 (파괴적 명령 금지 — 본 지시서의 IAM 회수는 작가님 승인 하 예외)
- ch5 배포 규칙 (deploy.sh 경유)
- 롤백 = 재부여 1줄이므로 저위험이나, **각 단계 실행 전 실측 → 실행 → 검증 3단계 준수**

## 작업 목록

### 1. N8N_API_KEY SM 컨테이너 삭제
- 버전 1은 이미 destroyed (작가님 승인, 11:10 실행)
- SM 컨테이너(껍데기)도 삭제:
  ```bash
  gcloud secrets delete N8N_API_KEY --project=monkos --quiet
  ```
- SECRET_INVENTORY.md #30 행을 `폐기(삭제)` 마킹
- 검증: `secret map N8N_API_KEY` → "SM 미존재" 출력

### 2. compute 기본 SA roles/editor 회수
- **대상 SA**: `933456016842-compute@developer.gserviceaccount.com` (appspot 아님 — 민아 실측 정정)
- **전제 실측**: Cloud Run 10개 서비스 전부 monk-image-engine SA로 실행 중. compute 기본 SA 바인딩 리소스 0.
- 실행 전 재확인:
  ```bash
  gcloud projects get-iam-policy monkos --flatten="bindings[].members" \
    --filter="bindings.members:933456016842-compute@developer.gserviceaccount.com AND bindings.role:roles/editor" \
    --format="table(bindings.role)"
  ```
- 회수:
  ```bash
  gcloud projects remove-iam-policy-binding monkos \
    --member="serviceAccount:933456016842-compute@developer.gserviceaccount.com" \
    --role="roles/editor"
  ```
- 검증: 위 get-iam-policy 재실행 → 결과 0행
- SECRET_INVENTORY.md 권한 매트릭스 갱신

### 3. monk-image-engine 프로젝트 레벨 tokenCreator 축소
- **현상**: `roles/iam.serviceAccountTokenCreator`가 프로젝트 레벨 → 전 SA 임퍼소네이션 가능
- **목표**: 프로젝트 레벨 회수 → 자기 자신 SA 레벨로 재부여 (GCS 서명 URL 자기 signBlob 유지)
- 단계:
  1. 프로젝트 레벨 회수:
     ```bash
     gcloud projects remove-iam-policy-binding monkos \
       --member="serviceAccount:monk-image-engine@monkos.iam.gserviceaccount.com" \
       --role="roles/iam.serviceAccountTokenCreator"
     ```
  2. SA 레벨 자기서명 재부여:
     ```bash
     gcloud iam service-accounts add-iam-policy-binding \
       monk-image-engine@monkos.iam.gserviceaccount.com \
       --member="serviceAccount:monk-image-engine@monkos.iam.gserviceaccount.com" \
       --role="roles/iam.serviceAccountTokenCreator" \
       --project=monkos
     ```
  3. **검증 게이트 (필수)**: 서명 URL 발급 스모크
     - dev 배포 후 서명 URL을 사용하는 엔드포인트 호출
     - GCS signed URL 정상 발급 + 접근 가능 확인
     - 실패 시 즉시 프로젝트 레벨 복원 (롤백 1줄)
- ⚠️ 임퍼소네이션 보존 대상: `gdsajin@gmail.com → monk-image-engine` (gsc_submit.sh 경로) — 이 바인딩은 SA 레벨이라 프로젝트 tokenCreator 회수에 영향 없음을 실측 확인할 것
- SECRET_INVENTORY.md 권한 매트릭스 갱신

### 4. (후순위) yong-a 키 90일 로테이션 — 별도 발행 예정
- 키 나이 44일 (06-10), 기한 9월 초
- 디바이스 MCP 캐시 전파 검증 설계 선행 필요
- 본 지시서 1~3 완료 후 별도 지시서 발행

## 실행 순서
1 → 2 → 3 (의존 없이 독립이나, 리스크 낮은 순)

## 완료 보고
- 수발신 헤더 + ✅❌💡⏳📁🔀 형식
- COMPLETION 보고서 파일 필수
- 권한 매트릭스 갱신분 diff 포함

---
type: order
id: ORDER_20260228_막내4_GCS_Git_잔재점검
date: 2026-02-28 13:15 KST
from: iMac/쌍아
to: 막내4
priority: P1
status: pending
---

# 지시서: GCS / Git / Cloud Run 잔재 전수 점검

> **[2026-02-28 13:15 KST] iMac/쌍아 → 막내4**
> **배경**: 쿠키 단일화 리팩토링 후 이상 증상. GCS 버킷, Git 레포, Cloud Run에 과거 불필요한 잔재가 묻어있을 가능성.
> **엔드라인**: 전수 점검 보고서 → 커밋+push → 완료 보고

---

## 1. 점검 범위

### A. GCS (Google Cloud Storage) 잔재

1. **버킷 목록 확인**: `gsutil ls` — 프로젝트 내 전체 버킷
2. **monkos 관련 버킷 내 불필요 파일**: 이전 빌드 산출물, 임시 파일, 테스트 이미지 등
3. **cloudbuild 소스 아카이브**: `gs://monkos_cloudbuild/source/` — 이전 빌드 타르볼이 쌓여있는지, 정리 필요 여부
4. **GCS 버킷 권한**: 공개 접근이 열려있는 버킷이 없는지

### B. Cloud Run 잔재

1. **리비전 목록**: `gcloud run revisions list --service=monkos-idphoto-kr --region=us-central1`
   - 오래된 리비전이 대량 쌓여있는지
   - 트래픽 0%인 리비전 정리 필요 여부
2. **monkos-portal 리비전도 동일 점검**
3. **환경변수 점검**: 현재 활성 리비전의 환경변수가 올바른지 (이전 설정 잔재 없는지)
   - `gcloud run services describe monkos-idphoto-kr --region=us-central1 --format="yaml(spec.template.spec.containers[0].env)"`
4. **서비스 계정 권한**: 불필요하게 넓은 권한이 부여되어 있지 않은지

### C. Git 레포 잔재

1. **.gitignore 점검**: 추적되면 안 되는 파일이 추적되고 있는지
   - `.env`, `node_modules/`, `package-lock.json` (이미 untracked 확인)
   - 빌드 산출물, 임시 파일
2. **Git 대용량 파일**: `git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | sort -rnk3 | head -20`
   - 불필요하게 큰 파일이 히스토리에 있는지
3. **이전 브랜치 정리**: `git branch -r` — 머지 완료된 원격 브랜치가 남아있는지
4. **D1 데이터베이스 관련**: 이전 D1 바인딩/마이그레이션 파일 잔재 (CF에서 Firestore로 전환 후)

### D. Docker 이미지 잔재

1. **GCR 이미지 목록**: `gcloud container images list-tags gcr.io/monkos/monkos-idphoto-kr`
   - 오래된 이미지 태그가 대량 쌓여있는지
2. **monkos-portal도 동일**
3. **정리 권고**: 최근 5개 외 삭제 가능 여부

---

## 2. 산출물

| # | 내용 |
|---|------|
| 1 | GCS/Git/Cloud Run 전수 점검 보고서 — 완료 보고에 포함 |
| 2 | 발견된 잔재/설정 오류 목록 + 정리 권고 |

**참고**: 인프라 변경(삭제/정리)은 보고만. 실제 실행은 쌍아+작가님 승인 후.

---

## 3. 작업 절차

```
1. MEMORY.md 읽기
2. git pull origin develop
3. GCS 버킷 점검 (gsutil)
4. Cloud Run 리비전/환경변수 점검 (gcloud)
5. Git 레포 잔재 점검
6. Docker 이미지 점검
7. .gitignore 점검
8. 보고서 작성 → 커밋 + push
9. 완료 보고
```

---

## ⚠️ 준수 조항

- **헌법 6조**: API 키, 환경변수 값 보고서 노출 금지 — 키 이름만, 값은 마스킹
- **헌법 8조**: 삭제 명령 실행 금지 — 보고만 수행
- **ch7 3조**: 인프라 설정 변경 금지 — 조회+보고만

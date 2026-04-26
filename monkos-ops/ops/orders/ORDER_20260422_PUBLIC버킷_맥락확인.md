---
type: ORDER
date: 2026-04-22
from: iMac/쌍아
to: iMac/막내1
status: 대기
---

# [지시서] PUBLIC 버킷 2건 맥락 확인

> **[2026-04-22 12:10 KST] iMac/쌍아 → iMac/막내1**
> 작가님 추정: "CF Images 폐지 + 블로그 에디터 이미지 로딩 때문에 퍼블릭으로 돌렸을 것"
> 목적: 이 추정이 맞는지 코드/설정/히스토리 기반으로 확인

---

## 조사 대상

### 1. `gs://monk-ai-images` (monkos 프로젝트, allUsers:objectViewer)

1. **코드베이스에서 이 버킷 참조 검색**
```bash
grep -r "monk-ai-images" --include="*.js" --include="*.ts" --include="*.html" --include="*.css" --include="*.sh" --include="*.env*" \
  /Users/jeong-kyushin/developer/monk_project/ | grep -v node_modules | grep -v .git
```

2. **블로그 에디터에서 GCS 이미지 URL 사용 패턴 확인**
```bash
grep -r "storage.googleapis.com\|monk-ai-images" --include="*.js" --include="*.html" \
  /Users/jeong-kyushin/developer/monk_project/MONK_kr/ | grep -v node_modules
grep -r "storage.googleapis.com\|monk-ai-images" --include="*.js" --include="*.html" \
  /Users/jeong-kyushin/developer/monk_project/monkos_AI/ | grep -v node_modules
```

3. **버킷 내용물 샘플링** (파일명만, 내용 아님)
```bash
gsutil ls gs://monk-ai-images/ | head -20
gsutil ls gs://monk-ai-images/**/ 2>/dev/null | head -30
```

4. **IAM 변경 히스토리** (가능하면)
```bash
gcloud logging read "resource.type=gcs_bucket AND resource.labels.bucket_name=monk-ai-images AND protoPayload.methodName=storage.setIamPermissions" --project=monkos --limit=10 --format=json 2>/dev/null
```

5. **CF Images(Cloudflare Images) 관련 흔적 검색**
```bash
grep -r "imagedelivery.net\|cloudflare.*images\|CF_IMAGES\|CLOUDFLARE_IMAGES" \
  /Users/jeong-kyushin/developer/monk_project/ --include="*.js" --include="*.ts" --include="*.env*" | grep -v node_modules | grep -v .git
```

### 2. `gs://monk-factory-storage` (monk-data-factory 프로젝트, allUsers:composer.environmentAndStorageObjectViewer)

1. **코드베이스 참조 검색**
```bash
grep -r "monk-factory-storage" \
  /Users/jeong-kyushin/developer/monk_project/ | grep -v node_modules | grep -v .git
```

2. **버킷 내용물 샘플링**
```bash
gsutil ls gs://monk-factory-storage/ | head -20
```

3. **이 버킷이 데이터 파이프라인(BigQuery/Vertex AI)과 연결된 흔적**
```bash
# monk-data-factory 프로젝트의 Cloud Composer/Vertex AI 설정 확인
gcloud composer environments list --project=monk-data-factory --locations=asia-northeast3 2>/dev/null
```

4. **allUsers:composer.environmentAndStorageObjectViewer 권한의 의미**
   - Cloud Composer 환경 리소스 뷰어 — 일반 공개 의도가 아닐 가능성
   - Composer 환경 생성 시 자동 부여되었을 수도 있음

---

## 산출물

보고서: `monkos-ops/ops/reports/REPORT_20260422_PUBLIC버킷_맥락확인.md`

결론에 반드시 포함:
- 퍼블릭 설정이 **의도적인지 우발적인지**
- 퍼블릭이 **현재도 필요한지**
- 필요 없다면 **닫아도 서비스 영향 없는지**

---

## 준수 조항

⚠️ 읽기 전용. 버킷 IAM 수정 금지.
⚠️ 버킷 내 파일 내용 조회 금지 (파일명 목록만).

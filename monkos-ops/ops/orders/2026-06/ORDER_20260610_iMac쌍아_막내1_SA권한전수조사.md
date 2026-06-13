---
type: order
date: 2026-06-10
from: iMac/쌍아
to: iMac/막내1
portfolio: PF_CITADEL
status: 완료
---

# 지시서 — yong-a-orchestrator SA 키 소비처 전수 조사 + 권한 최소화 분석

**[2026-06-10 17:17 KST] iMac/쌍아 → iMac/막내1**

---

## 배경

웹/민아가 루틴(무인 실행) 환경의 인증 설계 중 다음을 특정함:

- GH Secrets `GCP_SA_KEY` = `yong-a-orchestrator` SA = **roles/editor** (프로젝트 전체 읽기/쓰기/삭제)
- 현재 이 키를 소비하는 곳: GH Actions(브리핑·위클리 등) + deploy.sh + 라이브 서비스
- 실제 필요 권한은 대부분 **읽기 전용** — 하지만 editor 권한이기 때문에 유출 시 인프라 전체 변조 가능
- SA 증식은 유지보수 부채 → **기존 SA 1개의 권한을 낮추는 방향**이 합리적

---

## 임무

### Task 1: 리포 내 `yong-a-orchestrator` 소비처 전수 추적

리포 전체에서 이 SA 키를 참조하는 곳을 전수 식별:

- `.github/workflows/*.yml` — `GCP_SA_KEY` 시크릿 참조
- `**/deploy.sh` — gcloud 인증 시 SA 사용 여부
- `monkos_AI/**/server.js` — 런타임에서 ADC(Application Default Credentials)로 SA 사용 여부
- Cloud Run 서비스 — 서비스 계정으로 바인딩되어 있는지

각 소비처에 대해:
```
| 소비처 | 파일:행 | 사용하는 GCP API | 필요 권한 (최소) | 현재 권한 |
```

### Task 2: GCP API별 필요 권한 매핑

소비처에서 실제 호출하는 GCP API를 식별하고, 각각에 필요한 최소 IAM 역할을 매핑:

| GCP API | 소비처 | 현재 (editor) | 최소 필요 역할 |
|---------|--------|-------------|--------------|

예상되는 API:
- Analytics Data API (GA4 조회) → `roles/analyticsdata.viewer` 또는 custom
- Search Console API (GSC 조회) → 웹마스터 읽기
- Cloud Build (deploy.sh) → `roles/cloudbuild.builds.editor`
- Cloud Run (deploy.sh) → `roles/run.admin`
- Cloud Storage (GCS 이미지) → `roles/storage.objectCreator` + `roles/storage.objectViewer`
- Secret Manager (시크릿 조회) → `roles/secretmanager.secretAccessor`
- Firestore (데이터 접근) → `roles/datastore.user`

### Task 3: 권한 축소 시나리오 분석

**시나리오 A — SA 1개 유지, 역할 교체:**
editor → 필요 역할 목록으로 교체. 장점: SA 1개. 단점: deploy.sh가 admin급 필요하면 축소 한계.

**시나리오 B — SA 2개 (읽기 vs 쓰기):**
읽기 SA (GH Actions + 루틴) + 쓰기 SA (deploy.sh + 런타임). 장점: 유출 시 피해 한정. 단점: SA 2개 관리.

**시나리오 C — SA 1개 + 배포만 사용자 ADC:**
SA를 읽기 전용으로 내리고, deploy.sh는 작가님 로컬 ADC(gcloud auth)로 실행. 장점: SA 최소 권한. 단점: 배포 디바이스 의존.

각 시나리오의 **기존 서비스 영향 여부**를 판정.

### Task 4: 보고서 작성

파일명: `REPORT_20260610_iMac막내1_SA권한전수조사.md`
배치: `monkos-ops/ops/reports/2026-06/`

---

## 엔드라인

| 항목 | 내용 |
|------|------|
| 포트폴리오 | PF_CITADEL |
| 마무리 | 커밋+push |
| 산출물 | 보고서 1건 |
| 문서 유형 | REPORT |
| 세션 로그 | [log] 태그 커밋 |

## ⚠️ 준수 조항

- **헌법 4조 1항**: SA 키 값, 프로젝트 ID 등 비밀정보 보고서에 마스킹
- 코드·설정 수정 금지. 조사·보고 전용
- GCP 콘솔 접근 불요 — 코드 기반 추적만

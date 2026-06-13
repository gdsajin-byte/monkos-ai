---
type: report
date: 2026-06-12
from: iMac/막내3
to: iMac/쌍아
status: 완료
subject: "monk-ai-images 3권심사 사법 — 장애 시나리오 + 리스크 평가 + 검증 체크리스트"
portfolio: PF_SECURITY
---

# monk-ai-images 3권심사: 사법 (검증·리스크)

> **[2026-06-12 13:13 KST]** iMac/막내3 → iMac/쌍아
> 근거 지시서: `ORDER_20260612_iMac쌍아_막내3_SECURITY_GCS삼권심사_사법.md`
> 감사 방식: 읽기 전용. 고객 촬영물 열람 금지 — HEAD 요청·파일명·ACL 메타데이터만 확인.
> 독립 판단 기반. 막내1(입법)·막내2(행정) 결론에 대한 반론 포함.

---

## 핵심 발견: 버킷 접근 제어 모드

```
Uniform bucket-level access: DISABLED → Fine-grained 모드
```

**이 단일 사실이 전체 교정 전략을 결정한다.**

Fine-grained 모드에서는 버킷 IAM과 파일 레벨 ACL이 **독립적으로 작동**한다:
- 버킷 레벨 `allUsers:objectViewer` 제거 → 파일 레벨 `allUsers:READER`가 **없는** 파일만 비공개 전환
- 파일 레벨 `allUsers:READER`가 **있는** 파일은 계속 공개

---

## 1. allUsers 제거 시 장애 시나리오 전수 (Task 1)

### 1-1. 파일 레벨 ACL 실측 결과

| 경로 | 파일 레벨 allUsers:READER | 검증 방법 | allUsers 제거 후 |
|------|--------------------------|----------|-----------------|
| `ads/*` | ✅ **있음** (실측) | `gsutil acl get` → `allUsers:READER` 확인 | 🟢 계속 공개 |
| `ads/manifest.json` | ✅ **있음** (실측) | 동일 | 🟢 계속 공개 |
| `blog/*` | ⚠️ **미검증** | `gsutil acl get` → AccessDeniedException (gdsajin 계정 권한 부족) | 🟡 **불확실** |
| `profiles/*` | N/A | 실제 이미지 파일 없음 (.keep만 존재) | 영향 없음 |
| `service/idphoto/*` | ❌ **없음** (실측) | `gsutil acl get` → owner=monk-image-engine만 | 🟢 비공개 전환 |
| `raw_data/*` | ❌ **없음** (실측) | 동일 | 🟢 비공개 전환 |
| `generated/*` | ❌ **없음** (실측) | `gsutil acl get` → owner=monk-image-engine만 | 🟢 비공개 전환 |

### 1-2. 서비스별 장애 시나리오

| 서비스 | 영향 경로 | 접근 방식 | 장애 증상 | 발생 확률 | 심각도 |
|--------|----------|----------|----------|----------|--------|
| **idphoto-kr** | `service/idphoto/kr/` | Signed URL (서버 발급) | **없음** — Signed URL은 SA 권한으로 동작, allUsers 무관 | 0% | — |
| **idphoto-jp** | `service/idphoto/jp/` | Signed URL (서버 발급) | **없음** — 동일 | 0% | — |
| **studio** | `service/idphoto/kr/` | Signed URL (서버 발급) | **없음** — 동일 | 0% | — |
| **portal (광고)** | `ads/*` | 클라이언트 직접 fetch | **없음** — 파일 레벨 ACL 확인 완료 | 0% | — |
| **photolab** | `ads/manifest.json` | 클라이언트 직접 fetch | **없음** — 파일 레벨 ACL 확인 완료 | 0% | — |
| ⚠️ **portal (블로그)** | `blog/*` | 클라이언트 직접 `<img>` | **블로그 전체 이미지 깨짐** — 코드에 `public:true` 있으나 파일 ACL 미검증 | **10~30%** | 🚨 **HIGH** |
| **studio (프리셋)** | `profiles/*` | 클라이언트 직접 URL | **없음** — 현재도 실제 파일 없음 (404) | 0% | — |

### 1-3. 블로그 이미지 리스크 상세 (유일한 불확실 서비스)

**코드 분석**: portal `cms/upload.js:185`, `cms/ai.js:26`, `cms/blog.js:32` 모두 `public: true` 설정.

GCS Node.js SDK에서 `public: true`는 업로드 시 `file.makePublic()` 호출 → 파일 레벨 `allUsers:READER` ACL 설정. **코드상으로는 파일 레벨 ACL이 설정되어야 한다.**

**그러나 실측 불가**: `gsutil acl get` 시 `gdsajin@gmail.com`에 `storage.objects.getIamPolicy` 권한 부족으로 403 반환. 가능한 원인:
1. monk-image-engine SA가 파일 생성자(OWNER)이고, gdsajin@gmail.com의 프로젝트 레벨 `roles/owner`가 파일 레벨 ACL 읽기에 미적용되는 케이스
2. `public: true` 설정이 실제 ACL을 설정하지 않는 SDK 버전 특이사항

**결론**: 코드 레벨에서는 안전하나 **실측 미검증**. 버킷 레벨 allUsers 제거 전 반드시 확인 필요.

### 1-4. 외부 영향

| 영향 대상 | 장애 증상 | 발생 확률 | 심각도 | 의도적 여부 |
|----------|----------|----------|--------|-----------|
| 구글 이미지 검색 캐시 | service/*, raw_data/* 캐시 URL → 404 | 중간 (캐시 존재 시) | LOW | ✅ 의도적 (차단 목적) |
| 네이버 블로그·SNS 공유 링크 | service/* 직접 링크 → 404 | 낮음 (공유 이력 불명) | LOW | ✅ 의도적 |
| SEO 이미지 (blog/ads) | **ads/*: 무영향** (파일 ACL). blog/*: 미검증 | 10~30% (blog만) | MED | ❌ 비의도적 장애 가능 |

### 1-5. ⚠️ 막내1 권고(옵션 B)에 대한 사법 의견

막내1은 옵션 B(allUsers 제거 + 파일 레벨 ACL)를 **"코드 변경 최소"**로 권고했다.

**동의하는 부분**: fine-grained 모드 + ads/service 실측 결과 기반으로 기술적으로 타당.

**반론**:
1. **blog/* 파일 ACL 미검증**: 옵션 B의 전제("portal CMS는 이미 `public: true` 파일 레벨 설정 중")가 **실측되지 않았다**. 코드 분석만으로 "영향 최소"를 단정하는 것은 위험.
2. **profiles/* 파일 부재**: templates.js가 참조하는 이미지가 실제로 없으므로 allUsers 제거 자체와 무관하나, **향후 이미지 업로드 시 public 설정을 누락하면 studio UI 깨짐** → 업로드 프로세스 문서화 필요.
3. **Uniform 모드 전환 불가**: fine-grained → uniform 전환은 비가역. 현재 fine-grained이 옵션 B를 가능하게 하지만, GCP 권장은 uniform. 장기적으로 uniform 전환 + Cloud CDN/Load Balancer 경유 public 서빙이 더 안전.

---

## 2. 교정 시 데이터 유실 리스크 (Task 2)

### 2-1. 파일 레벨 ACL 보정 시 기존 ACL 덮어쓰기

| 리스크 | 상세 | 심각도 | 대응 |
|--------|------|--------|------|
| `gsutil acl set` 사용 시 기존 ACL 완전 대체 | monk-image-engine OWNER ACL이 유실되면 서비스에서 파일 접근 불가 | 🚨 HIGH | `gsutil acl ch` (change, not set) 사용. 또는 `gsutil acl get` → 백업 → 변경 |
| 대량 ACL 변경 시 API rate limit | 17,850 오브젝트 일괄 ACL 변경은 GCS API 쿼터 초과 가능 | ⚠️ MED | 배치 처리 + 속도 제한 |

### 2-2. raw_data/ 3.17GB 삭제 리스크

| 항목 | 현황 | 리스크 |
|------|------|--------|
| 백업 존재 여부 | **미확인** — GDrive/로컬 백업 미탐지 | 삭제 시 복구 불가 |
| 서비스 의존성 | 라이브 읽기 경로 0건 (막내1 확인) | 삭제해도 서비스 무영향 |
| 데이터 성격 | K-뷰티 크롤링 이미지 (2.93GB) + bwya 아카데미 자료 (227MB) | 재크롤링 가능 여부 불확실 |
| **권고** | 삭제 전 GDrive 이관 또는 별도 버킷 이동. allUsers 제거만으로 비공개 전환 가능하므로 **삭제 불필요** | — |

### 2-3. service/idphoto/ 고객 사진 이관 리스크

| 항목 | 현황 | 리스크 |
|------|------|--------|
| 마이페이지 재다운로드 | **미구현** — 현재 고객이 과거 사진에 재접근하는 경로 없음 | allUsers 제거와 무관한 **기존 한계** |
| Signed URL 만료 | 24시간 만료 → 생성 직후만 다운로드 가능 | 동일 — 기존 한계 |
| 경로 이동 시 | gcsPath가 Firestore 고객 레코드에 저장되어 있을 경우, 경로 변경 시 참조 깨짐 | ⚠️ MED — allUsers 제거(옵션 B)에서는 경로 변경 없으므로 무영향 |

### 2-4. studio 경로 혼용 분리 시 리스크

| 항목 | 현황 | 리스크 |
|------|------|--------|
| 혼용 상태 | studio gcs-save.js가 `service/idphoto/kr/{userId}/` 경로에 쓰는 중 (막내1 §2-3) | kr 고객 사진과 studio 생성물이 동일 폴더에 혼재 |
| 분리 시 | 경로를 `service/studio/{userId}/`로 변경하면 기존 studio 파일의 gcsPath 참조 깨짐 | ⚠️ MED |
| allUsers 제거와의 관계 | **무관** — allUsers 제거는 경로를 변경하지 않음 | 별도 PF로 처리 가능 |

---

## 3. 현행 보안 노출 심각도 평가 (Task 3)

### 3-1. 실증 검증 결과

| # | 경로 | 익명 HEAD 결과 | 익명 열거 (JSON API) | 파일 수 | 고객 수 |
|---|------|---------------|---------------------|--------|--------|
| 1 | `service/idphoto/kr/` | **HTTP 200** 🚨 | **가능** (오브젝트 메타데이터 전체 노출) | ~770 | 53명 |
| 2 | `service/idphoto/jp/` | (kr과 동일 구조) | **가능** | ~395 | 32명 |
| 3 | `raw_data/kbeauty_sources/` | **HTTP 200** 🚨 | **가능** | ~15,904 | — |
| 4 | `generated/` | **HTTP 200** 🚨 | **가능** | 164 | — |

**공격 시나리오**:
```
1. 공격자가 Storage JSON API로 prefix=service/idphoto/ 열거
2. 전체 userId 폴더 목록 취득 (85명)
3. 각 userId 하위의 original.jpg + generated.png 직접 다운로드
4. 고객 얼굴 사진 85명분 일괄 수집 완료
→ 소요 시간: 수 분. 인증 불필요. API 키 불필요.
```

### 3-2. raw_data/kbeauty_sources/ (2.93GB) 내용 분석

| 항목 | 분석 |
|------|------|
| 파일명 패턴 | `naver_{hash}_{hash}.jpg` — 네이버 이미지 크롤링 출처 |
| 하위 폴더 | `bg_cafe/`, 기타 카테고리별 분류 추정 |
| 데이터 성격 | K-뷰티 소스 이미지 (뷰티 모델/제품 사진) — 타사 저작물 |
| 고객 PII | ❌ 아님 — 크롤링 데이터이므로 고객 촬영물은 아님 |
| 리스크 | **저작권 침해** — 네이버 출처 이미지를 public GCS에서 재배포하는 형태 |
| 심각도 | ⚠️ HIGH (법적 리스크) |

### 3-3. generated/ (187MB) 내용 분석

| 항목 | 분석 |
|------|------|
| 파일명 패턴 | `{timestamp}_{index}.png` — AI 생성물 |
| 생성 주체 | monk_imagen4 프로토타입 (현재 비활성 추정 — 막내1 §5) |
| 데이터 성격 | AI 생성 이미지 (고객 촬영물 아님) |
| 리스크 | LOW — 직접적 PII 아님. 프로토타입 잔존물 |

### 3-4. GDPR / 개인정보보호법 위반 여부

| 법령 | 해당 조항 | 적용 여부 | 심각도 |
|------|----------|----------|--------|
| **한국 개인정보보호법** | 제24조의2 (생체인식정보) | ⚠️ **해당 가능** — 증명사진 = 얼굴 생체정보. 정보주체 동의 없는 공개 = 위반 소지 | 🚨 HIGH |
| **한국 개인정보보호법** | 제29조 (안전조치 의무) | ⚠️ **해당** — 개인정보 처리자의 기술적 보호조치 미흡 | 🚨 HIGH |
| **일본 個人情報保護法** | 第20조 (安全管理措置) | ⚠️ **해당** — JP 고객 32명의 顔写真 공개 상태 | 🚨 HIGH |
| **GDPR** (EU 고객 있을 경우) | Art. 32 (Security of processing) | 불확실 — EU 고객 여부 미확인 | ⚠️ MED |

**핵심 판단**: userId는 Google OAuth sub (opaque ID)이므로 **직접적 실명 식별은 불가**하나, **사진 자체가 생체정보**로서 개인정보에 해당. 사진과 userId의 조합으로 서비스 내 사용자 특정 가능 → **개인정보보호법 적용 대상**.

### 3-5. 보안 노출 등급 종합

| 경로 | 데이터 | 심각도 | 근거 |
|------|--------|--------|------|
| `service/idphoto/` | 고객 증명사진 85명 1,165건 | 🚨 **CRITICAL** | 생체정보 공개 + 열거 가능 + 인증/크레딧 우회 |
| `raw_data/` | 타사 크롤링 이미지 3.17GB | ⚠️ **HIGH** | 저작권 침해 + 출처 명시 (네이버 hash) |
| `generated/` | AI 프로토타입 187MB | ℹ️ **LOW** | 비활성 잔존물, PII 아님 |
| **monk-factory-storage** | 실명 고객 촬영물 648MB | 🚨 **CRITICAL** | 막내2 확인 — `이종윤님(프로필)` 폴더 존재 |

---

## 4. 교정 후 검증 체크리스트 (Task 4)

### Phase A — allUsers 제거 직후 (5분 이내)

```
□ A-1. allUsers 제거 확인
       gsutil iam get gs://monk-ai-images | grep allUsers → 결과 없음
□ A-2. 고객 사진 차단 확인 (익명 curl)
       curl -s -o /dev/null -w "%{http_code}" \
         "https://storage.googleapis.com/monk-ai-images/service/idphoto/kr/{sample_userId}/{sample_file}" → 403
□ A-3. raw_data 차단 확인
       curl -s -o /dev/null -w "%{http_code}" \
         "https://storage.googleapis.com/monk-ai-images/raw_data/kbeauty_sources/bg_cafe/{sample_file}" → 403
□ A-4. generated 차단 확인
       curl -s -o /dev/null -w "%{http_code}" \
         "https://storage.googleapis.com/monk-ai-images/generated/1769655806394_0.png" → 403
□ A-5. 열거 API 차단 확인
       curl -s "https://storage.googleapis.com/storage/v1/b/monk-ai-images/o?prefix=service/idphoto/" → 403 또는 items 0건
```

### Phase B — 공개 유지 서비스 정상 확인 (15분 이내)

```
□ B-1. ads 이미지 정상 접근
       curl -s -o /dev/null -w "%{http_code}" \
         "https://storage.googleapis.com/monk-ai-images/ads/manifest.json" → 200
□ B-2. 블로그 이미지 정상 접근 ⚠️ 최우선 확인
       curl -s -o /dev/null -w "%{http_code}" \
         "https://storage.googleapis.com/monk-ai-images/blog/{sample_file}" → 200
       → 403이면 즉시 롤백 (allUsers 재추가)
□ B-3. idphoto-kr 골든 패스 테스트
       촬영 → AI 생성 → 워터마크 미리보기 → 크레딧 결제 → 다운로드(Signed URL)
       전 단계 정상 동작 확인
□ B-4. idphoto-jp 골든 패스 테스트 (동일)
□ B-5. studio 프리셋 썸네일
       현재 404 (파일 없음) — allUsers 제거 전후 동일 상태 확인
```

### Phase C — 외부 영향 모니터링 (24시간)

```
□ C-1. GSC (Search Console) — monk-ai-images URL의 색인 제외 요청 제출
       service/*, raw_data/* 패턴 차단 (robots.txt는 GCS 미지원 → URL 제거 도구)
□ C-2. 블로그 페이지 이미지 로딩 확인 (실제 브라우저)
       monkos.ai/blog 의 각 게시글 이미지 정상 표시
□ C-3. 네이버 이미지 검색에 monk-ai-images URL 잔존 여부
□ C-4. Cloud Logging — 403 에러 급증 여부 모니터링
       (정상적 서비스 요청이 차단되고 있는지 확인)
```

### Phase D — 추가 조치 확인 (1주 이내)

```
□ D-1. profiles/ 이미지 업로드 시 파일 레벨 public 설정 프로세스 문서화
□ D-2. studio 경로 혼용 분리 계획 수립 (service/studio/ 전용 경로)
□ D-3. monk-factory-storage allUsers 제거 확인 (별도 P0)
□ D-4. raw_data/ GDrive 이관 여부 결정
□ D-5. generated/ 정리 (프로토타입 잔존물 삭제 또는 보존)
```

---

## 5. 반론 및 추가 의견

### 5-1. 막내2 "2-버킷 분리" 권고에 대한 반론

막내2는 `monk-ai-images`(public) + `monk-ai-customer-data`(private) 분리를 권고했다.

**반론**: fine-grained 모드 실측으로 **버킷 분리 없이도 public/private 분리 가능**. 버킷 분리는:
- 코드 변경 8개 파일 이상 (gcs-save.js ×3, deploy.sh ×4, config.js ×1)
- 기존 service/idphoto/ 경로의 Firestore 참조 갱신 필요
- 마이그레이션 중 서비스 중단 리스크

**옵션 B(allUsers 제거)가 블로그 ACL 검증만 통과하면 즉시 실행 가능하며, 코드 변경 0건.**

### 5-2. 실행 순서 권고

| 순서 | 조치 | 소요 | 전제 |
|------|------|------|------|
| **0** | blog/* 파일 레벨 ACL 검증 | 5분 | monk-image-engine SA 또는 프로젝트 owner 권한 보정 |
| **1** | monk-factory-storage allUsers 제거 | 1분 | 즉시 (서비스 의존 0) |
| **2** | monk-ai-images allUsers 제거 | 1분 | 순서 0 검증 통과 후 |
| **3** | Phase A~C 검증 | 24시간 | 체크리스트 기반 |
| **4** | profiles/ 이미지 업로드 프로세스 수립 | 별도 | Phase D |
| **5** | studio 경로 분리 | 별도 PF | Phase D |

### 5-3. 블로그 ACL 미검증 우회 방법

blog/* ACL 직접 검증이 불가능한 경우 대안:

1. **테스트 파일 업로드**: portal CMS로 테스트 블로그 이미지 1개 업로드 → 해당 파일 ACL 확인 → `allUsers:READER` 존재 확인
2. **2단계 실행**: allUsers 제거 → 즉시 blog/ URL curl → 200이면 성공 / 403이면 즉시 `gsutil iam ch allUsers:objectViewer gs://monk-ai-images`로 롤백 (1분 이내)
3. **스테이징**: dev 버킷에서 동일 코드로 테스트

---

## 6. 감사 방법 / 한계

**사용 명령** (읽기 전용):
- `curl -I` (HEAD only) — 익명 접근 검증 (5회). 콘텐츠 다운로드 없음.
- `gsutil uniformbucketlevelaccess get` — 접근 제어 모드 확인
- `gsutil acl get` — 파일 레벨 ACL 확인 (ads, service, raw_data, generated)
- `gsutil ls [-r]` — 파일 목록 확인 (파일명까지만, 내용 열람 없음)
- `grep -n` — 코드 분석 (gcs-save.js, server.js, result.js, upload.js, ai.js, blog.js)
- `curl` (Storage JSON API, maxResults=3) — 익명 열거 가능 여부 검증

**한계:**
- **blog/* 파일 ACL 미검증**: gdsajin@gmail.com 계정에 `storage.objects.getIamPolicy` 권한 부족. monk-image-engine SA 또는 권한 보정 필요.
- **구글 이미지 검색 인덱싱 여부**: 실제 Google 검색 미수행 — GSC 데이터 또는 실제 검색으로 확인 필요.
- **개인정보보호법 정식 법률 자문 미수행**: 법적 판단은 전문가 확인 권고.
- **Firestore 내 gcsPath 참조 확인 미수행**: 고객 레코드에 저장된 경로 패턴 확인 필요 (데이터 접근 규칙 ch4 10조에 의해 직접 조회 불가).

**헌법 준수:**
- 4조 1항 — 키·시크릿 값 미취급 ✅
- 4조 2항 — 버킷·IAM·서비스 변경 없음. 고객 촬영물 내용 열람 없음 (HEAD 요청 + 파일명만) ✅

---

**감사 완료**
**[2026-06-12 13:13 KST] iMac/막내3**

---
type: portfolio
id: PF_INFRA
name: "INFRA"
subject: "서비스 기반 인프라 — GCS 버킷·Drive 워크벤치·배포 파이프라인·SA 권한·에셋 레지스트리"
created: 2026-06-21
owner: 작가님
leads: "쌍아(설계)"
status: active
domain: 인프라
---

# PF_INFRA — 서비스 기반 인프라

> 전 서비스가 공유하는 인프라의 **살아있는 정본**.
> 죽은 문서(ASSET_REGISTRY 2월 동결)를 PF 체계로 살려서, 세션마다 갱신되고 에이전트가 참조하는 구조로 전환.

---

## 1. 비전

**"우리 인프라가 지금 어떤 상태인지, 이 PF 하나 읽으면 안다."**

기존에 monkos-ops/tech/에 정적 문서로 있던 인프라 정보들 — GCS 구조, 에셋 분류, SA 권한, 디바이스 맵 — 이 4개월간 갱신되지 않고 현실과 괴리된 채 방치. PF 체계로 편입하여 히스토리가 쌓이고, 변경이 추적되고, 에이전트가 착수 전 읽는 살아있는 문서로 전환한다.

---

## 2. 인프라 맵

### 2-1. GCS 버킷 (2026-06-21 전수 파악)

| 버킷 | 역할 | 상태 | 용량 | 파일 수 |
|------|------|------|------|---------|
| **monk-ai-images** | 메인 — 블로그, 광고, 생성물, 학습데이터, 프로필 에셋 | 활성 | 4.43 GB | 17,437 |
| **monk-customer-photos** | 고객 데이터 전용 (idphoto kr/jp/studio) | 신설 (배포 보류) | ~1 GB | 1,320 |
| **monk-project** | 통합 저장소 — 학습데이터 이관, 코퍼스, 레거시 스냅샷 | 마이그레이션 중 | 3.36 GB | 17,777 |
| **monkos-works-assets** | 팀 작업물 (한송이/꾸 rsync) | 활성 | 606 MB | 947 |
| monkos_cloudbuild | Cloud Build 소스 (자동생성) | 인프라 | 403 MB | 577 |
| run-sources-* (3개) | Cloud Run 소스 (자동생성) | 인프라 | 176 MB | 255 |
| monk-project-soul | 세션 로그 (이관 완료) | 레거시 | — | — |
| monk_session_data | Gemini 대화 (이관 완료) | 레거시 | — | — |

### 2-2. monk-ai-images 내부 구조

```
gs://monk-ai-images/
├── service/idphoto/{kr|jp|studio}/{userId}/  ← 고객 사진 (→ monk-customer-photos 이관 준비)
├── blog/{ts}_{filename}                      ← CMS 업로드 이미지 (공개)
├── blog/ai_{ts}_{slug}.jpg                   ← Imagen4 AI 생성 블로그 이미지
├── blog/og_{ts}_{slug}.jpg                   ← OG 썸네일 자동생성
├── ads/{ts}_{name}.ext + manifest.json       ← 광고 로테이션 FIFO 6장 (공개)
├── generated/{ts}_{index}.jpg                ← Imagen4 범용 생성물
├── assets/portal/slide/                      ← 포털 캐러셀 webp
├── profiles/master/{5종}/                    ← 헤드샷 프리셋 (현재 .keep만)
├── profiles/{background|fashion|hair|makeup}/ ← 4축 에셋 (현재 .keep만)
└── raw_data/kbeauty_sources/                 ← 학습 데이터 (monk-project와 중복)
```

### 2-3. 에셋 흐름 3층 구조 (2026-06-21 설계)

```
로컬 ~/MONKOS_ASSETS/       ←→    Google Drive MONKOS_ASSETS/    →    GCS 버킷
(워크벤치, 작가님/꾸)              (소통 허브, 에이전트 공유)           (프로드 정본)
 · macOS 동기화 앱으로 연동         · 클로드 디자인 읽기/쓰기            · 서비스가 URL 참조
 · 오프라인 작업 가능               · 철창이/코웍이 참조                 · 승격 스크립트로 동기화
                                  · 버전 관리 = 자연 백업
```

### 2-4. 배포 파이프라인

| 서비스 | 배포 방식 | 파일 |
|--------|----------|------|
| idphoto-kr | deploy.sh 경유 | monkos_AI/idphoto-kr/deploy.sh |
| idphoto-jp | deploy.sh 경유 | monkos_AI/idphoto-jp/deploy.sh |
| studio | deploy.sh 경유 | monkos_AI/studio/deploy.sh |
| portal | deploy.sh 경유 | monkos_AI/portal/deploy.sh |
| image-pro | deploy.sh 경유 | monkos_AI/image-pro/backend/deploy.sh |
| monk.kr | CF Pages (자동) | MONK_kr/ |
| pt.monkos.ai | gcloud 직접 (2조 한시적 예외) | — |

### 2-5. 시크릿

정본: `monkos-ops/ops/SECRET_INVENTORY.md` (24종 등록, GCP Secret Manager 기반)

### 2-6. SA 권한

정본: PF_SECURITY (completed → AUTOPILOT 이관). monk-image-engine SA 중심.

---

## 3. 기존 정적 문서 → PF 흡수

| 기존 문서 | 위치 | 상태 | PF_INFRA 내 역할 |
|-----------|------|------|-----------------|
| ASSET_REGISTRY.md | monkos-ops/tech/ | **2월 동결** | 에셋 분류 체계 참조 (현행화 필요) |
| GCS_BUCKET_STRUCTURE.md | monkos-ops/tech/ | **미생성** (링크 깨짐) | 본 PF §2-2가 대체 |
| SECRET_INVENTORY.md | monkos-ops/ops/ | 최신 유지 | 참조 링크 |
| credentials_inventory.md | monkos-ops/ops/ | — | 참조 링크 |

---

## 4. 히스토리

> **append only. 수정·삭제 금지.**

| 날짜 | 주체 | 내용 | 산출물 | 상태 |
|------|------|------|--------|------|
| 02/23 | — | ASSET_REGISTRY.md 최초 작성 (에셋 분류 6종, 저장소 인벤토리) | ASSET_REGISTRY.md | ✅ |
| 06/12 | iMac/막내1+2 | GCS 버킷 보안 전수조사 (삼권심사) | 보안 보고서 3건 | ✅ |
| 06/21 | iMac/쌍아 | GCS 전수 파악 — 9개 버킷, 8.97GB, ~37,000 파일 맵핑 완료 | 세션 내 보고 | ✅ |
| 06/21 | iMac/막내1 | monk-customer-photos 버킷 신설 + 데이터 복사 1,320건 + 코드 변경 (배포 보류) | 지시서+코드변경 | ⏳ |
| 06/21 | iMac/막내2 | 로컬 에셋 전수 조사 — 661개/1.19GB, 중복 210개(32%) + 워크벤치 구성안 기안 | 보고서+제안서 | ✅ |
| 06/21 | 작가님+쌍아 | 에셋 3층 구조 설계 (로컬↔Drive↔GCS) + PF_INFRA 신설 | PF_INFRA/README.md | ✅ |

---

## 5. Phase 현황

### Phase 1 — 현황 파악 ✅

| 항목 | 상태 |
|------|------|
| GCS 버킷 전수 파악 (9개) | ✅ |
| 로컬 에셋 전수 조사 (661개) | ✅ |
| 코드→GCS 참조 맵 (라인 단위) | ✅ |

### Phase 2 — 구조 설계 ⏳

| 항목 | 상태 |
|------|------|
| 고객/에셋 버킷 분리 설계 | ✅ (코드 변경 완료, 배포 보류) |
| 로컬 워크벤치 구조안 | ✅ (제안서 기안) |
| Drive 소통 허브 설계 | ⏳ (방향 확정, 상세 미정) |
| GCS prefix 확정 (STYLER 로드맵 감안) | ⏳ |

### Phase 3 — 실행

| 항목 | 상태 |
|------|------|
| 고객 버킷 분리 배포 | ⏳ (GCS prefix 확정 후) |
| 로컬 워크벤치 구축 + 중복 정리 | ⏳ |
| Drive 폴더 구조 생성 + macOS 동기화 | ⏳ |
| sync-assets.sh 스크립트 | ⏳ |
| ASSET_REGISTRY.md 현행화 or 폐기 | ⏳ |

### Phase 4 — 어드민

| 항목 | 상태 |
|------|------|
| 어드민 에셋 브라우저 (트리+썸네일) | ❌ |
| 고객 사진 리뷰 대시보드 | ❌ |

---

## 6. 관련 PF

| PF | 관계 |
|----|------|
| PF_STYLER | 서비스별 에셋 prefix 설계. 고객 데이터 구조 |
| PF_SECURITY | SA 권한, 보안 감사 결과 |
| PF_AUTOPILOT | CF↔CR 중계, 시크릿 통합, 브리핑 파이프라인 |
| PF_RETRIEVAL | 문서 인덱스. PF_INFRA 변경 시 리빌드 대상 |
| PF_MONK_OS | 하네스 아키텍처. 인프라는 하네스가 동작하는 기반 |
| PF_KKU | 꾸 워크벤치 (M2 동일 구조 적용) |

---

## 7. 리스크

| 리스크 | 확률 | 대응 |
|--------|------|------|
| 버킷 분리 후 기존 Signed URL 깨짐 | 낮음 | 원본 데이터 보존, 롤백 즉시 가능 |
| Drive 동기화 충돌 | 중 | macOS Drive 앱 충돌 해소 + 단방향 우선 |
| ASSET_REGISTRY 이중 정본 | 중 | PF_INFRA가 정본 선언, ASSET_REGISTRY는 참조/폐기 판정 |

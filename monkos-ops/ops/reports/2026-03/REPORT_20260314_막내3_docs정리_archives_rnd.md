---
type: REPORT
date: 2026-03-14
time: "17:03 KST"
from: iMac/막내3
to: iMac/쌍아
order: ORDER_20260314_iMac쌍아_막내3_docs정리_archives_rnd
subject: docs/ 정리 리서치 — archives + rnd + 루트 파일
---

# docs/ 정리 리서치 보고서: archives·rnd·메타문서

> **[2026-03-14 17:03 KST] iMac/막내3 → iMac/쌍아**
> **리서치 범위**: docs/archives/, docs/rnd_2026/, docs/README.md, docs/DOCUMENT_ATLAS.md, apps/ 비교, monkos-ops/tech/rnd/ 비교

---

## 1. docs/archives/backend-v1/ — 코드 백업

| 항목 | 내용 |
|------|------|
| **분류** | 코드 백업 |
| **크기** | 88K (7파일 + 2디렉토리) |
| **내용** | Cloud Run + Vertex AI Imagen 백엔드 v1 (TypeScript/Express) |
| **구성** | index.ts, routes/(photo/lookbook/model).ts, services/(imagen/storage).ts, Dockerfile, cloudbuild.yaml |
| **최종 수정** | 2026-02-22 |
| **참조처** | 8건 (전부 아카이브 맥락, 활성 참조 0건) |

### 후속 서비스와의 관계

| 비교 대상 | 관계 | 상세 |
|-----------|------|------|
| **monkos_AI/** (현행) | **완전 대체됨** | idphoto-kr, idphoto-jp, portal, crop-engine으로 서비스 분화. Express→모듈형 아키텍처 전환 |
| **apps/photolab-monkkr-legacy/** | 별개 | 프론트엔드 SPA 레거시 (백엔드가 아님) |
| **apps/photolab-monkkr-mpa-0219/** | 별개 | MPA 리팩토링 (프론트엔드) |

### 판정

**현위치 유지 권고**. 이유:
- monkos_AI로 완전 대체. 활성 참조 0건
- apps/에 유사 버전 없음 (apps는 프로토타입/PoC, backend-v1은 과거 프로덕션 코드)
- 이관할 곳이 없음 — apps/에 넣으면 "프로토타입" 성격과 맞지 않음
- 88K로 가볍고, README도 정비되어 있어 현 아카이브 위치가 적절

---

## 2. docs/archives/scripts-legacy/ — 코드 백업

| 항목 | 내용 |
|------|------|
| **분류** | 코드 백업 |
| **크기** | 284K (18파일 + factory/ 서브디렉토리) |
| **내용** | 레거시 스크립트 (Python/Shell/SQL/PowerShell) |
| **구성** | Gemini 프로세서 4종, K-Beauty 크롤러 3종, DB 스키마 2종, GCS 동기화 3종, 팩토리 오케스트레이터, 테스트 2종 |
| **최종 수정** | 2026-02-22 (아카이브 일괄 이동일) |
| **참조처** | 9건 (전부 아카이브 맥락) |

### 주목할 파일

| 파일 | 역사적 가치 |
|------|------------|
| `schema.sql` | MONK PROJECT 5버킷 D1/SQLite 스키마 — DB 아키텍처 변천사 참고 가능 |
| `kbeauty_pipeline.py` | K-Beauty 데이터 파이프라인 원형 — 향후 BWYA 복원 시 참고 가능 |
| `factory/orchestrator_overnight.ps1` | 야간 자동화 원형 — daemon 설계 참고 가능 |

### 판정

**현위치 유지 권고**. 이유:
- 전부 폐기 상태이나 일부 파일은 역사적·참고적 가치 있음
- README 정비 완료 상태
- 284K로 용량 부담 없음
- `scripts/` (루트 범용 유틸)과 혼동 방지를 위해 현 위치가 적절

---

## 3. docs/rnd_2026/ — R&D (부분 활성)

| 항목 | 내용 |
|------|------|
| **분류** | R&D |
| **크기** | **48MB** (문서 7MB + PDF변환 디딤돌 R&D 41MB) |
| **내용** | 디딤돌 R&D 신청·심사·이의신청·KOITA 보고서·기술 리서치·결제 리서치 |
| **파일 수** | 34건 (루트) + 16건 (PDF변환 서브) = 50건 |
| **최종 수정** | 2026-02-27 (README), 파일들은 01월~02월 |
| **참조처** | **67건** — 가장 많이 참조되는 폴더 |

### 파일별 분류

#### 제출 완료 (아카이브 성격)

| 파일 | 상태 | 크기 |
|------|------|------|
| DIDIMOL_RND_TEMPLATE.md/html | IRIS 제출 완료 (01-23) | 2.5MB (html) |
| 아이리스_입력용.txt | 제출 완료 | 12KB |
| 기술개발목표_초안.md | 제출 완료 | 3KB |
| 연구개발방법_초안.md | 제출 완료 | 7KB |
| KOITA_*.md/html/pdf (8건) | KOITA 제출 완료 | ~4MB |
| 용아_파이프라인_요청.md | 작성 완료 | 2KB |

#### 심사 대응 (종료됨 — 지원 제외 확정)

| 파일 | 상태 |
|------|------|
| 20260213_디딤돌_서면평가결과_분석.md | 분석 완료 (지원 제외) |
| 20260213_이의신청_절차_및_처리방법.md | 정리 완료 |
| 20260215_YONGA_RND_REBUTTAL_PROPOSAL.md | 작성 완료 |
| 20260212_RND_활동증빙_현장조사용.md | 작성 완료 |
| 20260220_RND_MONK_OS_인프라분석_AI리뷰.md | 분석 완료 |

#### 기술 리서치 (잠재적 활성)

| 파일 | 연관 | 활성도 |
|------|------|--------|
| GPU_LLM_ANALYSIS.md | 4060/5090 GPU 전략 | **중** — 향후 GPU 의사결정 시 참조 |
| SDXL_MODEL_COMPARISON_4060.md | 로컬 모델 비교 | **중** — 기술자립화 참조 |
| komoju_조사보고서.md | 일본 결제 | **낮** — 서비스 일본 진출 시 활성화 |
| komoju_poc_계획서.md | 일본 결제 | **낮** |
| komoju_vs_lemonsqueezy.md | 결제 비교 | **낮** |
| photoshop_applescript_리서치.md | 자동화 | **낮** |
| 토스_결제경로_캡처가이드.md | 결제 심사 | **낮** — 토스 심사 시 재활용 |

#### 유틸리티

| 파일 | 용도 |
|------|------|
| generate_pdf.py | R&D 보고서 PDF 생성기 |
| MONKOS_RND_DEVELOPMENT_REPORT.md | 총괄 개발 보고서 |

### R&D 분산 문제

현재 R&D 문서가 **두 곳에 분산**:

| 위치 | 시기 | 내용 | 성격 |
|------|------|------|------|
| `docs/rnd_2026/` | 01-15 ~ 02-27 | 디딤돌/KOITA/결제/GPU | **아카이브** (대부분 제출 완료·종료) |
| `monkos-ops/tech/rnd/` | 03-10 | On-Device AI, 벤치마크 스키마 | **활성 리서치** |

`monkos-ops/tech/rnd/README.md`에 "원본: `docs/rnd_2026/`"로 명시되어 있어 의도적 분리는 아닌 것으로 보인다. 시간이 지나면서 자연 분화된 상태.

### PDF변환 디딤돌 R&D/ (41MB)

| 항목 | 내용 |
|------|------|
| 공고 PDF | 디딤돌 시행계획 공고 등 (정부 서식 7건) |
| 동의서/ | **신용동의서 JPG, 개인정보 동의서 JPG 8건** (37MB) |
| .gitignore | `docs/rnd_2026/**/동의서/` → **이미 git 추적 제외** ✅ |

### 이관 검토: works/rnd/

- `works/` 폴더 자체가 **존재하지 않음**
- 이관하려면 `works/` 신설 필요 → 폴더 체계 변경
- 현 시점에서 대부분 종료된 문서를 위해 새 폴더를 만드는 것은 과도

### 판정

**현위치 유지 + 분산 통합 검토 권고**

1. docs/rnd_2026/는 현위치 유지 — 대부분 제출 완료·종료 상태의 아카이브
2. `works/rnd/` 이관 불필요 — works/ 폴더 자체 없음, 신설 근거 약함
3. **분산 해소**: monkos-ops/tech/rnd/의 활성 리서치도 docs/rnd_2026/에 통합하거나, 역으로 둘 다 monkos-ops/tech/rnd/로 통합하는 방향 결정 필요 (쌍아 판단 사항)
4. 기술 리서치 6건 (GPU/SDXL/KOMOJU/PS/토스) — 향후 재활용 가능, 현위치 유지

---

## 4. docs/README.md — 활성 (정확)

| 항목 | 판정 |
|------|------|
| 하위 폴더 목록 | ✅ 5개 정확히 일치 |
| 설명 | ✅ 각 폴더 성격 정확 |
| 갱신 필요 | ❌ 없음 |

---

## 5. docs/DOCUMENT_ATLAS.md — 활성 (갱신 필요)

| 항목 | 현황 |
|------|------|
| **최종 갱신** | 2026-02-27 (15일 전) |
| **참조처** | 6건 |

### 현행 구조 대비 차이점

| 섹션 | 문제점 |
|------|--------|
| 파일 수 | "~767건" — 현재 실제 수와 괴리 가능 (2.5주 경과) |
| apps/ 미포함 | apps/ 6개 폴더 목록 없음 (docs 외이므로 범위 밖일 수 있으나, 전체 아틀라스라면 포함 권장) |
| monkos-ops/ 번호 폴더 | `01~06_*/` 표기 — 현재 실제 구조와 다를 수 있음 |
| docs/rnd_2026/ 파일 수 | "56건" 기재 — 실제 50건 (정리 과정에서 감소했을 가능성) |
| monkos-ops/tech/rnd/ | R&D 활성 위치로 미기재 |
| `commands/_archive/` | 현존 여부 미확인 |

### rnd README 내 오래된 경로

monkos-ops/tech/rnd/README.md에서:
- `01_전략/decisions/` 경로 참조 → 실제로는 `monkos-ops/ops/decisions/` (번호 폴더는 이미 폐지된 구조)

### 판정

**갱신 필요** — 다만 이번 docs/ 정리 전체가 완료된 후 일괄 갱신하는 것이 효율적. 지금 갱신하면 후속 이동으로 또 깨짐.

---

## 종합 분류표

| 대상 | 분류 | 이관 필요 | 크기 | 권고 |
|------|------|----------|------|------|
| archives/backend-v1/ | 코드 백업 | ❌ | 88K | 현위치 유지 |
| archives/scripts-legacy/ | 코드 백업 | ❌ | 284K | 현위치 유지 |
| rnd_2026/ (루트 문서) | R&D (대부분 종료) | ❌ | 7MB | 현위치 유지 |
| rnd_2026/PDF변환 디딤돌 R&D/ | R&D (제출 서식) | ❌ | 41MB | 현위치 유지 (동의서 git 제외 확인 ✅) |
| docs/README.md | 활성 | ❌ | — | 변경 불필요 |
| docs/DOCUMENT_ATLAS.md | 활성 (stale) | ❌ | — | **전체 정리 완료 후 일괄 갱신** |

### 발견된 이슈 (쌍아 판단 필요)

| # | 이슈 | 심각도 | 권고 |
|---|------|--------|------|
| 1 | R&D 문서 2곳 분산 (docs/rnd_2026 ↔ monkos-ops/tech/rnd) | 중 | 통합 방향 결정 필요 |
| 2 | DOCUMENT_ATLAS.md 15일 미갱신 | 낮 | 전체 정리 완료 후 일괄 갱신 |
| 3 | monkos-ops/tech/rnd/README.md 내 구 경로 (`01_전략/`) 참조 | 낮 | `monkos-ops/ops/decisions/`로 보정 |
| 4 | rnd_2026/ 48MB 중 41MB가 PDF/JPG — git 레포 용량 부담 | 정보 | 대부분 .gitignore 처리 완료 |

---

*본 보고서는 리서치 결과이며, 실제 이동/삭제는 수행하지 않았습니다 (ch7 3조 준수).*

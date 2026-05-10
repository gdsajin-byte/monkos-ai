---
type: order
date: 2026-05-10
from: iMac/쌍아
to: iMac/막내
subject: PF 17개 전수 조사 — 신규 9섹션 구조 대비 갭 분석
status: 대기
portfolio: PF_MONK_OS
---

# 지시서: PF 17개 전수 조사 — 신규 9섹션 구조 대비 갭 분석

> **[2026-05-10 11:52 KST]** iMac/쌍아 → iMac/막내

---

## 배경

PF 체계가 진화했다. 기존 PF(관리 허브)에 2개 섹션이 추가되어 **9섹션 구조**가 확정됐다:

| § | 섹션 | 신규 여부 |
|---|------|----------|
| 1 | 비전 | 기존 |
| 2 | 히스토리 | 기존 |
| 3 | Phase 현황 | 기존 |
| 4 | 아키텍처 | 기존 (일부 PF만) |
| 5 | 복기 | 기존 |
| 6 | **devlog (R&D 개발 노트)** | **신설** |
| 7 | **사업화 프레임 (4축)** | **신설** |
| 8 | 관련 문서 인덱스 | 기존 |
| 9 | 리스크 | 기존 |

**사업화 프레임 4축**: 차별성(뭐가 다른데?) / 사업 모델(어떻게 돈 버는데?) / 수익 전망(얼마 벌 거 같아?) / 확장성(더 커질 수 있어?)

**devlog 한 편의 구조**: 제목=질문/의도 → 문제의식 → 전개/리서치 → 해결방안 → 실행 → 결과 → 리뷰

**참조 정본**:
- 템플릿: `monkos-ops/ops/portfolios/PF_TEMPLATE.md`
- 첫 적용 사례: `monkos-ops/ops/portfolios/PF_CHATBOT/` (PF_CHATBOT.md + devlog/)

---

## 지시 사항

### 1. 전수 조사 — 17개 PF 현황 진단

아래 17개 PF를 **전부** 읽고, 각 PF의 현재 구조를 9섹션 기준으로 진단하라.

| # | PF | 경로 |
|---|-----|------|
| 1 | PF_PHOTOPRO | `portfolios/PF_PHOTOPRO.md` |
| 2 | PF_PORTAL | `portfolios/PF_PORTAL.md` |
| 3 | PF_CROP | `portfolios/PF_CROP.md` |
| 4 | PF_STUDIO | `portfolios/PF_STUDIO.md` |
| 5 | PF_CDP | `portfolios/PF_CDP.md` + `portfolios/PF_CDP/` |
| 6 | PF_SECURITY | `portfolios/PF_SECURITY/README.md` |
| 7 | PF_CITADEL | `portfolios/PF_CITADEL.md` |
| 8 | PF_SPREAD | `portfolios/PF_SPREAD.md` + `portfolios/PF_SPREAD/` |
| 9 | PF_EVENT | `portfolios/PF_EVENT.md` |
| 10 | PF_PROFILES | `portfolios/PF_PROFILES.md` |
| 11 | PF_MONK_OS | `portfolios/PF_MONK_OS/README.md` |
| 12 | PF_DOCS | `portfolios/PF_DOCS/README.md` |
| 13 | PF_RND | `portfolios/PF_RND/README.md` |
| 14 | PF_BRIEF | `portfolios/PF_BRIEF.md` |
| 15 | PF_PRESENTATION | `portfolios/PF_PRESENTATION.md` |
| 16 | PF_VIDEO | `portfolios/PF_VIDEO.md` |
| 17 | PF_CHATBOT | `portfolios/PF_CHATBOT/PF_CHATBOT.md` (참조용, 이미 완성) |

### 2. 산출물 — 갭 분석 보고서

보고서 파일: `monkos-ops/ops/sessions/2026-05/REPORT_20260510_막내_PF전수조사_갭분석.md`

#### 2-1. PF별 갭 테이블

각 PF에 대해 아래 테이블을 채워라:

```markdown
| PF | §1 비전 | §2 히스토리 | §3 Phase | §4 아키텍처 | §5 복기 | §6 devlog | §7 사업화 | §8 문서인덱스 | §9 리스크 | 총평 |
|----|---------|-----------|---------|-----------|--------|---------|---------|------------|---------|------|
| PHOTOPRO | ✅/⚠️/❌ | ... | ... | ... | ... | ❌ 없음 | ❌ 없음 | ... | ... | {한 줄} |
```

판정 기준:
- ✅ = 해당 섹션이 존재하고 내용이 실질적
- ⚠️ = 존재하나 빈약하거나 갱신 필요
- ❌ = 없음

#### 2-2. devlog 후보 리스트

각 PF에서 **devlog로 쓸 만한 기술 판단**을 식별하라. 히스토리·복기·세션 로그에서 추출.

형식:
```markdown
### PF_XXX
| # | 질문 (devlog 제목 후보) | 시기 | 근거 (커밋/세션로그/히스토리 행) |
|---|----------------------|------|------|
| 001 | "왜 Vertex AI로 갔는가?" | 01월 | 히스토리 3행, `a08f5ff` |
```

#### 2-3. 사업화 프레임 난이도 판정

각 PF가 사업화 4축을 채울 수 있는 정도를 판정:

```markdown
| PF | 차별성 | 사업모델 | 수익전망 | 확장성 | 판정 |
|----|--------|---------|---------|--------|------|
| PHOTOPRO | 재료 있음 | 재료 있음 | 측정 필요 | 재료 있음 | 즉시 작성 가능 |
| STUDIO | 재료 부족 | 불명확 | 미정 | 재료 있음 | 추가 리서치 필요 |
```

판정 카테고리:
- **즉시 작성 가능**: 기존 문서·히스토리에 재료가 충분
- **추가 리서치 필요**: 경쟁사 조사나 시장 데이터 보충 필요
- **보류**: paused/draft 상태로 급하지 않음

#### 2-4. 우선순위 제안

위 결과를 종합하여 **사업화 프레임 + devlog 보강 우선순위 TOP 5**를 제안하라.

기준:
- 지원사업(PF_RND) 연관 PF 우선
- active 상태 + 매출 직결 PF 우선
- 재료가 이미 풍부한 PF 우선 (ROI 높음)

---

## ⚠️ 준수 조항

- **읽기 전용 조사**: PF 파일을 수정하지 마라. 보고서만 작성.
- **헌법 3조 1항**: 타임스탬프는 `date` 명령으로 취득. 추정 금지.
- **보고서 배치**: `monkos-ops/ops/sessions/2026-05/` 월별 폴더.
- **YAML frontmatter 필수** (ch4 7조).
- **완료 보고**: `✅❌💡⏳📁🔀` 형식. 보고가 세션 마지막 출력.

---

## 예상 소요

- PF 17개 × Read + 분석 = 중간 규모 작업
- 보고서 1건 산출

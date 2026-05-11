---
type: order
from: iMac/쌍아
to: iMac/막내1
date: 2026-05-11
project: PF_AUTOPILOT 정비
priority: 높음
portfolio: PF_AUTOPILOT
deadline: 금일 내
---

# 지시서: PF_AUTOPILOT 문서 양식 정비

## 배경

- PF_AUTOPILOT이 오늘 발족 + 설계 과정에서 급속 성장하여 PF_TEMPLATE 양식과 괴리 발생
- PF_BRIEF + PF_SECURITY를 병합 흡수했으므로, 통합 정본으로서 양식 정합 필수
- 5/10 PF 체계 진화(9섹션 구조 + devlog 서론 6단계 + 사업화 4축)가 반영되지 않은 상태

## 임무

### 1. PF_TEMPLATE 양식 대조 → 누락 섹션 보충

`monkos-ops/ops/portfolios/PF_TEMPLATE.md` 기준으로 PF_AUTOPILOT.md를 정비.

현재 AUTOPILOT에 **있는 것**:
- §1 비전 (✅ 있으나 구조 정비 필요)
- §2 히스토리 (✅)
- §3 Phase 현황 (✅)
- §4 성과 (✅ 빈 테이블)
- §5 복기 (✅)
- §6 관련 문서 인덱스 (✅ 일부)
- §7 리스크 (✅)

**보충 필요**:
- §7 devlog — 현재 없음. `PF_AUTOPILOT/devlog/README.md` 폴더형 승격 + 서론 뼈대
- §8 사업화 프레임 — 현재 없음. 인프라 PF라 경량화 가능하나 틀은 갖출 것

### 2. 비전 섹션 구조 정비

현재 비전 아래에 아키텍처 다이어그램, 4대 역할 상세, PF_BRIEF 흡수, 시크릿 관리 통합, 성공 지표가 뒤섞여 있음.

정리 방향:
- §1.비전: 한 줄 목표 + "왜 이것을 하는가" + 성공 지표 (PF_TEMPLATE 구조)
- 아키텍처 다이어그램, 4대 역할, 흡수 PF 맥락 → §6 관련 문서 또는 별도 SPEC 문서로 이관

### 3. 관련 문서 인덱스 완결

PF_TEMPLATE의 §6 구조(기안서/기술명세/보고서/지시서/커밋 테이블)로 재편. 현재 누락:

| 구분 | 파일 | 비고 |
|------|------|------|
| 기안서 | 본 PF 자체 | 이미 기재 |
| 기술명세 | 없음 | 향후 생성 시 등록 |
| 보고서 | SECRET_INVENTORY.md | 추가 필요 |
| 지시서 | 본 지시서 + ORDER_20260511_막내2_브리핑 | 추가 필요 |
| 커밋 | 해당 커밋 해시 | Phase 0 커밋 기록 |

병합된 PF 참조:
- PF_BRIEF.md → 히스토리 보존, 정본은 AUTOPILOT
- PF_SECURITY/README.md → 히스토리 보존, 기준선 문서 [GCP 감사 보고서](../../reports/REPORT_20260422_GCP_Firebase_인프라감사.md) 링크 유지

### 4. YAML frontmatter 확인

```yaml
type: portfolio
id: PF_AUTOPILOT
name: "AUTOPILOT"
subject: "{현행 one-liner}"
created: 2026-05-11
owner: 작가님
leads: "쌍아(설계), 막내(구현)"
status: active  ← draft → active 전환
domain: 인프라
```

### 5. 폴더형 승격

현재 파일형 `PF_AUTOPILOT.md` → 폴더형 `PF_AUTOPILOT/README.md`로 전환.
- `PF_AUTOPILOT/devlog/README.md` 서론 뼈대 생성
- 기존 `PF_AUTOPILOT.md` → `PF_AUTOPILOT/README.md`로 이동
- `portfolios/README.md` 인덱스 링크 갱신

## ⚠️ 준수 조항

- **헌법 3조 2항**: 히스토리 append-only. 기존 행 수정·삭제 금지
- **ch4 9조**: PF YAML 필수 필드 준수
- PF_BRIEF·PF_SECURITY의 히스토리는 건드리지 않음 (각자 파일에 보존)

## 완료 기준

- [ ] PF_TEMPLATE 9섹션 구조 정합
- [ ] devlog/README.md 서론 뼈대 생성
- [ ] 폴더형 승격 + 인덱스 링크 갱신
- [ ] YAML status: active 전환
- [ ] COMPLETION 보고서 → 세션 로그 어펜드 → PF 히스토리 1행 어펜드

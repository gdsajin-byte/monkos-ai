---
type: completion
date: 2026-05-15
device: iMac
agent: 막내1
status: 완료
---

# COMPLETION: PF 폴더 구조 정리 + 현행화

> **[2026-05-15 17:10 KST] iMac/막내1**

## 분석 결과

| PF | 이전 위치 | 이후 위치 | status | 마지막 갱신 | 비고 |
|----|----------|----------|--------|-----------|------|
| PF_AUTOPILOT | PF_AUTOPILOT/README.md | (유지) | active | 05-12 | — |
| PF_BRIEF | PF_BRIEF.md (루트) | PF_BRIEF/README.md | completed | 05-11 | 신규 폴더 |
| PF_CDP | PF_CDP.md + PF_CDP/README.md | PF_CDP/README.md (루트md 정본) | active | 04-10 | 기존 README→COMPONENT 보존 |
| PF_CHATBOT | PF_CHATBOT/PF_CHATBOT.md | PF_CHATBOT/README.md | active | 05-10 | 폴더 내 rename |
| PF_CITADEL | PF_CITADEL.md (루트) | PF_CITADEL/README.md | active | 05-14 | 신규 폴더 |
| PF_CROP | PF_CROP.md (루트) | PF_CROP/README.md | active | 05-15 | 신규 폴더 |
| PF_DOCS | PF_DOCS/README.md | (유지) | active | 05-09 | — |
| PF_EVENT | PF_EVENT.md (루트) | PF_EVENT/README.md | active | 05-09 | 신규 폴더 |
| PF_FACTORY | PF_FACTORY.md + PF_FACTORY/ | PF_FACTORY/README.md | draft | 05-13 | 루트md→폴더 |
| PF_MONK_OS | PF_MONK_OS/README.md | (유지) | draft | 05-14 | YAML 따옴표 수정 |
| PF_MUSE | PF_MUSE.md + PF_MUSE/ | PF_MUSE/README.md | active | 05-14 | 루트md→폴더 |
| PF_PHOTOPRO | PF_PHOTOPRO.md (루트) | PF_PHOTOPRO/README.md | active | 04-14 | 신규 폴더 |
| PF_PORTAL | PF_PORTAL.md (루트) | PF_PORTAL/README.md | active | 04-25 | 신규 폴더 |
| PF_PRESENTATION | PF_PRESENTATION.md (루트) | PF_PRESENTATION/README.md | active | 04-10 | 신규 폴더 + YAML 수정 |
| PF_PROFILES | PF_PROFILES.md (루트) | PF_PROFILES/README.md | draft | 04-29 | 신규 폴더 + YAML 수정 |
| PF_RND | PF_RND/README.md | (유지) | active | 04-25 | — |
| PF_SECURITY | PF_SECURITY/README.md | (유지) | completed | 05-11 | — |
| PF_SPREAD | PF_SPREAD.md + PF_SPREAD/ | PF_SPREAD/README.md | active | 05-10 | 루트md→폴더 |
| PF_STUDIO | PF_STUDIO.md (루트) | PF_STUDIO/README.md | paused | 05-09 | 신규 폴더 |
| PF_TEMPLATE | PF_TEMPLATE.md (루트) | PF_TEMPLATE/README.md | 템플릿 | 05-10 | 신규 폴더 |
| PF_VIDEO | PF_VIDEO.md (루트) | PF_VIDEO/README.md | active | 04-27 | 신규 폴더 |

## 현행화 대상

| PF | 이슈 | 조치 |
|----|------|------|
| PF_PHOTOPRO | 마지막 갱신 04-14 (1개월+) | ⏳ paused 전환 검토 대상 — 작가님 판단 필요 |
| PF_PRESENTATION | 마지막 갱신 04-10 (1개월+) | ⏳ paused 전환 검토 대상 — 작가님 판단 필요 |
| PF_MONK_OS | YAML status: "draft" (따옴표) | ✅ 수정 완료 → status: draft |
| PF_PRESENTATION | YAML status: "active" (따옴표) | ✅ 수정 완료 → status: active |
| PF_PROFILES | YAML status: "draft" (따옴표) | ✅ 수정 완료 → status: draft |
| PF_CDP | 중복 — 루트md(455줄, type:portfolio) + 폴더README(203줄, type:component) | ✅ 루트md→README.md, 기존README→COMPONENT_CDP_로컬도구.md |

## 500줄 초과 (아카이브 검토)

| PF | 행 수 |
|----|-------|
| PF_CROP | 632 |
| PF_SPREAD | 509 |

## README.md 인덱스 갱신 내역

- 전체 21개 PF 링크를 `PF_{코드네임}/README.md` 폴더 구조로 통일
- PF_TEMPLATE 행 추가 (메타 도메인)
- 네이밍 섹션: "파일형 또는 폴더형" → "폴더 구조 통일"로 갱신
- 템플릿 참조 링크 갱신

## 📁 산출물
- 정리된 21개 PF 폴더 구조 (git mv 사용, 히스토리 보존)
- YAML frontmatter 따옴표 수정 3건
- portfolios/README.md 인덱스 갱신
- monkos-ops/ops/reports/2026-05/COMPLETION_20260515_막내1_PF폴더구조정리.md

## 🔀 커밋 대기

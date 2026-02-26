---
type: migration-log
date: 2026-02-23
author: 막내1
---

# Governance Migration Log

## 2026-02-23: 헌법 개정 이행

**근거**: 2026-02-22 PM3 세션 — 만장일치 통과 (5/5)

### 이동된 파일
| 원래 경로 | 새 경로 |
|----------|---------|
| docs/infrastructure/laws/ch1~ch8 (8건) | governance/laws/ |
| docs/infrastructure/constitution/amendment.md | governance/constitution/ |
| monkos-ops/03_개발/tasks/PETITION_*.md (2건) | governance/constitution/petitions/ |
| monkos-ops/01_전략/philosophy/PHILOSOPHY.md | governance/philosophy/ |
| monkos-ops/01_전략/philosophy/indexes/ (2건) | governance/philosophy/indexes/ |

### CLAUDE.md 변경
- 법률 인덱스 경로 8건 갱신 (docs/infrastructure/laws/ → governance/laws/)
- 제12조(개정 청구권) 신설
- 제13조(문서 규격 준수) 신설
- 문서 위계 "11조" → "13조" 갱신
- 개정 절차 amendment.md 경로 갱신

### 리다이렉트 노트
- docs/infrastructure/laws/README.md
- docs/infrastructure/constitution/README.md

### 코드(런타임) 영향: 0건

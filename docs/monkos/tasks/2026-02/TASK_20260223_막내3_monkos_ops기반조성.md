---
type: task
id: TASK_20260223_막내3_monkos_ops기반조성
from: 쌍아
to: 막내3
date: 2026-02-23 00:10 KST
priority: P1
status: pending
tags: [monkos-ops, restructure, department-skeleton, governance]
depends_on: TASK_20260223_막내1_governance이행
---

# 지시서: monkos-ops/ 기반 조성

> **근거**: 2026-02-22 PM3 세션 — 작가님 지시 "각 파트에 기반을 다진다"
> **전제**: 막내1의 governance/ 이행 커밋이 완료된 후 시작할 것
> **범위**: 골격 생성 + 명백한 파일만 이동. 본격 재편은 별도 법률 개정 후.

---

## 1. 작업 개요

monkos-ops/ 4부서 재편은 아직 법률 개정 전이다. 본 작업은 **기반 조성**만 수행:

1. 4부서 골격 폴더 + README.md 생성
2. 현행 번호 폴더(01_전략~06_로그)에서 **명백하게 귀속되는 파일만** 새 부서로 복사(또는 심링크)
3. 번호 폴더는 **삭제하지 않는다** (법률 개정 전이므로)

---

## 2. 4부서 구조 생성

```bash
mkdir -p monkos-ops/ops
mkdir -p monkos-ops/tech
mkdir -p monkos-ops/contents
mkdir -p monkos-ops/marketing
```

### 각 부서 README.md

#### monkos-ops/ops/README.md
```markdown
---
type: department-readme
department: ops
created: 2026-02-23
status: skeleton
---

# Operations (운영관리)

> monkos-ops/ops/ — 프로젝트 운영 총괄

## 소관
- 전략 기획, 의사결정 기록
- 크레덴셜/보안 관리
- 주간 계획, 운영 오버뷰
- 세션 로그, 메트릭스
- 에이전트 오케스트레이션

## 매핑 (현행 → 신규)
| 현행 폴더 | 이관 대상 |
|----------|----------|
| 01_전략/ | 전략, 결정, 크레덴셜 |
| 06_로그/ | 세션 로그, 메트릭스, 오케스트레이션 |

## 상태
기반 조성 단계. 본격 이관은 ch4 법률 개정 후.
```

#### monkos-ops/tech/README.md
```markdown
---
type: department-readme
department: tech
created: 2026-02-23
status: skeleton
---

# Technology (기술)

> monkos-ops/tech/ — 기술 개발 및 인프라

## 소관
- 아키텍처 설계, 기술 명세
- 코드 리뷰, 포스트모템
- 배포 가이드, 릴리즈
- R&D, 스펙

## 매핑 (현행 → 신규)
| 현행 폴더 | 이관 대상 |
|----------|----------|
| 02_리서치/ | 기술 리서치 |
| 03_개발/ | 스펙, 리뷰, 릴리즈, 태스크 |

## 상태
기반 조성 단계. 본격 이관은 ch4 법률 개정 후.
```

#### monkos-ops/contents/README.md
```markdown
---
type: department-readme
department: contents
created: 2026-02-23
status: skeleton
---

# Contents (콘텐츠)

> monkos-ops/contents/ — 콘텐츠 제작 및 교육

## 소관
- 아카데미 (뷰야 등)
- 출판물, 문서 제작
- 다국어 콘텐츠 (quotes_kr, quotes_jp)
- 템플릿, IR 자료

## 매핑 (현행 → 신규)
| 현행 폴더 | 이관 대상 |
|----------|----------|
| 04_문서/ | 아카데미, 콘텐츠, 출판, 템플릿 |

## 상태
기반 조성 단계. 본격 이관은 ch4 법률 개정 후.
```

#### monkos-ops/marketing/README.md
```markdown
---
type: department-readme
department: marketing
created: 2026-02-23
status: skeleton
---

# Marketing (마케팅)

> monkos-ops/marketing/ — 마케팅, 브랜딩, 외부 소통

## 소관
- 마케팅 전략, 주간 전략
- 키워드, SEO
- 외부 협업 (한송이 등)
- SNS 채널 운영

## 매핑 (현행 → 신규)
| 현행 폴더 | 이관 대상 |
|----------|----------|
| 05_공유/ | 외부 협업 (한, 꾸) |

## 상태
기반 조성 단계. 본격 이관은 ch4 법률 개정 후.
```

---

## 3. 명백한 파일 이동 가이드

**원칙: 현행 번호 폴더에서 "이 파일은 100% 이 부서"라고 판단되는 것만 이동.**
**번호 폴더 자체는 유지한다.**
**판단이 1%라도 애매하면 이동하지 않는다.**

### 이동 예시 (참고용 — 실제 판단은 막내3이 수행)

| 현행 경로 | 귀속 부서 | 확신도 |
|----------|----------|--------|
| `01_전략/decisions/` | ops | 높음 — 의사결정 기록 |
| `01_전략/credentials_inventory.md` | ops | 높음 — 보안 관리 |
| `01_전략/strategy_catalog.md` | ops | 높음 — 전략 총괄 |
| `01_전략/rnd/` | tech | 높음 — R&D |
| `03_개발/reviews/` | tech | 높음 — 코드 리뷰 |
| `03_개발/specs/` | tech | 높음 — 기술 스펙 |
| `03_개발/releases/` | tech | 높음 — 릴리즈 |
| `04_문서/academy/` | contents | 높음 — 교육 |
| `04_문서/contents/` | contents | 높음 — 콘텐츠 |
| `04_문서/publications/` | contents | 높음 — 출판 |
| `05_공유/han/` | marketing | 높음 — 외부 협업 |
| `05_공유/kku/` | marketing | 높음 — 외부 협업 |
| `06_로그/sessions/` | ops | 높음 — 세션 로그 |
| `06_로그/metrics/` | ops | 높음 — 메트릭스 |
| `06_로그/orchestration/` | ops | 높음 — 오케스트레이션 |

**이동 방식**: `git mv` 사용. 원본 폴더가 비더라도 폴더 자체는 유지 (빈 `.gitkeep` 생성).

### 이동하지 않는 것

| 파일 | 사유 |
|------|------|
| 각 번호 폴더의 `README.md` | 현행 폴더 README는 유지 |
| `01_전략/philosophy/` | **막내1이 governance/로 이동** — 잔재 확인만 |
| `03_개발/tasks/PETITION_*.md` | **막내1이 governance/로 이동** — 잔재 확인만 |
| `02_리서치/` 하위 빈 폴더들 | 아직 콘텐츠 없음 |
| `04_문서/ir-materials/` | ops인지 contents인지 애매 |
| `04_문서/templates/` | 공용 성격, 귀속 재고 필요 |
| `04_문서/reports/` | ops인지 contents인지 관점 차이 |

---

## 4. 05_공유/ + scripts/ 귀속 문제

이것은 **후속 법률 개정 과제**로 등록되어 있다. 본 작업에서는:

- `05_공유/` → `marketing/` 이동은 명백한 것만 (han, kku)
- `monkos-ops/scripts/` → 귀속 미정. 이동하지 않는다.

---

## 5. 커밋 전략

- 단일 커밋 권장
- 커밋 메시지:
```
[기반] monkos-ops/ 4부서 골격 생성 + 명백 파일 초기 배치

- ops/, tech/, contents/, marketing/ 골격 + README 생성
- 명백 귀속 파일 N건 이동 (01_전략→ops, 03_개발→tech 등)
- 번호 폴더(01~06) 유지 (법률 개정 전)
- 미분류 N건 현 위치 유지 (보고서 참조)

Co-Authored-By: 쌍아
```

---

## 6. 완료 조건

- [ ] 4부서 골격 폴더 + README.md 4건 생성
- [ ] 명백한 파일 이동 (이동 건수 보고)
- [ ] 미이동 파일 + 사유 목록 (보고서)
- [ ] 번호 폴더 미삭제 확인
- [ ] 막내1 이동분(philosophy, PETITION)의 잔재 정리 확인
- [ ] 커밋 + push
- [ ] 완료 보고 (헌법 제2조 형식)

---

## 7. 금지사항

- **번호 폴더(01_전략~06_로그) 삭제 금지** — 법률 개정 전
- **governance/ 건드리기 금지** (막내1 영역)
- **docs/ 건드리기 금지** (막내2 영역)
- **monkos-ops/README.md 삭제 금지** — 갱신은 가능
- **scripts/ 이동 금지** — 귀속 미정
- **애매한 파일 강제 분류 금지** — 남겨두고 보고

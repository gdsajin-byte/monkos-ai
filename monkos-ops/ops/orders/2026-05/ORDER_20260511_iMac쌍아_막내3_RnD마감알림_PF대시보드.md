---
type: order
from: iMac/쌍아
to: iMac/막내3
date: 2026-05-11
project: R&D 마감 알림 + PF 대시보드
priority: 보통
portfolio: PF_AUTOPILOT
deadline: 금일 내
---

# 지시서: R&D 마감 알림 + PF 상태 대시보드

## 배경

- PF_RND에 정부 R&D 지원사업 트랙이 있고, 각 트랙에 timeline 파일 존재
- 마감일 근접 시 자동 알림이 없어서 수동 추적에 의존
- PF 15개의 상태(active/blocked/paused 등)를 한눈에 볼 대시보드도 없음
- 두 건 다 간단한 cron + 파싱이므로 하나의 워크플로우로 묶어도 됨

## 임무

### 1. R&D 마감 알림 스크립트 — `.github/scripts/rnd_deadline_check.py`

PF_RND 하위 트랙 timeline 파일을 읽어서 마감일 근접 건을 감지.

```python
# 1. monkos-ops/ops/portfolios/PF_RND/tracks/ 하위 timeline.md 파일 전수 스캔
# 2. 날짜 패턴 (YYYY-MM-DD) 추출
# 3. D-7 이내 건 → 🟠 주목, D-3 이내 → 🔴 긴급
# 4. 결과를 stdout 마크다운으로 출력
```

timeline 파일 구조를 먼저 읽어서 날짜 패턴을 파악한 뒤 구현.
파일이 없거나 날짜가 없으면 빈 결과 (에러 아님).

### 2. PF 상태 대시보드 스크립트 — `.github/scripts/pf_dashboard.py`

```python
# 1. monkos-ops/ops/portfolios/ 하위 PF 파일 전수 스캔
# 2. YAML frontmatter에서 id, name, status, subject 추출
# 3. 상태별 그룹핑 (active / blocked / paused / draft / completed)
# 4. 마크다운 테이블 출력
```

출력 형식:
```markdown
# PF 상태 대시보드 — YYYY-MM-DD

## 🟢 Active (N건)
| PF | 주제 |
|---|---|

## 🔴 Blocked (N건)
| PF | 주제 |

## 🟡 Draft / Paused (N건)
| PF | 주제 |

## ✅ Completed (N건)
| PF | 주제 |
```

### 3. 워크플로우 — `.github/workflows/weekly-dashboard.yml`

```yaml
name: Weekly Dashboard

on:
  schedule:
    - cron: '0 21 * * 0'  # UTC 21:00 일요일 = KST 06:00 월요일
  workflow_dispatch:

jobs:
  dashboard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: pip install pyyaml

      - name: R&D deadline check
        run: python .github/scripts/rnd_deadline_check.py > /tmp/rnd.md

      - name: PF dashboard
        run: python .github/scripts/pf_dashboard.py > /tmp/pf.md

      - name: Create Issue
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          BODY=$(cat /tmp/pf.md /tmp/rnd.md)
          gh issue create \
            --title "📋 주간 대시보드 $(date +%Y-%m-%d)" \
            --body "${BODY}" \
            --label "주간대시보드"

      # 텔레그램 알림 (막내2가 텔레그램 허브 완성 후 활성화)
      # - name: Telegram
      #   ...
```

### 4. 라벨 생성

```bash
gh label create "주간대시보드" --color "5319e7" --description "PF_AUTOPILOT 주간 상태 요약" --repo gdsajin-byte/monk_project
```

### 5. 검증

- `workflow_dispatch`로 수동 실행
- Issue 생성 확인 — PF 상태 테이블 + R&D 마감 건 (있으면)

## ⚠️ 준수 조항

- PF 파일 읽기만. 수정 금지
- YAML 파싱 실패 시 해당 PF 스킵 (전체 실패 방지)

## 완료 기준

- [ ] `rnd_deadline_check.py` + `pf_dashboard.py` 배치
- [ ] `weekly-dashboard.yml` 워크플로우 배치
- [ ] `workflow_dispatch` 수동 실행 → Issue 생성 확인
- [ ] COMPLETION 보고서 → PF_AUTOPILOT 히스토리 1행 어펜드

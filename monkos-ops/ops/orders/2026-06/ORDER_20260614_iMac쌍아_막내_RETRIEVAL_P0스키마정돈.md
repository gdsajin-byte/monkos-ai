---
type: order
id: ORDER_20260614_iMac쌍아_막내_RETRIEVAL_P0스키마정돈
date: 2026-06-14 12:34 KST
from: iMac/쌍아
to: 막내
portfolio: PF_RETRIEVAL
priority: P2
status: 완료
---

# P0 스키마 정돈 — `portfolio:` frontmatter 소급 보강

> **[2026-06-14 12:34 KST] iMac/쌍아 → 막내**
> 귀속: PF_RETRIEVAL (Phase 0)
> 근거: PROPOSAL_20260614_민아_데이터retrieval_네비게이션DB_최적화로드맵.md
> 법적 근거: ch4 7조 소급 예외 단서 (2026-06-14 개정, 작가님 승인)

---

## 목표

활성 PF 귀속 문서의 YAML frontmatter에 `portfolio:` 필드를 소급 삽입한다. 파일 내용은 변경하지 않는다.

---

## 대상

**1단계 (본 지시서 범위)**: 파일명에 활성 PF 코드네임이 명시적으로 포함된 문서만 — **무손실 코어, 추론 0**.

대상 경로:
- `monkos-ops/ops/orders/`
- `monkos-ops/ops/reports/`
- `monkos-ops/ops/proposals/`
- `monkos-ops/tech/designs/`
- `monkos-ops/tech/specs/`
- `monkos-ops/ops/incidents/`

**제외**:
- 세션 로그 (`sessions/`) — PF 귀속이 아닌 시간 기반
- 이미 `portfolio:` 필드가 있는 문서 — 스킵
- completed PF 귀속 문서 — 후순위 (2단계)
- 파일명에 코드네임이 없는 문서 — 후순위 (추론 필요, 2단계)

---

## 활성 PF 코드네임 목록 (매칭 대상)

```
IDPHOTO, PORTAL, CROP, STUDIO, VTON, CDP, CITADEL, SPREAD, EVENT, PROFILES,
MONK_OS, DOCS, RND, CHATBOT, AUTOPILOT, FACTORY, PRESENTATION, VIDEO, MUSE,
SPECS, OPUS, IMAGE_PRO, KKU, RETRIEVAL
```

---

## 실행 방법

스크립트를 작성하여 일괄 처리한다.

### 로직

1. 대상 경로의 `.md` 파일을 순회
2. 파일명에서 활성 PF 코드네임 매칭 (대소문자 구분, 단어 경계 매칭)
3. 이미 `portfolio:` 필드가 있으면 스킵
4. YAML frontmatter가 있으면 `portfolio: PF_{코드네임}` 삽입 (status 행 다음)
5. YAML frontmatter가 없으면 스킵 (보고만)

### ⚠️ 준수 조항

- **정확매칭 필수**: `DOCS`가 `IDPHOTO_DOCS_뭐시기`에 오매칭되지 않도록 단어 경계(`_`, `-`, 파일명 끝) 기준 매칭. 예: `_CITADEL_`, `_CITADEL.md` OK / `CITADEL` 안 `DOCS`의 `S` 뽑으면 안 됨.
- **내용 무변경**: frontmatter 영역만 수정. 본문 1바이트도 변경 금지.
- **dry-run 먼저**: `--dry-run` 플래그로 변경 예정 목록 출력 → 확인 후 실행.
- 스크립트 위치: `scripts/pf_frontmatter_backfill.sh` (또는 `.js`)

---

## 검증

1. dry-run 출력물에서 오매칭 없는지 확인
2. 실행 후 `git diff --stat`으로 변경 파일 수 확인 (민아 실측 58건 근처 예상)
3. 변경된 파일 중 랜덤 5건 `git diff` 확인 — frontmatter만 변경되었는지

---

## 산출물

- `scripts/pf_frontmatter_backfill.sh` (또는 `.js`) — 소급 보강 스크립트
- 변경된 문서 N건 — `portfolio:` 필드 추가
- COMPLETION 보고서 — 처리 건수, 스킵 건수, 오류 건수

---

## 완료 보고

- 수발신 헤더 필수
- `✅❌💡⏳📁🔀` 형식
- PF_RETRIEVAL 히스토리 1행 어펜드
- 세션 로그 어펜드
- 커밋 → 푸시

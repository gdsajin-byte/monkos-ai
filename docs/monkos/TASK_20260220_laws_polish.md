---
type: task
from: 쌍아
to: 막내(any)
date: 2026-02-20 11:50 KST
status: open
priority: low
tags: [governance, laws, 보완, 정비]
---

# 지시서: 법률 파일 3건 보완 (경량 정비)

[2026-02-20 11:50 KST] iMac/쌍아 → 막내(any)

## 역할 선언
> **너는 "막내"다. 쌍아가 아니다.**
> - 쌍아 = VSCode 전략실 (이 지시서를 작성한 에이전트)
> - 막내 = iTerm 터미널 (이 지시서를 실행하는 너)
> - 완료 보고: `{디바이스}/막내N → iMac/쌍아` 형식

---

## 배경

거버넌스 성문화 Phase 2 리뷰에서 발견된 경미한 비일관성 3건을 보완한다. 급하지 않으니 빈 시간에 처리.

## 작업 내용

### 1. ch2_coding.md — 위반 시 기재 추가

파일: `docs/infrastructure/laws/ch2_coding.md`

8장 중 유일하게 위반 시 영향이 하나도 없다. 각 조항(1~5조) 끝에 `> 위반 시:` 1줄씩 추가.

예시:
- 1조(기술 스택): "위반 시: 프레임워크 혼재, 유지보수 비용 증가"
- 2조(네이밍): "위반 시: 코드 검색/참조 실패, 에이전트 간 혼동"
- 적절한 수준으로 자율 작성

### 2. ch2/ch4/ch6 — CLAUDE.md 라인번호 참조 → 날짜 기반 전환

아래 파일들에서 `CLAUDE.md L숫자` 형태의 근거를 날짜 기반으로 교체:

- `docs/infrastructure/laws/ch2_coding.md` — 2~4조
- `docs/infrastructure/laws/ch4_docs_structure.md` — 2조
- `docs/infrastructure/laws/ch6_git.md` — 1~3조

CLAUDE.md가 이미 137줄로 재구성되어 라인 참조가 무의미하다.
정확한 날짜를 모르면 `2026-01 ~ 02-08 — CLAUDE.md 초기 규칙` 정도로 기재.

### 3. ch7_makne_code.md — 헌법 제8조 참조 추가

파일: `docs/infrastructure/laws/ch7_makne_code.md`

3조(금지 사항)의 상위 헌법에 `제8조(파괴적 명령 금지)` 참조 추가.
현재 `제7조(비가역 행위 금지)`로 되어 있는데 헌법 조항명은 `제8조: 파괴적 명령 절대 금지`가 정확.

---

## 규칙

- **브랜치**: develop
- **수정 파일**: ch2, ch4, ch6, ch7 (4파일)
- **금지**: CLAUDE.md 수정, 조항 번호/구조 변경
- **커밋 메시지**: `[docs] 법률 파일 보완 — 위반영향 추가, 라인참조 전환, 헌법연결 수정`

## 완료 기준

**실행 + 커밋** (레벨 2)
- 완료 보고: 2규칙 형식 (✅❌💡⏳📁🔀)

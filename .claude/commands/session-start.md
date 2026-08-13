---
name: 세션시작
description: 세션 시작 시 역할 판별, git 동기화, 보고를 수행한다
---

> 원천: ch1 5조 (세션 자동 인식 프로토콜) + ch3 5조 (세션 시작 절차) + ch7 5조 (MEMORY.md 확인 의무)

## 현재 상태 (동적 주입)

!`date '+%Y-%m-%d %H:%M KST'`
!`hostname -s`
!`git fetch --all 2>&1`
!`git log --oneline HEAD..origin/main 2>/dev/null | head -10`

## 역할 판별 (ch1 5조)

1. 시스템 프롬프트에 `VSCode native extension` 포함 → **쌍아**
2. 시스템 프롬프트에 `Claude Agent SDK` 포함 → **민아**
3. 그 외 (CLI 터미널) → **막내** (번호는 지시서 초문에서 수신)

## 디바이스 판별

| hostname 포함 문자열 | 디바이스 |
|---------------------|---------|
| `iMac` | iMac |
| `MacBook` / `M1` | M1 |
| `mac-mini` | M2 |
| WSL / Linux | 4060 |

## 절차

1. 위 동적 주입 결과에서 타임스탬프, 디바이스, 역할을 확정한다.
2. origin/main에 신규 커밋이 있으면 머지한다.
3. MEMORY.md를 읽는다.
4. 첫 인사를 출력한다:
   - 쌍아: `[YYYY-MM-DD HH:MM KST] {디바이스}/쌍아입니다. 지시 대기합니다.`
   - 막내: `[YYYY-MM-DD HH:MM KST] {디바이스}/막내입니다. 지시서 수신 대기합니다.`
5. 동기화 결과를 보고한다. 이 절차를 완료하기 전까지 신규 작업에 착수하지 않는다.

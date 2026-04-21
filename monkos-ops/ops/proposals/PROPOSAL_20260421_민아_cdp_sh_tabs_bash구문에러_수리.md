---
type: proposal
date: 2026-04-21
from: iMac/민아
to: iMac/쌍아, 작가님
subject: scripts/tools/cdp.sh — $() 안 case 구문 파싱 에러 수리
priority: 낮음
pf: PF_CDP
estimated_scope: 막내 1명, 10분 이내
---

# cdp.sh tabs 구문 에러 수리 제안서

**[2026-04-21 15:42 KST] iMac/민아 → iMac/쌍아, 작가님**

> 작가님 지시: "코딩이니 너가 제안서 넣고 막내에게 시킬거다"
> 민아는 제안서 + 막내 작업 명세까지. 지시서 환급은 쌍아.

---

## 1. 현상

`scripts/tools/cdp.sh tabs` 실행 시 bash 구문 에러로 실패.

```
scripts/tools/cdp.sh: command substitution: line 12: syntax error near unexpected token `newline'
scripts/tools/cdp.sh: command substitution: line 12: `  *M4*|*한송이*'
```

**재현 환경**: iMac (오늘 2026-04-21 15:11 세션 중 확인). 민아가 탭 목록 조회 시도 → 우회 필요 (`curl http://localhost:9222/json | python3 ...`)

---

## 2. 원인

[scripts/tools/cdp.sh:7-11](../../scripts/tools/cdp.sh) — `CDP_PORT` 기본값 산정 로직이 `$()` command substitution 안에 **case 구문 전체**를 박아넣음.

```bash
CDP_PORT="${CDP_PORT:-$(case $(scutil --get ComputerName 2>/dev/null) in
  *M4*|*한송이*) echo 9230;;
  *M2*|*꾸*)     echo 9231;;
  *)             echo 9222;;
esac)}"
```

**문제**: 
- `${...:-$(case ... esac)}` 중첩 구조에서 bash 파서가 case 분기 라인 끝 `;;`와 개행을 불안정하게 처리
- 특히 한글(`한송이`, `꾸`) 포함 시 locale/UTF-8 해석이 일부 환경에서 파싱 실패를 유발
- iMac처럼 컴퓨터명이 어느 패턴에도 매칭 안 되면 기본값(9222)으로 가야 정상인데, 파서가 case 구조 자체에서 걸려서 그 경로에 도달 못함

---

## 3. 수리 방안

case 구문을 `$()` 밖으로 분리 + 한글 패턴 제거 (MEMORY의 공식 포트 배당표 기준으로는 디바이스명 영문 식별자만으로 충분).

**수정 전 (7~12행)**
```bash
CDP_PORT="${CDP_PORT:-$(case $(scutil --get ComputerName 2>/dev/null) in
  *M4*|*한송이*) echo 9230;;
  *M2*|*꾸*)     echo 9231;;
  *)             echo 9222;;
esac)}"
CDP_BASE="http://${CDP_HOST}:${CDP_PORT}"
```

**수정 후**
```bash
if [ -z "${CDP_PORT}" ]; then
  _cn="$(scutil --get ComputerName 2>/dev/null)"
  case "${_cn}" in
    *M4*) CDP_PORT=9230 ;;
    *M2*) CDP_PORT=9231 ;;
    *)    CDP_PORT=9222 ;;
  esac
  unset _cn
fi
CDP_BASE="http://${CDP_HOST}:${CDP_PORT}"
```

**변경 요지**:
- `$()` 안의 case를 밖으로 분리 — 파서 중첩 해소
- 한글 패턴(`한송이`, `꾸`) 제거 — locale 불안정 해소. `*M4*` / `*M2*` 영문 식별자만으로 충분
- 로컬 변수 `_cn`으로 ComputerName 캐시 → `unset`으로 스크립트 스코프 정리

---

## 4. 영향

| 범위 | 영향 |
|---|---|
| PF_CDP | cdp.sh tabs 명령 정상 동작 회복. 에이전트·막내 CDP 숙련도 격차 완화 |
| CDP 룰 | `.claude/rules/cdp-browser.md`의 cdp.sh 예제 즉시 검증 가능 |
| 포트 배당 | 변경 없음 (M4=9230, M2=9231, 기타=9222 유지) |
| 위성 디바이스 (M4/M2) | 한글 패턴 제거해도 디바이스명에 `M4`/`M2` 영문 포함 시 매칭 (현행 운용 유지) |

**리스크**: 없음. 기존 기본값 9222 동작은 100% 호환.

---

## 5. 막내 작업 명세 (지시서 환급용)

**작업**: `scripts/tools/cdp.sh` 7~11행 수정

| 항목 | 내용 |
|---|---|
| 수정 파일 | [scripts/tools/cdp.sh](../../scripts/tools/cdp.sh) |
| 수정 행 | 7~12행 (CDP_PORT 산정 블록) |
| 수정 내용 | §3 "수정 후" 블록 그대로 치환 |
| 검증 | `bash -n scripts/tools/cdp.sh` (문법 체크) / `scripts/tools/cdp.sh tabs` 실행하여 탭 목록 출력 확인 / `scripts/tools/cdp.sh version` 동작 확인 |
| 커밋 메시지 | `fix(cdp): cdp.sh CDP_PORT case 구문 $() 파싱 에러 수리` |
| 예상 소요 | 10분 이내 (코딩 2분 + 검증 5분 + 커밋) |
| PF 갱신 | [PF_CDP.md](../portfolios/PF_CDP.md) 히스토리에 4/21 수리 append |

---

## 6. 검증 기준

- [ ] `bash -n scripts/tools/cdp.sh` 에러 없음
- [ ] iMac에서 `scripts/tools/cdp.sh tabs` 정상 실행 (탭 목록 출력)
- [ ] iMac에서 `scripts/tools/cdp.sh version` 정상 실행
- [ ] `CDP_PORT=9223 scripts/tools/cdp.sh tabs` 환경변수 override 정상 (기존 동작 유지)

---

## 7. 제안서 처리 요청

- [x] 민아: 제안서 + 막내 작업 명세 작성
- [ ] 쌍아: 간단 검토 후 막내 지시서 환급 (PR 방식 여부 결정)
- [ ] 작가님: 막내 투입 시점 결정
- [ ] 막내: §5 명세대로 실행 → 검증 → 커밋
- [ ] 민아: 수리 후 재실측으로 `cdp.sh tabs` 동작 확인 (오늘 실패 재현 → 성공 확인 루프)

**보고 끝.**

---
type: completion
date: 2026-08-13
device: iMac
agent: 막내1
status: 마감
portfolio: —
order: ORDER_20260813_iMac쌍아_막내1_WORKS_서브모듈폐지.md
phase: "D (분리 실행) — 완료"
---

# COMPLETION — works 서브모듈 폐지 Phase D

**[2026-08-13 19:33 KST]** iMac/막내1 → 작가님

## 1. 결과 요약

작가님 Phase D 승인(19:2x) 하에 실행. **자산 유실 0, 실패 0.**

| 단계 | 결과 |
|------|------|
| ③ 03-29 삼권심사 4건 이관 (D 착수 전) | ✅ md5 무결성 4/4 일치 |
| §4-0 원격 안내문 교체·푸시 | ✅ `372c466..fff76f9` |
| §4-1 서브모듈 제거 | ✅ deinit + `git rm` + `.gitmodules` 제거 |
| §4-2 배선 정리 | ✅ 5건 (지시서 4건 + **표 외 1건 §4-3**) |
| ④ `.git/modules` 잔여 | ⏸️ **미정리 확정** (작가님 지시) |

**작가님 지정 순서 준수**: ③ 이관 → §4-0 원격 → §4-1 분리 → §4-2 배선. 순서 역전 없음.

## 2. ③ 03-29 삼권심사 4건 이관

`git rm` **이전**에 수행하여 원본 접근 가능 상태에서 복사했다.

| 원본 (works) | 이관처 |
|---|---|
| `ops/orders/ORDER_20260329_쌍아→막내_민아권한명확화_삼권심사.md` | `monkos-ops/ops/orders/2026-03/` |
| `ops/reports/REVIEW_20260329_막내1호_입법_민아권한명확화.md` | `monkos-ops/ops/reports/2026-03/` |
| `ops/reports/REVIEW_20260329_막내2호_행정_민아권한명확화.md` | `monkos-ops/ops/reports/2026-03/` |
| `ops/reports/REVIEW_20260329_막내3호_사법_민아권한명확화.md` | `monkos-ops/ops/reports/2026-03/` |

**md5 대조 4/4 동일** 확인 후 진행.

### 2-1. 판단 2건 보고

- **파일명 원형 보존** — `쌍아→막내`(화살표)·`막내1호` 등 ch4 3조 비표준 네이밍이나 **개명하지 않았다.** 역사 기록의 원형 보존(append-only 원칙)이 우선이고, 개명 시 기존 문서의 인용이 끊긴다. 표준화가 필요하면 지시 주시면 처리하겠다.
- **`ORDER_20260329_쌍아→전원_민아권한명확화_만장일치의결.md` 미이관** — 선행 보고 §4-3에서 괄호로 표기했던 5번째 항목이다. 작가님 지시가 "**4건**"이었고 괄호 외 항목이 정확히 4건이라 지정 범위대로 처리했다. 다만 **심사 의견서 3건은 본진에 있고 그 결론인 의결서만 원격에 남는 상태**가 되었다. 원격 존치로 유실은 없으며, 계보 완결을 원하시면 지시 주시면 추가 이관하겠다.

## 3. §4-0 원격 works/CLAUDE.md 교체 (작가님 지시 — 순서 최우선)

서브모듈 제거 **전에** 원격에 쓰기를 완료했다. 순서를 뒤집었다면 push 경로가 사라졌을 건이다.

**선행 처리**: 서브모듈 HEAD가 detached(`372c4666`)였고 로컬 `main` 브랜치는 origin/main보다 4커밋 뒤였다. `git merge --ff-only origin/main`으로 정렬 후 작업했다(force·reset 미사용).

**교체 내용** — 199행 팀 채널 지침 → 폐지 안내문:
- 최상단 폐지 선언 + 읽기 전용 아카이브 명시
- **"여기에 납품하지 마라"** 경고 + 현행 납품 경로 표(`monkos-ops/ops/{orders,reports,sessions}/YYYY-MM/`) + 정본 포인터(`.claude/rules/session-log.md`, `INSTRUCTION_코웍이.md`)
- 헌법 에센스 사본 **폐기 선언** + 정본 포인터(`CONSTITUTION_ESSENCE.md`, 본진 `CLAUDE.md`)
- 폐지 경위(PETITION_20260806 삼권심사 반대 0 → 작가님 결단)
- **보존 자산 목록**(`ops/`·`han/`·`kku/`·`portal_v4/` 등) + "폐지된 것은 연결이지 저장소가 아니다"

**푸시 실측**: `372c466..fff76f9 main -> main`. `git ls-remote` 재확인 `fff76f95`.

## 4. §4-1 서브모듈 제거

```
$ git submodule deinit -f monkos-ops/works
Cleared directory 'monkos-ops/works'
Submodule 'monkos-ops/works' (git@github.com:gdsajin-byte/monkos-works.git) unregistered

$ git rm monkos-ops/works
rm 'monkos-ops/works'

$ git rm -f .gitmodules      # 엔트리 제거 후 0행이 되어 파일 자체 제거 (지시서 §4-1)
rm '.gitmodules'
```

`git submodule status` 출력 **0** — 등록 서브모듈 없음.

## 5. §4-2 배선 정리 (5건)

| # | 대상 | 조치 |
|---|------|------|
| 1 | `scripts/mk-push.sh` | `[1/3] works submodule push`(18~33행) + `[2/3] submodule 참조 갱신`(35~39행) **2스텝 제거**. `WORKS_OK` 변수·말미 분기 제거. **3단계 → 2단계 재번호**(`[1/2]` 인덱스 · `[2/2]` main push). 문법 검증 통과 |
| 2 | `.github/workflows/sync-works.yml` | **워크플로 삭제**. `cron: '0 */6 * * *'` 정지 — 방치 시 6시간마다 실패 잡 |
| 3 | `.claude/commands/session-start.md` | 동적 주입 `git -C monkos-ops/works status` 1행 + 절차 3항 제거. **절차 재번호 5단계**(기존 3→4→5→6 공백 번호도 함께 정정) |
| 4 | `.claude/settings.local.json` | **works 포함 22줄만 제거** (⑤ 지시 준수) |
| 5 | 각 디바이스 `MEMORY.md` (iMac) | 규정 계층 — 자율 갱신 + `MEMORY_CHANGELOG_iMac.md` 기록 |

### 5-1. ⑤ settings.local.json — 경계 준수 실측

작가님 지시: "works 22줄만 편입, `/Users/kku/` 24건과 추적 여부는 별건, 손대지 말 것"

| 집합 | 처리 전 | 처리 후 |
|---|---|---|
| `works` 포함 라인 | **22** | **0** (전량 제거) |
| `/Users/kku/` 포함 라인 | 24 | **8** (works 교집합 16건만 동반 제거, **비works 8건 보존**) |

JSON 파서로 배열 요소만 필터링했고 `json.load` 유효성 재검증 통과. `git diff --stat` = **1 insertion / 24 deletions** — 대량 재포맷 없음. **추적 여부 논점은 손대지 않았다.**

### 5-2. MEMORY.md 갱신 내역

- 삭제: `rsync --delete 금지 — works/ 동기화` (works 소멸로 무효)
- 변경: 섹션 제목 `세션 로그·시작/마감·works/` → `세션 로그·시작/마감`, 시작 절차에서 "works 확인" 제거
- 대체: `works/ = submodule. 삭제 절대 금지` → `works submodule 폐지(08-13). 원격 아카이브 존치(자산 유실 0), 팀원 납품은 monkos-ops/ops/*/YYYY-MM/ 직접 배치`
- `MEMORY_CHANGELOG_iMac.md` 1블록 기록

## 6. ⚠️ 지시서 표 외 추가 1건 — `scripts/mk-pull.sh`

**§4-2 배선 표에 없으나 방치 시 실동작이 고장나는 건을 발견하여 처리했다.**

```bash
# 처리 전 mk-pull.sh
set -e
echo "=== [2/2] works submodule pull ==="
git submodule update --remote --merge monkos-ops/works    # ← 서브모듈 부재 → 에러
```

`set -e`가 걸려 있어 **`mk-pull` 실행 시 main pull 성공 후 이 줄에서 비0 종료**한다. 즉 폐지 직후부터 pull 도구가 매번 실패로 보인다. mk-push의 직접 대응물이며 §4-2의 취지(폐지된 연결을 참조하는 배선 제거)에 정확히 해당하므로 함께 처리했다.

- 조치: works 스텝 제거, 2단계 → 단일 단계, 헤더 주석에 근거 명기(`표 외 추가분` 명시)
- 문법 검증 통과

원복이 필요하면 지시 주시면 되돌리겠다.

## 7. ④ `.git/modules` 잔여 — 미정리 확정

작가님 지시대로 **손대지 않았다.**

- 소재: `.git/modules/monkos-ops/works` — **718M**
- 동작 지장 없음(등록 해제 상태). 헌법 4조 2항 `rm -rf` 금지 대상이라 임의 삭제하지 않는다
- 향후 정리 원하시면 명시 지시 주십시오

## 8. 최종 검증 9항

| # | 항목 | 결과 |
|---|------|------|
| 1 | `monkos-ops/works` 디렉터리 | ✅ 제거 |
| 2 | `.gitmodules` | ✅ 제거 |
| 3 | `.github/workflows/sync-works.yml` | ✅ 제거 (크론 정지) |
| 4 | `settings.local.json` works 잔여 | ✅ 0건 (`/Users/kku/` 8건 보존) |
| 5 | `session-start.md` works 잔여 | ✅ 0건 |
| 6 | 원격 `monkos-works` 안내문 | ✅ `fff76f95` — **레포 존치** |
| 7 | 이관 4건 | ✅ 4/4 (md5 일치) |
| 8 | `mk-push.sh`·`mk-pull.sh` 문법 | ✅ 통과 |
| 9 | `git submodule status` | ✅ 출력 0 (등록 서브모듈 없음) |

## 9. 범위 밖 준수 확인

- **법률 조문**(`ch1:41`, `ch4:198·212~214`) — **무수정**. PETITION_20260806 v2 집행 소관
- **원격 레포 `monkos-works`** — 삭제하지 않음. CLAUDE.md 1파일만 교체
- **`.git/modules` 잔여** — 미정리 (④)
- **`/Users/kku/` 비works 엔트리·추적 여부** — 미접촉 (⑤)
- **② 코웍이 네이밍 2줄** — 원복 없이 현행 유지 (작가님 확정)

## 10. 잔여 상태

**works 채널은 본진에서 완전히 분리되었다.** 원격 레포는 안내문과 함께 읽기 전용 아카이브로 존치하며, 열람이 필요하면 별도 클론으로 접근 가능하다. 팀원(코웍이) 납품로는 Phase B에서 본진 표준 경로로 전환 완료.

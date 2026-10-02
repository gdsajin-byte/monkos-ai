---
type: completion
date: 2026-10-02
from: iMac/쌍아-막내3
to: iMac/쌍아
device: iMac
agent: 쌍아-막내3
subject: P2 — monk.kr 버튼 배포 범위 게이트(G-K) 구현 + notify.yml 주입 차단 (브랜치 kku-scope-gate, main 미머지)
status: 완료
portfolio: PF_KKU
---

# COMPLETION — P2 범위 게이트 구현

**[2026-10-02 19:32 KST]** iMac/쌍아-막내3 → iMac/쌍아

> 지시서: `ops/orders/2026-10/ORDER_20261002_iMac쌍아_쌍아-막내3_KKU_P2_범위게이트구현.md`. 출처는 작가님 19:18 개정 결정이며, 민아 세션로그 :376·386에서 원문을 대조했다.

## 결과
- **브랜치 `kku-scope-gate` = `dd3bf9f1`** (origin과 SHA를 대조해 확인). main에는 머지하지 않았다. 워크플로 실행·dispatch는 0회다.
- 변경 3파일:
  - `.github/workflows/deploy-monk-kr.yml` +109
  - `.github/workflows/notify.yml` ±4
  - `scripts/tools/kku_scope_gate.py` 신설 (Python 3.9 호환)

## 구현 대조 (지시서 §2)
| # | 요건 | 구현 |
|---|---|---|
| 1 | `approver` | `choice` 입력 [작가님, 꾸], 기본값 작가님 |
| 2 | ref 고정 | `github.ref==refs/heads/main`이고 target이 `origin/main`의 조상일 때만 통과. 아니면 차단 |
| 3 | base | **1순위**: 직전 실제 배포 run의 기록이다. 아티팩트 `deploy-record`를 먼저 보고, 없으면 실행 로그의 `배포 커밋:` 줄과 wrangler의 `Deployment complete!`가 **둘 다 있어야** 배포로 인정한다. 배포 전에 실패한 run은 건너뛴다. **2순위**: CF API `canonical_deployment`(stage가 success인 것만)다. 다음은 모두 차단한다: 부재·불일치·비조상·diff 0건 |
| 4 | diff 범위 | `MONK_kr/ functions/ .github/ package.json`, `--no-renames` |
| 5 | R1~R8 | 2판 그대로다(R2는 `.js` 제외, R8은 100). **§7-3 구현함**: 추가된 줄이 target 시점의 기존 `<script>` 블록 안이면 R5로 본다. JSON-LD(`application/ld+json`) 블록은 실행되지 않는 데이터라 제외했다(새로 여는 `<script` 줄은 그대로 R5) |
| 6 | 흔적 정합 | 꾸 서식 정규식을 검사한다. `approver=작가님`인데 주체에 '꾸'가 있으면 차단한다. 승인자와 무관하게 적용한다 |
| 7 | 롤백 | `sha`는 직전 run이 꾸 run이고 그 run이 기록한 base와 일치할 때만 허용한다. 그 밖은 차단한다 |
| 8 | 사후 알림 | 별도 job `notify`(`uses notify.yml`, `if: always() && deployed=='1' && approver=='꾸'`). 서식은 §3.5에 `· 배포 job {result}`를 덧붙였다. 사유는 HTML로 이스케이프한다. **notify.yml은 `MESSAGE` env 경유로 바꿨고**, 입력 이름이 같아 기존 호출처(`notify-monk-kr-pending.yml`)와 호환된다 |
| 9 | 판정 표·주석 | STEP_SUMMARY에 판정·base·target·조건·파일·줄을 남긴다. 헤더 주석에 발효 시 문안을 `(발효 전)`으로 준비했다 |
| 10 | 스크립트 분리 | `kku_scope_gate.py`: `--dry-run BASE TARGET` / `gate` / `resolve-run` / `resolve-cf`. 러너는 이 스크립트를 **`github.sha`에서 꺼내** 실행한다(롤백 대상 커밋에 스크립트가 없어도 판정이 돈다) |

- 작가님 경로 회귀 방지:
  - `approver=작가님`이면 G-K를 적용하지 않는다(흔적 정합만 본다).
  - 판정 불가(rc 2)가 나면 경고를 남기고 진행한다. 스크립트가 없을 때도 경고 후 진행한다.
  - 꾸 경로는 rc 0만 통과한다.

## 판정 표 — 로컬 실증 (실제 커밋 쌍)
| 사례 | 입력 | 결과 |
|---|---|---|
| 양성 문구 | `5cf1d232^..` | ✅ 범위 안 |
| 양성 사진 | `03abe4ed^..` (길안내 사진) | ✅ 범위 안 |
| 양성 가격 | `f271b6ca^..` | ✅ 범위 안 |
| 양성 실구간 (gate) | `bd6d7a5..1ecf68c` | ✅ rc 0 |
| 음성 R1 | `8f606ab7` b2b | ❌ R1 |
| 음성 R4 | `ebee4eb9` 견적 양식 | ❌ R4 `<form`·`<input` |
| 음성 R5 인라인·블록 내부 | `7acf53f3` | ❌ R5 `<script` 70행 + 기존 블록 내부 456·457행 |
| 음성 R6 동일 CDN 신규 경로 | `7acf53f3` | ❌ R6 `cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/…` (1차 심사 때 거짓 음성이던 건) |
| 음성 R7 | `389f0884` print 폰트 | ❌ R7 |
| 음성 base 부재 | run 또는 CF 한쪽 없음 | ❌ 차단 (2건) |
| 음성 Idle 최상단 base | CF=21eaa578(실측 최상단 Idle) | ❌ 불일치 차단 |
| 음성 diff 0건 | base=target | ❌ 차단 |
| 음성 비main ref | `refs/heads/kku-scope-gate` | ❌ 차단 |
| 추가 음성 | 비main target · headSha 오용 · 흔적 2종 · 롤백 2종 | ❌ 전부 차단 |
| 추가 양성 | 꾸 롤백(직전 꾸 base) · 작가님 경로 | ✅ rc 0 |
| **실대기 구간** | `ad8f9a09..origin/main` (`c69eb186` 포함) | ❌ **R4 6 · R5 53 · R7 1 — 기대값(R4·R7) 충족** |

- **base 산출 실측**:
  - `resolve-run`은 run 36994859500에서 `ad8f9a09`를 반환했다. 이 run의 `headSha`는 `f7851335`라서, headSha를 썼다면 base가 틀렸을 것이다.
  - 로컬 wrangler 목록은 25건 중 Idle 23건이고 최상단은 `21eaa57`(Idle)이다. Idle이 아닌 최신은 `ad8f9a0`(fe1a639a)로, run 기록과 일치한다.
- **30일 커밋 120건 재대입**: 통과 75, 차단 45. 차단 사유별로는 R5 33, R6 12, R7 5, R4 4, R1 4, R2 3, R3 1이다(중복 있음).
  - 1차 심사 시뮬레이션(105/116)보다 통과가 줄었다. R5 기존 블록 규칙(§7-3)과 R6 URL 단위 판정 때문이다.
  - R5는 지도 핀 좌표·placeholder 문구처럼 `<script>` 안의 문자열을 수정한 경우에 걸린다.
  - R6는 네이버 지도 등 신규 외부 링크에 걸린다.
  - 거짓 양성은 감수 방침(§3.2)이다. 범위 안 비율은 커밋 기준 약 62%다.
- 문법:
  - `actionlint`가 설치돼 있지 않다. 설치는 승인 대상이라 하지 않았다.
  - YAML 파싱은 2파일 OK다. 전체 `run:` 스텝을 `bash -n`으로 돌려 10/10 OK다(표현식은 치환).

## 미구현·미실증
1. **`resolve-cf` 미실증**: 로컬에 CF API 토큰이 없다(시크릿 접촉 금지). 필드 경로 `canonical_deployment.deployment_trigger.metadata.commit_hash`와 `latest_stage.status`는 문서에 근거한 것이다. 실패하면 빈 값 → base 부재로 **차단(fail-closed)**된다. 확인은 발효 직전 run 1회로 한다.
2. **러너 동작 미실증** (지시서 §3에 따라 dispatch를 금지했다): `gh run download` 아티팩트 경로, job outputs가 실패한 job에서도 전달되는지, `inputs.approver`를 job `if`에서 평가하는지. 쌍아가 계획한 승인 1회 run에서 꾸 경로 차단 1건과 작가님 경로 1건을 함께 확인할 것을 권한다.
3. **작가님 run 지연**: 매 run마다 `resolve-run`이 직전 run의 아티팩트와 로그를 조회한다. 로컬에서 약 3초였다.
4. **헤더 주석 :5 교체**는 발효 시에 한다(준비만 해 두었다).

## 📁
- 브랜치 `kku-scope-gate` `dd3bf9f1`: `.github/workflows/deploy-monk-kr.yml` · `.github/workflows/notify.yml` · `scripts/tools/kku_scope_gate.py`
- 사전 점검: `python3 scripts/tools/kku_scope_gate.py --dry-run <직전 배포 커밋> origin/main` (M2 쌍아 편의용이며 판정이 아니다)

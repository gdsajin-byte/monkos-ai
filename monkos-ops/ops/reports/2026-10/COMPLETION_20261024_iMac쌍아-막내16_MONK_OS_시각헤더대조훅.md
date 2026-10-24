---
type: completion
date: 2026-10-24
device: iMac
agent: 쌍아-막내16
status: 마감
portfolio: PF_INFRA
order: monkos-ops/ops/orders/2026-10/ORDER_20261024_iMac쌍아_막내16_MONK_OS_시각헤더_쓰기직전대조훅.md
---

**[2026-10-24 22:28 KST]** iMac/쌍아-막내16 → iMac/쌍아

# COMPLETION — 시각 헤더 쓰기 직전 대조 훅 (E11)

> 출처: 작가님 2026-10-24 22:22 KST iMac 쌍아 세션 사람 턴 "진행 승인"(B안) → 쌍아 기동 프롬프트(경로① 직접 전달).

## 결론
새로 쓰는 시각 헤더를 쓰기 직전에 실측 KST와 대조하는 훅을 만들었습니다. 실측보다 2분 넘게 미래이거나 10분 넘게 과거이면 막고, 차단 사유에 실측값을 알려 줍니다. 대상은 Write·Edit·MultiEdit, Bash 어펜드, SendMessage 세 경로입니다. 스모크는 **146/146**이고(기존 123건 + 신규 23건), 이 세션에서 Write와 Bash 차단을 실측했습니다. 코드 커밋은 `4a4757ee`입니다.

## 변경
| 파일 | 내용 |
|---|---|
| `scripts/hooks/time_header.py` (신규) | 공용 판정. 굵은 헤더(줄 어디든)와 굵게 없는 헤더(줄 머리)를 찾아 UTC+9 고정 시각과 비교합니다. 제외 대상: 코드 블록, 인라인 코드, `출처:`·`근거:` 줄, 어제 이전 날짜, 기존 내용에 이미 있던 줄. 스모크용 `MONK_HOOK_NOW` |
| `scripts/hooks/guard_write.py` | E11 추가(E8 다음, E5 앞). 기존 줄 = 파일 현 내용 + Edit의 old_string. 모듈 로드가 실패해도 E5·E8은 유지 |
| `scripts/hooks/guard_bash.py` | E11 추가. 대상 경로로 `>>`·`>`·`tee` 하는 명령만 원문(히어독 본문 포함)으로 봅니다. 같은 명령 안 `L=…; cat >> "$L"` 대입도 해석합니다. `$(date …)` 치환은 숫자가 없어 대상이 아닙니다 |
| `scripts/hooks/guard_message.py` (신규) | SendMessage `message` 본문 대조 |
| `.claude/settings.json` | PreToolUse에 `SendMessage` matcher 추가(작가님 22:22 승인 범위) |
| `scripts/hooks/smoke.py` | E11 23건 추가 |
| `.claude/rules/references.md` | 도구 맵 '집행 훅' 행: 7종 → 9종, 10-24 1줄 |

## 완료 기준 — 실측
| # | 기준 | 결과 | 근거 |
|---|---|---|---|
| 1 | 스모크 양성 6·음성 5 + 기존 전부 | ✅ | 146/146 PASS (변경 전 HEAD 스모크 123/123 실측 — 지시서의 118은 이후 늘어난 수). 양성 11: 실측 헤더 Write · `$(date)` 치환 어펜드 · 기존 헤더 유지 Edit · 코드 블록 · `> 출처:` 과거 · 어제 날짜 · 인라인 코드 · 대상 외 경로 · 실측 SendMessage · +2분 경계 · 대상 외 Bash(grep>/tmp). 음성 8: +3분 Write · Edit(신규 파일) · 기존 파일에 새 미래 헤더 Edit · Bash 리터럴 · Bash `$L` · SendMessage · −15분 Write · 무굵게 머리 헤더. 기타 4: 사유 문구에 실측값 포함 · 킬스위치 · 훅 오류 비차단+`[HOOK-ERR] 시각 대조 실패` 2건. smoke_pf 17/17 유지 |
| 2 | 실세션 차단 | ✅ | 22:27 Write `reports/…/SMOKE_E11_live_test.md`에 22:30 헤더 → 차단 "실측보다 3분 미래 … 실측 2026-10-24 22:27 KST — 이 값으로 다시 쓰세요". 같은 분에 Bash `cat >> sessions/…` 22:31 헤더 → 차단 "4분 미래". 두 파일 모두 생성되지 않음 |
| 3 | references.md 도구 맵 | ✅ | 커밋 4a4757ee |
| 4 | COMPLETION + 원격 SHA 대조 | ✅ | 본 문서. 원격 대조는 세션 로그 마감 줄 |

## 한계 (닫힌 대안 포함)
- SendMessage 실세션 차단은 실측하지 않았습니다. 실제 피어에게 잘못된 헤더가 전달될 위험이 있어 스모크(훅 직접 호출)로만 확인했습니다. matcher가 실세션에 반영됐는지는 다음 세션의 첫 메시지에서 확인할 수 있습니다.
- Bash에서 변수가 다른 명령에서 정의됐거나(`$L`이 이전 Bash 호출에서 설정됨), `printf`로 조립한 헤더는 탐지하지 못합니다. 대안: 세션 로그 파일을 사후에 대조하는 PostToolUse 훅을 둘 수 있습니다(A안, 이번 범위 밖).
- 어제 이전 날짜는 검사하지 않으므로, 자정 직후 어제 23:5x 헤더는 통과합니다. 미래 날짜는 항상 검사합니다.
- 과거 상한 10분은 지시서 기본값입니다. 오탐이 실측되면 `time_header.PAST_MIN` 한 곳만 바꾸면 됩니다.

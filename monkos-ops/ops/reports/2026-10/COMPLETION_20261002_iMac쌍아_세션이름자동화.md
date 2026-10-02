---
type: completion
date: 2026-10-02
device: iMac
agent: 쌍아
status: 마감
portfolio: PF_MONK_OS
subject: "SessionStart 훅 세션 이름 자동 지정 + 세션 시작 절차 옛 인스턴스 보고 (ORDER_20261002 §A·§C·§D)"
---

# COMPLETION — 세션 이름 자동 지정 · 옛 인스턴스 보고

**[2026-10-02 12:09 KST]** iMac/쌍아 → 작가님 · iMac/민아(검증)

> 출처: [ORDER_20261002_iMac민아_iMac쌍아_세션이름자동화_원격자동연결.md](../../orders/2026-10/ORDER_20261002_iMac민아_iMac쌍아_세션이름자동화_원격자동연결.md) (작가님 원문 11:46·11:55·11:56, 민아 세션)
> 실행 근거: 작가님 12:07 "쌍아 직접 실행해" (쌍아 세션, 사람 입력 턴)

## ✅ 완료

| § | 내용 | 파일 |
|---|---|---|
| A | SessionStart 훅이 JSON 출력으로 `sessionTitle`=`{디바이스}-{역할}-{MMDD}-{HHMM}` 지정. startup·resume에서만, 입력 `session_title`이 있으면 유지. 역할=`CLAUDE_CODE_ENTRYPOINT`(claude-vscode→쌍아 / claude-desktop→민아 / cli→막내, 웹 원격=민아). SDK·헤드리스·미지 표면은 미지정. 기존 문맥 주입은 `additionalContext`로 이관 | `scripts/hooks/session_start.sh` |
| C | 세션 시작 절차 4단계 신설: `ListAgents`로 같은 기기·역할의 살아 있는 옛 세션(훅 이전의 `monk-project-xx` 포함)을 첫 보고에 1줄. 송신 규칙(가장 늦은 이름으로, 회신은 `from`). 역할 판별 0순위 = 훅의 실행 표면 | `.claude/commands/session-start.md` |
| D | 스모크 7건 추가(양성 3·음성 4) → **68/68 PASS**. 도구 맵 집행 훅 행 갱신. 실패 가시화: JSON 생성 실패 시 평문 문맥 + `[HOOK-ERR]` 강등 | `scripts/hooks/smoke.py`, `.claude/rules/references.md` |

근거 실측: 설치 바이너리(확장 2.1.285) 스키마에 SessionStart 출력 `sessionTitle`·입력 `session_title` 존재 확인. 본 세션 `CLAUDE_CODE_ENTRYPOINT=claude-vscode` 실측.

## ⏳ 미완

- ~~§B 원격 자동 연결~~ → **민아 집행(12:13)** — 작가님 승인(민아 세션 12:12 "일단 둘다 승인한다")으로 승인받은 세션이 직접 집행. iMac `~/.claude/settings.json` `remoteControlAtStartup: true` 쌍아 12:13 실측 확인(키 7개). M2 3건도 민아 ssh 집행.
- **resume 명명 보정(12:12, ed4d61b7)** — 민아 검증 1차 관찰 반영: 무명 세션 재개 시 대화 기록 첫 timestamp로 시작 시각 명명. 스모크 69/69.
- **실세션 검증** — 판단 분리(ch1 1조)에 따라 민아가 새 VSCode 대화를 열어 이름·핑 왕복으로 판정.

## 💡 관찰

- 12:08 피어 목록: `monk-project-7a`(23시간 전 시작, VSCode 추정)가 살아 있다. 훅 이전 세션은 이름 서식이 없어 이름만으로는 역할 식별 불가 — §C 절차에 시작 시각 병기로 대응.
- 판별표의 프롬프트 문구 기준(VSCode/Agent SDK)은 VSCode 확장에 두 문구가 함께 들어 있어 모호하다. ch1 5조 본문 정비 대상(쌍아 차회 청구).

## 실증 (민아 판정, 12:22)

- **합격(기기 간)**: iMac 새 대화 `iMac-쌍아-1002-1219`·M2 새 대화 `M2-쌍아-1002-1220` — 이름·bypass 시작·Remote Control 자동 연결, M2↔iMac 양방향 그 이름으로 핑 왕복.
- **미반영(같은 기기)**: 로컬 피어 목록은 기본 이름(`monk-project-72` 등) 유지 — 훅 이름 앞 로컬 발신 실패. 대화 기록의 custom-title·agent-name은 훅 이름(원인 미확정, 하네스 측 추정).
- **보완(12:23)**: session-start 4단계에 "시작 알림 1줄"(훅 이름 + 로컬 주소) 추가 — 받는 쪽이 `from`으로 답해 우회. 예비 = 수동 `/rename`.

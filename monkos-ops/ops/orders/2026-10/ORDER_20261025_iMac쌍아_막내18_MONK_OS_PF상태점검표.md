---
type: order
date: 2026-10-25
from: iMac/쌍아
to: iMac/쌍아-막내18
device: iMac
agent: 쌍아
subject: active PF 전수 상태 점검표 — PF마다 마지막 실제 활동·현재 상태·제안 상태(active/paused/completed)·근거 (읽기 전용, 상태 변경 없음)
status: 대기
portfolio: PF_MONK_OS
---

# ORDER — active PF 상태 점검표

**[2026-10-25 13:39 KST]** iMac/쌍아 → iMac/쌍아-막내18

> 출처: 작가님 2026-10-25 13:38 KST (iMac 쌍아 세션 사람 턴) "진행해" — 쌍아 13:37 제안 "막내 한 명에게 'active PF 33개 상태 점검표'(마지막 실제 활동·지금 상태·바꿀 상태 제안). 실제 상태 변경은 작가님이 표를 보고 결정".
> 배경(쌍아 13:36 실측): status: active PF 33개 중 수개월 무갱신 다수(EVENT 04/22·DOCS 05/06·PRESENTATION 05/17·CHATBOT 06/02 …), 히스토리 날짜 형식이 달라 자동 집계가 안 되는 PF 6개(FACEREAD·IMAGE_PRO·MONK_OS·PARTNER·STYLER·VTON).

## 할 일 (읽기 전용)

1. `monkos-ops/ops/portfolios/PF_*/README.md` 중 `status: active` 전부(10-25 기준 33개 — 실측해서 수 명기).
2. PF마다 **마지막 실제 활동일** = 다음 중 가장 늦은 것: 히스토리 최신 행 / `git log -1 --format=%ad -- {PF 폴더}` / 그 PF를 `portfolio:`로 단 문서 최신일 / 관련 코드 경로 최신 커밋(README 포인터가 있으면). 근거 열에 어떤 것인지 적는다.
3. **제안 상태**: active 유지 / paused / completed / 병합(다른 PF로) — 근거 1줄(예: "Phase 전부 ✅", "6개월 활동 0·작가님 결정 대기 없음", "PF_X와 범위 중복"). 확신이 낮으면 '작가님 확인'으로.
4. 히스토리 날짜 형식이 표준(`| MM/DD |`)이 아닌 PF는 형식 차이를 1줄로 기록(고치지 않는다).
5. 500줄 초과 PF 목록(아카이브 트리거 — ch4 9조).

## 산출물

- `monkos-ops/ops/reports/2026-10/REPORT_20261025_iMac쌍아-막내18_MONK_OS_PF상태점검표.md` — 표 열: `PF | 현재 status | 마지막 실제 활동(일자·근거) | 제안 | 근거 | 비고(형식·줄 수)`. 맨 위 요약 3줄(제안별 개수).
- **PF README·인덱스·status 필드는 수정하지 않는다.** 결정은 작가님.

## ⚠️ 준수 조항

- 헌법 3조 1·2항(헤더 `date` 실측 — E11 훅), 4조 2항(파일 수정·삭제 없음). 세션 로그 `monkos-ops/ops/sessions/2026-10/2026-10-25_iMac_쌍아-막내18.md`.

## 완료 기준

- [ ] 표 33행(또는 실측 수) 전부 채움, 근거 열 빈칸 0
- [ ] 보고서 커밋·푸시 + 원격 SHA 대조, 쌍아에 세션 메시지 1회

## 커밋 메시지

```
[docs] PF 상태 점검표 — active PF 전수 마지막 활동·제안 상태
```

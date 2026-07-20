---
type: order
date: 2026-07-20
device: iMac
agent: 쌍아
target: 막내
status: 대기
portfolio: PF_CITADEL
---

# 지시서: CITADEL 히스토리 소실 복원

> **[2026-07-20 16:28 KST]** iMac/쌍아 → 막내
> 민아 검증 반려: 히스토리 13행 소실 + 1행 주체 변조

## 배경

직전 아카이브 분리(c9fdc172)에서 CITADEL 히스토리 144행 중 13행이 소실, 1행이 주체 변경(쌍아→막내1) 상태로 병합됐다. 준수 조항(원문 그대로 이동, 편집 금지) 위반.

## Task

### Task 1 — 원본 복원

`git show 7bb5d53b:monkos-ops/ops/portfolios/PF_CITADEL/README.md`에서 히스토리 전량을 확인.

현재 README 히스토리(최근 30행) + ARCHIVE_HISTORY.md를 원본 144행과 대조하여:
- 소실 13행 복원 (README 또는 ARCHIVE에 원래 위치대로)
- 변조 1행 원문 복원 (주체를 원래대로)

### Task 2 — 무손실 검산

복원 후: README 히스토리 행수 + ARCHIVE 히스토리 행수 = **144** 확인.

### Task 3 — 절대 금지

- 행 병합 금지
- 요약 금지
- 주체 변경 금지
- 날짜·내용 편집 금지
- **원문을 한 글자도 바꾸지 않고 옮기기만 한다**

## 완료 기준

- [ ] 합산 144행 검산 통과
- [ ] 소실 13행 + 변조 1행 원문 복원
- [ ] 커밋 + 푸시

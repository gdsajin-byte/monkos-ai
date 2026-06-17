---
type: order
date: 2026-06-17
from: iMac/쌍아
to: iMac/막내1
portfolio: PF_AUTOPILOT
status: 대기
---

# 지시서 — AUTOPILOT 브리핑 데이터 랙 해소

> **[2026-06-17 11:44 KST] iMac/쌍아 → iMac/막내1**

## 배경

데일리 브리핑(`.github/scripts/daily_briefing.py`)이 GH Actions에서 매일 정상 가동(6/17 07:03 success)되지만, **생성되는 브리핑의 데이터 기준일이 ~3~4일 지연**되고 있다.

- 최신 자동 브리핑: `BRIEFING_20260613.md` (6/13 기준 데이터)
- 오늘: 6/17 → **4일 랙**

## 원인 (쌍아 사전 진단)

`daily_briefing.py:474` — `target = date.today() - timedelta(days=3)`

파일명도 `BRIEFING_{target.strftime('%Y%m%d')}.md` (line 528)이므로, **매일 실행해도 3일 전 데이터를 수집하고 파일명도 3일 전 날짜**로 생성된다. GSC/GA4의 데이터 래그(보통 2~3일)를 의식한 설계였을 것이나, 결과적으로 브리핑 자체가 항상 3일 늦어 보이는 구조.

추가로 `BRIEFING_20260614.md`~`BRIEFING_20260616.md`가 없는 것은, 이미 존재하는 파일을 덮어쓰지 않거나 다른 이유로 생성이 스킵됐을 가능성도 있다.

## 태스크

### Task 1 — 원인 정밀 확인
1. `daily_briefing.py` 전체 흐름을 읽고, `days=3` 외에 브리핑이 스킵되는 조건이 있는지 확인
2. GH Actions 실행 로그에서 6/14~6/16 실행 결과 확인 (성공했는데 파일이 없는지, 실행 자체가 안 됐는지)
3. 기존 파일이 있으면 스킵하는 로직이 있는지 확인

### Task 2 — 데이터 랙 해소 수정
**목표**: 브리핑 파일명과 내용이 **실행일 기준**(오늘)으로 생성되되, 데이터 수집은 GSC/GA4 래그를 감안하여 가용한 최신 데이터를 사용.

수정 방향:
- **파일명**: `BRIEFING_{오늘날짜}.md`로 변경 — 실행일 기준
- **데이터 수집**: `target_date`는 기존 `days=3` 유지 가능 (GSC 래그 감안). 단, 브리핑 본문에 "데이터 기준일: YYYY-MM-DD"를 명시
- **비교일**: 현행 `target - 7일` 유지

### Task 3 — 스킵 방지
- 동일 날짜 파일 존재 시 덮어쓰기 (최신 데이터로 갱신)
- 또는 실행 시 기존 파일 체크 로직이 있다면 제거

## ⚠️ 준수 조항

- `.github/scripts/` 수정 후 로컬 테스트 (Python 실행 가능하면 dry-run)
- GH Actions 워크플로우(`.github/workflows/daily-briefing.yml`) 변경 필요 시 같이 수정
- 시크릿 생성/추측 금지 (헌법 4조 1항)

## 완료 기준

- `BRIEFING_20260617.md`가 오늘 날짜로 생성 가능한 상태
- 데이터 기준일이 본문에 명시
- GH Actions 다음 실행(내일 05:00 KST)부터 정상 반영

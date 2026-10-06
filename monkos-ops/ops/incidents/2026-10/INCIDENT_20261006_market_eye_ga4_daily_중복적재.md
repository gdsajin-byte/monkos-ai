---
type: incident
date: 2026-10-06
device: iMac
agent: 막내2
service: market_eye (BigQuery monkos.market_eye.ga4_daily)
severity: 낮음 (분석 테이블, 코드 소비처 없음 — 브리핑은 GA4 API 직조회)
status: 롤백 완료 (2026-10-06 17:25 KST)
portfolio: PF_MARKET_EYE
order: ORDER_20261006_iMac쌍아_막내_MARKET_EYE_센서수선
---

# INCIDENT — market_eye.ga4_daily 8일 중복 적재 (자기 사고)

**[2026-10-06 16:33 KST]** iMac/막내2 → 작가님·쌍아

## 1. 무엇이

W1(결측 백필) 로컬 스모크 — `collect_ga4.js` 기본 10일 창 실행(2026-10-06 07:23:54 UTC 첫 적재) — 에서 이미 행이 있는 8일에 같은 날짜 행이 다시 적재됐다.

| 날짜 | 원래 행 | 추가 행 |
|------|-------|-------|
| 09-25 | 13 | 13 |
| 09-26 | 16 | 16 |
| 09-28 | 26 | 12 |
| 09-29 | 14 | 14 |
| 09-30 | 24 | 12 |
| 10-01 | 10 | 10 |
| 10-02 | 13 | 13 |
| 10-03 | 16 | 16 |
| **합계** | | **106행 중복** |

같은 실행의 09-27(14행)·10-04(10행)은 실제 결측이었으므로 정상 백필이다.
(실행 전 스냅샷 `FOR SYSTEM_TIME AS OF 2026-10-06 07:23:18 UTC`와 현재 행 수를 대조해 측정)

## 2. 원인 (자기 출력 포렌식)

`_loader.getMissingDates()`가 `params: { start: '2026-09-25' }, types: { start: 'DATE' }`처럼 **문자열 + DATE 타입 지정**으로 바인딩했다. BQ Node 클라이언트는 이 값을 **NULL**로 보낸다(`SELECT @start` → `null`로 재현). `BETWEEN NULL AND NULL`이 0건을 돌려줬고, 0건을 "전 날짜 결측"으로 읽었다.
live-verify 3조("0건 ≠ 부재 — 대조군부터")를 적재 경로 코드에 넣지 않은 것이 구조 원인이다.

## 3. 조치

1. **교정 (완료)**: DATE 파라미터를 `bq.date()`로 바인딩 + **대조군 가드** — 파라미터 조회 합계와 리터럴 `COUNT(*)`가 다르면 적재를 중단하고 예외. 교정 후 7/1~10/4 결측 재조회가 사전 실측과 일치(ga4 21일·gsc 23일)
2. **롤백 (대기)**: 스트리밍 버퍼에 있는 행은 DML로 지울 수 없다. 버퍼 소진 후 1트랜잭션으로 8일을 실행 전 스냅샷으로 복원한다.
   ```sql
   CREATE TEMP TABLE pre AS SELECT * FROM market_eye.ga4_daily
     FOR SYSTEM_TIME AS OF TIMESTAMP "2026-10-06 07:23:18 UTC"
     WHERE date IN (8일);
   BEGIN TRANSACTION;
   DELETE FROM market_eye.ga4_daily WHERE date IN (8일);
   INSERT INTO market_eye.ga4_daily SELECT * FROM pre;
   COMMIT TRANSACTION;
   ```
   검증 기준: 8일 각 행 수 = 스냅샷 행 수. 이 복원은 "기존 행 수정·삭제 금지"를 어기지 않는다 — 원래 행을 그대로 되돌리고 막내2가 넣은 중복분만 없앤다. (ch1 7조: 발각 시 중단 → 롤백)
3. **하류 영향**: `ga4_daily`를 읽는 코드 없음(grep 실측 — collectors 본인뿐). `/market-eye` 임시 조회만 해당. 롤백 전 그 사이에 8일 합계를 조회하면 2배로 나온다.

## 4. 결과

**[2026-10-06 17:27 KST]** iMac/막내2 — 롤백 완료
- 17:25 KST 버퍼 소진 확인 → 1트랜잭션(스냅샷 TEMP 복사 → 8일 DELETE → 132행 INSERT → COMMIT)
- 검증: 09-25~10-04 날짜별 행 수 = 13·16·14·26·14·24·10·13·16·10 — 실행 전 스냅샷 + 정상 백필(09-27 14·10-04 10)과 전부 일치. 7/1~10/5 결측 0
- 발견(본 사고와 무관한 기존 상태): 09-30은 실행 전부터 24행 = 12행×2 완전 중복이었다(스냅샷 실측). 전 테이블 완전 중복 = `ga4_daily` 4일 18행(07-31·08-06·08-31·09-30), `gsc_daily` 6일 1,097행(07-29·08-04·08-26·08-29·09-26·09-28) — 구 수집기의 "UTC 어제" 대상일이 예약 지연으로 겹쳐 같은 날을 두 번 수집한 흔적. 막내2 백필일과 겹치지 않음. 기존 행 삭제 금지라 손대지 않음 → 정리 여부 결정 대기(COMPLETION §8)

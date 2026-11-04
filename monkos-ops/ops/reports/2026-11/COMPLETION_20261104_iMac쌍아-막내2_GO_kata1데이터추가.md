---
type: completion
date: 2026-11-04
device: iMac
agent: 쌍아-막내2
status: 마감
portfolio: PF_GO
order: monkos-ops/ops/orders/2026-11/ORDER_20261104_iMac쌍아_막내2_GO_kata1데이터추가_23시재개전.md
---

# COMPLETION — 4060 b10 학습 데이터 kata1 일자 추가·셔플 교체

**[2026-11-04 17:53 KST]** iMac/쌍아-막내2 → iMac/쌍아

지시서: [ORDER_20261104_iMac쌍아_막내2_GO_kata1데이터추가_23시재개전](../../orders/2026-11/ORDER_20261104_iMac쌍아_막내2_GO_kata1데이터추가_23시재개전.md) (출처: 작가님 14:53 "진행" 범위 승인, 쌍아 전달)

## 결론

9일치를 받아 셔플을 마쳤고, 17:51에 `shuffled`를 새 데이터로 교체했습니다. 이로써 데이터 창이 1,249만 행에서 4,472만 행으로 3.6배 늘었습니다. 남은 학습량 약 27M 샘플은 새 창의 0.61에폭에 해당합니다. 23:00 재개는 4060이 22:40경 오프라인이 되어 확인하지 못했습니다(§5).

## 1. 일자별 수신 (4060, `fetch_data.sh` PARTS 8)

| 일자 | 크기(B) | 수신 완료 | 해제 npz 수 | 결과 |
|---|---|---|---|---|
| 2026-10-31 | 1,455,233,814 | 15:01 | 52,587 | ✅ |
| 2026-10-26 | 1,406,368,277 | 15:01 | 50,661 | ✅ |
| 2026-10-25 | 1,369,403,776 | 15:04 | 49,477 | ✅ (1차 HEAD 429 → 120s 재시도) |
| 2026-10-24 | 1,306,619,689 | 15:11 | 46,982 | ✅ (1차 HEAD 429 → 120s 재시도) |
| 2026-10-23 | 1,272,224,496 | 15:14 | 46,310 | ✅ |
| 2026-10-22 | 1,252,741,981 | 15:19 | 46,085 | ✅ |
| 2026-10-21 | 2,658,768,687 | 15:24 | 97,949 | ✅ |
| 2026-10-20 | 2,549,672,264 | 15:30 | 94,077 | ✅ |
| 2026-10-19 | 1,764,950,185 | 15:36 | 65,331 | ✅ |

- 합계 15.04GB, 15:00~15:37(약 36MB/s — 11-03의 ~170KB/s×8과 다름). 미수신 0건.
- 아카이브 최신은 10-31입니다. 11-01~11-03은 HEAD 403(미공개)이라 10-26 이전 날짜로 채웠습니다.
- 크기 표의 출처는 4060 `v2\pipeline.log`의 `ok …` 행입니다. 첫 크기 조회를 iMac에서 연달아 HEAD로 했다가 CF 429 챌린지를 받아, iMac 쪽 조회는 중단했습니다.

## 2. 셔플 (KataGo `python/shuffle.py`, 11-03 인자 동일, 4프로세스·BelowNormal)

| 구분 | 전 (shuffled → 현 shuffled_v1) | 후 (현 shuffled) |
|---|---|---|
| train 행 | 12,364,836 (177파일) | **44,280,397 (633파일)** |
| val 행 | 127,573 (2파일) | **438,046 (6파일)** |
| train.json range | [0, 12,492,409] | [0, 44,718,443] |

- 인자(11-03 4060 세션 원문에서 확인): `-keep-target-rows all -approx-rows-per-out-file 70000 -num-processes 4 -worker-group-size 40000`. val은 md5 0.99~1.00, train은 md5 0.00~0.99입니다.
- 소요 시간: val 15:38~15:51, train 15:51~17:51(샤딩 3,323s, 병합 약 50분). GPU는 쓰지 않았습니다(우리 프로세스는 python CPU뿐, BelowNormal 실측). 셔플 중 최소 가용 RAM은 9.5GB였습니다.
- 디스크: 834GB → 764GB(raw +15GB, npz 추가, shuffled_v2 생성). `shuftmp_v2`·`npz_tmp`는 0바이트로 남아 있습니다.

## 3. 교체 (17:51:18, 22:45 마감 전)

- 조건 3가지를 검증한 뒤 이름만 바꿨습니다: 행 수(새 train > 기존), train.json 존재, 학습 status `paused`. 결과는 `shuffled` → `shuffled_v1`, `shuffled_v2` → `shuffled`입니다.
- 사후 실측(17:52): `shuffled` 633/6파일·range 44,718,443, `shuffled_v1` 177/2파일·range 12,492,409. `\MONK\` 예약 5종(GO-eval-0041·0641·1041, GO-train-pause·resume)은 변경 없이 Ready이고, GO-train-resume의 다음 실행은 11-04 23:00입니다.
- **롤백 명령** (4060 Git Bash, 학습 정지 상태에서):
  `cd /c/Users/smuse73/go_train/data && mv shuffled shuffled_v2 && mv shuffled_v1 shuffled`

## 4. 실행 방식

- 4060 파이프라인 `C:\Users\smuse73\go_train\v2\v2_pipeline.sh`(레포 밖)를 WMI `Win32_Process.Create`로 BelowNormal 기동했습니다. ssh 세션과 분리되어 있습니다. 흐름: 수신(실패 시 120·240…s 재시도 6회, 20:30 마감) → 일자별 해제(`npz_tmp` → `npz` 이동, 반쯤 풀린 폴더가 셔플에 섞이지 않게) → 셔플 → 행 수 검증 → 조건부 교체. 디스크 100GB 가드가 들어 있고 삭제 명령은 없습니다.
- `fetch_data.sh`는 레포본을 LF로 복사해 썼습니다(md5 e4772d32 일치). 4060 레포 체크아웃본은 CRLF입니다.
- 로그: `v2\pipeline.log`, `v2\shuffle_val.log`, `v2\shuffle_train.log`, `v2\state.txt`.

## 5. 23:00 재개 확인

**[2026-11-04 23:43 KST]** iMac/쌍아-막내2 → iMac/쌍아 — ❌ **확인하지 못했습니다. 4060이 오프라인입니다.**

- 23:06 ssh 타임아웃. Tailscale에서 `monk-4060 100.118.31.62 offline, last seen 26m ago`(23:07 기준, 약 22:40부터 끊김), ping 3회 무응답. 23:07~23:43에 5분 간격으로 재접속을 시도했으나 모두 실패했습니다(23:43 기준 "last seen 1h ago").
- 판단: 22:40경 PC 전원 종료 또는 절전으로 보입니다. 그렇다면 23:00 GO-train-resume은 실행되지 않았을 가능성이 큽니다. 켜진 뒤 자동 재개 여부는 예약 작업의 "예약 시간을 놓친 경우 가능한 빨리 실행"(StartWhenAvailable) 설정에 달려 있는데, 이 값은 미확인입니다.
- 데이터 쪽은 17:51 교체로 이미 끝났습니다. 다음 기동은 수동이든 예약이든 새 셔플(`shuffled`, 44.28M)을 읽습니다.
- 18:03 쌍아 통지: 작가님 승인으로 `--max-samples`가 81.2M에서 95M으로 바뀌었습니다. 이 값이 반영됐는지도 아직 확인하지 못했습니다.

**4060이 켜진 뒤 확인 명령** (iMac에서):
```bash
ssh 4060 'C:\Users\smuse73\AppData\Local\Programs\Git\bin\bash.exe -s' <<'EOF'
R=/c/Users/smuse73/go_train/run/b10
grep -oE '"state": "[a-z_]*"|"start": "[^"]*"|"nsamp": [0-9]*|"max_samples": [0-9]*' $R/status.json   # max_samples 95000000 기대
grep -nE "Updated training data|Deferring|Beginning C:" $R/stdout.txt | tail -5   # Deferring N/633 + 새 shuffled\train\dataXXX_0.npz 기대
powershell.exe -NoProfile -Command 'Get-ScheduledTaskInfo -TaskPath "\MONK\" -TaskName GO-train-resume | Format-List LastRunTime,LastTaskResult,NextRunTime'
EOF
```
- 판정 기준: `Deferring N/633`(633 = 새 셔플 파일 수)이면 새 데이터를 읽은 것입니다. 177이면 구본입니다. `state`가 running이고 `max_samples`가 95000000이어야 합니다. LastRunTime이 23:00 이전이면 재개가 실행되지 않은 것이므로 쌍아가 재기동을 판단합니다.

## 💡 train.py 파일 추적과 같은 경로 교체

KataGo `train.py`(TrainingDataGenerator)는 현재 에폭에서 쓴 파일을 **절대 경로**(`train_state["data_files_used"]`)로 기억합니다. 재개할 때는 그 경로와 같은 파일을 다음 에폭으로 미룹니다(`Deferring N/633`). 새 셔플도 같은 폴더·같은 파일명(`data0_0.npz`…)이라, 이름이 겹치는 파일 N개(정지 시점이 4.33에폭이므로 약 0.33×177 ≈ 58개로 추정)는 내용이 새 데이터인데도 이번 런에서 뒤로 밀립니다.
- 영향: 남은 ~27M 샘플(≈386파일)은 미뤄지지 않은 약 575파일 안에서 반복 없이 소화됩니다. 오류 위험은 없고, 새 창의 약 9%를 이번 런에서 못 보는 정도입니다.
- 다음 확장 때는 출력 폴더 이름을 바꾸고(예: `shuffled_YYYYMMDD`) `--latestdatadir` 방식으로 넘기면 경로가 겹치지 않습니다. 쌍아 판단 사항입니다.

## 완료 보고

- ✅ 수신 9/9일(15.04GB), 해제, 셔플(train 44.28M·val 0.44M), 17:51 교체
- ✅ 기존 raw·npz·shuffled 삭제 0건(이름 변경만), GPU 미사용, 예약 작업 무수정
- ❌ 23:00 재개 확인 못 함 — 4060이 22:40경부터 오프라인(23:43까지 재접속 실패). 켜진 뒤 쓸 확인 명령과 판정 기준은 §5
- ⏳ 4060 전원 확인(작가님) → 쌍아가 §5 명령으로 재개·95M 반영 확인
- 💡 같은 경로 교체 때문에 현재 에폭에서 쓴 파일명은 다음 에폭으로 밀림(위 절)
- 📁 이 문서, 세션 로그 `monkos-ops/ops/sessions/2026-11/2026-11-04_iMac_쌍아-막내2.md`
- 🔀 작업 브랜치 `worktree-makne2-go-kata1-data`. main 병합은 쌍아가 합니다(백그라운드 막내는 main에 푸시하지 않음).

---
type: order
date: 2026-11-04
from: iMac/쌍아
to: iMac/쌍아-막내2
subject: 4060 b10 학습 데이터 확장 — kata1 공개 학습 데이터 일자 추가 수신·셔플, 23:00 자동 재개 전에 새 데이터 창으로 교체
status: 대기
portfolio: PF_GO
---

# ORDER — kata1 데이터 추가 (23:00 재개 전 교체)

**[2026-11-04 14:54 KST]** iMac/쌍아 → iMac/쌍아-막내2

출처: 작가님 2026-11-04 iMac 쌍아 세션 사람 턴 — 11:52 "일단 2시에 판단하자" → 14:53 "진행"(쌍아 14:50 제안: GPU 휴지 시간에 KataGo kata1 공개 데이터를 추가해 23:00 재개부터 새 데이터로 학습). 범위 승인 = 본 문서 §2.

## 0. 먼저 읽기
- `AI_Factory/go_train/README.md`, `fetch_data.sh`, `train_run.py`, `train_stop.py`
- `monkos-ops/ops/sessions/2026-11/2026-11-03_4060_쌍아.md` 21행 전후(11-03 데이터 수신·셔플 함정: 24분할 CF 429, 셔플 12프로세스 메모리 부족·출력 경로 오기)

## 1. 배경 (쌍아 실측 14:50)
- 4060 b10(b10c128) 학습: 14:50 예약 정지(`GO-train-pause`), **23:00 자동 재개**(`GO-train-resume`: `train_run.py --name b10 --model-kind b10c128 --max-samples 81200000 --until 2026-11-05_14:50 --final-eval`, datadir = `C:\Users\smuse73\go_train\data\shuffled`).
- 정지 시점 nsamp 54.1M. 데이터 = kata1 10-27~10-30 4일치(raw tgz 5.4GB, 약 1,249만 행) → **4.3에폭 반복**. pacc1 0.3813(29.5M)→0.3826(41.5M)→0.3832(51.1M) 정체.
- 남은 학습량 ≈ 27M 샘플(81.2M − 54.1M). 데이터 창을 약 40M 행 이상으로 키우면 남은 학습이 1에폭 안쪽이 된다.
- 4060 C: 여유 834GB. 지금은 아이들 GPU 시간대 — **GPU 사용 금지**(셔플·압축 해제는 CPU, 우선순위 낮춤).

## 2. 할 일 (전부 ssh 4060 경유, 4060 쪽 경로는 레포 밖 `C:\Users\smuse73\go_train\`)
1. **일자 선정**: katagoarchive.org/kata1/trainingdata 목록에서 기존 4일(10-27~30)에 붙은 최신 쪽부터 — 10-31 이후 공개분 → 부족하면 10-26 이전으로. 목표 **+8~10일**(약 +25~30M 행). 일자별 크기를 먼저 조회해 표로.
2. **수신**: `fetch_data.sh OUT 날짜...` 그대로(PARTS 8 유지 — 상향 금지, 11-03 429 실측). 출력 `data\raw\`. 진행 시각을 로그에. **20:30까지 받은 일자만** 다음 단계로(남은 일자는 COMPLETION에 미수신으로).
3. **압축 해제 → npz**: 기존 `data\npz\`와 같은 구조로 추가.
4. **셔플**: KataGo `python/shuffle.py`(11-03과 같은 방식, **4프로세스**·우선순위 BelowNormal). 기존+신규 전체 일자. 출력은 **새 폴더 `data\shuffled_v2\`**(train/val 구조 동일). 기존 `shuffled\`는 건드리지 않는다.
5. **교체 (22:45까지)**: 셔플 완료·행 수 확인 후 `shuffled` → `shuffled_v1`, `shuffled_v2` → `shuffled`로 이름만 바꾼다(롤백 = 반대로 바꾸기). 22:45까지 셔플이 안 끝나면 **교체하지 않는다**(23:00 재개는 기존 데이터로 진행) + 텔레그램/세션 메시지로 쌍아에 알림.
6. **재개 확인**: 23:00 이후 `stdout.txt`에 새 셔플 파일명(`Beginning ...shuffled\train\...`)이 찍히는지 1회 확인 — 막내 세션이 그때까지 살아 있으면 직접, 아니면 COMPLETION에 확인 명령을 적고 쌍아가 확인.
7. 예약 작업(`GO-train-*`, `GO-eval-*`) 수정 금지. 학습을 손으로 시작·정지하지 않는다.

## 3. ⚠️ 준수 조항
- 헌법 4조 1항: 시크릿 생성·추측 금지(이 작업엔 불필요).
- 헌법 4조 2항: 파괴적 명령 금지 — 기존 `shuffled`·`npz`·`raw` 삭제 금지(이름 변경만). 디스크 여유가 100GB 아래로 내려가면 멈추고 보고.
- 헌법 3조 1항: 모든 시각은 `date` 실측.
- 헌법 3조 2항·ch3: 세션 로그 append + 완료 보고(✅❌💡⏳📁🔀) + PF_GO 히스토리 1행(`scripts/pf.sh`).
- GPU 시간대: 23:00 전 GPU 작업 금지(메모리 `project_4060_gpu_time_windows`).
- 레포 커밋은 COMPLETION·세션 로그·(필요 시) 스크립트 수정만. 스크립트를 고치면 별도 커밋 + 4060 번들 반영 여부 기재.

## 4. 완료 기준
- [ ] 일자별 크기·수신 시각·성공/실패 표
- [ ] 셔플 결과 train/val 행 수(전·후)
- [ ] 22:45 교체 여부 + 롤백 명령 1줄
- [ ] 23:00 재개가 새 데이터를 읽는지 확인(또는 확인 명령)
- [ ] COMPLETION `monkos-ops/ops/reports/2026-11/COMPLETION_20261104_iMac쌍아-막내2_GO_kata1데이터추가.md`, 커밋·푸시·origin SHA 대조

## 5. 커밋 메시지
- `[research] 4060 b10 학습 데이터 kata1 일자 추가·셔플 교체 완료 보고 (PF_GO)`

# go_own — 형세 소형망 v0 (판 → 361칸 소유권 + 집 차이)

> 지시서: `monkos-ops/ops/orders/2026-11/ORDER_20261107_iMac쌍아_막내5_GO_형세소형망_학습v0.md` · PF_GO
> 코드만 이 폴더에 둔다. 자료·체크포인트는 레포 밖 — iMac `~/.monkos/go-board/models/own_v0/`, 4060 `C:\Users\smuse73\go_train\own_v0\`.

## 흐름

| 단계 | 파일 | 어디서 | 내용 |
|---|---|---|---|
| 1 준비 | `prep.py` | iMac CPU (nice, 일꾼 1) | 정답지(ownership_v1 2,000판) + 수순(queries_full) → 국면 복원 → `data/own_v0.npz` + `split.json`. 판 단위 분할(시드 0, 검증 200판 / 학습 1,800판). 74초 |
| 1 스모크 | `prep.py --smoke {판id}` | iMac | 마지막 국면 그림과 own 부호 나란히 + 방향 교차 점검(정방향·상하·좌우·전치) |
| 2 기준선 | `code_baseline.py` | iMac CPU | 검증 200판 전 국면 코드 형세(go_codeeval S1) → `data/code_val.npz` |
| 3 학습 | `train.py` | 4060 GPU (23:05~07:30 만) | b6c96 잔차망, 머리 2개, 8대칭 증강, 매 에폭 체크포인트·검증. 창 밖 시작 거부. `--cpu-test N`·`--smoke-steps N` 은 창 밖 CPU 시험 |
| 3 예약 | `make_task.py` | 4060 | `\MONK\GO-own-train` 1회 작업(GO-night-run 설정 상속, 실행 한도 4시간 30분) |
| 4 평가 | `table.py` | iMac | 망 vs 코드 형세 표(구간별) |

## 자료 형식 (`own_v0.npz`)

- `board` int8[N,361] — 1 흑 · −1 백 · 0 빈칸. 칸 번호 = y·19 + x, y=0 이 19줄(위), x=0 이 A열 — KataGo ownership 순서와 같음(스모크 실측 0.977 정방향 vs 뒤집기 0.51~0.59).
- `libs` int8 — 돌 칸의 활로 수(3 이상 3). `tomove` int8 — 1 흑 차례.
- `own` int8 — b18 64탐색 소유권 ×100, **흑 기준**(+100 = 흑 땅). `score` — 흑 기준 집 차(scoreLead). `turn` — 둔 수. `game` — split.json `games` 색인(< 200 = 검증).

## 망 입력면 8

흑 · 백 · 빈칸 · 흑 차례(전면) · 활로 1 · 활로 2 · 활로 3+ · 판 안(전면). 출력: `own` tanh[361](흑 기준) · `score` 집(흑 기준).

## 사용

```bash
nice -n 15 python3 -I prep.py                       # iMac
nice -n 15 python3 -I code_baseline.py              # iMac
scp ~/.monkos/go-board/models/own_v0/data/{own_v0.npz,split.json} 4060:C:/Users/smuse73/go_train/own_v0/data/
scp train.py 4060:C:/Users/smuse73/go_train/own_v0/
# 4060: 학습(창 안) — 보통은 예약 작업으로
C:\Users\smuse73\venvs\go-train\Scripts\python.exe train.py --data C:/Users/smuse73/go_train/own_v0/data --out C:/Users/smuse73/go_train/own_v0/run1
# 멈추기: run1\STOP 파일 생성 → 200스텝 안에 저장 후 종료
python3 -I table.py ~/.monkos/go-board/models/own_v0/run1/val_pred.npz      # iMac
```

## 한계

- ~~onnx 내보내기는 4060 venv 에 `onnx` 패키지가 없어 실패한다~~ → **11-08 해소**: 작가님 07:14 승인으로 go-train venv 에 onnx 1.23.2 · onnxruntime 1.31.1 설치. `export_onnx.py`(CPU 전용)로 best.pt → `own_v0.onnx`(opset 17, 배치 동적, 입력 `planes`[B,8,19,19] → `own`[B,361] · `score`[B]) + 대조 검증 `own_v0_verify.json`. TorchScript `own_v0_ts.pt` 도 그대로 둔다.

```bash
# 4060 (CPU만)
C:\Users\smuse73\venvs\go-train\Scripts\python.exe -X utf8 export_onnx.py --ckpt C:/Users/smuse73/go_train/own_v0/run1/best.pt --data C:/Users/smuse73/go_train/own_v0/data --out C:/Users/smuse73/go_train/own_v0/run1/own_v0.onnx
```

검증(11-08, 검증 44,075국면 onnxruntime CPU): torch fp32 대비 최대 차이 소유 1.0e-05 · 집 차 1.4e-04, TorchScript 대비 7.7e-06 · 9.9e-05. 정답 대비 소유 부호 98.6% · 소유 MAE 0.084 · 집 차 MAE 6.9 · 승자 79.4%(COMPLETION §4 전체 행과 같다). 배치1 CPU: 4060 9.9ms(스레드 1 = 12.0ms) · iMac 1.87ms(스레드 1 = 5.69ms, onnxruntime 1.23.2).

## v0 결과 (11-07 23:06~23:49, 4060)

30에폭 43.3분, best = 에폭 25. 검증 200판에서 소유 부호 일치 98.6%(코드 형세 75.6%), 사석 칸 88.4%(24.9%), 집 차 MAE 6.9집(20.3). 상세·에폭표: `monkos-ops/ops/reports/2026-11/COMPLETION_20261107_iMac쌍아-막내5_GO_형세소형망_학습v0.md`. 진단 `own_to_score.py`(소유 합+포로로 집 차 재계산, b18 바닥값).

## v1 (11-08, ORDER_20261108 막내7 §1-2 — 작가님 10:49 승인)

- 자료 `prep_v1.py`: v0 자료 + 국면별 포로 차 `caps`(흑이 딴 돌 − 백이 딴 돌) → `~/.monkos/go-board/models/own_v1/data/own_v1.npz`, 분할 v0 그대로(검증 200 / 학습 1,800판). 점검: b18 자기 소유 합+포로 vs scoreLead MAE 2.0(포로 없이 2.8).
- 학습 `train.py --v1`: 입력면 9(v0 8 + 포로 차 면 ÷20) · 일관성 손실 `--cons-w`(기본 0.1) = Huber(Σown − Σ판 위 돌 + 포로 차 − 6.5 ↔ 집 차 머리, ÷20). `--v1` 없으면 v0 와 같다. 내보내기 `own_v1.onnx`(입력 [B,9,19,19]).
- 야간 `night_v1.py`(4060): b6c96(상한 1.25시간) → b10c128(마감 06:50) 순서로 학습, 각각 `export_onnx.py`(v1 체크포인트 자동 인식)로 onnx 변환·대조. 로그 `C:\Users\smuse73\go_train\own_v1\night_v1.log`, 끝나면 `DONE`. 전체 중단 `STOP_ALL`.
- 예약: `python make_task.py 2026-11-08T23:06:00 --v1` → `\MONK\GO-own-train-v1`(실행 한도 7시간 30분).
- 표 `table_v1.py 이름=val_pred.npz …`: v0·v1 망 열 + 코드 형세 + 소유 합+포로 집 차.
- 바둑판 `apps/go-board-web/shape_net.py`는 onnx 입력 면 수(8·9)를 읽어 v0·v1 둘 다 쓴다.

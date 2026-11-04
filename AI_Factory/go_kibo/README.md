# go_kibo — 작가님 타이젬 기보 분석 (PF_GO)

> 지시서: `monkos-ops/ops/orders/2026-11/ORDER_20261104_iMac쌍아_막내3_GO_내기보_22년통계_실수사전표본.md`
> 코드만 이 폴더에 둔다. **기보 원본·대국자 아이디·산출 데이터는 레포 밖**(아래 경로). 레포 보고서(`reports/`)에는 집계 수치만 넣는다.

## 데이터 경로 (iMac, 레포 밖)

| 용도 | 경로 | 비고 |
|---|---|---|
| 기보 원본 (읽기 전용) | `~/.monkos/go-board/kibo/tygem/mine/` | 연도별 `.gib`+`.sgf`, 원장 `ledger.jsonl`. **쓰지 않는다** |
| 작가님 아이디 | `~/.monkos/go-board/analysis/me.txt` (또는 `GO_KIBO_ME`) | 레포에 두지 않음. 없으면 `❌ go_kibo:` 종료 |
| 산출 | `~/.monkos/go-board/analysis/` | `games_v1.*`, `parse_report_v1.json`, `stats_v1/`, `mistakes_v0/` |

경로 재정의: `GO_KIBO_DIR`, `GO_ANALYSIS_DIR`.

## 파일

| 파일 | 역할 |
|---|---|
| `kibo_common.py` | 경로·급수 코드·AI 판별·SGF 헤더/수순 파서 |
| `parse_kibo.py` | 원장(id 기준 마지막 행) + SGF(+GIB) → 대국별 1행 `games_v1.jsonl/csv` + 파싱 실패·이상치 집계 |
| `stats_kibo.py` | ① 22년 통계 → `reports/STATS_v1.md` + `stats_v1/*.csv, *.svg` |
| `sample_mistakes.py` | ② 표본 2,000국 선정(시드 고정) + KataGo 질의 생성 |
| `katago_analysis.cfg` | 4060 analysis 엔진 설정 정본 (4060 `C:\Users\smuse73\go_kibo\`로 복사됨) |
| `run_4060.sh` | iMac → 4060 질의 전송·엔진 실행·응답 회수·b10 처리량 전후·집계 |
| `analyze_mistakes.py` | 응답 → 작가님 수별 손해 `moves_{name}.jsonl` + `reports/MISTAKES_v0.md` |
| `b10_rate.py` | b10 학습 stdout에서 샘플/s 전후 비교 |

## 실행

```bash
# ① 통계 (GPU 없음, 약 40초)
python3 AI_Factory/go_kibo/parse_kibo.py
python3 AI_Factory/go_kibo/stats_kibo.py      # '핵심 발견' 블록은 재실행해도 보존

# ② 실수 사전
python3 AI_Factory/go_kibo/sample_mistakes.py select            # 1회만 — 이미 있으면 거부(--force)
python3 AI_Factory/go_kibo/sample_mistakes.py queries smoke10 --n 10
AI_Factory/go_kibo/run_4060.sh smoke10 64                         # ⚠️ GPU — 4060 시간 규칙 준수
python3 AI_Factory/go_kibo/sample_mistakes.py queries full        # 2,000국
AI_Factory/go_kibo/run_4060.sh full 64
```

## 정의

### 통계 (①)
- **급수 코드**(타이젬): 18=1단 … 22=5단, 23=6단, 24=7단, 26=9단 · 17 이하 = 급(18−코드). 27 = AI·특수 계정에서만 관측 → "특수". GIB `GAMExxxLEVEL`과 대조해 확인(2026-11-04).
- **AI 상대**: 상대 아이디가 `AI_` 또는 `KataGo`로 시작(대소문자 무시). AI 대국은 전부 친선.
- **결과**: SGF `RE`가 1순위, 없으면 원장 `result` 문자열(중국 서버 기보의 GBK→cp949 깨짐 복원 포함), 없으면 원장 `grlt` 코드(0/1=계가, 3/4=불계, 7/8=시간). 셋 다 없으면 "결과 없음"으로 승률에서 빼되 건수는 보고서에 남긴다.
- **종류·치석**: 원장 `cate`가 정본(SGF `GN`은 AI 친선 대국에도 '승강급'이 찍힌 사례가 있어 cate가 비었을 때만 쓴다).
- **시각**: 원장 목록 시각. GIB 시작 시각보다 중앙값 약 24분 늦다 → 대국 종료 무렵.
- **연속 대국**: 같은 날짜 안의 순서. 직전 판 = 같은 날 바로 앞 판.

### 실수 사전 (②)
- **표본**: 사람 상대·승강급·호선·승패 확정·작가님 착수 20수 이상. 시대 4구간(2004–08 / 2009–14 / 2015–20 / 2021–26) × 승·패 = 8칸 × 250 = 2,000국. 시드 `20261104`. 목록 `mistakes_v0/sample_2000.jsonl`이 고정본이다(원장이 계속 자라므로 재선정하면 결과가 달라진다).
- **엔진**: 4060 KataGo v1.18.2 + `go_train\nets\b18.bin.gz`(kata1-b18c384nbt), 규칙 korean, 덤은 기보 값(기본 6.5). 모든 국면(0~수수) 평가.
- **손해** (KaTrain 방식): 작가님 착수 직전 국면의 루트 scoreLead − 착수 직후 국면의 루트 scoreLead (작가님 기준, 집). 승률 손해도 같은 식. 집계는 음수를 0으로 자른다. 같은 탐색 안의 비교값(`mine_loss_same_search`)은 참고용으로 함께 남긴다.
- **국면 단계** (수순 기준): **포석 1–50 · 중반 51–150 · 끝내기 151+**.
- **최선 수와의 거리**: 체비셰프 거리 `max(|dx|,|dy|)`. 패스가 끼면 없음.
- **큰 실수**: 손해 3집 이상.

## 4060 시간 규칙
- 아이들 게임 PC 공용 — 저녁(~23시)은 GPU 금지. b10 학습 예약(`GO-train-resume` 23:00 ~ 다음날 14:50) 중 동시 실행은 b10 저하율 30% 이하일 때만 쌍아 확인 후.
- `katago.exe`는 cmd(ssh 기본 셸)에서 바로 실행된다(Git Bash 직접 실행은 로더 오류 — go_train README).

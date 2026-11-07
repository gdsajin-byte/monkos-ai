---
type: order
date: 2026-11-07
from: iMac/쌍아
to: iMac/쌍아-막내5
subject: 형세 소형망 v0 — 소유권 2,000판(437,354국면)으로 판→361칸 소유권+집 차이 예측 소형망 학습. 4060 밤 창 23:05~07:30. 준비는 지금 iMac에서(가볍게)
status: 대기
portfolio: PF_GO
---

# ORDER — 형세 소형망 학습 v0

**[2026-11-07 20:23 KST]** iMac/쌍아 → iMac/쌍아-막내5

출처: 작가님 2026-11-07 iMac/쌍아 세션 사람 턴 — 20:23 "진행해 얼마나 걸릴거 같은기"(18:37 쌍아 제안 "오늘 밤 23:05 4060에 형세 소형 모델 학습 걸어 둘까요?"에 대한 승인).

## 0. 재료 (쌍아 실측)
- 정답지: iMac `~/.monkos/go-board/analysis/ownership_v1/out1/*.jsonl` 2,000판(712M). 행 = `id·turnNumber·scoreLead·winrate·visits·own[361]`(int ×100, b18 visits 64). **판 상태는 없다** — 수순은 수집 질의 파일(4060 `C:/Users/smuse73/go_kibo/own` 또는 `full/queries_full.jsonl`, 러너 `AI_Factory/go_kibo/mistakes_runner.py`)에서 복원한다. 원본은 읽기만.
- 학습 환경: `AI_Factory/go_train/README.md`(4060 venv `go-train`·torch cu128, b6c96 2,089샘플/s 실측). 접속 `ssh 4060`.
- 비교 대상: 코드 형세 `AI_Factory/go_codeeval/`.

## 1. 할 일
1. **준비(지금~23:05, iMac CPU 가볍게 — 팬 소음 주의, 일꾼 1개·nice)**: 국면 복원 → 입력면(흑·백·빈칸·차례·활로 1/2/3+) + 정답(own 361, scoreLead) 배열로. **판 단위 분할** 학습 1,800 / 검증 200(같은 판 국면이 양쪽에 섞이지 않게). 1판 스모크로 own 좌표 방향(행·열·흑 기준 부호)을 실제 판 그림과 대조해 확인.
2. **학습(4060, 23:05 이후만)**: 소형 합성곱망(시작 b6c96급, 약 1M 파라미터) — 헤드 2개(소유권 361 tanh, 집 차이 회귀). 8대칭 증강. 시간 상한 4시간, 07:30 전 반드시 종료. 체크포인트 매 에폭.
3. **평가(검증 200판)**: 소유권 칸 부호 일치율·MAE, 집 차이 MAE, 승자 일치율 — **코드 형세와 같은 표로 나란히**. 중반·종반 구간별로 나눠 적는다.
4. 산출: 체크포인트·onnx(가능하면) 레포 밖 `~/.monkos/go-board/models/own_v0/`, 코드는 `AI_Factory/go_own/`. `AI_Factory/REGISTRY.md` 1행.

## 2. 하지 않는 것
23:05 전 4060 GPU 사용 · 8765 서비스·형세 막대 교체(결과 보고 후 쌍아 결정) · 원본 데이터 수정 · `rm -rf` · 패키지 설치(필요 시 중단·보고).

## 3. 준수
헌법 3조·4조. 반환: COMPLETION(국면 수·분할·망 크기·에폭·소요 시간·평가표·코드 형세 대조) + 브랜치 SHA. 병합은 쌍아.

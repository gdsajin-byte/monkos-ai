# go_codeeval — 코드 형세 시제품 (엔진 없음)

- 출처: 작가님 11-06 18:59·19:01·20:34 → `monkos-ops/ops/orders/2026-11/ORDER_20261106_iMac쌍아_막내8_GO_코드형세_시제품.md`
- 목적: 타이젬처럼 형세·계가 사석 표시를 **엔진 없이 즉시** 계산한다. 모바일 이식을 위해 외부 의존 없는 순수 Python으로 짠다. 화면·서버에는 아직 반영하지 않았다(시제품).

## 파일

| 파일 | 내용 |
|---|---|
| `codeeval.py` | 판 재생 · Benson 무조건 삶 · Bouzy 팽창·침식 세력 · 무리(대마) · 눈(진짜·가짜) · 갇힘 사활 판정(삶/죽음/미정) · `evaluate()` |
| `make_truth.py` | b18 정답지 생성 — 국면별 집 차·소유권, 종국판 사석(`final_status_list dead`). 판정 엔진은 iMac에서 돌리고 4060은 쓰지 않는다 |
| `compare.py` | 정확도 표(`TABLE.md`) + d32d 백 대마 추적 그래프(`d32d.svg`) |
| `tune_influence.py` | 세력 변형 비교(호선 대표본) |
| `debug_board.py`·`debug_why.py` | 사활 판정 디버그(판 출력·미정 사유) |

## 알고리즘 출처·라이선스

- **세력**: Bouzy, B. (2003), "Mathematical morphology applied to computer go", IJPRAI 17(2).
  - 돌 ±128에서 시작해 팽창 D회(인접 같은 부호 수만큼 더함, 반대 부호 이웃이 있으면 멈춤)와 침식 E회(인접 다른 부호 수만큼 뺌, 0에서 멈춤)를 한다.
- **무조건 삶**: Benson, D. B. (1976), "Life in the game of Go", Information Sciences 10.
  - 둘러싼 영역·생명 영역을 반복해서 제거한다.
- **사활(간단)**: 이 폴더 자체 규칙이다.
  - 무리 = 활로 공유·대각 연결로 묶는다.
  - 2눈 이상 또는 Benson 또는 자기 세력 집 공간 7칸 이상이면 삶이다.
  - 나머지는 갇힘 판정을 한다. 영역은 자기 돌·자기 세력 빈칸으로 퍼지는 범위다.
    - 자기 세력 빈칸 12칸 초과면 삶이다.
    - 중립 빈칸을 따라 확실히 산 자기 무리에 닿으면 미정이다.
    - 확실히 살지 않은 상대 덩어리와 활로가 비슷하거나 우리가 많으면(수상전) 미정이다.
    - 그 밖은 죽음이다.
- **외부 코드는 복사하지 않았다.** GNU Go 등 GPL 계열 코드는 열람도 하지 않았고, 위 논문의 알고리즘 설명만 보고 새로 작성했다.

## 사용

```bash
python3 -I codeeval.py                                     # 속도 시험
python3 -I make_truth.py <truth.jsonl> --visits 400        # b18 정답지(이어 쓰기)
python3 -I compare.py <truth.jsonl> <출력 폴더> --even-games 300
```

```python
import codeeval as ce
r = ce.evaluate([("B", "Q16"), ("W", "D4")], setup=(), komi=6.5)
# r["lead"] 흑 기준 집 차 · r["own"] 361칸 소유 · r["dead"] 사석 칸 · r["undecided"] 미정 칸
```

정확도·권고: `monkos-ops/ops/reports/2026-11/COMPLETION_20261106_iMac쌍아-막내8_GO_코드형세_시제품.md`

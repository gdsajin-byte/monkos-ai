---
type: order
date: 2026-11-08
from: iMac/쌍아
to: iMac/쌍아-막내11
subject: 해설 도면·장면 영상에 영역 자동 표시 — 형세망 v0(onnx)로 장면 국면 소유권 → 반투명 칠·X 해칭·펜 윤곽(표기 관례 2), 무리 ▲/■ 자동 후보
status: 대기
portfolio: PF_PRESENTATION
---

# ORDER — 해설 도면 영역 자동 표시

**[2026-11-08 14:51 KST]** iMac/쌍아 → iMac/쌍아-막내11

출처: 작가님 2026-11-08 iMac/쌍아 사람 턴 14:51 "쿼터를 울트라로 복귀했다 이제 빡세게 돌려야해" — 10:45 브리핑·10:49 "나머지는 모두 승인" 범위의 남은 숙제 병렬 착수.

## 0. 근거
`ops/reports/2026-11/COMPLETION_20261107_iMac쌍아-막내1_GO_판독9편정제_장면사전v1_DBv1_표기관례.md` ⏳: "정적 도면 SVG(diagrams.py)에는 영역·무리 표식이 없다 — 도면 장면 정보에 영역이 없어서". 이제 형세망 v0 `~/.monkos/go-board/models/own_v0/run1/own_v0.onnx`(CPU 1.9ms, 입력 규약 `AI_Factory/go_own/README.md`)이 장면 국면마다 361칸 소유를 준다. 표기 관례: 영역=펜 윤곽+반투명 칠 또는 X 해칭, 무리=▲/■(메모리 feedback_go_commentary_level).

## 1. 할 일 (1건씩 커밋)
1. `AI_Factory/go_kibo/diagrams.py`: 장면 국면 → 형세망 소유 → 문턱(예 |own|≥0.6) 영역 덩어리 → 펜 윤곽+반투명 칠(흑/백), 미정 칸은 X 해칭. 사석 = 돌 위 표식. 시범 10장면 SVG.
2. 해설 장면에서 "영역이 바뀐 곳"(정해도 대비 실패도 소유 차이 큰 덩어리)을 자동 강조 후보로 — 바꿔치기·두터움 설명의 시각 근거.
3. `apps/go-explainer-e2e/render_scene.py` 장면 1개(s02 계열)에 같은 표시 적용 시험 렌더 1편.

## 2. 하지 않는 것
TTS 재생성 · 업로드 · `rm -rf`.

## 3. 준수
헌법 3조. 반환: COMPLETION(SVG·영상 경로) + 브랜치 SHA, SendMessage로 쌍아(monk-project-de). 병합은 쌍아.

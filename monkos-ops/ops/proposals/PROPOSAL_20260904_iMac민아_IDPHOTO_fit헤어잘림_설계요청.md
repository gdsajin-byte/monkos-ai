---
type: proposal
date: 2026-09-04
device: iMac
agent: 민아
to: iMac/쌍아
subject: "specs 무료 트랙 fit 경로 — 타이트 원본에서 헤어 잘림 출고 결함: 원인 사슬·수정안 2 (설계 요청)"
portfolio: PF_IDPHOTO
related: PF_SPECS, PF_ANCHOR(G-M1 품질)
status: 설계 요청 — 쌍아
---

**[2026-09-04 08:20 KST]** iMac/민아 → iMac/쌍아 (참조: 작가님)

> 발단: 작가님 09-04 08:12 어드민 포토리뷰 캡처 — qa-passport(09-02 13:14)·kr-intl 무료 트랙 결과가 **원본이 타이트할 때 확대되어 헤어 상단이 잘린 채 출고**. us-passport(아기)는 정상(pad=1 여백 생성).

# 1. 실측 (2026-09-04)

- 09-02 3건 로그: 전부 `[Matte] fit 확정 매팅 완료 … pad=0`(검수 확정 프레임 경로). qa-passport `[Fit] face=33.3mm top=4mm judge=pass/pass vision=skip` — **판정은 pass인데 결과물은 헤어 잘림.**
- 30일 [Fit] 판정 0건(0일) — top<2: 0 / 2~3: 0 / 3~7: 0 / >7: 0 (crown 기준 여백이라 헤어 잘림 감지 불가) · vision={} · 상위 슬러그 []
- crop-engine은 asia-northeast3에 실존·200 (references.md "미생성"은 리전 오판 → 09-04 정정).

# 2. 원인 사슬 (코드 판독)

| # | 위치 | 사실 |
|---|---|---|
| ① | `portal/server.js:475` | fit 호출 시 `hairScan: false` — 실사(비순백) 원본에서 `subjectTopRow`가 오검출(07-07 crown 22.2mm 사고) → 꺼둠 |
| ② | `crop-engine/lib/crop.js:50-51` | `hasHairTop=false` → `hairTopY = crownY`(랜드마크 추정 정수리). **헤어 가드(②)·축소 루프의 헤어 체크가 전부 비활성** |
| ③ | `spec-judge.js:53` | `topMm = crownY − frame.y` — **추정 정수리 기준 여백**. 헤어 볼륨(정수리 위 실제 머리카락)은 측정 자체가 안 됨 → top=4mm pass인데 헤어는 프레임 밖 |
| ④ | `spec-judge.js:42` | `blocked`는 얼굴 크기 범위만. top fail도 note → 통과 |
| ⑤ | `crop.js:106`, `fitSpecGeometry canClampY` | 프레임을 이미지 경계 안으로 클램프 → 헤드룸 부족 원본에서 위로 못 올림(패딩 경로 `renderFitCrop` pad>0가 있는데 fit 기하가 쓰지 않음) |
| ⑥ | `crop.js:249` 주석 | "실사 입력의 헤어 잘림 판정은 상위(Gemini 비전 §6-2) 담당" — **07-09 Gemini 비전 퇴출 후 담당 부재.** 구조 공백 |

**요약**: 실사 원본에서는 헤어탑을 아무도 재지 않는다. 판정·프레임·가드가 전부 추정 정수리를 기준으로 동작하므로 "pass"와 "헤어 잘림"이 공존한다. 07-06 교훈("수치 통과 ≠ 실물 합격")의 재현.

# 3. 수정안 (쌍아 설계 판단 요청)

| 안 | 내용 | 비용 | 효과 |
|---|---|---|---|
| **A 핫픽스** | ① `hasHairTop=false`일 때 **보수 헤어 허용치**(예: 얼굴높이 × 12%, 07-06 HAIR_VOLUME_MAX 15% 이내)를 crown 위에 가산해 프레임 상단을 올림 ② `canClampY` 클램프를 **패딩 허용**으로 완화(프레임 상단이 이미지 밖이면 pad>0 경로 — 이미 구현·검증됨) ③ `judge.blocked`에 top<2mm 추가(차단 아닌 "재프레이밍 강제") | 막내 0.5세션, crop-engine·portal 2배포 | 대다수 헤어 잘림 제거. 볼륨 큰 헤어는 여전히 잔존 위험 |
| **B 정공** | fit 순서 변경: 대략 크롭 → **매팅 선행**(RunPod ~0.4s) → 순백 결과에 `hairScan: true`로 실측 헤어탑 → fit 기하 → 최종 재단. 헤어 가드·판정이 실측으로 작동 | 막내 1~1.5세션, 매팅 1회 추가 비용 | 구조 공백 ⑥ 해소. 07-07 오검출 원인(비순백)이 사라져 hairScan 재활성 안전 |
| C 병행 | 검수 UI에 헤어 라인(`v2-fit-line-hair` 존재)이 실측일 때만 표시, 추정일 때 "헤어 여백 미확인" 배지 | 0.2세션 | 사용자 인지 |

민아 권고: **A를 먼저(이번 주), B를 G-M1 품질 항목으로 뒤이어.** 유료 T2까지 같은 crop-engine을 쓰므로 무음 강등 출고(07-17 원칙)에 해당 — 우선순위 P1.

# 4. 검증 기준
- 09-02 3건 원본으로 재생성 → 헤어탑 여백 ≥2mm(실측) · face 범위 내 · 어드민 포토리뷰 육안
- 30일 [Fit] 로그의 top 분포는 crown 기준이라 **헤어 잘림 모집단을 세지 못함** → B 적용 후 hairMarginMM 로그로 재집계

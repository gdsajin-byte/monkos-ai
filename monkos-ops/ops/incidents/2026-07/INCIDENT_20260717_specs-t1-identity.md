---
type: incident
date: 2026-07-17
device: iMac
agent: 민아
status: 진행
portfolio: PF_SPECS
---

# INCIDENT — T1 유료 트랙 정체성 파괴 + 폴백 붕괴 (vn-visa, 작가님 실측 2건)

> **[2026-07-17 17:20 KST]** iMac/민아 → 작가님, iMac/쌍아
> 발생: 2026-07-17 17:05·17:09 KST, dev(00152) vn-visa ₩2,000 유료 생성 2건 (작가님 파일럿 테스트)
> 심각도: **P0** — 헌법 1조 3항(정체성 보존 제1원칙) 위반 산출물이 유료 경로에서 출고

## 1. 증상

| 건 | 로그 | 증상 |
|----|------|------|
| 1 | 17:05:31 `T1 attireDesc=null, gender=f` → 나노 2회 프레이밍 이탈(eye 39.3·39.6%) → 17:06:09 `gemini-2.5-flash-image` → `트랙=gemini` | 보정·의상 미적용, 눈위치 60.4%(규격 40~48 완전 이탈) 유료 출고, "AI 재구성 배경" 경고 |
| 2 | 17:09:55 `T1 attireDesc=null, gender=m` → attempt2 통과 → `트랙=t1-attire` | **여성 → 남성 생성** (성전환 출고) |

## 2. 원인 사슬 (4중 결함, 전부 코드 확정)

**A. 성별 기본값 'm' 3중 적층 — 성전환의 직접 원인 (건2)**
- specs-funnel.js:945 `gender: subjectSelection.gender || 'm'` (초기값 null → m 전송)
- attire-picker.js:105 `this.gender = … : 'm'`
- idphoto-generate.js buildT1Prompt: gender='m' → **`[SUBJECT] This person is an adult man.` 선언 주입** + attireDesc=null 시 `[OUTFIT]` 기본값이 **남성 정장**("dark navy business suit, white dress shirt")
- 말미의 `[CONSTRAINT] DO NOT change apparent gender`가 있으나 SUBJECT 선언+남성 의상 지시가 이를 압도 — 여성 사진이 남성으로 재구성됨.

**B. 의상 피커 잠금+정적 마운트 — "여성복 미배치"의 실체**
- 여성·teen·baby 카탈로그는 어제 커밋 완료(3d3f902d·197d0d58·6d067fcf — 15/15 완비). 데이터는 있음.
- 그러나 attire-picker.js:106 `genderLocked = !!(opts.gender…)` — 퍼널이 항상 구체 성별(`|| 'm'`)을 넘기므로 **피커 내부 성별 전환이 상시 잠김**.
- specs-funnel.js:217 `if(!attirePicker)` — **1회 마운트 후 성별·연령 칩을 바꿔도 재마운트 없음** → 첫 진입 시점 성별(m)의 남성복만 평생 노출.
- 결과: 유저(작가님)는 남성복밖에 볼 수 없었고, 여기서 고르면 A와 결합해 성전환.

**C. T1 폴백 붕괴 — "유료가 무료보다 나쁠 수 없다" 보장 파괴 (건1)**
- server.js:749 `if (slug && matteEnabled() && !isT1Path)` — **T1 경로는 매팅을 스킵** → 설계 주석의 "실패 시 매팅본(T0 결과) 유지"가 성립 불가 (finalBase64=null).
- 프레이밍 게이트 2회 이탈 시 → 구식 gemini-2.5 재생성으로 낙하: 얼굴 재생성(정체성 리스크) + 물리 게이트 부재.

**D. 출고 게이트 공백 (건1)**
- gemini 트랙 산출물은 spec-judge blocked 게이트 미적용. 결과 체크리스트 눈위치 기준(33~58, warn)이 판정 정본(40~48, blocked)과 불일치 — 60.4%가 warn 표시로 다운로드 허용.

## 3. 처방 (승인 대기)

| 급 | 조치 | 성격 |
|----|------|------|
| **긴급 A** | 성별 미선택 시 기본 'm' 제거 — SUBJECT 라인을 "Preserve the person's apparent gender and age exactly as in the original photo"로 대체(미선택·불명 시), OUTFIT 기본값 성중립화("business attire appropriate to the person"), 퍼널 `|| 'm'` 제거(null 전송 허용) | front+prompt 소수정 — 민아 직접 가능 |
| **긴급 B** | 성별·연령 칩 변경 시 피커 재마운트(또는 setContext API) + genderLocked 조건 재설계 | front 소수정 — 민아 직접 가능 |
| **구조 C** | T1 실패 폴백 재설계 — T1 경로도 매팅본 선확보(또는 실패 시 matteFitPipeline 실행) 후 게이트 이탈 시 매팅본 출고. legacy gemini 낙하 제거 | server 파이프라인 — **쌍아 설계·지시서** |
| **구조 D** | 전 트랙 출고 물리 게이트(judge blocked 정합) + 결과 체크리스트 기준 정렬 + 이탈 시 재생성·환불 동선 | server+UX — **쌍아 설계·지시서** |
| 후속 | 작가님 테스트 결제 2건(₩2,000×2) 환불 여부 작가님 판단. eyeOpen 캘리브레이션 이월 건과 T1 하네스 재검(7/10 3회 실증 이후 회귀) 연계 | — |

## 4. 관측 기록

- 발견 경로: 작가님 파일럿 실물 테스트 (오늘 fit 자기모순 발견과 동일 세션) — 실물 검수가 하루에 P0급 2건 적발.
- dev에서 발생했으나 A~D 전부 prod 동일 코드 — vn 외 전 슬러그 T1 경로 공통.

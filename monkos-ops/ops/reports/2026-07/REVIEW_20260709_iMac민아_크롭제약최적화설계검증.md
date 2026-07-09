---
type: report
date: 2026-07-09
device: iMac
agent: 민아
portfolio: PF_SPECS
status: 마감
---

# REVIEW: 크롭 제약 최적화 설계서 검증 (DESIGN_20260709_크롭제약최적화_IDPASS산술화)

**[2026-07-09 16:20 KST]** iMac/민아 → 작가님, iMac/쌍아

## 결론: 조건부 통과

설계 방향(변수 1개 + 규격 제약 산술화, 눈 위치=결과)은 타당하고 hard 제약 유도식은 검산 일치.
단, **지시서화 전 보정 3건(그중 로직 오류 1건) + 작가님 결정 1건** 필요.

## 검산 확인 (통과 항목)

- **topMin/topMax 유도식 정확**. 하한 식(설계서 §최적화)을 전개하면 `chin×scale − frameH + 5mm×mmPx`로 의사코드 topMin과 일치.
- **가용 범위 항상 존재**: 범위 폭 = frameHmm − faceTarget − 8mm. KR여권 4mm, 반명함 6mm — 33mm 고정 하에 topMin > topMax 불능. **얼굴 축소 루프가 수학적으로 불필요해짐** — "축소 금지" 원칙과 정합. (infeasible 분기는 안전장치로 유지 무방)
- **대머리 폴백 회귀 위험 낮음**: hairTop=crownY → topMax 선택 → 눈 위치 = (3mm + 16.5mm)/45mm = **43.3%** — 현행 EYE_POSITION_RATIO 0.43과 사실상 동일.
- 반명함도 topMax에서 눈 40.0% — C4 범위 내.

## F1. 【로직 오류】 2순위 폴백이 볼륨 헤어에서 역방향

`hairTopTarget ∉ [topMin, topMax]`의 이탈 방향은 둘인데 폴백이 topMax 하나다:

- hairTopTarget **> topMax** (헤어볼륨 < 3mm): topMax 반환 → 헤어 프레임 안 ✓ 정상.
- hairTopTarget **< topMin** (헤어볼륨 > frameHmm−faceTarget−5mm = KR여권 7mm 초과): topMax 반환 = **정수리 여백을 최소(3mm)로 만들어 헤어를 최대로 자르는 위치**. 1순위 취지와 정반대. 최소 잘림은 topMin(정수리 여백 7mm).

**수정안**: 분기 3단을 한 줄로 대체 —

```javascript
return Math.max(topMin, Math.min(topMax, Math.round(hairTopY * scale - hairMarginPx)));
```

- 대머리/짧은 헤어 → topMax 클램프 (눈 43.3%)
- 볼륨 헤어 → topMin 클램프 (최소 잘림)
- 중간 → 헤어 여백 2mm 정확히
- 분기·타이브레이크(3순위) 자체가 소멸. 해가 유일해짐.

## F2. 【범위 누락】 cropToSpecV2가 변경 범위에 없음

변경 범위 표에 cropToFrame·fitSpecGeometry만 있으나, **server.js:177에서 cropToSpecV2도 라이브**.
cropToSpecV2는 EYE_TARGET_RATIO 0.44 앵커 + 얼굴 축소 루프(scale×=0.99, faceMinMm까지) 보유 — 새 원칙(눈=결과, 축소 금지)과 정면 충돌. **포함 또는 명시적 폐기(경로 통합)를 지시서에 결정 기재** 필요.

## F3. 【작가님 결정】 C3(헤어) vs C4(눈 40~48%) 충돌 시 우선순위

헤어볼륨 > ~5mm부터 두 soft 제약이 양립 불가. topMin까지 밀었을 때 눈 위치 하한:
- KR여권: **52.2%** / 반명함: **55.0%**

선택지:
- **(a) 헤어 우선** — 눈 52~55%까지 허용. 현행 설계 서술의 암묵적 선택. F1 수정안이 그대로 이 방향.
- **(b) 눈 48% 캡** — topMin을 눈 48% 지점으로 재정의(semi-hard). 초과분 헤어 잘림 감수. "헤어 잘리면 잘리는 대로" 선언과 더 정합.

설계서에는 C4가 선언만 되고 의사코드에 미구현 상태라, 어느 쪽이든 **명시** 필요.

## F4. 【경미】 지시서 반영 사항

1. **formats.js에 mm 체계 필드 자체가 없음** — 현행은 faceRatio/topMargin/bottomMargin(비율)뿐. crownMarginMin·bottomMarginMin 추가만으로 부족, frameHmm·faceTargetMm 신설 필요 (cropToSpecV2는 호출측이 spec을 주입 중).
2. **미국 여권 제외 권장** — formats.js 미등재 + 정방형이라 하단 여백 제약이 없고 눈높이(하단 28~35mm) 제약으로 형태가 다름. 이번 범위에서 제외 명기.
3. 의사코드 `33 * mmPx` 하드코딩 → `spec.faceTargetMm`, 3mm/5mm → spec 필드 참조로.
4. C2 유도 중간식 부등호 방향 오기(설계서 64행) — 최종식은 정확. 문구만 수정.
5. **subjectTopRow 순백 가드** — 07-07 카나리 실사고(어두운 배경 → hairTop=0 오판) 재발 방지 조항을 지시서에 명시. 실사 입력은 매팅 알파 or 폴백(볼륨 0)만.

## 권고

F1 수정 + F2 결정 + F3 작가님 선택 반영 후 지시서화 진행 가능. 검증 계획(IMG_4973~4975 현행 대비)은 적절하며, 볼륨 헤어 케이스 1장 추가를 권장 — F1/F3이 발현되는 유일한 구간.

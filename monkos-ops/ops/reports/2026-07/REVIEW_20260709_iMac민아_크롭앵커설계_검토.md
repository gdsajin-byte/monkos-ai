---
type: report
date: 2026-07-09
device: iMac
agent: 민아
portfolio: PF_SPECS
status: 마감
---

# REVIEW: 크롭 앵커 동적화 + pitch 보정 + 헤어라인 감지 설계 검토

**[2026-07-09 12:35 KST]** iMac/민아 → 작가님, iMac/쌍아

대상: `DESIGN_20260709_크롭앵커동적화_pitch보정_헤어라인감지.md` (쌍아, draft)
방법: 코드 실물 대조 + 산식 수치 검산 (node 재현)

## 1. 전제 검증 — 전부 실물 일치 ✅

| 설계서 전제 | 실물 | 판정 |
|---|---|---|
| `EYE_POSITION_RATIO = 0.43` 하드코딩 | crop.js:21 | ✅ |
| nose tip(86), 턱(0) 이미 추출 | face-detect-insight.js LMK (7/9 오버레이 실측 확정본) | ✅ |
| formats.js에 topMargin·bottomMargin 이미 존재 | kr-passport 0.07/0.19, 반명함 0.08/0.22 | ✅ |
| faceRatio 74% | FACE_TARGET_MM 33/45 = 73.3% | ✅ (근사) |
| pitchRatio 산술 1줄 추가 가능 | gate 객체 산출부에 자연 접속 | ✅ |

## 2. 보정 필요 — 지시서화 전 2건 ⚠️

### (1) Step 4 산식 ↔ 예시표 불일치 + 주 규격에서 공집합

산식 그대로(`hairToEye = halfFace + hairTopOffset`, topMargin 별도 가산) kr-passport를 검산하면:

```
eyeMin = 0.07 + 0.3667 + 0.0587(헤어 8%) = 0.4953
eyeMax = 1 − 0.19 − 0.3667            = 0.4433   → eyeMin > eyeMax 공집합
중점 = 0.4693 (≈47%) ≠ 예시표 ~44.5%
mm 검산: 3 + 2.6(헤어) + 33 + 8.5 = 47.1mm > 45mm  → 최소여백 전부 충족 자체가 물리적 불가
```

예시표(~44.5%)와 맞는 해석은 **topMargin을 정수리(두피) 기준으로 보고 헤어볼륨을 topMargin 안에 흡수**하는 쪽(eyeMin 0.4367, eyeMax 0.4433, 중점 0.4400)이다. 즉 산식은 헤어볼륨을 이중 계상하고 있다.

**요청**: ① topMargin 기준점(헤어탑 vs 정수리) 정의 확정 + 산식·표 정렬 ② 공집합 발생 시 정책 명시 (권고: 정수리 여백 우선 + crop.js 기존 faceMin 스케일 축소 로직에 위임 — 이미 있는 방어라 신규 코드 불요, 접속만 명시).

### (2) detectHairVolume 좌표 방어 부재

미러 추정 crownY는 타이트 입력에서 0 근처·음수 가능 — **오늘 precheck 완화(00438)로 타이트 사진 유입이 늘어난 상태**라 발생 확률이 설계 시점보다 높아졌다. `sharp().extract()`는 음수/범위 밖 좌표에서 throw. bandLeft도 치우친 구도에서 음수 가능.

**요청**: 좌표 클램프(0 ~ 이미지 경계) + try/catch 폴백(실패 시 기본 볼륨 0.08) 명시. precheck의 픽셀 통계부(server.js)가 이미 같은 패턴(Math.max(0,…) + catch 시 게이트 미적용)을 쓰고 있어 관례 재사용이면 된다.

## 3. 관측 1건 💡

- Step 5 클램프(0.42~0.48)가 보장하는 것은 **눈 앵커 범위**뿐이다. 정수리 잘림의 실질 방어는 crop.js의 HAIR_MARGIN_MIN(0.044) 스케일 축소 로직이므로, 변경 범위 표에 "해당 로직 유지 전제"를 명시할 것을 권장 (현재 표는 EYE_POSITION_RATIO 제거만 언급).

## 4. 동의 사항

- 설계 원칙(복잡한 모델 금지·단계 독립·최종 클램프) — 검수 코드화 기조와 정합.
- Phase 1(pitchRatio 관측 로그) → 실측 → Phase 2·3 순서 — 무위험 선행 실측 구조 타당. **Phase 1은 즉시 착수 무리 없음.**
- 대머리 오판 리스크 완화 논리(흰 배경 합성 + 클램프) 성립.

## 결론

**방향 승인 권고.** Phase 1 즉시 가능. Phase 2 지시서화 전에 §2 두 건(산식 정렬+공집합 정책, 좌표 방어) 반영 필요.

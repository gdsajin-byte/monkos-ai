---
type: completion
date: 2026-07-10
device: iMac
agent: 막내1
portfolio: PF_SPECS
status: 마감
---

# COMPLETION: crop.js B5·R1 확정 2건 수정 (2026-07-10 워크플로우 적대검증 후속)

**[2026-07-10 14:48 KST]** iMac/막내1 → 작가님

## 요약

`monkos_AI/crop-engine/lib/crop.js` 적대검증 확정 2건(B5 배치 로직 중복, R1 주입 스펙 폐기) + 부수 1건(모듈 상수 비대칭)을 수정. kr-passport 파일럿 경로는 구 코드와 **출력 비트 동일**(무회귀), 주입 스펙 경로는 427개 슬러그 규격이 이제 그대로 존중된다.

## ✅ 완료

- **B5 — resolvePlacement 단일화**: cropToFrame(40~)·fitSpecGeometry(240~)에 축자 중복이던 배치 산식(~30줄)을 `resolvePlacement()` 하나로 통합. 45% 앵커 리터럴 2곳(구 86·262행) → `EYE_ANCHOR_FALLBACK = 0.45` 상수 1곳. 두 모드(실측 헤어탑 위 2mm / 프리뷰 눈 45% 폴백)는 REVIEW_20260709 부록의 작가님 결정 그대로. 경계 클램프 정책 차이는 호출부에 유지(렌더=하드 클램프+패딩, 기하=이미지 밖 돌출 허용) — 기존 동작 보존.
- **R1 — cropToSpecV2 주입 스펙 존중**: 구 shim(216~221행)은 주입 spec을 버리고 frameHmm≤42→id_kr, 그 외→passport_kr 2종으로 강제 → server.js `/api/crop-spec` 경유 타 슬러그 Gemini 폴백 렌더가 전부 오규격이었음. resolvePlacement 기반 렌더 공용 경로(`renderPlacement`)로 교체 — 주입 spec(frameW/frameH/frameHmm/faceTargetMm/faceMinMm/hairMarginMm)을 그대로 배치에 사용. 필수 필드 누락 시 명시적 예외.
- **부수 — 모듈 상수 비대칭 해소**: cropToFrame이 FACE_TARGET_MM(33)/FRAME_MM(45) 고정 대신 getSpec 규격의 faceTargetMm/frameHmm/faceMinMm을 사용. id_kr이 비로소 26mm/40mm로 정합(구버전은 id_kr도 45mm 기준 오산 — 회귀 하네스 실측 old face=33.0mm → new 26.0mm).
- **검증 1 — 구↔신 회귀 하네스 16/16 통과** (git HEAD 구버전과 동일 입력 비교):
  - passport_kr/jp × 5경로(프리뷰 폴백·헤어 실측·헤어탑 최상단·pose 전달·패딩) — meta·버퍼 완전 동일
  - **kr-passport 주입 스펙 경로(파일럿) — 버퍼 sha 동일, face 33.0mm/eye 45.1% 불변**
  - fitSpecGeometry 4경로 — JSON 전체 동일
  - us-passport형(51×51mm) — 구 413×531 오규격 → 신 602×602 존중
- **검증 2 — 기존 jest**: portal `__tests__/spec-crop.test.js` 8/8 통과 (428건 파라미터 커버리지 포함)

## 💡 참고

- 패딩 경로 meta에 `spec` 키 추가(additive) — 구버전은 패딩 시에만 spec 태그가 누락되던 비일관 해소. 소비처(portal optional chaining·server spread)는 키 추가에 무영향.
- B4(float 동등 비교) 부수 해소 — 축소 루프 성공 판정을 `fitted` 플래그로 대체 (동작 불변).
- 죽은 코드 제거: computeEyeAnchor + EYE_POSITION_RATIO/HAIR_MARGIN_MIN/BOTTOM_MIN_RATIO (repo 전체 외부 참조 0 확인 후. 구 33/45 상수는 스펙 필드로 대체되어 함께 소거).
- 관찰: faceMinMm 축소 루프는 topMin 제거(9e04c423) 이후 현행 입력 조합에서 수학적으로 발화 불가 — 동작 보존 차원에서 그대로 두었으며, B2(어깨 천장)·B3(헤어 포기 분기)와 함께 매팅 실측·밴드 확장 단계에서 재설계 대상 (REVIEW_20260709 예고대로, 이번 지시 범위 밖).

## ⏳ 대기

- crop-engine 배포 — 지시 범위 밖. 현행 라이브 rev는 구 코드이므로 승인 시 `./deploy.sh` 경유 배포 필요.

## 📁 변경 파일

- `monkos_AI/crop-engine/lib/crop.js` — 전면 재구성 (347→283줄)
- `monkos-ops/ops/sessions/2026-07/2026-07-10_iMac_막내1.md` — 세션 로그
- `monkos-ops/ops/portfolios/PF_SPECS/README.md` — 히스토리 1행
- 회귀 하네스는 스크래치패드(세션 한정) — 산출물 아님

## 🔀 커밋

- `[fix] 크롭엔진 B5·R1 — resolvePlacement 단일화 + cropToSpecV2 주입 스펙 존중` (푸시 포함)

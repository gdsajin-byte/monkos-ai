---
type: order
id: ORDER_20260707_M1쌍아_민아_크롭정밀도_IDPASS이식_비전검수
date: 2026-07-07 16:31 KST
from: M1/쌍아
to: 민아
portfolio: PF_SPECS, PF_CROP
priority: P0
status: 대기
references:
  - DESIGN_20260707_크롭정밀도_IDPASS이식_비전검수.md
  - apps/crop-app/data/specs-data-v2.json (headHeight 수치 정본)
  - monkos_AI/crop-engine/ (현행 FaceMesh + 1:1:1 산식)
---

# 지시서: 크롭 정밀도 — 파이프라인 재배열 + Gemini 비전 검수

> **[2026-07-07 16:31 KST] M1/쌍아 → 민아**
> 귀속: PF_SPECS (주), PF_CROP (부)
> 설계서: [DESIGN_20260707_크롭정밀도_IDPASS이식_비전검수.md](../../tech/designs/2026-07/DESIGN_20260707_크롭정밀도_IDPASS이식_비전검수.md)

---

## 배경

FaceMesh가 업로드 이미지에서 사일런트 미스(감지 "성공"하나 엉뚱한 좌표)를 내는 것이 크롭 실패의 근본 원인. IDPASS 앱에서는 카메라 가이드로 입력을 강제해서 해결했는데, 웹 업로드에서는 Gemini 비전이 그 역할을 대행한다. 기존 자산(FaceMesh·crop-engine·BiRefNet·Gemini·precheck)의 **순서 재배열**이 핵심 — 새 엔진 도입 없음.

---

## 전체 타임라인 (설계서 §3 준거)

```
[0초] 업로드 → Gemini 프리체크 + RunPod 줄서기 동시 발사
[2~3초] 프리체크 결과 → 부적합 차단 or "진행?" 확인
[진행] FaceMesh(안정 입력) → 1:1:1 프레임 피팅 → Gemini 비전 검수
[+2초] 클라이언트 가이드 오버레이 (정수리·눈·턱·헤어끝)
[만들기] BiRefNet 매팅(0.4초) + 규격 DB 통합 → 결과물 + 사후 검수 체크리스트
```

---

## Task 1: Gemini 프리체크 (precheck 재정의)

현행 precheck(규정 검수)를 **"측정 가능성 검증"**으로 교체.

- 업로드 직후 Gemini 2.0 Flash 호출 — 설계서 §6-1 프롬프트 사용
- 체크: 얼굴 1명 / 크기 적정(face_ratio 30~60%) / 정면 / 가림 없음
- 부적합 시: rejection_reason별 안내 메시지 표시, 재업로드 유도
- 적합 시: face_box 기준 러프 크롭 → FaceMesh에 안정 입력 전달
- **RunPod 의자 줄서기를 프리체크와 동시 발사** (기존 warmup 로직 활용)

## Task 2: 규격 DB 수치 통합

- `specs-data-v2.json`의 `headHeight.min_mm / max_mm`를 포털 `specs-data.json`에 병합
- 필드: `headHeightMin`, `headHeightMax` (mm, 숫자)
- null인 규격(5건): 프레임 높이의 70%를 기본값으로 (IDPASS 준거)
- crop-engine이 이 수치를 직접 참조하도록 연동

## Task 3: 비전 검수 + 가이드 오버레이

- "진행" 후 FaceMesh → 1:1:1 피팅 → Gemini 비전 검수 (§6-2 프롬프트)
- 비전이 역제공하는 좌표: 정수리·눈·동공·헤어끝 (px)
- `adjustment_y_px`로 프레임 산술 보정 (비전은 판단만, 코드가 실행)
- **클라이언트 가이드 오버레이**: 정수리 라인·눈 높이·턱·헤어끝·규격 프레임을 이미지 위에 표시
- 사용자가 "이렇게 맞춰집니다"를 확인한 뒤 "만들기"

## Task 4: 사후 검수 체크리스트

- 결과물 화면에 검수 항목별 ✅/⚠️ 표시:
  - 머리높이 (min~max 범위 내)
  - 눈 위치 (규격 중앙 ± 허용)
  - 정수리 여백
  - 배경색
  - 해상도/DPI
- 전 항목 통과 → 다운로드 활성
- 미통과 항목 → 사유 안내 + "다른 사진으로" 유도

## Task 5: kr-passport 파일럿 검증

- 전 과정을 kr-passport 카나리에서 실검증
- 기존 카나리 테스트 이미지(dawn-original, 새벽 us-visa 원본) + 전신샷·단체사진 등 엣지 케이스
- FaceMesh 사일런트 미스 재현 테스트 (얼굴 작은 이미지)

---

## ⚠️ 준수 조항

- 규정 검수 항목은 현행 8항목 유지, 위치만 사후로 이동 (항목 삭제 금지)
- Gemini 프리체크는 무료 티어에도 적용 (측정 가능성 = 서비스 기본)
- Gemini 비전 검수(§6-2)는 우선 전 티어 적용, 비용 부담 시 유료 한정 전환 가능
- 배포: deploy.sh 경유, kr-passport 카나리 한정
- BiRefNet ONNX·RunPod 체인: 현행 유지 (변경 없음)

---

## 산출물

- 프리체크 Gemini 연동 + 프롬프트
- specs-data.json headHeight 수치 병합
- 비전 검수 + 가이드 오버레이 UI
- 사후 검수 체크리스트 UI
- kr-passport 실검증 보고
- COMPLETION 보고서

---

## 완료 보고

- 수발신 헤더 필수
- `✅❌💡⏳📁🔀` 형식
- PF_SPECS·PF_CROP 히스토리 어펜드
- 세션 로그 어펜드
- 커밋 → 푸시

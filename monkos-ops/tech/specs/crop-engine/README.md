---
type: spec
date: 2026-07-06
device: iMac
agent: 민아
status: 운영
---

# crop-engine — 규격 안착 크롭 엔진

> 서비스 편입: 2026-07-06 (ch4 6조 유형 3, 작가님 "스펙스 생성 품질 마감" 지시 수행 — 쌍아 사후 추인 대기)
> 설계 원천: [DESIGN_20260705_SPECS_V2_규격크롭파이프라인.md](../../designs/2026-07/DESIGN_20260705_SPECS_V2_규격크롭파이프라인.md) 옵션 B (Phase 0 실측으로 확정)

## 개요

스펙스 V2 생성 파이프라인의 규격 안착 단계. AI 배경제거 출력(순백 3:4)을 국가·문서별 공식 규격(mm)에 맞춰 크롭한다.

```
[생성] gemini-2.5-flash-image ZERO_TOUCH (배경제거, 순백 3:4)
  ↓
[안착] crop-engine /api/crop-spec        ← 본 서비스
  - FaceMesh(tfjs): 눈·턱 랜드마크
  - 순백 스캔: 머리끝 픽셀 실측 (v1 해부학 추정 폐기 — 07-06 Phase 0에서 상단 여백 0mm 밀착 실증)
  - 배치: 실측 머리끝~턱을 headHeight 타겟으로 스케일 → 상단 여백 안착 → 눈 수평 중앙
  ↓
[결과] 규격 px(300dpi) PNG
```

## 배포

| 항목 | 값 |
|------|-----|
| 서비스 | Cloud Run `monkos-crop-engine` |
| 리전 | asia-northeast3 (서울) |
| 배포 | `monkos_AI/crop-engine/deploy.sh` (ch5 2조 준수) |
| 런타임 | **Node 22 필수** — mediapipe가 전역 navigator 참조 (Node 21+ 내장, 20에서 기동 크래시. 07-06 실사고) |
| 리소스 | 1Gi / 1CPU / min 0 / max 3 |
| 인증 | 미인증 허용 (호출자: portal. 강화 시 IAM invoker 전환 — 후속 검토) |

## API

### POST /api/crop-spec — 규격 주입형 안착 (스펙스 파이프라인 정본)
```json
{ "image": "<base64>", "spec": { "frameW": 413, "frameH": 531, "frameHmm": 45, "faceTargetMm": 34, "topMarginMm": 3.5 } }
```
- 응답: `{ success, cropped(base64 PNG 300dpi), fallback, meta{faceMM, topMarginMM, eyePositionPercent, scale} }`
- 얼굴 감지 실패: 프레임 비율 상단 커버 크롭 폴백 (`fallback: true`)
- 규격 파라미터 산출은 호출측(portal `lib/spec-crop.js`)이 specs-data.json에서 수행 — 428국 중 426국 산출

### POST /api/crop — v1 (하드코딩 3규격, 레거시)
### GET /health — 모델 로드 상태

## 호출자

- **portal** `/api/idphoto/generate` (slug 보유 요청) — `lib/spec-crop.js` 경유. 엔진 장애·타임아웃(45s) 시 portal 로컬 sharp 커버 크롭 폴백. 생성과 병렬로 `/health` 예열(콜드스타트 흡수).

## 검증 이력

- 2026-07-06 Phase 0 (kr-passport 5샘플): 옵션 A(프롬프트 규격 지시) 탈락 — 얼굴 비중 48~50%로 무반응. v2 안착: face 34.0mm·top 3.5mm·5장 일관.
- 정사각(미국 51×51mm) 패딩 중앙정렬 검증 — 클램프 선행으로 인한 좌측 치우침 버그 수정 (07-06).
- 라이브 실증: rev 00002-zwj, 실샘플 face 34.0mm/top 3.2mm.

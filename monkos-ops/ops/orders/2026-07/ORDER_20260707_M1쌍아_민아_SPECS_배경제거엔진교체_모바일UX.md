---
type: order
id: ORDER_20260707_M1쌍아_민아_SPECS_배경제거엔진교체_모바일UX
date: 2026-07-07 09:43 KST
from: M1/쌍아
to: 민아
portfolio: PF_SPECS, PF_CROP
priority: P0
status: 대기
references:
  - DESIGN_20260707_배경제거_온디바이스_재설계.md
  - DESIGN_20260705_SPECS_V2_규격크롭파이프라인.md
  - 2026-07-06_iMac_민아.md (승계 세션)
  - 2026-07-07_iMac_민아.md (기안 세션)
---

# 지시서: SPECS 배경제거 엔진 교체 + 포털/SPECS 모바일 가독성 개선

> **[2026-07-07 09:43 KST] M1/쌍아 → 민아**
> 귀속: PF_SPECS (주), PF_CROP (부)

---

## 배경

7/6~7/7 실사고(us-visa 크롭 미실행, FaceMesh 간헐 감지 실패)와 작가님 새벽 실측이 현행 파이프라인의 구조적 한계를 실증했다. 근본 원인은 **Gemini 2.5 재생성물 위에서 감지·크롭하는 순서**. IDPASS(iOS 앱)는 같은 크롭 수학으로 실패 없이 작동 — 차이는 성능이 아니라 순서(원본 감지→크롭→마스크 합성).

**작가님 확정 사항**:
1. 배경제거 모델: **BiRefNet-portrait (MIT)** 채택 확정 (M1 실측 완료, Apple Vision 대등 판정)
2. 방향: Gemini 2.5의 배경제거 로직을 제거하고 **직접 코드로 구현**
3. 모바일 가독성: iMac 대화면 기준 디자인을 **모바일 우선으로 개선** (클로드 디자인·민아 협업)

**선행 완료 자산**:
- BiRefNet-portrait ONNX (928MB) — M1·iMac·4060 전 디바이스 검증 완료
- birefnet_server.py (Flask, 4060 GPU 0.83s/장) — `apps/crop-app/benchmark/`
- crop-engine v2 (FaceMesh 실측 앵커, 426국 규격 파서) — Cloud Run 가동 중
- 민아 기안서: DESIGN_20260707_배경제거_온디바이스_재설계.md (연산 3층, Phase 0~4)

---

## 트랙 A: 배경제거 엔진 교체 (Gemini → BiRefNet)

### 목표

현행 specs 생성 파이프라인에서 Gemini 2.5의 배경 재생성을 **BiRefNet 마스크 합성으로 교체**. 파이프라인 순서를 IDPASS 방식으로 전환:

```
[현행] 원본 → Gemini 재생성(배경+인물 통째) → FaceMesh 감지 → 크롭
[목표] 원본 → FaceMesh 감지(원본에서) → 크롭 → BiRefNet 매팅 → 배경색 합성
```

### Task A-1: BiRefNet matte API 서빙

- 기성 자산 `birefnet_server.py` 기반으로 `/api/matte` 엔드포인트 규격화
- 입력: 이미지 + bgColor (기본 #FFFFFF, 유색 배경 16국 개방 대비)
- 출력: 배경 합성 완료 PNG
- **서빙 위치**: 4060 우선 (Tailscale/CF Tunnel). 장애 시 Gemini L3 폴백
- 4060 기동 점검: tailscale 온라인 → nvidia-smi → HF 캐시 확인 → 서버 기동

### Task A-2: 포털 파이프라인 교체

- `lib/spec-crop.js` (현행 Gemini 생성 → crop-engine 안착) 흐름을:
  → **원본에서 crop-engine 감지·크롭 → matte API 호출 → 배경 합성** 으로 교체
- Gemini 생성 코드는 삭제하지 말고 **L3 폴백으로 강등** (matte API 장애 시 현행 경로 유지)
- **무음 폴백 금지**: 감지 실패 시 결제 전 차단 (재촬영 안내). 결제 후 실패는 재시도→경보→환불
- 유색 배경 16국: bgColor 파라미터 연동으로 자동 개방 (specs-data.json bg 필드 활용)

### Task A-3: 검증

- kr-passport, us-visa, jp-passport (세로), us-passport (정사각), fr-id (유색 배경) 5종 이상 실측
- 7/7 새벽 실패 재현 이미지로 회귀 테스트
- jest 기존 88/88 유지 + matte 경로 테스트 추가

---

## 트랙 B: 포털/SPECS 모바일 가독성 개선

### 배경

작가님 새벽 실측: "아이폰으로 너무 가독성이 떨어진다" — iMac 대화면에서는 볼만하나 모바일에서 판독 불가. 7/7 민아 응급 처치(14px+ 상향, 20여 셀렉터)는 임시.

### Task B-1: 모바일 UX 총체 점검

- 클로드 디자인(Figma)과 협업하여 모바일 우선 시안 제작
- 대상 페이지: SPECS 국가별 페이지 · 포털 메인 · 헤드샷 · 결제 위저드
- 점검 항목:
  - 타이포그래피: 본문 최소 14px, 제목 계층, line-height
  - 대비: 회색 텍스트 → WCAG AA 이상
  - 터치 타겟: 버튼·링크 최소 44px
  - 카드·보드·가이드 이미지: 모바일 1열 레이아웃
  - CTA 버튼: 모바일에서 thumb zone 배치

### Task B-2: 구현

- 클로드 디자인 시안 확정 후 CSS/HTML 수정
- 반응형 브레이크포인트 정비 (모바일 ≤480px / 태블릿 ≤768px / 데스크탑)
- 실기기 검증: iPhone Safari에서 스크린샷 확인 (CDP 또는 수동)

---

## 우선순위

1. **트랙 A (A-1→A-2→A-3)** — 엔진 교체가 서비스 품질 근본. 4060 기동 후 착수
2. **트랙 B (B-1→B-2)** — A 완료 후 또는 4060 대기 시간에 병행 가능

---

## ⚠️ 준수 조항

- 배포: `deploy.sh` 경유 필수 (ch5 2조)
- Gemini 생성 코드: 삭제 금지, L3 폴백으로 유지 (서비스 안정성)
- 시크릿: matte API URL 등 신규 환경변수 필요 시 `secret` 커맨드 경유 (ch4 10조)
- BiRefNet ONNX 파일(928MB): git에 커밋 금지. GDrive 또는 4060 로컬 보관
- 프로덕션 배포 후 실기기(iPhone) 육안 확인 필수 (6/23 교훈)

---

## 산출물

- matte API 가동 (4060 또는 Cloud Run)
- portal 파이프라인 교체 + prod 배포
- 모바일 UX 개선 + prod 배포
- COMPLETION 보고서
- PF_SPECS, PF_CROP 히스토리 어펜드

---

## 완료 보고

- 수발신 헤더 필수
- `✅❌💡⏳📁🔀` 형식
- PF_SPECS·PF_CROP 히스토리 1행 어펜드
- 세션 로그 어펜드
- 커밋 → 푸시

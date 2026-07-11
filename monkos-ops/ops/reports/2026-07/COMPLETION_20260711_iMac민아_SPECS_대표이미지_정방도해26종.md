---
type: completion
date: 2026-07-11
device: iMac
agent: 민아
status: 마감
portfolio: PF_SPECS
---

# COMPLETION — specs 대표이미지 26종 전면 재제작 (1:1 정방 도해)

**[2026-07-11 15:04 KST]** iMac/민아 → 작가님

> 경로③ 작가님 직접 지시: prof.jpg(나노PRO 산출, GDrive 대표이미지) 기준 인물로 1:1 정방 박스 도해(구글 썸네일 포석) 재제작, 세련 팔레트, 정수리·턱선 실좌표 밀착, 얼굴 여유(kr 32mm — 레퍼런스 헤어 잘림 금지).

## 제작 파이프라인

1. **마스터**: GDrive `MONKOS_ASSETS/대표이미지/prof.jpg`(896×1200) → BiRefNet 매팅 1회(RunPod, 0.57s)로 순백 배경 마스터. 이후 26종은 로컬 크롭 — 매팅 원가 1회분.
2. **정본 좌표**: crop-engine `/api/fit-spec` 106점 실측 — hairTop 98.2 / chin 461.0 / eyeCx 449.4. (나이브 픽셀 스캔은 매팅 소프트 헤일로 오검출 → 폐기)
3. **크롭 수학**: 머리 타깃 = 범위 좁음(≤4mm)→하한(kr=32mm 작가님 지시) / 넓음→하한+35% / 무규정→프레임 70%. 정수리 여백 = (H−머리)×0.42 clamp 2~8mm (사이트 도면과 동일 공식).
4. **도해 합성**: 1200×1200 정방 캔버스(#F6F6FA) + 사진 카드(흰/라운드/보더) + 치수선 3종(보라 W/H·레드 머리높이) + 정수리·턱 점선(실좌표, 사진 위 레이어) + 라벨칩. 원해상도 확대 검수로 밀착 확인.
5. **산출**: 사이즈 패턴 25종 + kr-passport + korea-passport 별칭 = **27파일** (33~42KB WebP), `public/images/guides/` 교체.

## 히어로 전환

- `.v2-diagram-img`(1:1, min(430px,100%)) 단일 이미지 모드 — 오전의 CSS 치수 오버레이 세대(`.v2-dim-*`, `.v2-head-line`, headBand 산출)는 도해 내장으로 대체·제거
- og:image 자동 승계 (슬러그→사이즈 폴백 동일 경로) — 구글/SNS 썸네일이 정방 도해로 통일

## 검증·배포

- jest 101 통과 · 로컬 렌더(desktop) 히어로 균형 확인 · 원해상도 라인 밀착 검수(crown/chin) · 이형 규격(51x51 정사각·22x32 소형) 육안 통과
- prod 스모크: kr-passport.webp 42.6KB 신본 서빙 + `v2-diagram-img` 마크업 라이브
- 배포: dev 00087 → **prod 00450-qtc**

## 소견

1. 라벨은 수치+cm 표기라 3언어 공통 사용 가능 (번역 불요)
2. `sample-before/after-kr`, `guide-selfie/profile`(업로드 가이드)는 본 트랙 스코프 밖 — 동일 마스터 기반 업그레이드 여지
3. 생성기 스크립트는 세션 스크래치 산출 — 재생성 필요 시 마스터+좌표+공식이 본 보고서에 기록되어 재현 가능. 상시 도구화(scripts/ 편입)는 쌍아 판단

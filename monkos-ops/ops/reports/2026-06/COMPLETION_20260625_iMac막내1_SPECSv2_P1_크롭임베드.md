---
type: completion
date: 2026-06-25
device: iMac
agent: 막내1
portfolio: PF_PORTAL
status: 완료
---

# COMPLETION — Specs v2 P1 크롭앱 인라인 임베드

**[2026-06-25 16:16 KST]** iMac/막내1 → 작가님

## 지시서
- `ORDER_20260625_iMac쌍아_막내_SPECSv2_P1_크롭임베드.md`
- 설계서: `DESIGN_20260625_SPECSv2_크롭기반동선.md`

## 작업 결과

| # | 항목 | 상태 |
|---|------|------|
| 1 | crop.js 핵심 로직 V2 인라인 삽입 (FaceMesh, 크롭프레임, 드래그, ICAO 판정) | ✅ |
| 2 | V2_SPEC 서버 데이터 주입 (wMm/hMm/pxW/pxH/faceMin/faceMax) | ✅ |
| 3 | Phase 구조 교체 (업로드→크롭→검수→결제→생성→결과) | ✅ |
| 4 | 동선 연결 (크롭 다운로드 무료 + AI 검수 → 기존 결제 플로우) | ✅ |
| 5 | CSS V2 디자인 변수 맞춤 (v2-crop-* 접두어) | ✅ |
| 6 | MediaPipe FaceMesh CDN 추가 | ✅ |

## 변경 파일
- `monkos_AI/portal/lib/cms/render-specs.js` (+658 -58줄)
  - CSS: 93줄 추가 (크롭 프레임, 메트릭, 범위바, 경고, 반응형)
  - HTML: Phase 2 크롭 UI 46줄 추가
  - JS: pageScript 전면 재작성 (~500줄, 크롭 로직 + 기존 Phase 통합)
  - 서버: V2_SPEC 데이터 추출 로직 12줄 추가

## 동선 변경
```
[기존] 업로드 → AI 검수 → 결제 → 생성 → 결과
[변경] 업로드 → 크롭 조정(FaceMesh) → [무료 다운로드 / AI 검수] → 결제 → 생성 → 결과
```

## 기존 보존
- `/crop` 페이지 (crop.js/crop.css) 미수정
- V1 specs 페이지 미영향
- V2 결제/생성/결과 Phase 기존 플로우 유지

## 배포
- 커밋: `94cfa044` `[feat] specs v2 P1 — 크롭앱 인라인 임베드`
- revision: `monkos-portal-00366-rj5` (prod, 100% 트래픽)
- deploy.sh prod 경유

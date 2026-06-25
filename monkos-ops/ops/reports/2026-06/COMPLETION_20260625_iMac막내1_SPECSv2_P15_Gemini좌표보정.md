---
type: completion
date: 2026-06-25
device: iMac
agent: 막내1
portfolio: PF_PORTAL
status: 완료
---

# COMPLETION — Specs v2 P1.5 Gemini 좌표 보정

**[2026-06-25 17:03 KST]** iMac/막내1 → 작가님

## 지시서
- `ORDER_20260625_iMac쌍아_막내_SPECSv2_P15_Gemini좌표보정.md`

## 작업 결과

| # | 항목 | 상태 |
|---|------|------|
| 1 | 백엔드 `/api/idphoto/align` 엔드포인트 신설 (Gemini Flash) | ✅ |
| 2 | 클라이언트 조건부 보정 호출 (isBlocked → align API) | ✅ |
| 3 | FaceMesh → normalized 좌표 변환 + API 전달 | ✅ |
| 4 | 보정 좌표 → 모퉁이 4점 재계산 → autoPlace 재실행 | ✅ |
| 5 | confidence < 0.5이면 보정 무시 (FaceMesh 유지) | ✅ |
| 6 | UX: "AI 보정 중..." 스피너 표시 | ✅ |

## 변경 파일
- `monkos_AI/portal/server.js` — `/api/idphoto/align` 엔드포인트 (+51줄)
- `monkos_AI/portal/lib/cms/render-specs.js` — `tryGeminiAlign` 함수 + enterCropPhase 리팩터 (+71/-12줄)

## 동선
```
FaceMesh 감지 → autoPlace → ICAO 범위 확인
  ├─ 범위 내: 그대로 (레이턴시 절약)
  └─ 범위 밖: /api/idphoto/align → Gemini 보정 → autoPlace 재실행
```

## 배포
- 커밋: `06f93195` `[feat] specs v2 P1.5 — Gemini 좌표 보정 API + 조건부 호출`
- revision: `monkos-portal-00368-r4j` (prod, 100% 트래픽)
- deploy.sh prod 경유

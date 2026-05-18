---
type: ORDER
date: 2026-03-14
time: "17:00 KST"
from: iMac/쌍아
to: 막내3
subject: docs/ 정리 리서치 — archives + rnd + 루트 파일
priority: 일반
endline: 보고 후 대기
---

# 지시: docs/ 정리 리서치 — archives·rnd·메타문서

## 배경

docs/ 폴더에 555건의 파일이 혼재. archives/는 코드 백업, rnd_2026/은 R&D 문서, 루트에는 메타문서가 있다.

## 담당 영역

- `docs/archives/` (backend-v1, scripts-legacy)
- `docs/rnd_2026/` (PDF변환 디딤돌 R&D)
- `docs/README.md`, `docs/DOCUMENT_ATLAS.md` (루트 메타문서)

## 작업

1. 각 폴더·파일의 내용을 확인하고 아래 기준으로 분류:

| 분류 | 기준 | 이관처 |
|------|------|--------|
| **활성** | 현재 참조 중 | 현행 체계로 이관 (구체 경로 제안) |
| **코드 백업** | 과거 서비스 코드 | `apps/`로 이관 or 현위치 유지 |
| **R&D** | 지원사업 관련 | `works/rnd/`로 이관 검토 |
| **사문화** | 가치 낮음 | 삭제 제안 |

2. 특히 확인할 것:
   - `docs/archives/backend-v1/` — 과거 서비스 코드인데 apps/에 이미 유사 버전 있는지
   - `docs/rnd_2026/` — works/rnd/로 이관할 만한 활성 문서인지
   - `docs/DOCUMENT_ATLAS.md` — 현행 폴더 구조와 맞는지, 갱신 필요 여부

## 산출물

보고서: `monkos-ops/ops/reports/REPORT_20260314_막내3_docs정리_archives_rnd.md`

## ⚠️ 준수 조항
- 헌법 제1조: 타임스탬프 필수
- 법률 ch7 3조: 리서치만 수행, 실제 이동/삭제 금지

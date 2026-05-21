---
type: completion
date: 2026-05-15
device: iMac
agent: 막내1
status: 완료
---

# COMPLETION: countries.jsonl A+B 등급 데이터 반영

> **[2026-05-15 14:40 KST] iMac/막내1**

## ✅ 완료 항목

### 1. 기존 커스텀 국가 수정 (2건)
- **in (인도) 여권**: size 51x51→35x45, px 600x600→413x531, head 36-41→제거, std→ICAO 9303 (2025.9~)
- **cn (중국) 비자**: head 15-22→28-33 (얼굴 너비→높이 정정)

### 2. 비표준 국가 docs 추가 (63건)
| 대륙 | 국가 수 | 대상 |
|------|--------|------|
| 아시아 | 12 | hk, vn, id, my, kh, la, bn, bd, kg, tm, mh, pw |
| 유럽 | 11 | gr, tr, fi, ee, lt, rs, mk, al, by, cy, az |
| 아메리카+중동 | 26 | bz, co, dm, jm, br, ar, cl, ve, ec, bo, cr, ni, hn, cu, do, ht, tt, bb, lc, kw, bh, ye, sa, qa, om, ir |
| 아프리카 | 14 | eg, ly, sd, cm, td, sl, tz, et, ug, rw, dj, bw, na, mg |

### 3. 신규 국가 (ck, nu, st)
- 3국 모두 이전 작업에서 이미 추가 완료 상태 → 중복 추가 없음

## ❌ 미반영 (C/X 등급 — 지시서 준수)
- af, fm, mm visa, sg AI, in AI, nz head 29-34, nz 회색필수

## 검증 결과
- JSON 유효성: ✅ 전 행 파싱 성공
- 중복 ID: ✅ 없음 (202국 전체 고유)
- 총 국가: 202 (docs 보유 72국 / ICAO 기본 130국)
- swift build: ✅ Build complete (1.61s)

## 📁 산출물
- `apps/MonkosCrop/MonkosCrop/Resources/countries.jsonl`
- `monkos-ops/ops/reports/2026-05/COMPLETION_20260515_막내1_JSONL반영.md`

## 🔀 커밋 대기

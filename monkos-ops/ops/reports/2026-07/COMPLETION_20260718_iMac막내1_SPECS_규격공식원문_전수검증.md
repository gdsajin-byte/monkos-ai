---
type: completion
date: 2026-07-18
device: iMac
agent: 막내1
portfolio: PF_SPECS
status: 완료
---

# COMPLETION: SPECS 규격 공식 원문 전수 검증

**[2026-07-18 12:50 KST]** iMac/막내1 → 작가님

## 지시서

`monkos-ops/ops/orders/2026-07/ORDER_20260718_iMac쌍아_막내_SPECS_규격공식원문_전수검증.md`

## 결과

✅ Phase 1: 결함 후보 9계열 전건 공식 원문 검증 완료
✅ Phase 2: Tier 1 (16개국) + Tier 2 (15개국) UK형 특이 규정 전수 탐색 완료
✅ Phase 3: 종합 보고서 + 원자료 JSON 작성 완료
✅ COMPLETION 보고서 파일 생성

## 핵심 발견

- 🔴 **확정 결함 4건**: id-passport(head -7~13mm), in-passport(head -4mm, ICAO 전환 미반영), cn-resume(구조적 결함), br-passport(head +6~11mm)
- 🟠 **부분 결함 7건**: lt(kr상수 오염), co/cl(합성), cu(사이즈 분쟁), ye(head -2mm), nz/de(배경색 오류)
- ⭐ **UK형 crown 정의**: UK·CA = "머리카락 아닌 두개골 꼭대기" / US·AU = "머리카락 포함" — DB에 미반영

## 산출물

📁 `monkos-ops/ops/reports/2026-07/REPORT_20260718_막내_SPECS_규격공식원문_전수검증.md`
📁 `monkos-ops/ops/portfolios/PF_SPECS/drafts/official_source_audit_20260718.json`
📁 `monkos-ops/ops/reports/2026-07/COMPLETION_20260718_iMac막내1_SPECS_규격공식원문_전수검증.md`

## 변경 파일

- 신규: 보고서 1건 + JSON 1건 + COMPLETION 1건
- 수정: 세션 로그 + PF_SPECS 히스토리 (아래 어펜드)
- 코드/데이터 수정: **없음** (리서치 전용 지시서)

💡 교정 우선순위: P0 3건(id/in/cn) → P1 4건(br/nz/de/ye) → P2/P3 7건
⏳ 다음 단계: 쌍아 배치 엔진 복원 설계서 + 민아 검증 하네스의 입력물로 사용

---
type: order
id: ORDER_20260425_specs데이터보정
date: 2026-04-25
from: iMac/쌍아
to: iMac/막내1
subject: specs-data.json 보정 — indonesia-passport + uk-passport
priority: high
status: 대기
affects: monkos_AI/portal/lib/cms/specs-data.json
related: REPORT_20260425_막내3_오류판정정밀재검증.md
---

# 지시서 — specs-data.json 보정 (2건)

## 0. 배경

막내3 정밀 재검증으로 4건 중 2건이 오탐 확정. 실질 보정 대상은 2건뿐.
정부 공식 출처 + 여권/비자/KTP 구분 검증 완료된 항목만 수정한다.

## 1. 수정 대상

### 1-1. indonesia-passport — 사이즈 보정

**현재**:
```json
{
  "size": "35 × 45 mm",
  "pixels": "413 × 531px",
  "background": "흰색"
}
```

**수정**:
```json
{
  "size": "40 × 60 mm",
  "pixels": "472 × 708px",
  "background": "흰색"
}
```

**근거**: 막내3 재검증 — 인도네시아 여권은 40×60mm 흰색. 51×51 적색은 KTP(주민증) 별건.

### 1-2. uk-passport — headHeight + background 보정

**현재**: 막내3 리포트 §1-3 참조 (headHeight·background 부정확)

**수정 방침**:
- 막내3 재검증 리포트의 "uk-passport 권장값"을 그대로 적용
- 인화 제출 기준(35×45mm/300DPI=413×531px)은 유지
- 디지털 600×750은 별도 필드 또는 details에 부기

**확인 필요**: 막내3 재검증 리포트의 정확한 권장값을 막내1이 직접 확인 후 적용.

## 2. 작업 순서

1. 막내3 재검증 리포트(`REPORT_20260425_막내3_오류판정정밀재검증.md`) 읽기
2. specs-data.json 백업: `cp specs-data.json specs-data.json.bak`
3. indonesia-passport 사이즈 3필드 수정
4. uk-passport 권장값에 따라 수정
5. JSON 문법 검증: `python3 -m json.tool specs-data.json > /dev/null && echo OK`
6. 로컬 서버에서 `/specs/indonesia-passport`, `/specs/uk-passport` 렌더 확인
7. 배포: `./monkos_AI/portal/deploy.sh`
8. 프로덕션 실측: 두 페이지 200 + 새 사이즈 표시 확인

## 3. 절대 금지

- 다른 슬러그(india-passport, korea-passport 등) 수정 금지
- 막내3 1차 리포트 기준이 아닌 **재검증 리포트 기준**만 적용
- 출처 불명확한 필드 수정 금지

⚠️ 준수 조항:
- 배포는 반드시 deploy.sh 경유 (법률 5장 2조)

---

**완료 보고**: 백업 → 수정 → 검증 → 배포 → 실측 → 보고

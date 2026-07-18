---
type: completion
date: 2026-07-18
device: iMac
agent: 막내2
portfolio: PF_SPECS
status: 완료
---

# 완료 보고: V2 퍼널 게이트 개방 + gray T1 비노출

**[2026-07-18 17:39 KST]** iMac/막내2 → 작가님

## 작업 결과

### ✅ 1. V2 퍼널 게이트 개방
- `isEngineCompatibleSpec`: 흰색만 허용 → 파랑·빨강만 제외, 나머지 허용
- 회색 16슬러그 V2 복구 + light-gray 17슬러그 V2 신규 개방

### ✅ 2. gray 국가 T1 업셀 비노출
- specData.background 회색 계열 → `t1RetouchOn = false`
- 클라이언트 CFG `t1: false` → 업셀 카드 미렌더

### ✅ 3. SEO 문구 정정
- 16슬러그 seoDescription/details에서 "흰색 배경" → "회색 배경" 일괄 교정 (48건)

## 라이브 확인

| 항목 | 결과 |
|------|------|
| kz-passport V2 퍼널 | ✅ specs-funnel 2회 참조 |
| uk-passport V2 퍼널 | ✅ 신규 개방 |
| kz-passport T1 | ✅ `t1: false` |
| kw-passport V1 유지 | ✅ specs-funnel 0회 |

## 배포

portal rev **00506-6nc** · jest 105/105

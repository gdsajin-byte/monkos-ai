---
type: completion
date: 2026-06-14
device: iMac
agent: 막내2
portfolio: PF_SPECS
status: 완료
---

# 구조화 데이터 + UI 언어 분기 P0 3건 수정 완료

> **[2026-06-14 16:10 KST]** iMac/막내2 → 작가님

## ✅ 완료

- HowTo JSON-LD step[0].text: `specData.background` → `locField(specData, 'background', lang)` 전환. 동일하게 size도 `locField()` 경유
- JA countryName 분기: 상세 페이지 + 허브 양쪽에서 `specData.countryJa || specData.country` 참조로 수정
- Article JSON-LD `inLanguage`: `lang` 값 추가
- portal prod 배포 (rev 00288-4kw, deploy.sh 경유)
- prod 실측 검증 3건:
  - `/en/specs/passport/korea`: HowTo `"Uniform white"` ✅, inLanguage `"en"` ✅
  - `/ja/specs/passport/korea`: HowTo `"均一な白"` ✅, inLanguage `"ja"` ✅, headline `"韓国パスポート写真..."` ✅
  - `/en/specs/passport/vietnam`: HowTo `"White"` ✅ (이전 `"흰색"` → 수정됨)

## 💡 참고

- JA korea-passport body에 "한국" 1건 잔류: `countryJa` 데이터 누락(26건 중 1건). P1 데이터 보강 대상이며 코드 결함 아님
- P1 번역 커버리지(validity 4%, fileSpec 5% 등)는 지시서 범위 밖 — 별건 대기

## 📁 산출물

- `monkos_AI/portal/lib/cms/render-specs.js` 수정 (3건)
- portal prod 배포 1건
- 본 COMPLETION 보고서

---
type: completion
date: 2026-05-23
device: 4060
agent: 쌍아
portfolio: PF_CROP
status: 완료
---

# COMPLETION — IDPASS Android iOS 동기화

> **[2026-05-23 19:01 KST]** 4060/쌍아 → 작가님

## 지시서

`ORDER_20260523_iMac쌍아_4060쌍아_IDPASS_안드로이드_iOS동기화.md`

## 수행 결과

| # | 항목 | 결과 |
|---|------|------|
| 1 | 🔴 rescaleAll 기준점 버그 (P0) | ✅ `frameW/2f, frameH/2f` → `frameW/2f + imgOffsetX, frameH/2f + imgOffsetY`. 웹 crop.js:615 대조 완료 |
| 2 | 수치 표기 삭제 | ✅ ko "글로벌 규격", en "Global specs", ja "グローバル規格" — hero_sub + hero_subtitle 6건 |
| 3 | 앱 표시 이름 | ✅ 이미 `android:label="IDPASS"` |
| 4 | countries.jsonl 동기화 | ✅ iOS 정본 복사, diff 0 확인. 베트남 비자 faceTarget:40 반영 |
| 5 | 디버그 로그 | ✅ Log.d/println 검색 결과 0건 |
| 6 | 미구현 항목 | ⏳ Landing 애니, Thanks 슬라이더 — 별도 세션 |
| 7 | Google Play 등록 준비 | ⏳ 서명키 생성, 리스팅 — 별도 세션 |

## 산출물

- `apps/idpass-android/app/src/main/java/ai/monkos/idpass/ui/step4/Step4Screen.kt` — rescaleAll 수정
- `apps/idpass-android/app/src/main/java/ai/monkos/idpass/data/I18n.kt` — 수치 표기 삭제
- `apps/idpass-android/app/src/main/assets/countries.jsonl` — iOS 정본 동기화
- PF_CROP 히스토리 1행 append

## 커밋

- `b98100e3` — `[fix] IDPASS Android iOS 동기화 — rescaleAll 버그 + 수치 삭제 + jsonl 정본`

✅❌💡⏳📁🔀

✅ 지시서 1~5번 전부 완료
⏳ 6번(미구현) 7번(Play Store) 별도 세션
📁 커밋 완료, 푸시 완료

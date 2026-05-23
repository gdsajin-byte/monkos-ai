---
type: order
date: 2026-05-23
from: iMac/쌍아
to: 4060/쌍아
subject: IDPASS Android — iOS 5/23 수정사항 동기화 + 디테일 보정
portfolio: PF_CROP
status: 대기
---

# IDPASS Android — iOS 동기화 + 디테일 보정

> **배경**: 5/23 iMac 세션에서 iOS 앱의 버그 수정 + UI 보정 8건 수행. 안드로이드에도 동일 이슈가 존재함을 확인. iOS와 동일 수준으로 맞춘다.
> **프로젝트**: `apps/idpass-android/`
> **참조 iOS**: `apps/MonkosCrop/MonkosCrop/`

---

## ⚠️ 준수 조항

- PF_CROP README.md 먼저 Read → 히스토리 어펜드
- 웹 원본 crop.js 대조 필수 (이식 버그 방지)
- 커밋 규칙: `[카테고리] 요약`

---

## 1. 🔴 rescaleAll 확대 기준점 버그 수정 (P0)

**iOS 원인**: 줌 슬라이더 변경 시 가이드라인(턱/정수리/눈)이 얼굴에서 이탈. `rescaleAll`의 확대 기준점이 프레임 중심이었으나, 이미지는 이미지 중심(offset 반영) 기준으로 확대됨.

**Android 동일 버그 확인**: `Step4Screen.kt:307`

```kotlin
// 현재 (버그):
s.rescaleAll(newVal, frameW / 2f, frameH / 2f)

// 수정:
s.rescaleAll(newVal, frameW / 2f + s.imgOffsetX, frameH / 2f + s.imgOffsetY)
```

**웹 원본 참조**: `monkos_AI/portal/public/crop/crop.js:615-616`
```javascript
// 스케일 중심 = 사진의 실제 시각 중심 (imgPos 반영)
const cx = FW / 2 + dragStart.imgPos.x;
const cy = FH / 2 + dragStart.imgPos.y;
```

---

## 2. 수치 표기 삭제

**I18n.kt**에서 "200개국" 수치 제거:

```kotlin
// 현재:
"hero_sub" to "200개국 규격 · 무료 · 광고 없음"
"hero_subtitle" to "200개국 규격 · 무료 · 광고 없음"

// 수정:
"hero_sub" to "글로벌 규격 · 무료 · 광고 없음"
"hero_subtitle" to "글로벌 규격 · 무료 · 광고 없음"
```

영어/일본어도 동일 패턴 확인 후 수정.

서비스 카드에 숫자 표기(200 COUNTRIES, 50+, 30+ 등)가 있으면 전부 삭제.

---

## 3. 앱 표시 이름 IDPASS

`AndroidManifest.xml`의 `android:label`이 "IDPASS"로 되어있는지 확인. 아니면 수정.

---

## 4. 베트남 비자 faceTarget 보정

`countries.jsonl`에서 베트남 비자 faceTarget 확인. iOS에서 40으로 명시 수정함. 안드로이드 assets의 countries.jsonl도 동일하게 반영.

```
iOS 정본: apps/MonkosCrop/MonkosCrop/Resources/countries.jsonl
Android: apps/idpass-android/app/src/main/assets/countries.jsonl
```

**countries.jsonl은 iOS 정본을 그대로 복사**하는 게 확실함.

---

## 5. 디버그 로그 제거

iOS에서 `SpecData.swift:59`에 디버그 print가 남아있었음. 안드로이드에도 `Log.d` 등 디버그 로그가 남아있으면 정리.

---

## 6. iOS 대비 미구현 항목 보정

4060/쌍아 세션 로그 기준 이월 사항:

| 항목 | 상태 |
|------|------|
| Landing 데모 애니메이션 | ⏳ 미구현 |
| Thanks Before/After 슬라이더 | ⏳ 미구현 |
| 크롭 로직 정밀도 iOS 수준 보정 | ⏳ 추가 보정 필요 |
| ML Kit 배경제거 품질 열위 | 🔍 기능적 동작은 정상. 품질은 후속 |

**우선순위**: 1(rescaleAll) > 4(jsonl 동기화) > 2(수치 삭제) > 3(앱 이름) > 5(로그) > 6(미구현)

---

## 7. Google Play 등록 준비

iOS 심사 제출 완료 상태. 안드로이드도 병행 준비:

- Google Play 개발자 계정: 등록 완료 (MONKOS AI, ID: 70112966655193837)
- 패키지: `ai.monkos.idpass`
- 서명 키(release keystore) 생성 필요
- Play Console 앱 등록 + 리스팅(14개 언어) 준비

---

## 완료 보고

- COMPLETION 보고서 → `monkos-ops/ops/reports/2026-05/`
- PF_CROP 히스토리 1행 어펜드
- 세션 로그 어펜드
- 커밋 → 푸시

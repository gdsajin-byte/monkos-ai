---
type: completion
date: 2026-05-24
device: M4
agent: 쌍아
status: 완료
portfolio: PF_CROP
order: ORDER_20260524_iMac쌍아_M4쌍아_IDPASS_에뮬테스트_PhoneDemo포팅.md
---

# COMPLETION: 에뮬레이터 테스트 + PhoneDemoView 포팅 + 배경색 통일

**[2026-05-24 14:53 KST] M4/쌍아 → 작가님**

---

## ✅ 완료 항목

### 1. 에뮬레이터 세팅 + 전체 플로우 테스트

| 화면 | 결과 | 비고 |
|------|------|------|
| Landing | ✅ | Hero + PhoneDemoView 애니메이션 + 서비스카드 2×2 (이미지 포함) + 푸터 |
| Step1 (대륙) | ✅ | 6대륙 카드 이미지 정상 (ASIA/EUROPE/AMERICAS/OCEANIA/AFRICA/MIDDLE EAST) |
| Step1 (국가) | ✅ | 국기 + 규격 표시, 2열 그리드, 뒤로가기, 검색바 |
| Step2 | ✅ | 가이드 이미지(35×45 등) + 규격 정보 + 촬영 팁 + 갤러리 선택 |
| Step3 | ✅ | 사진 로드 + 6색 배경 팔레트 + 배경 제거 버튼 |
| Step4 | ✅ | 배경 제거 성공 + 자동 배치 + 메트릭 (EYE/FACE/TOP/BTM) + 줌 슬라이더 + 가이드라인 |
| Step5 | ✅ | ✓ 완료 + VERIFIED 뱃지 + 스펙 테이블 (35×45mm, 413×531px, 300DPI, ICAO 9303) + 다운로드 |
| Thanks | ✅ | Before/After 슬라이더 + Telegram/Email 연락처 + 인화 링크 + monkos.ai 보기 |

- 에뮬레이터: Pixel 7, API 35, arm64 (Google Play)
- 버그/크래시: 없음

### 2. PhoneDemoView 포팅

- `ui/landing/PhoneDemoView.kt` 신규 생성
- iOS 정본 (`DemoAnimation.swift` + `LandingView.swift`) 완전 포팅
- 애니메이션 시퀀스 구현: SCAN → BG REMOVE → CROP → INSPECT(EYE/CHIN/CROWN/HEAD) → PASSPORT → PASS STAMP → BLUR → END CARD → FADE OUT → 반복
- 에셋: `be_f_1.jpg`, `bg_f_1.jpg`, `PASSPORTUSA.jpg` 사용
- `LandingScreen.kt` placeholder → PhoneDemoView 교체
- 에뮬레이터 실측 확인 완료

### 3. 배경색 iOS 정본 통일

| 색상 | 수정 전 | 수정 후 (iOS 정본) |
|------|---------|------------------|
| Off-white | #FAF8F5 | #F5F5F5 |
| Blue | #4A7EB5 | #7BA3C9 |

- 수정 위치: `data/Models.kt` `bgOptions`

### 4. 폰트 스케일 판단 보고

에뮬레이터(Pixel 7, 1080×2400, 420dpi)에서 실측한 결과:
- **현재 -1~2sp 축소 상태를 유지 권장**
- 이유: Android는 시스템 폰트(Roboto)가 iOS SF Pro보다 x-height가 크고 자간이 넓어서, 동일 sp에서도 시각적으로 더 크게 보임
- 에뮬에서 전 화면 텍스트가 균형잡혀 보이며, iOS와 시각적 동등성 확인
- 복원 시 일부 화면(Step1 국가카드, Step4 메트릭)에서 텍스트 overflow 우려

### 5. 디버그 로그 정리

- `grep -rn "println\|Log.d\|Log.i\|Log.w"` 결과: **0건** — 이미 클린 상태

## ❌ 없음

## 💡 참고
- Step1 검색바 탭 시 Android stylus 팝업이 출현함 (에뮬 전용 현상, 실기기에서는 미발생 예상)

## ⏳ 없음

## 📁 산출물
- `ui/landing/PhoneDemoView.kt` (신규)
- `ui/landing/LandingScreen.kt` (placeholder → PhoneDemoView 교체)
- `data/Models.kt` (배경색 2건 수정)
- 에뮬레이터 스크린샷 7장 (Landing~Thanks 전체 플로우)

## 🔀 영향 범위
- `apps/idpass-android/` 내부. Landing 화면 변경 + bgOptions 색상 2건.

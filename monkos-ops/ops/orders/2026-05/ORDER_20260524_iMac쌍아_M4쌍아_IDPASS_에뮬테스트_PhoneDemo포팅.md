---
type: order
date: 2026-05-24
from: iMac/쌍아
to: M4/쌍아
subject: IDPASS Android 에뮬레이터 전체 테스트 + PhoneDemoView 포팅 + 배경색 통일
status: 대기
portfolio: PF_CROP
---

# 지시서: 에뮬레이터 테스트 + PhoneDemoView 포팅 + 배경색 통일

**[2026-05-24 14:14 KST] iMac/쌍아 → M4/쌍아**

---

## 배경

iOS ↔ Android 정밀 비교 완료. 디자인 토큰/엔진/에셋은 일치하나 아래 3건 미일치 확인.
Google Play 출시 전 코드 완성 필수.

---

## 1. 에뮬레이터 세팅 + 전체 플로우 테스트 (P0)

### 1-1. 에뮬레이터 생성
- Android Studio → AVD Manager
- Pixel 7 또는 유사 (API 35, arm64)
- 생성 후 앱 설치 + 실행 확인

### 1-2. 전체 플로우 검증
각 화면별 동작을 실측하고 결과를 기록할 것:

| 화면 | 검증 항목 |
|------|----------|
| Landing | Hero 표시, 2×2 카드 탭 → Step1 진입 |
| Step1 | 대륙카드 → 국가카드 → 문서 선택 → Step2 진입. 검색 동작. 커스텀 모드 |
| Step2 | 가이드박스 표시, 갤러리에서 사진 선택, 얼굴 미인식 시 에러 다이얼로그 |
| Step3 | 배경제거 동작, 6색 전환, 프리뷰 갱신 |
| Step4 | 이미지 드래그, 크라운 드래그, 줌 슬라이더, 메트릭 신호등, 코칭 메시지 |
| Step5 | 체크마크 + VERIFIED뱃지 + 스펙테이블 + 다운로드 |
| Thanks | Before/After 슬라이더 자동 스위핑 + 드래그, 연락처 클릭, 처음으로 |

- 각 단계 스크린샷 저장 (`/tmp/emul_step{N}.png`)
- 버그/UI 깨짐 발견 시 즉시 수정

---

## 2. PhoneDemoView 포팅 (P0)

Landing 화면의 핵심 차별점. iOS 정본을 참조하여 Android Compose로 포팅.

### iOS 원본 위치
`apps/MonkosCrop/MonkosCrop/Sources/ContentView.swift` 내 `PhoneDemoView` + `LandingDemoState`

### 애니메이션 시퀀스
1. 스캔 브래킷 등장 (0.5s)
2. 스캔 라인 스위핑 (1.8s easeInOut, 반복)
3. 배경제거 플래시 + 이미지 페이드 (0.8s easeOut)
4. 크롭 줌 (1.2s easeInOut)
5. 눈/턱 가이드라인 표시 → 사라짐
6. 여권 스탬프 회전 효과 (12° offset)
7. 블러 트랜지션

### 사용 에셋 (iOS 번들에서 확인)
- `be_f_1.jpg` (원본 얼굴)
- `bg_f_1.jpg` (배경제거 결과)
- `bg_cr_f_1.jpg` (크롭 결과)
- `pass_f_1.jpg` (여권 결과)

→ 동일 에셋이 Android `assets/images/`에 없으면 iOS에서 복사할 것.

### 배치
- `ui/landing/` 하위에 `PhoneDemoView.kt` 신규 파일 생성
- `LandingScreen.kt`의 Hero 섹션에 통합
- 최대 폭 260.dp, 정사각 비율

---

## 3. 배경색 iOS 정본 통일 (P1)

Android에서 iOS와 다른 2색을 수정:

| 색상명 | Android 현재 | iOS 정본 | 수정 |
|--------|-------------|---------|------|
| Off-white | #FAF8F5 | #F5F5F5 | → #F5F5F5 |
| Blue | #4A7EB5 | #7BA3C9 | → #7BA3C9 |

수정 위치: `Step3Screen.kt` 내 `bgOptions` 리스트

---

## 4. 폰트 스케일 재검토 (P1)

4060에서 전 파일 -1~2sp 축소 적용한 상태.
에뮬레이터에서 실측 후:
- iOS와 동일하게 복원할지
- Android 특성상 축소 유지할지
- 판단 결과를 보고 (스크린샷 첨부)

---

## 5. 디버그 print 정리 (P2)

전 .kt 파일에서 `println`, `Log.d`, `Log.i` 등 디버그 로그 검색 → 제거 또는 주석.

```bash
grep -rn "println\|Log\.d\|Log\.i\|Log\.w" app/src/main/java/ai/monkos/idpass/ --include="*.kt"
```

---

## ⚠️ 준수 조항
- 헌법 3조 1항: 타임스탬프 `date` 실측 필수
- 헌법 4조 2항: 기존 코드 파괴적 변경 금지
- ch7: 지시서 범위 밖 작업 금지

---

## 산출물
1. 에뮬레이터 전체 플로우 테스트 결과 (화면별 스크린샷 + 버그 리스트)
2. PhoneDemoView.kt 신규 파일 + LandingScreen.kt 통합
3. 배경색 2건 수정
4. 폰트 스케일 판단 보고
5. 디버그 로그 정리
6. COMPLETION 보고서 + 커밋 + 푸시

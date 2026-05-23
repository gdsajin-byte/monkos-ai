---
type: order
date: 2026-05-23
from: iMac/쌍아
to: M4/막내
subject: IDPASS Apple App Store 등록 — 무선 디버깅 + 스크린샷 + 메타데이터 + 심사 제출
portfolio: PF_CROP
status: 대기
---

# IDPASS Apple App Store 등록

> **목표**: IDPASS 앱을 Apple App Store에 심사 제출(Submit for Review)까지 완수한다.
> **디바이스**: M4 (작가님 점유)
> **프로젝트 경로**: `apps/MonkosCrop/`

---

## ⚠️ 준수 조항

- 헌법 4조 1항: API 키, 비밀번호 생성/추측 금지
- 헌법 4조 3항: 내부 기밀(에이전트 호칭, 내부 프로토콜) 외부 노출 금지 — 스토어 설명문에 내부 용어 사용 금지
- ch6 커밋 규칙: `[카테고리] 요약` 형식
- ch7 막내 행동강령: PF_CROP README.md 먼저 Read → 히스토리 어펜드

## ⚠️ 이전 세션 교훈 (반드시 숙지)

1. **SSH에서 코드서명 불가** — `errSecInternalComponent` 에러. GUI Xcode에서만 Archive/빌드 가능. SSH xcodebuild로 시도하지 말 것 (5/21, 5/22 교훈)
2. **xcodeproj vs Package.swift(SPM) 이미지 로딩 분기** — SPM 빌드는 `Bundle.module`, Xcode 프로젝트 빌드는 `Bundle.main`. 현재 코드에 `#if SWIFT_PACKAGE` 분기 처리됨. **Xcode GUI에서 열 때는 xcodeproj 사용**
3. **pbxproj 리소스 등록 누락 주의** — 5/22에 16개 리소스 미등록 발견. 새 파일 추가 시 pbxproj에 등록됐는지 반드시 확인
4. **카메라 권한 이미 제거됨** — 갤러리(사진 라이브러리)만 사용. Info.plist에 `NSPhotoLibraryAddUsageDescription`만 존재. 카메라 관련 코드 추가 금지
5. **가이드 이미지 119MB→1.5MB JPEG 압축 완료** — build 4에 반영됨. 재압축 불필요

---

## 0. 작업 맥락 (반드시 숙지)

### 프로젝트 정체
- **IDPASS** = MONKOS AI의 무료 증명사진 크롭 앱
- 브랜드: IDPASS (powered by MONKOS AI)
- 완전 무료, 인앱결제 없음, 광고 없음, 서버 전송 없음 (온디바이스)
- Apple Vision 얼굴인식 + PersonSegmentation 배경제거
- 202국 320건 증명사진 규격 내장

### 현재 상태
- **App Store Connect**: 빌드 4 업로드 완료 (ai.monkos.MonkosCrop, v1.0)
- **앱 이름**: IDPASS
- **개발팀**: ZPMVHPDUHW
- **등급**: 4+, 무료
- **DSA 거래자**: 등록 완료
- **앱 아이콘**: 전 사이즈 생성 완료
- **남은 것**: 스크린샷, 설명문, 키워드, 개인정보 처리방침 URL, 심사 제출

### 소스 구조
```
apps/MonkosCrop/
├── MonkosCrop.xcodeproj/    # Xcode 프로젝트
├── MonkosCrop/
│   ├── ContentView.swift     # 메인 플로우 (Step1~5)
│   ├── CropEngine.swift      # Vision 크롭 + 배경제거 엔진
│   ├── CropView.swift        # Step4 크롭 뷰포트 + 가이드
│   ├── SpecData.swift         # 202국 규격 데이터 + 모델
│   ├── LandingView.swift      # 랜딩 (4서비스카드 + 데모)
│   ├── DemoAnimation.swift    # 폰 데모 애니메이션
│   ├── MonkosCropApp.swift    # 앱 진입점
│   ├── Info.plist
│   ├── Assets.xcassets/       # 앱 아이콘
│   └── Resources/             # countries.jsonl, 가이드 이미지 25장, 실사 이미지
├── Package.swift
└── run.sh
```

---

## Phase 1 — Xcode 무선 디버깅 환경 구축

> M4에서 iPhone을 Wi-Fi로 연결하여 빌드+실행. USB 없이 디버깅.

### 1-1. Xcode에서 iPhone 무선 연결

1. **먼저 USB로 한 번 연결** (최초 페어링 필수)
2. Xcode → Window → Devices and Simulators
3. 연결된 iPhone 선택 → **"Connect via network"** 체크박스 활성화
4. 네트워크 아이콘(🌐) 뜨면 USB 분리 → 무선 연결 유지 확인
5. 같은 Wi-Fi 네트워크에 있어야 함

### 1-2. 무선 빌드 테스트

1. Xcode에서 MonkosCrop.xcodeproj 열기
2. 타겟 디바이스를 무선 연결된 iPhone으로 선택
3. Cmd+R (빌드+실행) → iPhone에서 앱 실행 확인
4. 콘솔 로그 확인 — Vision 얼굴인식 정상 동작 여부

### 1-3. 확인사항
- [ ] 무선 빌드+실행 성공
- [ ] 앱 풀 플로우 동작 (Landing → 국가선택 → 사진 → 배경제거 → 크롭 → 완료)
- [ ] Vision 얼굴인식 실기기 정상 동작

---

## Phase 2 — 스크린샷 캡처

> App Store Connect에 업로드할 스크린샷. **디바이스별 필수 사이즈** 준수.

### 2-1. 필수 스크린샷 사이즈

| 디바이스 | 해상도 | 필수 여부 |
|----------|--------|----------|
| 6.9" (iPhone 16 Pro Max) | 1320 × 2868 | ✅ 필수 (6.7" 자동 대체) |
| 6.5" (iPhone 11 Pro Max) | 1284 × 2778 | ⬜ 6.9" 있으면 생략 가능 |
| 5.5" (iPhone 8 Plus) | 1242 × 2208 | ✅ 필수 |

> **참고**: 6.9" 스크린샷 1세트면 6.7"/6.5" 자동 대체됨. 5.5"는 별도 필요.

### 2-2. 캡처할 화면 (최소 3장, 권장 5~6장)

| # | 화면 | 포인트 |
|---|------|--------|
| 1 | **Landing** — 4서비스 카드 (여권/비자/면허/커스텀) | 첫인상. "Free ID Photo Crop" 강조 |
| 2 | **Step1 국가선택** — 대륙 카드 + 국가 리스트 | 202국 글로벌 커버리지 |
| 3 | **Step2 규정 가이드** — 규격 카드 + 촬영 가이드 이미지 | 공식 규정 기반 |
| 4 | **Step3 배경제거** — Before/After 비교 | AI 배경제거 (온디바이스) |
| 5 | **Step4 크롭 뷰포트** — 가이드라인 + 신호등 + 메트릭 | 핵심 기능 |
| 6 | **Step5 완료** — 최종 결과 + 다운로드 | 완성물 |

### 2-3. 캡처 방법

**방법 A — Xcode 시뮬레이터** (해상도 정확)
```bash
# 시뮬레이터에서 Cmd+S → 스크린샷 저장
xcrun simctl io booted screenshot ~/Desktop/screenshot_1.png
```

**방법 B — 실기기 캡처 후 리사이즈**
- iPhone에서 사이드버튼+볼륨업 → 스크린샷
- 해상도가 안 맞으면 리사이즈 필요

**방법 C — Xcode Preview + 프레임 (권장)**
- Xcode Preview에서 디바이스 프레임 포함 캡처
- 또는 외부 도구(Screenshots Pro 등)로 프레이밍

### 2-4. 다국어 스크린샷
- **한국어** / **영어** / **일본어** 각각 별도 스크린샷 세트
- 앱 내 언어 전환 후 캡처 (또는 시뮬레이터 언어 설정 변경)

---

## Phase 3 — App Store Connect 메타데이터

> https://appstoreconnect.apple.com → IDPASS 앱 → 앱 정보 입력

### 3-1. 앱 설명문 (한/영/일)

**한국어 (기본)**
```
IDPASS - 무료 증명사진 크롭

여권, 비자, 면허증, 이력서 증명사진을 규격에 맞게 자동으로 크롭합니다.

◆ 주요 기능
• 202개국 320종 증명사진 규격 내장
• AI 얼굴 인식으로 자동 위치 조정
• AI 배경 제거 (흰색/파랑/빨강 등)
• 공식 ICAO 9303 국제 규격 검증
• 실시간 신호등 판정 (합격/주의/불합격)
• 정수리·눈·턱 위치 정밀 측정

◆ 완전 무료
• 인앱결제 없음
• 광고 없음
• 사진 서버 전송 없음 — 모든 처리는 기기에서

◆ 지원 규격
여권, 비자, 운전면허, 주민등록증, 이력서, 마이넘버 등
한국, 미국, 일본, 중국, 캐나다, EU, 영국, 호주 등 202개국

powered by MONKOS AI
```

**English**
```
IDPASS - Free ID Photo Crop

Crop your passport, visa, license, and ID photos to exact official specifications.

◆ Key Features
• 202 countries, 320 document specs built-in
• AI face detection for automatic positioning
• AI background removal (white, blue, red, etc.)
• Official ICAO 9303 international standard verification
• Real-time traffic light indicator (pass/caution/fail)
• Precise crown, eye, and chin measurement

◆ Completely Free
• No in-app purchases
• No ads
• No photo uploads — all processing on-device

◆ Supported Documents
Passport, visa, driver's license, national ID, resume photo, and more
Korea, USA, Japan, China, Canada, EU, UK, Australia, and 202 countries

powered by MONKOS AI
```

**日本語**
```
IDPASS - 無料証明写真クロップ

パスポート、ビザ、免許証、履歴書の証明写真を公式規格に合わせて自動クロップします。

◆ 主な機能
• 202カ国320種の証明写真規格を内蔵
• AI顔認識による自動位置調整
• AI背景除去（白・青・赤など）
• 公式ICAO 9303国際規格検証
• リアルタイム信号判定（合格・注意・不合格）
• 頭頂部・目・顎の位置を精密測定

◆ 完全無料
• アプリ内課金なし
• 広告なし
• 写真のサーバー送信なし — すべてデバイス上で処理

◆ 対応規格
パスポート、ビザ、運転免許証、マイナンバー、履歴書写真など
韓国、米国、日本、中国、カナダ、EU、英国、豪州など202カ国

powered by MONKOS AI
```

### 3-2. 키워드 (100자 이내, 콤마 구분)

**한국어**: `증명사진,여권사진,비자사진,크롭,증명사진크롭,여권규격,ICAO,배경제거,면허사진,이력서사진`

**English**: `passport photo,visa photo,id photo crop,ICAO,photo crop,background removal,id photo,passport size,photo editor`

**日本語**: `証明写真,パスポート写真,ビザ写真,クロップ,ICAO,背景除去,免許写真,履歴書写真,写真加工`

### 3-3. 기타 메타데이터

| 항목 | 값 |
|------|-----|
| 카테고리 (기본) | Photo & Video |
| 카테고리 (보조) | Utilities |
| 연령 등급 | 4+ |
| 가격 | 무료 |
| 저작권 | © 2026 MONK STUDIO |
| 지원 URL | https://monkos.ai |
| 개인정보 처리방침 URL | https://monkos.ai/privacy (⚠️ 존재 여부 확인 필요 → 없으면 생성) |

### 3-4. 앱 개인정보 보호

App Store Connect → 앱 개인정보 보호 섹션:
- **데이터 수집 없음** 선택 (서버 전송 0, 분석 SDK 미포함)
- 카메라 권한: **제거됨** (5/21). 갤러리만 사용
- 사진 라이브러리 저장 권한: `NSPhotoLibraryAddUsageDescription` (Info.plist 등록 완료)

---

## Phase 4 — 심사 제출

### 4-1. 제출 전 체크리스트

- [ ] 스크린샷 업로드 (6.9" + 5.5", 한/영/일 각 세트)
- [ ] 앱 설명문 입력 (한/영/일)
- [ ] 키워드 입력 (한/영/일)
- [ ] 개인정보 처리방침 URL 등록
- [ ] 앱 개인정보 보호 설정 완료
- [ ] 빌드 선택 (build 4 또는 신규)
- [ ] 앱 아이콘 확인
- [ ] 카테고리 설정

### 4-2. 심사 메모 (Review Notes)

```
IDPASS is a completely free ID photo cropping app.
No login required. No server communication.
All photo processing is done on-device using Apple Vision framework.

To test:
1. Select any country and document type (e.g., Korea → Passport)
2. Take or select a portrait photo
3. The app will automatically detect the face, remove background, and crop to spec
4. Download the result to Photos
```

### 4-3. 제출

1. App Store Connect → IDPASS → 앱 심사 준비
2. 모든 필드 녹색 확인
3. **"심사를 위해 제출"** 클릭

---

## 완료 보고

- COMPLETION 보고서 생성 → `monkos-ops/ops/reports/2026-05/`
- PF_CROP 히스토리 1행 어펜드
- 세션 로그 어펜드
- 커밋 → 푸시

---

## 비고

- **개인정보 처리방침 URL**: `https://monkos.ai/privacy` 페이지가 존재하는지 먼저 확인. 없으면 작가님께 보고 후 대기 (별도 제작 필요). 심사 제출의 **블로커**.
- **무선 디버깅이 안 되는 경우**: USB 유선으로 진행해도 무방. 핵심은 실기기 빌드+스크린샷.
- **빌드 버전**: 현재 build 4가 App Store Connect에 올라가 있음. 코드 수정이 발생하면 build 5로 재 Archive → 재업로드 필요. **반드시 GUI Xcode에서 Archive** (SSH xcodebuild 불가).
- **스크린샷**: 실기기 캡처가 가장 깔끔함. 시뮬레이터는 해상도 정확하나 실기기 느낌 부족.
- **M4 빌드 이력**: 5/21 M4에서 직접 빌드→아이폰 설치 성공 이력 있음. 서명 인증서+프로비저닝 프로파일 M4에 설치 완료 상태.
- **TestFlight 결과**: 작가님 실기기 검증 "완성도 강력", "버벅임 없이 턱턱" (5/21).

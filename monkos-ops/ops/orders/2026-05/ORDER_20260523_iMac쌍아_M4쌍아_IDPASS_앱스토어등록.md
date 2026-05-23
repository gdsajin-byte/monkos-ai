---
type: order
date: 2026-05-23
from: iMac/쌍아
to: M4/쌍아
subject: IDPASS Apple App Store 등록 — 환경 동기화 + 무선 디버깅 + 스크린샷 + 심사 제출
portfolio: PF_CROP
status: 대기
---

# IDPASS Apple App Store 등록

> **목표**: IDPASS 앱을 Apple App Store에 심사 제출(Submit for Review)까지 완수한다.
> **디바이스**: M4 (작가님 점유, 5/23~24)
> **프로젝트 경로**: `apps/MonkosCrop/`
> **협업 체계**: iMac/쌍아(설계·지시서) ↔ M4/쌍아(실행·빌드)

---

## ⚠️ 준수 조항

- 헌법 4조 1항: API 키, 비밀번호 생성/추측 금지
- 헌법 4조 3항: 내부 기밀(에이전트 호칭, 내부 프로토콜) 외부 노출 금지 — 스토어 설명문에 내부 용어 사용 금지
- ch6 커밋 규칙: `[카테고리] 요약` 형식
- ch7: PF_CROP README.md 먼저 Read → 히스토리 어펜드

---

## ⚠️ M1 ↔ M4 교차 빌드 히스토리 (반드시 숙지)

> M1과 M4에서 번갈아 빌드하면서 코드 상태가 분기됐다. Phase 0에서 반드시 동기화.

### 빌드 타임라인

| 날짜 | 디바이스 | 빌드 | 내용 | 커밋 |
|------|----------|------|------|------|
| 5/12 | iMac | — | Xcode 프로젝트 생성, MVP 4파일 | `05b27e02` |
| 5/13 | **M1** | build 1 (TestFlight) | 첫 Archive→App Store Connect 업로드. 서명 인증서+프로파일 M1에 생성 | `9ef253fa` |
| 5/16 | **M4** | 실기기 설치 | `Bundle.module→main` 수정, countries.jsonl pbxproj 등록, TEAM 세팅, iPhone devicectl 설치 성공 | `fb3f3b38`~`98c881c9` |
| 5/16~19 | iMac | — | Landing 리디자인, 데모 애니, IDPASS 브랜딩, 200국 JSONL, 대륙카드, 파일 분리 | 다수 |
| 5/21 | **M4** | 실기기 설치 | pbxproj에 LandingView/DemoAnimation/slider 등록. **SSH 코드사인 불가** → M4 GUI에서 직접 빌드 성공. 작가님 실기기 검증 "완성도 강력" | `308d4809` |
| 5/21 | iMac | — | 비율 왜곡 근본 수정(px computed from mm×DPI), 비자 128국 추가, 떙큐 C3 | 5커밋 |
| 5/22 | **M1** | build 2→3→4 (App Store Connect) | **새 클론에서 Archive**. pbxproj 16개 리소스 누락 수정, monkos-icon.png 추가, 가이드 이미지 25장 JPEG 압축(119MB→1.5MB), `guideImageView` Bundle.module 분기 추가 | `b1f3e6db`~`8d7feb96` |

### M4의 마지막 상태 (`308d4809`, 5/21) vs 현재 main (`8d7feb96`, 5/22)

| 항목 | M4 (5/21) | main 최신 (5/22) | 차이 |
|------|-----------|------------------|------|
| pbxproj 리소스 | 7파일+2리소스 등록 | +16개 추가 (총 리소스 완비) | **11커밋 차이** |
| 가이드 이미지 | Desktop 경로 참조 가능 | Bundle.main 전환 + JPEG 압축 완료 | 로딩 경로 변경 |
| monkos-icon.png | 미등록 | git 추가 + pbxproj 등록 | 신규 |
| Bundle 분기 | `Bundle.main` (iOS) | + `Bundle.module` (SPM/macOS) 분기 | 안전한 확장 |
| 디버그 로그 | 없음 | `print("[bundleImage]...")` 포함 | **심사 전 제거 필요** |
| 카메라 권한 | 제거됨 ✅ | 동일 | — |

### 이전 세션 교훈 5건

1. **SSH에서 코드서명 불가** — `errSecInternalComponent`. 반드시 **GUI Xcode**에서 Archive/빌드 (5/13 M1, 5/21 M4, 5/22 M1 모두 동일 현상)
2. **pbxproj 리소스 등록 누락 반복** — 새 파일 추가 시 Xcode GUI에서 등록 여부 확인 필수. 5/22에 16개 빠져서 build 2 실패
3. **xcodeproj vs SPM 이미지 로딩** — xcodeproj(GUI) = `Bundle.main`, SPM(swift build) = `Bundle.module`. 현재 `#if canImport(UIKit)` 분기 처리됨
4. **SCP로 pbxproj 덮어쓰면 Team 설정 날아감** — 5/13 교훈. `git pull`이 안전
5. **카메라 권한 이미 제거됨** — 갤러리(사진 라이브러리)만 사용. Info.plist에 `NSPhotoLibraryAddUsageDescription`만 존재

---

## 0. 작업 맥락

### 프로젝트 정체
- **IDPASS** = MONKOS AI의 무료 증명사진 크롭 앱
- 브랜드: IDPASS (powered by MONKOS AI)
- 완전 무료, 인앱결제 없음, 광고 없음, 서버 전송 없음 (온디바이스)
- Apple Vision 얼굴인식 + PersonSegmentation 배경제거
- 202국 320건 증명사진 규격 내장 (countries.jsonl)

### 현재 App Store Connect 상태
- **빌드 4** 업로드 완료 (M1에서 Archive, 5/22)
- 앱 이름: IDPASS
- Bundle ID: `ai.monkos.MonkosCrop`
- 개발팀: ZPMVHPDUHW
- 등급: 4+, 무료
- DSA 거래자: 등록 완료
- 앱 아이콘: 전 사이즈 생성 완료
- **남은 것**: 스크린샷, 설명문, 키워드, 개인정보 처리방침 URL, 심사 제출

### 소스 구조
```
apps/MonkosCrop/
├── MonkosCrop.xcodeproj/    # Xcode 프로젝트 (GUI 빌드용)
├── MonkosCrop/
│   ├── ContentView.swift     # 메인 플로우 (Step1~5), ~1,155줄
│   ├── CropEngine.swift      # Vision 크롭 + PersonSegmentation 배경제거
│   ├── CropView.swift        # Step4 크롭 뷰포트 + 가이드 오버레이
│   ├── SpecData.swift         # 202국 규격 데이터 + 모델 + bundleImage()
│   ├── LandingView.swift      # 랜딩 (4서비스카드 Hero + 보라 푸터)
│   ├── DemoAnimation.swift    # 폰 데모 애니메이션 (18초 루프)
│   ├── MonkosCropApp.swift    # 앱 진입점 (#if canImport 분기)
│   ├── Info.plist             # NSPhotoLibraryAddUsageDescription만
│   ├── Assets.xcassets/       # 앱 아이콘 전 사이즈
│   └── Resources/
│       ├── countries.jsonl    # 202국 320문서 규격 정본
│       ├── guides/            # 25장 가이드 이미지 (JPEG 압축)
│       ├── 실사 이미지 16장    # 랜딩/데모/슬라이더용
│       └── monkos-icon.png
├── Package.swift              # SPM (macOS swift build용)
└── run.sh
```

---

## Phase 0 — M4 환경 동기화 (최우선)

> M4의 로컬 코드가 5/21 상태(`308d4809`)일 수 있다. main 최신(`8d7feb96`)으로 동기화.

### 0-1. git pull

```bash
cd ~/developer/monk_project   # M4 레포 경로 확인
git fetch origin
git log --oneline HEAD..origin/main   # 차이 확인
git pull origin main
```

- **pbxproj 충돌 발생 시**: origin/main(M1 측, 최신)을 기준으로 해결. M4에서 5/21에 등록한 파일들은 5/22 M1 커밋에 모두 포함됨.

### 0-2. Xcode 프로젝트 열기 + 빌드 확인

1. Xcode에서 `apps/MonkosCrop/MonkosCrop.xcodeproj` 열기
2. Signing & Capabilities → Team: ZPMVHPDUHW 확인 (날아갔으면 재선택)
3. 타겟: 실기기 iPhone 선택
4. **Cmd+B** (Build) → BUILD SUCCEEDED 확인
5. 리소스 로딩 확인: 런타임에 `[bundleImage]` 로그가 `path=nil`이 아닌지 체크

### 0-3. 디버그 로그 제거

`SpecData.swift:59`에 디버그 print가 남아있다. 심사 제출 전 제거:

```swift
// 제거 대상 (SpecData.swift 59줄):
let _ = print("[bundleImage] name=\(name), path=\(Bundle.main.path(forResource: name, ofType: \"jpg\") ?? \"nil\"), bundlePath=\(Bundle.main.bundlePath)")
```

### 0-4. 확인사항
- [ ] git pull 완료, main 최신 상태
- [ ] pbxproj Team 설정 정상 (ZPMVHPDUHW)
- [ ] Cmd+B BUILD SUCCEEDED
- [ ] 디버그 print 제거

---

## Phase 1 — Xcode 무선 디버깅 환경 구축

> M4에서 iPhone을 Wi-Fi로 연결하여 빌드+실행. USB 없이 디버깅.

### 1-1. iPhone 무선 연결

1. **먼저 USB로 한 번 연결** (최초 페어링 필수)
2. Xcode → Window → Devices and Simulators
3. 연결된 iPhone 선택 → **"Connect via network"** 체크박스 활성화
4. 네트워크 아이콘(🌐) 뜨면 USB 분리 → 무선 연결 유지 확인
5. 같은 Wi-Fi 네트워크에 있어야 함

### 1-2. 무선 빌드+실행 테스트

1. 타겟 디바이스를 무선 연결된 iPhone으로 선택
2. **Cmd+R** (빌드+실행) → iPhone에서 앱 실행 확인
3. Xcode 콘솔에서 Vision 얼굴인식 로그 확인

### 1-3. 무선 디버깅이 안 되는 경우
- USB 유선으로 진행해도 무방. 핵심은 실기기 빌드+스크린샷.
- 5/21에 USB devicectl 설치 성공 이력 있음.

### 1-4. 확인사항
- [ ] 무선 (또는 USB) 빌드+실행 성공
- [ ] 앱 풀 플로우 동작 (Landing → 국가선택 → 가이드 → 배경제거 → 크롭 → 완료 → 떙큐)
- [ ] Vision 얼굴인식 실기기 정상 동작

---

## Phase 2 — 스크린샷 캡처

> App Store Connect에 업로드할 스크린샷.

### 2-1. 필수 스크린샷 사이즈

| 디바이스 | 해상도 | 필수 여부 |
|----------|--------|----------|
| 6.9" (iPhone 16 Pro Max) | 1320 × 2868 | ✅ 필수 (6.7" 자동 대체) |
| 5.5" (iPhone 8 Plus) | 1242 × 2208 | ✅ 필수 |

> 6.9" 1세트면 6.7"/6.5" 자동 대체됨. 5.5"는 별도 필요.
> 작가님 iPhone이 최신 모델이면 실기기 캡처로 6.9" 커버 가능.

### 2-2. 캡처할 화면 (최소 3장, 권장 5~6장)

| # | 화면 | 포인트 |
|---|------|--------|
| 1 | **Landing** — 4서비스 카드 (여권/비자/면허/커스텀) + IDPASS 로고 | 첫인상 |
| 2 | **Step1 국가선택** — 대륙 카드 + 국가 리스트 | 202국 글로벌 커버리지 |
| 3 | **Step2 규정 가이드** — 규격 카드 + 가이드 이미지 | 공식 규정 기반 |
| 4 | **Step4 크롭 뷰포트** — 가이드라인 + 신호등 + 메트릭 | 핵심 기능 |
| 5 | **Step5 완료** — 최종 결과 + 다운로드 | 완성물 |
| 6 | **떙큐** — Before/After 슬라이더 | 비교 효과 |

### 2-3. 캡처 방법

**실기기 캡처 (권장)**:
- iPhone에서 사이드버튼+볼륨업 → 스크린샷
- AirDrop 또는 사진 앱에서 M4로 전송
- 해상도가 디바이스 네이티브이므로 가장 깔끔

**시뮬레이터 (해상도 정확)**:
```bash
# 6.9" 시뮬레이터 (iPhone 16 Pro Max)
xcrun simctl boot "iPhone 16 Pro Max"
# 앱 실행 후
xcrun simctl io booted screenshot ~/Desktop/ss_1.png
```

**5.5" 별도 캡처**:
- 시뮬레이터 iPhone 8 Plus 사용 (실기기 없으므로)

### 2-4. 다국어 스크린샷
- **한국어** / **영어** / **일본어** 각각 별도 스크린샷 세트
- 시뮬레이터 언어 설정 변경: Xcode → Edit Scheme → Run → Options → App Language

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
| 개인정보 처리방침 URL | https://monkos.ai/privacy (**⚠️ 블로커**: 존재 여부 먼저 확인 → 없으면 작가님께 즉시 보고) |

### 3-4. 앱 개인정보 보호

App Store Connect → 앱 개인정보 보호 섹션:
- **데이터 수집 없음** 선택 (서버 전송 0, 분석 SDK 미포함)
- 카메라 권한: **제거됨** (5/21). 갤러리만 사용
- 사진 라이브러리 저장 권한: `NSPhotoLibraryAddUsageDescription` (Info.plist 등록 완료)

---

## Phase 4 — 빌드 재업로드 (필요 시)

> Phase 0에서 디버그 로그 제거 등 코드 수정이 발생하면 build 5 필요.

### 4-1. Archive + 업로드

1. Xcode GUI에서 **Product → Archive** (SSH xcodebuild 절대 금지)
2. Organizer → Distribute App → App Store Connect
3. 업로드 완료 후 App Store Connect에서 빌드 선택

### 4-2. 주의

- `security unlock-keychain -p "비밀번호" ~/Library/Keychains/login.keychain-db` 필요할 수 있음 (SSH 세션일 때만)
- GUI Xcode에서는 키체인 자동 접근 → 문제 없음

---

## Phase 5 — 심사 제출

### 5-1. 제출 전 체크리스트

- [ ] 스크린샷 업로드 (6.9" + 5.5", 한/영/일 각 세트)
- [ ] 앱 설명문 입력 (한/영/일)
- [ ] 키워드 입력 (한/영/일)
- [ ] 개인정보 처리방침 URL 등록 + 페이지 실존 확인
- [ ] 앱 개인정보 보호 설정 완료 ("데이터 수집 없음")
- [ ] 빌드 선택 (build 4 또는 build 5)
- [ ] 앱 아이콘 정상 표시 확인
- [ ] 카테고리 설정 (Photo & Video / Utilities)
- [ ] 디버그 print 제거 확인

### 5-2. 심사 메모 (Review Notes)

```
IDPASS is a completely free ID photo cropping app.
No login required. No server communication.
All photo processing is done on-device using Apple Vision framework.

To test:
1. Select any country and document type (e.g., Korea → Passport)
2. Select a portrait photo from the photo library
3. The app will automatically detect the face, remove background, and crop to spec
4. Save the result to Photos

Note: Camera access is not used. Photos are selected from the library only.
```

### 5-3. 제출

1. App Store Connect → IDPASS → 버전 1.0
2. 모든 필드 녹색 확인
3. **"심사를 위해 제출"** 클릭

---

## 완료 보고

- COMPLETION 보고서 생성 → `monkos-ops/ops/reports/2026-05/`
- PF_CROP 히스토리 1행 어펜드
- 세션 로그 어펜드
- 커밋 → 푸시 (`scripts/mk-push.sh`)

---

## 비고

- **개인정보 처리방침 URL은 블로커**. `https://monkos.ai/privacy` 접속 확인 → 404면 작가님께 즉시 보고. 간단한 정적 페이지로 제작 가능 (데이터 수집 없음 명시).
- **build 4(M1 Archive)가 이미 올라가 있음**. 코드 수정 없으면 재업로드 불필요.
- **M4 빌드 이력**: 5/21 M4 GUI에서 직접 빌드→iPhone 설치 성공. 서명 인증서+프로비저닝 프로파일 M4에 설치 완료 상태.
- **TestFlight 결과**: 작가님 실기기 검증 "완성도 강력", "버벅임 없이 턱턱" (5/21).

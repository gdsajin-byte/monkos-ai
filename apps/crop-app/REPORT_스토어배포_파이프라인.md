---
type: report
date: 2026-05-01
from: iMac/막내3
to: iMac/쌍아
subject: 앱스토어 배포 파이프라인 리서치 — TWA/Capacitor/심사/ASO
status: 완료
---

# 스토어 배포 파이프라인 리서치 보고서

> **[2026-05-01 15:57 KST] iMac/막내3 → iMac/쌍아**
> 대상: MONKOS Crop (PWA, ai.monkos.crop, ~60-65MB WASM)

---

## T1. Android 래핑 비교

### 1-1. TWA (Trusted Web Activity) via Bubblewrap CLI

**빌드 절차**
```bash
# 1. 설치
npm i -g @bubblewrap/cli          # v1.24.1 (2025-09)

# 2. 초기화 (manifest 읽어 Android 프로젝트 생성)
bubblewrap init --manifest https://crop.monkos.ai/manifest.webmanifest

# 3. 빌드 (서명된 APK + AAB 생성)
bubblewrap build
# → app-release-signed.apk (테스트) + app-release-bundle.aab (Play 업로드)

# 4. assetlinks.json 배포 (필수!)
# → https://crop.monkos.ai/.well-known/assetlinks.json
```

**assetlinks.json** — `crop.monkos.ai/.well-known/`에 배포 필수. 미배포 시 Chrome 주소창 노출.
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "ai.monkos.crop",
    "sha256_cert_fingerprints": ["서명키_SHA256"]
  }
}]
```

| 항목 | 상세 |
|------|------|
| 호스팅 필요 | **필수**. TWA는 crop.monkos.ai에서 콘텐츠 로드 |
| 오프라인 동작 | 첫 실행 시 네트워크 필수 → SW 캐시 완료 후 오프라인 가능 |
| 카메라 | `getUserMedia()` Chrome 네이티브 — 추가 코드 불필요 |
| APK 사이즈 | **~5MB** (웹 에셋 미포함, 런처 껍데기) |
| Chrome 의존 | **Chrome 72+ 필수**. 미설치 시 Custom Tab 폴백 (주소창 노출) |

**장점**: 최소 APK(5MB), PWA 코드 변경 제로, Google 공식 도구, 빌드 10분
**단점**: 첫 실행 시 60-65MB 다운로드 필요, Chrome 의존, "설치됐지만 준비 안 됨" UX 공백, Play Store "얇은 래퍼" 심사 리스크

---

### 1-2. Capacitor (by Ionic)

**빌드 절차**
```bash
# 1. Capacitor 설치
npm install @capacitor/core
npm install -D @capacitor/cli

# 2. 초기화
npx cap init    # appId: ai.monkos.crop

# 3. Android 플랫폼 추가
npm install @capacitor/android
npx cap add android

# 4. 웹 빌드 + 네이티브 동기화
npm run build
npx cap sync    # 웹 에셋을 android/app/src/main/assets/public/에 복사

# 5. Android Studio에서 빌드
npx cap open android
# → APK/AAB 생성 (gradle assembleRelease)
```

| 항목 | 상세 |
|------|------|
| WebView | Android System WebView (Chrome과 별도, v60+ 필요) |
| 네이티브 API | `@capacitor/camera`, `@capacitor/filesystem`, `@capacitor/share` 등 플러그인 |
| 오프라인 동작 | **첫 실행부터 오프라인** — 에셋이 APK에 번들됨 |
| 카메라 | 네이티브 플러그인 + getUserMedia 둘 다 가능 |
| APK 사이즈 | **~75-85MB** (베이스 15-20MB + 웹 에셋 60-65MB) |
| Chrome 의존 | **없음** — System WebView 사용 |

**장점**: 에셋 번들로 즉시 오프라인, 네이티브 플러그인, Chrome 무의존, iOS 동시 지원, "얇은 래퍼" 우려 없음
**단점**: APK 75-85MB, Android Studio 필요, WebView가 Chrome보다 기능 지연 가능

---

### 1-3. PWABuilder (by Microsoft)

**실체**: Bubblewrap을 웹 GUI로 감싼 것. 출력물은 TWA와 **동일**.

| 항목 | 상세 |
|------|------|
| 빌드 | https://pwabuilder.com 웹 UI에서 URL 입력 → 패키지 다운로드 |
| CLI/CI | **미지원** (2026-03 확인) — 웹 UI 전용 |
| 안정성 | 2026-04 "Querying for job..." 무한 대기 보고 (Issue #5562) |
| SDK 타겟 | Bubblewrap 대비 업데이트 지연 이력 (SDK 33 vs 필수 34) |

**장점**: 로컬 도구 설치 불필요, 빠른 1회성 빌드
**단점**: TWA와 동일 제약 + CLI 없음 + 서버 불안정 + 커스터마이징 제한

---

### 1-4. Android 래핑 추천

| 기준 | TWA | Capacitor | PWABuilder |
|------|-----|-----------|------------|
| APK 사이즈 | 5MB ✅ | 75-85MB | 5MB |
| 첫 실행 오프라인 | ❌ (60MB 다운 필요) | ✅ | ❌ |
| 네이티브 API | ❌ | ✅ | ❌ |
| Chrome 의존 | 필수 | 없음 ✅ | 필수 |
| 빌드 자동화 | CLI ✅ | CLI + Studio | 웹 UI만 |
| iOS 겸용 | ❌ | ✅ | ❌ |
| Play 심사 리스크 | 중간 | 낮음 ✅ | 중간 |

### **추천: Capacitor** ⭐

**근거**:
1. 60-65MB WASM 모델이 APK에 번들 → 설치 즉시 오프라인 작동 (TWA는 첫 실행 시 전체 다운로드 필요 — 사용자가 "설치했는데 안 됨" 경험)
2. 향후 카메라 촬영 기능 추가 시 `@capacitor/camera` 네이티브 플러그인 즉시 활용
3. **iOS도 같은 코드베이스로 래핑 가능** — 크로스 플랫폼 1석 2조
4. Chrome 미설치 기기(Huawei 등)에서도 정상 동작
5. 네이티브 앱 구조 → Play Store "얇은 래퍼" 심사 리스크 제거

APK 80MB는 200MB 한도 대비 여유 있고, 증명사진 전문 앱으로서 합리적 사이즈.

---

## T2. iOS 래핑 비교

### 2-1. Capacitor (iOS)

**빌드 절차**
```bash
# 1. iOS 플랫폼 추가 (Android와 동일 프로젝트)
npm install @capacitor/ios
npx cap add ios

# 2. 웹 빌드 + 동기화
npm run build
npx cap sync ios

# 3. Xcode에서 빌드
npx cap open ios
# → Team 설정, Bundle ID 확인, Archive → App Store Connect 업로드

# 4. TestFlight → App Store 제출
```

| 항목 | 상세 |
|------|------|
| WebView | **WKWebView** (Apple 표준, 별도 프로세스 실행) |
| 메모리 한도 | iPhone ~2GB (초과 시 WebContent 프로세스 종료, 앱은 유지) |
| 카메라 | `@capacitor/camera` 네이티브 플러그인 (Info.plist 권한 선언) |
| 파일 저장 | `@capacitor/filesystem` + `@capacitor-community/media` (앨범 저장) |
| 예상 IPA | ~180-200MB (Capacitor 베이스 ~122MB + 에셋 60-65MB, Store 시닝 후 축소) |

**iOS WASM/ONNX 성능 — 핵심 리스크**:

| 이슈 | 심각도 | 상세 |
|------|--------|------|
| ONNX WASM-SIMD iOS 16.4+ 깨짐 | **높음** | ORT #15644. 폴백 비SIMD 빌드는 v1.19.0부터 제거 예정 |
| WebGPU 미지원 | **높음** | iOS 전 브라우저 WebGPU 불가 → CPU 전용 추론 |
| MediaPipe Web Worker 행 | **높음** | iOS에서 Worker 내 초기화 60초 이상 무응답 → **메인 스레드 실행 필수** |
| Safari/WebKit 26 JSEP 메모리 | **중간** | CPU 400%+, 메모리 1GB→14GB 성장 후 크래시 보고 |
| Relaxed SIMD 플래그 뒤 | **중간** | 표준 SIMD는 작동, Relaxed는 미지원 |

**리스크 대응**: iOS에서 ONNX 배경 제거 불안정 시, CoreML 네이티브 Capacitor 플러그인으로 대체 가능 (별도 개발 필요).

---

### 2-2. PWABuilder (iOS)

- WKWebView 래퍼 Swift 프로젝트 생성
- **한계**: 네이티브 플러그인 생태계 없음, Apple 4.2 리젝 리스크 높음, 7일 미사용 시 데이터 삭제 가능
- Capacitor 대비 장점 없음

---

### 2-3. React Native WebView

- **과잉**. RN 런타임 7-12MB 오버헤드, 두 개 JS 런타임 디버깅, Metro 번들러 복잡성
- 결국 WKWebView 사용 — Capacitor와 동일 엔진, 3-5배 더 복잡한 셋업
- PWA 래핑에는 부적합

---

### 2-4. Apple 4.2 Minimum Functionality — 리젝 회피 분석

**리젝 기준**: "웹사이트를 재포장한 것에 불과한 앱"

**MONKOS Crop의 4.2 통과 근거**:

| 차별화 요소 | 근거 |
|------------|------|
| MediaPipe WASM (FaceMesh) | 468개 얼굴 랜드마크 실시간 ML 연산 — 웹사이트 수준이 아님 |
| ONNX Runtime (배경 제거) | 40MB ML 모델 온디바이스 추론 파이프라인 |
| 완전 오프라인 | 서버 의존 제로 — URL 방문으로 대체 불가 |
| 60-65MB 모델 번들 | 매번 다운로드 비현실적 → 앱 형태 필수 |
| 사진 처리 파이프라인 | 얼굴 감지 → 크롭 → 배경 제거 → 검수 (다단계 네이티브급 기능) |

**리젝 리스크 최소화 전략** (Capacitor 사용 시):
1. **네이티브 기능 3-4개 통합**: Photo Library 저장, Share Sheet, 네이티브 스플래시, Haptic 피드백
2. **App Review Notes 작성**: "60MB+ ML 모델 온디바이스 실행, 서버 호출 제로, 오프라인 완결"
3. **네이티브 UI 요소**: 스플래시 스크린, 상태바 스타일링, 로딩 인디케이터
4. 설명문에 "웹사이트 접근" 표현 절대 금지 → "온디바이스 AI 처리" 강조

---

### 2-5. iOS 래핑 추천

### **추천: Capacitor** ⭐

**근거**:
1. Android와 동일 코드베이스 공유 — 유지보수 1벌
2. 네이티브 플러그인으로 4.2 리젝 리스크 최소화
3. WKWebView 기반이지만 네이티브 브릿지로 카메라/파일 시스템 접근
4. PWABuilder, RN WebView 대비 명확한 우위

**주의**: ONNX WASM-SIMD iOS 불안정 이슈는 반드시 실기기 테스트 후 판단. 심각 시 CoreML 폴백 플러그인 별도 개발 필요.

---

## T3. 스토어 심사 가이드라인 분석

### 3-1. Google Play

#### 사진/카메라 권한

- `READ_MEDIA_IMAGES` 선언 **불필요** (오히려 리젝 가능). Android Photo Picker 사용 의무
- TWA: `<input type="file" accept="image/*">`가 Photo Picker로 자동 매핑
- Capacitor: `@capacitor/camera` 플러그인이 Photo Picker 자동 사용
- 향후 카메라: `CAMERA` 권한은 Photo Picker 정책과 별도, 정상 선언 가능

#### Data Safety 섹션

| 항목 | 응답 |
|------|------|
| 데이터 수집 여부 | **No** |
| 개인정보 처리방침 URL | **필수** (수집 없어도) — `monkos.ai/privacy` 작성 필요 |
| 전송 시 암호화 | 해당 없음 (전송 자체 없음) |
| 삭제 요청 메커니즘 | 해당 없음 (저장 자체 없음) |

**검증 필수**: MediaPipe WASM, @imgly/background-removal SDK가 텔레메트리를 보내지 않는지 네트워크 트래픽 확인

#### 콘텐츠 등급

IARC 설문 결과: **PEGI 3 / ESRB Everyone / 전체이용가**
(폭력·성적·도박·UGC·통신 기능 전무)

#### AAB 요건

- 신규 앱 AAB 필수 (APK 직접 업로드 불가)
- 최대 **200MB** (2026-01 상향)
- MONKOS Crop ~75-85MB → 한도 내 여유

#### 심사 기간

- 신규 앱 첫 제출: **1-3일** (저위험 유틸리티 → 1-2일 예상)
- 업데이트: 12-24시간

---

### 3-2. Apple App Store

#### 4.2 Minimum Functionality

위 T2-4 참조. Capacitor + 네이티브 플러그인 3-4개 통합으로 리젝 리스크 최소화.

#### Info.plist 권한 선언

| 키 | 용도 | 권장 문구 |
|----|------|----------|
| `NSPhotoLibraryUsageDescription` | 사진 선택 | "증명사진 크롭을 위해 사진을 선택합니다. 사진은 기기에서만 처리되며 서버로 전송되지 않습니다." |
| `NSPhotoLibraryAddUsageDescription` | 결과 저장 | "크롭된 증명사진을 사진 앨범에 저장합니다." |
| `NSCameraUsageDescription` | 향후 촬영 | (현재 불필요. 추가 시: "증명사진 촬영을 위해 카메라를 사용합니다.") |

#### App Privacy 라벨

- **"No Data Collected"** 선언 가능
- 모든 데이터 유형에서 "No" 선택
- 검증: ML SDK 텔레메트리 미전송 확인 필수

#### 연령 등급

**4+** (전체이용가)

#### 심사 기간

- 첫 제출: **24-48시간** (90%가 24시간 내 — Apple 공식)
- 대기 포함: 2-3일

---

## T4. ASO 키워드 전략

### 4-1. 경쟁 환경 요약

| 시장 | 상위 경쟁앱 | 공통 과금 모델 | MONKOS 차별점 |
|------|-----------|--------------|-------------|
| 한국 | 셀프증명, 픽미, 증명사진 앱 | 프리미엄/광고 | **완전 무료+광고 없음** |
| 일본 | 履歴書カメラ, 美肌証明写真, Bizi ID | 무료+광고/유료 인화 | **오프라인+서버 전송 없음** |
| 영어권 | PhotoAiD, Passport Photo Maker | 프리미엄/건별 과금 | **무료+프라이버시** |

**시장 공백**: "완전 무료 + 광고 없음 + 서버 전송 없음"을 동시에 만족하는 증명사진 앱은 **현재 시장에 없음**. 이것이 MONKOS Crop의 핵심 USP.

---

### 4-2. 한국어

**제목/부제**

| 스토어 | 제목 | 부제/짧은 설명 |
|--------|------|---------------|
| Google Play | MONKOS 크롭 — 증명사진·여권사진 무료 | 26국 규격 자동 크롭 + 배경 제거. 완전 무료, 광고 없음, 서버 전송 없음. |
| App Store | MONKOS 크롭 - 증명사진 여권사진 | 무료 배경제거 + 26국 규격 자동크롭 |

**핵심 키워드**: 증명사진, 여권사진, 증명사진 어플, 반명함, 증명사진 크롭, 여권사진 무료, 배경 제거, 셀프 증명사진

**설명문 초안**

```
증명사진, 여권사진을 스마트폰에서 무료로 만드세요.

MONKOS 크롭은 완전 무료입니다.
광고 없음. 인앱결제 없음. 사진이 서버로 전송되지 않습니다.

■ 핵심 기능
• AI 배경 제거 — 복잡한 배경도 깔끔하게 흰색으로 교체
• 26국 증명사진 규격 내장 — 한국, 일본, 미국, 중국, EU 등
• ICAO 국제 규격 자동 크롭 — 얼굴 위치·크기 자동 맞춤
• MONKOS 검수 — 기울기, 정면, 밝기, 얼굴 크기 AI 검증

■ 지원 문서 유형
여권사진 | 주민등록증 | 운전면허증 | 반명함판
이력서사진 | 비자사진 | 외국인등록증

■ 왜 MONKOS 크롭인가?
✓ 완전 오프라인 — 비행기 모드에서도 작동
✓ 사진이 절대 기기 밖으로 나가지 않음
✓ 26국 공식 규격 데이터 내장
✓ 무료. 진짜 무료. 숨은 비용 없음.

■ 사용법
1. 국가와 문서 유형 선택
2. 사진 업로드
3. 배경 자동 제거
4. 규격에 맞게 자동 크롭
5. 저장 완료!

개인정보 보호: 모든 처리는 기기에서만 이루어집니다.
사진, 얼굴 데이터, 어떤 정보도 서버로 전송하지 않습니다.
```

---

### 4-3. 일본어

**제목/부제**

| スtoア | タイトル | サブタイトル/短い説明 |
|--------|---------|-------------------|
| Google Play | MONKOS クロップ — 証明写真・パスポート写真 | 26ヶ国規格対応の自動クロップ+背景除去。完全無料・広告なし・サーバー送信なし。 |
| App Store | MONKOS クロップ - 証明写真 | 無料 背景除去+26ヶ国規格クロップ |

**核心キーワード**: 証明写真, パスポート写真, マイナンバー写真, 履歴書写真, 証明写真 アプリ, 証明写真 無料, 背景除去, 証明写真 サイズ

**説明文 草案**

```
証明写真・パスポート写真をスマホで無料作成。

MONKOS クロップは完全無料です。
広告なし。アプリ内課金なし。写真がサーバーに送信されることはありません。

■ 主な機能
• AI背景除去 — 複雑な背景もきれいに白色に変換
• 26ヶ国の証明写真規格内蔵 — 日本、韓国、アメリカ、中国、EU等
• ICAO国際規格自動クロップ — 顔の位置・サイズを自動調整
• MONKOS検査 — 傾き、正面、明るさ、顔サイズをAI検証

■ 対応書類
パスポート | マイナンバーカード | 運転免許証
履歴書 | ビザ | 在留カード

■ なぜMONKOS クロップ？
✓ 完全オフライン — 機内モードでも動作
✓ 写真がデバイス外に出ることは絶対にありません
✓ 26ヶ国の公式規格データ内蔵
✓ 無料。本当に無料。隠れたコストなし。

■ 使い方
1. 国と書類タイプを選択
2. 写真をアップロード
3. 背景を自動除去
4. 規格に合わせて自動クロップ
5. 保存完了！

プライバシー保護：すべての処理はデバイス上でのみ行われます。
写真、顔データ、いかなる情報もサーバーに送信しません。
```

---

### 4-4. 영어

**Title / Subtitle**

| Store | Title | Subtitle / Short Description |
|-------|-------|------------------------------|
| Google Play | MONKOS Crop — Passport & ID Photo Free | Auto-crop to 26 countries' specs + background removal. 100% free, no ads, no data sent to servers. |
| App Store | MONKOS Crop - Passport ID Photo | Free Background Removal & Auto Crop |

**App Store Hidden Keywords** (100자):
`passport,photo,crop,visa,ID,size,ICAO,headshot,resume,background,remover,offline,free,privacy`

**Core Keywords**: passport photo, ID photo, passport photo crop, visa photo, photo background remover, ID photo free, passport photo app, ICAO photo

**Description Draft**

```
Create passport photos and ID photos on your phone — completely free.

MONKOS Crop is 100% free.
No ads. No in-app purchases. Your photos never leave your device.

KEY FEATURES
• AI Background Removal — Remove any background and replace with white
• 26 Countries Built-in — USA, UK, Canada, Japan, Korea, China, EU, and more
• ICAO Auto-Crop — Automatically positions and sizes your face to official specs
• MONKOS Inspection — AI verifies tilt, centering, brightness, and face size

SUPPORTED DOCUMENTS
Passport | Visa | Driver's License | National ID
Resume/CV | Work Permit | Residence Card

WHY MONKOS CROP?
✓ Fully Offline — Works in airplane mode
✓ Your photos NEVER leave your device
✓ 26 countries' official specifications built in
✓ Free. Actually free. No hidden costs.

HOW TO USE
1. Select country and document type
2. Upload your photo
3. Background automatically removed
4. Auto-cropped to official specifications
5. Save and done!

PRIVACY
All processing happens on your device only.
No photos, face data, or any information is ever transmitted to any server.
```

---

## T5. 배포 파이프라인 제안서

### 5-1. 최종 추천 경로

| 플랫폼 | 래핑 방식 | 근거 |
|--------|----------|------|
| **Android** | **Capacitor 8** | 에셋 번들 → 즉시 오프라인, 네이티브 플러그인, Chrome 무의존, iOS 겸용 |
| **iOS** | **Capacitor 8** | 동일 코드베이스, 네이티브 브릿지로 4.2 리젝 회피, 플러그인 생태계 |

TWA는 차선. PWABuilder/RN WebView는 비추.

---

### 5-2. Android 빌드 스텝 (Capacitor)

```
Phase 1: 프로젝트 초기화
├─ npm install @capacitor/core @capacitor/cli
├─ npx cap init (appId: ai.monkos.crop, appName: MONKOS Crop)
├─ capacitor.config.ts → webDir: 빌드 출력 폴더 설정
├─ npm install @capacitor/android
└─ npx cap add android

Phase 2: 네이티브 플러그인
├─ npm install @capacitor/camera @capacitor/filesystem @capacitor/share
├─ npm install @capacitor/splash-screen @capacitor/haptics
└─ npx cap sync

Phase 3: 빌드 & 서명
├─ npm run build (PWA 웹 빌드)
├─ npx cap sync android
├─ npx cap open android (Android Studio)
├─ signing config 설정 (upload keystore)
├─ Build → Generate Signed Bundle (AAB)
└─ Google Play Console 업로드

Phase 4: 스토어 등록
├─ Data Safety 폼 작성 (No data collected)
├─ 개인정보 처리방침 URL 등록
├─ IARC 콘텐츠 등급 설문 (전체이용가)
├─ 스크린샷 + 설명문 (한/일/영)
├─ 내부 테스트 → 프로덕션 제출
└─ 심사 대기 (1-2일 예상)
```

---

### 5-3. iOS 빌드 스텝 (Capacitor)

```
Phase 1: 플랫폼 추가
├─ npm install @capacitor/ios
├─ npx cap add ios
└─ npx cap sync ios

Phase 2: Xcode 설정
├─ npx cap open ios
├─ Bundle Identifier: ai.monkos.crop
├─ Team: Apple Developer 계정 선택
├─ Info.plist 권한 선언 (Photo Library, Photo Library Add)
└─ Signing: Automatically Manage Signing ✅

Phase 3: 빌드 & 제출
├─ npm run build → npx cap sync ios
├─ Product → Archive
├─ Distribute App → App Store Connect
├─ TestFlight 내부 테스트
└─ App Store 제출

Phase 4: 스토어 등록
├─ App Privacy Labels (No Data Collected)
├─ App Review Notes 작성 (온디바이스 ML, 오프라인 완결 강조)
├─ 스크린샷 + 설명문 (한/일/영)
├─ 연령 등급 설문 (4+)
└─ 심사 대기 (24-48시간 예상)

Phase 5: iOS WASM 검증 (필수)
├─ ONNX WASM-SIMD 실기기 테스트 (iPhone 12+ / iOS 16.4+)
├─ MediaPipe FaceMesh 메인 스레드 실행 확인
├─ 메모리 피크 모니터링 (2GB 한도)
└─ 불안정 시: CoreML 폴백 플러그인 개발 판단
```

---

### 5-4. 심사 대응 체크리스트

#### Google Play

- [ ] Data Safety 폼 제출 (No data collected)
- [ ] 개인정보 처리방침 페이지 작성 및 URL 등록
- [ ] IARC 콘텐츠 등급 설문 완료
- [ ] AAB 사이즈 200MB 이내 확인
- [ ] Photo Picker 사용 확인 (READ_MEDIA_IMAGES 미선언)
- [ ] ML SDK 텔레메트리 미전송 검증
- [ ] 스크린샷 최소 2장 (Phone), 태블릿 권장
- [ ] 스토어 리스팅 한/일/영 3개 언어 등록

#### Apple App Store

- [ ] App Review Notes 작성 (온디바이스 ML + 오프라인 + 프라이버시)
- [ ] Info.plist 권한 문구 검수 (한/일/영)
- [ ] App Privacy Labels (No Data Collected) 선언
- [ ] 연령 등급 설문 완료 (4+)
- [ ] 네이티브 스플래시 스크린 구현
- [ ] Share Sheet 연동 확인
- [ ] iOS 실기기 WASM/ONNX 성능 테스트
- [ ] 스크린샷: iPhone 6.7"(필수) + 6.1" + iPad 12.9"

---

### 5-5. 타임라인 제안

```
Week 1: Capacitor 프로젝트 셋업 + Android 빌드
├─ Day 1-2: Capacitor init + 플러그인 통합 + 웹 빌드 연동
├─ Day 3-4: Android 빌드 + 내부 테스트 (실기기)
└─ Day 5: Google Play Console 등록 + 내부 테스트 트랙

Week 2: Google Play 제출 + iOS 시작
├─ Day 1: 개인정보 처리방침 작성 + Data Safety 폼
├─ Day 2: 스크린샷 + 스토어 리스팅 (한/일/영)
├─ Day 3: Google Play 프로덕션 제출 ← 선행
├─ Day 4-5: iOS Xcode 빌드 + 실기기 WASM 테스트

Week 3: iOS 제출 + 양 플랫폼 승인
├─ Day 1-2: iOS TestFlight + WASM 안정성 확인
├─ Day 3: App Store 제출
├─ Day 4-5: 심사 대기 + 승인
└─ Google Play 승인 (Week 2 제출 기준 1-2일)
```

**Google Play 선행 이유**: 심사 유연 + TWA 매니페스트 이미 존재 + Data Safety가 간단. Apple은 4.2 리스크 + WASM 테스트 필요 → 후행이 안전.

---

### 5-6. 핵심 리스크 & 대응

| 리스크 | 심각도 | 대응 |
|--------|--------|------|
| Apple 4.2 리젝 | 중간 | Capacitor 네이티브 플러그인 3-4개 + Review Notes 강조 |
| ONNX iOS WASM-SIMD 불안정 | 높음 | 실기기 테스트 선행. 불안정 시 CoreML 폴백 플러그인 |
| MediaPipe iOS Worker 행 | 높음 | 메인 스레드 실행으로 전환 (성능 트레이드오프) |
| APK 80MB 사용자 저항 | 낮음 | 200MB 한도 내. 증명사진 전문 앱으로 합리적 |
| 개인정보 처리방침 미비 | 중간 | monkos.ai/privacy 사전 작성 필수 (양 플랫폼 필수) |

---

## 출처

### Android
- [Bubblewrap GitHub](https://github.com/GoogleChromeLabs/bubblewrap) (v1.24.1, 2025-09)
- [TWA Quick Start — Android Developers](https://developer.android.com/develop/ui/views/layout/webapps/guide-trusted-web-activities-version2)
- [Capacitor 8 공식 문서](https://capacitorjs.com/) (v8.3.0, 2026-03)
- [PWABuilder GitHub](https://github.com/pwa-builder/PWABuilder) — Issue #5562 (빌드 불안정), #5470 (CLI 미지원)

### iOS
- [Capacitor iOS 문서](https://capacitorjs.com/docs/ios)
- [Apple App Store Review Guidelines §4.2](https://developer.apple.com/app-store/review/guidelines/)
- [ONNX Runtime Web iOS Issues](https://github.com/microsoft/onnxruntime/issues/15644) — WASM-SIMD 깨짐
- [MediaPipe iOS Worker Hang](https://github.com/google-ai-edge/mediapipe/issues/4680)
- [WKWebView Memory Limits](https://developer.apple.com/forums/thread/766309)

### 스토어 정책
- [Google Play Data Safety](https://support.google.com/googleplay/android-developer/answer/10787469)
- [Google Play Photo Permissions Policy](https://support.google.com/googleplay/android-developer/answer/14115180)
- [Google Play AAB Size Limits](https://support.google.com/googleplay/android-developer/answer/9859372) — 200MB (2026-01)
- [Apple App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/)
- [Apple NSPhotoLibraryUsageDescription](https://developer.apple.com/documentation/BundleResources/Information-Property-List/NSPhotoLibraryUsageDescription)

### ASO
- 경쟁앱 분석: Google Play / App Store 검색 기반 (2026-05 시점)
- [ASO Guide 2026](https://asomobile.net/en/blog/aso-in-2026-the-complete-guide-to-app-optimization/)

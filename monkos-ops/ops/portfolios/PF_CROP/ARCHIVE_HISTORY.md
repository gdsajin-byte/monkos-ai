# PF_CROP 히스토리 아카이브

> 원본: PF_CROP/README.md에서 분리 (2026-07-20)
> append-only. 편집·삭제 금지.

| 날짜 | 주체 | 내용 | 산출물 | 상태 |
|------|------|------|--------|------|
| 03/11 | 막내 | crop-engine 독립 서비스 착수 | — | ✅ |
| 03/11~12 | 막내 | FaceMesh 브라우저 연동 + vanilla 전환 + KR/JP 크롭 UX | 커밋 다수 | ✅ |
| 03/17 | 막내 | 포털 /crop 정식 등록 + 화이트 모드 전환 | `1f6a214`, `d5d8c06` | ✅ |
| 03/17~18 | 막내 | 크롭앱 UX 보정 + 경로 핫픽스 + 404 해소 | `f452756`, `6d6eb86` | ✅ |
| 03/18 | 막내 | i18n 통합 (크롭앱 다국어) | `0e25b78` | ✅ |
| 03/18 | 막내 | 크롭앱 개발 명세서 + 기술 블로그용 콘텐츠 | works 적립 | ✅ |
| 03/26 | 민아 | CITADEL Phase 1에서 크롭 규격 허브 메타 최적화 | `8361d66` | ✅ |
| 03/26 | 쌍아 | PF_CROP 스냅샷 생성 (소급 불적용) | 본 문서 | ✅ |
| 04/08 | 쌍아→막내 | **크롭앱 오프라인 번들 제작** + FaceMesh 디버깅 완료 (USB 시연용) | ORDER, 세션 로그 | ✅ |
| 04/08 | 막내 | **Electron Win 빌드** — 크롭앱 오프라인 실행 정상 동작 확인 | ORDER, 세션 로그 | ✅ |
| 04/25 | 막내2 | 크롭앱 코드 + 26국 정합성 전수 조사 — SPECS 객체 한국 2종 하드코딩, specs-data 미연결 확인 | [REPORT](../reports/REPORT_20260425_막내2_크롭앱구조및규격정합성.md) | ✅ |
| 04/25 | 막내3 | 26국 공식 규정 세부 조사 + 정수리·얼굴비율·여백 + A/B/C 그룹 분류 | [REPORT](../reports/REPORT_20260425_막내3_26국증명사진규정세부조사.md) | ✅ |
| 04/25 | 막내3 | 오류 판정 정밀 재검증 — 4건 중 2건 오탐 확정 (korea 안경, india 35×45 현행 정확) | [REPORT](../reports/REPORT_20260425_막내3_오류판정정밀재검증.md) | ✅ |
| 04/25 | 쌍아 | **PF_CROP Phase 1.5 신설** — specs 26국 ↔ 크롭앱 연동 설계 (URL 파라미터 + SPECS 확장 + 카드 진입 동선) | 본 문서 §3 Phase 1.5 | ⏳ 설계중 |
| 04/30 | 작가님 | **앱스토어 진출 결정** — 크롭앱(무료) 선행 → 증명사진앱(유료) 후행. GSC 진단 후 검색 유입 구조적 한계 확인 → 앱스토어 편입 전략 | — | ✅ |
| 04/30 | 작가님 | **Google Play 개발자 계정 등록** (MONKOS AI, ID: 70112966655193837, $25) | — | ✅ |
| 04/30 | 작가님 | **Apple Developer Program 가입** (W1803588193, $99/년) | — | ✅ 활성화 대기 |
| 04/30 | 막내1 | **크롭앱 본진 편입** — crop-offline → `monkos_AI/crop-app/` + PWA(manifest+SW) + 아이콘 + 다국어 감지 + 난독화 + TWA 준비 | `dbadd1a` | ✅ |
| 04/30 | 막내1~4 | **26국 증명사진 규격 전수조사** — 4명 병렬, 28건(여권/비자 분리), 공식 1차 출처 기반, 추정 환산 배제 | [REPORT×4](../reports/) | ✅ |
| 04/30 | 쌍아 | **배경 제거 엔진 PoC** — MediaPipe(거침 ❌) vs @imgly ISNet(준수 ✅). 배경 제거 = 크롭과 세트 기능으로 확정 | bg-test.html, bg-test2.html | ✅ |
| 04/30 | 작가님 | **Phase 2 전략 확정** — 완전 무료+광고 없음+인앱결제 없음, 배경 제거 필수 포함, 크롭 완료 후 퍼널(텔레그램 인화+MONKOS OG), 글로벌 다국어 localization | — | ✅ |
| 05/09 | 민아 | **iOS 네이티브 앱 전환 제안서** — SwiftUI 6화면, Phase 1 크롭 무료 → Phase 2 AI 통합, StoreKit IAP $1/컷 | [PROPOSAL_20260509_민아_IDPhoto_iOS네이티브앱_제안서.md](../proposals/PROPOSAL_20260509_민아_IDPhoto_iOS네이티브앱_제안서.md) | ✅ |
| 05/09 | 작가님 | **iOS 앱 로드맵 승인** — PF_CROP 확장으로 편입. Phase 1(크롭 무료) iMac 코드+M1 빌드 분리 운용. Apple Developer 가입 완료 확인 | — | ✅ |
| 05/12 | 쌍아 | **Xcode 15.2 설치 + MonkosCrop 프로젝트 생성** — SwiftUI MVP 4파일 (SpecData 9국, CropEngine Vision 얼굴인식, CropView 결과+저장, ContentView 홈+피커). Preview 렌더링 정상. Simulator는 iMac Intel 메모리 한계 → M1/M2 빌드로 분리 결정 | apps/MonkosCrop/ | ⏳ |
| 05/12 | 쌍아 | **Xcode Build Succeeded 확인** (iPhone SE 3rd gen 타겟). Preview paused 상태. 실기기 테스트 검토 — 작가님 아이폰 17(iOS 19) vs Xcode 15.2(iOS 17 지원 한계) = 실기기 연결 불가 판정. **결론: M1에 최신 Xcode 17.x 설치 필수** (iMac Intel+Ventura → Xcode 15.2가 맥스) | — | ⏳ |
| 05/12 | 막내1 | **iOS vs Android 네이티브 API 비교 분석** — 20개 영역×7개 항목 데이터표. iOS 핵심 4기능(얼굴인식/배경제거/이미지처리/ML추론) 압도적 우위 확인. 번들 56MB→0MB, 배경제거 80배 속도차. Android NNAPI deprecated 주의 | [REPORT](../reports/2026-05/REPORT_20260512_막내_iOS안드로이드_네이티브API비교분석.md) | ✅ |
| 05/13 | 쌍아 | **M1 원격 빌드 파이프라인 구축** — Tailscale VNC(ping 8ms) + SSH xcodebuild. iMac 코드→scp→M1 빌드→시뮬레이터→VNC 확인 | — | ✅ |
| 05/13 | 쌍아 | **M1 Xcode 26.5 시뮬레이터 빌드/실행 성공** — iPhone 17 Pro (iOS 26.5). Build Succeeded + 앱 실행 확인 | — | ✅ |
| 05/13 | 쌍아 | **Vision 얼굴 인식 디버깅** — iOS 시뮬레이터 Vision CoreML "Could not create inference context" 발견. CheckedContinuation 이중 resume 크래시 해결. CIDetector(구형) fallback 적용으로 시뮬레이터 동작 확보 | — | ✅ |
| 05/13 | 쌍아 | **웹 크롭 엔진 v2 Swift 이식** — 눈 43% 앵커 + 정수리=눈~턱 반전 + 헤어탑 여백 + 하단 축소. CIDetector bounds 기반 추정 (Vision 실기기 전환 시 정밀도 향상 예정) | CropEngine.swift | ⏳ |
| 05/13 | 쌍아 | **TestFlight 배포 파이프라인 전체 구축** — Apple Distribution 인증서 생성, 디바이스 등록(iPhone17 UDID), 앱 아이콘 전 사이즈 생성, Archive→업로드→수출규정→내부테스트그룹 | App Store Connect MonkosCrop | ✅ |
| 05/13 | 작가님 | **TestFlight 실기기 테스트 완료** — 속도 빠름 확인. 크롭 정확도는 웹 엔진 대비 부족 (CIDetector 한계). Vision 실기기 동작 여부 다음 빌드에서 확인 예정 | — | ⏳ |
| 05/13 | 쌍아 | **iOS/Android 네이티브 얼굴인식 엔진 비교 실측** — Vision 76pt iMac macOS에서 실행 확인. 동공/턱/윤곽 정확. ML Kit contour 모드 시뮬레이션. 양 플랫폼 동일 크롭 로직 적용 가능 판정 | 아래 §비교분석 + /tmp 시각화 | ✅ |
| 05/13 | 클로드 디자인 | **V1 프로토 UI 제작** — iOS 26 Liquid Glass 디바이스 프레임, 다크 HUD 3시안(V1 Safe/V2 Cinematic/V3 Editorial), 7화면 풀 플로우(Landing→5Step→Thanks), Tweaks 패널, ko/en/ja i18n, MONKOS 검수 시퀀스 연출 | Desktop/CROP APP/ (JSX+HTML) | ✅ |
| 05/13 | 작가님 | **V1 Safe 디자인 채택 + iOS 프로토 지시** — V1 다크 HUD 디자인으로 확정. Apple Vision으로 FaceMesh 대체하여 iOS 프로토앱 제작 지시 | — | ✅ |
| 05/14 | 막내1 | **웹 크롭 엔진 ↔ iOS V1 디자인 통합 설계 보고서** — crop.js 1163줄 정밀 분석(render/autoPlace/performCrop), iOS CropEngine 비교(패러다임 차이 5항·랜드마크 차이·좌표 변환), Step4 SwiftUI 구현 스펙(뷰 구조·CropState·computeMetrics·autoPlace 이식·performFinalCrop), 웹→SwiftUI 매핑 25항, 구현 5Phase 권고 | [REPORT](../reports/2026-05/REPORT_20260514_막내1_크롭앱_엔진통합설계.md) | ✅ |
| 05/14 | 막내1 | **Step4 웹 크롭 엔진 통합 구현 완료** — "프레임 고정+사진 이동" 패러다임으로 전면 교체. PhotoSpec 확장(faceMin/Max/Target/pxW/pxH), CropState struct, cropAutoPlace(), computeMetrics(), GuideOverlay(Canvas+Crown pin drag), performFinalCrop(CSS transform 재현), 코칭 메시지 ko/en/ja. macOS swiftc 빌드 성공 | SpecData/CropView/ContentView.swift | ✅ |
| 05/13 | 쌍아 | **V1 디자인 SwiftUI 이식 (특별승인)** — JSX 940줄 → SwiftUI 1,952줄(4파일). 7화면: Landing(데모 검수 루프)+Step1(6국 선택/검색)+Step2(갤러리 피커)+Step3(크롭 뷰포트+8단계 검수 애니+VERIFIED 스탬프)+Step4(배경)+Step5(결과+다운로드)+Thanks(AI Studio 프로모). V1 다크 HUD(#05080E/#00D4AA), ko/en/ja i18n, Vision 76pt + CropEngine 연동 | apps/MonkosCrop/ 4파일 교체 | ✅ |
| 05/13 | 쌍아 | **크로스플랫폼 수정 + iMac macOS PoC 빌드** — `#if canImport(UIKit)` 조건부 컴파일. PlatformImage typealias(UIImage/NSImage). swiftc 직접 빌드 → /tmp/MonkosCrop.app 실행 성공 | Package.swift + 조건부 컴파일 | ✅ |
| 05/13 | 쌍아 | **CGContext 좌표계 버그 수정** — ①뒤집힘: CGContext bottom-left origin에서 이미지 반전 → flippedRect 적용. ②크롭 위치 오차: CGContext drawRect 좌표 변환 불일치 → **CIImage 기반 렌더링으로 전면 교체** (crop→translate→scale→composite). 좌표 문제 근본 해결 | CropEngine.swift macOS 브랜치 | ✅ |
| 05/13 | 쌍아 | **Apple Vision PersonSegmentation 배경 제거 구현** — `VNGeneratePersonSegmentationRequest(.accurate)` + `CIBlendWithMask` 합성. 마스크 1회 생성 후 캐시, 배경색 변경은 즉시 재합성. ISNet 40MB 번들 불필요 | CropEngine.swift | ✅ |
| 05/13 | 작가님 | **1차 E2E 확인** — iMac macOS에서 V1 프로토 풀 플로우 테스트 완료. 크롭 정확도 확인(Vision 턱끝점 정확), 배경 제거 품질 ISNet 대비 **우위** 판정. 디테일 조정 필요하나 기본 흐름 동작 확인 | — | ✅ |
| 05/13 | 쌍아 | **Phase 2 디테일 작업** — ①macOS 스타일 수정(buttonStyle/textFieldStyle/scrollContentBackground/NSWindow bg) ②VERIFIED 스탬프 제거 ③오버레이 흰색 가로선+꺽은선 라벨로 심플화 ④정수리 드래그 핸들 ⑤메트릭 실측 전환(EYE/HEAD/TOP/BTM) ⑥신호등 판정(초록/노랑/빨강) ⑦줌 슬라이더+사진 드래그 이동 | ContentView/CropView 다수 수정 | ✅ |
| 05/13 | 쌍아 | **검수 시퀀스 재설계** — 자동 8단계→멘트 기반 단계별 시퀀스. 측정시작→눈→턱→정수리(노란점선)→정수리확인(사용자대기+드래그)→분석→결과(정밀조정/검수완료)→완료. InspectionState를 phase 5/7 자동정지 방식으로 | SpecData+ContentView | ✅ |
| 05/13 | 작가님 | **Phase 2→3 방향 결정** — ①배경→크롭 순서 확정(줌 인/아웃 시 누끼 상태 필수) ②정밀 교정은 별도 분기(기본=자동→다운로드, 정밀=프레임 고정+원본 줌/패닝) ③기본 플로우는 간결하게, 전문가 기능은 옵션으로 | — | 방향 확정 |
| 05/14 | 쌍아 | **Step 순서 재배치** — Step3(배경색선택+누끼) → Step4(측정+검수+교정) → Step5(완료). 원본 전체 누끼 후 프레임 안에서 교정, 크롭은 최종 승인 시점 | ContentView Step3/4 재구성 | ✅ |
| 05/14 | 막내1 | **웹 크롭 엔진 ↔ iOS 통합 설계 보고서** — crop.js 1163줄 정독, render/autoPlace/performCrop 정밀 분석, 웹→SwiftUI 25항목 매핑, 5Phase 구현 계획. 핵심 발견: "프레임 고정+사진 이동" vs "사진 고정+영역 잘라냄" 패러다임 차이 | [REPORT](../reports/2026-05/REPORT_20260514_막내1_크롭앱_엔진통합설계.md) | ✅ |
| 05/14 | 막내1 | **Step4 웹 엔진 통합 구현** — CropState(프레임좌표 랜드마크+imgOffset/Scale) + cropAutoPlace(웹 직역) + computeMetrics(실시간 수치) + GuideOverlay(Canvas 마스크+가이드선+핀+배지) + performFinalCrop(좌표역산+CIImage crop) | SpecData/CropView/ContentView 3파일 | ✅ |
| 05/14 | 쌍아 | **드래그/커서/크롭 버그 수정** — GuideOverlay hitTest 분리, 상단1/4 정수리드래그+나머지 핸드커서, performFinalCrop 좌표 역산 수정 | ContentView | ✅ |
| 05/14 | 작가님 | **크롭 결과 포토샵 검증 통과** — 여권규격 300dpi 확인 ✅. 중심선 개선 아이디어: medianLine 기반 + 1mm노랑/2mm빨강 + 스냅 자석 | — | ✅ |
| 05/14 | 쌍아 | **중심선 개선 구현 (직접수정)** — CropState에 noseTip/mouthCenter 추가, faceCenterX=눈+코+입 3점 평균, centerSignal 1mm초록/2mm노랑/2mm+빨강, 0.3mm 자석 스냅 | SpecData/CropView/ContentView | ✅ |
| 05/14 | 작가님 | **미국 여권 51×51 검증 통과** — 정사각형 크롭+출력 정상. Step5 프리뷰 프레임 하드코딩(35×45) 발견→규격 동적 비율로 수정 | — | ✅ |
| 05/14 | 쌍아 | **캐나다 경고 시스템 구현** — DocSpec에 warning 필드(i18n) 추가, Step1에서 규격 선택 시 노란 경고 박스. 캐나다 전문사진사 필수 경고 | SpecData/ContentView | ✅ |
| 05/14 | 쌍아 | **UK 여권 카드 추가** — 35×45mm, 29~34mm 얼굴, 600×750px, HMPO 표준 | SpecData | ✅ |
| 05/14 | 막내2 | **여권/비자 규격 전수조사 v2** — 20개국 1차 출처 기반, 테이블 4종(ICAO 기본/통과국/별도 규정 전체 필드/앱 반영용), 사이즈 6종 발견, 순수 ICAO 통과국 사실상 없음 | [REPORT_v2](../reports/2026-05/REPORT_20260514_막내2_여권비자규격_전수조사v2.md) | ✅ |
| 05/14 | 막내2 | **글로벌 경쟁사+ICAO 커버리지 분석** — 9개 경쟁사 비교, ICAO 비호환 ~30국 전수 발굴, Tier 1(4종)으로 ~170국 커버 가능, 경쟁사 "200국"=같은 규격 국가별 카운팅 확인 | [REPORT_경쟁사](../reports/2026-05/REPORT_20260514_막내2_글로벌여권규격_경쟁사+ICAO커버리지.md) | ✅ |
| 05/14 | 작가님 | **경쟁사(AiPassportPhoto) 실사 비교** — 정수리를 헤어탑으로 잡는 문제 확인(우리는 두개골 추정+핀 드래그), 어깨 부족 시 재촬영 요구(우리는 줌아웃), 유료 $1.5~$11(우리는 무료). 중국 파일용량 40~120KB 범위 내 확인 | — | ✅ |
| 05/14 | 쌍아 | **UI/UX 보정** — bgOptions 6종(미색·블루 추가), iPhone 크기 고정, 프레임 내 드래그 제한, 커버리지 코칭, faceTarget 33mm 통일(인도 37) | SpecData/ContentView | ✅ |
| 05/14 | 막내2 | **여권/비자 분기 국가** — 7국 사이즈 분기(일본·인도·캐나다·터키·사우디·UAE·필리핀), 2국 배경분기, 8국 동일. 일본 비자 45×45 신규, 51×51이 비자 국제표준 | [REPORT_분기](../reports/2026-05/REPORT_20260514_막내2_여권비자분기국가.md) | ✅ |
| 05/14 | 막내3 | **주요 10국 운전면허 규격** — 5국 여권동일, 4국 고유규격(JP 24×30, CN 22×32, VN/ID 30×40), 미국 현장촬영 | [REPORT_면허](../reports/2026-05/REPORT_20260514_막내3_주요국_운전면허규격.md) | ✅ |
| 05/14 | 쌍아 | **SpecData 확장** — 싱가포르·인도 카드 추가, 전체 faceTarget 보정 적용 | SpecData.swift | ✅ |
| 05/14 | 쌍아 | **Step1 4탭 재구성 + 기타 모드** — 여권/비자/면허/기타 탭 분리, 기타=커스텀 mm+DPI 입력+가이드 없는 자유 크롭. 비자 5국·면허 7국 DocSpec 추가. faceTarget 높이별 분기(≥40mm→33, <40mm→70%) | ContentView/SpecData | ✅ |
| 05/15 | 쌍아 | **신호등 컬러 버그 수정** — faceSignal 하드코딩(33-35mm) → 규격별 sweet spot 20-80% 동적 계산. 인도 여권/비자 px 630×810→600×600 정사각 수정 | SpecData.swift | ✅ |
| 05/15 | 쌍아 | **200개국 JSONL 데이터 구축** — 하드코딩 10국 → `countries.jsonl` 파일 분리. Package.swift resources 추가, Bundle.module 로딩. ISO alpha-2 코드에서 국기 이모지 자동 생성 | Resources/countries.jsonl + SpecData.swift | ✅ |
| 05/15 | 쌍아 | **대륙별 카드 UI 전면 교체** — 6대륙 그라데이션 카드 그리드(2열) + 국가 카드 그리드(2열) + 뒤로가기 + 검색 시 플랫 리스트. ContinentGroup 모델 + continentMeta(색상/점) | ContentView/SpecData | ✅ |
| 05/15 | 쌍아 | **비자 탭 200개국 표시** — icaoDefault에 ICAO 기본 비자(35×45) 자동 생성 추가. 탭 전환 시 selectedContinent 초기화 | SpecData/ContentView | ✅ |
| 05/15 | 막내1~4 | **200개국 전수조사 1차** — 4명 병렬(아시아+오세아니아 48국, 유럽 51국, 아메리카+중동 49국, 아프리카 54국). 비표준 73국 발견, 특이점 조사(AI 금지/배경색/발급위치별 차이 등) | REPORT×4 | ✅ |
| 05/15 | 막내1~4 | **200개국 전수조사 2차 검수** — 출처 신뢰도 재검증. A/B/C/X 등급 체계 도입. A+B=114건 반영 대상, C/X=33건 보류 | REPORT×4 (2차 검수) | ✅ |
| 05/15 | 쌍아 | **구글 시트 정리** — A+B 114건(시트1) + C/X 33건(미확인 추적) 테이블링. 대륙/국가id/규격/특이점/출처구분/신뢰등급 13컬럼 | [구글 시트](https://docs.google.com/spreadsheets/d/1xJevDKOWCCIjEGqamiaLSMaNi0tOrqN8BQpQ0pToCks/edit) | ✅ |
| 05/15 | 막내1 | **JSONL A+B 등급 반영** — 비표준 63국 docs 추가 + 인도 여권 51×51→35×45 + 중국 비자 head 15-22→28-33. 202국/커스텀 72국/ICAO 130국. swift build 통과 | countries.jsonl | ✅ |
| 05/15 | 쌍아 | **캐나다 50×70 배치 보정** — 세로 60mm+ 규격: faceTarget=fMax-1(35mm), eyeTarget=42%, 신호등 TOP/BTM/EYE 허용 범위 확대 | SpecData.swift | ✅ |
| 05/15 | 막내1 | **PF 폴더 구조 통일** — 21개 PF 전부 `PF_{코드네임}/README.md` 구조로 git mv. 중복 4건 해소, YAML 3건 보정, 인덱스 갱신 | portfolios/ 전체 | ✅ |
| 05/15 | 쌍아 | **M4 원격 빌드 환경 구축** — Tailscale SSH(100.121.220.14) + Xcode 26.5 + Apple Developer 서명 인증서 + swift build 성공. iOS 플랫폼 8.5GB 다운로드 진행 중 | M4 han-macbookpro | ⏳ |
| 05/16 | 쌍아 | **M4 SSH 접속 확립** — `ssh m4` config 등록(hansonngyi@100.121.220.14), 디바이스 프로파일 생성(M3 Pro/18GB/macOS 26.4.1/Xcode 26.5). iOS SDK 다운로드 완료 확인 | devices/m4/DEVICE_PROFILE.md | ✅ |
| 05/16 | 쌍아 | **iOS 빌드 이슈 3건 해결** — ①Bundle.module→Bundle.main(SPM vs Xcode 프로젝트) ②countries.jsonl pbxproj 리소스 등록 ③DEVELOPMENT_TEAM(ZPMVHPDUHW) 서명 설정 + Keychain unlock | project.pbxproj, SpecData.swift | ✅ |
| 05/16 | 쌍아 | **iPhone 실기기 설치 + 실행 성공** — M4→iPhone(26.4.2) devicectl install + launch. 개발자 모드 활성화 필요 확인. NSPhotoLibraryAddUsageDescription + NSCameraUsageDescription 권한 추가 | Info.plist | ✅ |
| 05/16 | 작가님 | **iPhone 실기기 E2E 확인** — 앱 정상 동작. 다운로드 시 이전 규격 캐시 표시 의심 — saveToDisk 에러 콜백 미구현으로 저장 실패 무시 가능성. 후속 수정 대상 | — | ⏳ |
| 05/16 | 작가님 | **IDPASS 네이밍 확정** — 앱 브랜드 MONKOS CROP → IDPASS (powered by MONKOS AI). 경쟁 조사 완료: 기존 IDPASS 서비스는 신원인증 영역, 증명사진과 충돌 없음 | — | ✅ |
| 05/16 | 막내1 | **IDPASS Landing 리디자인 + 브랜딩 변경** — Hero(IDPASS 로고+태그라인) + Phone Demo(18초 루프 애니) + 하단 5섹션. 앱 전체 MONKOS CROP → IDPASS 변경 | ContentView/SpecData | ✅ |
| 05/16 | 쌍아 | **Phone Demo 실사 이미지 적용 + Vision 실측 좌표 보정** — 여성 셀카 4종(be/bg/crop/passport). 프레임 3:4→1:1(51×51 규격). Vision으로 눈/턱/정수리 실측 → 줌인 scale 1.44/offset 0.136 수학적 계산 | Resources/ + ContentView | ✅ |
| 05/16 | 쌍아+작가님 | **데모 애니메이션 시퀀스 확정** — SCANNING→BG REMOVE→CROP(줌인)→INSPECT(검수: 눈→턱→정수리→HEAD 측정)→PASS→여권(PASSPORTUSA+스탬프 쾅)→블러+IDPASS 타이포. 디버그 스텝 모드 동기화 | ContentView | ✅ |
| 05/16 | 작가님 | **Landing 구조 개편 확정** — 하단 5섹션 제거 → 4서비스카드(여권/비자/면허/커스텀) 배치. Landing=종류선택 → Step1=대륙/국가선택. 기존 Step1 4탭이 Landing으로 올라옴 | — | ✅ |
| 05/16 | 쌍아 | **Landing 구조 개편 구현** — 4서비스카드(철창이 실사 이미지) 2×2 그리드. Step1 4탭 삭제. IDPASS 로고→Landing 복귀. CTA/푸터 제거. 한국 비자 규격 추가(kr-visa) | ContentView/CropView/countries.jsonl | ✅ |
| 05/16 | 쌍아+작가님 | **Landing 푸터 확정** — 보라 몽키 로고 + "powered by MONKOS AI" + "© 2026 MONK STUDIO". IDPASS=초록 / MONKOS=보라 보색 브랜드 분리 | ContentView | ✅ |
| 05/19 | 쌍아 | **ContentView.swift 3파일 분리** — 1,900줄→1,155줄. DemoAnimation.swift(401줄, 상태머신+PhoneDemoView) + LandingView.swift(329줄, Hero+카드+푸터) 분리. bundleImage() 공유 함수. swift build 성공 | DemoAnimation/LandingView/SpecData | ✅ |
| 05/19 | 쌍아 | **Step1 대륙카드 UI 보정** — 컬러 점 제거, 정사각형(1:1) 적용(GeometryReader), 영문 타이틀만 표기 + "N countries" accent | ContentView | ✅ |
| 05/19 | 쌍아 | **SpecData 단일값 head 파싱 수정** — head "38" 같은 단일값이 무시되던 버그. fMin=v-2, fMax=v+2, faceTarget=작가님 지정값. 25건 국가 적용 | SpecData.swift | ✅ |
| 05/19 | 쌍아→막내1 | **IDPASS Step2 규정카드 지시서 발행** — 철창이 시안 기반 촬영 가이드+규정 카드+공식 링크. Phase 1 HTML 프로토→승인→Phase 2 SwiftUI | [ORDER](../../orders/2026-05/ORDER_20260519_iMac쌍아_막내1_IDPASS_Step2_규정카드.md) | ⏳ |
| 05/19 | 막내1 | **Step2 규정카드 Phase 1 완료** — HTML 프로토 3국 전환(러시아/한국/미국). 규정 카드+체크리스트+공식 링크 동작. 작가님 승인 대기 | idpass_upload_v5_proto.html | ⏳ 승인대기 |
| 05/19 | 막내2 | **SPECS 페이지 현황 파악 + 리디자인 로드맵** — render-specs.js 666줄 전수 분석, 3소스 갭 분석, 경쟁사 3곳 벤치마크, 4Phase 로드맵. 핵심: 3소스 정본 분리=헌법 위반, 실사 전무, 26건 vs 경쟁사 200국+ | [REPORT](../reports/2026-05/REPORT_20260519_막내2_SPECS페이지_현황파악_리디자인로드맵.md) | ✅ |
| 05/19 | 쌍아 | **카카오 로그인 plusfriends scope 제거** — KOE205 에러 해소. portal prod 배포 (rev 00249) | portal/lib/auth.js | ✅ |
| 05/20 | 쌍아+막내1 | **CropEngine 규격별 동적 비율 보정** — FACE_TARGET_RATIO 33/45 하드코딩→spec.faceTarget/heightMM 동적. 이미지 비율 왜곡 수정(minScaleForFit). 가이드 이미지 23장 재생성 ×5회 | CropEngine.swift, MonkosCropApp.swift | ✅ |
| 05/20 | 쌍아 | **Step2 가이드 이미지 UI 적용** — 실루엣→규격별 가이드 이미지. 철창이 디자인 리팩터(좌 높이+이미지+우 얼굴범위+하단 배지). CROWN/CHIN 영어 통일. 다국어 i18n | ContentView.swift, SpecData.swift | ✅ |
| 05/20 | 쌍아 | **coverageShort 오탐 수정** — 세로 규격(h≥60) threshold 80%로 완화. 얼굴 표기 faceMin–fMax 범위로 변경. warning Step1→Step2 이동 | ContentView.swift | ✅ |
| 05/20 | 철창이+쌍아 | **브라질 공식 소스 검증** — gov.br/pf "현장 촬영 원칙" 확인. warning 추가. 비자 ICAO 추가. standard 빈 경우 ICAO 폴백 제거 | countries.jsonl | ✅ |
| 05/20 | 철창이 | **1차 교차검증 보고서** — 82건 반영 대상. B→A 5건, C→A 1건, 신규 ~64건, 오류 수정 3건. 프랑스 흰배경 금지 등 핵심 발견 | MONKOS_규격검증_1차_철창_20260520.md | ✅ |
| 05/20 | 쌍아 | **막내1 전면 반영 지시서 발행** — 82건 jsonl+시트+가이드+커밋·푸시 | ORDER | ⏳ |
| 05/20 | 막내1 | **철창이 1차 검증 82건 전면 반영** — countries.jsonl: 72→145국 docs 보유(+73국 신규). documents 112→186(+74). 핵심: ID 40x60+빨강, FR 흰배경금지, DE 디지털전용, UAE 3종분리, AR 40x40, NG 600DPI. 가이드 이미지 23→25장 재생성. seed.sql 재생성 | countries.jsonl, seed.sql, size-*.webp 25건 | ✅ |
| 05/21 | 막내2 | **크롭 결과물 비율 왜곡 전수조사** — 근본 원인: performFinalCrop()이 JSONL px 값을 출력 크기로 직접 사용하나 px/mm 비율 불일치 시 sx≠sy 비균일 스케일링 발생. 187건 스캔 결과 4건 불일치(cn-visa 9.1%, jp-id 28.6%, uk-passport/license 2.9%). P0=코드 수정(균일 스케일 강제), P1=데이터 4건 px 보정, P2=크롭 클램핑 비율 보정, P3=Step5 .fill→.fit | [REPORT](../reports/2026-05/REPORT_20260521_막내2_크롭비율왜곡_전수조사.md) | ✅ |
| 05/21 | 막내2 | **떙큐 페이지 C3 시안 적용** — thanksView 전면 교체: Before/After 슬라이더 카드(드래그+auto-sweep sin 진동) + SNS 6아이콘 행 + i18n 7키×3언어. AI Studio Promo 텍스트→슬라이더 인터랙티브 카드. ScrollView 전환. step5 현행 유지. swift build 성공 | CropView/ContentView/SpecData | ✅ |
| 05/21 | 쌍아 | **비율 왜곡 근본 수정** — PhotoSpec.pxW/pxH를 stored→computed(mm×DPI/25.4)로 변경. DPI 국가별(300기본, RU/NG 600)+커스텀(72/300/600). faceTarget JSONL explicitFaceTarget 파싱(UK=31, CN=30) | CropEngine/SpecData/ContentView | ✅ |
| 05/21 | 막내3 | **비자 128국 일괄 추가** — 쉥겐 27+개별 8+복제 93. 비자 보유 24→151국, 문서 193→320건 | countries.jsonl | ✅ |
| 05/21 | 쌍아 | **떙큐 페이지 직접수정** — slider 이미지 크롭+Resources 배치, OG 카드 monkos.ai 링크, SNS→텔레그램+이메일, 인화 서비스 카드(한국어 전용), i18n 보정 | CropView/ContentView/SpecData | ✅ |
| 05/21 | 쌍아 | **M4 TestFlight 빌드** — pbxproj 파일등록(LandingView/DemoAnimation/slider), 카메라 권한 제거, M4 직접 빌드→아이폰 실기기 설치. 작가님 검증 "완성도 강력" | 308d4809 | ✅ |
| 05/22 | 쌍아 | **App Store Connect 등록** — M1 클론→Archive→업로드(build 2→3→4). 앱 이름 IDPASS, 무료, 4+등급, DSA 거래자 등록. pbxproj 리소스 16개 번들 등록 누락 수정, monkos-icon.png git 추가, 가이드 이미지 25장 번들 포함(119MB→1.5MB JPEG 압축), guideImageView Desktop경로→Bundle.main 전환 | App Store Connect + 커밋 4건 | ✅ |
| 05/22 | 쌍아 | **Package.swift guides 폴더 등록 + Bundle.module 분기** — SPM 빌드에서 가이드 이미지 로딩 정상화 | Package.swift, ContentView.swift | ✅ |
| 05/22 | 4060/막내 | **ML Kit Subject Segmentation 배경제거 품질실측** — Android 테스트앱 제작(Kotlin Compose), 실기기(Galaxy M33) 실측 완료. ML Kit 5장 성공(평균 1.8초) vs ISNet ONNX 5장 성공(평균 18.8초) → **ML Kit 10배 빠르고 번들 0MB, 채택 추천**. Face Detection contour 133pt(Apple Vision 76pt 대비 1.75배) + 10 landmark → 크롭 로직 이식 가능 판정 | [REPORT](../reports/2026-05/REPORT_20260522_4060막내_MLKit배경제거_품질실측.md) + `apps/monkos-crop-android-test/` | ✅ |
| 05/23 | 쌍아 | **앱스토어 등록 지시서 발행** — M1↔M4 교차 빌드 히스토리 종합, Phase 0(환경 동기화) 포함. M4/쌍아 수신 | 지시서 2건 | ✅ |
| 05/23 | 쌍아 | **랜딩 푸터 몽코스 아이콘 수정** — bundleImage .fill→.fit. 20×20에서 보라 몽키 식별 불가 → monkosIconView 헬퍼 | LandingView.swift | ✅ |
| 05/23 | 쌍아 | **앱 표시 이름 IDPASS 변경** — PRODUCT_NAME=$(TARGET_NAME)→IDPASS 직접 지정. Info.plist CFBundleName/DisplayName 추가. iPhone 홈화면+Safari back 버튼 "IDPASS" 확인 | pbxproj, Info.plist | ✅ |
| 05/23 | M4/쌍아 | **M4 중복 레포 삭제** — ~/developer/monk_project/ 삭제. 정본 ~/monk_Project/ 단일화 | — | ✅ |
| 05/23 | 쌍아 | **랜딩 수치 표기 전면 삭제** — 서비스카드(200/50+/30+), 대륙카드(N countries), i18n "200개국"→"글로벌", WHY IDPASS 죽은 코드 삭제 | LandingView/ContentView/SpecData | ✅ |

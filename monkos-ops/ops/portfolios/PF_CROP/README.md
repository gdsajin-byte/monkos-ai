---
type: portfolio
id: PF_CROP
name: CROP
subject: MONKOS Crop — ICAO 규격 자동 크롭 도구 + 특허 출원
created: 2026-03-11
owner: 작가님
leads: 쌍아(설계), 막내(실행)
status: active
---

# PF_CROP — MONKOS Crop + 특허

> FaceMesh + ICAO 규격 검증 기반의 자동 크롭 도구. 독립 URL(/crop), SEO 메타 최적화, 특허 출원까지 포함.
> 브라우저 단독 동작(서버 불필요) — 경쟁 우위이자 특허 핵심.

---

## 1. 비전

**"여권사진 크롭을 브라우저에서 1초 만에 — 서버 전송 없이 개인정보 보호"**

### 왜 이것을 하는가

- 기존 증명사진 크롭은 포토샵/스튜디오 전용 — 접근성 낮음
- FaceMesh(MediaPipe)로 브라우저 단독 크롭 가능 → 서버 비용 0원, 개인정보 서버 전송 불필요
- ICAO 9303 국제 규격 자동 검증 → 규격 불합격 방지
- 특허 출원 대상 기술 — "브라우저 기반 ICAO 규격 자동 검증 및 크롭"

### 성공 지표

| 지표 | 시작점 | 4주 목표 | 12주 목표 |
|------|--------|---------|----------|
| /crop 페이지 유입 | 측정 예정 | 측정 예정 | 측정 예정 |
| 크롭 정확도 (ICAO 통과율) | 측정 예정 | 95%+ | 98%+ |
| 특허 출원 상태 | 미출원 | 출원 준비 | 출원 완료 |

---

## 2. 히스토리

> **append only. 수정·삭제 금지.** 신규 항목은 하단에 추가.
> ⚠️ 소급 불적용(ch4 9조 5항): 아래는 PF 생성 시점(03-26)의 주요 마일스톤 요약.

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
| 05/23 | 쌍아 | **베트남 비자 faceTarget 47→40 보정** — head 미지정 시 디폴트 fMax-1=47 과대. 범위 36~48 중간값 40 명시 | countries.jsonl | ✅ |
| 05/23 | 쌍아 | **🔴 줌 시 가이드라인 이탈 버그 수정** — rescaleAll 확대 기준점이 프레임 중심이었으나 이미지 중심이어야 함. 5/14 막내1 웹→Swift 이식 시 crop.js의 `FW/2 + imgPos.x` 패턴을 `step4FrameSize.width/2`로 offset 누락. 웹 원본 615줄 주석 "스케일 중심 = 사진의 실제 시각 중심 (imgPos 반영)" 대조 확인 | ContentView.swift | ✅ |
| 05/23 | 쌍아+작가님 | **App Store Connect 14개 언어 리스팅 입력** — ko/en/ja/zh/es/fr/de/pt-BR/ar/vi/id/ru/hi/it. 앱 이름 "IDPASS 증명사진", 부제, 프로모션, 설명, 키워드 전 언어 완료. CDP+작가님 수동 협업 | App Store Connect | ✅ |
| 05/23 | 쌍아 | **스크린샷 8장 리사이즈(6.9"+6.5") + JPEG 변환 + 업로드** — PNG 투명도 에러 해결. 시간순 재배치 | App Store Connect | ✅ |
| 05/23 | 쌍아 | **IDPASS 전용 개인정보처리방침 페이지** — monkos.ai/privacy-idpass 생성 + 포털 prod 배포. 데이터 수집 없음 명시 | portal/public/privacy-idpass.html | ✅ |
| 05/23 | M4/쌍아 | **앱 아이콘 R2(타이트) 교체 + build 6 Archive + 업로드** — 철창이 디자인 R2 채택. iMac→M4 SCP 전송. 전 사이즈 생성 + AppIcon 교체 | AppIcon.appiconset + App Store Connect | ✅ |
| 05/23 | M4/쌍아 | **알파 채널 에러 해소 + iPhone 전용 전환 + build 7 업로드** — build 6 알파 채널 거부(code 90717) → PNG→JPEG→PNG 변환으로 해결. iMac/쌍아 pbxproj iPad/Mac/Vision 타겟 제거 반영. build 7 Archive+업로드 성공 | App Store Connect build 7 | ✅ |
| 05/23 | M4/쌍아 | **Apple App Store 심사 제출 완료 (18:01 KST)** — build 7 선택. 14개 언어+스크린샷+개인정보방침+아이콘R2 완비 | App Store Connect | ✅ |
| 05/23 | 작가님 | **💡 Face ID 본인 검증 아이디어** — 갤러리 업로드 사진이 본인인지 Face ID로 대조. 딥페이크/도용 방지 + 실시간 촬영 제한 없이 신뢰성 확보. IDPASS(무료)보다 증명사진 앱(유료·AI 보정) 쪽 유료 기능 후보 | — | 💡 아이디어 |
| 05/23 | 4060/쌍아 | **IDPASS Android iOS 동기화** — 🔴 rescaleAll 기준점 버그 수정(imgOffset 반영, 웹 crop.js:615 대조), countries.jsonl iOS 정본 동기화(베트남 비자 faceTarget 40), 수치 표기 "200개국"→"글로벌" 3개국어, 앱 이름 IDPASS 확인, 디버그 로그 없음 확인 | Step4Screen.kt, I18n.kt, countries.jsonl | ✅ |
| 05/24 | M4/쌍아 | **M4 Android 빌드 환경 구축** — Android Studio Panda 4 + SDK API 36 + JDK 21 + keystore 생성 + debug/release 빌드 성공 | 환경 설치 + app-release.aab (25MB) | ✅ |
| 05/24 | M4/쌍아 | **PhoneDemoView Compose 포팅** — iOS DemoAnimation.swift 완전 이식. SCAN→BG REMOVE→CROP→INSPECT(EYE/CHIN/CROWN/HEAD)→PASSPORT→PASS STAMP→BLUR→END CARD 애니메이션 루프 | PhoneDemoView.kt + LandingScreen.kt | ✅ |
| 05/24 | M4/쌍아 | **에뮬레이터 전체 플로우 검증** — Pixel 7 API 35. Landing~Thanks 7단계 스크린샷 확인. 에셋 40종(iMac/쌍아 푸시) 적용 후 대륙카드+서비스카드+가이드 이미지 정상 | 스크린샷 7장 | ✅ |
| 05/24 | M4/쌍아 | **실기기(Galaxy M33) 테스트 — 12건 이슈 발견+수정** — ①fontScale 1.5 뻥튀기→IdpassTheme fontScale=1.0 고정 ②systemBarsPadding 미적용→추가 ③V1TopBar Step2~5 미표시→추가 ④대륙카드 텍스트 accent→흰색 ⑤Step3 자동배경제거→버튼 클릭 시만 ⑥연파랑 색상 7BA3C9→D6EAF8(iOS 정본) ⑦Step3 컨테이너 1:1 고정 ⑧Step4 뷰포트 높이 고정+가로 비율 축소 ⑨verticalScroll 제거(weight 무효 해소) ⑩MetricBox Column→Row 납작 ⑪브라질 경고 괄호 삭제 ⑫베트남 faceTarget 42 | 다수 파일 수정 | ✅ |
| 05/24 | M4/쌍아 | **🔴 ML Kit Subject Segmentation SIGBUS 크래시 분석** — `mobile_bg_removal_v8.f16.tflite` 모델이 Exynos GPU에서 DEQUANTIZE 연산 실패. GPU→SIGBUS, CPU→정상. 랜덤 선택이라 코드 제어 불가 | logcat 분석 | 🔴 |
| 05/24 | M4/쌍아 | **Android 배경제거 엔진 5종 실기기 비교** — ①ML Kit beta: SIGBUS ②ISNet small 42MB: 20초+형편없음 ③ISNet medium 84MB: 동일 ④ISNet 512px+NNAPI: 안따짐 ⑤MediaPipe Selfie Seg: 2초+안정+중간품질. **Selfie Seg이 유일하게 동작하나 출시 수준 미달(작가님 판단). Android 온디바이스 배경제거 현시점 프로덕션 불가** | SelfieSegmenter.kt, IsnetRunner.kt | ⏳ 판단대기 |
| 05/24 | 4060/쌍아 | **IDPASS Android Step1 자동선택 + 눈 메시지 반전 수정 + 폰트 스케일다운** — purpose 정확 매치 1개 시 아코디언 스킵 Step2 직행. coach_eye_low/high iOS 원본 일치(행동 지시+{v}%). 폰트 20sp↑ -2sp, 12~19sp -1sp (Roboto vs SF Pro 보정, 전 8파일) | Step1Screen/I18n/CropEngine/V1Theme 외 | ✅ |
| 05/25 | 4060/쌍아 | **RMBG-2.0 GPU 테스트 환경 세팅** — Python 3.10 venv + PyTorch CUDA 12.1 + transformers/flask 설치. rmbg2_server.py + rmbg2-test.html 작성 완료. HF 토큰 확인(환경변수). **모델 다운로드 blocked: gated repo 접근 승인 필요** | apps/crop-app/benchmark/ | ⏳ HF 승인 대기 |
| 05/29 | iMac/쌍아 | **IDPASS ASO 진단+최적화** — iris API로 15개 언어 메타데이터 전수 점검. de-DE 프로모션 버그(영어 키워드 복붙) 수정, ko 프로모션 오타("없슴"→"없음") PATCH. 부제 15개 언어 전부 정상 확인(appInfoLocalizations). 키워드는 라이브 잠김 → 키워드 4언어 최적화안+6.9" 스크린샷 카피 구성안 적립(1.0.1 반영) | [REPORT](reports/2026-05/REPORT_20260529_iMac쌍아_IDPASS_ASO최적화패키지.md) | ⏳ 1.0.1 대기 |
| 06/14 | 4060/쌍아 | **BiRefNet 배경 제거 PoC** — ZhengPeng7/BiRefNet(MIT 라이선스) 4060 GPU 실측. 평균 0.829s, VRAM peak 3197MB/8GB. 증명사진 경계 깔끔, 머리카락 디테일 우수. RMBG-2.0(CC BY-NC) 대비 상업 사용 무제한. Flask 서버+테스트 UI+벤치마크 5종 완료 | [COMPLETION](../../reports/2026-06/COMPLETION_20260614_4060쌍아_BiRefNet_PoC.md) | ✅ |
| 06/14 | iMac/막내1 | **배경 제거 모델+후처리 기법 리서치** — 후처리 6종 비교(ViTMatte Apache2.0 최상), 대안 모델 6종(BiRefNet MIT 현행 최적 확인), 하이브리드 파이프라인 사례(BiRefNet→ViTMatte 2단계 프로덕션 표준). 권고: BiRefNet+ViTMatte 2단계 | [REPORT](../../reports/2026-06/REPORT_20260614_막내1_CROP_배경제거모델리서치.md) | ✅ |

---

## 3. Phase 현황

> Phase별 상태를 갱신한다. 에이전트 투입 시 이 섹션이 "지금 뭘 해야 하는지"의 정본.

### Phase 0 — MVP + 포털 등록 ✅ 완료 (03-18)

| 항목 | 상태 | 담당 | 비고 |
|------|------|------|------|
| FaceMesh 브라우저 크롭 엔진 | ✅ | 막내 | vanilla JS |
| KR/JP 크롭 UX | ✅ | 막내 | 양국 대응 |
| /crop 포털 등록 | ✅ | 막내 | `1f6a214` |
| 화이트 모드 + 모바일 채움 | ✅ | 막내 | `d5d8c06` |
| i18n 통합 | ✅ | 막내 | `0e25b78` |
| 404 해소 (pricing/guide/crop) | ✅ | 막내 | `6d6eb86` |

### Phase 1 — SEO + 특허 ⏳ 진행 중

| 항목 | 상태 | 담당 | 비고 |
|------|------|------|------|
| 크롭 규격 허브 메타 최적화 | ✅ | 민아 | CITADEL Phase 1 연동 |
| 특허 명세서 작성 | ⏳ | 쌍아 | 어젠다 #25 |
| 특허 출원 | ❌ | — | 미착수 |
| 오프라인 번들 (USB 시연용) | ✅ | 막내 4/8 | FaceMesh 정상 |
| Electron Win 빌드 | ✅ | 막내 4/8 | 오프라인 실행 확인 |

### Phase 1.5 — specs 26국 ↔ 크롭앱 연동 ⏳ 설계중 (04-25 신설)

> 작가님 디렉션: "규격 가이드 카드 누르면 해당 수치가 자동 입력되고 크롭앱이 그에 맞게 크롭". specs 26국 데이터를 크롭앱 프리셋으로 연결 + 커스텀 px 입력 개설.

#### 현황 진단 (막내2·3 리포트 종합)

- 크롭앱 SPECS 객체: 한국 2종(passport 35×45, id 30×40)만 하드코딩
- specs-data.json: 26국 완비 (사이즈·px·DPI·headHeight·배경)
- 양쪽 데이터 통합 부재 — 동일 정보가 두 군데에서 따로 관리됨
- 크롭 로직 3그룹 (막내3 분류):

**A그룹 — ICAO 35×45 표준 10종** (공통 파라미터 1세트)
korea-passport, korea-resident, korea-drivers-license, japan-passport, japan-mynumber, eu-passport, eu-resume, australia-passport, singapore-passport, thailand-passport

**B그룹 — 사이즈만 다름 12종** (종별 비율 오버라이드)
korea-resume, korea-halfcard (30×40), japan-resume, japan-halfcard, japan-zairyu (30×40), canada-passport (50×70), vietnam-passport (40×60), china-passport (33×48), china-resume 1寸 (25×35), china-resume 2寸 (35×49), germany-resume (45×60), spain-DNI (26×32)

**C그룹 — 특수 규정 4종** (별도 로직)
us-passport (51×51 정사각형), india-passport (51×51, 단 우리 정본은 35×45 여권 — 51×51은 비자), indonesia-passport (40×60 흰색 — 적색 KTP 별건), uk-passport (정수리=모발제외 두개골 기준)
※ usa-headshot은 비표준 자유 사이즈 → 커스텀 입력 영역 (그룹 외)
※ spain-여권(35×45)은 A그룹, spain-DNI(26×32)는 B그룹
- 정수리 인식: FaceMesh 직접 감지 아님, 눈~턱 1:1 반전 추정 + 사용자 수동 보정

#### 작업 트랙

| # | 항목 | 상태 | 담당 | 비고 |
|---|------|------|------|------|
| 1.5-A | specs-data.json 보정 (indonesia 사이즈, uk headHeight·background) | ⏳ | 막내1 | [ORDER](../orders/ORDER_20260425_iMac쌍아→막내1_specs데이터보정.md) |
| 1.5-B | crop.js SPECS 객체 → specs-data.json import 전환 | ❌ | — | 단일 정본 원칙 |
| 1.5-C | 크롭앱 URL 파라미터 처리 (`/crop?spec=korea-passport`) | ❌ | — | 카드 진입 동선 |
| 1.5-D | specs-data.json에 cropConfig 필드 추가 (faceRatio·topMargin·bottomMargin 등) | ❌ | — | 26국 크롭 파라미터 정본 |
| 1.5-E | /specs/{slug} 페이지에 "이 규격으로 크롭" CTA 신설 | ❌ | — | specs → 크롭앱 동선 |
| 1.5-F | 크롭앱에 커스텀 px 입력 필드 (headshot·이력서 자유 사이즈 대응) | ❌ | — | usa-headshot 같은 비표준 |
| 1.5-G | A/B/C 그룹별 크롭 로직 분기 구현 | ❌ | — | C그룹 정사각형 별도 처리 |

#### 설계 원칙

1. **단일 정본**: specs-data.json이 모든 규격 정보의 정본. crop.js는 import해서 사용
2. **SEO 보존**: /specs 페이지의 Article+FAQPage+HowTo 스키마 유지 (4/24 AEO 1단계 자산)
3. **점진 적용**: A그룹(ICAO 표준 10종)부터 우선 적용 후 B·C 그룹 확장
4. **백워드 호환**: 기존 한국 2종 크롭 로직 동작 유지

### Phase 2 — 앱스토어 진출 + 배경 제거 ⏳ 진행 중 (04-30 신설)

> 작가님 디렉션: 크롭앱을 Google Play + Apple App Store에 무료 앱으로 등재. 배경 제거는 크롭과 세트 — 필수 기능. 증명사진 앱(유료)으로의 퍼널 입구.

#### 전략 결정사항 (04-30 작가님 확정)

- **무료 앱, 인앱결제 없음, 광고 없음** → 완전 무료 뱃지
- **하나의 앱 + 내부 다국어** (국가별 별도 앱 ❌)
- **앱스토어 localization**: 스토어 리스팅(제목/설명/스크린샷)을 한/일/영 별도 구성
- **결제 시스템 불필요**: 기능 코드만 올림
- **퍼널**: 크롭 완료 후 "편의점 인화(텔레그램 공유)" + "AI 전문 증명사진 — MONKOS" OG 카드 2개
- **앱 플로우**: 사진 업로드 → 국가/문서 선택 → 배경 제거/교체(흰색) → 규격 크롭(ICAO) → 다운로드 → 퍼널 카드
- **사이트 유도**: "구매/결제" 직접 CTA 금지. "AI 증명사진도 만들어보세요" 수준의 자연스러운 소개
- **앱 예상 사이즈**: ~100MB (크롭 16MB + 배경 제거 모델 40MB + 국가 데이터/디자인)
- **눈 위치 표기 주의**: 공식 규정 vs 권장 가이드 구분 필수 (ICAO 40~48%는 권고, 각국 법 아님)

#### 계정 등록

| 플랫폼 | 상태 | 비고 |
|--------|------|------|
| Google Play | ✅ 등록 완료 (MONKOS AI, ID: 70112966655193837) | 본인 확인 진행 중 |
| Apple Developer | ✅ 결제+계약 완료 (W1803588193) | 활성화 대기 (~48h) |

#### 작업 현황

| # | 항목 | 상태 | 담당 | 비고 |
|---|------|------|------|------|
| 2-A | crop-offline → `monkos_AI/crop-app/` 본진 편입 | ✅ | 막내1 4/30 | `dbadd1a` |
| 2-B | PWA 기반 (manifest.json + SW + 아이콘) | ✅ | 막내1 4/30 | Lighthouse installable |
| 2-C | 시스템 언어 감지 (navigator.language) | ✅ | 막내1 4/30 | ko/ja/en 분기 |
| 2-D | 난독화 빌드 (obfuscate.mjs) | ✅ | 막내1 4/30 | |
| 2-E | TWA 준비 (twa-manifest.json + assetlinks.json) | ✅ | 막내1 4/30 | 패키지 ai.monkos.crop |
| 2-F | 26국 전수조사 (공식 규정, 여권/비자 분리) | ✅ | 막내1~4 4/30 | 28건, 4명 병렬 |
| 2-G | 배경 제거 엔진 PoC | ✅ | 쌍아 4/30 | @imgly/background-removal ISNet ONNX 확인 |
| 2-H | specs-data-v2.json 통합 정본 생성 | ❌ | — | 전수조사 기반 |
| 2-I | 국가 선택 메뉴 UI + 파라미터 자동 로딩 | ❌ | — | 국기 + 검색 + 문서유형 분기 |
| 2-J | 배경 제거 기능 크롭앱 통합 | ❌ | — | @imgly 번들 내장 |
| 2-K | 크롭 완료 퍼널 (텔레그램 공유 + MONKOS OG) | ❌ | — | Web Share API |
| 2-L | 스토어 리스팅 에셋 (스크린샷/설명문/키워드) | ❌ | — | 한/일/영 localization |
| 2-M | TWA/Capacitor 빌드 + 스토어 제출 | ❌ | — | 계정 인증 완료 후 |
| 2-N | **iOS 네이티브 앱 (SwiftUI + Vision)** — MonkosCrop Xcode 프로젝트 생성, MVP 4파일 작성 | ✅ | 쌍아 5/12 | apps/MonkosCrop/ |
| 2-O | M1 Xcode 26.5 설치 + 원격 빌드 파이프라인 | ✅ | 쌍아 5/13 | VNC+SSH xcodebuild |
| 2-P | Vision CoreML 시뮬레이터 미지원 → CIDetector fallback | ✅ | 쌍아 5/13 | 실기기 Vision 확인 필요 |
| 2-Q | 웹 크롭 엔진 v2 Swift 이식 (눈앵커+정수리+여백) | ⏳ | 쌍아 5/13 | CIDetector→Vision 전환 시 완성 |
| 2-R | TestFlight 배포 파이프라인 (인증서+디바이스+Archive+업로드) | ✅ | 쌍아 5/13 | 내부테스트 그룹 monktest |
| 2-S | 실기기 TestFlight 테스트 | ✅ | 작가님 5/13 | 속도 양호, 크롭 정확도 개선 필요 |
| 2-T | Vision 실기기 동작 확인 + 크롭 정밀도 개선 | ❌ | — | 다음 빌드 |
| 2-U | **V1 디자인 프로토 (클로드 디자인)** — JSX 3시안, 7화면 풀 플로우 | ✅ | 클로드 디자인 5/13 | Desktop/CROP APP/ |
| 2-V | **V1→SwiftUI 이식 + macOS PoC** — 7화면 풀 플로우, Vision 76pt, 크로스플랫폼 빌드 | ✅ | 쌍아 5/13 | iMac swiftc 빌드 |
| 2-W | **Apple Vision 배경 제거** — PersonSegmentation, ISNet 대비 품질 우위, 번들 0MB | ✅ | 쌍아 5/13 | CropEngine.swift |
| 2-X | **1차 E2E 테스트 통과** — macOS PoC에서 풀 플로우 동작 확인 | ✅ | 작가님 5/13 | 디테일 조정 남음 |
| 2-Y | **Phase 2 디테일** — macOS 스타일/오버레이 심플화/신호등/검수 시퀀스/줌+패닝 | ✅ | 쌍아 5/13 | |
| 2-Z | Step 순서 변경: 배경→크롭 (줌 시 누끼 필수) | ✅ | 쌍아 5/14 | 배경→크롭 순서 확정 구현 |
| 2-AA | **정밀 교정 모드** — 프레임 고정+원본 줌/패닝+실시간 메트릭. 기본 플로우와 별도 분기 | ❌ | — | 아래 §설계 방향 참조 |
| 2-AB | **202국 JSONL 데이터 + 대륙별 카드 UI** | ✅ | 쌍아 5/15 | 72국 커스텀 + 130국 ICAO |
| 2-AC | **200개국 전수조사 + 2차 출처 검수** | ✅ | 막내1~4 5/15 | A+B 114건 반영, C/X 33건 보류 |
| 2-AD | **JSONL A+B 등급 반영** | ✅ | 막내1 5/15 | 비표준 63국 docs 추가 |
| 2-AE | **세로 60mm+ 규격 배치 보정 (캐나다 등)** | ✅ | 쌍아 5/15 | faceTarget/eyeTarget/신호등 분기 |
| 2-AF | 대륙 카드 배경 이미지 (그라데이션→사진) | ❌ | — | 철창이 디자인 대기 |
| 2-AG | warning 확장 (AI 금지/안경 금지 등 특이점 표시) | ❌ | — | 2차 검수 데이터 활용 |
| 2-AH | 앱 네이밍 확정 — **IDPASS** | ✅ | 작가님 5/16 | powered by MONKOS AI |
| 2-AI | M1 Archive + App Store Connect 업로드 (build 4) | ✅ | 쌍아 5/22 | 스크린샷/설명 입력 미완 |
| 2-AJ | Analytics SDK (Firebase 등 2단계 데이터 수집) | ❌ | — | 배포 시점 |

#### 배경 제거 엔진 비교 (04-30 PoC)

| 엔진 | 품질 | 속도 | 사이즈 | 판정 |
|------|------|------|--------|------|
| MediaPipe Selfie Segmentation | 거침 (머리카락 뭉개짐) | ~1초 | +3MB | ❌ 품질 부족 |
| @imgly/background-removal (ISNet) | 준수 (포토샵 수준) | ~5초 (캐시 후) | +40MB | ✅ 웹용 채택 |
| **Apple Vision PersonSegmentation** | **ISNet 대비 우위 (작가님 실측)** | **~1-2초** | **0MB (시스템 내장)** | **✅ iOS/macOS 채택 (5/13)** |

#### 전수조사 결과 요약 (04-30)

- 총 28건 (여권/비자/신분증/이력서 분리)
- 공식 눈 위치 규정: 미국 비자 + 인도 비자 + 인도네시아 + 베트남 = **4건만**
- 공식 px 규정: 한국 여권, 중국 여권/비자, 싱가포르, 캐나다, UK, 미국 비자, 인도, 인도네시아
- AI 보정 명시 금지: 7개국 (한국, 미국, 캐나다, 중국, 베트남, 호주, UK)
- 인도 과도기: 2025.9.1부터 51×51 → 35×45 전환 예정
- 태국: 공식 규격 미게시 (ICAO 준수 선언만)
- 막내4 추가 발굴 제안 7국: 필리핀, 대만, 브라질, 러시아, 사우디, 멕시코, 말레이시아

---

### 앱 기획서 — MONKOS Crop v2 (04-30 작가님 디렉션)

> 크롭앱을 "사진관 프로 도구"에서 "누구나 쓰는 글로벌 증명사진 앱"으로 전환.
> 단일 페이지 → 스텝 분리. 서버 없이 폰에서 완결.

#### 앱 포지셔닝

| | 경쟁 앱 | MONKOS Crop |
|---|---|---|
| 핵심 가치 | AI로 예쁘게 | **규격에 정확하게** |
| 서버 | 사진 업로드 필수 | **서버 전송 0 (완전 오프라인)** |
| 과금 | 유료/구독 | **완전 무료 (인앱결제 없음, 광고 없음)** |
| 규격 커버 | 5~10개국 | **글로벌 (4패턴으로 전 세계 커버)** |
| AI 보정 | 있음 | 없음 → 증명사진 앱으로 연결 |

#### 규격 패턴 (4종으로 전 세계 커버)

| 패턴 | 사이즈 | 커버 범위 |
|------|--------|----------|
| A (디폴트) | 35×45mm | 한국, 일본, EU, 호주, 싱가포르, 태국, 중국(실무) + ICAO 100개국 |
| B | 51×51mm | 미국, 인도(현행) |
| C | 50×70mm | 캐나다 |
| D | 커스텀 입력 | 나머지 예외 |

#### 스텝 분리 UX

```
[Step 1] 국가 + 문서 선택
  → 국기 리스트 + 검색
  → 규격 카드 표시 (사이즈, 얼굴 범위, 배경색)
  → 규격 데이터 앱 내장 JSON (~20KB), 오프라인 표시
  → "공식 규정 보기" 링크만 외부 정부 URL

[Step 2] 사진 업로드
  → 가이드 일러스트 + 촬영 팁
  → 업로드 즉시 FaceMesh 분석 (결과는 내부 보관, 아직 안 보여줌)

[Step 3] 배경 제거 + 교체
  → @imgly ISNet ONNX (브라우저 로컬, ~40MB)
  → 배경색 디폴트: 규격 선택에서 자동 결정 (대부분 흰색)
  → 변경 원하면 색상 옵션 터치
  → 누끼는 내부 처리용, 사용자에게 미노출

[Step 4] 크롭 조정
  → 규격이 이미 결정된 상태 → 해당 프레임만 표시
  → 정사각형/직사각형 분기 로직 불필요 (파라미터 이미 로딩)
  → FaceMesh 자동 추정선 점선 표시
  → "정수리 위치를 자동으로 잡았습니다" — 대부분 여기서 [다음]
  → 안 맞으면 "위치 보정하기" → 그때서야 드래그 핀 활성화
  → 하단 고정 숫자판 ❌ 제거

[Step 5] 완료 + 퍼널
  → 다운로드 (배경색 합성 JPG 기본, PNG 투명 미제공)
  → 퍼널 카드 2장:
    ① 편의점 인화 (텔레그램 공유, Web Share API)
    ② AI 전문 증명사진 — MONKOS (OG 카드, monkos.ai 링크)
```

#### "MONKOS 검수" 연출 (Step 4 내 버튼)

> 실제로는 FaceMesh 결과가 업로드 순간 한 방에 계산 완료.
> "MONKOS 검수" 버튼 터치 시 결과를 1.5초 시퀀스로 순차 연출.

```
[MONKOS 검수] 버튼 터치 →

  ── 양쪽 눈 점 등장 + 사선 점선 착 ──
  사진 위 플로팅 텍스트 (타이핑 효과):
  "기울기 0.3° — 양호 ✓"                    fadeIn → fadeOut

  ── 정면 판정선 착 ──
  "정면 확인 ✓"

  ── 밝기 스캔 (좌→우 훑는 애니메이션) ──
  "좌우 밝기 균일 ✓"

  ── 얼굴 크기 ──
  "34.0mm — ICAO 이내 ✓"

  ── 최종 판정 ──
  "MONKOS 검수 통과 ✓"                      초록 스탬프

  또는
  "얼굴이 왼쪽으로 기울어져 있습니다"          주황색, 보정 유도
```

판정 항목 (전부 FaceMesh 좌표 + Canvas 픽셀, 서버 불필요):
- 정면 여부: 코끝 vs 좌우 볼 거리
- 좌우 기울기: 양쪽 눈 Y좌표 차이
- 눈 뜸/감음: 상하 눈꺼풀 거리 비율
- 입 다물기: 상하 입술 거리
- 좌우 그림자: 얼굴 좌반/우반 밝기 차이
- 전체 밝기: 얼굴 영역 평균 휘도

구현량: CSS 애니메이션 ~30줄 + setTimeout 시퀀스 ~50줄 + i18n 키 ~20줄 = **~100줄**

#### 다운로드 옵션

- **기본**: 배경색 합성 JPG (규격 선택 시 자동 결정된 색)
- 누끼(투명 PNG) 미제공 — 내부 처리용

#### 앱스토어 검색 키워드

| 언어 | 키워드 |
|------|--------|
| 한국어 | 증명사진 크롭, 여권사진 규격, 반명함 크롭 |
| 일본어 | 証明写真 サイズ, パスポート写真 規格, 履歴書写真 |
| 영어 | passport photo crop, ID photo size, ICAO photo crop |

#### 스토어 리스팅 localization

- 앱 하나 + 스토어 페이지(제목/설명/스크린샷)를 한/일/영 별도 구성
- 각국 스토어에서 해당 언어 규격이 크롭되는 스크린샷 표시

#### 앱 사이즈 예상

| 구성 | 사이즈 |
|------|--------|
| FaceMesh WASM + 모델 | 16MB |
| 배경 제거 모델 (@imgly ISNet) | 40MB |
| 크롭 로직 + UI + CSS | 1MB |
| 규격 데이터 JSON | 0.02MB |
| 국기/아이콘/디자인 에셋 | 3~5MB |
| **합계** | **~60~65MB** (100MB 미만) |

#### 수익 모델

- 크롭앱 자체: **수익 0 (완전 무료)**
- 역할: **퍼널 입구** → 증명사진 앱(유료, IAP 건당 결제)으로 전환
- 부수 효과: 앱스토어 SEO + 브랜드 인지도 + 리뷰 자산

---

### 크롭 엔진 — 플랫폼별 얼굴인식 비교분석 (2026-05-13 실측)

#### 3사 엔진 비교

| 항목 | Web (MediaPipe FaceMesh) | iOS (Apple Vision) | Android (ML Kit) |
|------|------------------------|-------------------|-----------------|
| **포인트 수** | 478pt (얼굴 피부 메시) | 76pt (특징점) | 기본 7pt / contour ~130pt |
| **번들 사이즈** | 16MB (WASM+모델) | 0MB (시스템 내장) | 0MB (Play Services) |
| **동공** | ✅ 정밀 (iris 추적) | ✅ leftPupil/rightPupil 각 1pt | ❌ 없음 |
| **눈 좌표** | 눈 윤곽 다수 | 눈 윤곽 6pt + 동공 1pt | 기본: 중심 1pt / contour: 16pt |
| **턱 최하단** | chin 랜드마크 (#152) | faceContour 17~21pt 중 최하단 | 기본: ❌ / contour: face oval 36pt 중 최하단 |
| **이마/정수리** | 이마 상단 (#10) — 정수리 아님 | ❌ 없음 | ❌ 없음 |
| **정수리 추산** | 이마~턱 × 보정계수 | 눈~턱 해부학 반전 | 눈~턱 해부학 반전 |
| **턱선 윤곽** | 전체 메시에서 추출 | faceContour 17~21pt | contour: face oval 36pt |
| **속도** | ~200ms (WASM) | ~50ms (Neural Engine) | ~100ms (GPU) |
| **오프라인** | ✅ (번들 내장) | ✅ (시스템) | ✅ (Play Services 캐시) |

#### 크롭에 필요한 핵심 데이터 — 플랫폼별 취득 방법

| 필요 데이터 | Web | iOS | Android |
|-----------|-----|-----|---------|
| **눈 중심 좌표** | 좌/우 눈 랜드마크 평균 | `leftPupil` / `rightPupil` (정확) | 눈 윤곽 16pt 중심 평균 (동공 없으므로) |
| **턱 최하단 Y** | chin 랜드마크 (#152) | `faceContour` 최하단 | `FACE` oval contour 최하단 |
| **정수리 Y** | 이마(#10) + 보정계수 30% 올림 | 눈~턱 반전 (해부학) | 눈~턱 반전 (해부학) |
| **헤어탑 Y** | 정수리 - 얼굴높이×8% | 동일 | 동일 |

#### 결론: 단일 크롭 로직, 플랫폼별 입력 어댑터

```
[플랫폼별 어댑터]                    [공통 크롭 엔진]
                                    
Web:  FaceMesh → eyeCenter, chinY ──┐
iOS:  Vision   → eyeCenter, chinY ──┼→ cropToFrame(eyeCenter, chinY, spec)
Android: ML Kit → eyeCenter, chinY ─┘   ├─ 정수리 추산 (해부학)
                                         ├─ 눈 43% 앵커
                                         ├─ 헤어탑 여백 보장
                                         └─ 하단 축소 보정
```

**활용 방안:**
1. 크롭 로직(배치 상수, 스케일 결정, 여백 보정)은 **플랫폼 무관 공통 모듈**로 유지
2. 각 플랫폼은 **어댑터만 구현** — 얼굴인식 엔진에서 `eyeCenterX`, `eyeCenterY`, `chinY` 3개 값만 추출
3. iOS는 Vision 76pt 동공+턱이 가장 정확 → 기준 플랫폼
4. Android는 ML Kit contour 모드 필수 (`setContourMode(CONTOUR_MODE_ALL)`)
5. Web은 기존 FaceMesh 유지 (번들 16MB 감수)
6. **정수리는 어떤 엔진도 직접 감지 불가** — 해부학 추산(눈~턱=눈~정수리)이 업계 표준. 이 추산의 정확도는 눈/턱 입력 정밀도에 의존

---

### 프로토앱 설계 방향 (2026-05-13 작가님 확정)

#### 2트랙 UX — "기본 플로우" vs "정밀 교정"

> 기본 플로우는 누구나 쉽게 (자동 크롭→바로 다운로드), 정밀 교정은 원하는 사람만 (전문가 모드).

**기본 플로우** (대부분의 사용자):
```
선택 → 업로드 → 배경 제거 → 자동 크롭 + 검수 시퀀스 → 다운로드
```
- 검수 시퀀스: 자동 측정(눈/턱/정수리) → 결과 표시(신호등) → 정수리 확인(드래그) → 완료
- 정밀 교정 필요 없으면 바로 "다음" → 다운로드

**정밀 교정 모드** (검수 결과 "정밀 조정" 버튼):
```
규격 프레임 고정 + 원본 이미지(누끼) 줌/패닝
→ 눈/턱 라인이 이미지에 고정, 프레임 대비 비율이 실시간 변동
→ 메트릭(EYE/HEAD/TOP/BTM) + 신호등이 실시간 추종
→ 멘트도 수치에 따라 변동 ("얼굴이 큽니다" ↔ "범위 내")
```

#### Step 순서 변경 (확정)
```
현재: 선택 → 업로드 → 크롭 → 배경 → 완료
변경: 선택 → 업로드 → 배경 제거 → 크롭(검수+교정) → 완료
```
- 줌 인/아웃 시 누끼 상태여야 배경 없이 깔끔
- 정밀 교정에서 원본 이미지 줌/패닝 시 배경이 없어야 프레임이 직관적

#### 프로토앱 로드맵 (5/13 확정)

| Phase | 목표 | 상태 |
|-------|------|------|
| 1 | 1차 E2E (V1 디자인 + Vision + 배경 제거) | ✅ 5/13 |
| 2 | 기능 완성 — 디테일 + HUD 정밀 + 26국 규격 + 2트랙 UX + Step 순서 변경 | ⏳ |
| 3 | 디자인 완성 — 실사 에셋 + 상세페이지 + 광고 링크 설계 | ❌ |
| 4 | Apple 앱 빌드 — iOS 빌드 → TestFlight → App Store | ❌ |

#### 교훈 8: 기본 UX는 간결하게, 전문가 기능은 옵션 (2026-05-13)

**현상**: 검수 시퀀스에 줌/패닝/실시간 메트릭 등을 넣으니 전문가적이지만 일반 사용자에게 복잡
**결정**: 2트랙 분리 — 기본=자동 크롭→다운로드 (대부분), 정밀=프레임+줌+패닝 (전문가)
**교훈**: 크롭앱은 "정확함"이 핵심이지만, "쉬움"도 동시에 보장해야. 둘을 한 화면에 넣지 말고 분기.

---

### Phase 3 — 크롭 엔진 고도화 (미착수)

> **Outpainting 아이디어 (2026-05-06 작가님 발견)**
> 유저 사진의 헤드룸/여유공간 부족 시, 프레임 밖 영역을 AI가 배경 질감으로 채워주는 기능.
> 포토샵 "생성형 채우기"와 동일 — Stable Diffusion / Imagen Outpainting으로 구현 가능.
> 단, 서버 경유 필수 (브라우저 단독 불가) → 크롭앱의 서버리스 원칙과 충돌.
> AI 증명사진 앱에서는 생성 시 규격에 맞게 만들므로 불필요. 크롭앱에서만 발생하는 문제.
> 구현 시 크롭앱 → 유료 앱 전환 동기가 될 수 있음. 또는 크롭앱 내 서버 경유 옵션으로 제공 검토.

| 항목 | 상태 | 담당 | 비고 |
|------|------|------|------|
| 독립 도메인 (crop.monkos.ai) | ❌ | — | 검토 단계 |
| 크롭 엔진 정확도 개선 | ❌ | — | 미착수 |

---

## 4. 성과

> 실측 데이터. 측정일 명시. 추정 금지.

| 항목 | 수치 | 측정일 | 비고 |
|------|------|--------|------|
| /crop 페이지 배포 | 운영 중 | 03-17~ | KR/JP |
| 서버 비용 | 0원 | — | 브라우저 단독 |
| 콘텐츠 적립 | 3건 (README/Issue/블로그) | 03-18 | works |

---

## 5. 복기

> 교훈·실패·성공 패턴.

### 교훈 1: 서비스카드 링크 가로채기

**현상**: 포털 홈 서비스카드에서 /crop 클릭 시 main.js가 서브도메인으로 리다이렉트
**원인**: main.js의 범용 링크 핸들러가 /crop을 외부 URL로 오인
**대응**: main.js 가로채기 제거 핫픽스 `9abf398`

### 교훈 3: iOS 시뮬레이터 Vision 미지원 (2026-05-13)

**현상**: `VNDetectFaceRectanglesRequest` 실행 시 "Could not create inference context"
**원인**: iOS 26.5 시뮬레이터에서 Vision의 CoreML 추론 엔진이 Neural Engine 없이 동작 불가
**대응**: CIDetector(구형 얼굴 인식) fallback 적용. 실기기에서 Vision 정상 동작 기대 — 다음 빌드에서 확인
**교훈**: 시뮬레이터에서 Vision/CoreML 의존 기능은 반드시 실기기 테스트 필요. CLI(macOS)에서 되는 것과 시뮬레이터에서 되는 것은 다르다.

### 교훈 4: CheckedContinuation 이중 resume 크래시 (2026-05-13)

**현상**: 사진 선택 시 앱 크래시 (`EXC_BREAKPOINT`)
**원인**: `withCheckedContinuation` 콜백 + `try/catch` 조합에서 perform 에러 시 콜백과 catch 양쪽에서 resume 호출
**대응**: Vision의 `perform`은 동기 메서드 → `withCheckedContinuation` 제거, 직접 호출로 단순화
**교훈**: 동기 API를 불필요하게 async 래핑하면 continuation 관리 복잡도만 증가. 동기면 동기로 쓰자.

### 교훈 5: TestFlight 배포 시 필요한 것 체크리스트 (2026-05-13)

- Apple Distribution 인증서 (Manage Certificates에서 수동 생성)
- 디바이스 UDID 등록 (Developer Portal → Devices)
- 앱 아이콘 전 사이즈 (1024, 180, 167, 152, 120, 87, 80, 76, 60, 58, 40, 29, 20)
- CFBundleIconName in Info.plist
- 수출 규정 문서 답변
- SSH에서 코드 서명 불가 → VNC GUI Archive 필수

### 교훈 6: macOS CGContext 좌표계 — 땜질 vs 근본 해결 (2026-05-13)

**현상**: macOS PoC에서 크롭 이미지 뒤집힘 + 턱 위치 오차
**1차 시도(땜질)**: flippedRect Y 반전 → 이미지 정방향은 됐으나 crop 위치 어긋남. 턱 보정 마진(CHIN_EXTEND_RATIO) 추가 → 작가님 지적 "Vision은 턱끝점 잘 잡는데 억지로 내릴게 아니라 로직을 파악해야지"
**근본 원인**: CGContext(bottom-left origin)에서 UIKit drawRect(top-left origin)을 그대로 사용 → 좌표 변환 불일치
**근본 해결**: macOS 렌더링을 **CIImage 기반으로 전면 교체** — `CIImage.cropped(to:)` → `transformed` → `composited(over:)`. CIImage는 좌표 변환을 내부 처리하므로 flip 문제 원천 제거
**교훈**: 좌표 문제에 보정 상수를 얹는 건 항상 틀린 방향. 좌표계 자체를 통일하거나, 좌표를 자동 처리하는 레이어(CIImage)로 이동하는 게 정답.

### 교훈 7: Apple Vision PersonSegmentation > ISNet (2026-05-13)

**현상**: 배경 제거 엔진으로 @imgly ISNet(40MB ONNX)을 웹에서 채택(4/30)했으나, iOS 앱에서는 번들 부담
**발견**: `VNGeneratePersonSegmentationRequest(.accurate)` — 시스템 내장, 0MB, 1-2초, 품질 ISNet 대비 우위 (작가님 실측)
**교훈**: 네이티브 앱에서는 플랫폼 내장 API를 먼저 평가할 것. 웹에서의 최선(ISNet)이 네이티브에서의 최선이 아닐 수 있다. iOS/macOS 앱 사이즈 60MB→20MB 이하 가능.

### 교훈 2: CSS/JS 경로 상대→절대

**현상**: /crop 하위에서 CSS/JS가 로딩 안 됨
**원인**: 상대 경로 사용 → /crop/ 하위에서 경로 깨짐
**대응**: 절대 경로로 전환 `9eb344a`

---

## 6. 관련 문서 인덱스

### 기안서 (PROPOSAL)

| 파일 | 주체 | 내용 | 상태 |
|------|------|------|------|
| — | — | (별도 PROPOSAL 없이 작가님 직접 지시로 착수) | — |

### 기술명세 (SPEC)

| 파일 | 주체 | 내용 |
|------|------|------|
| works/크롭앱 개발기 명세서 | 막내 | 기술 블로그용 크롭앱 개발 명세 |

### 보고서 (REPORT)

| 파일 | 주체 | 내용 |
|------|------|------|
| 막내2 분기분석 P7 | 막내2 | 크롭앱 3/11~12 분석 |
| 막내1 분기분석 PU-5 | 막내1 | 크롭앱 3/17~18 분석 |

### 지시서 (ORDER)

| 파일 | 수신 | 내용 | 상태 |
|------|------|------|------|
| `ORDER_20260318_크롭앱개발명세서_기술블로그용` | 막내 | 콘텐츠 적립 | 완료 |
| `ORDER_20260318_404해소_pricing+guide+crop등록` | 막내 | 포털 등록 정리 | 완료 |

### 커밋

| 해시 | 날짜 | 내용 |
|------|------|------|
| `1f6a214` | 03-17 | /crop 정식 등록 |
| `d5d8c06` | 03-17 | 화이트 모드 전환 |
| `0e25b78` | 03-18 | i18n 통합 (크롭앱 다국어) |
| `6d6eb86` | 03-18 | 404 해소 |

---

## 7. 리스크

| 리스크 | 확률 | 대응 |
|--------|------|------|
| 특허 출원 지연 | 중 | 명세서 작성 우선순위 확보 필요 |
| FaceMesh 정확도 한계 | 저 | 사진 품질 가이드 + 재촬영 안내 |
| 독립 도메인 결정 지연 | 저 | /crop으로 운영 충분, 도메인 분리는 트래픽 기반 판단 |
| CITADEL SEO 연동 의존 | 저 | 크롭 규격 허브는 CITADEL Phase 1에서 처리됨 |
| ~~iOS 빌드 환경 분리~~ | ~~고~~ | ~~해결 (5/13): M1 Xcode 26.5 + VNC+SSH 원격 빌드 파이프라인 확립~~ |
| Vision 시뮬레이터 미지원 | 중 | iOS 26.5 시뮬레이터에서 Vision CoreML 추론 불가. CIDetector fallback 적용. 실기기에서 Vision 동작 여부 확인 필요 |
| 크롭 정확도 (CIDetector) | 고 | CIDetector는 faceBounds만 제공, 턱/눈 정밀 좌표 없음. Vision 전환 시 76개 랜드마크로 웹 엔진급 달성 가능 |

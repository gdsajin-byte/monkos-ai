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

## 1. Phase 현황

> Phase별 상태를 갱신한다. 에이전트 투입 시 이 섹션이 "지금 뭘 해야 하는지"의 정본.

| Phase | 제목 | 상태 | 핵심 잔여 |
|-------|------|------|----------|
| 0 | MVP + 포털 등록 | ✅ 완료 (03-18) | — |
| 1 | SEO + 특허 | ⏳ 진행 중 | 특허 명세서·출원 미착수 |
| 1.5 | specs 26국 ↔ 크롭앱 연동 | ⏳ 설계중 (04-25) | 1.5-B~G 미착수 |
| 2 | 앱스토어 진출 + 배경 제거 | ⏳ 진행 중 (04-30) | 2-H~M, 2-T, 2-AA~AJ 미착수 |
| 3 | 크롭 엔진 고도화 | ❌ 미착수 | 독립 도메인·정확도 개선 |

> 완료 Phase 상세: [ARCHIVE_PHASES.md](ARCHIVE_PHASES.md)

---

## 2. 히스토리

> **append only. 수정·삭제 금지.** 신규 항목은 하단에 추가.
> ⚠️ 소급 불적용(ch4 9조 5항): 아래는 PF 생성 시점(03-26)의 주요 마일스톤 요약.

| 날짜 | 주체 | 내용 | 산출물 | 상태 |
|------|------|------|--------|------|
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
| 06/14 | 4060/쌍아 | **RMBG-2.0 A/B 비교 + 후처리 파이프라인 PoC** — RMBG-2.0 gated 접근 성공, 동일 5종 비교(품질 동급, 속도 RMBG 7%↑, 라이선스 BiRefNet MIT 승). 후처리 3단(GuidedFilter 알파매팅+에지페더링+디컨태미네이션) 구현, 오버헤드 +9ms, 효과 제한적(마스크 자체 양호). compare-test.html 동시 비교 UI | [COMPLETION](../../reports/2026-06/COMPLETION_20260614_4060쌍아_배경제거후처리_PoC.md) | ✅ |
| 07/07 | iMac/민아 | **애플 비전 직접 대조 PoC + 테스트 기반 + 재설계 기안** — ① 3엔진 실측(애플 비전 iMac 네이티브 CLI vs BiRefNet ONNX CPU vs Gemini, 동일 원본): **BiRefNet ≈ 애플 비전**(잔머리 대등·원본 픽셀 보존), CPU 하한 19.4s ② 테스트 기반 정본화(`benchmark/poc-20260707/` 스크립트+디바이스별 실행법, 모델 972MB GDrive) ③ IDPASS 순서 이식+연산 3층 재설계 기안 — 06/14 실측과 합쳐 채택 근거 완비. 과거 "기각" 실체=RMBG-2.0 비상업 라이선스 규명 | [DESIGN](../../../tech/designs/2026-07/DESIGN_20260707_배경제거_온디바이스_재설계.md) | ⏳ 쌍아 검토 |
| 07/07 | M1/민아 | **matte 서빙 정본 신설 (ORDER_20260707 A-1)** — BiRefNet 채택 확정(작가님) 반영. benchmark/birefnet_server.py 승계해 `apps/monkos-matte/` 규격화(`/api/matte {image,bgColor}`, 소프트 알파 합성, stdlib http.server — flask 의존 제거), torch(4060 GPU)/onnx(CPU 개발) 2백엔드. M1 ONNX 실동 검증(15.4s/장, 배경색 정밀 합성 확인). 4060 torch 기동은 전원 인가 대기 | apps/monkos-matte/ | ⏳ |
| 07/07 | M1/막내2 | **BiRefNet-lite PoC** — 경량 모델(swin_v1_tiny, 214MB) M1 CPU 실측. 추론 8.6s(portrait 15.7s 대비 1.8배↑), 품질 portrait와 육안 차이 미미(머리카락·안경·어깨 동급). 모델 4.3배 작음. Phase 4 클라이언트 프리뷰 후보 데이터 확보 | [COMPLETION](../../reports/2026-07/COMPLETION_20260707_M1막내2_BiRefNet_lite_PoC.md) | ✅ |

| 07/07 | M1/민아 | **BiRefNet-lite 서버 서빙 교체 실측·확정** — 막내2 로컬 판정(214MB·품질 동급) 서버 검증: 첫 풀 13.5분→82.8s(10배), GPU 추론 0.36~0.75s(2배), CPU 11~13s(1.7배), 공정 A/B 평균차 0.4%(경계 국한). RunPod 템플릿·CPU dev lite 전환 완료 | cloudbuild.runpod.yaml, gs://monkos-models*/birefnet/ | ✅ |
| 07/07 | M1/막내2 | **BiRefNet-lite 브라우저 PoC** — onnxruntime-web WASM/WebGPU 4조합 전부 추론 OOM. 모델 로드 성공(2.9~4.1s)이나 1024² 고정 입력의 중간 텐서 ~4.6GB 필요 → 브라우저 메모리 한계(WASM 2-4GB) 초과. **서버 비용 ₩0 브라우저 직접 추론 = 현세대 불가 판정** | [COMPLETION](../../reports/2026-07/COMPLETION_20260707_M1막내2_BiRefNet_lite_브라우저PoC.md) | ✅ |
| 07/07 | M1/막내2 | **FaceMesh vs dlib 랜드마크 비교 실측** — 3장(셀카/클로즈업/안경) 양쪽 3/3 감지 성공. 눈 Δ평균 4.7px·턱 Δ평균 5.3px(동급). FaceMesh 26배 빠름(0.010s vs 0.263s), 모델 26배 작음(3.6MB vs 95MB). 사일런트 미스 미재현 — Python vs 웹JS 구현 차이 또는 와이드샷 특수 케이스 가능 | [COMPLETION](../../reports/2026-07/COMPLETION_20260707_M1막내2_FaceMesh_vs_dlib_비교실측.md) | ✅ |
| 07/08 | iMac/쌍아+민아 | **InsightFace SCRFD 도입 + 좌표계 일원화 + Gemini 판정 퇴출** — OOM→EXIF→좌표계 3연쇄 디버깅 후 normalizeImage 입구 정규화, SCRFD 검출 교체(Gemini 박스 퇴출, 문제사진 3/3 안착), precheck 코드 게이트 전환(7~20s→0.7~3s), 해부학 검증 FaceMesh 내부 정합으로 교체. crop-engine 00009, portal 00433 | [설계서](../../../monkos-ops/tech/designs/2026-07/DESIGN_20260708_엔진완결_좌표계일원화.md) | ✅ (쌍아 사후 추인) |
| 07/12 | iMac/민아 | **T1 과대 크롭 전수 진단 — 주범='죽은 hairScan' 확정 (쌍아 교차검증)** — raw1 실측 재현: meta 완벽(33.0/3.8/45)인데 4973 과대·4926 정상 = crown(두개골)~chin 정규화가 헤어 볼륨 미수용(crown 3.8mm 참·헤어탑 기준 1.3mm). subjectTopRow() 스캔+소비 로직(soft여백·스케일축소) 완비인데 **호출부 유실**(7/09 리팩토링 추정). 판정: T1 재크롭(/api/crop-spec)=FaceMesh 직행(InsightFace는 fit/detect만 — 부분 전환 사각, prod 로그 'facemesh'는 하드코딩 라벨). 얽힘 버그 3건(매팅스킵↔게이트 폴백 사망→L3 유출·meta 부재 프리패스·hairScan 유실)+SCRFD bbox=hairTop 반증(-8mm). 해법=연결 복원 1지점+게이트 hairTopMargin≥2mm+headHeight 판정+T1 에러·환불 | [진단 REPORT](../../reports/2026-07/REPORT_20260712_iMac민아_T1크롭_오류변수_전수진단.md) | ⏳ (구현 배정 대기) |

> 전체 히스토리: [ARCHIVE_HISTORY.md](ARCHIVE_HISTORY.md)

---

## 3. 리스크

| 리스크 | 확률 | 대응 |
|--------|------|------|
| 특허 출원 지연 | 중 | 명세서 작성 우선순위 확보 필요 |
| FaceMesh 정확도 한계 | 저 | 사진 품질 가이드 + 재촬영 안내 |
| 독립 도메인 결정 지연 | 저 | /crop으로 운영 충분, 도메인 분리는 트래픽 기반 판단 |
| CITADEL SEO 연동 의존 | 저 | 크롭 규격 허브는 CITADEL Phase 1에서 처리됨 |
| ~~iOS 빌드 환경 분리~~ | ~~고~~ | ~~해결 (5/13): M1 Xcode 26.5 + VNC+SSH 원격 빌드 파이프라인 확립~~ |
| Vision 시뮬레이터 미지원 | 중 | iOS 26.5 시뮬레이터에서 Vision CoreML 추론 불가. CIDetector fallback 적용. 실기기에서 Vision 동작 여부 확인 필요 |
| 크롭 정확도 (CIDetector) | 고 | CIDetector는 faceBounds만 제공, 턱/눈 정밀 좌표 없음. Vision 전환 시 76개 랜드마크로 웹 엔진급 달성 가능 |

---

## 4. 관련 문서 인덱스

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

> 완료 Phase 상세·설계·기획·복기: [ARCHIVE_PHASES.md](ARCHIVE_PHASES.md)

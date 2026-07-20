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

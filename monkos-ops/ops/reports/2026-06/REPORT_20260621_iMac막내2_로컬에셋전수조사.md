---
type: report
date: 2026-06-21
device: iMac
agent: 막내2
portfolio: PF_STYLER
status: 완료
subject: iMac Desktop 로컬 바이너리 에셋 전수 조사
---

# iMac Desktop 로컬 바이너리 에셋 전수 조사

> **[2026-06-21 12:08 KST]** iMac/막내2 → 작가님
> 지시서: ORDER_20260621_iMac쌍아_막내2_로컬에셋전수조사_웍벤치기안.md

---

## 1. 전체 요약

| 항목 | 수치 |
|------|------|
| **총 이미지 파일** | 661개 |
| **총 용량** | 1.19 GB |
| **스캔 폴더** | Desktop 13개 + developer/images 1개 |
| **중복 파일 (추정)** | ~210개 (32%) |
| **유니크 파일 (추정)** | ~451개 |
| **중복 낭비 용량** | ~420 MB |

---

## 2. 폴더별 에셋 인벤토리

### 2-1. CROP APP (222개 / 503.87 MB)

> **용도**: 서비스 핵심 — 증명사진 크롭 앱 프로토타입 + 에셋
> **서비스 연관**: idphoto (직접)

| 하위 폴더 | 파일수 | 용량 | 성격 |
|-----------|--------|------|------|
| `images/` | 44 | 88.32 MB | 서비스 샘플 (Unsplash 인물 21 + 증명사진/비자/여권 에셋 23) |
| `guides/` | 25 | 118.64 MB | 국가별 규격 가이드 PNG (**IDPASS/guides와 완전 중복**) |
| `IDPASS/guides/` | 25 | 118.64 MB | ↑ 동일본 |
| `IDPASS/vision/` | 4 | 30.13 MB | MediaPipe 얼굴인식 디버그 이미지 (**vision/과 완전 중복**) |
| `vision/` | 4 | 30.13 MB | ↑ 동일본 |
| `IDPASS/이미지/` | 9 | 5.66 MB | 서비스 OG카드·아이콘·샘플 |
| `IDPASS/ios-src-snapshot/` | 6 | 1.17 MB | iOS 소스 스냅샷 (ios-src와 대부분 겹침) |
| `ios-src/` | 6 | 1.17 MB | iOS Swift 소스 파일 + 이미지 |
| `ICONs/` | 9 | 0.15 MB | IDPASS R2 앱 아이콘 세트 (29~1024px) |
| `리서치/소스이미지/` | 25 | 57.83 MB | Unsplash 원본 (**images/와 24개 중복**) |
| `스크린샷/` | 56 | 51.27 MB | 앱스토어 스크린샷 6종 × 8개 (final/final_65/final_69/ipad/resized/resized_65) |
| `웹크롭/` | 3 | 0.01 MB | 루트 코드의 복사판 (아이콘 3개만 이미지) |
| `(루트)` | 6 | 0.74 MB | 랜딩 페이지용 (be_f_1.jpg, favicon 등) |

**주요 포맷**: PNG 106 / JPG 113 / SVG 3

### 2-2. 서류증명 (116개 / 335.81 MB)

> **용도**: 개인/사업 서류 (R&D 지원, KOITA, 사업자등록)
> **서비스 연관**: 없음
> ⚠️ 개인정보 보호: 파일명 기재 생략

| 하위 분류 | 파일수 | 비고 |
|-----------|--------|------|
| R&D 준비자료/코이타 | 24 | **서류증명/서류증명/ 중첩구조로 24개 중복** |
| koita/ | 16 | 추가사진+최종보완 (**서류증명/서류증명/ 중첩으로 16개 중복**) |
| R&D/디딤돌제출 | 4 | **4개 중복** |
| 사업자등록증 및 필수서류 | 7 | **7개 중복** |
| 인정서 | 2 | **2개 중복** |
| 올드백업 | 2~7 | 변동 |
| (루트) | 1 | |

**⚠️ 핵심 문제**: `서류증명/서류증명/` 중첩 구조가 전체 파일의 약 절반(53개)을 중복시킴. 유니크는 ~63개.

### 2-3. cheolchang (91개 / 133.60 MB)

> **용도**: 철창이(영문명) 리서치 — 스크린샷, 이미지 소스, lipsync PoC
> **서비스 연관**: 리서치 (간접)

| 하위 폴더 | 파일수 | 성격 |
|-----------|--------|------|
| `images/` | 66 | 서비스 스크린샷(2026-03~04), OG카드, Gemini 생성물 |
| `(루트)` | 10 | 로고, 사업 관련 |
| `로고` | 7 | 로고 시안 |
| `project/SNS_COVER` | 6 | SNS 커버 디자인 |
| `project/R&D` | 1 | R&D 관련 |
| `4060_poc/lipsync/` | 1 | lipsync PoC 첫 프레임 |

### 2-4. 철창이 (45개 / 66.57 MB)

> **용도**: 철창이(한글명) 전략 이미지 — 대륙별 에셋, Kimi 에이전트
> **서비스 연관**: idphoto (대륙별 카드), 리서치

| 하위 폴더 | 파일수 | 성격 |
|-----------|--------|------|
| `images/` | 27 | 대륙별 이미지(AFRICA/ASIA/UROPE 등), 서비스 샘플, 스크린샷 |
| `(루트)` | 15 | 리서치 이미지, 작업물 |
| `Kimi_Agent_다변화 로드맵` | 3 | Kimi 에이전트 생성 이미지 |

### 2-5. works (42개 / 0.79 MB)

> **용도**: 팀 공유 서브모듈 (monkos-works)
> **서비스 연관**: portal (슬라이드), SEO

| 하위 폴더 | 파일수 | 성격 |
|-----------|--------|------|
| `config/SEO_files/` | 11 | SEO 관련 이미지 (**SEO_files/logo/와 중복**) |
| `config/SEO_files/logo/` | 11 | ↑ 동일본 |
| `images/portal_slide/resized/` | 20 | 포털 슬라이드 리사이즈 (.webp) |

### 2-6. 이의신청스크린샷 (38개 / 5.76 MB)

> **용도**: 개인 서류 (법적) — ⚠️ 내용 기재 생략
> **서비스 연관**: 없음

### 2-7. 실제샘플 (29개 / 40.19 MB)

> **용도**: 헤드샷 실제 샘플 + LinkedIn 리서치
> **서비스 연관**: headshot (직접)

| 하위 폴더 | 파일수 | 성격 |
|-----------|--------|------|
| `(루트)` | 8 | 헤드샷 실제 참조 (hero.webp, ref.jpg, 모델 사진 등) |
| `링크드인/` | 21 | LinkedIn 헤드샷 스크린샷 (2026-06-17~20, 리서치용) |

### 2-8. 쌍아 (27개 / 36.72 MB)

> **용도**: 레거시 작업물 — Electron 앱 빌드, R&D 서류, 서비스 그래픽
> **서비스 연관**: idphoto (Electron 앱)

| 하위 폴더 | 파일수 | 성격 |
|-----------|--------|------|
| `crop-electron/app/` | 3 | 앱 아이콘 (**3곳 중복**) |
| `crop-electron/dist/.../app/` | 3 | ↑ Windows 빌드 결과물 중복 |
| `crop-offline/` | 3 | ↑ 오프라인 빌드 결과물 중복 |
| `rnd/PDF변환 디딤돌 R&D/동의서/` | 8 | R&D 동의서 (JPG) |
| `(루트)` | 10 | 서비스 그래픽 (crop_id_kr, crop_passport_kr, idpass_feature_graphic 등) |

### 2-9. 소송관련 (21개 / 37.25 MB)

> **용도**: 개인 서류 (법적) — ⚠️ 내용 기재 생략
> **서비스 연관**: 없음

### 2-10. 스크린캡쳐 (15개 / 13.37 MB)

> **용도**: 작업 스크린샷 (날짜 기반, 2026-05-13)
> **서비스 연관**: 없음

### 2-11. 기타

| 폴더 | 파일수 | 용량 | 비고 |
|------|--------|------|------|
| Desktop 루트 | 5 | 6.06 MB | 스크린샷 (2026-05~06) |
| 강한소상공인 | 7 | 2.48 MB | 정부지원 서류 |
| AI 오픈데이터 첼린지 | 1 | 1.06 MB | 공모전 포스터 |
| 헤드샷 | 0 | 0 | 빈 폴더 |
| CaptureOne | 0 | 0 | 앱 캐시/설정만, 이미지 없음 |
| developer/images | 2 | 2.9 MB | IMG_4363.JPG, IMG_4364.JPG |

---

## 3. 중복 탐지

### 3-1. 구조적 중복 (복사된 폴더 구조)

| 중복 유형 | 원본 후보 | 복사본 | 중복 파일수 | 낭비 용량 |
|-----------|----------|--------|------------|----------|
| CROP APP guides 이중화 | `guides/` | `IDPASS/guides/` | 25 | 118.64 MB |
| CROP APP vision 이중화 | `vision/` | `IDPASS/vision/` | 4 | 30.13 MB |
| CROP APP 소스이미지↔images | `images/` | `리서치/소스이미지/` | 24 | ~55 MB |
| CROP APP 웹크롭 전체 복사 | 루트 코드 | `웹크롭/` | 3 | ~0.01 MB |
| CROP APP ios-src 스냅샷 | `ios-src/` | `IDPASS/ios-src-snapshot/` | 6 | ~1.2 MB |
| 서류증명 중첩 구조 | `서류증명/*` | `서류증명/서류증명/*` | 53 | ~162 MB |
| 쌍아 Electron 아이콘 | `crop-electron/app/` | `dist/` + `crop-offline/` | 6 | ~0.03 MB |
| works SEO 이중화 | `SEO_files/` | `SEO_files/logo/` | 11 | ~0.28 MB |

**구조적 중복 소계: ~132개 / ~367 MB**

### 3-2. 산발적 중복 (폴더 간 동일 파일명)

| 파일명 패턴 | 중복 위치 | 건수 |
|------------|----------|------|
| `apple-touch-icon.png`, `favicon-32.png`, `monkos-icon.svg` | CROP APP × 여러 하위 + 쌍아 Electron | 각 최대 7곳 |
| `be_f_1.jpg` | CROP APP images + 리서치 + 루트 + 철창이 + 쌍아 | 5곳 |
| Unsplash 인물사진 (carter, dean, jeff, jonathan 등) | CROP APP images ↔ 리서치/소스이미지 ↔ 철창이/images | 2~3곳 |
| `screenshot_01~08.jpg/.png` | CROP APP 스크린샷 하위 (final/65/69 × 3 + resized × 2) | 3곳 |
| `Custom_s2.jpg`, `DRIVE_s.jpg`, `VISA2.jpg` | CROP APP images ↔ 철창이/images | 2~3곳 |
| `ref.jpg` | CROP APP 루트 + 리서치 + 실제샘플 | 3곳 |
| `photo_2026-03-02_16-16-38.jpg` | 쌍아 루트 + 실제샘플 | 2곳 |

**산발적 중복 소계: ~78개**

### 3-3. 중복 총계

| 구분 | 건수 | 추정 용량 |
|------|------|----------|
| 구조적 중복 | ~132개 | ~367 MB |
| 산발적 중복 | ~78개 | ~53 MB |
| **합계** | **~210개** | **~420 MB** |

---

## 4. GCS 대응 관계

### 4-1. monk-ai-images 버킷 구조

| GCS prefix | 내용 | 파일 규모 |
|------------|------|----------|
| `ads/` | 광고 이미지 (증명사진 샘플) | 10+ |
| `assets/portal/slide/` | 포털 갤러리 슬라이드 | 10 (.webp) |
| `blog/` | 블로그 CMS 업로드 이미지 | 10+ |
| `generated/` | 서비스 생성물 (런타임) | 수백+ |
| `profiles/master/{artist,beauty,executive,fitting,linkedin}/` | 헤드샷 프리셋 마스터 이미지 | 5 카테고리 |
| `profiles/{background,fashion,hair,makeup}/` | 헤드샷 축별 에셋 | 아직 .keep만 (빈) |
| `raw_data/{bwya_academy,kbeauty_sources}/` | 크롤 원본 데이터 | 2 카테고리 |
| `service/idphoto/{kr,jp}/` | 고객 생성물 (UID별 폴더) | 수백+ |

### 4-2. monk-customer-photos 버킷

| GCS prefix | 내용 |
|------------|------|
| `service/` | 고객 업로드 원본 사진 |

### 4-3. 로컬 ↔ GCS 매핑

| GCS prefix | 로컬 대응 | 동기화 상태 | 비고 |
|------------|----------|------------|------|
| `ads/` | **없음** | GCS only | studio/idphoto-jp HTML에서 URL 직접 참조 |
| `assets/portal/slide/` | `works/images/portal_slide/resized/` (20개) | 수동 업로드 | 로컬은 리사이즈본 |
| `blog/` | **없음** | GCS only | 블로그 CMS API 경유 업로드 |
| `generated/` | **없음** | 런타임 | 서비스가 자동 생성 |
| `profiles/master/` | **없음** | GCS only | templates.js가 URL 참조 |
| `profiles/{4축}/` | **없음** | 빈 버킷 | 향후 에셋 대기 |
| `raw_data/` | **없음** | GCS only | 데이터 파이프라인 |
| `service/idphoto/` | **없음** | 런타임 | 고객 생성물 |

**결론**: GCS 7개 prefix 중 **로컬 대응은 assets/portal/slide 1건뿐**. 나머지는 모두 서비스/API 경유.

### 4-4. 코드 레포 내 이미지 현황 (Git 추적)

| 위치 | 이미지수 | 성격 |
|------|---------|------|
| `MONK_kr/images/specs/guides/` | 137 | 규격 가이드 (CF Pages 정적 에셋) |
| `MONK_kr/monk_studio/*/images/` | 36 | 서비스 페이지 이미지 |
| `MONK_kr/(루트+images/)` | 10 | 파비콘, OG이미지 |
| `monkos_AI/portal/public/images/` | 41 | 포털 에셋 (가이드 29 + 카드 4 + 대륙 6 + 아이콘 1 + hero 1) |
| `monkos_AI/studio/public/` | 6 | 스튜디오 에셋 |
| `monkos_AI/idphoto-{kr,jp}/public/` | 13 | 증명사진 서비스 에셋 |
| `monkos_AI/crop-app/public/` | 6 | 크롭앱 에셋 |

**Git 내 총 이미지: ~249개** (별도 집계, Desktop과는 독립)

---

## 5. 코드→이미지 참조 관계

### 5-1. CROP APP 내부 참조

| HTML 파일 | 참조 이미지 | 참조 방식 |
|-----------|------------|----------|
| `index.html` | (없음 — 런타임 동적 로드) | JS `photo.src = ...` |
| `idpass_landing_v2.html` | `before.jpg`, `after.jpg` | 로컬 `images/` 상대경로 |
| `IDPASS Thanks C3.html` | `ID_Photosample.jpg` | JS 기본값 |
| `monkos_continent_cards*.html` | (없음 — 외부 URL) | Unsplash CDN + flagcdn.com |
| `MONKOS Crop iOS Exploration.html` | (없음) | React 컴포넌트 |

### 5-2. 서비스 코드 (monkos_AI) → GCS 참조

| 코드 파일 | 참조 GCS prefix | 참조 방식 |
|-----------|----------------|----------|
| `studio/public/index.html` | `ads/` | `<img src="https://storage.googleapis.com/monk-ai-images/ads/...">` |
| `idphoto-jp/public/index.html` | `ads/` | 동일 |
| `studio/public/profiles/templates.js` | `profiles/master/` | `GCS_BASE` 상수 |
| `portal/public/index.html` | `assets/portal/slide/` | `<img src="https://storage.googleapis.com/...">` |
| `idphoto-jp/public/result.js` | `ads/manifest.json` | 광고 매니페스트 URL |
| `studio/gcs-save.js` | `monk-customer-photos` | 고객 사진 저장 |

### 5-3. 공유 에셋 식별

다음 파일은 3곳 이상에서 참조/존재:

| 파일 | 존재 위치 | 공유 에셋 여부 |
|------|----------|--------------|
| `apple-touch-icon.png` | CROP APP, 쌍아/crop-electron, 쌍아/crop-offline, 웹크롭 등 7곳 | ✅ 공통 아이콘 |
| `monkos-icon.svg` | 동일 7곳 | ✅ 공통 아이콘 |
| `favicon-32.png` | 동일 7곳 | ✅ 공통 아이콘 |
| `be_f_1.jpg` | CROP APP images/리서치/루트, 철창이 | ✅ 서비스 샘플 |
| `ref.jpg` | CROP APP 루트, 리서치, 실제샘플 | ✅ 참조 이미지 |

---

## 6. 핵심 발견

### 6-1. CROP APP은 "뿌리" — 가장 큰 에셋 집합이자 가장 큰 중복원

222개 중 실제 유니크는 **~130개** (나머지 ~92개는 내부 중복). 단일 폴더에 서비스 에셋 + Unsplash 소스 + 가이드 + 스크린샷 + 코드가 혼재.

### 6-2. 서류증명의 "안에 또 서류증명" 문제

`~/Desktop/서류증명/서류증명/` 중첩 구조로 53개 / ~162 MB가 순수 낭비. 즉시 정리 대상 1순위.

### 6-3. cheolchang ↔ 철창이: 같은 사람, 다른 폴더

영문명(cheolchang)과 한글명(철창이) 폴더가 분리되어 있으나, images/ 내 직접 겹침은 없음. 그러나 둘 다 철창이 리서치 산출물이므로 통합이 자연스러움.

### 6-4. 로컬과 GCS의 단절

GCS에 올라간 이미지의 로컬 원본이 어디에도 없음. "이 GCS 이미지의 원본은 어디?" → 답 없음. 이것이 monk.kr FTP 시절 대비 직관이 깨진 핵심 원인.

### 6-5. 개인 서류가 서비스 에셋과 같은 레벨에 혼재

Desktop 루트에 소송관련(37 MB), 이의신청(5.7 MB), 서류증명(335 MB), 강한소상공인(2.5 MB) 등 **380 MB의 개인 서류**가 서비스 에셋과 같은 깊이에 존재.

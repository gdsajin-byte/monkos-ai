---
type: order
date: 2026-06-24
from: iMac/쌍아
to: 막내
portfolio: PF_PORTAL
status: 대기
---

# Specs v2 파일럿 — kr-passport 카드형 리디자인 + 인라인 생성

> **[2026-06-24 15:41 KST]** iMac/쌍아 → 막내
> 배경: specs 페이지 디자인 리뉴얼. 클로드 디자인 시안 기준. kr-passport 1페이지로 파일럿 테스트 후 전체 확장.
> 참조: 작가님 시안 스크린샷 (카드형 레이아웃, 3스텝 플로우, FAQ, CTA 배너)

---

## 시안 구조 (위→아래)

### 1. 헤더
- 브레드크럼: `규격 가이드 > 대한민국 > 여권`
- 태그 칩: `대한민국 · 여권 · 운전면허증`
- H1: `한국 여권 · 운전면허증`
- 서브: `Korea Passport · Driver's License Photo Specification`

### 2. 핵심 규격 카드
2컬럼: 좌=스펙 테이블, 우=규격 다이어그램

**좌 — 스펙 테이블** (라벨: 값 형식):
| 라벨 | 값 | 뱃지 |
|------|---|------|
| 사진 크기 | 35 × 45 mm | 그룹 A |
| 권장 해상도 | 413 × 531 px | |
| 인쇄 품질 | 300 DPI 이상 | |
| 배경 | 균일 흰색 | |
| 머리 높이 | 32-36mm | 필수 |
| 유효 기간 | 6개월 이내 | |
| 파일 용량 | 500KB 이하 | |
| 파일 형식 | JPEG | |

데이터 출처: `specs-data.json`의 `kr-passport` 엔트리. size, pixels, dpi, background, headHeight, validity, fileSpec 필드 활용.

**우 — 규격 다이어그램**:
- 증명사진 예시 이미지 (정적 에셋 또는 placeholder)
- 가로/세로 치수 표기 (35mm × 45mm)
- 머리 높이 범위 표기 (32-36mm)
- CSS로 라인+텍스트 오버레이

### 3. 3스텝 플로우 카드
제목: `내 사진을 35×45mm 규격으로`
부제: `셀카 한 장을 올리면 배경·머리높이·크기를 규격에 맞춰 자동 변환합니다.`
뱃지: `약 30초 소요`

3컬럼 스텝:
- **STEP 1 · 사진 업로드**: 업로드 UI (파일 선택 또는 드래그). 하단 캡션 "자유로운 배경·구도 OK"
- **STEP 2 · 규격 변환**: 변환 결과 프리뷰. "35×45mm" 오버레이 + 체크. 캡션 "흰 배경 · 머리높이 자동 보정"
- **STEP 3 · 저장**: 다운로드 버튼 + "고해상도 413×531px". 캡션 "JPEG · 500KB 이하"

**기능 구현**:
- STEP 1: `<input type="file">` + 드래그앤드롭. 업로드 시 `POST /api/generate` (idphoto-kr 엔진) 호출. 파라미터: `{ image: base64, spec: 'kr-passport' }`
- STEP 2: API 응답의 결과 이미지를 프리뷰에 표시
- STEP 3: 결과 이미지 다운로드 (base64 → blob → download link)

**엔진 연동 — 포털 내부 엔드포인트**:
- `studio.monkos.ai/server.js`의 `/api/idgen` 로직(buildPromptV5 + Gemini I2I)을 포털에 이식
- 포털 `server.js`에 `POST /api/idphoto/generate` 신설 (헤드샷 `/api/headshot/generate`와 동일 패턴)
- 파라미터: `{ image: base64, format: 'kr-passport', gender, age }`
- 응답: `{ image: 'data:image/png;base64,...' }`
- studio의 `buildPromptV5` 함수와 Imagen 프롬프트를 `lib/idphoto.js`로 분리 이식
- 크레딧 차감은 기존 headshot 패턴 준용 (useCredits)
- 참조: `monkos_AI/studio/server.js:487~545` (idgen), `:264~` (buildPromptV5)

### 4. 상세 규정 + 반려사유 TOP5
2컬럼 카드:

**좌 — 상세 규정**:
- `specs-data.json`의 `details.ko` 활용
- 현재 비어있으면 kr-passport 기본 규정 하드코딩 (추후 데이터 이관):
  - 촬영 6개월 이내, 정면을 응시한 상반신 사진
  - 균일한 흰색 배경, 그림자·무늬·테두리 없음
  - 입은 다물고 무표정 — 치아가 보이면 반려
  - 안경 착용 시 빛 반사·뿔테로 눈 가림 금지 (운전면허는 무안경 권장)
  - 머리카락·장신구로 얼굴 윤곽을 가리지 않을 것
  - 컬러 사진, 자연스러운 피부 톤 · 과도한 보정 금지

**우 — 반려사유 TOP 5**:
- `specs-data.json`의 `rejectionReasons.ko` 활용
- 번호 리스트 형태 (1~5). 각 항목에 제목 + 부연 한 줄

시안 기준 반려사유:
1. 배경 그림자 / 음영 — 얼굴 앞·뒤로 그림자가 생긴 경우
2. 머리 높이 규격 초과 — 정수리~턱이 32-36mm 범위를 벗어남
3. 표정 · 미소 — 입을 벌리거나 치아가 보이는 사진
4. 안경 반사 / 컬러렌즈 — 렌즈에 빛 반사 또는 색조 렌즈 착용
5. 앞머리·장신구로 얼굴 가림 — 이마·눈썹·귀 윤곽이 가려진 경우

### 5. 같은 사진으로 제출 가능한 서류
제목: `같은 사진으로 제출 가능한 서류`
부제: `아래 서류는 한국 여권·운전면허증과(와) 동일 규격(35×45mm)입니다.`

태그 카드 형태:
- 여권 35×45mm (아이콘)
- 주민등록증 35×45mm (아이콘)
- 운전면허증 35×45mm · 무안경 권장 (아이콘)

각 태그를 클릭하면 해당 specs 페이지로 이동.
같은 사이즈 규격은 `specs-data.json`에서 동일 `size` 필드로 필터링.

### 6. FAQ 아코디언
제목: `자주 묻는 질문`

Q/A 3~5개:
- `specs-data.json`의 `faq` 필드 활용 (현재 없으면 kr-passport용 하드코딩)

시안 기준:
- Q: 여권사진과 운전면허증 사진이 같나요? A: 네, 동일합니다...
- Q: AI로 만든 얼굴 사진을 제출해도 되나요? A: 아니요...
- Q: 온라인 신청용 파일 규격은 어떻게 되나요? A: 413×531px...

**+ FAQPage 구조화 데이터**: `<script type="application/ld+json">` 자동 삽입 (기존 블로그 FAQ 패턴 준용)

### 7. 하단 CTA 배너
보라색 풀와이드 배너:
- 제목: `규격에 맞는 여권사진, AI로 자동 완성`
- 부제: `셀카 한 장이면 35×45mm · 균일 흰색 배경으로 30초 만에 변환`
- 버튼: `지금 만들기 →` → 페이지 상단 3스텝으로 스크롤 또는 idphoto-kr 링크

---

## 구현 가이드

### 파일 구조
- `render-specs.js`의 `specsDetailFragment` 함수에 **v2 렌더링 분기** 추가
- `slug === 'kr-passport'`일 때만 v2 템플릿 적용. 나머지는 기존 유지
- CSS는 `specsDetailFragment` 내 `pageStyle`에 인라인
- 3스텝 JS는 `pageScript`에 인라인 (외부 파일 불필요)

### 다국어
- kr-passport는 ko 전용으로 시작. en/ja는 데이터가 있으면 자동 분기 (기존 패턴 유지)
- 텍스트팩 분기: `lang === 'ko' ? '...' : lang === 'ja' ? '...' : '...'`

### 반응형
- 모바일: 2컬럼 → 1컬럼, 3스텝 가로 → 세로
- `@media (max-width: 768px)` 분기

---

## ⚠️ 준수 조항

- 배포는 `deploy.sh` 경유 필수 (ch5 2조)
- 기존 specs 페이지 렌더링 깨뜨리지 않을 것 — kr-passport만 분기
- 포털 내부 `/api/idphoto/generate` 신설. studio 코드 이식 (외부 서비스 호출 금지)
- 기밀: 엔진명(Gemini/Imagen) 미노출 (헌법 4조 3항). "AI 자동 처리"로 표기

## 완료 기준

- [ ] kr-passport v2 카드형 레이아웃 렌더링
- [ ] 3스텝 플로우 UI (업로드→프리뷰→다운로드)
- [ ] 엔진 연동 (idphoto-kr API)
- [ ] 상세규정 + 반려사유 + FAQ + CTA 배너
- [ ] 모바일 반응형
- [ ] FAQPage 구조화 데이터
- [ ] 기존 specs 페이지 무결성 유지
- [ ] 완료 보고 (헌법 3조 2항)

---
type: order
date: 2026-05-18
from: iMac/쌍아
to: 막내1
status: 발행
portfolio: PF_IDPHOTO
---

# 지시서: PF_IDPHOTO 개설 — 주력 상품 포트폴리오 통합 승격

## 배경

MONKOS 증명사진은 주력 상품이지만 PF가 분산되어 있음:
- **PF_PHOTOPRO**: 웹 증명사진 서비스 (idphoto-kr/jp, 결제 퍼널, AI 생성)
- **PF_CROP**: IDPASS 크롭앱 (SwiftUI, Vision, 202국 규격)

이 둘을 **PF_IDPHOTO**로 통합하고, 과거 개발 과정은 히스토리로 수렴, 현재 리팩토링(iOS 네이티브 전환, 결제 구조 개편)은 새로운 Phase로 시작한다.

논문 수준의 정본 PF로 구축한다.

## 임무

### 1. PF_IDPHOTO 개설

`monkos-ops/ops/portfolios/PF_IDPHOTO/README.md` 생성.

**YAML 필수 필드:**
```yaml
type: portfolio
id: PF_IDPHOTO
name: "IDPHOTO"
subject: "MONKOS 증명사진 — IDPASS(iOS) + AI 생성(Web/App) 통합 상품"
created: 2026-01-11
owner: 작가님
leads: "쌍아(설계), 막내(실행)"
status: active
```

### 2. 비전 섹션

**"AI로 누구나 전문가 수준의 증명사진을 30초 안에 완성 — 크롭은 무료, AI 생성은 $2"**

포지셔닝:
- IDPASS(크롭+배경제거+규정검증) = **무료 배포** → 유입 깔때기
- AI 증명사진 생성 = **$1.99/컷** → 매출
- 경쟁사는 크롭만으로 $1.50 받는데 우리는 무료

### 3. 히스토리 섹션 — 과거 개발 과정 흡수

PF_PHOTOPRO + PF_CROP의 히스토리를 **시간순 통합**. 아래 소스 전수 읽어서 병합:

- `PF_PHOTOPRO/README.md` 히스토리 테이블 전체
- `PF_CROP/README.md` 히스토리 테이블 전체
- 관련 세션 로그에서 주요 마일스톤 보충 (5/13 M1 원격 빌드, 5/15 200국 전수조사, 5/16 iPhone 실기기 성공, 5/17 대륙카드 이미지 등)

Phase 구분:
- Phase 0: Image Pro MVP (01/11~)
- Phase 1: idphoto-kr/jp 웹 서비스 (01/16~02/14)
- Phase 2: 이관 + 결제 퍼널 v5 (02/26~03/05)
- Phase 3: 운영 + 진단 (03~04)
- Phase 4: IDPASS 크롭앱 개발 (03/11~05/17) — PF_CROP 흡수
- **Phase 5: 통합 리팩토링 (05/18~)** — 신규 시작점

### 4. Phase 5 — 통합 리팩토링 (신규)

오늘(5/18) 확정된 방향을 Phase 5로 기술:

**5-A. iOS 네이티브 앱 (IDPASS 확장)**
- SwiftUI 기반 단일 앱
- 무료 구간: Vision 실시간 코칭 + 크롭 + 배경제거 + 규정검증 (온디바이스)
- 유료 구간: AI 생성 $1.99 (StoreKit 2 IAP)
- 인증: Sign in with Apple + Google
- Gemini Live → Vision 대체 (API 비용 제로, 레이턴시 제로)

**5-B. 결제 구조 개편**
- 첫 체험 $1 단건 (계정 불필요)
- 재구매 시 크레딧 전환 유도 (이 시점에 OAuth)
- 이중 과금: 앱 IAP($1.99) + 웹 크레딧(보너스 마케팅)
- 웹 크레딧 충전 시 20% 보너스 → 자연스러운 웹 전환 유인
- Apple 수수료 30% vs 웹 3~5% 차익 활용

**5-C. Gemini 2.0 마이그레이션**
- Track A: 2.0-flash → 2.5-flash (D-14, 코드 교체 완료, 배포 승인)
- Track B: Live 모델 → 3.1-flash-live-preview (테스트 후 판단)
- iOS에서는 Vision 대체로 Live 의존 제거

**5-D. 환불정책**
- 현 단계: 유입 우선, "100% 만족 보장" 마케팅 활용 검토
- 추후: 볼륨 증가 시 환불 방어 설계

### 5. 관련 문서 인덱스

아래 문서들을 인덱스에 등록:

- `AGENDA_20260518_결제전환_크레딧폐지_직접결제.md`
- `REPORT_20260518_막내1_AI증명사진_가격전수조사.md` (47개 서비스, 컷당 단가)
- `REPORT_20260518_막내2_Gemini모델_마이그레이션조사.md`
- `REPORT_20260518_막내2_Gemini2.0_마이그레이션_실행.md`
- `REPORT_20260518_막내3_증명앱_iOS전환_난이도분석.md`
- PF_PHOTOPRO, PF_CROP 기존 문서 전체

### 6. PF_PHOTOPRO / PF_CROP 상태 변경

- PF_PHOTOPRO: status → `completed (merged → PF_IDPHOTO)`
- PF_CROP: status → `completed (merged → PF_IDPHOTO)`
- 각 README.md 상단에 리다이렉트 노트: `> ⚠️ 본 PF는 PF_IDPHOTO로 통합되었습니다.`

### 7. 인덱스 갱신

`portfolios/README.md`에 PF_IDPHOTO 추가 + PF_PHOTOPRO/PF_CROP merged 표기

## 산출물

- `monkos-ops/ops/portfolios/PF_IDPHOTO/README.md` — 논문 수준 정본
- PF_PHOTOPRO, PF_CROP status 갱신
- portfolios/README.md 인덱스 갱신
- 완료 후 커밋

## ⚠️ 준수 조항

- 히스토리 append only (ch4 9조). 기존 PF 히스토리 원문 보존하며 병합
- PF_PHOTOPRO/PF_CROP 삭제 금지. status 변경 + 리다이렉트 노트만
- YAML 필수 필드 준수 (ch4 9조)
- 500줄 초과 시 아카이브 트리거 고려

---
type: order
date: 2026-07-19
device: iMac
agent: 쌍아
target: 막내1
portfolio: PF_SPECS
status: 대기
priority: P1
---

# 지시서: guide/ai-photo 페이지 콘텐츠 보강 — 9위→상위 진입

**[2026-07-19 18:27 KST]** iMac/쌍아 → 막내1

## 배경

`/guide/ai-photo` 페이지가 "증명사진 ai 보정 사이트" 계열 키워드에서 구글 9위. 콘텐츠 보강으로 상위 진입 가능한 포지션. 현행 콘텐츠가 일반론 수준이라 차별화 부족.

- GSC 30일: 노출 111, 클릭 6, 평균 17위
- 9위 키워드: "증명사진 ai 보정 사이트", "무료 증명사진 만들기", "증명사진 만들기 사이트"

## ⚠️ 준수 조항

- 가격 하드코딩 금지 — config.js 정본 참조 (ch2 7조)
- 브랜딩: "MONKOS" 통일 (ch8)
- en/ja 번역: 한국어 원본 확정 후 번역 (기존 ko만 구현, en/ja는 ko 폴백 중)
- deploy.sh 경유

## 작업

### Task 1. 콘텐츠 보강 (render-static.js aiPhotoGuideFragment)

**추가/개선 항목:**

1. **실 생성 비포/애프터 이미지** — 기존 guide 이미지(`guide-selfie.jpg`, `guide-profile.jpg`) 활용하거나, specs 퍼널의 샘플 이미지 참조. 실제 변환 전후가 보여야 CTR 상승.

2. **지원 규격 섹션 강화** — 현행 "26개국"을 실측 기반으로 갱신:
   - "429가지 규격" (현행 슬러그 수)
   - 주요 국가 목록 (한국·일본·미국·영국·중국 등) + `/specs` 링크
   - "여권·비자·이력서·운전면허·주민등록증" 유형별 나열

3. **가격 비교표** — 현행 "무료~3,000원" 하드코딩 → config.js PRODUCTS에서 파생. 또는 최소한 "무료(T0) / 프리미엄(T1)" 2단 구조 명시.

4. **SEO 메타 보강:**
   - title에 "무료" 키워드 강화 (현행에 이미 있으나 순서 조정 검토)
   - description에 "셀프 촬영", "규격 자동 크롭", "429가지 규격" 등 구체 수치
   - 구조화 데이터 HowTo step 4단계로 확장 (현행 3단계 → 규격 선택 추가)

5. **CTA 보강** — specs 국가별 바로가기 추가 (한국 여권, 일본 여권 등 인기 3~5개 직링크)

### Task 2. en/ja 번역 구현

현행 i18n 객체에 ko만 있음. en/ja 키 추가:
- 영어: "Create AI ID Photos — Free Online Tool Comparison & Guide 2026"
- 일본어: "AI証明写真の作り方 — 無料サイト比較・価格・使い方 2026"

기본 번역만 — 완벽하지 않아도 ko 폴백보다 나음.

### Task 3. 테스트 + 배포

```bash
npm test
./deploy.sh
```

### Task 4. 라이브 확인

- `/guide/ai-photo` 한국어 페이지 정상 렌더
- `/en/guide/ai-photo` 영어 페이지 렌더 (ko 폴백 아닌 en 콘텐츠)
- `/ja/guide/ai-photo` 일본어 페이지 렌더

## 커밋

```
[feat] guide/ai-photo 콘텐츠 보강 — 429규격·비포애프터·가격 정본·en/ja 번역
```

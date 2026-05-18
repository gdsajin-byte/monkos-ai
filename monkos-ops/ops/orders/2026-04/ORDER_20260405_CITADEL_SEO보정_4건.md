---
type: order
date: 2026-04-05
author: M1/민아
assignee: M1/막내
portfolio: PF_CITADEL
priority: P0
status: 대기 (작가님 승인 후 하달)
---

# 지시서: CITADEL SEO 기술 보정 4건

**[2026-04-05 07:08 KST] M1/민아 → 작가님 (승인 요청)**

> 근거: 2026-04-05 SEO 진단 결과 (REPORT_20260405_M1민아_monkosai_애널리틱스_종합분석.md)
> 영향 범위: monkos.ai 전체 SEO 신호 품질
> 예상 작업량: 각 건 30분 이내

---

## 배경

- 구글 자연검색 3개월간 클릭 27회 — 사실상 SEO 무존재
- 기술적 SEO 기반은 70~75점 수준 (시타델 Phase 0~1 성과)
- 콘텐츠 100개+가 이미 존재하나, 기술 신호 빈틈으로 인해 구글이 제대로 인식 못 하는 구간 존재
- 도메인 age 4개월 → 기술 신호 품질이 순위에 미치는 영향이 더 큼

---

## 건 1: JA/EN 페이지 메타 태그 현지화 [P0]

### 현상
```
JA 메인: title="MONKOS AI | AI 증명사진 · 여권사진 · 이력서사진" ← 한국어
EN 메인: title="MONKOS AI | AI 증명사진 · 여권사진 · 이력서사진" ← 한국어
JA canonical: https://monkos.ai/ ← KO 메인으로 설정
EN canonical: https://monkos.ai/ ← KO 메인으로 설정
description도 한국어 그대로
```

### 문제
- 구글이 JA/EN 페이지를 **한국어 중복 콘텐츠**로 판단 → 색인 제외 가능성
- 일본 구글 검색에서 한국어 제목이 노출 → CTR 저하
- hreflang은 있지만 canonical이 KO를 가리키므로 상충 신호 발생

### 작업
1. `/ja/` 메인 페이지:
   - `<title>` → `MONKOS AI | AI証明写真 · パスポート写真 · 履歴書写真`
   - `<meta name="description">` → 일본어로 변경
   - `<link rel="canonical">` → `https://monkos.ai/ja/`
   - `og:title`, `og:description` → 일본어
   - `og:url` → `https://monkos.ai/ja/`

2. `/en/` 메인 페이지:
   - `<title>` → `MONKOS AI | AI ID Photos · Passport Photos · Resume Photos`
   - `<meta name="description">` → 영어로 변경
   - `<link rel="canonical">` → `https://monkos.ai/en/`
   - `og:title`, `og:description` → 영어
   - `og:url` → `https://monkos.ai/en/`

### 검증
- CDP로 `/ja/`, `/en/` 접속 → 메타 태그가 각 언어로 출력 확인
- hreflang과 canonical이 상충하지 않는지 확인

---

## 건 2: Crop 페이지 hreflang 추가 [P1]

### 현상
```
Crop: hreflang 0개 (KO만 존재, JA/EN 버전 없음)
Crop: H1 태그 누락
```

### 문제
- "증명사진 사이즈 변환", "여권사진 규격 맞추기" 키워드 공략 가능한 페이지인데 다국어 신호 없음
- H1 누락은 구글이 페이지 주제를 파악하는 데 불리

### 작업
1. Crop 페이지에 hreflang 추가 (최소 ko, ja, x-default)
   - JA 크롭 페이지가 존재하면 연결, 없으면 ko를 x-default로
2. H1 태그 추가: `<h1>증명사진 무료 크롭 — ICAO 규격 자동 맞춤</h1>` (또는 기존 타이틀 활용)

### 검증
- CDP로 `/crop` 접속 → hreflang 존재 + H1 출력 확인

---

## 건 3: Blog 목록 페이지 JSON-LD 추가 [P1]

### 현상
```
/blog: JSON-LD 0개
/blog 개별 포스트: Article JSON-LD 있음 (정상)
```

### 문제
- 블로그 허브 페이지에 구조화 데이터가 없으면, 구글이 "이 페이지가 블로그 목록"임을 인지 못 함
- 개별 포스트는 Article로 잘 되어 있으니 허브만 보완하면 됨

### 작업
1. `/blog` 페이지에 `CollectionPage` 또는 `Blog` JSON-LD 추가
   ```json
   {
     "@context": "https://schema.org",
     "@type": "Blog",
     "name": "MONKOS AI 블로그",
     "description": "AI 증명사진 팁, 가이드, 최신 뉴스",
     "url": "https://monkos.ai/blog",
     "publisher": {
       "@type": "Organization",
       "name": "MONKOS AI"
     }
   }
   ```
2. `/ja/blog`, `/en/blog`에도 언어별 JSON-LD 추가

### 검증
- CDP로 `/blog` 접속 → JSON-LD 파싱 확인

---

## 건 4: 이미지 alt 누락 보정 [P2]

### 현상
- 메인 페이지 이미지 12개 중 1개 alt 미설정

### 작업
- 누락된 이미지의 `alt` 속성 추가 (이미지 내용을 설명하는 한국어 텍스트)

### 검증
- CDP로 메인 접속 → `img_no_alt` 0개 확인

---

## 작업 순서

1. **건 1** (JA/EN 메타 현지화) — 가장 영향 큼
2. **건 2** (Crop hreflang + H1)
3. **건 3** (Blog JSON-LD)
4. **건 4** (이미지 alt)

## 커밋 규칙

- 건별 개별 커밋
- 커밋 메시지: `[seo] CITADEL 건N: {내용 요약}`
- 배포 후 GSC에서 URL 검사 → 라이브 테스트 실행

---

**작가님 승인 요청드립니다.**

---
type: strategy
date: 2026-03-13
author: iMac/쌍아
status: draft
---

# MONKOS 콘텐츠 전략 — 2026 Q1

> monkos.ai를 SEO 콘텐츠 허브로 전환. 외부 채널은 유통망, 자사 도메인이 원본.

## 1. 현황 진단

### 외부 채널 현황

| 채널 | URL | 콘텐츠 | 상태 |
|------|-----|--------|------|
| 네이버 블로그 | blog.naver.com/monkos_ai | **440건** | 대부분 old, 카테고리 다양 |
| note.com | note.com/monkos_ai | 7+건 (JP) | 활발, 주 3~5건 발행 |
| Blogger | monkos-ai.blogspot.com | 2건 (EN) | 초기 |
| X | @MONKOS_AI | 초기 | 링크 배포용 |

### 문제점

- **monkos.ai 콘텐츠 = 0건** — CMS 인프라만 구축, 콘텐츠 미투입
- note.com에 주 7건씩 올리면서 SEO 파워가 전부 남의 도메인에 기부되는 구조
- 네이버 블로그 440건은 네이버 검색에서만 효과 — 구글 SEO 기여 거의 없음
- 자사 도메인 크롤 가능 페이지: 5장 (랜딩 + 약관류)

### 핵심 인사이트

> **콘텐츠는 이미 생산되고 있다. 문제는 자사 도메인에 안 쌓인다는 것.**

---

## 2. 전략 방향

### 원칙

1. **monkos.ai = canonical 원본** — 모든 콘텐츠의 1차 발행처
2. **외부 채널 = 유통망** — 원문 링크 포함한 2차 배포
3. **자동번역 = 콘텐츠 3배 증폭기** — 1건 작성 → ko/ja/en 3건 자동 생성
4. **역수입 = 기존 자산 회수** — 외부에 흩어진 핵심 콘텐츠를 monkos.ai로

### 다국어 URL 구조 (구현 완료)

```
monkos.ai/blog/{slug}       ← 한국어 (기본, 접두사 없음)
monkos.ai/ja/blog/{slug}    ← 일본어
monkos.ai/en/blog/{slug}    ← 영어
```

- hreflang 자동 연결
- canonical URL 각 언어별 설정
- sitemap.xml 다국어 반영

---

## 3. 콘텐츠 카테고리 & 필진

### 카테고리 체계

| 카테고리 | 슬러그 접두사 | 필진 | SEO 가치 |
|---------|-------------|------|---------|
| 나라별 비자사진 규정 | `visa-photo-{country}` | 작가님/AI | **최상** — 서비스 직결, 검색 수요 높음 |
| MONKOS 사용법/팁 | `guide-{topic}` | 작가님 | **상** — 서비스 전환율 직결 |
| HAN's BEAUTY | `beauty-{topic}` | 한송이 | **상** — 증명사진 메이크업/헤어 |
| KKU's DISIGN | `design-{topic}` | 꾸 | **상** — 신규 구성 중, 바로 당기기 |
| SHIN's AI story | `story-{topic}` | 작가님 | **중** — 창업/브랜드 스토리 |
| 몽크사진관 | `studio-{topic}` | 작가님 | **중** — 현장 비하인드 |

### 필진별 워크플로우

**작가님/한송이/꾸** (Toast UI 에디터):
```
monkos.ai/admin/blog-edit → 한국어 작성 → 발행
  ↓ 자동
Gemini 2.0 Flash → ja/en 자동번역 → 발행
  ↓ 수동 or 자동화 예정
네이버/note.com/Blogger/X → 2차 배포 + 원문 링크
```

---

## 4. 역수입 계획

### Phase 1: 핵심 콘텐츠 (즉시)

**note.com → monkos.ai/ja/blog/**

| # | note.com 제목 | monkos.ai slug | 비고 |
|---|--------------|----------------|------|
| 1 | 写真館12年、AI証明写真アプリを開発した写真家の話 | `story-12-years-photographer` | 창업 스토리 |
| 2 | 手のひらの写真館 Monkos.ai の使い方 | `guide-how-to-use` | 사용법 |
| 3 | パスポート写真 チェックマーク | `visa-photo-passport-checklist` | 비자사진 |
| 4 | 就活写真と面接に必要な服装＆面接ヘア | `beauty-interview-hair-outfit` | HAN's BEAUTY |
| 5 | 証明写真がキレイに撮れる表情＆ポーズ練習法 | `guide-photo-expression-pose` | 촬영 팁 |
| 6 | 証明写真・面接ヘアメイクに重要な角質ケア | `beauty-skin-care-for-photo` | HAN's BEAUTY |
| 7 | おうちでできるボリュームアップ法 | `beauty-volume-up-at-home` | HAN's BEAUTY |

**Blogger → monkos.ai/en/blog/**

| # | Blogger 제목 | monkos.ai slug |
|---|------------|----------------|
| 1 | 12 Years Running a Photo Studio — Why I Built an AI ID Photo App | `story-12-years-photographer` |
| 2 | What Is AI, Really? — A Photographer's Honest Take | `story-what-is-ai-photographer` |

**네이버 → monkos.ai/blog/** (선별)

| 우선순위 | 카테고리 | 예상 선별 건수 | 방식 |
|---------|---------|-------------|------|
| 1순위 | 나라별 비자사진 규정 | 전량 | 재구성 후 역수입 |
| 2순위 | MONKOS AI (서비스 관련) | 5~10건 | 핵심 발췌 재구성 |
| 3순위 | HAN's BEAUTY | 5건 | 증명사진 연결 콘텐츠만 |
| 4순위 | KKU's DISIGN | 신규 | monkos.ai 원본으로 바로 작성 |
| 차단 | 여행/여긴어때 (304건) | 0 | 서비스 무관 — 네이버에만 유지 |
| 차단 | Old 카테고리 | 0 | 구 콘텐츠 — 네이버에만 유지 |

### Phase 2: 외부 채널 원문 링크 추가

역수입 완료 후, 각 외부 포스트에 원문 링크 삽입:

- **note.com**: 포스트 하단에 `原文はこちら → monkos.ai/ja/blog/...`
- **Blogger**: 포스트 하단에 `Read original → monkos.ai/en/blog/...`
- **네이버**: 포스트 하단에 `원문 보기 → monkos.ai/blog/...`

### Phase 3: 동시배포 자동화 (향후)

monkos.ai CMS 발행 → 각 채널 API 자동 배포
- note.com: API 없음 → 수동 or 브라우저 자동화
- Blogger: Blogger API v3 → 자동 가능
- 네이버: 네이버 블로그 API → 자동 가능
- X: X API → 링크 포스트 자동 가능

---

## 5. SEO 킬러 콘텐츠: 나라별 비자사진 규정

> 검색량 높고, 서비스 전환율 직결. monkos.ai의 SEO 주력 무기.

### 구성 예시

```
/blog/visa-photo-korea         → 한국 여권/비자사진 규정
/blog/visa-photo-japan         → 일본 パスポート写真 규정
/blog/visa-photo-usa           → 미국 Passport Photo 규정
/blog/visa-photo-schengen      → 유럽 셴겐 비자사진 규정
/blog/visa-photo-china         → 중국 签证照片 규정
/blog/visa-photo-uk            → 영국 Passport Photo 규정
/blog/visa-photo-canada        → 캐나다 규정
/blog/visa-photo-australia     → 호주 규정
```

각 포스트:
- 나라별 사진 규격 (크기, 배경색, 표정, 안경 등)
- MONKOS AI로 규격 맞추는 방법 (서비스 연결)
- 자동번역 3개국어 → 각 나라 검색에 노출

---

## 6. 우선순위 로드맵

| 순서 | 작업 | 담당 | 시기 |
|------|------|------|------|
| 1 | note.com 7건 역수입 → /ja/blog/ | 막내 (Firestore 직접 시드) | 이번 주 |
| 2 | Blogger 2건 역수입 → /en/blog/ | 막내 | 이번 주 |
| 3 | 나라별 비자사진 규정 5~10개국 작성 | 작가님 + AI 보조 | 이번 주~다음 주 |
| 4 | KKU's DISIGN 신규 콘텐츠 monkos.ai 원본 발행 | 꾸 (CMS 직접) | 즉시 |
| 5 | HAN's BEAUTY 핵심 5건 재구성 | 한송이 (CMS 직접) | 다음 주 |
| 6 | 네이버 비자사진 규정 카테고리 역수입 | 막내 | 다음 주 |
| 7 | 외부 채널 원문 링크 삽입 | 한송이/꾸 수동 | 역수입 완료 후 |
| 8 | 동시배포 자동화 (Blogger API, X API) | 막내 | Q2 |

---

## 7. KPI

| 지표 | 현재 | 1개월 목표 | 3개월 목표 |
|------|------|----------|----------|
| monkos.ai 인덱스 페이지 | 5장 | 30+ | 100+ |
| 블로그 포스트 (ko) | 0 | 15 | 50 |
| 블로그 포스트 (ja) | 0 | 15 | 50 |
| 블로그 포스트 (en) | 0 | 15 | 50 |
| 구글 Search Console 노출 | 미등록 | 등록+인덱싱 시작 | 주요 키워드 노출 |
| 오가닉 트래픽 | 0 | 측정 시작 | 성장 추세 |

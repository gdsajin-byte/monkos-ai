---
type: design
date: 2026-06-19
device: iMac
agent: 쌍아
portfolio: PF_MONK_OS
status: 기안
---

# 설계: MONKOS 포털 통합 — 2라운드 아키텍처

> **[2026-06-19 18:12 KST]** iMac/쌍아 → 작가님
> 근거: 6/19 세션 — 헤드샷 서비스 포털 서브디렉토리 검증 성공 → kr/jp 독립 서비스 포털 흡수 + 통합 크레딧 체계 확장 결정

---

## 1. 비전

**monkos.ai = 단일 허브. 모든 AI 사진 서비스가 카드로 나열. 크레딧 하나로 전부 쓴다.**

현재 서비스별로 흩어진 인프라(idphoto-kr, idphoto-jp, studio, image-pro)를 포털 서브디렉토리로 통합. 결제·인증·크레딧을 1곳으로 수렴시켜 유지보수 난이도를 낮추고, DA(도메인 권위)를 monkos.ai에 집중한다.

---

## 2. 현재 (1라운드) vs 목표 (2라운드)

### 현재 — 서비스별 독립

| 서비스 | 도메인 | Cloud Run | 인증 | 결제 | 크레딧 |
|--------|--------|-----------|------|------|--------|
| 포털 | monkos.ai | monkos-portal | Firebase Auth | 토스+LS | 공유 |
| idphoto-kr | idphoto-kr.monkos.ai | monkos-idphoto-kr | Firebase Auth (자체) | 토스 (자체) | 별도 |
| idphoto-jp | idphoto-jp.monkos.ai | monkos-idphoto-jp | Firebase Auth (자체) | LS (자체) | 별도 |
| studio | studio.monkos.ai | monkos-studio | 없음 (내부) | 없음 | 없음 |
| image-pro | image.monkos.ai | monk-image-engine | JSON (내부) | 없음 | 없음 |

문제점:
- 인증·결제 3곳 중복 구현
- 코드 수정 시 kr/jp 양쪽 반복 (오늘 Vertex AI 전환도 2번)
- 가격 체계 서비스별 다름
- DA 분산 (서브도메인 = 별도 도메인 취급 가능성)
- Cloud Run 5서비스 × min-instances = 비용

### 목표 — 포털 통합

| 서비스 | 경로 | Cloud Run | 인증 | 결제 | 크레딧 |
|--------|------|-----------|------|------|--------|
| **ID Photo** | monkos.ai/id-photo | monkos-portal | 포털 통합 | 포털 통합 | **공유** |
| **Headshot** | monkos.ai/headshot | monkos-portal | 포털 통합 | 포털 통합 | **공유** |
| **Content** | monkos.ai/content | monkos-portal | 포털 통합 | 포털 통합 | **공유** |
| Specs | monkos.ai/specs | monkos-portal | — | — | — |
| Blog | monkos.ai/blog | monkos-portal | — | — | — |
| Studio | studio.monkos.ai | monkos-studio | 내부 | — | — |

변화:
- Cloud Run: 5서비스 → **2서비스** (portal + studio API)
- 인증: 1곳 (포털 Firebase Auth)
- 결제: 1곳 (포털 토스/LS/Stripe)
- 크레딧: 1풀 (전 서비스 공유)
- DA: monkos.ai 단일 도메인에 집중

---

## 3. 포털 메인 — 카드 기반 디자인

```
monkos.ai/
┌────────────────────────────────────────────────────────┐
│                                                        │
│            MONKOS — AI Photo Platform                  │
│     Professional photos powered by AI + Studio         │
│                                                        │
│   💰 100 credits = $10 — Use across all services       │
│                                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │ 📷          │  │ 💼          │  │ 🎨          │   │
│  │ ID Photo    │  │ Headshot    │  │ Content     │   │
│  │             │  │             │  │             │   │
│  │ Passport    │  │ LinkedIn    │  │ Blog Hero   │   │
│  │ Visa        │  │ Corporate   │  │ YouTube     │   │
│  │ Driver's    │  │ Creative    │  │ Thumbnail   │   │
│  │ License     │  │ Dating      │  │ Social Card │   │
│  │             │  │             │  │             │   │
│  │ 10c / photo │  │ 10c / photo │  │ 10c / image │   │
│  │ [Start →]   │  │ [Start →]   │  │ [Start →]   │   │
│  └─────────────┘  └─────────────┘  └─────────────┘   │
│                                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │ 📋          │  │ ⭐          │  │ 💬          │   │
│  │ Specs Guide │  │ Reviews     │  │ Support     │   │
│  │             │  │             │  │             │   │
│  │ 200+ country│  │ See what    │  │ Studio      │   │
│  │ photo specs │  │ others made │  │ Guarantee   │   │
│  │             │  │             │  │             │   │
│  │ [Browse →]  │  │ [View →]    │  │ [Contact →] │   │
│  └─────────────┘  └─────────────┘  └─────────────┘   │
│                                                        │
│  ─── Trusted by photographers since 2005 ───          │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 카드 구성

| 카드 | 경로 | 성격 | 상태 |
|------|------|------|------|
| **ID Photo** | /id-photo | 매출 직결 — 여권/비자/운전면허 증명사진 | 신규 (kr/jp 흡수) |
| **Headshot** | /headshot | 매출 직결 — 비즈니스 프로필 헤드샷 | ✅ 오늘 라이브 |
| **Content** | /content | 매출 직결 — 블로그/유튜브/소셜 이미지 | 후속 |
| **Specs Guide** | /specs | DA 축적 — 규격 가이드 1,335페이지 | ✅ 기존 |
| **Reviews** | /reviews | 신뢰 — 별점+리뷰+전후비교 갤러리 | 신규 |
| **Support** | /support | 신뢰 — 고객문의 + 스튜디오 검수 보장 | 신규 |

---

## 4. 통합 크레딧 체계

### 가격표

| 패키지 | 크레딧 | USD | KRW | JPY |
|--------|--------|-----|-----|-----|
| **Starter** | 100c | **$10** | ₩13,800 | ¥1,500 |
| Value | 300c (+50 bonus) | $25 | ₩34,500 | ¥3,750 |
| Pro | 500c (+150 bonus) | $40 | ₩55,000 | ¥6,000 |

### 서비스별 크레딧 소비

| 서비스 | 생성 | 다운로드 | 합계 |
|--------|------|---------|------|
| ID Photo (증명사진) | 10c | — | **10c** |
| Headshot (프로필) | 10c | — | **10c** |
| Content (콘텐츠) | 10c | — | **10c** |

단순화: **뭐든 10c**. 다운로드 별도 과금 폐지 (현재 kr은 생성 10c + 다운로드 70c = 80c 구조 → 10c 통합).

### 원가 구조

| | 크레딧 매출 | AI 원가 | 마진 |
|--|-----------|--------|------|
| 1생성 (10c = $1) | ₩1,380 | ₩185 (Pro) | **87%** |
| 1생성 (10c = $1) | ₩1,380 | ₩93 (Flash) | **93%** |

---

## 5. ID Photo 포털 흡수 — kr/jp 통합

### 현행 idphoto-kr/jp 기능

| 기능 | kr | jp | 포털 흡수 시 |
|------|----|----|------------|
| 사진 업로드 | ✅ | ✅ | 공통 |
| AI 생성 (나노바나나 프로) | ✅ | ✅ | 스튜디오 API 프록시 |
| 크롭 (규격별) | ✅ | ✅ | crop.js 공통 |
| 워터마크 | ✅ | ✅ | 스튜디오 API |
| 결제 (토스/LS) | 각각 | 각각 | **포털 1곳** |
| 인증 (Firebase) | 각각 | 각각 | **포털 1곳** |
| 코칭 (WebSocket) | ✅ | ✅ | 공통 (스튜디오) |
| 다국어 | ko | ja | **ko/en/ja URL 분기** |

### 흡수 단계

1. **Phase A**: monkos.ai/id-photo 신설 — 영어 기본, 포털 인증·크레딧 사용, 스튜디오 API 프록시. 헤드샷과 동일 패턴
2. **Phase B**: /ko/id-photo, /ja/id-photo 다국어 추가. 기존 kr/jp 사용자 리다이렉트 (301)
3. **Phase C**: idphoto-kr/jp Cloud Run 서비스 종료. 도메인 → 포털로 리다이렉트

### 보존할 것

- idphoto-kr.monkos.ai / idphoto-jp.monkos.ai 도메인 → **301 리다이렉트로 SEO 신호 이관** (GSC 실적 보존)
- 기존 사용자 크레딧 잔액 → Firestore 동일 DB이므로 자동 유지
- 규격 데이터 → D1 정본 연동 (별건)

---

## 5.5. Special Order — 프리미엄 커스텀 제작

### 서비스 모델

| 티어 | 가격 | 납품 | 방식 |
|------|------|------|------|
| **AI Auto** | 10c ($1) | 즉시 (30초) | AI 자동 생성 |
| **Special Order** | 50c ($5) | 24시간 내 | 사진작가 수작업 — AI + 이미지프로 커스텀 보정 |

### Special Order 플로우

```
사용자
  ↓ 사진 업로드 + 요구사항 텍스트 입력
  ↓ ("홈페이지 대표 인사말용, 따뜻한 느낌, 서재 배경")
  ↓ 50c 차감
  ↓
Firestore 주문 큐 (orders 컬렉션)
  ↓ 텔레그램 팀봇 자동 알림
  ↓
작가님/꾸 — 이미지프로 + 스튜디오로 제작
  ↓
이메일 또는 앱 내 알림으로 납품
  ↓
사용자 — 다운로드 + 만족도 평가
  ↓ 불만족 시 1회 무료 재작업
```

### 구현 범위

| 항목 | 내용 |
|------|------|
| Firestore | `special_orders` 컬렉션 — userId, image, requirements, status(pending/in-progress/delivered), createdAt |
| 포털 UI | /headshot 하단 Special Order 섹션 — 요구사항 입력 폼 + 50c 결제 |
| 어드민 | /admin/special-orders — 주문 목록, 상태 변경, 결과물 업로드 |
| 텔레그램 | 팀봇에 신규 주문 알림 (이미지+요구사항+사용자ID) |
| 이메일 | 납품 시 사용자에게 자동 이메일 (info@monkos.ai) |

### 차별화 포인트

- HeadshotPro 등 경쟁사 12개 중 **사람이 직접 보정하는 서비스 = 0**
- 20년 실무 경력 사진작가가 AI를 도구로 써서 완성 — 기술 + 장인정신
- 100% 만족 보장 (1회 무료 재작업)
- B2B 확장: 기업 단체 주문 → Special Order 대량 할인 (시트 $3-5)

---

## 6. SEO 통합 — 헤드텀 레지스트리 연동

| 카드 | 타겟 키워드 | 레지스트리 매핑 |
|------|-----------|--------------|
| /id-photo | AI passport photo, AI 증명사진 | idphoto-kr 루트 → /id-photo 이관 |
| /headshot | AI headshot, professional headshot | 신규 등록 |
| /content | AI thumbnail maker | 후속 등록 |
| /specs | passport photo size, 여권사진 규정 | 기존 유지 |
| /blog | vibe coding, AI development | 축 전환 후 |

발행 게이트:
1. 콘텐츠 발행 시 헤드텀 레지스트리 충돌 점검
2. 서비스 카드별 랜딩 페이지에 타겟 키워드 JSON-LD 삽입
3. 내부 링크: 카드 ↔ specs ↔ blog 교차 연결

---

## 7. 결제 통합

### 결제 수단 (지역별)

| 지역 | 1차 | 2차 | 포털 기존 |
|------|-----|-----|----------|
| 글로벌 (EN) | **Stripe** 또는 LS | PayPal | LS 구현 완료 |
| 한국 (KR) | 토스페이먼츠 | 카카오페이 | 토스 구현 완료 |
| 일본 (JP) | LS (JCB 지원) | 코모페이 | LS 구현 완료 |

기존 포털에 토스 + LS 둘 다 구현 완료. Stripe는 필요 시 추가.

---

## 8. 실행 순서

| Phase | 내용 | 예상 | 선행 조건 |
|-------|------|------|----------|
| **A-1** | 포털 메인 카드 디자인 리뉴얼 | 막내 1건 | 작가님 카드 레이아웃 확정 |
| **A-2** | 크레딧 체계 통일 ($10/100c, 10c/생성) | 코드 수정 | 기존 kr/jp 가격 전환 정책 |
| **A-3** | /headshot 프롬프트 튜닝 + UI 다듬기 | 쌍아+막내 | 오늘 검증 완료 |
| **B-1** | /id-photo 포털 서브디렉토리 구현 | 막내 1건 | 헤드샷 패턴 복제 |
| **B-2** | /id-photo 생성 파이프라인 연동 (스튜디오 경유) | 막내 1건 | 스튜디오 idgen 프록시 |
| **B-3** | /id-photo 크롭 기능 이식 | 막내 1건 | CropEngine 연동 |
| **B-4** | Special Order 시스템 (Firestore 큐 + 어드민 + 텔레그램 알림 + 이메일 납품) | 막내 1건 | 헤드샷 라이브 후 |
| **C-1** | /reviews 갤러리 + 리뷰 시스템 | 막내 1건 | Firestore 스키마 |
| **C-2** | /support 고객문의 + 스튜디오 검수 보장 | 막내 1건 | 텔레그램 봇 연동 |
| **D-1** | idphoto-kr/jp 301 리다이렉트 → 포털 | 막내 1건 | B-3 완료 후 |
| **D-2** | kr/jp Cloud Run 종료 | 작가님 승인 | D-1 검증 후 |
| **E** | /content (블로그/유튜브 썸네일) | 막내 1건 | 후속 |

---

## 9. 비용 절감 효과

| 항목 | 현재 | 통합 후 |
|------|------|--------|
| Cloud Run 서비스 | 5개 (portal+kr+jp+studio+image-pro) | **2개** (portal+studio) |
| min-instances | 4개 (kr+jp+portal+portal-dev) | **1개** (portal) |
| 월 인프라 비용 | ~₩60,000 | ~₩25,000 (추정) |
| 코드 수정 시 배포 | 3~4회 (kr+jp+portal+studio) | **1~2회** (portal+studio) |
| GenAI 크레딧 적용 | ✅ Vertex AI (오늘 전환) | ✅ 동일 |

---

## 10. 리스크

| 리스크 | 대응 |
|--------|------|
| kr/jp 기존 사용자 URL 깨짐 | 301 리다이렉트 + GSC 이관 요청 |
| 포털 server.js 비대화 | 서비스별 라우트 모듈 분리 (render-headshot.js 패턴) |
| 크레딧 가격 변경 시 기존 잔액 | 크레딧 값은 동일, 패키지 가격만 변경 |
| 포털 다운 시 전 서비스 중단 | min-instances 유지 + 헬스체크 강화 |

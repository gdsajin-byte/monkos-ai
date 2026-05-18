---
type: report
id: REPORT_20260326_민아_Phase1_프로그래매틱GEO_실행제안서
date: 2026-03-26 02:44 KST
from: M1/민아
to: 작가님 → 쌍아 리뷰 → 막내 실행
subject: Phase 1 프로그래매틱 GEO/SEO 실행 제안서
status: review_pending
---

# Phase 1 프로그래매틱 GEO/SEO 실행 제안서

**[2026-03-26 02:44 KST] M1/민아 → 작가님**

---

## 0. 전제 상황

### Phase 0 완료 현황 (3/25 사무실 실행 — 전부 prod 배포 완료)
- ✅ hreflang 양방향 + canonical (render.js)
- ✅ FAQ FAQPage JSON-LD mainEntity (render.js)
- ✅ sitemap 중복 제거 + 법적 페이지 noindex
- ✅ llms.txt (59줄) + llms-full.txt (238줄)
- ✅ robots.txt AI 크롤러 허용
- ✅ CF 대시보드 AI Bot 차단 해제

### 현재 문제
- GSC 3개월: "여권사진" 포함 검색어 노출 **0건**
- 구글 "여권사진 규격" 검색: 1페이지 전부 정부/지자체, 민간 서비스 없음
- AI 엔진(Claude 등)이 경쟁사(sajinkwan.com)를 인용하는 GEO 선점 현상
- **문은 열었는데(Phase 0) 안에 내놓을 콘텐츠가 없는 상태(Phase 1 미착수)**

### 우리 자산 (이미 보유)
- 포털 SSR + CMS + 블로그 에디터 + 다국어(KO/JA/EN)
- MONKOS Crop (ICAO 규격 크롭 도구 — 실동작)
- AI 증명사진 서비스 (KR/JP 프로덕션)
- 20년 사진관 실무 경험 (작가님)
- 에이전트 실행력 (쌍아 설계 → 막내 병렬 실행)

---

## 1. Phase 1 목표

**"여권사진 규격" "증명사진 사이즈" 등 고수요 키워드에서 구글 노출 확보 + AI 엔진 인용 획득**

달성 지표:
- GSC "여권사진" 관련 노출 0 → 주간 100+ 노출
- 구글 "여권사진 규격" 검색 2페이지 내 진입
- AI 엔진(Perplexity, ChatGPT, Claude) 증명사진 관련 질의 시 MONKOS 인용

---

## 2. 실행 수순 (3단계)

### Step 1 — 기존 페이지 즉시 최적화 (Day 1, 사무실)

기존 코드 수정만으로 즉시 효과. 쌍아 지시서 1건 → 막내 1명.

#### 1-1. Crop 페이지 (/crop) 메타 보강

현재 `/crop`은 정적 HTML(server.js 212줄)로 반환되어 SEO 메타가 부실.

| 항목 | 현재 | 변경 |
|------|------|------|
| title | MONKOS Crop | 증명사진 무료 크롭 — 여권 3.5×4.5cm · 반명함 3×4cm ICAO 규격 \| MONKOS |
| meta description | 없음 | 여권·신분증(3.5×4.5cm) 반명함(3×4cm) 증명사진을 ICAO 국제 규격에 맞춰 무료 크롭. 서버 전송 없이 브라우저에서 처리. |
| html lang | 미확인 | `lang="ko"` 명시 (구글 번역 "작물" 방지) |
| JSON-LD | 없음 | SoftwareApplication 스키마 추가 |
| og:title | 미확인 | 타이틀과 동일 |

#### 1-2. Guide 페이지 (/guide) 타이틀 + Schema

render.js `guideFragment()` (1099줄) 수정.

| 항목 | 현재 | 변경 |
|------|------|------|
| title | 사용 가이드 \| MONKOS AI | AI 증명사진 촬영 가이드 — 여권·이력서 규격별 촬영법 \| MONKOS |
| JSON-LD | 없음 | HowTo 스키마 (4단계: 규격 선택 → 셀카 촬영 → AI 리터칭 → 다운로드) |

#### 1-3. 블로그 포스트 타이틀 최적화

Firestore CMS에서 기존 포스트 타이틀 수정 (코드 변경 불필요, 관리자 에디터에서 수정).

| 현재 타이틀 | 제안 타이틀 |
|-----------|----------|
| MONKOS Crop — 사진관 실무를 그대로 옮긴 크롭앱 | 여권사진 규격 크롭 무료 도구 — ICAO 3.5×4.5cm 정밀 트리밍 \| MONKOS Crop |

#### 1-4. llms-full.txt 규격 섹션 강화

현재 "Supported Photo Specs" 22줄 → 국가별 규격 상세 테이블 추가.

```
## Photo Specifications by Country

### Korea (한국)
| Type | Size | Pixels | Use |
|------|------|--------|-----|
| Passport/ID | 35×45mm | 413×531px | 여권, 주민등록증, 운전면허 |
| Half-size (반명함) | 30×40mm | 354×472px | 이력서, 학생증, 자격증 |
| Business card (명함판) | 50×70mm | 591×827px | 공무원증, 택시자격증 |

### Japan (日本)
| Type | Size | Pixels | Use |
|------|------|--------|-----|
| Passport (パスポート) | 35×45mm | 413×531px | 여권, 마이넘버 |
| Resume (履歴書) | 30×40mm | 354×472px | 이력서, 취활 |

### USA
| Type | Size | Pixels | Use |
|------|------|--------|-----|
| Passport/Visa | 2×2 inch | 600×600px | 여권, 비자 |
```

---

### Step 2 — 규격 허브 페이지 신설 (Day 2~5)

Phase 1의 본체. 쌍아 설계 → 막내 구현.

#### 2-1. URL 구조

```
/specs                          ← 규격 허브 인덱스 (모든 국가·용도 목록)
/specs/korea-passport           ← 한국 여권사진 규격
/specs/korea-resume             ← 한국 이력서(반명함) 규격
/specs/korea-drivers-license    ← 한국 운전면허증 규격
/specs/japan-passport           ← 일본 여권사진 규격
/specs/japan-resume             ← 일본 이력서(履歴書) 규격
/specs/japan-mynumber           ← 일본 마이넘버 카드 규격
/specs/us-passport              ← 미국 여권 규격
/specs/us-visa                  ← 미국 비자 규격
```

다국어: `/ja/specs/korea-passport`, `/en/specs/korea-passport`

#### 2-2. 각 페이지 구성 (Template)

```
<h1>2026 한국 여권사진 규격 — 사이즈·배경·복장 완벽 가이드</h1>

[1] 규격 요약 테이블
    사이즈: 3.5 × 4.5cm (413 × 531px)
    해상도: 300dpi
    배경: 균일 흰색
    머리 길이: 3.2~3.6cm (정수리~턱)
    유효기간: 6개월 이내
    파일: JPEG, 500KB 이하

[2] 상세 규정
    표정, 안경, 의상, 영유아 등

[3] 반려 사유 TOP 5
    (실제 사진관 20년 경험 기반 — 우리의 차별점)

[4] FAQ (3~5개)
    "여권사진 배경은 흰색만 가능한가요?"
    "안경 쓰고 여권사진 찍어도 되나요?"
    "여권사진 셀프로 찍을 수 있나요?"

[5] CTA 블록
    "지금 AI로 촬영하기 →" (idphoto-kr.monkos.ai 링크)
    "무료 크롭앱으로 규격 맞추기 →" (/crop 링크)

[6] 관련 콘텐츠 내부 링크
    → /guide (촬영 가이드)
    → /blog/monkos-crop-... (크롭앱 블로그)
    → /faq (FAQ)
    → /specs/korea-resume (반명함 규격)
```

#### 2-3. JSON-LD 트리플 스택 (각 specs 페이지)

```json
[
  {
    "@type": "Article",
    "headline": "2026 한국 여권사진 규격",
    "author": { "@type": "Person", "name": "Shin JeongKyu", "jobTitle": "Photographer & AI Architect" },
    "publisher": { "@type": "Organization", "name": "Monk Studio" },
    "datePublished": "2026-03-26",
    "dateModified": "2026-03-26"
  },
  {
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "여권사진 배경은 흰색만 가능한가요?", "acceptedAnswer": { "@type": "Answer", "text": "..." } },
      { "@type": "Question", "name": "안경 쓰고 여권사진 찍어도 되나요?", "acceptedAnswer": { "@type": "Answer", "text": "..." } }
    ]
  },
  {
    "@type": "HowTo",
    "name": "여권사진 규격에 맞게 사진 준비하는 법",
    "step": [
      { "@type": "HowToStep", "name": "규격 확인", "text": "..." },
      { "@type": "HowToStep", "name": "셀카 촬영", "text": "..." },
      { "@type": "HowToStep", "name": "AI 보정 또는 크롭", "text": "..." },
      { "@type": "HowToStep", "name": "다운로드", "text": "..." }
    ]
  }
]
```

#### 2-4. 구현 방식

render.js에 `specsFragment()` + `renderSpecs()` 함수 추가.

규격 데이터는 JSON 파일 또는 Firestore에 저장하여 프로그래매틱 생성:

```javascript
// specs-data.json
{
  "korea-passport": {
    "country": "한국",
    "type": "여권",
    "size": "3.5 × 4.5cm",
    "pixels": "413 × 531px",
    "dpi": 300,
    "background": "균일 흰색",
    "headHeight": "3.2~3.6cm",
    "validity": "6개월 이내",
    "faqs": [...],
    "rejectionReasons": [...]
  },
  ...
}
```

하나의 템플릿 + 데이터 파일 = 수십 개 페이지 자동 생성. 이것이 프로그래매틱 SEO의 핵심.

#### 2-5. sitemap 자동 등록

renderSitemap()에 specs 페이지 동적 추가. 기존 블로그 동적 추가 방식과 동일.

---

### Step 3 — 내부 링크 클러스터 + 외부 백링크 (Day 5~)

#### 3-1. 내부 링크 토픽 클러스터

```
                    [/specs] 허브 인덱스
                   /    |    \
    [/specs/korea-passport] [/specs/japan-passport] [/specs/korea-resume]
          |         |         |
    [/blog/crop]  [/faq]   [/guide]     ← 기존 페이지에서 specs로 링크
          |         |         |
        [/crop]              ← 도구 (전환점)
           ↓
    [idphoto-kr.monkos.ai]   ← 서비스 (매출)
```

기존 페이지(홈, FAQ, Guide, Blog, Crop)에 specs 허브로의 내부 링크 추가.
specs 각 페이지에서 기존 페이지로의 역링크 추가.

#### 3-2. 외부 백링크 (한/민아 콘텐츠 패키지 연동)

| 플랫폼 | 콘텐츠 | monkos.ai 링크 |
|--------|--------|--------------|
| note.com | 日本パスポート写真規格ガイド | /ja/specs/japan-passport |
| 네이버 블로그 | 2026 여권사진 규격 총정리 | /specs/korea-passport |
| X (일본어) | パスポート写真の規格 → 記事 | /ja/specs/japan-passport |
| Instagram | 규격 비교 카드 이미지 | 프로필 링크 |

기존 다플랫폼 전략(한/민아 콘텐츠 패키지)에 specs 페이지 URL을 자연스럽게 포함.

#### 3-3. llms.txt에 specs 페이지 등록

```
## Photo Specification Pages
- Korea Passport: https://monkos.ai/specs/korea-passport
- Japan Passport: https://monkos.ai/specs/japan-passport
- Korea Resume: https://monkos.ai/specs/korea-resume
- US Visa: https://monkos.ai/specs/us-visa
```

AI 엔진이 규격 관련 질의 시 직접 인용할 URL 제공.

---

## 3. 품질 가드레일

프로그래매틱이지만 Thin Content 패널티를 피하기 위한 기준:

| 기준 | 수치 |
|------|------|
| 페이지당 최소 본문 | 800자 이상 |
| 고유 콘텐츠 비율 | 템플릿 공통부 40% 이하, 고유부 60% 이상 |
| FAQ | 페이지당 최소 3개, 최대 7개 |
| 이미지 | 적합/부적합 예시 최소 2쌍 |
| 내부 링크 | 페이지당 최소 3개 |
| 유사 페이지 | canonical 처리 또는 충분한 차별화 확인 |
| 검색 볼륨 0 키워드 | noindex 또는 미생성 |

---

## 4. 일정

| Day | 작업 | 담당 | 산출물 |
|-----|------|------|--------|
| Day 1 | Step 1 즉시 최적화 (Crop/Guide/Blog 메타 수정) | 쌍아 지시서 → 막내 1명 | 코드 커밋 + 배포 |
| Day 1 | llms-full.txt 규격 테이블 보강 | 막내 1명 (병렬) | 커밋 + 배포 |
| Day 2 | 규격 허브 설계 (URL, 템플릿, 데이터 구조) | 쌍아 설계 | 지시서 |
| Day 3~4 | 규격 허브 구현 (render.js + specs-data + sitemap) | 막내 2~3명 병렬 | 코드 커밋 |
| Day 4 | 규격 콘텐츠 작성 (KR 여권, KR 반명함, JP 여권 우선) | 민아 + 한 | 콘텐츠 JSON |
| Day 5 | 내부 링크 클러스터 연결 + 배포 | 막내 1명 | 커밋 + 배포 |
| Day 5~ | 외부 백링크 콘텐츠 발행 | 한 (note.com, SNS) | 포스트 |
| Day 7 | GSC 색인 요청 + 모니터링 시작 | 민아 | GSC 확인 |

일본 취활 피크(4월) 전 완료 목표: **3/26 시작 → 4/1 배포 완료**

---

## 5. 리스크 및 대응

| 리스크 | 확률 | 대응 |
|--------|------|------|
| 도메인 나이로 상위 진입 지연 | 높음 | 외부 백링크 + 콘텐츠 깊이로 보완, 장기전 각오 |
| 정부 사이트 도메인 권위에 밀림 | 높음 | 정부가 안 하는 것(AI 서비스 연결, FAQ Schema, 반려 사례)에서 차별화 |
| Thin Content 패널티 | 낮음 | 가드레일 준수, 페이지당 800자+ 고유 콘텐츠 |
| AI 엔진 인용 지연 | 중간 | llms.txt 직접 등록 + 구조화 데이터로 인용 확률 극대화 |

---

## 6. 성공 지표 (4주 후 측정)

| 지표 | 현재 | 4주 목표 |
|------|------|---------|
| GSC "여권사진" 노출 | 0 | 100+/주 |
| GSC "증명사진" 노출 | 0 | 50+/주 |
| specs 페이지 색인 수 | 0 | 8+ 페이지 |
| AI 엔진 MONKOS 인용 | 0 | 1+ 엔진 |
| Crop 페이지 유입 | 현재 수준 | 2배 |

---

✅ 제안서 작성 완료 — 쌍아 리뷰 대기

---
type: completion
date: 2026-08-26
device: iMac
agent: 막내1
status: 마감
portfolio: PF_OPUS
---

# 완료 보고 — 블로그 백로그 Phase 2

**[2026-08-26 18:03 KST]** iMac/막내1 → 작가님

> 지시서: [ORDER_20260826_iMac쌍아_막내1_블로그백로그_Phase2.md](../../orders/2026-08/ORDER_20260826_iMac쌍아_막내1_블로그백로그_Phase2.md)
> 라이브 판정 규칙: `.claude/rules/live-verify.md` (URL당 2회 히트 + 대조군)

---

## 1. 결과 요약

| 항목 | 결과 |
|---|---|
| `publish.mjs` 필드 보존 일반화 | ✅ 양방향 실증 (보존/갱신/빈문자열선언 3케이스) |
| 에세이 25건 `category: 빌더 노트` | ✅ 25/25 |
| 재발행 후 CTA·OG 유지 | ✅ **Firestore 13필드 × 25건 = 325쌍 중 소멸·변조 0** |
| 라이브 정합 (2회 히트 판정) | ✅ CTA 카드 25/25 · CTA 문구 25/25 · 개별 OG 25/25 |
| B군 근거 표 | ✅ **34건** 제출 (판정 없이 자료만) |
| B군 발행 | 미착수 ✅ (범위 밖) |

---

## 2. Task 1-1 — 미선언 필드 보존 일반화

### 문제

`post` 객체가 `ctaTitle: fm.cta_title || ''` 형태로 **미선언 필드를 빈 문자열로 덮어썼다.** `set()`은 미기재 필드까지 지우므로, 에세이 25건처럼 `cta_*`를 선언하지 않는 원본으로 `--update`를 돌리면 **민아가 16:41에 넣은 뉴트럴 CTA 25건이 전부 소멸**할 상황이었다. Phase 1의 `ogImage` 보존(`a6d29c73`)은 같은 사고의 1필드 대응이었다.

### 적용 계약

> **원본이 선언하면 원본이 이기고, 미선언이면 기존 문서 값을 유지한다.**
> 선언 여부는 `fm`의 **키 존재**로 판정한다 — 빈 문자열 선언(`category:`)과 미선언은 다르다.
> 신규 문서는 기본값으로 종전 동작을 유지한다.

대상 12필드: `summary` `thumbnail` `tags` `category` `author` `pinned` `ctaEnabled` `ctaImage` `ctaTitle` `ctaDescription` `ctaButtonText` `ctaLink` (+ 무조건 보존 `ogImage` `createdAt` `viewCount`).

> **지시서 목록에서 확장한 2건 — `author`·`pinned`.** 지시서 §2-1 대상 목록에는 없으나 **동일한 실패 양식**이다(`author: fm.author || 'MONKOS'`는 미선언 시 필명을 'MONKOS'로 덮고, `pinned: false` 하드코딩은 어드민이 고정한 글을 재발행 때마다 해제한다). §2-1의 일반 규칙 문언이 이를 포괄한다고 판단해 포함했다. **범위 확장이므로 쌍아 추인 요망.**

### 실증 — 양방향 (프로덕션 미접촉)

검증용 스크래치 컬렉션 주입구(`BLOG_COLLECTION`)를 추가해 `blog_posts`에 테스트 문서를 만들지 않고 검증했다. 검증 후 픽스처 컬렉션 전량 삭제, 정본 `blog_posts`에 픽스처 문서 부재 확인.

| 케이스 | 조작 | 기대 | 실측 |
|---|---|---|---|
| ① 신규 생성 | v1(선언 다수) `--publish` | 선언값 기록 + 기본값 | ✅ 일치 |
| ② **보존** | 어드민 값 주입 후 v2(`cta_*`·`thumbnail`·`tags`·`author` **미선언**) 재발행 | 어드민 값 유지 | ✅ `ctaTitle`=어드민값, `ogImage`·`pinned=true`·`viewCount=77`·`thumbnail`·`tags`·`author` 전부 유지 |
| ③ **갱신** | 같은 재발행에서 `category` **선언** | 원본이 이김 | ✅ `원본카테고리` → `빌더 노트` |
| ④ 빈 문자열 선언 | v3에서 `cta_title:` (값 없음) | 미선언과 구분 → `''`로 갱신 | ✅ `ctaTitle=""`, 미선언 `ctaLink`는 보존 |

한쪽만 보고 완료 처리하지 않았다 — ②와 ③은 **같은 1회 실행 안에서 동시에** 성립했다.

---

## 3. Task 1-2 — 에세이 25건 `category` 통일

- 원본 실측: 미선언 20건 / 기존 `빌더 노트` 5건.
- 기존 5건의 관행대로 **`lang:` 다음 줄**에 `category: 빌더 노트` 1줄 삽입.
- git 실측 **20파일 +20행 −0행** → 본문 무수정 확인.
- dry-run 25/25: `cat=빌더 노트` 25 · `보존=…ctaTitle` 25 · `보존=…ctaLink` 25 · `보존=…ogImage` 25 · 실패 0.
- `--publish --update` 25건 발행, 라이브 200 25/25.

### 재발행 후 전수 실증

**Firestore 대조** (발행 전 스냅샷 ↔ 발행 후 스냅샷):

```
category = 빌더 노트        : 25/25
보존 대상 13필드 × 25건 = 325쌍 대조
소멸·변조                   : 0건
viewCount 감소(리셋 의심)   : 0건   (+1은 검증 조회분)
```

**라이브 판정 — 판정 방법 명기** (`live-verify.md` 준수):
- **URL당 2회 히트**: 1차 `curl -s -o /dev/null` = 재검증 트리거(판정 제외), 2차로 판정.
- **양성 대조군 선행**: `us-visa-photo-rejection-guide`에서 CTA 마크업 검출 확인 후 스윕 시작.
- **실물 마크업 판정**: `blog-cta-card` 문자열이 아니라 `<div class="blog-cta-card">` 마크업으로 계수(CSS 규칙 오검출 배제).

| 항목 | 결과 |
|---|---|
| CTA 카드 실물 마크업 | 25/25 |
| CTA 문구(`내가 어디에 있든 사진관이 되는 곳`) | 25/25 |
| `og:image` = 글별 `og_essay_{slug}.jpg` | 25/25 |
| `<h1>` 존재 | 25/25 |

---

## 4. Task 2 — B군 근거 표 (판정 없음, 자료만)

### 4-1. 모집단 확정 — 34건

원본 94건 중 사이트맵 미등재분을 **언어별**로 대조해 도출했다.

| 단계 | 건수 |
|---|---:|
| 원본 md | 94 (그중 `slug` 결손 3건) |
| 미발행 | 52 |
| − A군(해외 국가 규격) | 17 |
| − 이미 라이브(ja) | 1 |
| **→ B군** | **34** |

> **1차 산출은 35건이었다.** ko 사이트맵만으로 대조해 `shushoku-shomei-shashin-kitei-guide`(ja, 발행됨)를 미발행으로 오분류한 것이 원인이다. 언어별 사이트맵으로 재대조해 34건으로 교정했고, **설계서 §3의 B군 34건과 일치**한다.
> `slug` 결손 3건(`vol36`·`misa-passport-photo-local`·`passport-photo-color-lens`)은 본 표 밖이다. 앞의 1건은 민아 소관, 뒤 2건은 D군 계열로 보이나 **판정하지 않는다.**

### 4-2. 공통 실측

- **초안 선존 34/34** (전건 `published: false`). Phase 1에서 관측한 양상이 B군에서도 그대로 반복된다.
- **계약 결손**: `head_term` **0/34 보유**, `cta_link` **0/34 보유**. `lang: KR` 표기 23건, `ko` 11건. `category` 보유 13건(전부 `사진`).
- **본문 동일성**: H1 1줄 차 29건 / **실질 상이 5건**(§4-4).

### 4-3. 근거 표

> ⚠️ **"글이 지목한 문서종 specs" 열은 URL 존재 기록이지 중복 판정이 아니다.** 글이 본문에서 명시적으로 지목한 문서종만 적었고, 지목이 없거나 모호하면 `—`/`⚠️`로 두었다. **의도 판정은 쌍아·민아 소관이다.**
> specs kr 11종은 2회 히트 판정으로 **전부 200**이며, 음성 대조군 `/specs/nonexistent-type/kr`은 404로 판별력이 확인됐다.

| # | slug | 제목(발췌) | 본문자 | 초안 선존 | 본문 동일성 | 글이 지목한 문서종 specs | 계약 결손 |
|---:|---|---|---:|---|---|---|---|
| 1 | `ai-passport-photo-spec` | AI 여권사진 이제 고민하지 마세요 | 3,943 | 초안 `false` | 실질 상이 (md 3943자 / fs 3980자) | `/specs/passport/kr` (200) | lang=KR, head_term, cta_link, category |
| 2 | `drivers-license-photo-diy` | 운전면허 사진, 집에서 3분 만에 만드는 법 | 1,822 | 초안 `false` | 실질 상이 (md 1822자 / fs 1797자) | `/specs/license/kr` (200) | lang=KR, head_term, cta_link, category |
| 3 | `drivers-license-photo-guide` | 운전면허 사진 규격 총정리 — 사이즈, 배경, 온라인 제출까지 | 3,116 | 초안 `false` | 실질 상이 (md 3116자 / fs 4085자) | `/specs/license/kr` (200) | lang=KR, head_term, cta_link, category |
| 4 | `exam-license-photo-spec` | 시험·자격증 사진 규격 총정리 — 접수할 때마다 헷갈리는 이유와 한  | 2,468 | 초안 `false` | H1 1줄 차 | `/specs/exam/kr` (200) | lang=KR, head_term, cta_link, category |
| 5 | `part-time-job-resume-photo` | 알바 이력서 사진 완벽 가이드 — 반명함 규격부터 셀카 제작까지 | 1,757 | 초안 `false` | H1 1줄 차 | `/specs/resume/kr` (200) | lang=KR, head_term, cta_link, category |
| 6 | `id-photo-app-guide` | [네이버용] 증명사진 앱 추천 2026 — 셀카 한 장으로 여권·이력 | 2,870 | 초안 `false` | H1 1줄 차 | — | lang=KR, head_term, cta_link, category |
| 7 | `id-photo-app-guide-monkos` | [MONKOS블로그용] 증명사진, 이제 앱으로 만드세요 — MONKO | 1,561 | 초안 `false` | H1 1줄 차 | — | lang=KR, head_term, cta_link, category |
| 8 | `id-photo-outfit-styling-guide` | 증명사진 잘 나오는 법 — 복장·표정·헤어·메이크업 완벽 가이드 (2 | 2,847 | 초안 `false` | H1 1줄 차 | — | lang=KR, head_term, cta_link, category |
| 9 | `id-photo-glasses-guide` | 증명사진 안경 쓰고 찍어도 될까? — 이력서·취업·여권 사진 안경 착 | 3,217 | 초안 `false` | H1 1줄 차 | — | lang=KR, head_term, cta_link, category |
| 10 | `id-photo-makeup-guide` | 증명사진 화장, 어디까지 해야 할까? — 이력서·취업·여권 사진 메이 | 4,968 | 초안 `false` | H1 1줄 차 | — | lang=KR, head_term, cta_link, category |
| 11 | `linkedin-professional-headshot-guide` | 링크드인 프로필 사진, 증명사진과 뭐가 다를까? — 비즈니스 헤드샷  | 3,668 | 초안 `false` | 실질 상이 (md 3668자 / fs 4079자) | — | lang=KR, head_term, cta_link, category |
| 12 | `job-application-photo-complete-guide` | 취업사진, 면접 전에 이미 평가받는다 — 2026 취업사진 완벽 가이 | 4,728 | 초안 `false` | 실질 상이 (md 4728자 / fs 4680자) | `/specs/resume/kr` (200) | lang=KR, head_term, cta_link, category |
| 13 | `id-photo-natural-retouching-guide` | AI 증명사진 보정, 어디까지가 '자연스러움'일까 — 합격하는 보정과 | 3,716 | 초안 `false` | H1 1줄 차 | — | lang=KR, head_term, cta_link, category |
| 14 | `ai-id-photo-no-ai-look` | AI 증명사진인데 AI 티가 안 난다? — 2026 증명사진 기술이  | 3,327 | 초안 `false` | H1 1줄 차 | — | lang=KR, head_term, cta_link, category |
| 15 | `id-photo-price-cost-guide` | 증명사진 가격, 얼마가 적당할까 — 방식별 비용과 숨은 비용까지 (2 | 3,357 | 초안 `false` | H1 1줄 차 | — | head_term, cta_link |
| 16 | `id-photo-rejection-reasons` | 증명사진 반려, 왜 자꾸 다시 찍을까 — 반려 사유 7가지와 통과 체 | 3,235 | 초안 `false` | H1 1줄 차 | — | head_term, cta_link |
| 17 | `id-photo-validity-period` | 증명사진에도 유효기간이 있다 — 여권·비자·자격증·이력서 용도별 기한 | 3,453 | 초안 `false` | H1 1줄 차 | — | head_term, cta_link |
| 18 | `digital-id-photo-online-submission-guide` | 디지털 증명사진 파일 규격 — 온라인 여권·비자·시험·이력서 제출 완 | 2,868 | 초안 `false` | H1 1줄 차 | — | head_term, cta_link |
| 19 | `half-business-card-id-photo-size-3x4-guide` | 반명함판 증명사진 규격 완벽 가이드 — 3×4cm는 어디에 쓰고 어떻 | 2,920 | 초안 `false` | H1 1줄 차 | `/specs/halfcard/kr` (200) | head_term, cta_link |
| 20 | `infant-baby-passport-photo-guide` | 아기 여권사진, 집에서 찍어도 될까? — 신생아·유아 여권사진 규격과 | 3,007 | 초안 `false` | H1 1줄 차 | `/specs/passport/kr` (200) | head_term, cta_link |
| 21 | `passport-renewal-photo-guide` | 여권 재발급 사진, 예전 사진 그대로 써도 될까? — 여권 갱신 사진 | 3,037 | 초안 `false` | H1 1줄 차 | `/specs/passport/kr` (200) | head_term, cta_link |
| 22 | `resident-registration-card-photo-guide` | 주민등록증 사진 규격 완전 가이드 — 재발급·신규 신청 준비물과 온라 | 2,837 | 초안 `false` | H1 1줄 차 | `/specs/id/kr` (200) | head_term, cta_link |
| 23 | `summer-id-photo-tips` | 여름 증명사진 잘 찍는 법 — 땀·유분·습기·앞머리 눌림까지 (202 | 2,845 | 초안 `false` | H1 1줄 차 | — | head_term, cta_link |
| 24 | `professional-engineer-exam-photo-guide` | 기술사 시험 사진 규격 — 여권사진과 같은 3.5x4.5cm | 2,995 | 초안 `false` | H1 1줄 차 | `/specs/exam/kr` (200) | lang=KR, head_term, cta_link, category |
| 25 | `how-to-print-id-photo-at-home-convenience-store` | 증명사진 인쇄 방법 총정리 — 집·편의점·무인출력기로 규격 그대로 뽑 | 2,345 | 초안 `false` | H1 1줄 차 | — | head_term, cta_link |
| 26 | `civil-service-exam-photo-guide` | 공무원 시험 원서접수 사진 규격 — 국가직·지방직 한 번에 통과하는  | 2,314 | 초안 `false` | H1 1줄 차 | `/specs/exam/kr` (200) | lang=KR, head_term, cta_link, category |
| 27 | `job-photo-hairstyle-guide` | 취업사진 헤어스타일 완벽 가이드 — 앞머리·묶음머리, 남녀별 합격 머 | 3,200 | 초안 `false` | H1 1줄 차 | — | lang=KR, head_term, cta_link, category |
| 28 | `student-employee-id-card-photo-guide` | 학생증·사원증 사진 규격 완벽 가이드 — 반명함 크기, 배경, 복장까 | 2,963 | 초안 `false` | H1 1줄 차 | ⚠️ 학생증·사원증 — specs id(주민등록증)와 문서종 불일치 | lang=KR, head_term, cta_link, category |
| 29 | `id-photo-face-head-height-ratio` | 증명사진 얼굴 크기, 얼마나 나와야 할까 — 얼굴 비율 규격 완전정리 | 2,608 | 초안 `false` | H1 1줄 차 | ⚠️ 문서종 미특정(얼굴 비율 축) | head_term, cta_link |
| 30 | `job-photo-expression-guide` | 취업사진 표정 가이드 — 자연스러운 미소·눈빛·입꼬리로 합격 인상 만 | 3,505 | 초안 `false` | H1 1줄 차 | — | lang=KR, head_term, cta_link, category |
| 31 | `job-photo-suit-attire-ai-guide` | 취업사진 옷, 안 갈아입고 정장 입기 — AI 의상 합성으로 셔츠·정 | 2,647 | 초안 `false` | H1 1줄 차 | — | lang=KR, head_term, cta_link, category |
| 32 | `job-photo-posture-angle-guide` | 취업사진 자세·각도 가이드 — 어깨 라인·얼굴 각도·턱 위치로 단정한 | 3,677 | 초안 `false` | H1 1줄 차 | — | lang=KR, head_term, cta_link |
| 33 | `korea-lesser-known-id-photo-specs-guide` | 잘 안 알려진 국내 증명사진 3종 — 청소년증·국제운전면허·수상레저면 | 3,668 | 초안 `false` | H1 1줄 차 | ⚠️ 복수 문서종 언급(taxi·marine·youth-id 등) | lang=KR, head_term, cta_link, category |
| 34 | `passport-photo-background-color-by-country` | 여권사진 배경, 흰색이 정답이 아닌 나라들 — 국가별 배경색 규격 정 | 4,887 | 초안 `false` | H1 1줄 차 | `/specs/passport/kr` (200) | lang=KR, head_term, cta_link, category |

### 4-4. 실질 상이 5건 — 발행 전 정지 대상

지시서 §1은 "다른 글이면 정지·보고"를 요구한다. 차이의 성격을 특정한 결과 **서식 차 3건과 실질 상이 2건**으로 갈린다.

| slug | 차이 성격 | 판단 근거 |
|---|---|---|
| `ai-passport-photo-spec` | **서식 차** | 이모지 마커(`📷`) 유무, `***` ↔ `---`. 내용 동일. 단 본문 자체가 **"네이버 블로그 발행용 원고"** — 채널 귀속 재확인 필요 |
| `drivers-license-photo-diy` | **서식 차** | 1행, `👉 https://monkos.ai` ↔ `https://monkos.ai` |
| `job-application-photo-complete-guide` | **서식 차** | `***`↔`---`, `1\.`↔`1.`, 테이블 구분선 폭. 내용 동일 |
| `drivers-license-photo-guide` | **⚠️ 실질 상이** | fs는 대표 이미지·리드 문단을 가진 완성본(4,084자), md는 "네이버 블로그 복붙용 원고" 주석 블록을 가진 별본(3,116자). **서로 다른 버전** |
| `linkedin-professional-headshot-guide` | **⚠️ 실질 상이** | fs는 이미지 + `#####` 서식(4,079자), md는 평문(3,638자). fs의 이미지 파일명이 `og_…professional-business-card-photo-guide-en.jpg`로 **다른 글의 OG 이미지 재사용 흔적** |

> 뒤 2건은 `--update` 시 어느 쪽이 정본인지 결정이 선행해야 한다. 앞 3건은 md를 정본으로 삼아도 손실이 없다. **결정은 하지 않았다.**

---

## 5. 범위 준수

| 항목 | 상태 |
|---|---|
| B군 발행 | 미착수 ✅ (자료 수집까지) |
| A군 17건 · D군 계열 | 무접촉 ✅ |
| 라이브 `vol`·`post-*` 레거시 | 무접촉 ✅ (민아 소관) |
| 슬러그 변경 | 없음 ✅ 전건 |
| 전역 CTA 토글 조작 | 없음 ✅ (민아 소관) |
| 원본 md 본문 수정 | 없음 ✅ (`category` 1줄 추가만 — 허용 예외) |
| 프로덕션 `blog_posts` 테스트 문서 | 없음 ✅ (스크래치 컬렉션 사용·검증 후 삭제) |
| 타 에이전트 미커밋 작업 | 무접촉 ✅ |
| 배포 | 없음 ✅ (ch5 2조 — Firestore 쓰기, 재배포 불요) |

---

## 6. 커밋 (ch6 롤백 단위 분리)

| 커밋 | 내용 | 롤백 단위 |
|---|---|---|
| `d8071c1e` | `[fix] publish.mjs 미선언 필드 보존 일반화` | 도구 — 필드 계약 |
| `8484316f` | `[docs] 에세이 25건 category 통일` | 콘텐츠 원본 |
| (본 커밋) | `[log] Phase2 기록 + B군 근거 표` | 기록 |

변경 파일: `monkos_AI/portal/tools/blog-publish/publish.mjs` · `monkos-ops/contents/blog/*.md` 20건
배포 rev: **없음**

---

## 7. 후속 필요 (범위 밖 — 보고만)

1. **`author`·`pinned` 확장 추인 요망** (§2 각주). 지시서 목록 밖이나 동일 실패 양식이라 포함했다.
2. **B군 34건도 초안 선존 34/34** — Phase 1과 동일 양상. 발행 지시서는 `--update` 전제로 작성해야 한다.
3. **`head_term`·`cta_link` 보유 0/34** — B군은 발행 판정이 나더라도 계약 보강이 선행한다.
4. **실질 상이 2건의 정본 결정** (§4-4). 초안이 더 완성본인 경우가 있어 md를 무조건 정본으로 볼 수 없다.
5. **`ai-passport-photo-spec`·`drivers-license-photo-guide`는 본문에 "네이버 블로그용 원고"라고 적혀 있다** — 채널 귀속(monkos.ai vs 네이버) 확인 필요.

---

✅ `publish.mjs` 미선언 필드 보존 일반화 — 보존/갱신/빈문자열선언 양방향 실증
✅ 에세이 25건 `category: 빌더 노트` 통일 (본문 무수정, +20행 −0행)
✅ 재발행 후 CTA·OG 유지 — Firestore 325쌍 소멸 0 + 라이브 25/25 (2회 히트·대조군 판정)
✅ B군 34건 근거 표 제출 — 판정 없이 자료만
💡 1차 산출 35건은 ko 사이트맵 단독 대조 오류였고 언어별 재대조로 34건 교정 — 설계서와 일치
💡 실질 상이 5건 중 2건은 초안이 더 완성본 — md 무조건 정본 전제는 성립하지 않음
⏳ `author`·`pinned` 확장 추인 / 실질 상이 2건 정본 결정 / B군 계약 보강
📁 `publish.mjs` · `contents/blog` 20건 · 세션로그 · PF_OPUS · 본 보고서
🔀 3커밋 롤백 단위 분리 (도구 / 콘텐츠 / 기록)

---
type: report
date: 2026-04-27
from: iMac/막내1
subject: Firestore blog_posts 전수 진단 결과
pf: PF_CITADEL
phase: 긴급복구
---

# Firestore blog_posts 전수 진단 보고서

**[2026-04-27 17:56 KST] iMac/막내1 → 작가님**

---

## 1. 전체 현황

| 구분 | 건수 |
|------|------|
| **전체 doc** | **298** |
| published | 235 |
| unpublished (draft) | 63 |

### 언어별 분포

| 언어 | published | draft | 합계 |
|------|-----------|-------|------|
| ko | 67 | 35 | 102 |
| ja | 87 | 14 | 101 |
| en | 81 | 14 | 95 |

---

## 2. 분류표

| 분류 | 기준 | 건수 | 판정 |
|------|------|------|------|
| **A: 정상** | published + content >= 500자 | **184** | 유지 |
| **B: 본문 잘림** | published + content < 500자 | **51** | 복구/삭제 대상 |
| **C: 드래프트 정상** | draft + content >= 500자 | **48** | 검토 (구 doc/번역 원본) |
| **D: 드래프트 잘림** | draft + content < 500자 | **15** | 삭제 후보 |
| **E: 중복** | 같은 base+lang으로 2건+ | **36** | 짧은 쪽 삭제 |

> E분류 36건은 B/D와 중복 카운트 포함. 순수 삭제 대상은 아래 DRY RUN 94건으로 정리.

---

## 3. 4/27 변동분 (77건)

| 유형 | 건수 | 상세 |
|------|------|------|
| 한송이 직접 발행 | 1 | vol36-kr (04:51 KST) |
| 마이그레이션 번역 생성 (published) | 2 | vol36-en, vol36-ja |
| slug 마이그레이션 (draft→new published) | 48 | 07:39~08:04 KST, EN/JA 쌍으로 생성 |
| slug 마이그레이션 잔존 (잘림 published) | 22 | 07:55~07:58 KST, content < 500자로 발행됨 |
| slug 마이그레이션 잔존 (draft 정상) | 4 | 구 slug unpublish 안 된 케이스 |

**핵심 문제**: 마이그레이션이 잘린 본문을 가진 doc을 `published: true`로 생성함.

---

## 4. 복구 가능성 판정 (B분류 51건)

| 판정 | 건수 | 설명 |
|------|------|------|
| **복구가능 (C doc 존재)** | 0 | 같은 base+lang의 드래프트 정상본 없음 |
| **역번역 복구** | 8 | 다른 언어 정상본에서 역번역 가능 (품질 차선) |
| **복구불능** | 43 | 원본 완전 유실. 한송이 재입력 필요 |

### 역번역 복구 가능 8건

| 대상 doc | 소스 |
|----------|------|
| ai-photo-id-selfie-becomes-id-photo-monkos-ai-review-en | ← ja (930자) |
| ai-profile-picture-one-selfie-becomes-a-profile-kr | ← en (4309자) |
| id-photo-background-color-korea-vs-japan-comparison-en | ← ja (807자) |
| id-photo-background-color-korea-vs-japan-comparison-kr | ← ja (807자) |
| japanese-resume-photo-tips-ja | ← ko vol16 (5004자) |
| korean-vs-japanese-job-application-photos-compared-kr | ← ja (1061자) |
| korean-vs-japanese-job-application-photos-how-they-differ-en | ← ja (1061자) |
| what-background-color-should-i-choose-for-my-id-photo-en | ← ja (807자) |

---

## 5. 삭제 후보 DRY RUN (94건)

### 구성

| 사유 | 건수 |
|------|------|
| B분류 복구불능 (published + 잘림 + 원본 유실) | 43 |
| D분류 전체 (draft + 잘림) | 15 |
| E분류 중복 짧은 쪽 | 36 |
| **합계** | **94** |

### D분류 15건 (한글 slug 구 doc — 전부 ko, draft, 잘림)

| doc ID | content |
|--------|---------|
| ai로-증명사진-만들기-진짜-가능할까-... | 74자 |
| 증명사진-취업사진-메이크업-톤별로-... | 68자 |
| 증명사진-헤어스타일-메이크업-다음은-... | 64자 |
| 취업-면접-올림머리-승무원머리-... | 75자 |
| 클로드가-컴퓨터-꺼져있을-때도-... | 81자 |
| 한국-vs-일본-취업사진-헤어-... | 69자 |
| 한연구원-매거진-vol15-... | 69자 |
| 한연구원-매거진-vol16-... | 74자 |
| 한연구원-매거진-vol17-... | 66자 |
| 한연구원-매거진-vol18-... | 66자 |
| 한연구원-매거진-vol19-... | 82자 |
| 한연구원-매거진-vol21-... | 77자 |
| 한연구원-매거진-vol22-... | 75자 |
| 한연구원-매거진-vol23-... | 67자 |
| 한연구원매거진vol20-... | 68자 |

### E분류 주요 중복 그룹 (대표 케이스)

- **주민등록증 EN**: 5건 중복 → 4건 삭제 (8791~9061자, 보존: 9061자)
- **vol19 JA**: 3건 중복 → 2건 삭제 (3156~3162자)
- **vol23 EN**: 3건 중복 → 2건 삭제 (6249~6412자)
- **vol19 EN**: 3건 중복 → 2건 삭제 (5152~5278자)

---

## 6. 자동 색인 영향 분석

### blog.js 색인 로직 (174~181행, 248~255행)

- **트리거**: 글 생성(POST) + `published: true` 시 sitemap ping
- **트리거**: 글 수정(PUT) + `published: true` 시 sitemap ping
- **ping URL**: `https://www.google.com/ping?sitemap=https://monkos.ai/sitemap.xml`
- **번역본**: 번역 트리거(`translateAndSaveBlogPost`) 내부에서 별도 ping 없음. 단, 번역 후 doc이 published로 생성되면 그 시점에 ping.

### sitemap 오염 상태 — 심각

- sitemap.xml 내 blog URL: **235건**
- 이 중 **B분류 잘린 글이 다수 포함** (56건 이상 확인)
- Googlebot이 **52~288자짜리 스텁 페이지를 크롤** → "thin content" 판정 → SEO 전체 품질 하락 위험
- 4/27 마이그레이션이 잘린 doc을 `published: true`로 생성 → 즉시 sitemap ping → Google이 잘린 본문 수집

### SEO 피해 시나리오

1. Googlebot이 잘린 URL 크롤 → "thin content" 판정
2. 중복 slug 존재 → "duplicate content" 판정
3. 두 요소가 사이트 전체 품질 신호(site quality signal) 하락으로 이어질 수 있음

---

## 7. 한송이 재입력 필요 목록 (복구불능 KO 원본)

> 아래는 한국어 원본이 잘렸거나 유실된 글. 한송이 원본 재입력 후 재번역 필요.

| slug | 제목 | 현재 content |
|------|------|-------------|
| ai-id-photo-vs-studio-id-photo-whats-the-difference-kr | vol.18 AI 증명사진 vs 스튜디오 | 66자 |
| can-you-really-create-id-photos-with-ai-honest-review-kr | AI로 증명사진 만들기 가능? | 74자 |
| does-claude-work-even-when-the-computer-is-off-kr | 클로드 컴퓨터 꺼져있을 때 | 81자 |
| id-photo-background-color-korea-vs-japan-comparison-kr | vol.19 배경색 비교 | 82자 |
| id-photo-hairstyle-hair-after-makeup-final-touch-kr | 헤어스타일 마지막 한 수 | 64자 |
| id-photo-job-application-photo-makeup-perfect-tone-kr | 톤별 세팅법 | 68자 |
| job-interview-updo-flight-attendant-hair-5-steps-kr | 올림머리 5단계 | 75자 |
| korea-vs-japan-job-application-photo-hair-differences-kr | 취업사진 헤어 차이 | 69자 |
| korean-researcher-magazine-vol-15-korea-vs-japan-interview-kr | vol.15 면접 복장 | 69자 |
| korean-vs-japanese-interview-makeup-the-differences-kr | vol.17 면접 메이크업 | 66자 |
| korean-vs-japanese-job-application-photos-compared-kr | vol.20 취업사진 비교 | 68자 |
| researcher-magazine-vol-23-top-5-resume-photo-questions-kr | vol.23 Q&A 5가지 | 67자 |
| researcher-magazine-vol16-japanese-job-seeker-photos-kr | vol.16 일본 취준생 | 74자 |
| selfie-job-application-photo-heres-what-you-need-to-know-kr | vol.22 셀카 증명사진 | 75자 |
| ai-profile-picture-one-selfie-becomes-a-profile-kr | vol.21 셀카 증명사진 | 77자 |

> 15건. 이 중 ai-profile-picture...-kr, id-photo-background...-kr, korean-vs-japanese-job...-kr은 역번역 복구 가능.
> **순수 재입력 필요: 12건**

---

## 8. 긴급 권고사항

1. **즉시**: B분류 잘림 + published doc의 `published: false` 전환 (sitemap 오염 차단)
2. **즉시**: D분류 15건 삭제 (가치 없는 한글 slug 구 draft)
3. **즉시**: E분류 중복 짧은 쪽 삭제 또는 unpublish (중복 콘텐츠 해소)
4. **후속**: 한송이 원본 12건 재입력 → 재번역
5. **후속**: 역번역 복구 8건 실행
6. **후속**: sitemap 재생성 ping → GSC에서 제거 URL 확인

---

**⏳ 삭제/unpublish 실행: 작가님 승인 대기**

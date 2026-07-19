---
type: order
date: 2026-07-19
device: iMac
agent: 쌍아
target: 막내2
portfolio: PF_SPECS
status: 대기
priority: P1
---

# 지시서: 동남아 id/vn어 specs 1단계 + EN 한국 비자 메타 보강

**[2026-07-19 18:28 KST]** iMac/쌍아 → 막내2

## 배경

Ads 키워드 플래너 + 구글 자동완성 실측:
- 인니어 "foto visa korea" 자동완성 1위, 월 720회
- 인니어 "foto paspor" 월 9,900회
- 베트남어 "ảnh visa hàn" 자동완성 1위, 월 110회
- 영어 "south korea visa photo specifications" 인니 본토에서 9.5위

현재 id/vn어 specs 페이지 없음 → 수요가 실재하나 잡을 페이지 부재. 인프라 비용 0 (기존 다국어 구조에 언어만 추가).

## ⚠️ 준수 조항

- ch2 코딩 규칙: 기존 i18n 구조 준수
- specs URL 정본: `/specs/{type}/{country}` 패턴 유지 (references.md)
- deploy.sh 경유
- **1단계 스코프 한정**: 한국행 비자·여권 핵심 슬러그만. 429 전량×2언어는 후속 단계.

## 작업

### Task 1. id/vn어 i18n 키 추가 (specs-i18n.js)

기존 ko/en/ja/es 구조에 `id`(인도네시아어) + `vi`(베트남어) 추가:

**핵심 번역 항목:**
- 페이지 제목 템플릿 (`detailSuffix` 등)
- CTA 문구 ("사진 선택", "무료 크롭", "다운로드" 등)
- 퍼널 상태 문구 (업로드·분석중·완료·재시도 등)
- FAQ 폴백

번역 품질: 기본 수준 OK — 네이티브 완벽보다 존재하는 게 우선.

### Task 2. 라우팅 추가 (server.js + render-specs.js)

- `/id/specs/{type}/{country}` → id어 렌더
- `/vi/specs/{type}/{country}` → vi어 렌더
- hreflang 태그에 id/vi 추가
- sitemap에 id/vi 언어 추가

### Task 3. 1단계 대상 슬러그 (핵심만)

| 슬러그 | 이유 |
|--------|------|
| kr-visa | "foto visa korea" 자동완성 1위 |
| kr-passport | 한국 여권 |
| jp-visa | "foto visa jepang" 자동완성 |
| us-visa | "foto visa amerika" |

전 슬러그 동작은 구조적으로 보장되되, SEO 메타(seoTitle/seoDescription)는 위 4건만 id/vi 직접 작성. 나머지는 템플릿 폴백.

### Task 4. EN 한국 비자 메타 보강 (quick win)

GSC 실측: 인니 본토에서 영어 "south korea visa photo specifications" 9.5위.

`countries.jsonl`의 kr-visa 레코드 en 메타 보강:
- seoTitle: "South Korea Visa Photo Size & Requirements 2026 — Free AI Generator"
- seoDescription: "Korea visa photo specifications: 3.5×4.5cm, white background. Create compliant photos instantly with AI — free online tool."

이 페이지 재색인 요청까지 (GSC index_inspect).

### Task 5. 테스트 + 배포

```bash
npm test
./deploy.sh
```

### Task 6. 라이브 확인

- `/id/specs/visa/kr` → 인니어 렌더 + 퍼널 동작
- `/vi/specs/visa/kr` → 베트남어 렌더 + 퍼널 동작
- `/en/specs/visa/kr` → 보강된 메타 확인
- hreflang 6언어 출력 확인

## 완료 조건

1. id/vi 언어 라우팅 동작
2. 핵심 4슬러그 SEO 메타 직접 작성
3. hreflang + sitemap 반영
4. EN kr-visa 메타 보강
5. jest 녹색 + 배포
6. 민아 검증 게이트

## 커밋

```
[feat] specs 동남아 1단계 — id/vn어 i18n·라우팅 + EN kr-visa 메타 보강
```

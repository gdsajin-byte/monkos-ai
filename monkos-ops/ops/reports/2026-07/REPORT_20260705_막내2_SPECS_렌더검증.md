---
type: report
date: 2026-07-05
device: iMac
agent: 막내2
portfolio: PF_SPECS
status: 마감
---

# SPECS V2 전면 배포 전 페이지 렌더 검증 보고서

**[2026-07-05 18:17 KST]** iMac/막내2 → 작가님

> 지시서: ORDER_20260705_iMac쌍아_막내2_SPECS_V2_페이지렌더검증.md

---

## A. V2 페이지 렌더 검증

### 주요국 10개 HTTP 상태

| 슬러그 | 1-seg 응답 | 리다이렉트 대상 | 최종 응답 |
|--------|-----------|----------------|-----------|
| kr-passport | 200 (직접 서빙) | — | 200 |
| kr-visa | 301 | /specs/visa/kr | 200 |
| jp-passport | 301 | /specs/passport/jp | 200 |
| us-passport | 301 | /specs/passport/us | 200 |
| us-visa | 301 | /specs/visa/us | 200 |
| cn-passport | 301 | /specs/passport/cn | 200 |
| de-passport | 301 | /specs/passport/de | 200 |
| fr-passport | 301 | /specs/passport/fr | 200 |
| in-passport | 301 | /specs/passport/in | 200 |
| au-passport | 301 | /specs/passport/au | 200 |

- `kr-passport`만 V2_DIRECT_SLUGS로 1-segment 직접 서빙 (200)
- 나머지는 1-seg → 2-seg 301 리다이렉트 후 200 (정상)

### V2 phase UI 표시

| 슬러그 | ko V2 | en V2 | ja V2 | 비고 |
|--------|-------|-------|-------|------|
| passport/kr | O | O | O | V2_DIRECT_SLUGS — 전 언어 V2 |
| passport/jp | O | X | X | en/ja 게이트 (env 미설정) |
| passport/de | O | X | X | 동일 |
| passport/cn | O | X | X | 동일 |
| passport/in | O | X | X | 동일 |
| visa/kr | O | X | X | 동일 |
| halfcard/kr | O | X | X | 동일 |
| passport/us | X | X | X | 엔진 비호환 (배경: "White or off-white") |
| passport/fr | X | X | X | 엔진 비호환 |
| passport/au | X | X | X | 엔진 비호환 |

**EN/JA 게이트 동작 원리**: `isV2Spec()` 함수에서 `LEMONSQUEEZY_VARIANT_SPECS_SINGLE` env 존재 여부로 판정. dev 환경 미설정 → en/ja는 kr-passport 제외 V1 유지. **설계 의도대로 정상 작동** (DESIGN_20260704 §2-D "반쪽 롤아웃 방지").

### V2 호환 슬러그 수

| 구분 | 건수 | 비고 |
|------|------|------|
| V2 엔진 호환 | 361 | h/w >= 1.15 + 흰 배경 |
| V2 비호환 | 67 | 사이즈 파싱 불가, 비율 미달, 비흰배경 |
| 합계 | 428 | PF 기록(360/68)과 ±1 일치 |

### 규격 정보 출력 확인

| 슬러그 | 사이즈 | 배경 | 국가명 |
|--------|--------|------|--------|
| kr-passport | 3.5 × 4.5cm | 흰색 | 대한민국 |
| us-passport | 2 × 2 inch (51 × 51mm) | White or off-white | 미국 |
| jp-passport | 3.5 × 4.5cm | 흰색 | 일본 |
| de-passport | 3.5 × 4.5cm | 흰색 | 독일 |
| in-passport | 3.5 × 4.5cm | 흰색 | 인도 |

### 다국어 이름 표시

| 슬러그 | ko | en | ja |
|--------|----|----|-----|
| kr-passport | 대한민국 여권 | South Korea Passport | 韓国 パスポート |
| us-passport | 미국 Passport / Visa | USA Passport / Visa | アメリカ パスポート・ビザ |
| jp-passport | 일본 여권 | Japan Passport | 日本 パスポート |

- 가시적 텍스트에 한국어 잔류 없음 (주석/CSS 코멘트 내만 존재 — 비가시)

---

## B. 비호환 슬러그 V1 폴백 검증

| 슬러그 | HTTP | 타이틀 | V2 UI | V1 레이아웃 |
|--------|------|--------|-------|------------|
| eu-resume | 200 | EU EU CV Photo 규격 35 × 45 mm | X | O (specs-band 구조) |
| uk-passport | 200 | 영국 UK Passport 규격 35 × 45 mm | X | O |
| cn-resume | 200 | 중국 简历照片 규격 1寸 · 2寸 복수 규격 | X | O |
| kr-halfcard | 200 | 한국 반명함 규격 30 × 40 mm | O (V2 호환) | — |
| jp-halfcard | 200 | 일본 半名刺写真 규격 30 × 40 mm | X | O |

- **jp-halfcard**: V2 비호환 (배경 미일치 추정) → V1 정상 표시
- **kr-halfcard**: 엔진 호환으로 판정되어 V2 표시 (정상)
- 비호환 슬러그는 전부 V1 레이아웃(specs-band, specs-crop-tool 등)으로 정상 렌더

---

## C. sitemap 정합성

| 항목 | 결과 |
|------|------|
| 총 URL 수 | **1,284건** (428 슬러그 × 3언어) |
| 404 유발 URL | **0건** (1,284건 전수 curl 검증) |
| V2 호환 슬러그 포함 | O (passport/kr, passport/jp, passport/de 등 확인) |
| 1-segment 형식 혼재 | **X** (2-segment 형식만 — 정상) |
| 존재하지 않는 슬러그 | sitemap에 미포함 확인 |

---

## D. OG/메타태그 검증

| 슬러그 | og:title | og:description | og:image | canonical | hreflang |
|--------|----------|----------------|----------|-----------|----------|
| kr-passport | O | O | kr-passport.webp | /specs/passport/kr | ko/en/ja/x-default (4) |
| us-passport | O | O | 51x51.webp | /specs/passport/us | ko/en/ja/x-default (4) |
| jp-passport | O | O | 35x45.webp | /specs/passport/jp | ko/en/ja/x-default (4) |
| de-passport | O | O | 35x45.webp | /specs/passport/de | ko/en/ja/x-default (4) |
| in-passport | O | O | 35x45.webp | /specs/passport/in | ko/en/ja/x-default (4) |

- og:image: kr-passport만 전용 이미지, 나머지는 사이즈별 폴백 이미지 (정상 — 설계 의도)
- canonical: 전부 2-segment 형식 정본 URL
- hreflang: 4개 태그 (ko/en/ja/x-default) 전수 정상

---

## 종합 판정

| 항목 | 판정 | 비고 |
|------|------|------|
| A. V2 렌더 (주요국 10개) | **PASS** | 전 슬러그 200, 규격 정보·V2 UI 정상 |
| A. 언어별 분기 (9건) | **PASS** | ko/en/ja 타이틀·h1 해당 언어 정상 |
| A. V2 phase UI | **PASS** | V2 호환 슬러그만 표시, en/ja 게이트 설계대로 |
| B. V1 폴백 | **PASS** | 비호환 슬러그 전부 V1 레이아웃 정상 |
| C. sitemap | **PASS** | 1,284건 전수 200, 404 0건 |
| D. OG/메타태그 | **PASS** | 5건 전 항목 존재, canonical·hreflang 정상 |

### 깨지는 페이지: **없음**

---

## 참고 사항 (버그 아님, 기록용)

1. **EN/JA V2 게이트**: dev 환경에서는 `LEMONSQUEEZY_VARIANT_SPECS_SINGLE` 미설정으로 en/ja V2 비활성. prod에서 시크릿 설정 시 활성화. 설계 의도.
2. **us-passport 엔진 비호환**: 배경값 "White or off-white" — 정규식 `^white`는 매칭하나 "흰"으로 시작하지 않음. 그러나 `/^white/i.test(bg)` 분기로 매칭됨. **재확인 결과**: `h/w = 51/51 = 1.0 < 1.15` 비율 미달로 비호환. 정상.
3. **og:image 사이즈별 폴백**: 전용 이미지 미보유 국가는 사이즈 패턴별 공용 이미지(35x45.webp, 51x51.webp) 사용. 6/26 설계(쌍아) 의도대로.

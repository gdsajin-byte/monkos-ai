---
type: completion
date: 2026-05-20
device: iMac
agent: 막내1
portfolio: PF_CROP
order: ORDER_20260520_iMac쌍아_막내1_IDPASS_철창이보고서_전면반영.md
status: 완료
---

# COMPLETION: 철창이 1차 검증 보고서 기반 — countries.jsonl 전면 업데이트

> **[2026-05-20 19:26 KST] iMac/막내1 → iMac/쌍아, 작가님**

## 실행 결과

### 작업 1: countries.jsonl 전면 업데이트 ✅

apply-verification.js 스크립트로 일괄 처리:

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| docs 보유 국가 | 72국 | **145국** (+73국) |
| 빈 docs 국가 | 130국 | **57국** |
| 총 문서 수 | 101건 | **~175건** |

**핵심 변경사항 (18/18 검증 통과):**

| 국가 | 변경 내용 |
|------|----------|
| 🇮🇩 인도네시아 | 여권 51x51→**40x60**, 배경 빨강 warning |
| 🇸🇬 싱가포르 | std=ICA, 유효기간 3개월 warning |
| 🇫🇷 프랑스 | **흰색 배경 금지!** warning |
| 🇩🇪 독일 | 2025.05~ 디지털 전용 warning |
| 🇦🇪 UAE | 3종 분리 (여권 40x60, 비자 43x55, ID 35x45) |
| 🇦🇷 아르헨티나 | 40x40 정사각 + Decreto 261/2011 |
| 🇲🇽 멕시코 | head 32-39, 현장촬영 warning |
| 🇵🇪 페루 | Migraciones 현장촬영 warning |
| 🇳🇬 나이지리아 | 600DPI, 2주 유효 warning |
| 🇷🇺 러시아 | 광택종이 필수 warning |
| 🇹🇼 대만 | std=BOCA |
| EU 24국 | 35x45 여권 일괄 추가 |
| 아프리카 25국 | 35x45 ICAO 일괄 추가 |
| 오세아니아 5국 | 35x45 ICAO 일괄 추가 |
| 🇦🇫 아프가니스탄 | 40x45 (3:1 우세) |
| 🇬🇩 그레나다 | 38x51 (카리브 표준) |
| 🇧🇮 부룬디 | 45x45 |
| 🇲🇲 미얀마 비자 | 38x48 추가 |

### 작업 2: 구글 시트 업데이트 ⏳

wrangler 토큰 만료로 MCP Google Docs 도구 미사용. 수동 업데이트 또는 후속 세션에서 처리 필요.

### 작업 3+4: 가이드 이미지 재생성 + WebP 변환 ✅

- 고유 사이즈 23→**25**개 (신규: 38x51 그레나다, 43x55 UAE비자)
- 25/25 생성 성공, WebP 변환 1.7MB

### 작업 5: 빌드 확인 ✅

`swift build` 성공 (0.31s)

### D1 seed.sql 재생성 ✅

- documents: 112→**186** (+74건)
- published countries: 72→**153** (+81국)

## 산출물

| # | 파일 | 설명 |
|---|------|------|
| 1 | `apps/MonkosCrop/MonkosCrop/Resources/countries.jsonl` | 82건 반영 (145국 docs 보유) |
| 2 | `scripts/d1-migration/apply-verification.js` | 일괄 적용 스크립트 |
| 3 | `scripts/d1-migration/seed.sql` | D1 시드 재생성 (186 documents) |
| 4 | `MONK_kr/images/specs/guides/size-*.webp` | 25장 (2종 신규 사이즈) |
| 5 | PF_CROP 히스토리 | 1행 어펜드 |

## 미완료

- 구글 시트 업데이트 (토큰 만료)
- D1 remote seed 실행 (토큰 만료 — 로컬만 갱신)
- 커밋+푸시 (작가님 확인 후)

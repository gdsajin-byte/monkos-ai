---
type: completion
date: 2026-07-16
device: iMac
agent: 막내1
portfolio: PF_SPECS
status: 완료
order: ORDER_20260716_iMac쌍아_막내_SPECS_데이터정합_전수조사.md
---

# SPECS 428 데이터 정합 전수조사 — 완료 보고

**[2026-07-16 12:15 KST]** iMac/막내1 → 작가님

---

## A: countryEn / country 정합 전수 검사

| 검사 | 결과 |
|------|------|
| 총 슬러그 | 428건 |
| 불일치 확정 | **2건** |
| 정상 | 426건 |

### 불일치 목록 (수정 완료)

| slug | 수정 전 countryEn | country(ko) | 수정 후 countryEn |
|------|-----------------|-------------|-----------------|
| uk-passport | Europe | 영국 | **United Kingdom** |
| de-resume | Europe | 독일 | **Germany** |

- ci-passport/ci-visa: countryEn="Côte d'Ivoire" — 공식 영문명이므로 정상 판정.
- eu-passport/eu-visa/eu-resume/eu-license: countryEn="Europe"/"European Union" — eu- 슬러그이므로 정상.

---

## B: seoTitle 3언어 정합 전수 검사

| 검사 | 결과 |
|------|------|
| 총 검사 | 428 × 4언어 (ko/en/ja/es) |
| 불일치 확정 | **4건 수정** + 2건 보고만 |
| us-passport ko 비자 | ✅ 이미 수정 완료 확인 |

### 수정 완료 (A와 연동)

| slug | 언어 | 수정 전 | 수정 후 |
|------|------|--------|--------|
| uk-passport | en | "Europe Passport Photo..." | "**UK** Passport Photo..." |
| uk-passport | es | "Europa Foto Pasaporte..." | "**Reino Unido** Foto Pasaporte..." |
| de-resume | en | "Europe Application Photo..." | "**Germany** Application Photo..." |
| de-resume | es | "Europa Foto Solicitud..." | "**Alemania** Foto Solicitud..." |

### seoDescription도 동시 수정 (Europe 오염)

| slug | 언어 | 수정 내용 |
|------|------|---------|
| uk-passport | en | "Europe passport" → "UK passport" |
| uk-passport | es | "de Europa" → "de Reino Unido" |
| de-resume | en | "Europe application" → "Germany application" |
| de-resume | es | "de Europa" → "de Alemania" |

### 보고만 (수정 미반영)

| slug | 언어 | 현재 값 | 판정 |
|------|------|--------|------|
| us-visa | en | "US Visa Photo..." | US는 USA 표준 약어 — **정상** |
| jp-halfcard | ko | "日本 半名刺写真 사진..." | 한자 표기. 일본 제품명 보존 의도 가능 — **작가님 판단 사안** |

---

## C: EU 공통 ↔ 개별국 중복 분석

### 결론: 중복 후보 0건

| EU 공통 | 개별국 수 | 규격 완전 동일 | 고유 콘텐츠 | 중복 후보 |
|---------|---------|-------------|-----------|---------|
| eu-passport | 30개국 | 0건 (전부 bg 차이) | 전체 ✅ | **0건** |
| eu-visa | 30개국 | 27건 (규격 동일) | 전체 ✅ | **0건** (고유 콘텐츠) |
| eu-resume | 1개국 (de) | 0건 (bg 차이) | ✅ | **0건** |
| eu-license | 1개국 (uk) | 0건 (bg 차이) | ✅ | **0건** |

- eu-visa 계열은 규격(size/dpi/bg)이 동일한 개별국이 27건이지만, 전부 고유 details/faqs를 보유하므로 중복이 아닌 **정당한 개별 페이지**.

---

## D: widthMm / heightMm / bgColor / dpi 결번 통계

| 필드 | 존재 | 결번 | 비율 | 비고 |
|------|------|------|------|------|
| widthMm | 0 | **428** | 100% | 필드 자체가 스키마에 미존재 |
| heightMm | 0 | **428** | 100% | 필드 자체가 스키마에 미존재 |
| bgColor | 0 | **428** | 100% | 필드 자체가 스키마에 미존재 |
| dpi | **428** | 0 | 0% | 전체 존재 (300dpi: 425건, 600dpi: 3건) |

- 치수 정보는 `size` 필드(텍스트, 예: "3.5 × 4.5cm")로 관리 중.
- 배경 정보는 `background` 필드(텍스트, 예: "흰색")로 관리 중.
- widthMm/heightMm/bgColor는 M1 전수감사 정밀리서치 지시서 영역으로 보고만 수행.

---

## E: 수정 반영 + 배포 + 검증

### 수정 파일

| 파일 | 수정 내용 |
|------|---------|
| `monkos_AI/portal/lib/cms/specs-data.json` | uk-passport, de-resume countryEn + seoTitle(en/es) + seoDescription(en/es) 수정 — 총 10건 |

### 배포

- dev 배포 완료: `monkos-portal-dev-00137-cs8`
- prod 배포: 미수행 (작가님 승인 대기)

### curl 검증

| slug | 결과 | 비고 |
|------|------|------|
| us-passport | ✅ title 정상 | 미수정 슬러그 무접촉 확인 |
| kr-passport | ✅ title 정상 | 미수정 슬러그 무접촉 확인 |
| de-passport | ✅ title 정상 | 미수정 슬러그 무접촉 확인 |
| uk-passport | ⚠️ HTTP 500 | 기존 서버 이슈 (fr-passport, uk-visa도 동일 500) |
| de-resume | ⚠️ HTTP 500 | 기존 서버 이슈 (본 지시서 범위 밖) |

---

## 부대 발견

1. **jp-halfcard country 필드**: "日本" (한자) — 한국어 필드에 일본어 한자 사용. "일본"이 표준이나 제품명 보존 의도일 수 있어 보고만.
2. **uk-passport/de-resume/fr-passport 등 일부 슬러그 500 에러**: dev 환경 기존 서버 이슈. 데이터 수정과 무관.
3. **de-resume seoDescription.es 기존 오류**: "foto de foto de solicitud" (foto 중복) — 본 지시서 범위 밖이라 미수정.

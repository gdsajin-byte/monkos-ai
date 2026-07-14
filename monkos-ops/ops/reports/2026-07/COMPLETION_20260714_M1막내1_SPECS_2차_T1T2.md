---
type: completion
date: 2026-07-14
device: M1
agent: 막내1
status: 완료
portfolio: PF_SPECS
parent_order: ORDER_20260714_M1민아_막내1_SPECS_2차확장.md
---

# SPECS 2차 확장 T1+T2 — 완료 보고

**[2026-07-14 17:28 KST]** M1/막내1 → 작가님, M1/민아

## T1 ✅ 13건 기계 판정 + 6건 편입

### 13건 판정표

| slug | 유형 | 판정 | 사유 |
|------|------|------|------|
| ch-passport | %병기 | DB 유지 | 리서치 29-34mm vs %계산 31.5-36mm — 리서치 자기모순 |
| ee-passport | %병기 | DB 유지 | 70-80% × 50mm = 35-40mm vs DB 32-36mm — 리서치 mm 미제시 |
| in-visa-bls | %병기 | DB 유지 | 80-85% × 51mm = 40.8-43.4mm vs DB 36-41mm — BLS 대행사 규정 |
| lt-passport | %병기 | DB 유지 | % vs mm 자기모순 (frame height 해석 차이) |
| no-passport | %병기 | 일치 확인 | R: 32-36mm = DB 32-36mm, % 경미 오차(1.8mm) |
| no-visa | %병기 | 일치 확인 | 동일 |
| cn-visa | DB 불일치 | 일치 확인 | 검산 오파싱 (width 15-22mm를 height로 인식), 실제 height 28-33mm = DB |
| dk-passport | DB 불일치 | DB 유지 | R: 30-36mm vs DB 32-36mm, min 2mm 차이, 보류 |
| dk-visa | DB 불일치 | DB 유지 | 동일 |
| in-passport | DB 불일치 | unverified 유지 | R: 36-38mm vs DB 32-36mm, 공식 재확인 필요 |
| kr-visa | DB 불일치 | DB 유지 | R: 2.5-3.5cm은 미국 비자 규격 혼동 의심 |
| nl-passport | DB 불일치 | unverified 유지 | R: 26-30mm vs DB 32-36mm, government.nl 공식 출처 |
| nl-visa | DB 불일치 | unverified 유지 | 동일 |

**DB 변경: 0건** (진실성 게이트 — 확인 불충분건 성급 변경 금지)

### 6건 편입 리서치

| slug | verified 필드 | 흰배경 허용 |
|------|--------------|-------------|
| us-passport | 14/14 | ✅ 필수 (white or off-white) |
| eu-passport | 11/14 | ✅ 허용 (white or light grey) |
| jp-halfcard | 10/14 | ✅ 표준 (white 가장 일반적) |
| cn-resume | 14/14 | ✅ 표준 (공식 신분증용) |
| uk-passport | 14/14 | ⚠️ 부분 (off-white 계열, cream/ivory) |
| au-passport | 11/14 | ✅ 허용 (white or light grey) |

- restrictions 6건 + officialSource 6건 + validity 1건 적재 완료
- verify_numeric.py `--prose-scan` 모드 추가, 전수 통과

## T2 ✅ ko/ja 번역 + ICAO 정직화

### restrictions 번역
- 87슬러그 × 7필드 × 2언어 = **ko 87/87 완성, ja 87/87 완성**
- 워크플로우 3배치 병렬 번역
- 도메인 용어 정합: 착용 금지/허용/노출 필수/정면/무표정 등 기존 specs 어휘 체계 준수

### ICAO 정직화
- ICAO 보일러 307건 + EU 보일러 3건 = **310건** 정직 표현 교체 (3언어)
- ko: "국제 표준(ICAO 9303) 일반 기준을 기반으로 한 안내입니다. 국가별 세부 규정은 공식 기관 확인을 권장합니다."
- 리서치 완료 슬러그는 교체 대상 제외

### dev 검증
- kr-passport ko: restrictions 한국어 노출 ✅
- kr-passport ja: restrictions 일본어 노출 ✅
- us-visa ko: restrictions 한국어 노출 ✅
- ICAO 정직화: ng-passport "공식 기관 확인을 권장" 확인 ✅
- GA4 이벤트 회귀 무결 ✅
- jest 103/103 통과

### 워크플로우 비용 요약

| 워크플로우 | 에이전트 | 토큰 | 시간 |
|-----------|---------|------|------|
| 1차 100슬러그 리서치 | 18 | 1,057K | 18분 |
| T1 6건 편입 리서치 | 2 | 121K | 15분 |
| T2 87슬러그 번역 | 4 | 155K | 7분 |
| **합계** | **24** | **1,333K** | — |

## 배포

- dev: 최신 rev (T1+T2 포함)
- prod: 민아 게이트 → 작가님 검수 후

## 잔여

- T3: 잔여 328슬러그 워크플로우 확장 (별도 COMPLETION)
- P3: v1 잔존 18 infoOnly 전환 (쌍아 설계 게이트)

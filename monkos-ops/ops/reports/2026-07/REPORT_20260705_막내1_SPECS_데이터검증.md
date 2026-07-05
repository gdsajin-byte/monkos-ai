---
type: report
date: 2026-07-05
device: iMac
agent: 막내1
portfolio: PF_SPECS
status: 마감
---

# 스펙스 V2 데이터 검증 보고서

**[2026-07-05 18:13 KST]** iMac/막내1 → 작가님

> 지시서: ORDER_20260705_iMac쌍아_막내1_SPECS_V2_데이터검증.md

---

## A. 필수 필드 존재 검증 (전수 428개)

| 필드 | 누락 수 | 비고 |
|------|---------|------|
| country (한국어 이름) | 0 | — |
| countryEn (영어 이름) | 0 | — |
| countryJa (일본어 이름) | 0 | 전 슬러그 보유 |
| size | 0 | — |
| background | 0 | — |
| type | 0 | — |
| typeEn | 0 | — |

**결과: 필수 필드 누락 없음. 전수 통과.**

---

## B. V2 엔진 호환성 분류 (전수 428개)

| 분류 | 수량 | 비율 |
|------|------|------|
| V2 호환 | **361** | 84.3% |
| 비율 부적합 (h/w < 1.15) | 50 | 11.7% |
| 배경 부적합 | 16 | 3.7% |
| 사이즈 파싱 불가 | 1 | 0.2% |

### B-1. 비율 부적합 (50건) — 정방형/가로형

대부분 정사각형(ratio 1.000). 실제 규격이 정방형이므로 데이터 정상.

| 슬러그 | 비율 | 사이즈 |
|--------|------|--------|
| us-passport | 1.000 | 2 × 2 inch (51 × 51mm) |
| usa-headshot | 1.000 | 400×400px~ |
| jp-visa | 1.000 | 4.5 × 4.5cm |
| us-visa | 1.000 | 2 × 2 inch (51 × 51mm) |
| in-visa-evisa | 1.000 | 2 × 2 inch (51 × 51mm) |
| in-visa-bls | 1.000 | 2 × 2 inch (51 × 51mm) |
| af-passport | 1.125 | 4 × 4.5cm |
| af-visa | 1.125 | 4 × 4.5cm |
| rs-passport | 1.000 | 5 × 5cm |
| mk-passport | 1.000 | 5 × 5cm |
| ar-passport | 1.000 | 4 × 4cm |
| ar-visa | 1.000 | 4 × 4cm |
| cl-passport | 1.000 | 4.5 × 4.5cm |
| cl-visa | 1.000 | 4.5 × 4.5cm |
| ve-passport | 1.000 | 2 × 2 inch (51 × 51mm) |
| ve-visa | 1.000 | 2 × 2 inch (51 × 51mm) |
| ec-passport | 1.000 | 5 × 5cm |
| ec-visa | 1.000 | 5 × 5cm |
| cr-passport | 1.000 | 2 × 2 inch (51 × 51mm) |
| cr-visa | 1.000 | 2 × 2 inch (51 × 51mm) |
| hn-passport | 1.000 | 5 × 5cm |
| hn-visa | 1.000 | 5 × 5cm |
| cu-passport | 1.000 | 4.5 × 4.5cm |
| cu-visa | 1.000 | 4.5 × 4.5cm |
| do-passport | 1.000 | 2 × 2 inch (51 × 51mm) |
| do-visa | 1.000 | 2 × 2 inch (51 × 51mm) |
| ht-passport | 1.000 | 2 × 2 inch (51 × 51mm) |
| ht-visa | 1.000 | 2 × 2 inch (51 × 51mm) |
| bz-passport | 1.000 | 2 × 2 inch (51 × 51mm) |
| bz-visa | 1.000 | 2 × 2 inch (51 × 51mm) |
| tz-passport | 1.125 | 4 × 4.5cm |
| tz-visa | 1.125 | 4 × 4.5cm |
| ug-passport | 1.000 | 2 × 2 inch (51 × 51mm) |
| ug-visa | 1.000 | 2 × 2 inch (51 × 51mm) |
| rw-passport | 1.000 | 2 × 2 inch (51 × 51mm) |
| rw-visa | 1.000 | 2 × 2 inch (51 × 51mm) |
| mg-passport | 1.000 | 4 × 4cm |
| bb-passport | 1.000 | 5 × 5cm |
| bb-visa | 1.000 | 5 × 5cm |
| td-passport | 1.000 | 5 × 5cm |
| td-visa | 1.000 | 5 × 5cm |
| sl-passport | 1.000 | 5 × 5cm |
| dj-passport | 1.000 | 3.5 × 3.5cm |
| dj-visa | 1.000 | 3.5 × 3.5cm |
| bi-passport | 1.000 | 4.5 × 4.5cm |
| bi-visa | 1.000 | 4.5 × 4.5cm |
| mh-passport | 1.000 | 2 × 2 inch (51 × 51mm) |
| mh-visa | 1.000 | 2 × 2 inch (51 × 51mm) |
| pw-passport | 1.000 | 2 × 2 inch (51 × 51mm) |
| pw-visa | 1.000 | 2 × 2 inch (51 × 51mm) |

### B-2. 배경 부적합 (16건) — 보정 후

| 슬러그 | background | backgroundEn | 실제 판정 |
|--------|-----------|-------------|----------|
| eu-resume | 단색 | Solid color | 비흰색 정상 — "단색"은 색 불특정 |
| uk-passport | 크림 또는 연회색 | Cream or light grey | 비흰색 정상 — 영국 공식 규격 |
| uk-license | 밝은 회색 | Light gray | 비흰색 정상 |
| uk-visa | 밝은 회색 | Light gray | 비흰색 정상 |
| id-passport | 빨간색 | Red | 비흰색 정상 — 인도네시아 공식 규격 |
| ru-visa | 밝은 회색 | Light gray | 비흰색 정상 |
| fr-passport | 밝은 회색 | Light gray | 비흰색 정상 — 프랑스 공식 규격 |
| fr-visa | 밝은 회색 | Light gray | 비흰색 정상 |
| fi-passport | 밝은 회색 | Light gray | 비흰색 정상 |
| fi-visa | 밝은 회색 | Light gray | 비흰색 정상 |
| kw-passport | 파란색 | Blue | 비흰색 정상 — 쿠웨이트 공식 규격 |
| kw-visa | 파란색 | Blue | 비흰색 정상 |
| om-passport | 파란색 | Blue | 비흰색 정상 — 오만 공식 규격 |
| om-visa | 파란색 | Blue | 비흰색 정상 |
| au-passport | 밝은 회색 | Light gray | 비흰색 정상 — 호주 공식 규격 |
| de-resume | 밝은 배경 | Light background | 비흰색 정상 — 불특정 밝은색 |

### B-3. 보정 실시 (1건)

| 슬러그 | 변경 전 | 변경 후 | 사유 |
|--------|---------|---------|------|
| jp-halfcard | `白/単色` | `흰색/단색` | backgroundEn="White or solid color"로 확인. 일본어 '白' 표기가 엔진 패턴(`startsWith('흰')` or `/^white/i`)에 미매칭. 실제 흰색 규격이므로 한국어 표기로 통일 |

**보정 효과: V2 호환 360 → 361개**

### B-4. 사이즈 파싱 불가 (1건)

| 슬러그 | size | 사유 |
|--------|------|------|
| cn-resume | 1寸 · 2寸 복수 규격 | W×H 형식 아닌 복수 규격 표기. 현행 유지 타당 |

---

## C. URL 슬러그 유효성 (전수 428개)

| 검증 항목 | 결과 |
|-----------|------|
| 대문자 포함 | 0건 |
| 공백 포함 | 0건 |
| 허용 외 특수문자 | 0건 |
| 중복 슬러그 | 0건 |
| 비표준 패턴 (xx-type 형식 위반) | 0건 |

**결과: 전수 통과. 슬러그 유효성 문제 없음.**

---

## 종합 판정

| 항목 | 결과 |
|------|------|
| A. 필수 필드 | ✅ 전수 통과 |
| B. V2 호환 분류 | ✅ 361/428 호환, 1건 보정 완료 |
| C. 슬러그 유효성 | ✅ 전수 통과 |
| 데이터 보정 | jp-halfcard background 1건 |

**전면 배포 시 데이터 기인 페이지 깨짐 리스크: 없음.**

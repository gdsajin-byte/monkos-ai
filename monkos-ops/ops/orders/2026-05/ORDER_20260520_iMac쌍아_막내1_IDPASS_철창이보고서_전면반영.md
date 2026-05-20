---
type: order
date: 2026-05-20
from: iMac/쌍아
to: iMac/막내1
status: 대기
portfolio: PF_CROP
---

# 지시서: 철창이 1차 검증 보고서 기반 — countries.jsonl 전면 업데이트 + 구글 시트 갱신

> **[2026-05-20 19:19 KST] iMac/쌍아 → iMac/막내1**

## 배경

철창이(Claude Chat)가 200국 전수조사 데이터를 공식 소스 기반으로 교차검증한 1차 보고서가 도착했다. 82건 반영 대상. 이를 countries.jsonl + 구글 시트에 전면 반영한다.

## 사전 컨텍스트 파악 (착수 전 필수 Read)

1. **⭐ 철창이 보고서**: `~/Desktop/CROP APP/MONKOS_규격검증_1차_철창_20260520.md` — 전체 통독 필수
2. **PF_CROP README**: `monkos-ops/ops/portfolios/PF_CROP/README.md`
3. **countries.jsonl**: `apps/MonkosCrop/MonkosCrop/Resources/countries.jsonl` — 수정 대상
4. **SpecData.swift**: `apps/MonkosCrop/MonkosCrop/SpecData.swift` — DocSpec 구조 확인 (warning, std 등 필드)
5. **구글 시트**: `1xJevDKOWCCIjEGqamiaLSMaNi0tOrqN8BQpQ0pToCks`

## 작업 1: countries.jsonl 전면 업데이트

보고서 섹션별 반영:

### §1~§4: B→A / C→A 승격 (6건)
- 캐나다: std → "PPTC-203", 공식소스 URL 추가
- 멕시코: 신규 등록 (35×45, head 32-39, warning "국내+영사관 현장촬영 병행")
- 아르헨티나: 40×40mm 확정 (head ~28mm), std → "Decreto 261/2011"
- 브라질: 이미 반영됨 (warning + 비자 ICAO). std 보강
- 프랑스: 신규 등록. **⚠️ 배경색 흰색 금지!** → background 필드 또는 warning 명시
- 페루: 신규 등록. 현장촬영국 warning

### §5: 규격 오류 수정 (3건)
- 인도네시아: size 51×51 → **40×60**, 배경 **빨간색** (여권). 비자는 별도 (35×45, 흰색)
- 잠비아: 기존 데이터 수정 (38×50 → 35×45)
- 파키스탄: 배경색 "파란" → **흰색**으로 수정

### §8~§10: 유럽 + 아시아 + 오세아니아 신규 (~40건)
- EU 24국: 35×45mm ICAO 표준. **배경색 주의**: 오스트리아/스위스/덴마크=회색, 프랑스=흰색금지
- 러시아: 여권=흰색, 비자=회색. warning "광택종이 필수"
- 대만: A등급, std "BOCA"
- 필리핀: B등급, DFA 국내 현장촬영 warning
- 오세아니아 5국: ICAO 추정 B등급

### §14: 싱가포르 보강
- head 25-35mm (기존 32-36 → 수정), std "ICA", warning "3개월 유효"

### §15: 아프리카 (~27건)
- 대부분 35×45mm ICAO. 나이지리아: warning "600DPI, 사진 유효기간 2주"
- 상충 6건(에티오피아 등)은 기존값 유지 + 비고 주석

### §16: UAE 3종 분리
- ae-passport: 40×60mm
- ae-visa: 43×55mm
- ae-id: 35×45mm

### §19: C/X 해결 (4건)
- 아프가니스탄: 40×45mm 채택
- 그레나다: 38×51mm
- 미얀마 비자: 38×48mm
- 부룬디: 45×45mm

### §20: 추가검증 (태국 여권 신규, 베트남/파키스탄/네팔 보강)

## 작업 2: 공식 소스 URL 필드 추가

DocSpec에 `url` 필드가 없으면 countries.jsonl에 추가:
```json
{"id": "ca-passport", ..., "url": "https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-passports/photos.html"}
```

A등급 국가는 공식 URL 필수 반영. B등급은 참고 소스 URL.

## 작업 3: 구글 시트 업데이트

시트 ID `1xJevDKOWCCIjEGqamiaLSMaNi0tOrqN8BQpQ0pToCks`에:
- 등급 변경 반영
- 공식소스 URL 컬럼 추가/갱신
- 신규 국가 행 추가
- 오류 수정 반영

## 작업 4: 가이드 이미지 재생성

countries.jsonl 업데이트 후 고유 사이즈가 변경되었으면:
```bash
cd apps/MonkosCrop
swift build
.build/debug/MonkosCrop --export-guides \
  --input ~/Desktop/CROP\ APP/ref.jpg \
  --output ~/Desktop/CROP\ APP/guides/ \
  --specs MonkosCrop/Resources/countries.jsonl
```

새 사이즈(40×45 아프가니스탄, 38×51 그레나다, 43×55 UAE비자 등)가 추가되면 해당 가이드 이미지도 자동 생성됨.

## 작업 5: 빌드 확인

```bash
cd apps/MonkosCrop && swift build
```

## ⚠️ 준수 조항

- **PF_CROP README + 철창이 보고서 선행 참조 필수** (ch7 6조)
- countries.jsonl 기존 항목 삭제 금지 — 수정/추가만
- 상충 미해결 6건(에티오피아 등) + 3건(시리아 등)은 기존값 유지
- 배경색 비표준국(§11) 반드시 반영 — 프랑스 흰색 금지, 인도네시아 빨강 등
- 현장촬영국(§12) warning 필수 — 브라질/페루/멕시코/필리핀(국내)

## 완료 후 마감 절차

1. swift build 성공 확인
2. 가이드 이미지 재생성 (신규 사이즈 포함)
3. PF_CROP 히스토리 1행 어펜드
4. 세션 로그 어펜드
5. **커밋**: `[feat] IDPASS 철창이 1차 검증 82건 반영 — countries.jsonl 전면 업데이트`
6. **푸시**: `scripts/mk-push.sh`
7. COMPLETION 보고서 생성

## 산출물

1. countries.jsonl 전면 업데이트 (~82건)
2. 구글 시트 갱신
3. 가이드 이미지 재생성 (신규 사이즈 포함)
4. swift build 성공
5. 커밋 + 푸시
6. COMPLETION 보고서

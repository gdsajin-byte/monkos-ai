---
type: order
date: 2026-05-21
from: iMac/쌍아
to: iMac/막내
subject: "IDPASS 데이터 스키마 확장 + 철창이 3건 보고서 전면 반영"
status: 대기
portfolio: PF_CROP
---

# 지시서: IDPASS 데이터 스키마 확장 + 철창이 보고서 전면 반영

> **[2026-05-21 12:50 KST] iMac/쌍아 → iMac/막내**

## 배경

철창이 보고서 3건의 데이터를 DB에 반영한다.
현재 countries.jsonl 필드가 부족하여 **스키마 확장 → 데이터 반영 → seed 재생성**을 순차 진행한다.

- 정본: `apps/MonkosCrop/MonkosCrop/Resources/countries.jsonl`
- D1은 jsonl에서 파생 (정본 단일 원칙, 헌법 3조 4항)

## ⚠️ 준수 조항

- **헌법 3조 4항**: 정본은 jsonl 1곳. D1은 seed 스크립트로 파생만.
- **헌법 4조 2항**: 파괴적 명령 금지.
- **ch7 6조**: 막힘 발생 시 PF_CROP 선행 참조.

## 철창이 보고서 위치 (3건)

| # | 파일 | 용량 | 핵심 |
|---|------|------|------|
| 1 | `~/Desktop/CROP APP/철창이 조사/MONKOS_규격검증_1차_철창_20260520.md` | 63KB | 등급 승격 + 누락국 추가 + 오류 수정 + C/X 해결 |
| 2 | `~/Desktop/CROP APP/철창이 조사/MONKOS_문서유형별규격_v3_철창_20260520.md` | 35KB | 문서유형 확장 (한국 10종, 일본 6종, 미국 등) + 거부사유 + 아동규정 |
| 3 | `~/Desktop/CROP APP/철창이 조사/MONKOS_eVisa_디지털규격_v2_철창_20260520.md` | 23KB | e-Visa 디지털 규격 (px/KB/포맷) 19국 + 파일크기 함정 |

---

## Phase 1: jsonl 스키마 확장

### 현재 doc 필드

```json
{"id", "type", "ko", "en", "ja", "size", "px", "head", "std", "warning"}
```

### 추가할 doc 필드

```json
{
  "grade": "A",              // 신뢰등급 A/B/C/X (철창이 검증 기반)
  "bg": "white",             // 배경색 기본값 (white/gray/blue/red/light-gray)
  "bgNote": {...},           // 배경 특이사항 (다국어, 기존 warning과 별개)
  "source": "...",           // 공식 소스 URL
  "sourceName": "...",       // 소스명 (mofa.go.kr 등)
  "onsite": true,            // 현장촬영국 플래그
  "digitalOnly": true,       // 디지털전용국 플래그
  "maxKB": 240,              // 파일크기 상한 (KB)
  "minKB": 10,               // 파일크기 하한 (KB)
  "pxRange": "600-1200",     // 디지털 px 범위 (기존 px은 권장값 유지)
  "format": "JPEG",          // 허용 포맷
  "dpi": 600,                // 필요 시만 (나이지리아 등)
  "validity": "2w",          // 사진 유효기간 (2w/1m/3m/6m)
  "faceTarget": 34,          // 얼굴 타겟 (CropEngine 연동용, 기존 head 보완)
  "childNote": {...}         // 아동 특별규정 (다국어, 필요 시만)
}
```

### 규칙

- 값이 없는 필드는 **생략** (null/빈문자열 금지 — jsonl 용량 최소화)
- `grade` 미부여 국가는 필드 생략 (앱에서 미표시)
- `bg` 미지정이면 앱 기본값 white
- `warning`은 기존 유지 (사용자 안내용), `bgNote`는 배경색 전용 특이사항
- `onsite`, `digitalOnly`는 true일 때만 추가

---

## Phase 2: 1차 보고서 미반영분 반영 (§14~§20)

### 2-1. 등급 부여 (전체)

어제 반영된 145국 docs 178건 + 신규분에 `grade` 일괄 부여:

- 1차 보고서 §1~§4에서 **A등급 확정**: 캐나다, 멕시코, 아르헨티나, 브라질, 프랑스, 페루, 한국, 일본, 대만, 싱가포르 (10국)
- 1차 보고서 §8~§15에서 **B등급**: EU 24국, 러시아, 우크라이나, 아시아 7국, 아프리카 26국, 오세아니아 5국
- 기존 데이터 중 등급 미언급: `grade` 생략 유지
- C/X등급 §19: 아프간(C), 그레나다(C), 시리아(X), 미얀마비자(C), 부룬디(C), 기니(C), 적도기니(C)

### 2-2. 배경색 비표준 14국 (§11)

| 국가 | bg 값 | bgNote |
|------|-------|--------|
| 프랑스 | `light-gray` | 흰색 금지 |
| 그리스 | `gray` | RGB(190,190,190)±10 |
| 오스트리아 | `gray` | |
| 스위스 | `gray` | |
| 덴마크 | `gray` | |
| 핀란드 | `light-gray` | 권장 |
| 카자흐스탄 | `gray` | 권장 |
| 러시아(비자) | `light-gray` | 여권=white, 비자만 |
| 쿠웨이트 | `blue` | |
| 오만 | `blue` | |
| 팔레스타인 | `blue` | |
| 인도네시아(여권) | `red` | |
| 자메이카 | `varies` | 피부색별 분기 |

### 2-3. 현장촬영·디지털전용 플래그 (§12)

| 국가 | 플래그 |
|------|--------|
| 브라질 | `"onsite": true` |
| 페루 | `"onsite": true` |
| 멕시코 | `"onsite": true` |
| 필리핀 | `"onsite": true` (국내 DFA만) |
| 독일 | `"digitalOnly": true` |
| 핀란드 | `"digitalOnly": true` |

### 2-4. 공식 소스 URL (A등급 국가)

1차 보고서에 명시된 공식 URL을 `source` + `sourceName` 필드로 추가.

### 2-5. C/X등급 최종 해결 7건 (§19)

아프가니스탄 40×45, 그레나다 38×51, 시리아 X유지(40×60 유력 주석), 미얀마비자 38×48, 부룬디 45×45, 기니 C유지, 적도기니 C유지.

### 2-6. 추가검증 4건 (§20)

태국 여권 35×45 신규, 베트남 B유지, 파키스탄 배경 흰색 수정, 네팔 B.

---

## Phase 3: 2차 보고서 — 문서유형 확장

`MONKOS_문서유형별규격_v3_철창_20260520.md` 기반:

### 3-1. 한국 문서유형 추가 (5종 신규)

현재 kr: passport, visa, id, resume, license (5종)
추가: 국제운전면허, 수능원서, 청소년증, 택시자격증, 수상레저면허

### 3-2. 일본 문서유형 추가 (4종 신규)

현재 jp: visa만 존재
추가: passport(A등급), マイナンバー, 運転免許(24×30), 履歴書(30×40), 在留カード(30×40)

### 3-3. 기타 주요국 문서유형

보고서 §8~§9에 있는 미국(Green Card, SSN, 주별 면허) 등은 데이터 양이 크므로 **한국·일본만 이번에 반영**. 나머지는 후속.

---

## Phase 4: 3차 보고서 — e-Visa 디지털 규격

`MONKOS_eVisa_디지털규격_v2_철창_20260520.md` 기반:

### 4-1. Tier 1 국가 디지털 규격 (4국)

| 국가 | pxRange | maxKB | minKB | format |
|------|---------|-------|-------|--------|
| 인도 e-Visa | 350-1000 | 1024 | 10 | JPEG |
| 인도 BLS/VFS | 350-1000 | 300 | 10 | JPEG |
| 미국 DS-160 | 600-1200 | 240 | — | JPEG |
| 싱가포르 | 400-514 | 60 | — | JPEG |

### 4-2. Tier 2 국가 (11국)

터키, 호주, 사우디, UAE, 캄보디아, 베트남, 케냐, 스리랑카, 조지아, 아제르바이잔, 러시아 — 보고서 수치 그대로.

### 4-3. 포털 분기 처리

인도처럼 **같은 나라인데 포털별 규격이 다른 경우**:
- doc id를 분리: `in-visa-evisa` / `in-visa-bls`
- type은 동일 `visa`, 별도 doc으로 취급

### 4-4. 파키스탄 디지털 (§20 + eVisa 보고서 교차)

NADRA: 350×467px, 60KB 이하.

---

## Phase 5: seed.sql 재생성 + 빌드 확인

### 5-1. seed 생성 스크립트 보강

`scripts/d1-migration/generate-seed.js` (또는 기존 스크립트)를 수정하여:
- jsonl 신규 필드 → D1 기존 컬럼 매핑
  - `grade` → `reliability_grade`
  - `bg` → `background`
  - `bgNote` → `background_detail_*`
  - `source` → `official_source_url`
  - `sourceName` → `official_source_name`
  - `maxKB`/`minKB`/`format` → `file_spec` (JSON 문자열)
  - `onsite`/`digitalOnly` → `special_notes_*`
  - `validity` → `validity`
  - `dpi` → `dpi`

### 5-2. D1 스키마 ALTER (최소)

```sql
ALTER TABLE documents ADD COLUMN max_kb INTEGER;
ALTER TABLE documents ADD COLUMN min_kb INTEGER;
ALTER TABLE documents ADD COLUMN digital_px_range TEXT;
ALTER TABLE documents ADD COLUMN format TEXT DEFAULT 'JPEG';
ALTER TABLE documents ADD COLUMN is_onsite INTEGER DEFAULT 0;
ALTER TABLE documents ADD COLUMN is_digital_only INTEGER DEFAULT 0;
```

### 5-3. seed.sql 재생성

```bash
node scripts/d1-migration/generate-seed.js
```

### 5-4. 빌드 확인

```bash
cd apps/MonkosCrop && swift build
```

---

## 완료 기준

1. countries.jsonl 통계 출력:
   - 총 국가, docs 보유 국가, 총 문서 수
   - grade별 분포 (A/B/C/X/미부여)
   - bg 비표준 국가 수
   - 디지털 규격 보유 국가 수
2. `swift build` 성공
3. seed.sql 재생성 완료
4. PF_CROP 히스토리 1행 어펜드
5. 커밋: `[feat] IDPASS 데이터 스키마 확장 — 철창이 3건 보고서 반영, grade/bg/디지털규격 추가`

## 예상 변경 규모

| 항목 | 변경 전 | 변경 후 (예상) |
|------|---------|--------------|
| jsonl doc 필드 | 10개 | ~20개 (필요 시만) |
| docs 보유 국가 | 145국 | ~155국 |
| 총 문서 수 | 178건 | ~210건 |
| A등급 | 0건 | ~10건 |
| B등급 | 0건 | ~160건 |
| 디지털 규격 보유 | 0건 | ~19건 |
| D1 seed INSERT | 422 | ~480 |

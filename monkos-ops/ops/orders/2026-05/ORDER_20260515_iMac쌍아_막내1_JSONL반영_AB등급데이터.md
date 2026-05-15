---
type: order
date: 2026-05-15
from: iMac/쌍아
to: iMac/막내1
status: 대기
portfolio: ~
---

# 지시서: countries.jsonl A+B 등급 데이터 반영

## 목적

2차 검수에서 A/B 등급으로 확인된 비표준 규격 데이터를 `apps/MonkosCrop/MonkosCrop/Resources/countries.jsonl`에 반영한다.

## 입력 자료

아래 4개 2차 검수 보고서의 A/B 등급 항목만 반영 대상:

- `monkos-ops/ops/reports/2026-05/REPORT_20260515_막내1_증명사진규격_2차검수_아시아오세아니아.md`
- `monkos-ops/ops/reports/2026-05/REPORT_20260515_막내2_증명사진규격_2차검수_유럽.md`
- `monkos-ops/ops/reports/2026-05/REPORT_20260515_막내3_증명사진규격_2차검수_아메리카중동.md`
- `monkos-ops/ops/reports/2026-05/REPORT_20260515_막내4_증명사진규격_2차검수_아프리카.md`

**C/X 등급은 절대 반영하지 않는다.**

## 작업 내용

### 1. 신규 국가 추가 (3건)

JSONL 맨 끝에 아래 3국을 추가:
- `ck` (쿡 제도, Cook Islands, クック諸島) — continent: oceania, docs: []
- `nu` (니우에, Niue, ニウエ) — continent: oceania, docs: []
- `st` (상투메프린시페, São Tomé and Príncipe, サントメ・プリンシペ) — continent: africa, docs: []

### 2. 기존 커스텀 국가 수정

보고서에서 기존 docs 필드의 수정이 필요한 항목:

- **인도(in) 여권**: size `51x51` → `35x45`, px `600x600` → `413x531`, head `36-41` → 제거(ICAO 기본), std `ICAO (2025.9~)` → `ICAO 9303 (2025.9~)` (2025.9 규격 변경 반영)
- **인도(in) 비자**: 유지 (51x51 그대로 — 비자는 여전히 51×51)
- **중국(cn) 비자**: head `15-22` → `28-33` (기존 값은 얼굴 너비였음. 높이로 정정)

### 3. 비표준 국가 docs 추가

현재 `"docs":[]` (ICAO 기본 35×45 자동 적용)인 국가 중, 2차 검수에서 A/B 등급으로 실제 규격이 다른 것으로 확인된 국가의 docs를 추가한다.

#### JSONL docs 항목 형식
```json
{"id":"xx-passport","type":"passport","ko":"여권","en":"Passport","ja":"パスポート","size":"WxH","px":"WxH","head":"min-max","std":"표준명"}
```

- px는 300dpi 기준 계산: `round(W_mm / 25.4 * 300) x round(H_mm / 25.4 * 300)`
- head가 없으면 빈 문자열
- 비자가 여권과 다른 규격인 경우 별도 비자 항목 추가

#### 대륙별 반영 대상 (보고서에서 추출)

**아시아+오세아니아:**
| id | 여권 | 비자 (다른 경우) |
|----|------|-----------------|
| hk | 40x50 | — |
| vn | 40x60 | — |
| id | 51x51, head 25-31 | 35x45 (흰배경) |
| my | 35x50, head 25-30 | — |
| kh | 40x60, head 36+ | — |
| la | 40x60 | — |
| bn | 40x52, head 35 | — |
| bd | 45x55, head 34 | — |
| kg | 40x60 | 35x45 |
| tm | 30x40, head 30 | 50x60 |
| au | 35x45 (유지, 특이점만) | — |
| mh | 51x51 | — |
| pw | 51x51 | — |

**유럽:**
| id | 여권 | 비자 (다른 경우) |
|----|------|-----------------|
| gr | 40x60 | 35x45 |
| tr | 50x60, head 34+ | — |
| fi | 36x47, head 32-36 | — |
| ee | 40x50 | 35x45 |
| lt | 40x60, head 33 | 35x45 |
| rs | 50x50 | 35x45 |
| mk | 50x50 | 35x45 |
| al | 40x50 | 36x47 |
| by | 40x50, head 32-35 | 35x45 |
| cy | 40x50 | 35x45 |
| az | 30x40 | — |

**아메리카+중동:**
| id | 여권 | 비자 (다른 경우) |
|----|------|-----------------|
| bz | 51x51, head 35-41 | — |
| co | 40x50, head 27+ | 30x40 |
| dm | 38x45 | — |
| jm | 35x45, head 25-35 (배경: 피부색별) | — |
| br | 50x70, head 42 | — |
| ar | 40x40, head 28 | — |
| cl | 45x45, head 27 | — |
| ve | 51x51, head 34-38 | — |
| ec | 50x50, head 25-35 | — |
| bo | 40x50, head 34 | — |
| cr | 51x51, head 31-36 | — |
| ni | 40x50, head 34 | — |
| hn | 50x50, head 25-35 | — |
| cu | 45x45, head 27 | — |
| do | 51x51, head 25-35 | — |
| ht | 51x51, head 25-35 | — |
| tt | 31x41, head 29-33 | — |
| bb | 50x50, head 30-40 | — |
| lc | 40x50, head 25-35 | — |
| kw | 40x50, head 38 | — |
| bh | 40x60, head 38 | — |
| ye | 40x60, head 32-36 | — |
| sa | 40x60, head 38 | — |
| qa | 38x48, head 34 | — |
| om | 40x60, head 38 | — |
| ir | 30x40, head 28 | — |

**아프리카:**
| id | 여권 | 비자 (다른 경우) |
|----|------|-----------------|
| eg | 40x60, head 38-40 | — |
| ly | 40x60, head 38 | — |
| sd | 40x50, head 34 | — |
| cm | 40x50, head 31-36 | — |
| td | 50x50, head 34-35 | — |
| sl | 50x50, head 30-35 | 35x45 (회색배경) |
| tz | 40x45, head 34 | — |
| et | 30x40, head 30 | — |
| ug | 51x51, head 25-35 | — |
| rw | 51x51 | — |
| dj | 35x35 | — |
| bw | 30x40, head 30 | — |
| na | 37x52, head 36 | — |
| mg | 40x40, head 25-32 | 35x45 |

### 4. 검증

반영 완료 후:
1. `python3 -c` 로 JSONL 전 행 JSON 유효성 검사
2. 중복 id 없는지 확인
3. `wc -l`로 총 국가 수 보고 (기존 200 + 신규 3 = 203 예상)
4. `swift build` 실행하여 빌드 성공 확인

## 산출물

- 수정된 `apps/MonkosCrop/MonkosCrop/Resources/countries.jsonl`
- `monkos-ops/ops/reports/2026-05/COMPLETION_20260515_막내1_JSONL반영.md`

## ⚠️ 준수 조항

- C/X 등급 데이터 반영 금지
- 기존 JSONL 행 삭제 금지 (추가·수정만)
- 기존 커스텀 국가(kr, jp, us, eu, uk, cn, ca, sg) 중 보고서에 수정 지시 없는 필드는 건드리지 않음
- 완료 후 COMPLETION 보고

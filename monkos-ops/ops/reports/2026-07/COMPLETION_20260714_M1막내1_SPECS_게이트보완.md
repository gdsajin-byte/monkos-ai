---
type: completion
date: 2026-07-14
device: M1
agent: 막내1
status: 완료
portfolio: PF_SPECS
parent_order: ORDER_20260714_M1민아_막내1_SPECS_게이트보완_5항.md
---

# SPECS 게이트 보완 5항 — 완료 보고

**[2026-07-14 16:04 KST]** M1/막내1 → 작가님, M1/민아

## 보완 1 ✅ us-visa head_height 오환산 정정

- `specs-data.json` us-visa: `headHeight "2.2~3.5cm"` → `"2.5~3.5cm"`, `headHeightMin 22` → `25`
- `RESEARCH_SPECS_OFFICIAL_20260714/us-visa.json`: `head_height "22-35mm"` → `"25-35mm"`
- 검산: 1 inch = 25.4mm → MIN 25mm ✓ / 50% × 51mm = 25.5mm → MIN 25mm ✓
- db_conflict 첫 건으로 기록 (확인-편향 사례)

## 보완 2 ✅ 수치 전수 기계 검산

- 검산 스크립트: `RESEARCH_SPECS_OFFICIAL_20260714/verify_numeric.py` (재실행 가능)
- 검산 결과: 100슬러그 중 **13건 이상** (us-visa 파싱 결함 해소 후)

| 유형 | 건수 | 내용 |
|------|------|------|
| inch↔mm 환산 오류 | 0 | us-visa 정정 후 전 통과 |
| %병기 불일치 (>1.5mm) | 6건 | ch-passport, ee-passport, in-visa-bls, lt-passport, no-passport, no-visa |
| DB vs 리서치 불일치 | 7건 | cn-visa, dk-passport/visa, in-passport, kr-visa, nl-passport/visa |

- %병기 6건: 리서치 에이전트의 % 계산 또는 프레임 높이 참조 오류 추정. DB 유지(DB가 정본 가능성 높음), 플래그만 기록.
- DB 불일치 7건: 리서치와 DB 모두 미확정 — 공식 출처 재확인 후 판정 필요. 성급한 DB 변경 금지.

### %병기 대조표 (34건 중 발췌)

| slug | frame(mm) | %계산 | mm표기 | 판정 |
|------|-----------|-------|--------|------|
| ch-passport | 45.0 | 31.5-36.0mm | 29.0-34.0mm | ❌ |
| ee-passport | 50.0 | 35.0-40.0mm | 32.0-36.0mm | ❌ |
| lt-passport | 60.0 | 42.0-48.0mm | 31.0-35.0mm | ❌ |
| in-visa-bls | 51.0 | 40.8-43.4mm | 36.0-41.0mm | ❌ |
| no-passport | 45.0 | 33.8-36.0mm | 32.0-36.0mm | ❌ (1.8mm, 경계) |
| us-visa | 51.0 | 25.5-35.2mm | 25.0-35.0mm | ✅ |
| my-passport | 50.0 | 25.0-30.0mm | 25.0-30.0mm | ✅ |

## 보완 3 ✅ 출처 없는 verified + 구조 모순

- 출처 빈값 verified: **실측 1건** (민아 지시 12건 → 실제 1건. 리서치 에이전트가 대부분 출처 동반 반환)
- kr-resume `size`: verified에서 value 비움 + unverified 유지 (공식 규격 문서 부재, 3×4cm 통용 관례로 DB 유지)
- 구조 모순(verified/unverified 동시 등재) 해소 완료

## 보완 4 ⏳ 2차 편입 목록 확정

2차 리서치 대상 확정 (미착수 — 1차 재검 통과 후):
- **us-passport** (최우선 — GSC 침해 당사자)
- eu-passport, jp-halfcard, cn-resume (배경 공식 확인 대상)
- uk-passport, au-passport (v1→infoOnly 전환용)

## 보완 5 ✅ restrictions 렌더 언어 조건 (🔴 prod 차단 해소)

- 변경: `render-specs.js` restrictions 텍스트 추출 `r[lang] || r.en || r.ko` → `r[lang]`
- 효과: en만 채워진 restrictions는 en 페이지에서만 노출, ko/ja 페이지에서 영어 본문 미노출
- dev 실측 (rev 00120):
  - kr-passport ko: restrictions 미노출 ✅
  - kr-passport en: restrictions 노출 ✅ (Clothing·Expression·Glasses·Ears·Face·Headwear·Accessories)
  - kr-passport ja: restrictions 미노출 ✅
  - us-visa ko: restrictions 미노출 ✅
  - us-visa en: restrictions 노출 ✅

## 변경 파일

| 파일 | 변경 |
|------|------|
| `specs-data.json` | us-visa headHeight 2.2→2.5cm 정정, fileSpec 보강 |
| `render-specs.js` | restrictions 언어 조건 `r[lang]` (폴백 제거) |
| `RESEARCH_SPECS_OFFICIAL_20260714/us-visa.json` | head_height 22→25mm 정정 |
| `RESEARCH_SPECS_OFFICIAL_20260714/kr-resume.json` | size verified→unverified 강등 |
| `RESEARCH_SPECS_OFFICIAL_20260714/verify_numeric.py` | 수치 검산 스크립트 (신설) |

## 배포

- dev: `monkos-portal-dev-00120-jh8`

## 검증 요약

- [x] jest 103/103 통과
- [x] 보완 1: us-visa headHeight 정정 + 검산 일치
- [x] 보완 2: verify_numeric.py 전수 실행, 13건 플래그
- [x] 보완 3: kr-resume 구조 모순 해소
- [x] 보완 4: 2차 편입 목록 확정
- [x] 보완 5: ko/ja 영어 미노출 + en 정상 노출 dev 실측
- [ ] 민아 재검(검산 재실행) → 작가님 도메인 검수 → prod

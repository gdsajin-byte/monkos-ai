---
type: completion
date: 2026-07-15
device: M1
agent: 막내1
portfolio: PF_SPECS
status: 완료
---

# COMPLETION: SPECS 헤드텀 잔여 결함 일괄 수정

**[2026-07-15 07:52 KST]** M1/막내1 → 작가님

---

## 결과

### §3-1 데이터 정정 (before/after)

| slug | 필드 | before | after |
|------|------|--------|-------|
| us-passport | type | `여권·비자` | `여권` |
| us-passport | typeEn | `Passport / Visa` | `Passport` |
| us-passport | typeJa | `パスポート・ビザ` | `パスポート` |
| cn-resume | type | `简历照片` | `이력서` |
| kr-halfcard | countryEn | `Korea` | `South Korea` |
| usa-headshot | headHeight | `-` | (빈문자열) |
| eu-resume | headHeight | `-` | (빈문자열) |
| de-resume | headHeight | `-` | (빈문자열) |
| cn-resume | headHeight | `-` | (빈문자열) |

### §3-2 템플릿 수정

✅ (a) en title: `| MONKOS` 접미사 제거 + 1단위 사이즈(inch 포함 시 inch만, 그 외 metric만) → 417/428 60자 이내
✅ (b) Photo Photo 0건 / 写真写真 0건 (typeEn/Ja가 Photo/写真으로 끝나면 중복 부착 방지)
✅ (c) desc: background 중복 방지 + en United States→US 통일
✅ (d) ko 60자 초과 0건 / ja 60자 초과 0건 (초과 시 ·배경·복장 생략 폴백)

### §3-3 렌더러 필터

✅ PropertyValue `.filter()` 에 `&& String(p.value).trim() !== '-'` 조건 추가 (2곳)

### §3-4 diff 게이트

✅ 화이트리스트 외 필드 변경 **0건** — seoTitle/seoDescription + 데이터 정정 필드만 변경 확인

### §3-5 검산

✅ Photo Photo / 写真写真 잔존 0건
✅ en 60자 초과 11건 (극장국명 — 잔존 허용)
✅ ko 60자 초과 0건 / ja 60자 초과 0건
✅ us-passport en/ja title에 Visa/ビザ 부재
✅ cn-resume ko title/desc에 간체자 부재
✅ kr-halfcard en에 South Korea 확인

### §3-6 배포 + 라이브 검증

✅ dev rev 00125 → prod rev **00476** 배포
✅ 결함 수정 대상 6URL 정상: us-passport(en/ja), cn-resume(ko/en), usa-headshot(en), kr-halfcard(en)
✅ 기존 무결 표본 3URL 무손상: kr-passport(ko), us-visa(en), jp-passport(ja) — title·FAQ·restrictions 보존

### en 60자 초과 잔존 (극장국명, 11건)

kr-resume(61), kr-intl-license(71), kr-exam(64), kr-marine(65), ba-passport(62), kn-passport(61), vc-passport(72), vc-visa(68), cg-passport(61), cf-passport(64), st-passport(61)

## 변경 파일

| 파일 | 변경 |
|------|------|
| `monkos_AI/portal/lib/cms/specs-data.json` | §3-1 데이터 정정 + 재생성 결과 반영 (428슬러그) |
| `monkos_AI/portal/tools/seo-headterm-regen.mjs` | §3-2 템플릿 수정 (a~d) |
| `monkos_AI/portal/lib/cms/render-specs.js` | §3-3 PropertyValue `-` 필터 (2곳) |
| `monkos-ops/ops/portfolios/PF_SPECS/README.md` | 히스토리 2행 추가 |

## 추가 발견

- us-passport `type`(ko) `'여권·비자'` → `'여권'` 추가 정정. 재생성 시 ko title에 "비자" 재혼입 방지 필요 (카니발리제이션 해소 목적과 동일).

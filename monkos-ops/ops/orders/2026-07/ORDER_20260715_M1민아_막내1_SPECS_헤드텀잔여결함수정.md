---
type: order
date: 2026-07-15
from: M1/민아
to: M1/막내1
subject: SPECS 헤드텀 잔여 결함 일괄 수정 — 막내3 전수검수(7/14) 후속, en title 축소 포함
status: 대기
portfolio: PF_SPECS
---

# 지시서: SPECS 헤드텀 잔여 결함 일괄 수정

**[2026-07-15 07:30 KST]** M1/민아 → M1/막내1

---

## 1. 배경

7/14 막내3 전수검수(`REPORT_20260714_M1막내3_SPECS_헤드텀구조화데이터_전수검수.md`)가 seoTitle·Description 결함 13건 + en title 길이 구조 문제를 적발했다. 이 중 P0 2건(uk-passport·de-resume "Europe" 오표기)은 기수정 반영 확인(7/15 민아 실측). **잔여 결함 전량을 본 지시서로 일괄 해소한다.**

수정 원천은 두 곳이다:
1. **원천 데이터** `monkos_AI/portal/lib/cms/specs-data.json` — type/countryEn 등 필드 오류
2. **재생성 스크립트** `monkos_AI/portal/tools/seo-headterm-regen.mjs` — 템플릿 결함(45~47행). 7/13 배포분의 정본 생성기이므로 **이 스크립트를 수정 후 재실행**하는 방식으로 고친다. 개별 slug 수작업 편집 금지(재발 방지 + 차기 재생성 시 동일 품질 보장).

## 2. 산출물

| 파일 | 역할 |
|------|------|
| `monkos_AI/portal/tools/seo-headterm-regen.mjs` | 템플릿 수정 (en 축소·이중표기 방지·desc 중복 방지) |
| `monkos_AI/portal/lib/cms/specs-data.json` | 필드 정정(§3-1) + 재생성 결과 반영 |
| `monkos_AI/portal/lib/cms/render-specs.js` | PropertyValue `"-"` 필터 1줄 |
| `monkos-ops/ops/reports/2026-07/COMPLETION_20260715_M1막내1_SPECS_헤드텀잔여수정.md` | 완료 보고 (diff 요약표 포함) |

## 3. 상세 설계

### 3-1. 원천 데이터 정정 (specs-data.json, 4슬러그)

| slug | 필드 | 현행 | 수정 | 근거 |
|------|------|------|------|------|
| `us-passport` | `typeEn` | Passport / Visa (추정 — 실측 후 확정) | `Passport` | us-visa와 카니발리제이션 🔴 P0 |
| `us-passport` | `typeJa` | パスポート・ビザ (추정 — 실측 후 확정) | `パスポート` | 동일 (ja title에 ビザ 혼입 실측됨) |
| `cn-resume` | `type` (ko) | 중국어 오염 여부 실측 (title에 "简历照片" 노출 중) | `이력서` | ko title/desc 중국어 혼입 🟡 |
| `kr-halfcard` | `countryEn` | Korea | `South Korea` | 타 kr-* 슬러그와 통일 🟢 |
| `usa-headshot`·`eu-resume`·`de-resume`·`cn-resume` | `headHeight` | `"-"` | `""` (빈 문자열) | PropertyValue 빈 의미 방출 🟢 |

> ⚠️ 수정 전 각 필드 현행값을 실측(Read)하고 COMPLETION에 before/after 기재. "추정" 표기 항목은 실측값이 다르면 실측 기준으로 판단하되, 목적(카니발리제이션 해소)은 유지.

### 3-2. 재생성 스크립트 템플릿 수정 (seo-headterm-regen.mjs)

**원본 스크립트를 그대로 재사용하고 아래 지점만 수정한다. 구조 재작성 금지.**

**(a) en title 축소 — 60자 이내 (현행 420/428 초과 🔴)**
- 46행 en 템플릿에서 ` | MONKOS` 접미사 제거 (ko·ja는 유지)
- `{sizeEn}` → **1단위만**: inch 우선 국가(us·lr·mm 문서권, 스크립트 내 기존 분기 활용)는 inch만, 그 외 metric만. 괄호 병기 제거. 예: `2 × 2 inch (51 × 51mm)` → `2×2 inch`
- 그래도 60자 초과 시(장국명): 치수 세그먼트 생략 → `{Country} {Doc} Photo Size & Requirements 2026`. 그마저 초과하는 극장국명은 잔존 허용하되 **목록 보고**
- `Photo Size & Requirements {YEAR}` 코어는 절대 보존 (실검색어 + 신선도 시그널)

**(b) "Photo Photo" / "写真写真" 이중 표기 방지 (7건 🟡)**
- typeEn이 `Photo`로 끝나면 (Resume Photo, Headshot / Profile Photo, Half-size Photo 등) `Photo`를 중복 부착하지 않는 조건 추가
- ja 동형: typeJa가 `写真`으로 끝나면 `写真` 중복 부착 금지
- 해당 슬러그: usa-headshot·eu-resume·jp-resume·kr-halfcard·jp-halfcard·cn-resume(en), de-resume·cn-resume(ja)

**(c) description 중복·통일 (🟢)**
- background 필드값이 이미 `배경`/`background`/`背景`으로 끝나면 해당 단어 중복 부착 금지 (de-resume "배경 배경" 계열 해소)
- en description의 `United States` → `US` (title과 검색어 통일 — 스크립트 21행 축약 맵의 desc 예외를 제거)

**(d) ko·ja 60자 초과 4건 개별 해소**
- `usa-headshot`(ko 64) · `kn-passport`(ja 63) · `vc-passport`(ja 64) · `vc-visa`(ja 61)
- 치수 표기 공백 축약(`3.5 × 4.5cm` → `3.5×4.5cm`) 등으로 60 이내 조정. 검색어 선두부(규격·규정 2026 / サイズ・規格 2026) 보존. `| MONKOS` 유지

### 3-3. 렌더러 필터 (render-specs.js, 1줄)

- PropertyValue 필터 `.filter(p => p.value && String(p.value).trim())`에 `&& String(p.value).trim() !== '-'` 조건 추가 (데이터 정규화와 이중 방어)

### 3-4. 재생성 실행 + diff 게이트 (필수 — 7/14 적재기 사고 교훈)

1. 재생성 실행 전 `specs-data.json` 백업 사본 확보 (git 스테이지 기준으로도 가능)
2. 스크립트 실행 후 **전수 diff 검토**. 허용 변경 화이트리스트:
   - en title: 전 428 (접미사·치수 축소) — 단 형식 변화만
   - ko title: `cn-resume`·`usa-headshot` 2건만
   - ja title: `us-passport`·`de-resume`·`cn-resume`·`kn-passport`·`vc-passport`·`vc-visa` 6건만
   - description: us-* 계열 en(United States→US)·background 중복 해당 슬러그·cn-resume 3언어 — 실측 목록 보고
   - **faqs·restrictions·validity·fileSpec 등 타 필드: diff 0건** (스크립트가 seoTitle/Description 외를 건드리지 않음을 diff로 입증)
3. 화이트리스트 외 diff 발견 시: **작업 중단 → 보고** (무단 진행 금지)

### 3-5. 검산 스크립트 (node 원라이너 가능)

- `Photo Photo`·`写真写真` 잔존 0건
- en title 60자 초과 0건 (극장국명 예외 시 목록)
- ko·ja title 60자 초과 0건
- us-passport en/ja title에 `Visa`/`ビザ` 부재
- cn-resume ko title/desc에 简体 한자 부재 (규격 단위 `寸`은 허용)
- kr-halfcard en에 `South Korea`

### 3-6. 배포 + 라이브 검증

1. `./deploy.sh dev` → 라이브 표본 6URL 확인: `/en/specs/passport/us`·`/ja/specs/passport/us`·`/specs/resume/cn`·`/en/specs/resume/cn`·`/en/specs/headshot/usa`·`/en/specs/halfcard/kr` — title·meta description·JSON-LD(PropertyValue에 `-` 부재)
2. **기존 무결 표본**: `/specs/passport/kr`(ko)·`/en/specs/visa/us`·`/ja/specs/passport/jp` — 변경 의도 없는 페이지의 title·FAQ·restrictions 무손상 확인
3. 통과 시 `./deploy.sh prod` → 동일 표본 재검증

## 4. ⚠️ 준수 조항

- **헌법 4조 1항**: API 키·비밀정보 절대 생성/추측 금지
- **헌법 3조 1항**: 타임스탬프는 매 턴 `date` 명령 취득 (추정 금지)
- **헌법 3조 2항**: 완료 보고 필수 — COMPLETION 파일 생성 없이는 미완료 간주 (ch7)
- **ch5 2조**: 배포는 `./deploy.sh {env}` 경유만. `gcloud run deploy` 직접 실행 금지
- **ch4 9조**: PF_SPECS 히스토리 1행 어펜드
- **코드 재사용 원칙 (7/7 작가님)**: `seo-headterm-regen.mjs` 원본 구조 보존, 지정 지점만 수정. 재해석 재작성 금지
- 지시서 범위 밖 작업 금지 (validity/fileSpec ko·ja 번역은 **별도 트랙** — 본 건에 포함하지 말 것)

## 5. 완료 기준

- [ ] §3-1 데이터 정정 5항 (before/after 기재)
- [ ] §3-2 템플릿 수정 4항 (a~d)
- [ ] §3-3 렌더러 필터 1줄
- [ ] §3-4 diff 게이트 통과 (화이트리스트 외 0건)
- [ ] §3-5 검산 전항 통과
- [ ] §3-6 dev→prod 배포 + 라이브 표본 9URL 전항 통과 (rev 기재)
- [ ] COMPLETION 보고서 + 세션 로그 + PF_SPECS 히스토리 + 커밋·푸시

## 6. 커밋 메시지

```
[fix] SPECS 헤드텀 잔여 결함 일괄 수정 — en title 60자 축소·이중표기·카니발리제이션 해소 (막내3 검수 후속)
```

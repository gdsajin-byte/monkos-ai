---
type: completion
date: 2026-11-05
device: iMac
agent: 쌍아-막내8
status: 마감
portfolio: PF_SPECS
order: monkos-ops/ops/orders/2026-11/ORDER_20261105_iMac쌍아_막내8_SPECS_검색제목_셀카무료AI검증_50페이지시험.md
---

# COMPLETION — specs 검색 제목 50페이지 시험

**[2026-11-05 05:20 KST]** iMac/쌍아-막내8 → iMac/쌍아

**결론**
- 해외 노출 상위 100페이지를 짝지어 시험군 50·대조군 50으로 나눴다. 두 군의 기준선은 노출 9,956 대 9,732, CTR 0.79% 대 0.74%, 평균 순위 7.38 대 7.61로 고르게 맞는다.
- 시험군 en·es의 제목·설명을 민아 감수 2회(05:10 교체 5건, 05:14 승인)를 거친 문안으로 바꿨다. diff 검증 결과 바뀐 곳은 정확히 대상 100경로이고, 다른 키 변경은 0이다.
- dev `monkos-portal-dev-00240-w4t`에서 렌더를 확인했다. 시험 대상 4건은 새 문안으로, 비대상 3건은 원문 그대로 나왔다.
- **prod 반영에는 엣지 재배포와 portal 배포가 모두 필요하다.** 둘 다 작가님 '배포 승인' 사안이며, 이번에는 실행하지 않았다.

출처: 지시서 상단(작가님 04:41 분석 요청, 05:01 "셀카 사진으로 무료만들기, ai 규격검증 같은 키워드를 잘 배합하는것은 좋지"). 범위 승인은 §1·§2(선정·문안·데이터 반영·dev)까지다.

## 1. 대상 선정 (커밋 9f75b42b)

**GSC 조회**
- 대상: `sc-domain:monkos.ai`, 2026-10-06~11-02(28일, 쌍아 04:41 실측과 같은 창), web, `^https://monkos\.ai/(en|es)/specs/` 447페이지.
- 방식: `gsc_submit.sh`와 같은 소유자 SA 임퍼소네이션, 읽기 전용 스코프. 토큰은 출력하지 않았다.
- 한국 노출: 전체 17회. 페이지별로 빼고 계산했다.

**모집단**
- 렌더러 `parseSlug`와 같은 규칙으로 slug에 매핑했다. 규칙의 `TYPE_SLUG_PATTERNS`는 소스에서 직접 읽었다.
- 매핑된 428페이지가 모집단이다. 구 1단 URL(301) 19개는 제외했다.

**배정**
- 한국 외 노출 상위 100개(1위 1,336회 ~ 100위 39회)를 노출 순으로 둘씩 짝지었다.
- 짝마다 무작위로 시험·대조를 나눴다(시드 1105).

| 군 | 페이지 | en / es | 노출 | 클릭 | CTR | 평균 순위(노출 가중) |
|---|---:|---|---:|---:|---:|---:|
| 시험군 | 50 | 36 / 14 | 9,956 | 79 | 0.79% | 7.38 |
| 대조군 | 50 | 35 / 15 | 9,732 | 72 | 0.74% | 7.61 |

짝별 기준선 50행과 문안 전/후 전체 표는 시험 기록 `monkos-ops/marketing/specs-ctr-test/TEST_20261105_검색제목.md`에 있다.

## 2. 문안 규칙과 민아 감수

**최종 패턴**

| 언어 | 항목 | 패턴 |
|---|---|---|
| en | 제목 | `{Country} {Type} Photo Size {치수} 2026 — Free & AI-Checked`. 60자를 넘으면 2026부터 뺀다(22/50건에 2026 남음). Size는 항상 유지한다. |
| en | 설명 | `{Country} {type} photo size: {치수}, {배경} background. A common rejection: {rejectionReasons[0]}. Make it from a selfie for free, AI-checked for size and framing.` 길면 단계적으로 줄인다. |
| es | 제목 | `{País}: Foto de {Tipo} {치수} 2026 — Gratis, Revisada por IA`. 단위는 띄어 쓰고 inch는 쓰지 않는다. |
| es | 설명 | `Foto de {tipo} de {país}: medidas {치수}, fondo {배경}. Rechazo frecuente: {사유}. Hazla gratis desde un selfie; la IA revisa tamaño y encuadre.` 길면 `…, revisada por IA.` |

**민아 1차(05:10) — 교체 5건, 모두 반영**
- ① 설명의 "compliance check / verificación"은 규정 적합 보장으로 읽힌다 → 실제 검사 범위로 바꿨다. precheck가 실제로 재는 것은 크기·화각·밝기 등이다.
- ② 제목에 Size·2026을 유지했다. GSC 검색어가 거의 전부 size·tamaño·2026이고, free·selfie·ai가 들어간 검색어는 0건이다. Size를 빼면 키워드 탈락과 문구 효과를 구분할 수 없다.
- ③ "Free from a Selfie"는 "셀카가 없는"으로 오독된다 → 제목 꼬리를 "Free & AI-Checked"로 통일하고, 셀카는 설명에만 넣었다.
- ④ 스페인어: 나라 이름 뒤 콜론, "Revisada por IA", inch 금지, 설명에 "medidas".
- ⑤ 길이 지적: v1도 자동으로 짧은 문안이 대체돼서 실제로는 155자 이내였다. 민아는 패턴 원형 기준으로 셌고, 이 설명을 수용했다.

**민아 2차(05:14) — 승인**
- 교체 4건: ch·nl은 "Switzerland/Netherlands Visa"(검색어 일치), do en은 "Dominican Rep."(Dominica와 혼동 방지), do es는 "Foto Pasaporte Dominicano"(나라 이름 앞 규칙의 유일한 예외).
- 표기 통일 2건: es 단위 띄어쓰기, gt는 3.5×4.5 cm.
- en 설명의 일반명사(visa·passport)를 소문자로 바꿨다.

**규칙 이탈·조정 (사유 기록)**
- **제목 60자 예외 2건:** cr-passport es 61자, gt-passport es 62자. 민아가 픽셀 기준으로 잘리지 않는다고 보고 승인했다. 지시서 규칙은 "60자 이내"라서 이 2건만 예외 목록(`apply_titles.py`·`check_drafts.py`의 `TITLE_EXC`)으로 명시했다.
- **do-passport en:** 민아 안 "Dominican Rep. … — Free & AI-Checked"는 실제로 61자였다. 이미 승인된 쉼표형 "— Free, AI-Checked"(60자)로 맞췄다. 같은 쉼표형은 mk·jp-id에도 쓰였다.
- **kr-exam:** 민아 안 "Korea CSAT Exam Photo Size 3.5×4.5cm — Free & AI-Checked"를 그대로 썼다.
- **반려 사유:** 지시서대로 항목의 `rejectionReasons`에서 1개를 골랐다. 그런데 대상 50건이 모두 같은 상투 문구(Uneven background / Fondo desigual)라서, 실제로는 페이지별 차이가 없다. 데이터 품질 문제로 따로 적어 둔다.

**점검**
- `check_drafts.py` 14항목이 모두 통과했다. 항목은 다음과 같다.
  - 길이
  - 무료·AI 표현
  - en Size
  - 설명의 selfie
  - 금지어 "Free from"·"compliance"·"verificación"·inch·"Revisión IA"·"Gratis con IA"
  - es medidas
  - es 콜론
  - es 단위 띄어쓰기
  - en 소문자
- 외부 표기: 내부 호칭·기술 스택은 0건이다. 브랜드명은 넣지 않았다(민아 ⑤ — 해외 인지도가 0이라 CTR에 기여하지 않고, 시험 변수를 하나로 유지하기 위해).

## 3. 반영과 diff 검증

`AI_Factory/specs_ctr/apply_titles.py`가 다음을 확인했다.
- 원본 재직렬화(indent 2·ensure_ascii False·끝 줄바꿈)가 바이트 단위로 같다(서식 보존).
- 반영 후 전 항목·전 필드를 비교했다. 변경 경로는 **정확히 100개** = 50 (slug, lang) × (seoTitle, seoDescription)이다.
- 그 밖의 변경은 0이다. 항목 수 429는 그대로다.

추가 확인
- `git diff --stat`: specs-data.json 100+ / 100−, `"en"`·`"es"` 값 줄만 바뀌었다.
- 포털 테스트 **286/286** 통과.

## 4. 렌더 확인 — dev `monkos-portal-dev-00240-w4t` (run.app 직접, 엣지 미경유)

URL마다 2회 조회했고, 1차는 버리고 2차로 판정했다. 기대값은 specs-data 정본에서 가져왔다.

| 구분 | URL | `<title>` | meta description | 판정 |
|---|---|---|---|---|
| 대상 | `/en/specs/visa/qa` | Qatar Visa Photo Size 3.8×4.8cm 2026 — Free & AI-Checked | Qatar visa photo size: 3.8×4.8cm, … AI-checked for size and framing. | ✅ (구 제목 부재) |
| 대상 | `/es/specs/passport/cu` | Cuba: Foto de Pasaporte 4.5×4.5 cm — Gratis, Revisada por IA | Foto de pasaporte de Cuba: medidas 4.5×4.5 cm, … | ✅ (구 제목 부재) |
| 대상 | `/es/specs/passport/do` | Foto Pasaporte Dominicano 51×51 mm — Gratis, Revisada por IA | Foto de pasaporte dominicano: … | ✅ |
| 대상 | `/en/specs/passport/do` | Dominican Rep. Passport Photo Size 2×2 in — Free, AI-Checked | Dominican Republic passport photo: … | ✅ |
| 비대상(대조) | `/es/specs/passport/ec` | Ecuador Foto de Pasaporte Tamaño y Requisitos 2026 — 5 × 5cm | 원문 | ✅ 그대로 |
| 비대상(대조) | `/en/specs/passport/lk` | Sri Lanka Passport Photo Size — 3.5 × 4.5cm 2026 | 원문 | ✅ 그대로 |
| 비대상(시험 slug의 ko) | `/specs/visa/qa` | 카타르 비자 사진 규격·규정 2026 — 3.8×4.8cm·배경·복장 \| MONKOS | 원문 | ✅ 그대로 |

- dev 배포 로그에 `[obfuscate] WARN public/index.html: ERROR at line 3`이 찍혔다. 이번 변경과 무관한 파일이고(origin/main 마지막 변경 e4a791a5), 배포 exit는 0이었다. 원래 있던 경고로 보고, 기록만 남긴다.

## 5. 배포 대상 판정표 (실행 안 함 — 작가님 '배포 승인' 사안)

| 순서 | 대상 | 필요 | 근거 |
|---|---|---|---|
| 1 | 엣지 `monkos-portal-edge` (`edge/deploy.sh`, SSG 빌드 선행) | **필요** | monkos.ai specs 페이지는 엣지 정적본이 응답한다. specs-data 변경은 엣지 재배포 대상이다(references §배포). 누락하면 구본이 소리 없이 계속 나간다. |
| 2 | `monkos-portal` | **필요** | 정적본에 없는 경로·CMS 폴백·sitemap이 같은 specs-data를 쓰므로 함께 맞춘다. |

**prod 반영 확인안 (live-verify 1항)**
- `/en/specs/visa/qa`·`/es/specs/passport/cu` 등 대상 3페이지와 대조 3페이지를 URL당 2회 조회하고, 2차로 `<title>`를 판정한다.
- prod 반영일을 시험 D0로 기록한다(시험 기록 §3).

## 6. 시험 기록·후속

**시험 기록:** `monkos-ops/marketing/specs-ctr-test/TEST_20261105_검색제목.md`
- 가설, 선정 방법, 4주 판정 기준(Δ시험 − Δ대조, 짝별 부호 검정, 순위 통제, 반증 시 롤백), 기준선 50쌍, 전/후 문안이 들어 있다.

**⚠️ 측정 공백 — 전역 무료 상한 도달 일수 (민아 ②)**
- 민아가 말한 "server.js:269 분기 로그"는 실제로 없다.
- 전역 상한 분기(`consumeFreeQuota` → `global: true` → 429 `FREE_LIMIT`)는 로그를 남기지 않는다. 응답 코드도 개인 상한과 같아서 Cloud Run 요청 로그로는 둘을 구분할 수 없다.
- 대안:
  - ① 그 분기에 로그 1줄을 추가한다(별도 지시 필요).
  - ② `free_quota/{date}_GLOBAL`을 조회한다(ch4 10조에 따라 경유 도구 필요).

**⚠️ 시험 기간 금지**
- `monkos_AI/portal/tools/seo-headterm-regen.mjs`를 실행하지 않는다. en 제목·설명을 일괄 재생성해 시험 문안을 덮어쓴다.

**공유 브라우저:** 이번 작업에서는 사용하지 않았다. 렌더 확인은 HTTP 조회로 했다.

## 완료 보고

- ✅ 대상 50·대조군 50 기준선 표. 짝지어 무작위 배정했고, 두 군의 노출·CTR·순위가 고르게 맞는다.
- ✅ 문안 반영(diff 검증 100경로, 다른 키 0). 민아 감수 2회를 거쳐 승인됐다(제목 60자 예외 2건 명시). 테스트 286/286.
- ✅ 렌더 확인: 대상 4건(지시서 기준 3건 + 1) 새 문안, 비대상 3건 원문 유지. dev `00240-w4t`, 2회 조회로 판정.
- ✅ 시험 기록 파일과 재현 도구 일체(`AI_Factory/specs_ctr/`).
- ❌ 전역 무료 상한 도달 일수: 셀 장치가 없다. 대안 ①·② 중 결정이 필요하다.
- 💡 반려 사유 데이터가 대상 50건 모두 같은 상투 문구다. 페이지별 실제 반려 사유가 없는 상태라 콘텐츠 품질 과제로 남긴다(메모리 "specs 품질 기준=공식 정독·실반려 중심"과 연결).
- ⏳ prod 반영(엣지 → portal, 작가님 '배포 승인') = 시험 D0. 그로부터 4주 뒤 판정.
- 📁 `monkos_AI/portal/lib/cms/specs-data.json` / `AI_Factory/specs_ctr/*` / `monkos-ops/marketing/specs-ctr-test/TEST_20261105_검색제목.md` / 이 보고서·세션 로그·PF_SPECS 1행
- 🔀 브랜치 `worktree-makne8-specs-title-test` → 원격 푸시. 병합은 쌍아가 한다.

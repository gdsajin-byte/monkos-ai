---
type: completion
date: 2026-07-05
device: iMac
agent: 막내
portfolio: PF_CITADEL
status: 마감
subject: "specs 복합 type canonical 301 루프 수정 — visa-evisa/visa-bls"
---

# COMPLETION — specs 리다이렉트 루프 수정

**[2026-07-05 10:59 KST]** iMac/막내 → 작가님

## 1. 문제 (2026-07-04 결제 트랙 감사 발견, HEAD 이전부터 존재)

`/specs/visa-evisa/in`, `/specs/visa-bls/in` (ko·ja·en 3언어 = 6 URL)이 자기 자신으로 301하는 무한 루프.

### 원인 (2중)

1. **parseSlug 오분해**: `TYPE_SLUG_PATTERNS`에 복합 type(`visa-evisa`, `visa-bls`)이 미등재 → 마지막 하이픈 기준 폴백으로 `in-visa-evisa`를 type=`evisa`, country=`in-visa`로 분해. ROUTE_MAP에 `visa-evisa/in` 키가 생성되지 않음.
2. **fallback 301의 Location 재조립**: 매칭 실패 시 `${newType}/${iso}`로 Location을 직접 조립 — `SPECS_DATA['in-visa-evisa']` 존재 확인 후 요청 URL과 동일한 `/specs/visa-evisa/in`으로 301 → 루프.

## 2. 수정 ([render-specs.js](../../../../monkos_AI/portal/lib/cms/render-specs.js), +6/-2)

- `TYPE_SLUG_PATTERNS`에 `'visa-evisa', 'visa-bls'` 등재 → canonical이 `/specs/visa-evisa/in` 형태로 정상 생성 (ROUTE_MAP·sitemap·canonical 태그·hreflang 일괄).
- fallback 301의 Location을 `REDIRECT_MAP[슬러그]` 정본 라우트 기준으로 전환 + `target !== url.pathname` 자기참조 가드 → 루프 클래스 구조적 봉쇄.

## 3. 검증 — PROTOCOL_url_slug_safety.md §2 완료 조건 3종

전 슬러그 × URL 형태(canonical 2-seg / 1-seg / 역순 / 6·19 국가명 레거시 / ja·en 표본) 대사 하네스로 renderSpecsDetail 직접 실측:

| 항목 | 수정 전 (1,396 URL) | 수정 후 (1,394 URL) |
|------|------|------|
| 301 루프 | **8** (visa-evisa·bls ×3언어 + 국가명 유입 2) | **0** |
| 404 | 2 (`india-visa-evisa`·`india-visa-bls`) | **0** (→ 신정본 301) |
| 500 / 2홉 초과 체인 | 0 / 0 | 0 / 0 |

- **① 301 매핑**: 구 canonical `/specs/evisa/in-visa`·`/specs/bls/in-visa`(3언어) + 1-seg `in-visa-evisa`·`in-visa-bls` → 전부 신정본 301 승계 실측.
- **② sitemap**: 신정본 6건(2슬러그×3언어)만 방출, 구형(`in-visa`) 잔존 0 실측.
- **③ GSC 노출 체크**: 구 URL 5건 노출 실재(`/specs/evisa/in-visa` 노출22·클릭3, `/specs/in-visa-bls` 노출17 등) — 5건 전부 301 승계 대상에 포함, 자산 손실 0.

- 신규 404: `/specs/in-visa/evisa`·`/specs/in-visa/bls` 2건 — 오분해 산물의 역순 합성 형태로 어디서도 방출된 적 없고 GSC 노출 0. noindex 404 처리(프로토콜 §2-① 정본 부재 폴백 준용).

## 4. 배포

**미배포.** 결제 트랙 진행 중이라 prod 배포 타이밍은 작가님 판단 대기. 배포 후 §4에 따라 prod 실측(구 URL 301 / 신 URL 200) 필요.

## 5. 변경 파일

- `monkos_AI/portal/lib/cms/render-specs.js` (+6/-2) — 유일한 코드 변경
- 대사 하네스·베이스라인/사후 실측 로그: 스크래치패드 (일회성, 미커밋)

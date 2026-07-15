---
type: order
date: 2026-07-15
from: iMac/민아
to: 막내(번호 작가님 지정)
subject: SPECS 트랙1 — 퍼널 컴포넌트 통합 리팩토링 (울트라코드, T0 무료 전언어 개방 + 2계층 컴포넌트 + 3언어화)
status: 대기
portfolio: PF_SPECS
---

# 지시서: SPECS 트랙1 퍼널 컴포넌트 통합 리팩토링 [울트라코드]

**[2026-07-15 12:52 KST]** iMac/민아 → 막내

> 본 지시서는 민아 초안(경로③) — 쌍아 사후 추인 대상.
> **울트라코드로 작업하라** (작가님 지정 2026-07-15). 완료 후 민아 E2E + 쌍아 코드리뷰 교차 검증이 예정되어 있다 — 검증 가능성(커밋 분할·증빙)이 산출물의 일부다.

## 0. 필독 (착수 전 순서대로 Read)

1. **기안(정본)**: [DESIGN_20260715_SPECS_퍼널컴포넌트_통합리팩토링.md](../../../tech/designs/2026-07/DESIGN_20260715_SPECS_퍼널컴포넌트_통합리팩토링.md) — D1~D7 설계 결정 전문
2. 감사 보고서 §3~§4.5(분기 정위치·정본 선언·소유권 4계층): [REPORT_20260715_iMac민아_포털구조감사_프레임워크옵션.md](../../reports/2026-07/REPORT_20260715_iMac민아_포털구조감사_프레임워크옵션.md)
3. 경위: [PROPOSAL_20260715_민아_SPECS_enja퍼널정합.md](../../proposals/PROPOSAL_20260715_민아_SPECS_enja퍼널정합.md)

## 1. 목적 (한 줄)

`isPilot = lang==='ko'` 이원 구조를 폐지하고 **전 언어 단일 T0 무료 퍼널**(작가님 무료 전면 개방 결정)을 2계층 컴포넌트로 재편 — en/ja 실유입이 한국어 UI·구형 유료 퍼널에 노출되는 사고 종결.

## 2. 스코프 = 기안 P1+P2 (요약 — 상세는 기안이 정본)

- **D1**: isPilot 분기 폐지, 구형 유료 직행 레이아웃 삭제 (render-specs.js 785·1003~1330 삼항 산재 일소)
- **D2**: 1층 SSR 섹션 컴포넌트 분해(specHero·specCard·specDiagram·specDetails·docsAccepting·faqSection·relatedServices → lib/cms/components/) + 2층 `SpecsFunnel.mount(el,{slug,lang,market,t1,quota})` 위젯 추출(public/components/specs-funnel/) + **L0 디자인 토큰**(기존 CSS 반복값 추출 1파일)
- **D3**: 문자열 3층 사전화 — SPECS_I18N을 lib/cms/specs-i18n.js 분리·잔존 편입 / 위젯 UI_TEXT{ko,ja,en} / 서버 에러 code 정본화(문구는 위젯 매핑)
- **D4**: 카피 개정 — 기안 §2 D4 테이블 그대로 ('규격 안착' 폐기어 일소, '찍힌 분'→'사진 속 인물' 등)
- **D5**: attire-picker 정식 편입 (구형 인라인 의상 UI 제거, lang 전달)
- **D6**: LEMONSQUEEZY_VARIANT_SPECS_SINGLE = 결제 가용성 플래그로 축소, V2_DIRECT_SLUGS(kr-passport) 폐지→301 합류
- **D7**: 쿼터 3종 상태(개인 소진·글로벌 캡·매팅 불가) 로케일 문구 — FREE_GLOBAL_DAILY_CAP=300 유지(**캡 변경 금지** — 작가님 단독 결정 항목)

## 3. 커밋 6분할 (순서 고정 — 각 커밋 독립 리뷰 가능해야 함)

1. `[refactor]` specs-i18n 모듈 분리 (동작 무변화)
2. `[refactor]` 1층 SSR 섹션 컴포넌트 분해 — **출력 HTML diff 0 증빙**: 대표 슬러그 6종(kr-passport·passport/kr·visa/mu·passport/jp EN/JA/KO)×3언어 렌더 비교 스크립트 첨부, 결과 0 diff
3. `[refactor]` SpecsFunnel 위젯 추출 (ko 동작 동일 — 스크린샷 대조)
4. `[feat]` isPilot 폐지 + T0 전언어 개방 + 구형 레이아웃 삭제 (isPilot/CFG.pilot 잔존 grep 0 증빙)
5. `[feat]` attire-picker 편입 + specs-pilot.css 흡수 + D6 게이트 재정의
6. `[fix]` 카피 교체 (D4 테이블) + 서버 에러 code 매핑 + **EN 관사 오류 수정**(P0에서 이관: "A Austria Passport photo…" → 관사 회피 문장 구조, a/an 판별 로직 추가 금지)

## 3.5 파일 관할 (병렬 투입 충돌 방지 — 위반 금지)

- **`specs-data.json` 수정 금지** — P0 막내 관할(ja 필드·출처·ja seoTitle 병렬 작업 중). 데이터 결함 발견 시 수정하지 말고 보고.
- 착수 시 최신 main pull 필수. 커밋 전 pull --rebase로 P0 커밋과 정렬.
- 커밋2의 diff 0 증빙은 **동일 워킹트리 시점에서 분해 전/후 비교** — P0의 데이터 변경과 무관하게 성립하도록 스크립트를 같은 데이터 상태에서 실행.

## 4. ⚠️ 준수 조항

- 헌법 4조 1항: 시크릿 값 절대 미접촉 — env는 이름만 참조. 레몬 variant 값 생성·추측 금지
- 헌법 4조 2항: 파괴적 명령 금지
- ch5: 배포는 `./deploy.sh` 경유만. **prod 배포는 민아·쌍아 검증 통과 후 별도 승인** — 본 지시서는 dev까지
- ch7 6조: 막힘 시 PF_SPECS·기안 선행 참조, 에러 3회 반복 시 에스컬레이션
- 결제 코드(payments.js·레몬 콜백) 로직 변경 금지 — 진입점 파사드화만 (기안 D2 L3)
- 멈춤 게이트: 커밋2 diff 0 실패 / ko 회귀 파손 / 결제 콜백 시그니처 변경 필요 발생 → **중단 후 보고** (우회 금지)

## 5. 완료 기준

- [ ] 커밋 6개 순서대로, 각 증빙(diff 0 스크립트 결과·grep 0·스크린샷) 포함
- [ ] dev 배포 + `/ja/specs/visa/kr` `/en/specs/visa/mu` 업로드→무료생성 스모크 (한국어 문자열 노출 0)
- [ ] ko `/specs/kr-passport` 기존 파일럿 동작 무변화 (전후 스크린샷)
- [ ] COMPLETION 보고서 + 세션로그 + PF_SPECS 히스토리 1행
- [ ] 민아 검증 인계 노트: 변경 파일 목록 + dev URL + 증빙 위치

## 6. 커밋 메시지

3항의 6분할 각 메시지. 최종 머지 커밋 불필요(main 직커밋 순서 유지).

---
type: order
date: 2026-07-15
from: iMac/민아
to: 막내(번호 작가님 지정)
subject: SPECS P0 지혈 — JA 데이터 영어 잔존·출처 교체·JA 타이틀 축소·EN 관사 (데이터 수정, 리팩토링과 독립)
status: 대기
portfolio: PF_SPECS
---

# 지시서: SPECS P0 지혈 — JA 데이터·EN 관사 4건

**[2026-07-15 12:52 KST]** iMac/민아 → 막내

> 본 지시서는 민아 초안(경로③) — 쌍아 사후 추인 대상. 트랙1 리팩토링(별도 지시서)과 **무충돌**(specs-data.json 데이터 수정만).
> 선행 맥락: 7/15 오전 민아 라이브 실측 — [PROPOSAL_20260715_민아_SPECS_enja퍼널정합.md](../../proposals/PROPOSAL_20260715_민아_SPECS_enja퍼널정합.md) §공통. 7/15 M1막내1 헤드텀 수정(24186a4c)이 커버하지 않은 잔여분.

## 1. 배경

en/ja 스펙스가 실유입 형성 중(JA 148imp 페이지 존재)인데, 일어 최대 노출 페이지에 영어 원문·부적절 출처가 라이브 노출 중. 데이터 수정만으로 즉시 지혈 가능.

## 2. 작업 항목 (4건)

**A. JA 스펙 데이터 영어 잔존 일소** — `monkos_AI/portal/lib/cms/specs-data.json`
- 실측 예: `/ja/specs/passport/jp` 스펙 테이블 有効期限 값 = "taken within 6 months before application" (영어 노출)
- 전 슬러그의 ja 필드(validity·background·fileSpec 등 로컬라이즈 필드)를 스캔 → 영어/한국어 잔존값 전량 일어화
- 스캔 스크립트로 잔존 목록 먼저 산출 → 일괄 수정 (목록을 보고서에 첨부)

**B. jp-passport 출처 교체**
- 현재: `ph.emb-japan.go.jp` (필리핀 주재 일본대사관 — 권위 부적절)
- 교체: 일본 외무성 정본 여권사진 규격 페이지(mofa.go.jp 파스포트 사진 규격). **URL은 실접속 검증 후 기입** (죽은 링크 금지)

**C. JA seoTitle 축소** — EN 60자 축소(7/15 M1 작업)와 동일 원칙
- 현재 예: "日本パスポート写真のサイズ・規格 2026 — 3.5×4.5cm・背景・服装 | MONKOS" (전각 ~38자, SERP 절단)
- 기준: 전각 30자 내외, 핵심 키워드(국가+문서+写真+サイズ+연도) 전방 배치, "| MONKOS" 접미 제거
- 전 슬러그 ja seoTitle 일괄 적용

~~**D. EN 관사 오류**~~ → **트랙1 지시서로 이관** (07-15 13:04 개정 — 병렬 투입 파일 관할 분리)

## 2.5 파일 관할 (병렬 투입 충돌 방지 — 위반 금지)

- 본 지시서 관할: **`specs-data.json`만** (+ B의 출처 URL 검증)
- `render-specs.js`·`specs-funnel.js`·컴포넌트 계열은 **트랙1 막내 관할 — 접촉 금지**. 필요 발견 시 수정하지 말고 보고.

## 3. 산출물

- specs-data.json 수정 (A·B·C)
- 잔존 스캔 목록 포함 COMPLETION 보고서
- dev 검증 후 `./deploy.sh` 배포

## 4. ⚠️ 준수 조항

- 헌법 4조 1항: 비밀정보 생성 금지 (본 작업 무관하나 상기)
- 헌법 3조 1항: 타임스탬프 `date` 취득 / 3조 2항: 완료 보고 + COMPLETION 파일 필수
- ch5: 배포는 deploy.sh 경유만
- ch4 10조: Firestore/크레딧 접근 없음 확인
- 데이터 수정 원칙: **추측 금지** — B의 공식 URL, A의 일어 문안 모두 실검증. 불확실 항목은 목록화 후 보고(임의 번역 금지 항목: 법령·기관명)

## 5. 완료 기준

- [ ] A: ja 필드 영어/한국어 잔존 0건 (스캔 스크립트 재실행 증빙)
- [ ] B: 신규 출처 URL HTTP 200 + 일본 외무성 도메인 확인
- [ ] C: 전 슬러그 ja seoTitle 전각 30자 내외
- [ ] 배포 후 `/ja/specs/passport/jp` 라이브 실측 첨부
- [ ] render-specs.js 등 코드 파일 diff 0 (git diff로 증빙 — specs-data.json 외 무접촉)

## 6. 커밋

`[fix] SPECS JA 데이터 지혈 — 영어 잔존 일소·출처 교체·JA 타이틀 축소·EN 관사 (P0)`

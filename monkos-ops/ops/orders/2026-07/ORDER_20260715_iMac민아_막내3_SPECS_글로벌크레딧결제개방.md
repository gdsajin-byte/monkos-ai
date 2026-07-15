---
type: order
date: 2026-07-15
from: iMac/민아
to: iMac/막내3
subject: 글로벌 크레딧 결제 개방 — ja/en/es 결제 카드 노출 + 충전 동선 (작가님 결정 2026-07-15 18:06)
status: 대기
portfolio: PF_SPECS
---

# 지시서: 글로벌 크레딧 결제 개방

**[2026-07-15 18:06 KST]** iMac/민아 → iMac/막내3

> 작가님 결정: "크레딧은 들어가야지 — 상점에 달러로 등재 완료." 배경: ja/en에 '로그인하면 10c' 이벤트는 노출되는데 크레딧 결제 수단이 kr 한정이라 이행 불가 약속 상태(민아 17:43 발견). 백엔드(VARIANT_CREDITS 적립 웹훅·차감 API·글로벌 웹훅 시크릿)는 준비 완료 실측 — **프론트 3곳만 연다**.
> **선행**: 핫픽스 지시서(피커 CSS+쌍아 3건) 완료 후 착수 — 같은 파일 계열 순차 작업.

## 작업 3건

**A. 결제 카드 lang 분기 해제** — [spec-funnel-markup.js:112](../../../../monkos_AI/portal/lib/cms/components/spec-funnel-markup.js) `${lang === 'ko' ? 크레딧버튼 : ''}` → 전 언어 렌더.
- 가격 표기 시장별: kr `10c (₩1,500)` 유지 / global·jp `10c ($1)` — 환산 정본은 credits.html:193("10c = ₩1,500 = $1"). **숫자 하드코딩 대신 config 정본 상수 참조** — 없으면 상수 1곳 신설(SSOT).
- creditTopup(추가 충전 문구): 글로벌 크레딧 팩의 실제 등재 구성(몇 c·몇 $)을 `VARIANT_CREDITS`·config에서 **실측 후** 문구 작성. 구성 확인 불가 시 topup 줄만 kr 한정 유지하고 보고.

**B. 사전 키 3언어** — specs-i18n.js에 creditTitle·creditDesc(·creditTopup) ja/en/es 추가. 기존 ko 톤 미러.

**C. 충전 동선 (크레딧 부족 시)** — 현재 `/credits.html` 리다이렉트인데 해당 페이지는 lang="ko" 전용.
- 1차 실측: credits.html·payments.js에 레몬 크레딧 팩 체크아웃 생성 경로가 이미 있는지 확인.
- 있으면: 글로벌은 그 체크아웃 **직행**(credits.html 미경유 — 레몬이 결제 UI 다국어 처리).
- 없으면: 기존 레몬 체크아웃 생성 패턴(단건 결제와 동일 API) 재사용해 크레딧 팩 체크아웃 링크 연결. **credits.html 다국어화는 스코프 아님**(과대 작업 금지).

## 완료 기준

- [ ] dev: ja/en/es 페이지 Phase 2 결제 카드에 크레딧 버튼 노출(시장별 표기) — 스크린샷
- [ ] ko 회귀: 기존 크레딧 카드·토스 동선 무변화
- [ ] 크레딧 부족 상태에서 충전 동선 도달(레몬 체크아웃 오픈까지 — **실결제 금지**)
- [ ] 가격 숫자 신규 하드코딩 0 (grep 증빙)
- [ ] COMPLETION + 민아 검증 인계 (prod는 검증 후)

## ⚠️ 준수

- 시크릿·variant ID 값 미접촉(이름 참조만) / deploy.sh 경유, dev까지 / specs-data.json 접촉 금지(막내2 관할)
- 레몬 체크아웃 생성 로직의 시그니처 변경 금지 — 재사용만. 변경 필요 발견 시 중단·보고

---
type: order
date: 2026-11-05
from: iMac/쌍아
to: iMac/민아
subject: idphoto-kr 중심 GA4 계측 강화 — 결제 전환·퍼널·배너 QR 출처·테스트 트래픽 분리. 민아 주관(마케팅·보안·검수 메인)
status: 대기
portfolio: PF_IDPHOTO
---

# ORDER — idphoto-kr GA4 계측 강화 (민아 주관)

**[2026-11-05 14:54 KST]** iMac/쌍아 → iMac/민아

출처: 작가님 원문 2026-11-05 14:54 KST, iMac/쌍아 세션(사람 턴) — "민아에게 ga 쪽 강화하라고해 마케팅과 보안, 검수쪽은 민아가 메인이야". 경로 ③(작가님 → 민아). 세션 메시지 전달은 민아 세션(iMac-민아-1102-1252) 소멸로 실패 → 파일로 전달. 범위 설계·실행 판단은 민아 몫. 배포·과금·고객 데이터·측정 ID 변경은 기존 승인 게이트 그대로.

## 배경 (쌍아 14:52 실측)

- GA4 속성 521406894, `hostName = idphoto-kr.monkos.ai`, 최근 14일: 세션 15, 전부 mobile.
  - direct 11 · google/cpc 2 · chatgpt.com/ai-assistant 1 · payment-gateway.tosspayments.com/referral 1(10-27 `/prep`).
- **keyEvents 0** — 작가님 확인으로 토스 결제 중 idphoto-kr 2건이 있다(결제 일자 미확인). 결제 전환 미계측인지, 창 밖인지 확인이 필요하다.
- 작가님 가설: 결제자 = 사진관 앞 배너 QR 유입. 현행 QR은 UTM이 없어 direct에 섞인다. 레포에 배너 QR 목적지 기록 없음(코드 내 QR은 데스크톱 → 모바일 `/prep` 전환용뿐 — `monkos_AI/idphoto-kr/public/index.html:1209`).
- 맥락: 작가님 방침 — idphoto-kr을 증명사진 메인으로 재정비(디자인·UI·기술 보강). 쌍아는 crop 화면 fit 자동 설정 1단계 지시서를 준비 중이다(`public/crop.js`·`server.js` 쪽). 코드 영역이 겹치면 쌍아에 알린다.

## 후보 (참고 — 채택·순서는 민아 판단)

1. 결제 완료 → `purchase` 계측(값·통화·상품) + 퍼널 이벤트(업로드 · 판정 · 결제 시작 · 결제 완료 · 다운로드).
2. 배너 QR 출처 식별 — UTM 또는 monk.kr 단축 리다이렉트. 배너는 꾸 소관이므로 경로 ④로 꾸가 결정.
3. 작가님 테스트 트래픽 분리 — 내부 트래픽 필터 미설정(메모리 `project_ga4_test_traffic_contamination`).

## 준수

- 측정 ID 정본 `G-JPZWSJ3323`(`.claude/rules/references.md` §GA4). 코드 삽입·변경 전 관리 UI 또는 Admin API 실측. 검증은 collect 204가 아니라 수신 속성 실데이터(run_report hostName·eventName).
- 라이브 판정은 `live-verify.md`(2회 히트·대조군).
- 헌법 3조: 세션 로그·COMPLETION·PF_IDPHOTO 1행.

## 반환

COMPLETION 파일 + 쌍아 세션에 1줄 알림(변경 이벤트 목록 · 실데이터 수신 확인 방법 · 남은 결정).

## 추가 (쌍아 2026-11-05 15:56)

- 막내8 kr 업로드 열기(d06f9061, dev 00007-lgd)가 `photo_upload`에 `capture_mode=upload`를 넣었다. 헤드리스에선 수신 0(대조군 generate_click도 0) — 실기기 확인 필요. `capture_mode` 커스텀 측정기준 미등록 가능성 → 등록 여부 확인 부탁.

---
type: report
date: 2026-07-17
device: iMac
agent: 민아
status: 마감
portfolio: PF_SPECS
---

# REVIEW — specs 퍼널 상태전이 전수 감사 (쌍아 11건 교차검증 + 민아 독립 스윕)

> **[2026-07-17 15:05 KST]** iMac/민아 → 작가님, iMac/쌍아
> 대상: specs-funnel.js(1,128행 전문 정독) + payments.js 토큰 계약 + server.js 생성 게이트 + specs-i18n.js
> 방식: 쌍아 흐름 분석 11건을 코드 행 단위로 교차검증(감사=민아 본령, 작성자 자기감사 금지 원칙) + 독립 스윕

## 1. 쌍아 11건 판정

| # | 쌍아 심각도 | 판정 | 근거 (행) |
|---|------|------|-----------|
| 1 | 🔴 | **CONFIRMED + 가중 3건** | loadOrder(98)는 ts를 저장(96)하고도 미검사, hasUsableToken(92)도 만료 무지. 가중: ①만료 토큰이 크레딧 생성까지 1회 차단 — resume credits 모드(1110)→doGenerate가 stale paymentToken 동봉(947)→서버 402 TOKEN_EXPIRED(payments.js:629)→**크레딧 보유 유저의 정당한 생성이 실패** ②TOKEN_* 에러 처리(986)가 clearStored()로 IMG_KEY까지 삭제→직후 복귀 시 재업로드 강요(imgLost) ③**서버는 tokenExpiresAt을 이미 응답에 내려줌**(payments.js:164·944) — 클라가 버리고 있어 서버 무변경 수선 가능 |
| 2 | 🔴 | **CONFIRMED — 4언어 전부** | specs-i18n.js 195·407·615·823 "재생성 한도(3회)" vs 정본 DIRECT_TOKEN_MAX_GENERATES=**1**(config.js:166, 07-05 1결제 1생성 확정). 4언어 × genLimit 전량 구체제 문구 |
| 3 | 🟠 | **CONFIRMED (영향 한정)** | ORDER_KEY는 slug 체크 있음(101) / IMG_KEY(137)는 무스코프 — 타 슬러그에서 저장한 사진이 복원(1064). 단 본인 사진의 규격 간 재사용 수준 — 타인 데이터 아님 |
| 4 | 🟠→🟡 조정 제안 | **CONFIRMED (성격 재정의)** | 크레딧 경로는 pay.token 부재로 다운로드 API 미경유(1030) — 과금 구멍 아님(생성 시점 10c 차감·실패 시 환불 게이트 완결, server.js:715·728). 실체는 다운로드 완주 계측 공백(전환 분석 손실) |
| 5 | 🟡 | CONFIRMED (설계 수용) | 쿠키=표시용, 서버 정본 구조(주석 232). 순간 불일치는 표시층 한정 |
| 6 | 🟡 | **CONFIRMED + 상향 제안** | FIT_SANITY(545)·fetch catch(559)에서 fitMode='pilot' 미리셋 (정상 리셋은 550·307에만). 재시도 시 파일럿 자동 무료생성 경로 오진입 가능 — "비위생"이 아니라 실동작 영향 |
| 7 | 🟡 | CONFIRMED | retry2 주석 "토큰(재생성 잔여) 유지"(1047)는 1회 체제에서 사문화 — remaining=0이면 결제 화면행. 문구·주석·GA 라벨 정비 감 |
| 8 | 🟡 | **REFUTED** | startToss는 setAmount를 렌더 가드 **밖**에서 매회 호출(801) — 금액 변동 이미 대응됨. 잔여 리스크는 clientKey 최초 1회 고정(795)뿐 — 키 로테이션 시나리오 한정 |
| 9 | ⚪ | CONFIRMED (수용) | genBusy(921)/freeBusy(233)/payBusy(22) 분리 — 페이즈 단일 가시성으로 방어 중. 통합 lock은 Wave 2 리팩토링에 동승 |
| 10 | ⚪ | **CONFIRMED — 4언어** | tokenExpired "info@monkos.ai로 문의해주세요"(195 외 3언어) — 정상 만료에 문의 유도. "다시 결제해주세요" 계열로 교체 |
| 11 | ⚪ | CONFIRMED (동작 정합) | consumed 리셋 3경로(769·862·1089) 현재 정합. 추적성만 과제 |

**집계: CONFIRMED 10 (가중 2건 포함) / REFUTED 1 (#8)**

## 2. 민아 독립 스윕 — 쌍아 누락 발견

| # | 등급 | 발견 | 상세 |
|---|------|------|------|
| M1 | 🟠 | **stale 토큰의 크레딧 차단 + 이미지 연쇄 삭제** | #1의 실피해 경로 구체화 — 작가님 겪은 "만료" 오표시에서 멈추지 않고, 1클릭 실패 + IMG 소실까지 연쇄 (전환 이탈 지점) |
| M2 | 🟡 | **서버 tokenExpiresAt 미활용** | 수선 벡터: persistOrder에 expiresAt 저장 → loadOrder·hasUsableToken에서 검사. 서버 무변경, 클라 ~10줄 |
| M3 | ⚪ | 레몬 팝업 복귀 데드엔드 | 팝업 탭의 redirectUrl 복귀는 sessionStorage 빈 상태(탭 단위 저장소) → 팝업에 빈 업로드 화면. 원 탭 폴링이 처리하므로 기능 무해, "원래 탭으로 돌아가세요" 안내 여지 |
| M4 | ⚪ | free 다운로드도 서버 무추적 | #4 동류 — free_download는 GA 클라 이벤트만. 설계 수용 여부 확인만 |
| M5 | 기록 | genLimit 후 remaining=0 persist(988) 정합 확인 | 재발화 차단 정상 — 결함 아님, 감사 기록 |

## 3. 처방 — 쌍아 "상태 전이 단위 일괄" 지지, 3-Wave 분할

부분 패치 금지 원칙 동의. 단 전량 일괄은 결제 코어라 리스크가 크므로 상태기계 정비(Wave 2)와 즉효 수선(Wave 1)을 분리:

- **Wave 1 (즉효·저위험, 오늘 지시서 가능)**
  ① i18n 4언어 × 2문구: genLimit(3회→1결제 1생성 체제 문구) + tokenExpired(문의→재결제 유도)
  ② 토큰 만료 클라 검사: persistOrder에 expiresAt 동봉 → loadOrder·hasUsableToken 만료 필터 (M2 벡터)
  ③ IMG_KEY slug 스코프 (`monkos_specs_img:{slug}` 또는 저장 객체에 slug 필드)
  ④ TOKEN_* 에러 시 IMG 보존 (clearStored 분리 — 주문만 삭제)
- **Wave 2 (상태기계 정비, 흐름도 기반 설계 선행)**
  sessionStorage 복원 단일 모듈(복원 유효성 → 페이즈 결정 상태기계), fitMode 리셋 일원화(#6), retry2 동선·주석 정리(#7), 크레딧·free 다운로드 계측(#4·M4), busy 통합 lock(#9), consumed 추적성(#11)
- **Wave 3 (관찰·보완)** — free 쿠키 표시 보정(#5), 레몬 팝업 안내(M3), clientKey 로테이션 대비(#8 잔여)

**실행 경로 권고**: 경로① 정석 — 쌍아 흐름도+본 감사 병합 → 쌍아 설계·지시서(Wave 1 즉시) → 막내 실행 → 민아 재검증. Wave 2는 설계서(DESIGN) 선행.

## 4. 감사 방법 기록

- specs-funnel.js 1,128행 전문 Read, payments.js 토큰 발급·검증·소모 경로(156·591~629·915~944·953), server.js 생성 게이트(715~728), specs-i18n.js 4언어 대조, config.js 정본 상수(165~166).
- 판정 기준: 행 단위 재현 경로 성립 시 CONFIRMED, 코드가 주장을 반증하면 REFUTED, 영향 재평가 시 등급 조정 제안.

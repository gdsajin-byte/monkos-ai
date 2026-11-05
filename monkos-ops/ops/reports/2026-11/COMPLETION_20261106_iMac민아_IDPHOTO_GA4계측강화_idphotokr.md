---
type: completion
date: 2026-11-06
device: iMac
agent: 민아
order: ORDER_20261105_iMac쌍아_민아_IDPHOTO_GA4계측강화_idphotokr.md
portfolio: PF_IDPHOTO
status: dev 반영(00008-mrn) · prod 대기
---

# COMPLETION — idphoto-kr GA4 계측 강화 (민아 주관)

**[2026-11-06 00:13 KST]** iMac/민아 → 작가님 · iMac/쌍아

출처: 작가님 2026-11-05 14:54 사람 턴(쌍아 세션) "민아에게 ga 쪽 강화하라고해 마케팅과 보안, 검수쪽은 민아가 메인이야" → 쌍아 지시서(경로 ③) → 민아 범위 설계·실행.

## 0. 결론 1줄

**결제 전환은 이미 계측되고 있었다(purchase 2건 수신, 14일 창 밖). 빈 곳은 ① 내부·개발 트래픽 미분리 ② 결제창 복귀가 유입원을 덮어씀 ③ 퍼널 이벤트 이름 오염(begin_checkout 2중·download_complete=페이지 열람) ④ 파라미터 8종 미등록 — ①②③은 코드로 고쳐 dev에 올렸고, ④와 필터·보존기간은 GA 관리 권한이 필요해 작가님 결정 항목이다.**

## 1. 실측 — 착수 전 상태 (GA4 Data/Admin API, 속성 521406894, hostName=idphoto-kr.monkos.ai)

| 항목 | 실측 | 판정 |
|---|---|---|
| purchase | 09-28·10-09 각 1건, `/charge.html`, transaction_id `MONKOS_kakao_51…`(동일 사용자), 유입 direct, 수익 7.31·7.39 USD(속성 통화 USD 환산) | **계측 정상.** 쌍아 "keyEvents 0"은 14일 창(10-22~) 밖. 작가님이 본 토스 2건과 일자 대조 필요 |
| 키 이벤트 | `purchase`(기본), `free_generation_complete`(커스텀) | 유지 |
| 커스텀 측정기준 | `service`·`market`·`spec_type` 3종뿐 | capture_mode·auth_method·gate_reason·fail_stage·fail_code·ai_engine·in_app·lang **미등록** → 수집은 되나 보고서에서 조회 불가 |
| 퍼널(09-01~) | spec_select 17 → photo_upload 15 → generate_click 10 → preview_view 7 → begin_checkout 6 → pay_confirm_click 5 → purchase 2 → download_complete 1 | begin_checkout이 result(다운로드 버튼 4)+charge(결제 버튼 2) 2중 집계 |
| 유입원(08-08~) | direct 45 · tosspayments referral 5 · google cpc 6 · monk.kr 3 · chatgpt 2 | **토스 결제창 복귀 5세션**이 원 유입원을 덮어씀(실패 복귀 포함) |
| 오염 | localhost 34세션·657이벤트, 127.0.0.1, dev 호스트 | 내부 트래픽 필터 없음 (메모리 `project_ga4_test_traffic_contamination` 그대로) |
| index.html | 로그인 확인 시 `gtag('config', …, {user_id})` 3곳 | 재config마다 page_view 추가 발화 |
| 데이터 보존 | 이벤트 2개월 | 탐색 분석(퍼널 탐색)이 2개월 전 데이터를 못 본다 |

## 2. 코드 변경 (idphoto-kr, 16파일 +29/−81, 클라이언트만 · 서버·과금·고객 데이터 무관)

| 파일 | 변경 |
|---|---|
| `public/ga-init.js` **신설** | 12개 HTML의 동일 인라인 GA 블록을 공통 스크립트로 교체. ① `traffic_type=internal`+`debug_mode` — localhost·127.0.0.1·`-dev-` 호스트 자동, 수동 `?monk_internal=1`(해당 브라우저 영구, `=0` 해제) ② 토스·카카오·네이버·구글·애플 복귀 page_view에 `ignore_referrer`(GA 공식 10327750: config 명령에 부착, 값 무관) ③ `ai_referral_landing` 전 페이지 ④ 첫 랜딩 리퍼러 보존(기존 index 로직) |
| `public/*.html` 12개 | 인라인 블록 → `<script src="/ga-init.js">` (gtag 로더 태그 유지). JS는 서버가 no-cache로 내보내 캐시 잔존 없음 |
| `public/index.html` | user_id 재config 3곳 `send_page_view:false` |
| `public/result.js` | 다운로드 버튼 `begin_checkout`→**`download_click`** · 서버 차감 성공 시 **`download_complete`**(value 70, KRW) 신설 · **`generate_fail`**(fail_stage precheck/credit/generate + fail_code) 3분기 · **`download_fail`**(credit/server + HTTP 코드) |
| `public/thankyou.js` | `download_complete`→**`thankyou_view`** (새로고침마다 중복되던 수령 카운트 차단) |
| `public/shared.js` | purchase에 `items`(credits_N, price=실결제액)·`credits_added` — GA4 수익화 품목 보고서 활성 |
| `public/modules/gate.js` | 기존 사용자 로그인 **`login`** 신설, sign_up에 `service` |

이벤트 지도(변경 후): `spec_select → photo_upload(capture_mode) → generate_click → preview_view | generate_fail → download_click → download_complete | download_fail → thankyou_view` / 결제 `begin_checkout(charge 1곳) → pay_widget_open → pay_confirm_click → purchase | pay_fail` / 인증 `sign_up · login` / 유입 `ai_referral_landing`.

겹침 확인: 쌍아 crop fit 1단계(`crop.js`·`server.js`)와 파일 겹침 없음. crop.html은 GA 블록 교체 1곳만.

## 3. 검증 (dev, 2026-11-06 00:17~00:19 KST)

- **dev 배포**: `./deploy.sh dev --yes` → `monkos-idphoto-kr-dev-00008-mrn` (prod `monkos-idphoto-kr-00212-tl6` 불변).
- **2회 히트(1차 버림)**: dev `/prep` 2차 응답에 `ga-init.js` 참조 1건 · `/ga-init.js` 200, `Cache-Control: no-cache, no-store`, 본문에 traffic_type·ignore_referrer 5건. **대조군** prod `/prep`은 구 인라인 `gtag('config', 'G-JPZWSJ3323');` 1건(미반영 정상).
- **브라우저 실측(Chrome, dev)**: `?monk_internal=1` 진입 → localStorage `monk_internal=1`, config 파라미터 `{traffic_type:'internal', debug_mode:true}`, 실제 수집 요청(`/g/collect`) 쿼리에 **`tt=internal` · `ep.debug_mode=true`** 실림. `?monk_internal=0` → 플래그 제거(호스트가 `-dev-`라 internal은 유지 = 설계대로). 복귀 리퍼러 매처: 토스·카카오·네이버·구글·애플 5/5 참, `evil-kakao.com`·`monk.kr`·빈값 3/3 거짓. `ignore_referrer` 지정 이벤트의 수집 요청에 **`ir=1`** 실림(스모크 이벤트 `monk_ga_smoke`, 보고서엔 internal로 표식됨).
- **속성 실데이터**: `run_realtime_report` eventName×minutesAgo — dev 방문 page_view·session_start·first_visit 수신(5~6분 전 행). 수신 자체는 정상, 보고서 제외는 필터 B 활성 뒤.
- **재현 안 된 가설**: index.html user_id 재config가 page_view를 추가 발화한다는 추정은 dev 실측에서 재현되지 않음(재config 후 collect 0건). `send_page_view:false`는 방어적 변경으로 유지.
- **미검증**: 실결제(purchase items)·실수령(download_complete 신규 위치)·generate_fail은 dev 테스트 키·크레딧 동선이 필요 — prod 반영 후 첫 실거래에서 `run_report`로 확인한다. 헤드리스 수신 0 문제(쌍아 15:56)는 이번 실측에서 **Chrome 실브라우저 수신 정상** — 헤드리스 차단은 gtag 로더가 봇 UA에서 수집을 안 보내는 쪽이 유력, 실기기로 보면 된다.

## 4. GA 관리 권한이 필요한 항목 — 작가님 결정

서비스 계정(yong-a, MCP 읽기용)은 속성 **뷰어**라 Admin API 쓰기가 403. 아래는 작가님 계정에서만 가능하다.

| # | 항목 | 왜 | 어디서 |
|---|---|---|---|
| A | 커스텀 측정기준 10종 등록(이벤트 범위): `capture_mode` `auth_method` `gate_reason` `fail_stage` `fail_code` `ai_engine` `in_app` `lang` `method` `signup_source` | 등록 전 수집분은 소급 안 됨 — 빠를수록 이득 | 관리 → 맞춤 정의 → 맞춤 측정기준 만들기 |
| B | 데이터 필터 `Internal Traffic`(traffic_type=internal) **Active** + `Developer Traffic` 생성·Active | 코드가 붙인 표식을 보고서에서 빼는 스위치. 필터 적용은 영구(과거 소급 없음) | 관리 → 데이터 수집 및 수정 → 데이터 필터 |
| C | 데이터 보존 2개월 → **14개월** | 퍼널 탐색이 분기 단위로 가능해짐. 무료 | 관리 → 데이터 보존 |
| D | 원치 않는 리퍼러에 `tosspayments.com` `kakao.com` `naver.com` 추가 | 코드의 ignore_referrer와 이중 안전망(구 캐시 페이지 대비) | 관리 → 데이터 스트림 → MONKOS AI → 태그 설정 → 원치 않는 리퍼러 |

**닫힌 대안**: ① 작가님이 A~D를 UI에서 직접(약 10분) ② SA `yong-a-orchestrator@monkos.iam.gserviceaccount.com`에 속성 521406894 **편집자** 1회 부여 → 민아가 A·C를 API로 즉시 집행하고 이후 측정기준 추가도 자동화(B·D는 API 미제공, UI 필요). **권고 ②** — GA 속성에 한정된 권한이고 되돌리기 쉽다. 결정 전까지 파라미터는 수집만 된다.

## 5. 배너 QR 출처 — 꾸 결정(경로 ④)

현행 QR은 UTM이 없어 direct에 섞인다. 제안 URL(QR 재생성만, 배포 없음):
`https://idphoto-kr.monkos.ai/?utm_source=monk_studio&utm_medium=qr&utm_campaign=banner_hanam&utm_content=front`
대안: `monk.kr/qr/idphoto` 단축 리다이렉트(MONK_kr `_redirects` + monk.kr 배포 승인 필요 — 인쇄물 URL이 짧아지는 대신 배포 1회). 권고: 전자(지금), 후자는 다음 인쇄 때.

## 6. 남은 일 · 배포

- **prod 미배포.** 이 변경은 막내8 업로드 열기(6e22b163)와 같은 main이라 prod 배포 시 함께 나간다 → 쌍아 2번(무료 생성 노출 확대 방지)과 묶어 작가님 '배포 승인' 1회. prod 반영 전까지 라이브 속성 데이터는 구 이벤트 이름 그대로.
- prod 반영 후 민아 재검증: 2회 히트 + `run_report(hostName=idphoto-kr.monkos.ai, eventName in [download_click, thankyou_view, login])` 실데이터 + DebugView(작가님 폰 `?monk_internal=1`로 1회 진입 후).
- 작가님 폰·iMac 브라우저는 prod 반영 후 `https://idphoto-kr.monkos.ai/?monk_internal=1` 1회 열기 → 이후 테스트가 internal로 표식(필터 B가 Active일 때 보고서 제외).

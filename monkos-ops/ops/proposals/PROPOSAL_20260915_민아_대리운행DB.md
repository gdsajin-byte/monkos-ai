---
type: proposal
date: 2026-09-15
device: iMac
agent: 민아
portfolio: PF_ANCHOR
subject: "대리 운행 DB — 동선·ETA·복귀 교통·콜 빈도 축적 (DRIVING_RULES 정량화)"
status: 제안
---

**[2026-09-15 13:10 KST]** iMac/민아 → 작가님 (사후 쌍아 추인)

# 대리 운행 DB 제안 — 작가님 09-15 요건

## 0. 요건 (작가님 원문 5항)
1. 내 위치에서 최선 이동 동선 + 실시간 교통 반영 예상 운행시간
2. 연계 이동수단 체크
3. 지역별·시간대 콜 빈도 + 자주 이동하게 되는 동선
4. 주변 대중교통 막차·첫차
5. 현위치에서 원하는 방향 버스·지하철이 몇 시에 도착하는지

> 이미 `PF_ANCHOR/DRIVING_RULES.md`에 정성 지식(수락 3줄 규칙·시간대 동선·동네 판정)이 축적됨. 본 DB는 그 문서의 **정량 기반**이다. 규칙은 DRIVING_RULES가 정본, 수치는 DB가 정본.

## 1. 원칙
- **폰 없이 시작한다.** 콜 자동 수집(안드로이드 단말)은 10월. 그 전에 교통·복귀 질의(1·2·4·5)는 오늘부터 가능하고, 콜 로그(3)는 수동 기록으로 시작한다.
- **인터페이스 = 텔레그램 봇** (작가님 운영 철학: 텔레그램=신경계). 현장에서 한 손으로 쓴다. 위치는 텔레그램 위치 공유 1탭.
- **외부 API는 부품**: 경로·ETA·대중교통은 공공·상용 API를 조합하고, 우리 자산은 **로그와 집계**다.

## 2. 데이터 모델 (Firestore, 접두사 `daeri_`)

| 컬렉션 | 1행 = | 핵심 필드 |
|---|---|---|
| `daeri_calls` | 화면에 뜬 콜 1건 (수락 여부 무관) | ts, app(로지/콜마너/아이콘/카카오/티맵), origin{addr,lat,lng,zone}, dest{…}, fare, dist_km, exposed_sec(노출~소멸), accepted, by_me |
| `daeri_trips` | 내 운행 1건 | call_id, pickup_ts, start_ts, end_ts, revenue(실수익), approach{mode,min,cost}, return{mode,min,cost}, next_call_gap_min, hourly_net(계산) |
| `daeri_positions` | 위치 핑 | ts, lat, lng, state(대기/접근/운행/복귀/휴식), source(텔레그램/단말) |
| `daeri_zones` | 존 사전 | zone_id, name, polygon or center+radius, DRIVING_RULES 판정(출발◎/도착✕…), notes |
| (집계 뷰) `daeri_agg_zone_hour` | 존×요일×시간 | call_cnt, avg_fare, avg_exposed_sec, my_accept_rate, avg_return_min — 야간 배치 산출 |
| (집계 뷰) `daeri_agg_flows` | 출발존→도착존 | cnt, avg_fare, avg_return_min, best_return_mode |

- 수익 표기: 카카오 화면 **작은 글씨=수익**을 revenue로 (DRIVING_RULES §1).
- 시급 계산: `hourly_net = revenue / (approach.min + 운행 + return.min) × 60` — 수락 기준 2만의 정본 산식.

## 3. 질의 → 데이터 소스

| 요건 | 질의 | 소스 (후보, 실측 후 확정) | 비고 |
|---|---|---|---|
| 1 | 현위치→목적지 자동차 ETA(교통 반영) | TMAP 경로 API(SK open API) 또는 카카오모빌리티 길찾기 | 둘 다 실시간 교통 반영. 무료 쿼터 실측 |
| 2·4·5 | 현위치→복귀지 대중교통 경로 + 막차·첫차 | **ODsay 대중교통 API**(경로·막차 포함, 전국) | 1순위. 무료 1,000콜/일 |
| 5 | 현위치 주변 정류장, 방향별 다음 도착 | 공공데이터포털 TAGO 버스 도착정보 + 경기 GBIS + 서울 지하철 실시간 도착(서울열린데이터) | 하남·광주·성남·서울 동부 커버 |
| 2 | 택시 예상 요금·심야 할증 | TMAP/카카오 택시 요금 추정 | 복귀비 40%·접근 20% 규칙의 입력 |
| 3 | 존×시간 콜 빈도 | `daeri_calls` 집계 | 폰 전엔 수동 기록 |
| 3 | 자주 가는 동선 | `daeri_trips` origin→dest 집계 | |
| — | 주소↔좌표 | 카카오 로컬 API (KAKAO_REST 보유) | 기존 시크릿 재사용 |

## 4. 텔레그램 봇 명령 (MVP)

| 명령 | 입력 | 응답 |
|---|---|---|
| 위치 공유(핀) | 현위치 | **주변 정류장 3곳 + 원하는 방향(사무실/집/시내) 다음 도착 2편 + 막차까지 남은 시간** |
| `/go 목적지` | 텍스트 | 자동차 ETA(교통 반영) + 도착지에서 복귀 옵션(대중교통 시간·택시 요금) + **시급 즉산**(요금 입력 시) |
| `/call 앱 출발 도착 요금` | 수락 콜 | `daeri_calls`+`daeri_trips` 생성, 타이머 시작 |
| `/end` | 운행 종료 | 복귀 옵션 자동 제시 + 실수익·복귀 방식 입력 요청 → 시급 확정 |
| `/skip 앱 출발 도착 요금` | 거른 콜 | `daeri_calls`(accepted=false) — 빈도 데이터용, 선택 사항 |
| `/today` | — | 오늘 콜·수익·시급·복귀비 합 |
| 야간 배치 | — | 존×시간 집계 갱신, 주 1회 DRIVING_RULES 튜닝 제안(민아 소관) |

## 5. 단계

| 단계 | 시점 | 내용 | 실행 |
|---|---|---|---|
| P0 | 이번 주 | 봇 + ODsay/TAGO/TMAP 연동(요건 1·2·4·5) + 수동 콜 기록 | 막내 1세션 (지시서: 쌍아 또는 [예외] 민아) |
| P1 | 10월 안드로이드 | 콜 단말 읽기 전용 수집기 → `daeri_calls` 전량 자동 | 막내 1~2세션, 폰 실측 선행 |
| P2 | P1 +3주 | 집계 뷰·수요 지도·자동 수락 조건 튜너 권고 | 민아 |

## 6. 선결 사항 (작가님)
1. **API 키 3종** — `secret` 커맨드로 등록 요청 예정: ODsay(odsay.com 무료), 공공데이터포털 TAGO(data.go.kr 무료), TMAP appKey(openapi.sk.com 무료). 발급 후 `secret add` 실행.
2. **봇 선택** — CS 봇(@monkos_support_bot) 재사용 금지(고객 채널). `TELEGRAM_TEAM_BOT_TOKEN`은 인벤에 ⭐누락 → 신규 봇 1개(@BotFather) 발급 후 등록.
3. **데이터 위치 승인** — monkos Firestore에 `daeri_` 접두사 컬렉션(개인 운영 데이터가 제품 DB에 동거). 대안: 별도 Firestore DB 인스턴스. 민아 권고 = 접두사 동거(운영 단순), 작가님 판정.
4. **실행 경로** — 쌍아 무활동 중이면 민아 경로 ③ 범위 초과(신규 파이프라인)로 `[예외]` + COMPLETION 요건 충족 후 막내 위임.

## 7. 성공 지표
- P0 2주: 복귀 결정 시 봇 응답 사용률, "복귀 불가 동" 오착지 0건.
- P2: 시간대별 대기 위치를 데이터로 바꾼 뒤 평균 시급(1.7만 계획선) 대비 상승폭.

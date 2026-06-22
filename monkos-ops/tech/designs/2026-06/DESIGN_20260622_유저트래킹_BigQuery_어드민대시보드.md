---
type: design
date: 2026-06-22
device: iMac
agent: 민아
portfolio: PF_PORTAL
status: 기안
---

# 설계서: 자체 유저 트래킹 + BigQuery 적재 + 실시간 어드민 대시보드

> **[2026-06-22 16:00 KST]** iMac/민아 → 작가님
> 원천: [PROPOSAL_20260622_쌍아_자체유저트래킹_실시간대시보드.md](../../ops/proposals/PROPOSAL_20260622_쌍아_자체유저트래킹_실시간대시보드.md) (쌍아 기안 → 민아 설계 위임)
> 정합 기준: [DESIGN_20260622_포털_언어결제분기_GCS스키마_통합설계.md](DESIGN_20260622_포털_언어결제분기_GCS스키마_통합설계.md) (쌍아)
> 작가님 결정(6/22): **① 저장 인프라 = BigQuery 처음부터 ② 결제 블로커는 분리(이미 d3e7df30 처리 완료)**

---

## 1. 목표 — 한 줄

**포털+전 서비스의 모든 페이지에서 유저 행동을 자체 수집해 BigQuery에 적재하고, 어드민에서 ① 결제 유저 식별 ② 유저별 타임라인 ③ 동선 ④ 비가입자 추적 ⑤ 실시간을 본다.**

제안서가 실측한 동기 케이스: `kakao_4817724214`(map3939) — 3/27 가입 → 87일 공백 → 6/21 재방문 결제. 이 리텐션 전환 스토리를 **수동 조사 없이** 어드민에서 즉시 재구성하는 것이 목표.

## 2. 현 인프라 진단 (조사 실측)

| 자산 | 현황 | 설계 함의 |
|---|---|---|
| GA4 gtag (클라) | page_view + `ai_referral_landing` + `sign_up`(Google만) | 집계만, 유저단위 X. 보조로 유지 |
| `transactions` 컬렉션 | 크레딧 원장 잘 정규화(userId/amount/type/provider/createdAt) | **매출/전환 정본 재활용** |
| `payments` 컬렉션 | 결제 원시기록(orderId 멱등) | 매출 보강 |
| `users` 컬렉션 | 가입/크레딧/lastLogin | 유저 마스터 |
| **전용 `events` 컬렉션** | **없음** | 신설 필요 → BigQuery로 |
| **sessionId(익명)** | **없음**. 로그인 유저만 `monkos_session` 쿠키 | **익명 세션 쿠키 발급 신설** |
| **헤드샷 퍼널 계측** | **0건**. upload/style/generate 단계 있으나 비계측 | **최대 공백 — 최우선 적재 대상** |
| 어드민 대시보드 | users **전수 스캔** 집계 + GA4 traffic | 결제유저 식별 불가, 동선 없음. 확장 |
| `server.js:76` createServer | 모든 요청이 지나는 **단일 핸들러** | **서버단 page_view 단일 삽입점** |
| BigQuery | 포털 연동 코드 전무. `monk-data-factory` 프로젝트에 BQ 보유(감사문서) | 의존성·데이터셋부터 신설 |

## 3. 아키텍처 개요

```
[클라이언트]                    [서버 portal]                    [BigQuery]
 비콘(sendBeacon) ──┐
                    ├─► POST /api/track ──► 검증·보강(ua/ip/ts) ──► insertAll(streaming)
 SSR page_view ─────┘            │                                      │
 (createServer 핸들러)          서버 전환이벤트                          ▼
                          (login/signup/charge/use/generate)   monkos_tracking.events
                                 │                              (파티션:event_date)
                                 ▼                                      │
                          익명 sessionId 쿠키 발급              ┌────────┴────────┐
                          가입 시 user_id 매핑 적재              │                 │
                                                         [어드민 대시보드]   [분석/리포트]
                                                         BQ 쿼리 + transactions + GCS
```

**원칙**
- 수집 정본 = **BigQuery 단일 스트림 테이블**(GA4 스타일 wide event). Firestore는 운영 데이터(users/transactions) 그대로 유지, 이벤트는 BQ로 분리.
- 적재는 **streaming insert(`insertAll`)** — 스트리밍 버퍼로 즉시 쿼리 가능(실시간성 확보).
- 클라 이벤트는 `navigator.sendBeacon` → `/api/track`(서버가 BQ insert 대행). 클라가 BQ 직접 못 쓰게 함(키 노출 방지, 헌법 4조).

## 4. 수집 이벤트 스키마 (확정)

### 서버단 (createServer 핸들러 + 비즈니스 로직)
| 이벤트 | 시점 | 핵심 params |
|---|---|---|
| `page_view` | 모든 SSR 렌더 | path, lang, region, referer, ua |
| `auth_login` | 로그인 성공 | provider, session_id(머지 트리거) |
| `auth_signup` | 가입(전 provider) | provider, email_hash |
| `credit_charge` | 결제 확인 | amount, provider(toss/lemon), credits, order_id |
| `credit_use` | 크레딧 사용 | amount, use_type(generate/download), service |
| `api_generate` | AI 생성 요청 | service(idphoto/headshot), style, input_size |

> ⚠️ 현 `sign_up` gtag가 **Kakao/LINE 누락** — 서버단 `auth_signup`은 전 provider 커버하여 이 공백 해소.

### 클라이언트단 (sendBeacon)
| 이벤트 | 시점 | params |
|---|---|---|
| `click_cta` | CTA 클릭 | button_id, page |
| `upload_image` | 사진 업로드 | page, file_size, resized_size |
| `select_style` | 스타일 선택 | style, page |
| `open_credit_shop` | 충전 모달 오픈 | current_credits, page |
| `start_payment` | 결제 시작 | package, amount |
| `session_end` | 이탈/탭닫기 | last_page, duration |

> **헤드샷 퍼널(upload→select_style→api_generate)이 1순위.** 계측 0인 최대 공백이자 전환 분석의 핵심.

### 비가입자 추적 + 머지
- 첫 방문 시 `createServer` 핸들러가 `monkos_sid`(UUID v4) 쿠키 발급(없을 때만). Max-Age 2년, SameSite=Lax, Domain=.monkos.ai.
- 모든 이벤트에 `session_id` 포함. 로그인 전에도 동선 추적.
- **머지**: `auth_login`/`auth_signup` 시 `events`에 `(session_id → user_id)` 매핑 행을 적재. BQ는 행 UPDATE가 비싸므로 **소급 변경 대신 조회 시 조인**(session→user 매핑 테이블 `identity_map`)으로 해결.

## 5. BigQuery 데이터 모델

**프로젝트/데이터셋**: `monk-data-factory` 활용 검토(감사문서상 BQ 보유) vs `monkos`에 신설 — §10 결정필요.
**위치**: `asia-northeast3`(서울) 권장(레이턴시/주권).

### 테이블 `events` (단일 wide 스트림)
| 컬럼 | 타입 | 비고 |
|---|---|---|
| event_id | STRING | UUID, 멱등 |
| event_name | STRING | 위 12종 |
| event_timestamp | TIMESTAMP | |
| event_date | DATE | **파티션 키** |
| user_id | STRING | NULL 허용(익명) |
| session_id | STRING | `monkos_sid` |
| page_path | STRING | |
| lang | STRING | ko/ja/en (쌍아 detectLang 주입값) |
| region | STRING | kr/global (쌍아 detectPaymentRegion 주입값) |
| service | STRING | portal/idphoto/headshot |
| referer | STRING | |
| user_agent | STRING | |
| params | JSON | 이벤트별 가변 필드 |

- **파티셔닝**: `event_date`(일) — 스캔 범위 최소화(비용 핵심).
- **클러스터링**: `user_id, event_name` — 유저 타임라인/이벤트 필터 가속.

### 테이블 `identity_map`
| 컬럼 | 타입 |
|---|---|
| session_id | STRING |
| user_id | STRING |
| linked_at | TIMESTAMP |

→ 익명 동선을 가입 후 user_id로 잇는 조인 키. (소급 UPDATE 회피)

> lang/region/service는 쌍아 통합설계서의 서버 주입값(`window.__LANG__`/`__REGION__`)을 그대로 받는다 — **양 설계 정합점.**

## 6. 적재 파이프라인

- **엔드포인트** `POST /api/track`: body = `{events:[...]}`. 서버가 ip(x-forwarded-for)·ua·timestamp 보강 후 `bq.dataset('monkos_tracking').table('events').insert(rows)`.
- **배치/논블로킹**: 요청당 BQ 호출이 응답을 막지 않도록 fire-and-forget(에러는 Cloud Logging). page_view는 createServer에서 비동기 발사.
- **클라 비콘**: `sendBeacon('/api/track', blob)` — 이탈 시에도 유실 최소. 인증 불필요(익명 포함), 단 rate-limit + payload 화이트리스트(event_name 검증)로 오염 방지.
- **의존성**: `@google-cloud/bigquery` 추가. SA는 `roles/bigquery.dataEditor` (SECRET_INVENTORY 확인 후 기존 SA 재사용 검토).

## 7. 어드민 대시보드 확장

기존 `dashboard.js`/`dashboard.html` + `requireAdmin` 가드 **재사용**.

### 7-1. 유저 목록 (기존 확장)
- 칼럼 추가: **총 결제액 · 최근 결제일 · 결제 횟수 · 생성 횟수 · 최근 활동**
- 소스: `transactions`(매출 집계) + BQ `events`(최근활동/생성수) 조인
- 필터: 결제유저만 / 비결제 / 최근 N일 활성 → **결제 유저 즉시 식별**(현재 불가 해소)
- ⚠️ 현 전수 스캔 한계: 유저 증가 대비 **집계 캐시**(일 1회 BQ 집계 → Firestore `user_stats` 머티리얼라이즈) 권장

### 7-2. 유저 상세 (신규)
```
kakao_4817724214 | map3939@naver.com | kakao | 가입 03/27 | region:kr lang:ko
[타임라인]  ← BQ events WHERE user_id OR session_id IN (identity_map)
03/27 15:12 signup → idphoto 진입 → 생성 → 이탈
 ── 87일 ──
06/21 12:30 재방문 → headshot → 결제 ₩9,900 → 생성 → 다운로드
[GCS]  headshot/kakao_4817724214/ ...  ← 쌍아 GCS 스키마 {service}/{userId}/ 리스팅
[크레딧]  현재 0c | 충전 80c | 사용 80c  ← transactions
```
- 3개 소스 조인: BQ 타임라인 + GCS 파일 리스팅(쌍아 스키마) + transactions 원장

### 7-3. 실시간 뷰 (신규)
- 현재 활성 유저 수 + 페이지 분포 + 최근 이벤트 스트림(가입/결제/생성 하이라이트)
- 소스: BQ streaming 버퍼 최근 5분 쿼리(`WHERE event_timestamp > ...`). 폴링 15~30s.
- ⚠️ **BQ는 분석DB라 초단위 실시간엔 약함.** 현재활성 카운터는 경량 보조(Firestore `active_now` TTL 문서 or 메모리) 검토 — §10 결정.

## 8. 쌍아 통합설계서와의 정합

| 접점 | 쌍아 설계 | 본 설계 수신 |
|---|---|---|
| 언어 | 서버 detectLang → `__LANG__` | `events.lang`에 적재 |
| 결제권역 | geoip → `__REGION__` | `events.region`에 적재 |
| GCS 경로 | `{service}/{userId}/{ts}_{style}_{type}` | 유저상세 파일 리스팅 키 |
| 결제 returnUrl | d3e7df30 완료 | `start_payment`/`credit_charge`로 전환 계측만 |

→ 두 설계는 **충돌 없이 보완**. 쌍아=흐름/분기, 민아=관측/적재.

## 9. 구현 단계 분할 (막내 지시서 단위)

| 단계 | 내용 | 의존성 | 우선순위 |
|---|---|---|---|
| D1 | BQ 데이터셋/테이블(events·identity_map) 생성 + `@google-cloud/bigquery` + SA 권한 | 프로젝트 확정(§10) | 높음 |
| D2 | `/api/track` 엔드포인트 + `monkos_sid` 쿠키 발급(createServer) | D1 | 높음 |
| D3 | 서버단 page_view + 전환이벤트(login/signup/charge/use/generate) 적재 | D2 | 높음 |
| D4 | **헤드샷 퍼널 클라 계측**(upload/select_style/api_generate) + sendBeacon | D2 | **최우선** |
| D5 | 어드민 유저목록 확장(결제유저 식별) + 집계 캐시 | D3 | 중간 |
| D6 | 어드민 유저상세 타임라인(BQ+GCS+transactions 조인) | D3,D5 | 중간 |
| D7 | 실시간 뷰 + 익명→가입 머지(identity_map 조인) | D3 | 중간 |

## 10. 결정 필요 / 리스크

1. **BQ 프로젝트**: `monk-data-factory`(기존 BQ) vs `monkos`(포털과 동일 프로젝트, 권한 단순) — **작가님 결정.** 권장: 포털 SA 권한·레이턴시상 `monkos` 신설이 단순.
2. **실시간 정밀도 vs 비용**: 현재활성 카운터를 BQ만으로 갈지(비용·지연) Firestore 보조 둘지. 권장: BQ 정본 + Firestore 경량 `active_now`.
3. **PII 적재 범위**: `email`은 BQ에 원문 적재하지 않고 `user_id`만(어드민 표시는 users 조인). `email_hash`만 이벤트에. (헌법 4조 1·3항)
4. **비콘 오염 방지**: `/api/track`은 익명 허용 엔드포인트 → event_name 화이트리스트 + rate-limit 필수(가짜 트래픽 차단, 헌법 4조 4항).
5. **GA4 중복**: 자체 트래킹 안정화까지 GA4 gtag 병행 유지, 검증 후 역할 분담(GA4=거시 트렌드, 자체=유저단위).
6. **비용 가드**: streaming insert + 쿼리 비용. 파티션/클러스터 필수, 대시보드 쿼리는 일자 범위 강제.

## 11. 다음 액션
- 본 설계서 **쌍아 검수** → 작가님 승인 → **§10 결정(특히 BQ 프로젝트)** → D1~D7 막내 지시서 분리 발행.
- D4(헤드샷 퍼널 계측)는 의존성 적고 전환 분석 가치 최대 → **선행 후보**.

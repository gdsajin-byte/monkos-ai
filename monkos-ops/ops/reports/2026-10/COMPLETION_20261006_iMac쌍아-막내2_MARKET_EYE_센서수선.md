---
type: completion
date: 2026-10-06
device: iMac
agent: 막내2
order: monkos-ops/ops/orders/2026-10/ORDER_20261006_iMac쌍아_막내_MARKET_EYE_센서수선.md
portfolio: PF_MARKET_EYE
status: 완료
---

# COMPLETION — 마켓아이 센서 수선

**[2026-10-06 16:37 KST]** iMac/막내2 → 작가님·쌍아

출처: 작가님 2026-10-06 16:17 '투입'(iMac VSCode 쌍아 세션 사람 입력 턴) — 경로① 직접 전달.
브랜치 `worktree-makne2-market-eye-sensor` (커밋 f31f78fe + 자동 브리핑 460f575c + 본 보고 커밋). **main 미병합** — §7.

> 경로 메모: 지시서는 `ops/completions/2026-10/`를 지정했으나 ch4 정본 위치(`ops/reports/YYYY-MM/`)와 10월 기존 COMPLETION 관행에 맞춰 여기에 둔다.

## 1. 완료 기준 대조

| 기준 | 결과 | 근거 |
|---|---|---|
| W1 7/1~현재 결측 0 | ✅ 아래 표. 남은 날은 정상 지연 창 안 | BQ 재측정 16:36 |
| W2 코드 내 키 문자열 0 | ✅ `grep` 0건 (키 값으로 `git grep` — 코드 외 문서 4건은 §3) | keyscan |
| W2 로그 마스킹 실증 | ✅ dispatch 로그 원문 키 0줄 · 단위 시험 3패턴 `***` | run 37430379813 |
| W2 타임아웃 원인 판정 | ✅ 러너 측 **간헐** 연결 불가 (§3) | 보존 로그 97회 스윕 |
| W2 노출 범위 보고 | ✅ §3 | |
| W3 `ga4_daily_dims` 적재 | ✅ 7/1~10/4 96일 2,687행 | 로컬 실행 |
| W3 경보가 9월 사례를 잡는지 | ✅ 싱가포르·localhost 모두 검출 (§4) | GA4 실조회 시험 |
| W4 Anthropic 최신 기사 날짜 | ✅ **2026-10-02** (공식 /news 파싱) | BRIEFING_20261006 (dispatch) |
| W4 trends 결손 원인 | ✅ pytrends 429 — 재수집 2행 완료, 10월 7/7 | 10-01 run 로그 |
| `workflow_dispatch` 1회 성공 | ✅ run 37430379813 success (16:33~16:36 KST) | |
| COMPLETION·커밋·푸시 | ✅ 본 문서 | origin SHA §7 |

## 2. W1 — 결측 백필

| 테이블 (7/1~10/5) | 전 | 후 | 남은 날 |
|---|---|---|---|
| `gsc_daily` | 24일 | 2일 | 10-04·10-05 = GSC 지연 창(오늘-3일 이후), 다음 실행이 수집 |
| `ga4_daily` | 23일 | 0일 | — |
| `ga4_daily_dims` (신규) | — | 1일 | 10-05 = GA4 지연 창(오늘-2일 이후) |

- **D1 근본 원인 (신규 실측)**: GitHub 예약 실행이 UTC 20:00 대신 21:42~01:00에 기동한다. 기존 수집기는 러너 시각 기준 "UTC 어제/3일 전"을 대상일로 잡아서, 기동이 UTC 자정을 넘으면 대상일이 하루씩 밀리거나 겹친다(예: UTC 10-05에 실행 0회 → 10-04 누락). → 대상일을 **KST 기준 창**으로 바꾸고, 창 안의 **없는 날짜만** 수집한다(GSC 14일·오늘-3일까지 / GA4 10일·오늘-2일까지 — 처리 중인 부분 집계를 영구 적재하지 않게).
- 재적재 방지: `_loader.getMissingDates` = 파라미터 조회 + **대조군(리터럴 COUNT)** 불일치 시 적재 중단.
- GSC 16개월 보존 한계: 7/1 백필은 한계 안. dispatch에서 7/1~7/17 포함 22일 3,052행 수집 성공.
- 기존 GSC 수집기는 25,000행에서 잘렸다 → `startRow` 페이지 순회 추가.

## 3. W2 — bizinfo 키

- **GitHub 시크릿 `BIZINFO_API_KEY` 없음** (`gh secret list` 실측). 그래서 지금까지 코드 기본값(하드코딩 키)이 항상 쓰였다. **만들지 않았다** — 미설정이면 브리핑이 `🔴 정부자금 수집 실패 — BIZINFO_API_KEY 미설정`으로 건너뛴다(dispatch 실증). **등록 전까지 정부자금 뉴스는 비어 있다.**
- 마스킹: `mask_secrets()` — `crtfcKey|apikey|api_key|key|token|access_token=` 값을 `***`로. 브리핑의 모든 예외 출력에 적용.
- 다른 수집기 전수: Bing(`apikey=` URL)·PageSpeed(`key=` URL)는 GitHub 시크릿이라 Actions가 자동 `***` 처리 — 보존 로그 97회에서 원문 0건. Naver는 헤더 전송, Telegram 토큰은 시크릿. `scripts/tools/seo_collectors.py`의 예외 출력은 지시서 수정 범위 밖이라 그대로 둠(시크릿 자동 마스킹이 유일한 방어 — 💡 §8).
- **타임아웃 진단**: iMac → API 200(0.09초). 러너 → **간헐적** 연결 타임아웃(보존 로그 97회 중 39회, 07-08~10-06, 나머지는 정상 수집). 해외 IP 전면 차단은 아니다. 수선: 연결 단계 3회 재시도(5·10초 간격, connect 10초) + 연결 불가 판정 시 나머지 키워드 반복 없이 즉시 중단(기존은 6키워드×15초 타임아웃을 매번 소진). 재시도로도 부족하면 대안 = bizinfo 수집만 iMac launchd로 옮겨 BQ/파일 적재 — **결정 대기**.
- **노출 범위** (키 6자, 값은 보고하지 않음):
  - git 추적 파일 5건 → 코드 1건 제거, 남은 4건은 기록 문서(BRIEFING_E2E_20260710, ORDER/REPORT_20260511 2건, 2026-07-28 웹 민아 세션 로그 — append-only라 수정 불가)
  - git 이력: 첫 도입 2026-05-11 커밋 e8f6526c 외 4건. 레포 **PRIVATE**
  - Actions 로그: **39회 실행 · 234줄 평문** (07-08~10-06, 타임아웃 경고가 URL을 그대로 찍음). 보존 로그 97회 기준, 그 전 65회는 로그 만료로 확인 불가
  - 재발급 필요 여부 = 작가님 판단. 막내2 의견: 공공 API 인증키이고 노출은 비공개 레포·로그 안으로 한정되지만, 등록을 어차피 새로 해야 하니 **재발급 후 새 키를 등록**하는 편이 비용이 거의 같고 이력이 깨끗하다.

## 4. W3 — GA4 차원·이상 경보

- 신규 테이블 `monkos.market_eye.ga4_daily_dims` (date 일 파티션): country · host · landing(언어 접두 en/ja/es/zh/ko 제거 1단) · source × active_users · sessions · engaged_sessions · avg_duration(세션 가중). `active_users`는 랜딩 정규화 합산이라 상한 근사. `_loader.js` SCHEMAS 등록.
- 경보는 BQ를 거치지 않고 브리핑에서 GA4 7일 합계를 직접 조회한다(정확한 고유 사용자 수, 적재 실패에 의존 안 함). 판독 실패도 🟡 줄로 노출.
- **과거 데이터 시험** (GA4 실조회, `detect_traffic_alerts`):

| 7일 창 | 봇 의심 | 비운영 호스트 |
|---|---|---|
| 09-01~07 | — | monk-kr.pages.dev |
| 09-08~14 | — | monk-kr.pages.dev |
| **09-15~21** | **🟡 Singapore × (direct) 102명·참여율 1.0%** | **127.0.0.1 · localhost** · monk-kr.pages.dev |
| 09-22~28 | — | localhost(세션 18) · monk-kr.pages.dev |
| 09-27~10-03 | — | localhost(25) · monk-kr.pages.dev · monkos-ai.translate.goog · idphoto-kr-dev run.app |

  같은 판독을 `ga4_daily_dims`로도 재현(09-15~21 싱가포르 참여율 0.01).
- 💡 `monk-kr.pages.dev`(CF Pages 기본 도메인)·`*.translate.goog`(구글 번역 프록시)·dev run.app 도 규칙상 "비운영"으로 잡혀 매일 1~4줄 나온다. 소음이면 허용 목록에 넣을지 결정 필요.

## 5. W4 — 피드·트렌드

- Anthropic: 공식 RSS 없음(`/rss.xml`·`/news/rss.xml`·`/feed.xml` 404, 대조군 `/news` 200). → `https://www.anthropic.com/news`를 파싱(`a[href^=/news/]` 안의 `<time>`과 제목 — 해시 클래스명 미의존). 0건이면 예외로 🔴. 최신 **2026-10-02** 확인.
- google_trends 10월 결손 = `pas foto/ID`·`증명사진/KR`이 **pytrends 429**(10-01 run 로그) — stdout 경고만 남고 알림은 없었다. 수선: 429·타임아웃 3회 재시도(30·60초) + 결손 텔레그램 알림 + 같은 달 이미 적재된 키워드는 건너뛰기 → dispatch `monthly=trends`로 2행만 재수집, **10월 7/7**.
- 💡 `passbild/DE` interest가 8·9·10월 연속 0. 시계열 마지막 점(진행 중인 달, pytrends `isPartial`)을 쓰는 탓으로 **추정**(미실증 — 로컬 pytrends 없음). 의미를 바꾸는 변경이라 손대지 않았다.

## 6. 🔴 자기 사고 — `ga4_daily` 8일 106행 중복

W1 로컬 시험 중 존재 조회 버그(문자열 DATE 파라미터 → NULL)로 이미 있는 8일을 다시 적재했다. 교정·대조군 가드 완료. **롤백 완료(17:25 KST)** — 실행 전 스냅샷으로 8일 복원, 날짜별 행 수 전부 일치 검증.
→ `monkos-ops/ops/incidents/2026-10/INCIDENT_20261006_market_eye_ga4_daily_중복적재.md`

## 7. 브랜치·배포 상태

- 작업 격리 규칙에 따라 워크트리 브랜치에서 작업했고 **main에 머지·푸시하지 않았다**. 다음 예약 실행(main)은 **여전히 구 코드**로 돈다 — 하드코딩 키 사용·결측 재발 그대로. 반영하려면 main 머지 필요(작가님/쌍아).
- 수동 실행 부작용: 브랜치에 BRIEFING_20261006.md 재생성 커밋(460f575c), 이슈 1건 신규 생성 + 오늘 아침 브리핑 이슈 자동 마감, 텔레그램 1건.

## 8. 결정 대기 (실행하지 않음)

1. `BIZINFO_API_KEY` 등록 (재발급 여부 포함) — 작가님 `secret` 경로 + GitHub 시크릿
2. 브랜치 main 머지
3. bizinfo 재시도로도 실패가 이어지면 iMac 실행 이전 여부
4. 비운영 호스트 허용 목록(pages.dev·translate.goog·dev run.app)
5. GA4 내부 트래픽 필터(localhost·작가님 IP) 설정 — 속성 관리 변경이라 제안만
6. `seo_collectors.py` 예외 출력 마스킹(범위 밖)
7. 구 수집기가 남긴 **기존 완전 중복 행 정리** — `ga4_daily` 4일 18행·`gsc_daily` 6일 1,097행(INCIDENT §4). 기존 행 삭제라 지시서 금지 범위 → 승인 시 날짜별 DISTINCT 재구성으로 처리 가능

## 9. 보정 (쌍아 16:57 세션 메시지 — 출처 작가님 16:55 텔레그램 캡처, 지시서 범위 내)

- 보정 1 ✅ 🟡 경보를 🔴 긴급 섹션에서 빼서 별도 `## 🟡 주의` 섹션으로 옮김(브리핑·텔레그램 요약 모두). 긴급이 없으면 "없음"이 그대로 보인다
- 보정 2 ✅ 비운영 호스트를 1줄로 요약: `🟡 비운영 호스트 유입 7일 6명(localhost 3·pages.dev 1·translate.goog 1·dev run.app 1)` — 09-27~10-03 실데이터로 이 문구 그대로 재현. 호스트 문구에 '봇' 표현 없음
- 검증: GA4 실조회 시험(09-15~21·09-27~10-03) + 스텁 렌더링 시험(브리핑 섹션·텔레그램). dispatch 재실행은 하지 않음(지시서 1회 한도) → 실표면 반영은 main 머지 후 다음 예약 실행에서 확인 필요
- GA 태그 운영 도메인 한정: 범위 밖, 손대지 않음

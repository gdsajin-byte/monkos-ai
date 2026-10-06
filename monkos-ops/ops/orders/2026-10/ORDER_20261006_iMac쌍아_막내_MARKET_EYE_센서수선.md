---
type: order
date: 2026-10-06
from: iMac/쌍아
to: iMac/막내 (번호는 투입 시 지정)
device: iMac
agent: 쌍아
subject: 마켓아이 센서 수선 — 결측 백필·GA4 차원 확장·이상 트래픽 경보·bizinfo 키 하드코딩 제거·RSS/트렌드 결손
status: 발행
portfolio: PF_MARKET_EYE
---

# ORDER — 마켓아이 센서 수선

> 출처: 작가님 2026-10-06 15:15 "우리 마켓아이 센서들과 ga4등 막힌 센서가 있는지 추가할것이 있는지 함께 체크하면서 분석해" → 쌍아 15:42 점검 보고(수선 6건 지시서 1건 권장) → 작가님 16:15 "내일 출근해서 처리하는걸로 하고 나머지는"(네이버 서치어드바이저는 10-07 작가님 로그인 후 쌍아가 처리. 나머지 수선은 이 지시서로 정리 — 막내 투입은 작가님 확인 후). iMac VSCode 쌍아 세션 사람 입력 턴.
> 근거 실측: `monkos-ops/ops/sessions/2026-10/2026-10-06_iMac_쌍아.md` 15:42 항목.

## 1. 목적

마켓아이 수집기는 "성공"으로 끝나면서 데이터가 비거나 엉뚱한 트래픽을 놓치고 있다. 9월 트래픽 정체 분석 중 다음이 드러났다. 이 지시서는 그 구멍을 막는다. **네이버 서치어드바이저 센서는 범위 밖**(10-07 별도).

| # | 결함 | 실측 |
|---|------|------|
| D1 | GitHub 예약 실행이 빠진 날을 다시 채우지 않음 | `gsc_daily` 9/25·9/30·10/2 결측, `ga4_daily` 7/1 이후 74/97일 |
| D2 | bizinfo 인증키 하드코딩 + 실행 로그 평문 노출 | `.github/scripts/daily_briefing.py:299` 기본값 `os.environ.get("BIZINFO_API_KEY", "…")`, 실패 WARNING이 키 포함 URL 출력 |
| D3 | bizinfo 6키워드 전량 연결 타임아웃 | 10-06 run 로그 |
| D4 | GA4 수집 차원이 채널·소스·이벤트뿐 | 싱가포르 봇(162명 중 159 direct·참여율 5.7%·0.5초)과 `localhost`·`127.0.0.1` 호스트 트래픽이 브리핑에 안 잡힘 |
| D5 | Anthropic RSS 08-25 이후 정체 | 비공식 미러 피드(`taobojlen/anthropic-rss-feed`) |
| D6 | google_trends 10월 5행(전월 7) | `market_eye.trends_monthly` |

## 2. 범위

**허용**: `scripts/collectors/*` · `.github/scripts/daily_briefing.py` · `.github/workflows/daily-briefing.yml` 수정 · BQ `market_eye` 신규 테이블 1개 생성·백필 적재 · `workflow_dispatch` 수동 실행 **1회**(스모크용)

**금지**
- 신규 시크릿 생성·추측 금지(헌법 4조 1항). bizinfo 키가 GitHub 시크릿에 없으면 **만들지 말고** 보고(등록은 작가님 `secret` 경로)
- 키 교체(재발급)는 작가님 결정 — 필요 의견만 보고
- GA4 속성 관리 설정(내부 트래픽 필터 등) 변경 금지 — 제안만
- 기존 BQ 행 삭제·수정 금지(append만). 백필은 중복 없이

## 3. 작업

**W1 결측 백필 (D1)** — `collect_gsc.js`·`collect_ga4.js`에 "최근 N일(GSC 14일, GA4 10일) 중 테이블에 없는 날짜만 수집" 모드 추가. 기본 실행에 포함한다. 같은 날짜 재적재 금지(적재 전 존재 여부 조회). 1회 실행으로 7/1 이후 결측을 메운다. API가 주는 범위 한계(GSC 16개월)는 확인 후 기재.

**W2 bizinfo 키 (D2·D3)**
- 코드 기본값 제거 → 환경 변수 없으면 bizinfo 수집을 **명시적으로 건너뛰고** `🔴 BIZINFO_API_KEY 미설정` 출력(무음 금지)
- 실패 메시지에서 URL의 `crtfcKey` 값을 가린다(`***`). 다른 수집기도 키가 URL·로그에 찍히는 곳 전수 확인
- 연결 타임아웃 원인 진단: GitHub 러너에서만 막히는지(해외 IP 차단 의심), 로컬 iMac에서는 되는지 대조. 수선 가능하면 수선, 아니면 대안(실행 위치 변경 등) 보고
- 이 키가 git 이력·Actions 로그에 남은 범위 조사 → 보고(재발급 필요 여부는 작가님 판단)

**W3 GA4 차원 확장·이상 경보 (D4)**
- 신규 테이블 `market_eye.ga4_daily_dims` (일자 × country × hostName × landingPage(언어 접두 제거 1단) × sessionSource) — activeUsers·sessions·engagedSessions·averageSessionDuration. `_loader.js` SCHEMAS 등록
- 브리핑 경보 2종: ① 국가·소스 조합이 주 50명 이상인데 참여율 10% 미만 → `🟡 봇 의심` ② 운영 도메인(`monkos.ai`·`*.monkos.ai`·`monk.kr`) 외 호스트 트래픽 → `🟡 비운영 호스트 유입`
- 기존 `ga4_daily`는 그대로 둔다

**W4 피드·트렌드 결손 (D5·D6)**
- Anthropic: 공식 피드 존재 여부 확인 → 있으면 교체, 없으면 대안(공식 뉴스 페이지 파싱 등) 1안 구현
- google_trends 10월 결손 2건: 어느 키워드가 왜 빠졌는지 확인 → 재시도·실패 가시화

## 4. ⚠️ 준수 조항

- **헌법 4조 1·2항** — 키 하드코딩 제거가 목적이다. 새 키를 코드에 넣거나 추측하지 않는다
- **헌법 3조 1·2항** — `date` 실측 타임스탬프, 세션 로그, 완료 보고, PF_MARKET_EYE 히스토리
- **ch5 + live-verify.md 3조** — 0건·실패를 "부재"로 판정하지 않는다. 백필 0건이면 대조군(존재가 확실한 날짜) 1회로 조회 유효성부터 확인
- **도구 3요건(references.md)** — 신규 테이블·경보는 도구 맵 또는 `commands/market-eye.md`에 등재 + 스모크 + 실패 가시화

## 5. 완료 기준

- [ ] W1: 7/1~현재 `gsc_daily`·`ga4_daily` 결측일 0(남으면 사유) — 전후 결측 수 표
- [ ] W2: 코드 내 키 문자열 0(`grep`) · 로그 마스킹 실증 · 타임아웃 원인 판정 · 노출 범위 보고
- [ ] W3: `ga4_daily_dims` 적재 실증 + 경보 2종이 9월 싱가포르·localhost 사례를 실제로 잡는지 과거 데이터로 시험
- [ ] W4: Anthropic 피드 최신 기사 날짜 · trends 결손 원인
- [ ] `workflow_dispatch` 1회 성공 + 수집기 출력 행수
- [ ] COMPLETION `monkos-ops/ops/completions/2026-10/COMPLETION_20261006_…_MARKET_EYE_센서수선.md` + 커밋·푸시(origin SHA 대조)

## 6. 커밋 메시지

```
[fix] 마켓아이 센서 수선 — 결측 백필·GA4 차원·이상 경보·bizinfo 키 하드코딩 제거
```

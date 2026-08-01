---
type: order
date: 2026-08-02
from: iMac/쌍아
to: iMac/쌍아 (직접 실행)
subject: "GA4 자동화 트래픽 표식 + 언노운 계량 체계 — 사후 오더"
status: 완료
portfolio: PF_MARKET_EYE
---

# ORDER(사후 기록) — GA4 자동화 표식 + 언노운 계량

**[2026-08-02 04:20 KST]** iMac/쌍아 → 기록

> **[예외] 쌍아 직접 실행** — 작가님 구두 지시 "직접 처리해"(04:20). 03-17 승인 쌍아 직접수정 프로토콜에 따른 사후 기록.

## 1. 배경

GA4 조회수 +41% 급증의 정체를 추적하던 중, 내부 트래픽 배제 체계가 **07-19 지시서 Task 3에서 "⏳ 작가님 작업"으로 멈춰 있었고** 그 이후 미실행 상태임이 확인됐다. 작가님 질의: "잉크 묻히기가 통상적 해법인가" + "언노운을 정확하게 데이터로 잡아내는 방안이 있나".

**판단**: 사람 트래픽은 IP 규칙(콘솔·작가님 권한), **자동화는 애초에 태그를 안 쏘거나 표식을 다는 것이 업계 표준**이며 후자는 코드로 끝나므로 콘솔 대기 없이 처리 가능하다.

## 2. 실측 — 오염원 정체 (BQ 요청 로그)

`market_eye.run_googleapis_com_requests_20260730` 조회 결과, **우리 내부 자동화가 아니라 외부 스크래퍼**였다.

| IP(마스킹) | 요청 | 고유 URL | 시간대 | 판정 |
|-----------|------|---------|--------|------|
| `158.69.*` | 131 | **131** | 06:39 **1분** | OVH 데이터센터, Chrome UA 위장 |
| `45.88.*` | 214 | 193 | 06:34 1분 | UA 자칭 `pre-filter` 스캐너 |
| `173.244.*` | 395 | 123 | 06:35~17:09 | 데이터센터 대역 |

1분에 131개 고유 URL은 인간 행동이 아니다. GA4 `(direct)/(none)` 10세션·199뷰(pv/s 19.9)의 정체로 판정.

## 3. 변경

| 파일 | 변경 |
|------|------|
| `portal/lib/cms/render-shell.js` | **`gtagSnippet()` 신설 — 전 SSR 표면 계측 단일 정본**. 자동화 판정 3층 + `traffic_type:'internal'` + `automation_hit` 이벤트 |
| `portal/lib/cms/home.js` | 자체 gtag 블록 제거 → 정본 `gtagSnippet()` 사용 |

### 3-1. ⚠️ 이원화 적발 (07-24 홈 navHtml 사건 재발)

1차 수정을 `layoutHead`에만 넣고 dev 검증한 결과 **홈(`/`)에 코드가 없었다.** `home.js`가 자체 gtag 블록을 갖고 있었기 때문이며, **7/30 오염의 랜딩이 정확히 `/`(10세션 201뷰)** 였으므로 가장 중요한 표면이 빠질 뻔했다. 소비처 실측(`feedback_verify_consumer_check`)이 이를 잡았다.

→ 정본 함수로 통합. **부수 효과: 홈에 없던 AI referral 추적이 함께 들어갔다**(종전 홈은 AI 유입 측정 누락 상태).

### 3-2. 자동화 판정 3층

| 층 | 신호 | 잡히는 대상 |
|---|------|-----------|
| ① | `navigator.webdriver === true` | Playwright·Puppeteer·Selenium (웹민아 E2E 등) |
| ② | UA 패턴(HeadlessChrome 등) | 자기 신고형 |
| ③ | `localStorage.mk_internal === '1'` | **cdp.sh 경로 전용** |

③이 필요한 이유: `cdp.sh`는 이미 떠 있는 크롬의 9222 포트에 붙는 방식이라 `--enable-automation`이 없고 **`navigator.webdriver`가 false**다(①로 안 잡힘). 디버그 크롬 프로필에서 1회 세팅하면 영구 유효:

```
scripts/tools/cdp.sh eval "localStorage.setItem('mk_internal','1')"
```

**⚠️ 한계 명시**: 외부 스크래퍼가 UA·webdriver를 위장하면 잡히지 않는다. §2의 오염원이 그 유형이며, **코드 표식으로는 해결 불가**. 그쪽은 §4로 계량한다.

## 4. 언노운 계량 방안 (작가님 질의 답)

**GA4는 IP·UA를 리포트에 노출하지 않지만, Cloud Run 요청 로그는 둘 다 갖고 있다.** 07-21 작가님이 설정한 BQ 싱크로 `market_eye.run_googleapis_com_requests_YYYYMMDD`에 적재 중이며, 이것이 언노운 규명의 정본 데이터다.

행동 지문 기준 — **분당 고유 URL 수**가 가장 강력하다(UA·IP는 위장 가능하나 속도는 못 숨긴다):

```sql
SELECT
  CONCAT(REGEXP_EXTRACT(httpRequest.remoteIp, r"^[0-9a-f]+[.:][0-9a-f]+"), ".*") AS ip_masked,
  COUNT(*) AS reqs,
  COUNT(DISTINCT httpRequest.requestUrl) AS uniq_urls,
  SUBSTR(ANY_VALUE(httpRequest.userAgent),1,44) AS ua,
  MIN(FORMAT_TIMESTAMP("%H:%M", timestamp, "Asia/Seoul")) AS first_kst,
  MAX(FORMAT_TIMESTAMP("%H:%M", timestamp, "Asia/Seoul")) AS last_kst
FROM `monkos.market_eye.run_googleapis_com_requests_YYYYMMDD`
WHERE resource.labels.service_name = "monkos-portal"
  AND httpRequest.userAgent NOT LIKE "%bot%" AND httpRequest.userAgent NOT LIKE "%Bot%"
  AND httpRequest.userAgent NOT LIKE "%l9scan%" AND httpRequest.userAgent NOT LIKE "%urllib%"
GROUP BY 1 HAVING uniq_urls >= 8 ORDER BY reqs DESC LIMIT 12
```

**3층 계량 체계**:
| 대상 | 수단 | 상태 |
|------|------|------|
| 내부 자동화 | 코드 표식 → `automation_hit` 이벤트 | ✅ 본 작업 |
| 작가님 수동 브라우징 | GA4 IP 규칙 + **데이터 필터 '사용 중' 전환** | ⏳ 작가님 콘솔 |
| 외부 스크래퍼·봇 | BQ 요청 로그 행동 지문 | ✅ 쿼리 확보 |

## 5. 검증

- 문법: `gtagSnippet()` 산출 JS를 `new Function()`으로 파싱 검증 통과 (전 페이지 head 삽입물이므로 필수)
- jest: 9 failed / 2 passed — **변경 전과 동일**(ESM 설정 기존 문제), 회귀 아님을 stash 대조로 확인
- dev `00177-ljl` → **prod `00542-pqt`**
- prod 표면 6종 전수: `/` `/specs` `/specs/passport/kr` `/blog` `/pricing` `/faq` — 전부 200 + `_mkAuto` 4회 + `ai_referral_landing` 1회 삽입 확인
- 타 서비스 회귀 없음: idphoto-kr 200, monk.kr 200

**미검증**: 실브라우저 발화. playwright 브라우저 바이너리 미설치(`npx playwright install` 필요), cdp.sh용 디버그 크롬 미기동으로 **실제 `collect` 요청에 `traffic_type`이 실리는지는 확인하지 못했다.** 코드 삽입 ≠ 실발화이므로 다음 세션에서 실측 필요.

## 6. 잔여

- [ ] **실브라우저 발화 검증** (§5 미검증분) — 검증 스크립트는 스크래치패드에 작성 완료
- [ ] GA4 콘솔: 내부 트래픽 규칙 + **데이터 필터 '사용 중' 전환** (작가님)
- [ ] GA4 커스텀 차원 `traffic_type` 등록 — 미등록 시 리포트에서 조회 불가 (작가님)
- [ ] cdp.sh 디버그 크롬에 `mk_internal` 1회 세팅
- [ ] **측정 ID 이중 config 규명** — `G-JPZWSJ3323` + `G-FKG0CPTC14` 동시 발화가 의도인지 06-14 적발분 잔존인지. 잔존이면 GA4 수치 전체 신뢰도 문제
- [ ] 정적 HTML 6종(`public/*.html`)은 SSR 밖이라 미적용 — 별건
- [ ] idphoto-kr/jp 동일 적용 여부 판단

## 7. 커밋

`[fix] GA4 계측 정본화 + 자동화 트래픽 표식 (홈 이원화 해소)`

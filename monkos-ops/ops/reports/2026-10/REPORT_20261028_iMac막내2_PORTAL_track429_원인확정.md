---
type: report
date: 2026-10-28
device: iMac
agent: 쌍아-막내2
status: 진행
portfolio: PF_PORTAL
order: ORDER_20261028_iMac쌍아_막내2_PORTAL_track429_엣지IP버킷.md
---

# REPORT — /api/track 429 원인 확정 (수정안 결정 대기)

**[2026-10-28 18:25 KST]** iMac/쌍아-막내2 → 쌍아

## 결론 1줄

**엣지 신뢰 판정 실패가 아닙니다.** 해외의 크롤러 1개(브라우저형 UA, 쿠키 없음)가 specs 정적 페이지 약 2,100개를 10분에 훑었습니다. 엣지 워커 `firePageView`가 페이지마다 page_view를 오리진 `/api/track`으로 대신 보냈고, 오리진 레이트리밋이 **실클라이언트 IP별**로 60/분을 넘는 몫에 429를 냈습니다. 레이트리밋은 설계대로 작동했습니다. 실사용자 버킷 충돌의 증거는 없습니다.

## 근거

| # | 사실 | 출처 |
|---|---|---|
| 1 | 2026-10-27 17:42~17:53Z(02:42~02:53 KST) `/api/track` 2,000건(조회 상한) 중 204 1,470 / 429 530. 분당 204 약 180 + 429 약 60으로 일정 | Cloud Run 요청 로그(`gcloud logging read`, monkos-portal-00570-22q, 인스턴스 1개) |
| 2 | 같은 구간 BigQuery `monkos_tracking.events`: page_view 2,191건, **세션 2,191개(매 요청 새 세션 = 쿠키 미보존)**, 서로 다른 page_path 2,112개, region global 2,189 | `bq query` |
| 3 | 요청 로그 referer는 전부 `https://monkos.ai/`, UA는 Windows/Mac Chrome 2종. 현행 포털 클라이언트 코드에는 홈에서 `/api/track`을 부르는 곳이 없음(`monkTrack(` 호출은 headshot.js뿐) → 요청 주체는 워커 `firePageView`(원요청의 Referer·UA를 그대로 복사) | `edge/worker.mjs:52-86`, `public/js/track.js`, grep |
| 4 | **양성 대조군 = 신뢰 판정 정상 작동**: 오리진은 엣지 신뢰 시에만 page_view를 허용합니다(`server.js:1075`). 위 구간 page_view 1,470+건이 적재됨 → 이 요청들에서 `resolveEdgeClient().trusted === true` | `server.js:1074-1075`, #2 |
| 5 | 로그의 remoteIp가 CF IP인 것은 Cloud Run `httpRequest.remoteIp`가 GFE가 본 피어(= 워커 이그레스)이기 때문입니다. 신뢰 판정 실패의 증거가 아닙니다. 버킷 키는 `edge.ip`(= CF-Connecting-IP)입니다 | `server.js:126-131`, `lib/shared/edge-trust.js:82-91` |
| 6 | 분당 허용 약 180 = 버킷 3개 × 60. 크롤러가 IP 3개 안팎으로 돌았다는 것과 정합(로그 remoteIp는 6개라 CF IP 기준 버킷이면 360까지 허용됐을 것) | #1 |

## 부수 확인 (지시서 §2-3)

- **"06:30~07:03 맥 한 대 15초 간격"은 실측과 다릅니다.** 같은 구간(21:28~22:05Z) `/api/track` 요청은 18건뿐이고 429는 0건입니다. 15초 간격 패턴의 실체는 BigQuery의 `Google-Certificates-Bridge` page_view 131건(21:30:54~22:03:24Z, 33분/131 ≈ 15초)이며, 모두 `/.well-known/acme-challenge/…` 경로입니다. → Google 관리형 인증서(도메인 매핑) 발급·갱신 검증이 반복되고 있는 것으로 보입니다. **별건 확인 권고**(monkos.ai가 CF 프록시 뒤라 ACME 검증이 실패·재시도 중일 가능성) `[추정]`.
- **우리 자동화는 있습니다.** `curl/8.7.1`, KR, 21:31:12Z에 "/" page_view 4건이 찍혔습니다. iMac의 curl 버전(8.7.1)과 브리핑 루틴의 2회 히트 프로브(`ROUTINE_iMac민아_로컬축.md:110-112`, launchd 06:30)와 일치합니다.
  - **제외 방안 1줄 제안**: 루틴 curl에 `-A "monkos-probe"`를 붙이고, 오리진 page_view 기록(SSR·/api/track 공통)에서 UA가 `monkos-probe`이면 적재를 건너뜁니다. 구현은 결정 후.

## 영향

- **실사용자**: 429 영향 없음(버킷이 실IP별, #4·#5). 크롤러 몫만 잘렸습니다.
- **분석 오염**: 크롤러 page_view가 IP당 분당 60건까지는 **실제 방문으로 적재**됐습니다(10분에 1,470건). 이것이 실질적인 피해입니다. 429 로그 노이즈는 부차적입니다.

## 수정안 (결정 요청 — 지시서 전제 '신뢰 판정 실패'가 아니어서 방향 확인 후 착수)

| 안 | 내용 | 배포 범위 | 장단 |
|---|---|---|---|
| **A (권고)** | 오리진 `/api/track`: 엣지가 대신 보낸 page_view가 같은 실클라이언트 IP에서 분당 한도를 넘으면 429 대신 **조용히 버리고(204), 그 IP를 해당 분 동안 '봇'으로 표시해 이후 page_view 적재 중단**. 같은 IP의 앞선 몫도 `params.bot_suspect=1`로 적재해 분석에서 거를 수 있게 | 오리진만(dev 검증 가능) | 엣지 재배포 불요. 한도 상향 아님. 초당 수 건 크롤러를 자동 분리 |
| B | 워커 `firePageView`: UA가 알려진 봇·도구(bot·crawler·spider·curl·Google-Certificates-Bridge 등)면 전송 생략 | 엣지 재배포(`edge/deploy.sh`) | 이번 주범(Chrome UA 위장)은 못 거름. 보조용 |
| C | 현행 유지 + 분석 쿼리에서 '세션당 page_view 1건·쿠키 없음·분당 IP 폭주' 패턴 제외 | 없음 | 코드 변경 0. 원천 오염은 남음 |

- 권고: **A + B 병행**(A가 이번 유형을 막고, B는 정직하게 자기 신분을 밝힌 봇·도구를 거릅니다). 결정을 받으면 A부터 dev에 구현·검증하겠습니다(같은 조건 재현: 같은 IP 분당 100건 → 429 0·적재 60 이하·bot_suspect 표시, 대조군: 일반 page_view 정상 적재).

## 하지 않은 것

- 코드 변경·배포 0. EDGE_TRUST_KEY 값 열람 0(존재·주입 여부도 이번엔 불필요 — 신뢰 성공이 #4로 확인됨).
- CF 분석에서 크롤러 ASN 식별은 시도하지 않았습니다(집계 API로는 ASN 분해가 어려움).

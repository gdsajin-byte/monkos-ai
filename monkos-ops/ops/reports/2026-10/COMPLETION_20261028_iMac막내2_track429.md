---
type: completion
date: 2026-10-28
device: iMac
agent: 쌍아-막내2
status: 마감
portfolio: PF_PORTAL
order: ORDER_20261028_iMac쌍아_막내2_PORTAL_track_봇페이지뷰_A안_크롤러출처.md (선행 ORDER_20261028_iMac쌍아_막내2_PORTAL_track429_엣지IP버킷.md)
---

# COMPLETION — /api/track 429: A안 구현(dev) + 크롤러 출처

**[2026-10-28 18:40 KST]** iMac/쌍아-막내2 → 쌍아

## ✅ 완료

**1. 원인 1줄**: 엣지 신뢰 판정 실패가 아닙니다. UA를 돌려 쓰는 해외 크롤러가 사이트맵 순서대로 specs를 훑었고, 워커 `firePageView`가 이를 page_view로 중계해 실IP별 레이트리밋(60/분)이 초과분에 429를 냈습니다. 근거는 `REPORT_20261028_iMac막내2_PORTAL_track429_원인확정.md`에 있습니다(로그 행·코드 행·양성 대조군).

**2. A안 구현**: 커밋 `bbe9f9d6` `[fix] track — 엣지 page_view 한도 초과분 204 무적재·bot_suspect (A안)`
- `monkos_AI/portal/server.js` `/api/track`
  - 한도 초과 + 신뢰 엣지 + **이벤트가 전부 page_view** → 204·미적재, `bot_suspect` 로그(IP 해시 앞 8자, IP당 분 1회)
  - 그 밖의 한도 초과(클라이언트 직접 이벤트, 비신뢰) → 종전대로 429
  - '신뢰'만으로 거르지 않은 이유: 워커는 클라이언트의 `/api/*` 요청도 엣지 키를 붙여 중계하므로, 신뢰 여부로는 엣지 page_view와 클라이언트 이벤트가 구별되지 않습니다.
  - 초과 경로 본문이 깨져 있으면 429로 폴백합니다(JSON 파싱 예외 처리).
- 우리 자동화 제외: UA `monkos-probe`는 SSR `trackPageView`와 `/api/track` 모두 적재하지 않습니다. `ROUTINE_iMac민아_로컬축.md` 2-8 라이브 프로브 curl에 `-A monkos-probe`를 부여했습니다. 브리핑은 main 기반 전용 worktree에서 이 템플릿을 읽으므로 **main 병합 후 반영**됩니다.

**3. dev 배포·검증**: `./deploy.sh dev` → `monkos-portal-dev-00205-9th`(Cloud Build 7486e8a5 SUCCESS)

| 검증 | 방법 | 결과 |
|---|---|---|
| 비신뢰 경로 불변(대조군) | 내 IP에서 page_view POST 63건 연속 | 204 ×60 → 429 ×3 (종전과 동일) |
| 비신뢰 page_view 미적재 | BQ 조회(`page_path="/__devtest_track429"`) | page_view 0행 (종전과 동일 — 신뢰 엣지만 허용) |
| 프로브 제외 | click_cta 1건씩: UA `monkos-probe` vs 대조 UA | 둘 다 204, BQ 적재 = **대조군 1행만**(09:40:17Z), 프로브 0행 |
| 신뢰 엣지 경로(204·bot_suspect) | — | ⏳ **dev 재현 불가** — 아래 미해결 1 |

## 💡 크롤러 출처 (사실과 추정 구분)

| 항목 | 결과 | 수준 |
|---|---|---|
| 순회 순서 | `sitemap-specs-en.xml` 순서 그대로(passport/fi → visa/fi → passport/is → visa/is …, 사이트맵 120행부터 일치) | [기록 확인] |
| 요청 간격 | 2026-10-27 17:39:07~17:51:29Z, page_view 2,378건, 간격 사분위 220 / 266 / 310ms(중앙값 약 0.27초) | [기록 확인 — BQ] |
| UA | 요청마다 Chrome 121~125 × Windows/Mac을 바꿔 씀 = **UA 로테이션**(봇 신분 미표시) | [기록 확인] |
| 쿠키·세션 | 매 요청 새 세션(2,378 = 2,378) — 쿠키 미보존 | [기록 확인] |
| 국가 | 저장값은 region=global뿐(국가 원문 미저장) → 한국 외 | [기록 확인] |
| robots.txt | `User-agent: * Allow: /`, crawl-delay 없음 → **형식상 위반 아님**. 단 자기 신분을 숨기고 브라우저 UA로 위장해, 차단 목록(CCBot·Bytespider 등)에 걸리지 않는 방식 | [기록 확인 / 해석은 추정] |
| 과거 방문 | 같은 서명(referer=monkos.ai/, Chrome 12x UA, global)이 하루 100건을 넘은 날: **2026-09-08 2,243건**, **2026-10-27 2,378건**. 그 외 날은 0~2건(일반 방문으로 보임) → 약 7주 간격 재방문 | [기록 확인 — BQ 9/1~] |
| 실IP·ASN·소유자 | **확인 불가(도구 한계)** — 아래 미해결 2 | — |
| 정체 판정 | 알려진 검색엔진·AI 크롤러는 자기 UA를 밝히므로 이 패턴과 다릅니다. 사이트맵 전수·UA 로테이션·고속은 **콘텐츠 수집용 스크레이퍼**(SEO 도구·데이터 수집업체·AI 학습 데이터 수집 등)의 전형입니다 | [추정] |

## ⏳ 미해결

1. **신뢰 엣지 경로 실검증**: 204·bot_suspect 분기는 "CF 대역 피어 + 엣지 키 일치"일 때만 탑니다. dev(run.app)에 직접 쏘면 재현되지 않고, 엣지 키는 시크릿이라 다루지 않았습니다. 검증 방법은 둘 중 하나입니다.
   - (a) prod 반영 후 다음 크롤러 방문 때 `[track] bot_suspect` 로그와 BQ 미적재를 확인(사후).
   - (b) 쌍아가 dev를 가리키는 엣지 경로(프리뷰 워커 등)를 마련.
2. **크롤러 실IP·ASN**: 우리 쪽에는 실IP가 어디에도 남지 않습니다. Cloud Run 로그 remoteIp = CF 이그레스, 앱 로그 없음, BQ에 IP 컬럼 없음. Cloudflare 쪽 기록(GraphQL 분석)은 API 토큰(SM 시크릿) 접근이 필요하고, Cloudflare MCP는 이 세션에서 결과가 `[object Object]`로만 나와 쓰지 못했습니다.
   - **다음 방문 식별 제안**(엣지 재배포 필요): 워커 `firePageView`가 `request.cf.asn`·`request.cf.asOrganization`을 헤더로 함께 넘기고, 오리진은 bot_suspect 로그에 ASN·기관명을 남깁니다(실IP는 계속 해시). 다음 방문 1회로 출처가 확정됩니다.
3. **jest 미실행**: worktree에 node_modules가 없습니다. 패키지 설치는 승인 게이트(ch1 7조) 대상이라 하지 않았고, dev 실배포로 검증했습니다.

## 🔀 부수

- dev 검증용 테스트 행 1건(click_cta, `page_path=/__devtest_track429`, service `portal-devtest`)이 **공용 BQ `monkos_tracking.events`에 적재**됐습니다. dev와 prod가 같은 데이터셋을 씁니다. 분석 시 이 경로로 제외할 수 있습니다.
- `scripts/secret.sh`를 무인자로 잘못 실행해 대화식 등록이 시작됐고, 클립보드가 비어 있어 등록 없이 종료됐습니다. 시크릿 등록·열람 0.
- 별건 권고 유지: Google-Certificates-Bridge ACME 챌린지 15초 반복(관리형 인증서 재시도 추정).
- 범위 밖 관찰: 워커가 클라이언트 `/api/track` 요청에도 엣지 키를 붙이므로, 브라우저가 page_view를 직접 보내도 신뢰로 판정돼 허용됩니다(`server.js` page_view 허용 조건). 계측 오염 경로가 될 수 있어 참고로 적습니다(수정 안 함).

## 📁 경로

- 코드: `monkos_AI/portal/server.js`(커밋 `bbe9f9d6`), 루틴: `monkos-ops/ops/templates/ROUTINE_iMac민아_로컬축.md`
- dev: `monkos-portal-dev-00205-9th` / prod 배포 없음(쌍아가 작가님 '배포 승인' 후)
- 원인 보고: `monkos-ops/ops/reports/2026-10/REPORT_20261028_iMac막내2_PORTAL_track429_원인확정.md`
- 브랜치 `worktree-makne2-litigation`

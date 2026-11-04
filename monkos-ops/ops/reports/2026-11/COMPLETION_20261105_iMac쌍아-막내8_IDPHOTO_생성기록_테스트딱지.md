---
type: completion
date: 2026-11-05
device: iMac
agent: 쌍아-막내8
status: 마감
portfolio: PF_IDPHOTO
order: monkos-ops/ops/orders/2026-11/ORDER_20261105_iMac쌍아_막내8_IDPHOTO_생성기록_테스트딱지.md
---

# COMPLETION — 생성 기록 테스트 딱지

**[2026-11-05 04:46 KST]** iMac/쌍아-막내8 → iMac/쌍아

**결론**: 이제 새 생성 기록에는 출처 서비스(`originService`)와 시험 여부(`isTest`·`testReason`)가 저장된다. 어드민 생성 검토 화면은 테스트 기록을 기본으로 숨긴다. "테스트 포함" 토글을 켜면 '테스트' 배지를 단 채로 함께 보인다. dev `monkos-portal-dev-00239-7gq`에서 공개 사진으로 1회 생성했고, 저장 내용은 `originService=monkos-portal-dev`·`isTest=true(dev_service)`였다. 기존 문서 쓰기는 0건이다. 새 Firestore 복합 색인은 필요 없다(쿼리 형태가 기존과 같다). prod 대상은 **portal 하나**이고, 엣지는 필요 없다.

출처: 지시서 상단(작가님 04:31 캡처 질문, 04:34 "테스트 딱지 붙이는건 찬성"). 범위 승인은 §1·§2(구현·dev)까지다. 고객 사진·이름은 레포·로그·메시지 어디에도 쓰지 않았다. 시험에는 공개 사진(Wikimedia PD)만 썼다.

## 1. 구현 (커밋 84746a05)

| 위치 | 내용 |
|---|---|
| `lib/gen-origin.js` (신설) | `generationOrigin(req, { kService, getAdmin })`가 `{ originService, isTest, testReason }`을 돌려준다. 판정 규칙은 아래 세 가지다. ⓐ `K_SERVICE`가 `-dev`로 끝나면 `dev_service`. ⓑ 헤더 `X-Test-Run: 1`이 있고 관리자 인증(`getAdminUser`)을 통과하면 `admin_marked`. ⓒ 그 밖은 고객 기록으로 본다. 표시만 있고 인증이 없거나, 판정 함수가 없거나 예외를 내면 표시를 무시한다. 값은 `'1'`일 때만 인정한다. `isTestGeneration(doc)`는 필드가 없는 과거 문서를 고객 기록으로 본다. |
| `lib/gcs-save.js` | genDoc에 `originService`·`isTest`·`testReason`을 넣는다. **새 문서에만 붙는다.** 호출부가 `extras.origin`을 빠뜨려도 `K_SERVICE`로 대신 채우므로 dev는 isTest가 된다. 저장 로그에 `origin=… isTest=…(사유)`를 붙였다. Firestore를 직접 열지 않고 저장 내용을 확인하기 위해서다(ch4 10조). |
| `server.js:1108` (idphoto)·`lib/headshot-route.js:97` | `saveImages` 호출부 전수 2곳(grep)에서 `extras.origin = generationOrigin(req, { getAdmin: getAdminUser })`를 넘긴다. |
| `lib/cms/idphoto-review.js` | `includeTest=1`이면 테스트 기록을 포함하고, 기본은 숨긴다. 순수 함수 `keepGeneration`(탭·테스트 필터)과 `collectVisible`(묶음 단위로 반복 조회)을 export했다. 응답에 `isTest`·`originService`·`testReason`·`hiddenTest`를 싣는다. |
| `public/admin/idphoto-review.html` | 툴바에 "테스트 포함" 체크박스를 두었다(기본 해제). 테스트 카드에는 '테스트' 배지(제목에 출처 서비스·사유)와 점선 테두리가 붙는다. 요약 줄에 "테스트 N건 숨김"을 표시한다. |
| `__tests__/headshot-gate.test.js` | headshot-route가 admin-auth를 import하게 되면서 config 목에 `ADMIN_UIDS`·`AGENT_API_KEYS`·`generateAuthToken`을 보강했다(빈 값). |

**시험 표시 이름·경로의 근거**
- **헤더로 받는다(바디 아님).** 생성 라우트(idphoto·headshot)의 바디 스키마를 건드리지 않고, 두 곳에 같은 방식으로 붙일 수 있다.
- **`X-Monkos-*` 이름은 피했다.** 이 이름공간은 엣지 워커가 넣는 신뢰 헤더(`edge-trust.js`: Client-IP·Country·Edge-Key)라 의미가 섞인다.
- **엣지가 헤더를 그대로 넘긴다.** `edge/worker.mjs`는 `new Headers(request.headers)`로 hop 헤더만 지우고 나머지를 오리진에 전달하므로, `X-Test-Run`이 오리진까지 도달한다.
- **인증은 `requireAdmin`과 같은 함수를 쓴다.** `getAdminUser`(쿠키 `ADMIN_UIDS` 또는 `Bearer AGENT_…`)다. 에이전트 키로 prod에서 시험하는 경우가 지시서가 말한 (b)다.

**서버 쪽 거르기와 색인**
- `where('isTest','==',false)`는 쓰지 않았다. 과거 문서에는 이 필드가 없어서 결과에서 빠지고, `service`+`isTest`+`createdAt` 복합 색인도 새로 필요해진다.
- 쿼리는 기존과 같은 형태(`service ==` + `orderBy createdAt` + `startAfter` + `limit`)로 두고, 메모리에서 거른다. 숨긴 만큼 limit이 모자라면 다음 묶음을 더 읽는다(최대 5라운드, 묶음은 max(limit×3, 60)건).
- 그래서 **새 색인 0개**다.
- 커서는 마지막으로 반환한 문서의 `createdAt`이다. 다음 쪽에서 숨김 문서를 다시 걸러도 중복·누락이 없다(테스트로 검증).
- 기존 kr/jp 탭 필터의 `hasMore` 과소판정(limit×3을 한 번만 읽던 문제)도 이 반복 조회로 함께 해소됐다.

## 2. 테스트

포털 전체 **286/286** 통과(gen-origin 10건 신규).

| 판정 사례 | 결과 |
|---|---|
| ① dev 서비스 | isTest(dev_service). 인증·표시와 무관하다 |
| ② prod + 관리자 인증 + 표시 | isTest(admin_marked) |
| ③ prod + 표시만 | 무시(고객 기록). 판정 함수가 없거나 예외를 내도 무시 |
| ④ prod 일반 | false. 관리자여도 표시가 없거나 값이 `'true'`이면 false |
| 로컬(K_SERVICE 없음) | `originService null`, false |
| 목록 | 기본 숨김·포함 토글·탭 필터, 숨김으로 모자랄 때 다음 묶음 조회, 끝까지 읽으면 `hasMore=false`, 커서 이어 읽기 시 중복·누락 0 |

## 3. dev 검증 — `monkos-portal-dev-00239-7gq` (84746a05)

| 항목 | 방법 | 결과 |
|---|---|---|
| 배포 | `deploy.sh dev --yes` | exit 0, 트래픽 100% |
| 생성 1회 | 공개 사진 jemison으로 precheck → fit → generate(freeTier). 결제 없음 | 정상 응답(track·meta) |
| 새 문서 딱지 | Cloud Logging(읽기 전용) `[GCS] 병렬 저장 완료` 2026-11-04T19:44:36Z(= 11-05 04:44 KST), rev 00239-7gq | `origin=monkos-portal-dev isTest=true(dev_service)`. 첫 조회는 수집 지연으로 0건이었고, 두 번째 조회에서 확인했다 |
| 어드민 화면 | ⚠️ **dev 어드민 실화면은 보지 못했다.** dev 어드민 API는 관리자 쿠키나 에이전트 키(시크릿)가 있어야 한다. 시크릿 사용은 ch1 7조 승인 게이트 대상이라 쓰지 않았다. 대신 **로컬에서 실제 페이지(`idphoto-review.html`)와 실제 핸들러(`handleIdphotoResults`)를 그대로 돌렸다.** config·Storage만 가짜 모듈로 바꿨고(시크릿 값 생성 없음), 데이터는 픽스처 70건(과거·dev·표시·prod 혼합)을 썼다. Playwright로 확인했다 | 기본: 40건, "테스트 22건 숨김", 테스트 카드 0장. 토글 켬: 40건 중 테스트 13장에 '테스트' 배지(제목 `monkos-portal-dev · dev_service` / `monkos-portal · admin_marked`)와 점선 테두리. API도 `includeTest` 없음 → isTest 0건·hiddenTest 6 / `includeTest=1` → isTest 3건(dev_service·admin_marked·dev_service) |

- dev 어드민 실화면 확인이 필요하면, 작가님이 관리자로 로그인한 브라우저에서 `https://monkos-portal-dev-4jeplpqpua-uc.a.run.app/admin/idphoto-review.html`을 열면 된다. 다만 dev와 prod는 같은 generations를 보므로, prod 배포 전에도 dev 화면에서 같은 결과가 보인다.
- 작업 중 실수 1건: Playwright가 작가님 브라우저(공유 CDP)의 현재 탭(`monkos.ai/specs/passport/kr`)을 로컬 확인 페이지로 덮어썼다. 확인을 마친 뒤 같은 URL로 되돌려 놓았다. 다음부터는 새 탭을 쓴다.

## 4. 과거 시험 기록 목록 (수정 없음 — 처리 방식은 쌍아 판단)

**조회 방법**
- Firestore는 직접 조회하지 않았다(ch4 10조). portal-dev의 Cloud Logging 저장 로그를 읽기 전용으로 전수 조회했다(보존 30일 범위).
- dev 서비스에서 저장된 기록은 정의상 전부 시험 기록이다.
- 문서 id는 로그에 남지 않으므로 알 수 없다. 대신 시각(KST, 초 단위 = 문서 `createdAt`과 같은 시점)과 저장 경로 구분을 적는다. 저장 경로 소유자는 전부 `specs-visitor`(비로그인)였다.

| 날짜 | 건수 | 규격·게이트 |
|---|---:|---|
| 10-22 | 4 | kr-passport free 4 |
| 10-27 | 2 | kr-passport free 2 |
| 11-02 | 8 | kr-passport free 2 · us-visa free 5 · ca-passport free 1 |
| 11-03 | 7 | us-visa token 3 · us-visa free 1 · kr-passport free 3 |
| 11-04 | 15 | kr-passport free 15 |
| **합계** | **36** | 10-22 22:30:42 ~ 11-04 14:19:54 KST, 모두 idphoto(headshot 0) |

- **11-04 14:00대 15건**(막내1 시험): 14:05:02 · 14:05:17 · 14:05:31 · 14:05:45 · 14:05:59 · 14:06:22 · 14:06:37 · 14:06:50 · 14:07:04 · 14:18:47 · 14:18:59 · 14:19:14 · 14:19:27 · 14:19:41 · 14:19:54
- 위 15건과 오늘 04:44 생성 1건을 더하면 dev 기록은 총 37건이다. 04:44 건은 새 필드가 붙어 있어 기본 숨김이 된다.
- 한계:
  - 10-22 이전 dev 기록은 로그 보존 범위 밖이라 세지 못했다.
  - prod 서비스에서 에이전트가 시험한 과거 기록은 로그로 구분할 수 없어 목록에 넣지 않았다.
- 처리 대안(쌍아 판단):
  - ① 그대로 둔다(새 기록부터 숨김).
  - ② 시각 목록으로 특정한 문서에만 `isTest:true`를 1회 쓴다. 기존 문서 쓰기이므로 작가님 승인이 필요하다.
  - ③ 어드민에서 위 시각 범위를 따로 숨기는 표시용 목록을 둔다(코드 상수).

## 5. `generations` 집계 소비처 (고치지 않음 — 표만)

| 소비처 | 용도 | 테스트 기록 영향 |
|---|---|---|
| `lib/cms/idphoto-review.js` | 어드민 생성 검토 목록 | **이번에 해소**(기본 숨김) |
| `lib/cms/dashboard.js:549` `handleDashboardUserDetail` | 사용자 360 상세 — 해당 uid의 최근 생성 50건 | 사용자별 조회라 영향이 작다. dev 시험은 비로그인(`anonymous_*`)이라 실사용자 상세에는 섞이지 않는다. 관리자 계정으로 시험하면 그 관리자 상세에 섞인다. 같은 파일의 요약·사용자 목록은 `isTestUser`(ADMIN_UIDS)로 따로 거르고, `generations`를 세지 않는다 |
| `scripts/credits.sh:371·393·454` | 회원 조회·탈퇴 처리(uid 기준 generations 나열·삭제) | uid 기준이라 영향이 없다 |
| `monkos_AI/portal/scripts/backfill-generations.js` | 1회성 GCS → generations 백필 | 다시 돌리면 새 필드 없이 쓴다. 다시 돌릴 일이 있으면 dev 경로를 판정해야 한다 |
| 브리핑·대시보드 지표(GA4·BigQuery) | — | `generations`를 읽지 않는다(grep 0). dev 생성의 GA4 이벤트 오염은 별개 문제다(메모리: GA4 테스트 오염) |

## 6. 배포 대상 판정표 (실행 안 함 — 작가님 '배포 승인' 사안)

| 대상 | 필요 | 근거 |
|---|---|---|
| `monkos-portal` | **필요** | `lib/gen-origin.js`·`gcs-save.js`·`headshot-route.js`·`cms/idphoto-review.js`·`server.js`·`public/admin/idphoto-review.html` |
| 엣지 `monkos-portal-edge` | 불필요 | specs-data·렌더러·i18n·components 변경 0. 어드민 페이지는 엣지가 오리진으로 넘긴다(`worker.mjs`에 admin 정적 경로 없음, grep 0) |
| Firestore 색인 | 불필요 | 쿼리 형태가 그대로다(`service ==` + `orderBy createdAt`) |

- prod 반영 확인안: 관리자 로그인 상태로 prod 어드민을 열어, 기본 화면에 dev 시험 기록(04:44 건)이 숨는지와 토글하면 배지가 붙어 보이는지 본다.
- prod 생성 기록은 `originService=monkos-portal`·`isTest=false`로 저장된다(로그 `origin=monkos-portal isTest=false`).

## 완료 보고

- ✅ 저장 필드 2개(+`testReason`), 인증된 시험 표시(`X-Test-Run: 1` + `getAdminUser`), 표시만 있는 요청 무시. 테스트 286/286.
- ✅ 어드민 '테스트' 배지, 기본 숨김 토글, 서버에서 거르기(새 색인 0).
- ✅ 과거 시험 기록 목록(dev 36건, 11-04 14시대 15건 시각) — 수정 0. 집계 소비처 표.
- ✅ dev rev `monkos-portal-dev-00239-7gq`. 생성 1회 결과 `origin=monkos-portal-dev isTest=true(dev_service)`(로그 실측).
- ⚠️ 어드민은 dev 실화면이 아니라 로컬에서 실제 페이지·실제 핸들러로 확인했다(시크릿 미사용). dev 실화면 확인은 작가님 관리자 로그인이 필요하다.
- ❌ 공유 브라우저의 작가님 현재 탭을 잠시 덮어썼다(원래 URL로 복구함).
- ⏳ prod 배포(portal, 작가님 '배포 승인') · 과거 37건 처리 방식(①②③) 결정.
- 📁 `monkos_AI/portal/lib/gen-origin.js`·`gcs-save.js`·`headshot-route.js`·`cms/idphoto-review.js`·`server.js`·`public/admin/idphoto-review.html`·`__tests__/gen-origin.test.js`·`__tests__/headshot-gate.test.js` / 이 보고서·세션 로그·PF 1행
- 🔀 브랜치 `worktree-makne8-gen-test-tag` → 원격 푸시. 병합은 쌍아가 한다.

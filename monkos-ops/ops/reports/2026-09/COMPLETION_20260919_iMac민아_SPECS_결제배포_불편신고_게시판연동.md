---
type: completion
date: 2026-09-19
device: iMac
agent: 민아
status: 마감
portfolio: PF_SPECS
order: ORDER_20260919_iMac민아_막내1_SPECS_결제동선_결함수정_실패계측 (배포분) · ORDER_20260919_iMac민아_막내1_SPECS_불편신고_게시판연동 (민아 직접 집행)
---

# COMPLETION — 결제 동선 수정 prod 배포 + 불편 신고 게시판 연동

**[2026-09-19 17:23 KST]** iMac/민아 → 작가님

> **[예외] 기록** — 작가님 17:01 직접 지시("직접 나머지 처리하고 배포 승인") 근거. 민아 경로 범위 초과(② 프로덕션 표면 ③ 신규 파이프라인) + 배포 집행. 지시서 2는 막내1 앞으로 발행됐으나 작가님 부재로 토스 불가 → 민아 직접 구현. 쌍아 사후 추인 대상.

## 1. 결과 요약

| 건 | 결과 |
|---|---|
| 결제 동선 결함 수정(막내1 `48b542c5`·`88467e2d`) prod + 엣지 배포 | ✅ 라이브 반영 확인 |
| 불편 신고 → 게시판 연동 구현·dev 검증·prod + 엣지 배포 | ✅ 라이브 반영 확인 |
| 실카드 결제 승인 | ❌ 미검증 (에이전트 재현 불가) |

## 2. 배포 원장

| 순서 | 대상 | 결과 | 롤백 |
|---|---|---|---|
| 1 | `deploy.sh prod` (결제 동선) | **monkos-portal-00560-pdf** | 직전 00559-n4f |
| 2 | `edge/deploy.sh` | Worker `76714322-33ee-450a-b9df-f2082e85c22e`, 스모크 4/4·어서션 4/4 | — |
| 3 | `deploy.sh dev` (게시판 연동) | monkos-portal-dev-00185-c6b | — |
| 4 | `deploy.sh prod` (게시판 연동) | **monkos-portal-00561-2vh** | 직전 00560-pdf |
| 5 | `edge/deploy.sh` | Worker `032280cb-06ff-46ae-8f93-5ca05d4d20f0`, 스모크 4/4·어서션 **5/5** | 직전 76714322 |

두 건은 커밋·prod 리비전·엣지 버전이 모두 분리돼 있다(롤백 단위). 게시판 연동만 되돌리려면 00560-pdf + 엣지 76714322.

## 3. 커밋

- `85293598` [ops] 엣지 스모크 어서션 — `id="v2-pay-error"`
- `08efee18` [feat] specs 불편 신고 → 게시판 연동
- `0e77c8c9` [ops] 엣지 스모크 어서션 — `/api/board/report`

## 4. 불편 신고 — 구현 내용

| 파일 | 변경 |
|---|---|
| `lib/cms/board.js` | `POST /api/board/report` 신설 · 공개 상세 화이트리스트 + key 열람 · 관리자 목록에 본문·맥락·답글·`hasHumanReply` · 답글 `authorLabel` + 알림 메일 · 비공개 글 공개 전환 차단 |
| `lib/cms/render-board.js` | key 열람 게이트 · 답글 명의 표시 · 비공개 열람 시 `no-store`·`noindex`·`no-referrer`·주소창 key 제거 · 삭제 버튼 숨김 |
| `server.js` | 라우트 1행 |
| `public/admin/board.html` | 제목 클릭 시 본문·맥락 패널·답글 이력 · 미답변 판정(자동 접수 답글 제외) · 비공개 글은 Show/Hide 버튼 미표시 |
| `public/js/specs-funnel.js` | 입구 3곳(에러 문구 바로 아래 · 결제 위젯 하단 · 퍼널 하단) · 인라인 시트 · 맥락 수집 · GA `report_open`·`report_submit` |
| `public/css/specs-funnel.css` | 신고 링크·시트 스타일 |

**자동 첨부 맥락**(관리자 전용): 규격 slug·언어·마켓 / 현재 단계 / 마지막 에러 문구와 발생 단계 / 주문번호·결제사·위젯 열림·결제하기 클릭 여부 / 화면 크기·배율 / 인앱 브라우저 여부 / 유입 호스트 / User-Agent. **IP·사진·결제 토큰은 저장하지 않는다.** 서버가 허용 키만 골라 담으므로 클라이언트가 다른 필드를 보내도 버려진다.

**접수 자동 답글**: 고정 문안(LLM 생성 아님), 명의 "MONKOS 지원", 단계별 임시 해결법(결제 → 카드사 먼저 선택·기본 브라우저 / 다운로드 → 길게 눌러 저장 / 업로드 → JPG·PNG 정면 사진). 환불·보상·기한 약속 없음.

### 지시서 대비 변경 3건

1. 비공개 글을 공개 목록에 "비공개 글입니다"로 마스킹하지 않고 **목록에서 제외**했다 — 노출 면적을 0으로.
2. 문구를 `specs-i18n.js`가 아니라 JS 기본값으로 두었다(ko/ja/en/es, id·vi는 en 폴백, `T.report_*`로 덮어쓰기 가능) — SSG 빌드 결합 제거.
3. 열람 키는 교체가 아닌 **누적** — 접수 시 받은 링크와 답글 알림 메일의 링크가 함께 유효하다.

## 5. 검증

### dev (rev 00185-c6b)

| 항목 | 결과 |
|---|---|
| 접수 | 201 + 열람 링크 |
| 공개 목록 | 신고 글 미노출 |
| 공개 상세 API | 키 없음 404 · 틀린 키 404 · 맞는 키 200 |
| 공개 응답 필드 | `author·category·content·createdAt·id·replies·title` **뿐** — context·email·token 없음 |
| SSR 열람 | 키 없음 404 / 키 있음 200 + `private, no-store`·`noindex, nofollow`·`no-referrer` / 삭제 버튼 0 / HTML에 UA·리퍼러·주문번호·해시 0건 |
| 레이트리밋 | 1분 내 재전송 429, 화면 문구 "방금 접수되었습니다…" |
| 관리자 API | 무인증 401 |
| 서버 로그 | `[CMS] 불편 신고 접수: … phase=pay Android·삼성인터넷 vp=360x660 inApp=false` |
| 브라우저 360×660 | 입구 링크 3종 존재 · 시트 제출 버튼 뷰포트 내(596~642/660) · 입력 16px · 빈 내용 방어 · 실제 제출 성공 + 열람 링크 · 에러 발생 시 링크가 에러 문구 바로 다음에 표시 · GA 2종 발화 |

### 라이브 (판정 방법: 캐시 계층 GET은 URL당 2회 히트·1차 버림 / 비멱등 POST는 1회만 / 대조군 = 17:01 동일 URL `v2-pay-error` 0건)

- 결제 동선: `/specs/passport/kr`·`/ja/specs/passport/jp`·`/en/specs/visa/us` 전부 DOM 순서 `v2-pay-error-top` → `v2-pay-instant` → `v2-toss-widget` → `v2-pay-error` → `v2-pay-confirm` → `v2-pay-credit`. JS에 `pay_widget_open`·`pay_confirm_click`·`pay_fail`·`/api/payments/direct/fail`·`is-docked`. prod 실패 엔드포인트 가짜 주문 → 400.
- 게시판 연동: JS `?v=ssg-0e77c8c9-202609191722`에 `/api/board/report`·`report_submit`, CSS에 `v2-report-overlay`. 엣지 경유 접수 1건 201. 열람 응답 `cf-cache-status: DYNAMIC` + 보안 헤더 3종. **키 요청 직후 키 없는 요청 2회 모두 404**(엣지 캐시 누출 없음). 공개 목록 1건(기존 후기)뿐.

## 6. ⚠️ 한계·미검증

1. **실카드 승인 미검증** — 작가님 실기기 ₩2,000 1회 필요.
2. **관리자 화면 맥락 패널 렌더 미확인** — 관리자 인증이 필요해 에이전트가 열 수 없다.
3. **텔레그램 실수신 미확인** — 서버에 전송 실패 로그는 없다. 수신 여부는 작가님 팀 채팅에서 확인.
4. **답글 알림 메일 실발송 미확인** — 관리자 답글을 거쳐야 발화한다.
5. **테스트 신고 글 3건 잔존** — `kPfBOesa9gIAGN0KBsfk`·`9uyKCnsV83sWglmoyqJW`·`erpjGcy9ObMzQXCfB2mE`. 본문이 "[테스트·민아 검증]"으로 시작한다. 비공개라 공개 표면 노출 0. 삭제는 관리자 권한이 필요하다 — 어드민(`/admin/board.html`)에서 **제목을 눌러 맥락 패널을 확인한 뒤 Del** 하면 2번 검증도 함께 끝난다.
6. **열람 키가 GA `page_location`에 남을 수 있다** — 페이지 스크립트가 주소창의 key를 지우지만 GA 초기 page_view가 먼저 나가면 자사 GA 속성에 key가 기록된다. 외부 유출은 아니며, 막으려면 `/board/*` 비공개 열람에서 GA를 끄는 후속 수정이 필요하다(미실행).
7. **무인 LLM 본답글은 구현하지 않았다** — 지시서 범위 밖. 현재 흐름은 텔레그램 알림 → 에이전트 세션이 맥락으로 진단 → 작가님 승인 → 관리자 답글.
8. 검증 중 dev·prod가 같은 Firestore를 쓰므로 테스트 글은 실 컬렉션에 들어갔다(위 5번).

## 7. 작가님 할 일

1. 실기기에서 specs ₩2,000 결제 1회 — 카드사를 고르지 않고 먼저 눌러 에러가 버튼 바로 위에 뜨는지 본 뒤 정상 결제.
2. 어드민 게시판에서 테스트 글 3건의 맥락 패널 확인 후 삭제.
3. 팀 텔레그램에 "📮 specs 불편 신고" 알림이 3건 와 있는지 확인.

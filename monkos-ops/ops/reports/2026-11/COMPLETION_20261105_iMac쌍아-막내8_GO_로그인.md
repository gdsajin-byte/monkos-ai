---
type: completion
date: 2026-11-05
device: iMac
agent: 쌍아-막내8
status: 진행
portfolio: PF_GO
order: monkos-ops/ops/orders/2026-11/ORDER_20261105_iMac쌍아_막내8_GO_로그인_포털OAuth_이메일가입.md
---

# COMPLETION — 바둑앱 로그인 (포털 계정 공용 + 이메일 매직 링크)

**[2026-11-05 07:32 KST]** iMac/쌍아-막내8 → iMac/쌍아

**결론**
- 설계서를 작성했다.
- 포털 이메일 매직 링크를 구현했고, dev 배포 뒤 info@monkos.ai로 실제 발송까지 확인했다.
- 바둑 서버를 포털 토큰으로 로그인하게 했다. 기존 계정 연결과 언어권별 버튼 순서도 넣었다.
- 8766 테스트 인스턴스는 준비를 마쳤다.

**남은 것**
- **OAuth 실제 로그인 클릭**(구글·카카오)과 **'신작가' 연결 후 전적 재측정**은 작가님 클릭이 필요해 대기 중이다(⏳).
- LINE은 dev 콜백이 등록되어 있지 않다. 쌍아 결정(07:17)에 따라 prod 반영 뒤 검증한다.
- 새 시크릿과 OAuth 리다이렉트 URI 추가는 필요 없다.

출처: 지시서 상단(작가님 07:12). 범위 승인은 §1·§2다.

## 1. 구현 (브랜치 `worktree-makne8-go-login`)

| 커밋 | 내용 |
|---|---|
| 4db9e2f6 `[feat] … 1차(포털 매직 링크·허용 출처·바둑 Auth 연결)` | 포털 `lib/email-login.js`(신설)·server.js 라우트 2개·config `ALLOWED_POPUP_ORIGINS`에 `https://go.monkos.ai` 추가 + `allowedPopupOrigins()`(dev만 localhost·127.0.0.1:8766)·auth.js OAuth 3종이 이 함수를 쓰게 함·mailer `redactLog`(기본 불변)·테스트 10건 / 바둑 Auth 포털 메서드 |
| 4a289038 `[feat] … 바둑 서버 포털 토큰 확인·기존 계정 연결·로그인 창` | 바둑 `server.py` API 5개·`_me()` portal 필드, `index.html` 로그인 창 포털 버튼·이메일 칸·마이페이지 연결 줄·#monkos_xt 처리, `tools/test_portal_login.py` 7건 |
| 22633349 `[feat] 바둑 테스트 인스턴스 — localhost 출처·GO_NO_LOCAL_ADMIN` | 테스트용. 기본 동작은 그대로 |

**포털 API**
- `POST /api/auth/email/start`: 주소 형식 확인 → 같은 주소 분당 1회·하루 10회(Firestore 트랜잭션) + IP 시간당 30회 → 토큰은 sha256으로만 저장 → Resend 발송 → 항상 같은 성공 응답(주소 존재 여부 비노출).
- `GET /auth/email/callback?t=`: 트랜잭션으로 1회 소모·15분 만료 → `users/email_{해시24}`(provider email, 신규 +10c) → `.monkos.ai` 세션 쿠키 → 허용 출처면 `#monkos_xt=<5분 토큰>`을 붙여 돌려보냄.

**바둑 API**
- `GET /api/auth/portal/config`: 포털 주소, 이 앱의 출처, 언어권 버튼 순서.
- `POST /api/auth/portal` {token}: 포털 `verify-cookie` 서버 대 서버 확인 → ① 로그인 중이면 연결(이관) ② 연결된 계정이면 입장 ③ 처음이면 티켓.
- `POST /api/auth/portal/cookie`: 운영 도메인에서 `.monkos.ai` 포털 쿠키로 자동 입장.
- `POST /api/auth/portal/signup` {ticket, nick, rank}: 처음 온 사용자의 바둑 계정 생성.
- `POST /api/auth/email/start`: 포털로 중계. 이메일은 저장·로그하지 않는다.

**사용자 표기**
- 막내2의 표기 정본 `display_name()`("신작가 6단")은 손대지 않았다. users.json에는 `portal`·`portal_provider`·`portal_linked` 필드만 추가했다.
- 07:17에 막내2에게 수정 범위를 공유했고, 겹치는 `_me()`는 origin/main(50d183a0) 위로 rebase한 뒤 필드 1개만 덧붙였다.

**보안**
- 연결은 그 바둑 아이디로 이미 로그인한 상태에서만 된다. 닉네임만으로 남의 계정을 연결하는 경로는 없다.
- 1포털 = 1바둑 계정이다(그 밖은 409).
- 에이전트 세션(`agent_*`)은 거부한다.
- 토큰 형식 검증을 거친다.
- 바둑 세션 쿠키는 SameSite=Lax이고 요청은 JSON이라, 교차 사이트 연결 요청이 성립하지 않는다.

## 2. 검증

| 항목 | 결과 |
|---|---|
| 포털 테스트 | **296/296**. 신규 email-login 10건: 분당·일 한도, 날짜 경계, 돌아갈 곳 허용 목록(`//evil`·`javascript:` 거부), 주소 정규화·마스킹, 원 토큰 미저장, 1회용, 만료, 재로그인 시 크레딧 재지급 없음, 형식 오류 |
| 바둑 테스트 | **7/7** (`python3 -I tools/test_portal_login.py`, 임시 HOME): 토큰 형식 거름, 포털 응답에서 이메일 제거, 에이전트 거부, 연결 시 uid·rank 보존·파일 반영, 1포털=1계정, 티켓 1회용·만료, 예약 닉 거부, 중계 본문 |
| dev 포털 | `monkos-portal-dev-00247-6n9`(exit 0) |
| 매직 링크 실발송 | info@monkos.ai → 200, Resend id `01a1a8ad-…`. 1분 안 재요청 → 429(minute) 대조군. 형식 오류 → 400 대조군. dev 로그에는 `i***@m***.ai`만 남고 원 주소는 0건(로그 조회로 확인) |
| OAuth 인가 단계(로그인 없이) | dev 콜백 기준 구글·카카오는 로그인 화면까지 진행(302). **LINE은 400(dev 콜백 미등록)**. prod 콜백은 3종 모두 302 |
| 8766 API(별도 쿠키 저장소) | 설정 200(출처 `http://localhost:8766`). 무효 토큰 2종·쿠키 없음 → 401. 만료 티켓 → 400. 이메일 형식 → 400. 무쿠키 `/api/me` → 401(`GO_NO_LOCAL_ADMIN=1`) |
| 8766 화면(별도 헤드리스 크롬) | 로그인 창 버튼: ko = 카카오·Google·이메일 / ja = LINE·Google·이메일 / en = Google·이메일. Google 팝업 주소 `…/auth/google?popup=1&redirect_app=http%3A%2F%2Flocalhost%3A8766`. 이메일 칸 표시 |
| ⏳ OAuth 실제 로그인·연결 | 작가님 클릭이 필요하다. 순서 3줄은 07:31 쌍아에게 보냈다 |

## 3. 기존 계정 이관 — '신작가'

- **테스트 데이터:**
  - 실사용 `~/.monkos/go-board/users.json`과 소유 방 32개를 **읽기만** 해서 `_test/`로 복사했다.
  - 기존 `_test/users.json`은 `users.json.bak-makne8-20261105-072856`으로 백업했다.
  - 실사용 파일은 손대지 않았다. 막내2의 07:20 6단 지정도 그대로다.
- **연결 전 실측**(8766 API, 신작가 입장): 표기 "신작가 6단", 희망 급수 6d, 방 32개, AI 전적 **2승 30패 무효 0**, 수준별 2행.
- **연결이 보존을 보장하는 근거:**
  - `link_portal`은 사용자 레코드에 `portal`·`portal_provider`·`portal_linked`만 쓰고 users.json만 저장한다. 방 파일은 쓰지 않는다.
  - 전적(`my_stats`)과 방 목록은 uid로 모으는데, uid는 바뀌지 않는다.
  - 단위 테스트가 이를 검증한다: 연결 뒤 uid·nick·rank가 같고, 파일에는 portal 필드만 있다.
- **⏳ 연결 후 재측정:** 작가님 클릭 1번(Google 연결) 뒤 같은 API로 재서 이 절에 추가한다.
- **실사용(8765) 이관:** prod 반영 뒤 작가님이 go.monkos.ai 마이페이지에서 같은 방법으로 연결한다. uid는 그대로 유지된다.

## 4. prod 배포 대상 판정표 (실행 안 함 — 작가님 '배포 승인' 사안)

| 순서 | 대상 | 필요 | 근거 |
|---|---|---|---|
| 1 | `monkos-portal` (`deploy.sh prod`) | **필요** | 매직 링크 엔드포인트, 허용 출처 go.monkos.ai, mailer redactLog, OAuth 3종 허용 출처 함수 |
| 2 | 바둑 8765 (`launchctl kickstart -k gui/$(id -u)/ai.monkos.go-board`, 진행 중 판 0 확인 후) | **필요** | server.py·index.html. 운영 기본값 `PORTAL_URL=https://monkos.ai`, `APP_ORIGIN=https://go.monkos.ai`. `GO_NO_LOCAL_ADMIN`은 운영에 넣지 않는다 |
| — | 엣지 | 불필요 | specs·정적 변경 없음. `/auth/*`·`/api/auth/*`는 오리진으로 간다 |
| — | 외부 콘솔 | 불필요(LINE dev 제외) | 콜백은 포털 호스트, 새 시크릿 없음 |

- prod 뒤 검증:
  - go.monkos.ai에서 카카오·Google·**LINE**·이메일 4종 1회씩.
  - 신작가 연결 전후 전적 대조.
  - 포털 로그 마스킹 재확인.
- Firestore 신규 컬렉션 2개(`email_login_tokens`·`email_login_rate`)는 서비스 코드가 쓴다(ch4 10조 예외).

## 5. 결정 필요 (작가님)

- **비로그인 처리:** A 현행(로그인 창) / B AI 대국만 허용 / C 전부 로그인. 구현은 A 유지(설계서 §8).
- **iOS 출시 시 Sign in with Apple:** 4.8 원문상 필요하다. 새 시크릿과 외부 콘솔 설정이 들어간다(설계서 §6).
- **중국:** Google은 본토 차단(GreatFire 100%). 당장은 이메일(+iOS Apple)로 가능하다. 위챗·QQ는 법인·ICP 문제와 함께 결정한다(설계서 §7).
- **이메일 ↔ OAuth 같은 주소 자동 병합:** 하지 않는다(탈취 방지). 필요하면 "로그인 상태에서 수단 추가" 기능을 후속으로 둔다.

## 6. 운영·데이터

- 8766 테스트 인스턴스: PID 78244, 워크트리 코드, `GO_NO_LOCAL_ADMIN=1`, 데이터 `_test/`. 작가님 테스트가 끝나면 PID로 종료한다.
- 측정용 헤드리스 크롬은 PID 78296으로만 기동·종료했다. 공유 브라우저는 쓰지 않았다.
- 이메일 주소: 레포·로그·메시지에 쓰지 않았다. 시험 수신처 info@monkos.ai는 지시서에 명시된 회사 주소다.
- 시크릿: 값을 읽거나 출력하지 않았다. 포털 dev 환경변수는 이름만 확인했다(RESEND_API_KEY 등은 SM 참조).

## 완료 보고

- ✅ 설계서 `monkos-ops/tech/designs/2026-11/DESIGN_20261105_GO_로그인_포털계정연동.md`: 흐름, 이관, 매직 링크, 언어권 버튼, Apple 4.8 원문, 중국 출처, 비로그인 결정 칸.
- ✅ dev 포털 매직 링크 `00247-6n9`, 실발송 200 + 한도·형식 대조군. 테스트 296/296.
- ✅ 8766 바둑 로그인 연결 API·화면 + 바둑 테스트 7/7, 화면 버튼 순서 3개 언어.
- ⏳ OAuth(구글·카카오) 실제 로그인과 신작가 연결 후 전적 재측정: 작가님 클릭 대기(순서 3줄 전달).
- ❌ LINE dev 검증: dev 콜백 미등록 → prod 반영 뒤로(쌍아 결정).
- 📁 포털 `lib/email-login.js`·`lib/auth.js`·`lib/mailer.js`·`lib/shared/config.js`·`server.js`·`__tests__/email-login.test.js` / 바둑 `apps/go-board-web/server.py`·`index.html`·`tools/test_portal_login.py` / 설계서·이 보고서·세션 로그·PF_GO 1행
- 🔀 브랜치 `worktree-makne8-go-login` → 원격 푸시. 병합은 쌍아가 한다.

---
type: completion
date: 2026-11-05
device: iMac
agent: 쌍아-막내8
status: 마감
portfolio: PF_GO
---

# COMPLETION — 바둑 로그인 라이브 버튼 조치 + 재방문 카드 + MONKOS 표기

**[2026-11-05 09:21 KST]** iMac/쌍아-막내8 → iMac/쌍아

- 출처
  - 쌍아 08:30: ① 라이브 점검 ② 작가님 08:30 "한번 로그인했던 사람은 기존 아이디가 떠있고 로그인만 누르는 설정"
  - 쌍아 08:31: (a)·(b) 승인
  - 쌍아 09:14: 작가님 "풀렸으니 다시가동해", 창 제목 제안 승인
- 브랜치: `worktree-makne8-go-login2`

## 1. 결론

- 이메일 버튼은 포털에 이메일 로그인 기능이 있을 때만 나온다. prod 포털은 아직 없어서(404) 버튼이 숨겨지고, dev 포털은 있어서(400) 보인다. 포털이 배포되면 따로 손대지 않아도 버튼이 나타난다.
- 로그인 팝업이 메시지 없이 닫히면, https 환경에서는 `.monkos.ai` 쿠키로 입장을 시도한다.
- 재방문 카드: 이 브라우저에서 마지막으로 쓴 계정을 "신작가 6단 / 카카오로 로그인" 형태로 보여 주고 [로그인] 버튼 1개를 둔다. "다른 계정으로"와 "새로 만들기"는 작은 링크로 둔다.
- 표기를 `MONK 바둑`에서 `MONKOS 바둑`으로 바꿨다(ch8 4조). 창 제목, 대기실, 로그인 창, PWA 이름이 대상이다.
- 🔴 **08:31 보고 정정.** 라이브 8765는 쿠키로 우회되는 상태가 아니었다. 포털 로그인이 전부 실패하고 있었다.
  - 원인: launchd가 쓰는 python.org 3.13에 인증서 묶음이 없어 모든 HTTPS 호출이 `CERTIFICATE_VERIFY_FAILED`로 끝났다.
  - 증거: 8765 로그 49~50행에 `포털 토큰 확인 실패 — URLError`, `포털 메일 중계 실패 — URLError`가 있다.
  - 조치: 시스템 묶음 `/etc/ssl/cert.pem`을 쓰도록 바꿨다. 인증서 검증은 끄지 않았다.
  - 이 고침이 들어가기 전까지는 라이브에서 카카오·Google 로그인도 입장되지 않는다.

## 2. 변경

| 파일 | 내용 |
|---|---|
| `apps/go-board-web/server.py` | `_ssl_ctx()`/`_urlopen` 추가(포털 호출 3곳에 적용) · `portal_email_available()`(빈 POST: 400=있음, 404=없음, 캐시 성공 600s·실패 60s) · config에서 이메일 필터, `email` 필드 · `mask_email()` · 로그인 응답 `login{provider, emailMasked}`. 원래 이메일 주소는 저장하지 않고 응답에도 싣지 않는다 |
| `apps/go-board-web/index.html` | 재방문 카드(`#aLast`)와 `#aFull` 묶음 · localStorage `monk_go_last`={nick, display, provider, emailMasked}(토큰 없음) · 팝업 닫힘 폴링 후 쿠키 입장 · `#authDlg [hidden]` 우선 규칙 · 표기 MONKOS |
| `apps/go-board-web/pwa/manifest.webmanifest` | name·short_name을 `MONKOS 바둑`으로 |
| `apps/go-board-web/tools/test_portal_login.py` | 마스킹 · 탐침(400/404/URLError/캐시) · 인증서 묶음 테스트 추가, 7건 → 10건 |

- 함께 고친 기존 결함: `.dlg-body label`과 `.portal-email`의 `display:flex`가 hidden 속성을 덮고 있었다. 그래서 입장 모드에서도 희망 급수·인수 코드·이메일 칸이 보였다. 이번 변경 전부터 있던 문제다.

## 3. 검증 (8766, `GO_NO_LOCAL_ADMIN=1`, PID 94938 · 별도 헤드리스 크롬 PID 94264, PID로만 종료)

- 단위 테스트: `python3 -I tools/test_portal_login.py` 10/10 OK
- config 확인
  - 고치기 전 8766: `email:false`. dev 포털은 400인데도 Python에서 SSL 실패가 났다. 이것이 원인 발견의 계기다.
  - 고친 뒤: `email:true`, 버튼 3개(카카오·Google·이메일)
  - 대조군: prod `https://monkos.ai/api/auth/email/start`는 404이므로, 라이브에서는 이메일 버튼이 숨겨진다.
- 무효 토큰 처리: 로그가 `URLError`에서 `HTTPError`로 바뀌었다. 포털까지 실제로 도달해 401을 받았다는 뜻이다.
- 화면 10단계(전부 통과, 캡처는 job tmp `revisit_*.png`)

| # | 상황 | 결과 |
|---|---|---|
| 1 | 첫 방문(기억 없음) | 전체 로그인 창 표시, 카드 없음 |
| 2 | 바둑 아이디로 입장 | 기억 = `{신작가, 신작가 6단, nick}` |
| 3 | 로그아웃 후 재방문 | 카드 "신작가 6단 / 바둑 아이디로 입장", 제목 "MONKOS 바둑 — 로그인", 하단 버튼 숨김 |
| 4 | [로그인] | 대기실 진입, 닉 표시 "신작가 6단" |
| 5 | 수단 카카오 기억 | 카드 "카카오로 로그인" |
| 6 | [로그인] | 카카오 팝업 주소 1건. 팝업이 닫힌 뒤 안내 "로그인 창이 닫혔습니다"(http라서 쿠키 시도는 생략) |
| 7 | 수단 이메일 기억 | "이메일(s***@g***.com)로 로그인" |
| 8 | [로그인] | 이메일 칸 열림, 안내에 마스킹 주소 |
| 9 | 다른 계정으로 | 입장 모드, 숨김 칸 정상 |
| 10 | 새로 만들기 | 가입 모드 |

- 쓴 계정은 `_test` 저장소의 테스트 계정 신작가뿐이다. 실서비스 계정과 포털 계정에는 쓰지 않았다.

## 4. 남은 일

- ⏳ main 병합(쌍아) → 판 0 확인 → `launchctl kickstart -k gui/$(id -u)/ai.monkos.go-board`(막내8 단독) → 라이브 config 2회 히트로 `email:false`·버튼 2개 확인, 로그에 URLError 0건 확인
- ⏳ 라이브 카카오·Google 실제 클릭은 작가님 몫이다. 단, prod 포털에는 go.monkos.ai 허용 출처가 아직 없어 팝업 메시지가 버려진다. 팝업이 닫히면 이번 (b)의 쿠키 입장으로 들어가게 된다.
- 💡 인증서 문제는 다른 python.org 파이썬 도구에도 있을 수 있다. 근본 대안은 `Install Certificates.command`를 1회 실행하는 것이다(전역 환경 변경이므로 작가님 승인 사항).

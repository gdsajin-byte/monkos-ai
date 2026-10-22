---
type: completion
date: 2026-10-22
device: iMac
agent: 쌍아-막내3
status: 중단
portfolio: PF_SECURITY
subject: "포털 env 평문 시크릿 SM 전환 — 절차 2 중단 (ORDER_20261022 SECURITY)"
---

# COMPLETION(중단 보고) — 포털 env 평문 시크릿 SM 전환

**[2026-10-22 17:06 KST]** iMac/쌍아-막내3 → iMac/쌍아

> 지시서: [ORDER_20261022_iMac쌍아_막내_SECURITY_포털env평문시크릿_SM전환.md](../../orders/2026-10/ORDER_20261022_iMac쌍아_막내_SECURITY_포털env평문시크릿_SM전환.md)
> 투입 출처: 작가님 2026-10-22 17:04 iMac 쌍아 세션 사람 턴 "막내 투입은 너가 할수 있잖아"(16:23 "진행해" 범위), 쌍아 직접 전달.

⏳ **결론**: 절차 2에서 예정대로 중단. `TELEGRAM_EVENT_BOT_TOKEN` SM 미등재 — 생성하지 않음. 작가님 등재 후 절차 3부터 재개.

## 단계별 판정

| 절차 | 판정 | 방법 |
|------|------|------|
| 1. 값 일치 (SM 존재 3종) | ✅ dev·prod 모두 **Y** (TELEGRAM_BOT_TOKEN · TELEGRAM_TEAM_BOT_TOKEN · TEAM_NOTIFY_SECRET) | `services describe --format json`의 env 값과 SM `latest`를 프로세스 메모리 안에서 sha256 비교, Y/N만 출력. 값·해시 미기록 |
| 1-부가. 현행 주입 형태 | 4종 전부 dev·prod **평문 env** (secretKeyRef 아님) | 같은 조회에서 `valueFrom` 유무만 판정 |
| 2. TELEGRAM_EVENT_BOT_TOKEN | ❌ **SM 없음** → 중단 | `scripts/secret.sh check` → `❌ 없음` (17:05) |
| 3. deploy.sh 수정 | ⏳ 미착수 | — |
| 4. dev 배포·검증 | ⏳ 미착수 | — |
| 5. prod 승인 요청 | ⏳ 미착수 (요청 시각 없음) | — |
| 6. SECRET_INVENTORY 갱신 | ⏳ 미착수 | — |

## 재개 조건 (작가님 손)

```
시크릿 등록이 필요합니다. 터미널에서 secret 실행해주세요.
이름: TELEGRAM_EVENT_BOT_TOKEN
발급처: 텔레그램 @BotFather — 이벤트봇 토큰 (현행 포털 env에 들어 있는 값과 같은 것. 로테이션 불요 판정)
용도: monkos-portal(+dev) 이벤트봇 발송 — 평문 env → SM 참조 전환
```

등재 후 재개 시 절차 1의 해시 대조를 이 변수에도 1회 수행(불일치면 중단).

## 참고 (재개 시 주의)

- `deploy.sh`는 이미 TOSS_CLIENT_KEY 이행 때 "평문 env와 시크릿 참조 동명 공존 시 Cloud Run 배포 거부"를 겪고 선제 `--remove-env-vars` 블록을 뒀다(202~210행). 4종도 같은 패턴이 필요할 가능성이 높다 — 지시서 3항대로 dev에서 실측.
- 3종만 먼저 전환하는 부분 진행은 지시서에 없는 범위라 하지 않았다.

📁 산출: 본 COMPLETION · 세션 로그 `sessions/2026-10/2026-10-22_iMac_쌍아-막내3.md` · PF_SECURITY 1행. 운영 파일 변경 0.
🔀 쌍아 판단: 작가님께 등재 요청 전달 / 등재 후 막내3 재투입(같은 지시서).

---

## 추가 보고 — 재개 지시 수신 후 2차 중단

**[2026-10-22 17:11 KST]** iMac/쌍아-막내3 → iMac/쌍아

> 수신: 쌍아(monk-project-e1) 세션 간 메시지 17:10 — 출처 "작가님 17:10 쌍아 세션 사람 턴 'A 승인'"(A안 = 현행 env 값을 화면 미노출로 SM 등재). 이어서 절차 3~4까지.

⏳ **결론**: 다시 중단. 사유 2건.

1. **dev·prod 값 불일치** (쌍아 지시의 중단 조건): dev `monkos-portal-dev`의 `TELEGRAM_EVENT_BOT_TOKEN`은 **이름만 있고 값 없음(빈 env)**, prod `monkos-portal`에만 값이 있다. 판정 방법: describe JSON에서 env 항목의 키 구성·값 길이만 출력(값 미출력).
   - **1차 보고 정정**: 17:06 표의 "4종 전부 dev·prod 평문 env"는 dev 이벤트봇 토큰에 한해 틀렸다 — 빈 값 env였다. 나머지 3종의 dev 일치 Y는 유효하다(SM 값과 같았음).
2. **시크릿 생성은 이 세션에서 하지 않음**: `gcloud secrets create`는 집행 훅 E5 deny 대상이고(헌법 4조 1항·data-access "직접 실행 금지 — secret 커맨드 경유"), 원 지시서 절차 2도 등재 경로를 작가님 `secret.sh add`로 지정했다. 승인은 세션 간 메시지로 승계되지 않으므로(ch1 7조 2항) 우회 경로(secret.sh에 파이프로 넘기기 등)도 쓰지 않는다.

## 작가님 실행안 (값이 화면에 나오지 않음)

prod env 값을 그대로 SM에 넣는 1줄(작가님 터미널, 출력 없음):

```bash
gcloud run services describe monkos-portal --region us-central1 --project monkos --format=json \
 | python3 -I -c 'import json,sys;d=json.load(sys.stdin);v=[e["value"] for e in d["spec"]["template"]["spec"]["containers"][0]["env"] if e["name"]=="TELEGRAM_EVENT_BOT_TOKEN"][0];sys.stdout.write(v)' \
 | gcloud secrets create TELEGRAM_EVENT_BOT_TOKEN --project monkos --replication-policy=automatic --data-file=-
```

또는 `secret add TELEGRAM_EVENT_BOT_TOKEN` (@BotFather에서 이벤트봇 토큰 복사).

## 재개 시 판단 필요 (쌍아)

- dev가 지금 빈 값이므로, SM 참조로 바꾸면 **dev는 처음으로 이벤트봇 실토큰을 갖게 된다**(dev에서 이벤트 알림이 실제로 발송되기 시작할 수 있다). 허용할지, 아니면 dev는 이 변수를 제외하거나 별도 처리할지 결정해야 한다.
- 등재 후 재투입 시: SM 값 ↔ prod env 해시 대조 → 절차 3~4.

---

## 3차 — dev 전환 완료 · prod 승인 대기

**[2026-10-22 17:40 KST]** iMac/쌍아-막내3 → iMac/쌍아

> 수신: 쌍아 세션 간 메시지 17:15 결정 전달(출처 작가님 17:13 "2번승인" — dev는 EVENT 토큰 미적용·현행 빈 값 유지, prod만 4종) · 17:3x 알림(EVENT 토큰 작가님 터미널 등재 17:16, version 1). 절차 3~4는 원 지시서 허용 범위.

✅ **결론**: dev 3종 SM 참조 전환·스모크 합격. prod는 선행 조건(4종 SM 존재·값 일치) 충족, **배포는 작가님 새 사람 턴 승인 대기**.

### 절차 3 — deploy.sh (커밋 `04128ba4`)

- `SM_MIGRATE_KEYS` = 공통 3종 + 환경별 `EXTRA_SM_KEYS`(prod=`TELEGRAM_EVENT_BOT_TOKEN`, dev=빈 값). `SECRETS`에 `{KEY}={KEY}:latest`로 추가.
- 현행 서비스에 동명 평문 env가 있으면 **같은 `gcloud run deploy` 명령에 `--remove-env-vars`** 를 붙인다(값 미출력, 이름만 경고 출력).
- 194행 주석을 이 지시서·INCIDENT_20261021 근거로 갱신. 기존 TOSS 선제 제거 블록은 유지.

### 절차 4 — dev 판정표

| 항목 | 판정 | 방법 |
|------|------|------|
| `deploy.sh dev --yes` | ✅ exit 0 · 리비전 `monkos-portal-dev-00192-x52` (직전 `00191-pcd`, 롤백용) | 정본 경유, 워크트리 커밋본 빌드 |
| 동명 평문→시크릿 한 번에 전환 | ✅ `--remove-env-vars` 동반으로 **같은 배포 1회에 성공** — 선제 `services update` 불요 | 위 배포 로그 |
| describe 3종 | ✅ `TELEGRAM_BOT_TOKEN`·`TELEGRAM_TEAM_BOT_TOKEN`·`TEAM_NOTIFY_SECRET` = `secretKeyRef {이름}:latest` | describe JSON의 `valueFrom` 유무만 출력 |
| dev EVENT 토큰 | ✅ 평문 빈 값(길이 0) 유지 — 결정대로 | 같은 조회 |
| 기동 로그 | ✅ CS Bot·Team Bot "설정됨", Event Bot "미설정"(의도대로) | 리비전 00192 기동 로그 `jsonPayload.message` |
| `/api/team/notify` 음성 대조군 | ✅ 틀린 시크릿 → **403** | curl, 헤더는 stdin(`-H @-`) |
| `/api/team/notify` 양성 (TEAM_NOTIFY_SECRET 경로) | ✅ SM 값 → **200** `{"ok":true}` · 팀 채널 발송 1건 | 같음 |
| `/api/webhook/telegram-team` `/help` (팀봇 토큰 경로) | ✅ **200** · 봇 회신 팀 채널 1건 | 같음 |
| 텔레그램 발송 실패 로그 | ✅ 스모크 구간 0건 — ⚠️ **약한 증거**: 30일 전체 실패 로그도 0건이라 조회의 양성 대조 없음. 팀 채널에 스모크 메시지 2건("dev SM 전환 스모크 1/2" + `/help` 도움말) 도착 여부를 사람 눈으로 1회 확인 권장 | `gcloud logging read` (jsonPayload) |

### prod 선행 조건 (17:40 재측정)

- prod 4종 SM `latest` ↔ 현행 평문 env 해시 일치: **Y / Y / Y / Y** (EVENT 토큰 포함). 값·해시 미기록.
- prod 배포 시 예상 동작: 4종 `--remove-env-vars` + `secretKeyRef` 전환. 검증은 절차 4와 동일 + CS봇·이벤트봇 웹훅 각 1회.

### 남은 것

- ⏳ 절차 5 prod: 작가님 새 사람 턴 승인 후 `deploy.sh prod` (main 브랜치 게이트 — 메인 체크아웃에서 실행).
- ⏳ 절차 6 SECRET_INVENTORY: prod 전환 후 일괄 갱신(EVENT 토큰 신규 행 포함).

---

## 4차 — prod 전환 완료 (지시서 전 절차 완료)

**[2026-10-22 18:43 KST]** iMac/쌍아-막내3 → iMac/쌍아

> 승인: **작가님 2026-10-22 18:37 이 세션 사람 턴 "prod 배포 승인"** (훅 E10 승인 토큰 발급 — 세션 바인딩·1회용). 실행 1회.

✅ **결론**: prod 4종 SM 참조 전환 완료·스모크 합격. 절차 1~6 전부 종료. (파일명 `_중단`은 1차 보고 시점 명명 — 최종 상태는 완료)

### 절차 5 — prod 판정표

| 항목 | 판정 | 방법 |
|------|------|------|
| 배포 전 점검 | ✅ 메인 체크아웃 = origin/main `90837605`, portal 디렉터리 클린, prod 직전 리비전 `00566-ngn`(10-05) 이후 portal 변경 = `04128ba4` 1건뿐(타 작업 동승 없음) | git status·log |
| `deploy.sh prod --yes` | ✅ exit 0 · 리비전 **`monkos-portal-00567-bhd`** 100% · 롤백 = `00566-ngn` | 메인 체크아웃(main 게이트) |
| 평문 제거 | ✅ 배포 로그 "평문 env → SM 참조 전환: 4종" — 같은 배포 1회 | 배포 로그 |
| describe 4종 | ✅ `TELEGRAM_BOT_TOKEN`·`TELEGRAM_TEAM_BOT_TOKEN`·`TEAM_NOTIFY_SECRET`·`TELEGRAM_EVENT_BOT_TOKEN` = `secretKeyRef {이름}:latest` | `valueFrom` 유무만 출력 |
| 기동 로그 | ✅ CS·Event·Team Bot 모두 "설정됨" | 리비전 00567 `jsonPayload.message` |
| `/api/team/notify` | ✅ 음성(틀린 시크릿) **403** · 양성(SM 값) **200** + 실패 로그 0 → 팀 채널 1건 발송 | curl, 헤더 stdin |
| 팀봇 웹훅 `/api/webhook/telegram-team` | ✅ 200 + 텔레그램 "chat not found" | 판별 chat_id=1 (아래) |
| CS봇 웹훅 `/api/webhook/telegram` (callback `cs_chat`) | ✅ 200 + "chat not found" | 같음 |
| 이벤트봇 웹훅 `/api/webhook/telegram-event` (`/start`) | ✅ 200 + "chat not found" | 같음 |
| 라이브 헬스 | ✅ `https://monkos.ai/health` 200 healthy | 엣지 경유 2회 히트, 2차 판정 |

**판별 방법**: 존재하지 않는 chat_id=1로 회신하게 해, 텔레그램 응답으로 토큰 인증을 가린다 — 유효 토큰은 "Bad Request: chat not found", 무효 토큰은 "Unauthorized". 3봇 모두 "chat not found"(09:42:46/47/48Z, 요청 순서와 일치) = 3개 토큰 전부 텔레그램 인증 통과. 실발송 0. 이 실패 로그가 실제로 찍힌다는 것이 곧 **로그 경로의 양성 대조**이므로, notify 양성 건의 "실패 로그 0"도 유효한 증거가 된다(3차 판정표의 약한 증거 단서는 prod 기준으로 해소).

### 절차 6 — SECRET_INVENTORY

- #22·#23·#25 주입 방식을 "SM `latest` 참조(dev·prod)"로 갱신, **#25-E `TELEGRAM_EVENT_BOT_TOKEN` 신규 행**(prod 전용, dev 미적용 사유 포함). 값 미기재.

### 남은 것 / 참고

- dev `TELEGRAM_EVENT_BOT_TOKEN`은 빈 평문 env로 남아 있다(결정대로). 나중에 dev도 SM 참조로 바꾸면 dev에서도 이벤트봇 실발송이 시작된다.
- 텔레그램 토큰 4종은 이제 `describe`·콘솔에 값이 나오지 않는다. 남은 평문 env 19종은 비시크릿 설정값으로 본다(이번 범위 밖, 전수 감사는 하지 않음).

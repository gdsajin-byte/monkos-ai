---
type: order
date: 2026-07-25
device: iMac
agent: 쌍아
receiver: 막내
status: 대기
portfolio: PF_SECURITY
---

# 지시서 — 토스 클라이언트 키 dev/prod 분리 (플레이스홀더 서빙 치환)

**[2026-07-25 14:00 KST]** iMac/쌍아 → 막내

> 근거: 2026-07-25 쌍아 실측 — 토스 **클라이언트 키가 정적 파일 3곳에 하드코딩**되어 `deploy.sh`의 dev 테스트키 주입을 타지 않음. **dev 환경에서 라이브 위젯이 떠 실결제가 발생**하는 상태.
> 작가님 승인: 2026-07-25 13:56 KST, **B안(서빙 시 치환)** 채택. A안(서버 주입 전환)은 중기 과제로 별도 기안.
> 참조: 세션로그 [2026-07-25_iMac_쌍아.md](../sessions/2026-07/2026-07-25_iMac_쌍아.md) 13:47·13:50·13:53 항목

## ⚠️ 준수 조항

- **헌법 4조 1항** — 시크릿 값 생성·추측·placeholder 값 삽입 **금지**. 본 지시서의 `__TOSS_CLIENT_KEY__`는 *치환 대상 토큰 문자열*이지 키 값이 아니다. **실제 키 값을 코드·커밋에 넣지 말 것.**
- **ch5 2조** — 배포는 반드시 `./deploy.sh {env}` 경유. `gcloud run deploy` 직접 실행 금지.
- **결제 코드 접촉 최소** — 본 작업은 **값 전달 경로만** 바꾼다. `charge.html`·`credits.html`의 **결제 위젯 초기화 로직은 건드리지 말 것**(동기 상수 구조 유지).
- **무음 강등 금지** — 환경변수 미주입 시 키가 빈 문자열이 되어 위젯이 **조용히 안 뜨는** 상태가 최악이다. 반드시 아래 §5 실패 가시화를 구현할 것.
- **prod 배포 금지** — 본 지시서 범위는 **dev 배포·검증까지**. prod 승격은 작가님 별도 승인 후.

## 선행 조건 (착수 전 실측 확인 필수)

```bash
scripts/secret.sh check TOSS_CLIENT_KEY        # live — 등재 확인
scripts/secret.sh check TOSS_CLIENT_KEY_TEST   # test — 작가님 등록 대기 중일 수 있음
```

- `TOSS_CLIENT_KEY_TEST`가 **미등재이면 착수하지 말고 보고**할 것. (작가님 `secret` 실행 필요)
- 현재 `portal/deploy.sh:91`에는 테스트 클라이언트 키가 **평문 하드코딩**되어 있다. 본 작업에서 **SM 참조로 전환**한다.

---

## 작업 목록

### 1. portal — `credits.html` 하드코딩 제거

**파일**: `monkos_AI/portal/public/credits.html`

227행을 플레이스홀더로 교체한다. **495행(`TossPayments(TOSS_CLIENT_KEY)`)은 변경하지 않는다.**

```js
// AS-IS (227행)
var TOSS_CLIENT_KEY = 'live_gck_...';

// TO-BE
var TOSS_CLIENT_KEY = '__TOSS_CLIENT_KEY__';
```

### 2. portal — `server.js` 정적 서빙에 치환 삽입

**파일**: `monkos_AI/portal/server.js` (정적 서빙부 1227~1250행 구간)

`readFileSync`로 읽은 뒤 `res.end(content)` 하기 **전에**, 대상 파일에 한해 치환한다.

- 대상 한정: `filePath`가 `/credits.html` 또는 확장자 폴백으로 `credits`가 해석된 경우
- 치환: `__TOSS_CLIENT_KEY__` → `process.env.TOSS_CLIENT_KEY`
- `content`가 Buffer이므로 `toString('utf8')` → 치환 → 응답
- **캐시 헤더**: 치환 대상은 환경별로 내용이 달라지므로 `Cache-Control: no-cache`로 강제할 것 (현행 `.html` 기본값 `public, max-age=3600`을 그대로 두면 CDN·브라우저가 타 환경 값을 캐시할 위험)

### 3. studio — `config.js` + 전용 라우트

**파일 3-1**: `monkos_AI/studio/public/config.js` 29행

```js
// TO-BE
export const TOSS_CLIENT_KEY = '__TOSS_CLIENT_KEY__'; // 위젯 키 — 서버 치환 주입
```

**파일 3-2**: `monkos_AI/studio/server.js`

studio는 Express이며 `app.use(express.static(...))`(659행 부근)로 서빙한다. **`express.static`보다 위에** `config.js` 전용 라우트를 등록한다. (Express는 등록 순서대로 매칭 — 순서가 틀리면 static이 원본을 먼저 내보낸다.)

```js
app.get('/config.js', (req, res) => { /* 파일 read → 치환 → JS MIME + no-cache 응답 */ });
```

### 4. idphoto-kr — `config.js` + 전용 라우트

**파일 4-1**: `monkos_AI/idphoto-kr/public/config.js` 29행 — §3-1과 동일

**파일 4-2**: `monkos_AI/idphoto-kr/server.js` — §3-2와 동일 패턴. `app.use(express.static(...))`(738행 부근)보다 **위에** 배치.

### 5. 실패 가시화 (필수 — 무음 강등 금지)

3개 서비스 각각의 **서버 기동 시점**에, `process.env.TOSS_CLIENT_KEY`가 비어 있으면 **명시적 ERROR 로그**를 남긴다. (portal `server.js:1270~1276`의 기존 토스 키 검사 블록이 선례 — 동일 톤으로 맞출 것)

- 빈 값일 때: `🚨 TOSS_CLIENT_KEY 미주입 — 결제 위젯이 뜨지 않습니다` 수준의 ERROR
- prod인데 `test_` 로 시작할 때: 경고 (portal 기존 패턴 준용)
- **치환 실패로 `__TOSS_CLIENT_KEY__` 문자열이 그대로 응답에 나가는 경우도 검출 대상** — 최소한 로그로 남길 것

### 6. deploy.sh 3종 — 시크릿 주입 배선

**6-1. `monkos_AI/portal/deploy.sh`**
- 91행 `TOSS_CLIENT_KEY_OVERRIDE="test_gck_..."` **평문 하드코딩 제거**
- dev/prod 분기에서 **SM 참조**로 전환: dev → `TOSS_CLIENT_KEY_TEST`, prod → `TOSS_CLIENT_KEY`
- 192행 `TOSS_SECRET_KEY=${TOSS_SECRET_KEY_NAME:-TOSS_SECRET_KEY}:latest` 패턴을 그대로 준용할 것

**6-2. `monkos_AI/idphoto-kr/deploy.sh`**
- 126행 `--set-secrets="AUTH_SECRET=AUTH_SECRET:latest"` 에 `TOSS_CLIENT_KEY` 추가
- dev 분기(60행)에서 `TOSS_CLIENT_KEY_TEST` 참조하도록 변수화

**6-3. `monkos_AI/studio/deploy.sh`**
- **`--set-secrets` 자체가 없다.** 신설하여 `TOSS_CLIENT_KEY` 주입
- dev 분기(51행)에서 `TOSS_CLIENT_KEY_TEST` 참조하도록 변수화

### 7. dev 배포 + 검증

```bash
cd monkos_AI/portal      && ./deploy.sh dev
cd monkos_AI/studio      && ./deploy.sh dev
cd monkos_AI/idphoto-kr  && ./deploy.sh dev
```

**검증 (3서비스 전부, 실측 결과를 COMPLETION에 기재)**

| # | 확인 | 합격 기준 |
|---|---|---|
| 1 | dev 페이지 소스에서 키 문자열 확인 | **`test_gck_` 로 시작** |
| 2 | dev 결제 페이지에서 **위젯이 실제로 렌더되는지** | 위젯 노출 확인 (스크린샷 첨부) |
| 3 | 플레이스홀더 잔존 여부 | `__TOSS_CLIENT_KEY__` 문자열이 응답에 **없어야 함** |
| 4 | prod 무영향 | prod 페이지 소스가 **`live_gck_` 유지**(배포하지 않았으므로 변동 없어야 정상) |
| 5 | 기동 로그 | 실패 가시화 로그가 정상 조건에서 **오탐 없이 조용한지** |

- ⚠️ **dev에서 실결제 버튼을 끝까지 누르지 말 것.** 검증 1~3은 소스·렌더 확인까지만. 테스트 결제 실주행은 작가님 지시 후.

### 8. 마감

- COMPLETION 보고서: `monkos-ops/ops/reports/2026-07/COMPLETION_20260725_iMac막내N_SECURITY_토스키dev분리.md`
- 세션 로그 어펜드 + 커밋 → 푸시
- 커밋 카테고리: `[ops]` 또는 `[fix]`

---

## 완료 조건

- [ ] 정적 파일 3곳에서 `live_gck_` 문자열 **완전 제거** (grep 0건)
- [ ] dev 3서비스 소스에서 `test_gck_` 확인
- [ ] dev 3서비스 결제 위젯 **정상 렌더** (스크린샷)
- [ ] `deploy.sh` 3종 SM 참조 전환 (평문 하드코딩 0건)
- [ ] 실패 가시화 구현 + 오탐 없음
- [ ] prod 미배포 상태 유지

## 범위 밖 (하지 말 것)

- ~~prod 배포 · 승격~~ → **2026-07-25 15:20 KST 작가님 승인. §9로 범위 확장.**
- `charge.html`·`credits.html` 결제 초기화 로직 수정
- `/api/config` 엔드포인트 신설 (= A안, 별건)
- Lemon Squeezy 관련 일체
- 유휴 키·시크릿 정리 (별건) — **dev 평문 env 건은 작가님 15:14 「보류」 판정. 후속 지시 전까지 무접촉.**

---

# §9. prod 승격 (2026-07-25 15:20 KST 작가님 승인 — 범위 확장분)

**[2026-07-25 15:20 KST]** iMac/쌍아 → 막내1

> 선행: dev 검증 5/5 통과, 커밋 `4b566aa2` 푸시 완료, 쌍아 사후 검토 통과(§2 재설계 추인).

## 9.1 배포

```bash
cd monkos_AI/portal      && ./deploy.sh prod
cd monkos_AI/studio      && ./deploy.sh prod
cd monkos_AI/idphoto-kr  && ./deploy.sh prod
```

- `TOSS_CLIENT_KEY`(라이브) 자동 분기 — 별도 조작 불요.
- ⚠️ `deploy.sh:109~111` **prod 비-live 키 배포 차단 가드**가 살아있는지 배포 로그에서 확인할 것. 차단이 걸리면 **즉시 중단하고 보고**.

## 9.2 승격 직후 필수 확인 — ⚠️ 난독화 재설계분의 prod 실동작

**§2에서 dev용으로 재설계한 `window.__MONKOS_TOSS_CK__` 주입 방식이 prod 빌드에서도 동작하는지가 이번 승격의 유일한 미검증 지점이다.** dev·prod가 같은 Dockerfile을 타므로 동작이 예상되나 **실측 전 단정 금지**.

| # | 확인 | 합격 기준 |
|---|---|---|
| 1 | prod 3서비스 결제 페이지 소스 | 키가 **`live_gck_` 로 시작** |
| 2 | **위젯 실렌더** | 3/3 정상 노출 (스크린샷) — 테스트 배너 **없어야** 정상 |
| 3 | 플레이스홀더·전역변수 잔존 | `__TOSS_CLIENT_KEY__` 원문 노출 **0** |
| 4 | 기동 로그 | §5 실패 가시화 ERROR **0건** |
| 5 | dev 무영향 | dev 3서비스 여전히 `test_gck_` |

- **위젯이 뜨지 않으면 즉시 이전 리비전으로 롤백 후 보고.** 유료 경로 정지는 무음 강등에 해당한다.
- ⚠️ **prod에서 결제 버튼을 끝까지 누르지 말 것.** 실결제가 발생한다. 소스·렌더 확인까지만.

## 9.3 마감

- 기존 COMPLETION 파일에 **§9 승격 결과 섹션 추가**(신규 파일 생성 불요)
- prod 리비전 번호 3종 기재 + 스크린샷
- PF_SECURITY 히스토리 상태 `✅ (prod 승격 ⏳)` → **`✅`** 로 갱신
- 커밋 → 푸시

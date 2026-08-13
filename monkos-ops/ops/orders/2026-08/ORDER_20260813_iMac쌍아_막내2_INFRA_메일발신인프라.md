---
type: order
date: 2026-08-13
from: iMac/쌍아
to: iMac/막내2
subject: "메일 발신 인프라 구축 — Resend 도메인 인증(SPF 병합·DKIM·DMARC) + 발송 모듈 신설"
status: 대기
portfolio: PF_INFRA
---

# ORDER — 메일 발신 인프라 (Resend)

**[2026-08-13 15:58 KST]** iMac/쌍아 → iMac/막내2

> **발행 근거**: 작가님 직접 지시(08-13 15:58) — 08-13 회원 탈퇴 요청 대응 중 발신 불능 실측에 따름.
> **착수 전 필독**: [`.claude/rules/data-access.md`](../../../../.claude/rules/data-access.md) 시크릿 운용 원칙 + [`.claude/rules/references.md`](../../../../.claude/rules/references.md) 도구 3요건 + [PF_INFRA/README.md](../../portfolios/PF_INFRA/README.md)
> **관련 지시서**: [ORDER_20260813_막내1_PORTAL_회원탈퇴처리도구](ORDER_20260813_iMac쌍아_막내1_PORTAL_회원탈퇴처리도구.md) — 그 Phase B 완료 통지가 본 인프라의 첫 소비처. **파일 충돌 없음**(막내1은 `scripts/credits.sh`, 본 건은 `portal/lib/`·DNS).

## 1. 배경 — 실측된 공백

2026-08-13 실측. `info@monkos.ai`는 **받기만 되고 보내기가 안 되는 주소**다.

| 항목 | 실측값 | 함의 |
|------|--------|------|
| MX | `route1/2/3.mx.cloudflare.net` | CF Email Routing = **수신 전용 포워딩**. 발신 미제공 |
| SPF | `v=spf1 include:_spf.mx.cloudflare.net ~all` | 발신 서버 미등재 |
| DMARC | **레코드 없음** | 정책 부재 = 도메인 사칭 무방비 |
| 서비스 발송 코드 | nodemailer·resend·sendgrid·smtp **전무** | 프로그램 발송 불가 |
| 발신 이력 | `from:info@monkos.ai` 보낸편지함 0건 | send-as 미설정 |

**실피해**: 08-13 회원 탈퇴 회신을 작가님 **개인 주소(`gdsajin@gmail.com`)로 발송**할 수밖에 없었다(15:51, 비가역). 개인정보처리방침이 공식 CS 주소로 안내한 `info@monkos.ai`에 답장 수단이 없다.

**파급**: 탈퇴 완료 통지, 결제 영수증, 가입 환영, 장애 공지 — 전부 동일 병목. 이번 건 한정 이슈가 아니다.

## 2. 산출물

| 파일 / 대상 | 작업 |
|------|------|
| Cloudflare DNS (monkos.ai zone) | SPF **병합** 수정 + DKIM 신설 + DMARC 신설 |
| `monkos_AI/portal/lib/mailer.js` | 신설 — Resend API 경유 발송 모듈 |
| `monkos_AI/portal/lib/shared/config.js` | 발신 주소·발신자명·API 키 상수 추가 |
| `monkos_AI/portal/deploy.sh` | `--set-secrets` 라인에 `RESEND_API_KEY` 추가 |
| `monkos-ops/ops/SECRET_INVENTORY.md` | 메타 1행 추가 (값 절대 금지) |
| `.claude/rules/references.md` | 도구 맵에 `mailer.js` 1행 등재 |
| `monkos-ops/ops/reports/2026-08/COMPLETION_...md` | 완료 보고 |

## 3. Phase 0 — 작가님 선행 작업 (막내 착수 불가)

**막내2는 이 단계가 끝나기 전 Phase 1에 착수하지 말 것.** 착수 전 `secret check RESEND_API_KEY`로 실측 확인한다.

작가님 수행 항목:
1. Resend 가입 → 도메인 `monkos.ai` 추가 → 대시보드가 제시하는 DNS 레코드 값 확보
2. API 키 발급
3. 시크릿 등록 — 에이전트가 값을 만지지 않는다. 표준 문구:
   ```
   시크릿 등록이 필요합니다. 터미널에서 secret 실행해주세요.
   이름: RESEND_API_KEY
   발급처: Resend 대시보드 → API Keys
   용도: monkos.ai 메일 발신 (탈퇴 완료 통지·영수증·CS 회신)
   ```
4. Resend가 제시한 **DKIM 레코드 값**을 막내2에게 전달 (도메인마다 값이 다르므로 추측 불가)

## 4. Phase 1 — DNS 3종

Cloudflare DNS 조작은 `CF_API_TOKEN` + `CF_ZONE_ID`(SECRET_INVENTORY 6·7번) 경유. **`CF_ZONE_ID`가 monkos.ai zone인지 monk.kr zone인지 먼저 실측 확인할 것** — 오조작 시 본진 도메인 DNS 훼손.

### 4-1. SPF — ⚠️ **[2026-08-13 16:09 정정] 루트 SPF 병합 불요로 확정**

> **정정 근거**: 16:09 Resend Manual setup 화면 실측. Resend는 return-path를 **`send` 서브도메인**에 두는 방식이며, SPF TXT의 Name이 `send`(= `send.monkos.ai`)다. **루트 `monkos.ai` SPF는 대상이 아니다.**

- **루트 `monkos.ai` TXT(SPF)는 절대 수정하지 말 것.** 현행 `v=spf1 include:_spf.mx.cloudflare.net ~all` 무손상 유지 = CF Email Routing 수신 보존.
- 추가 대상은 `send` 레이블의 SPF TXT 1건뿐이며, 이는 **신규 생성**이다(16:09 dig 실측 공란 확인).
- 발신 정합성: envelope sender가 `send.monkos.ai` → 해당 SPF로 pass. DKIM은 루트(`resend._domainkey.monkos.ai`) 서명이므로 DMARC 정렬은 DKIM으로 성립. 루트 SPF 미수정이 결함이 아니다.

### 4-2. DKIM

- Resend가 제시한 이름·값 그대로 등록. 값 추측·변형 금지.
- CF 프록시(주황 구름) **비활성** — DNS 전용 레코드다.

### 4-2b. 추가 대상 4건 확정 (2026-08-13 16:09 실측)

| # | Type | Name | 성격 | 판정 |
|---|------|------|------|------|
| 1 | TXT | `resend._domainkey` | DKIM 공개키 | ✅ 추가 |
| 2 | MX | `send` | 반송·불만 처리 (priority 10) | ✅ 추가 — **서브도메인이므로 루트 MX 무관** |
| 3 | TXT | `send` | 서브도메인 SPF | ✅ 추가 |
| 4 | TXT | `_dmarc` | `v=DMARC1; p=none;` | ✅ 추가 — §4-3 정책과 일치 |

- 4개 이름 전부 16:09 dig 실측 **공란 확인** → 신규 생성, 기존 레코드 덮어쓰기 없음.
- ⚠️ **Resend 대시보드 "Enable Receiving" 토글은 OFF 유지.** 켜면 **루트 MX**를 요구하여 CF Email Routing과 충돌 → `info@monkos.ai` 수신 전면 중단. 본 건은 발신 전용이다.
- ⚠️ **"Auto configure" 사용 금지** — Resend에 CF 존 쓰기 권한 상시 부여 + 사전 미리보기 부재. monk.kr 본진이 같은 계정에 있다.

### 4-3. DMARC — ⚠️ `p=none`부터 시작

- 신설: `_dmarc.monkos.ai` TXT, 정책은 **`p=none`(모니터링)** 으로 시작.
- **처음부터 `p=reject`/`p=quarantine` 금지.** 아직 발신 경로가 검증되지 않은 상태에서 강제 정책을 걸면 정상 메일이 통째로 차단된다. 리포트로 정합성 확인 후 단계 상향은 별도 판단.
- `rua=`(리포트 수신)는 **현 단계 생략** — Resend 제시값 `v=DMARC1; p=none;` 그대로 등록. 1인 운영에 일일 XML 리포트는 노이즈 대비 실익이 낮다. 정책 상향(`quarantine`/`reject`)을 실제로 검토할 때 함께 붙인다.

### 4-4. 검증 (실측 필수)

```
dig +short TXT monkos.ai | grep -i spf     # SPF 1개만 존재 + 양쪽 include 포함 확인
dig +short TXT _dmarc.monkos.ai            # p=none 확인
dig +short MX monkos.ai                    # ⚠️ CF Email Routing 3행 그대로인지 = 수신 무손상 확인
```

- Resend 대시보드 도메인 상태가 **verified**로 전환되었는지 확인.
- **MX가 변경되었다면 즉시 원복하고 보고할 것.** 본 작업은 수신 구성을 건드리지 않는다.

## 5. Phase 2 — 발송 모듈 `lib/mailer.js`

### 5-1. 구현

- Resend **API** 경유(SMTP 아님). 기존 코드 관행대로 순수 JS + async/await.
- 시그니처 예: `sendMail({ to, subject, text, html })` → 성공 시 메시지 id 반환.
- 발신 주소·발신자 표시명은 **`config.js` 상수로 정의하고 참조**한다. `mailer.js`·호출부에 문자열 하드코딩 금지 (ch2 7조).
  - 발신 주소는 `info@monkos.ai`. 표시명은 브랜드 정본 **"MONKOS"** (ch8 — 내부 호칭·엔진명 노출 금지).
- `RESEND_API_KEY`는 `config.js`에서 `process.env` 경유. 코드 하드코딩 금지.

### 5-2. 실패 가시화 (도구 3요건)

- 발송 실패 시 **명시 에러**를 던지거나 반환한다. `catch {}` 후 무음 통과 금지.
- 무료 티어 한도(월 3,000통 / **일 100통**) 초과 시 Resend가 반환하는 에러를 그대로 노출할 것. 한도 초과가 조용히 미발송으로 흡수되면 "보냈다고 믿는데 안 간" 상태가 된다.
- 호출부가 발송 실패를 인지할 수 있어야 한다 — 특히 탈퇴 완료 통지처럼 법적 고지 성격의 메일.

### 5-3. 스모크 (도구 3요건 — 완료 보고 ≠ 실작동)

1. `info@monkos.ai` → 작가님 수신 가능한 주소로 **실제 1통 발송**.
2. 수신 메일의 **원본 헤더에서 `spf=pass` 및 `dkim=pass` 확인**. 캡처 또는 발췌를 완료 보고서에 첨부.
3. **스팸함 도착 여부까지 확인**하여 보고. 받은편지함 정상 도착이 합격선이다.

> 헤더에 pass가 찍히는 것과 실제로 받은편지함에 들어가는 것은 다르다. 둘 다 확인할 것.

## 6. Phase 3 — 등재·배포

1. `deploy.sh --set-secrets`에 `RESEND_API_KEY` 추가.
2. `SECRET_INVENTORY.md` 메타 1행 (이름·용도·서비스·날짜만. **값 절대 금지**).
3. `references.md` 도구 맵에 `mailer.js` 등재 — 분류 "SSR/서비스 모듈", 위치 `monkos_AI/portal/lib/`, 인지 경로 PF_INFRA.
4. 배포: `monkos_AI/portal/deploy.sh` dev → 검증 → prod (ch5. `gcloud run deploy` 직접 실행 금지).

## 7. 범위 밖 (착수 금지)

- **탈퇴 완료 통지 배선** — 막내1의 `credits.sh delete` 완성 후 별도 지시서. 본 건은 발송 기반까지다.
- **영수증·가입 환영 등 개별 메일 템플릿** — 별도.
- **Gmail send-as 연결** — 작가님 수동 작업(Resend SMTP 자격증명 필요). 본 지시서 범위 밖.
- **DMARC 정책 상향(`p=quarantine`/`reject`)** — 리포트 축적 후 별도 판단.

## 8. ⚠️ 준수 조항

- **헌법 4조 1항**: DKIM·SPF include 값은 **Resend가 제시한 값만** 사용. 생성·추측·placeholder 금지. 미수령 시 보류하고 보고.
- **시크릿 운용**: `RESEND_API_KEY`는 `secret` 커맨드 경유 등록(작가님 실행). 막내는 `secret check`로 존재만 확인. **값을 채팅·파일·커밋에 노출 금지.**
- **SPF 단일 레코드 원칙**: §4-1. 병합이지 추가가 아니다. 위반 시 도메인 메일 전체 장애.
- **DMARC 시작 정책**: `p=none` 고정. §4-3.
- **MX 불변**: 수신 구성(CF Email Routing) 무손상. 변경 감지 시 즉시 원복 + 보고.
- **ch2 7조**: 발신 주소·표시명·API 키 하드코딩 금지. `config.js` 정본 경유.
- **ch8**: 외부 노출 표시명은 "MONKOS". 내부 호칭 금지.
- **ch5**: 배포는 `deploy.sh` 경유.
- **헌법 3조 1항**: 매 턴 `date` 실행.
- **헌법 3조 2항**: COMPLETION 보고서 파일 필수(스모크 헤더 증빙 첨부) + 세션 로그 어펜드 + **PF_INFRA 히스토리 1행**.
- **에러 3회 반복 시**: `/에스컬레이션`.

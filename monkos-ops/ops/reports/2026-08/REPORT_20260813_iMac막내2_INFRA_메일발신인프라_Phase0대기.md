---
type: report
date: 2026-08-13
device: iMac
agent: 막내2
status: 진행
portfolio: PF_INFRA
subject: "메일 발신 인프라 — Phase 2 모듈 완료, Phase 0(작가님 선행) 대기로 DNS·배포 보류"
---

# REPORT — 메일 발신 인프라 (Resend) 중간 보고

**[2026-08-13 16:07 KST]** iMac/막내2 → 작가님

> 지시서: [ORDER_20260813_iMac쌍아_막내2_INFRA_메일발신인프라.md](../../orders/2026-08/ORDER_20260813_iMac쌍아_막내2_INFRA_메일발신인프라.md)
> **본 문서는 COMPLETION이 아니다.** 지시서 §3 Phase 0(작가님 선행)이 미이행이라 Phase 1·3을 착수할 수 없다. 전 Phase 완료 시 COMPLETION 별도 발행.

## 1. 착수 게이트 실측

지시서 §3은 `secret check RESEND_API_KEY` 실측을 착수 조건으로 명시한다.

```
$ scripts/secret.sh check RESEND_API_KEY
❌ 없음 — RESEND_API_KEY
```

→ Phase 0 미이행 확정. Phase 1(DNS) 착수 금지. Phase 0에 의존하지 않는 항목만 선행 수행했다.

## 2. 완료 항목

### 2-1. 기준선 DNS 실측 (읽기 전용 — 변경 없음)

| 항목 | 실측값 | 지시서 §1 대조 |
|------|--------|----------------|
| SPF | `v=spf1 include:_spf.mx.cloudflare.net ~all` (TXT 1개) | 일치 |
| DMARC | 레코드 없음 | 일치 |
| MX | route1/2/3.mx.cloudflare.net | 일치 (수신 무손상 기준선) |

이 값을 Phase 1 원복 기준선으로 보존한다.

### 2-2. `lib/shared/config.js` — 발신 상수 정본 (ch2 7조)

`RESEND_API_KEY`(process.env 경유, 하드코딩 없음) · `RESEND_API_URL` · `MAIL_FROM_ADDRESS`(`info@monkos.ai`) · `MAIL_FROM_NAME`(`MONKOS` — ch8 브랜드 정본) · `MAIL_FROM` · `MAIL_REPLY_TO`.
`mailer.js`와 호출부는 이 상수만 참조한다. 주소·표시명 문자열 하드코딩 0건.

### 2-3. `lib/mailer.js` 신설

- Resend **API**(전역 `fetch`) 경유. SMTP 미사용. **신규 npm 의존성 추가 없음.**
- `sendMail({ to, subject, text, html, cc, bcc, replyTo })` → 성공 시 Resend 메시지 id 반환.
- `isMailerConfigured()` — 호출부 사전 분기용.
- **실패 가시화 (도구 3요건)**:
  - 모든 실패 경로가 `MailError`를 throw. `catch {}` 무음 통과 없음.
  - `status`·`body`에 Resend 원문 보존 → 무료 티어 한도(월 3,000 / 일 100) 초과 응답이 가공 없이 호출부까지 도달.
  - `retryable` 분류: 429·5xx·네트워크 실패만 true. 설정 오류는 false.
  - **HTTP 200이어도 메시지 id가 없으면 실패로 처리** — "보냈다고 믿는데 안 간" 상태 차단.

### 2-4. 로컬 스모크 — 실패 경로 실증

| 케이스 | 결과 |
|--------|------|
| 키 미설정 | ✅ `MailError: RESEND_API_KEY 미설정 — 메일 발송 불가` |
| `to` 누락 | ✅ `MailError: 수신 주소(to) 누락` (retryable=false) |
| `subject` 누락 | ✅ `MailError: 제목(subject) 누락` (retryable=false) |
| 본문 누락 | ✅ `MailError: 본문 누락 — text 또는 html 중 하나는 필수` |
| **무효 키로 실 API 호출** | ✅ **`HTTP 401: API key is invalid`** 원문 노출 (retryable=false) |

마지막 케이스로 Resend 엔드포인트 도달 + 에러 전파 경로가 실증되었다. **실발송 스모크(§5-3)는 도메인 미인증으로 미실시.**

> 자체 결함 1건 발견·수정: 초기 구현이 인자 누락(status 0)을 `retryable=true`로 오분류. 네트워크 실패와 구분되도록 수정 후 재검증 완료.

### 2-5. `.claude/rules/references.md` 도구 맵 등재

`mailer.js` 1행 추가. 3요건 중 실발송 스모크 미완임을 표에 명기 — 무음 등재 금지.

## 3. Phase 1 사전 검증 — 실행 가능성 확인

지시서 §4는 `CF_ZONE_ID`(SECRET_INVENTORY 6·7번) 경유를 지시하나, **실측 결과 `CF_ZONE_ID`는 SM에 미등록**이다(문서 폴백만 존재).

```
$ scripts/secret.sh map CF_ZONE_ID
✗ SM에 없음
$ scripts/secret.sh check CF_API_TOKEN
✅ 존재 — v1 enabled (2026-06-03)
```

`CF_API_TOKEN`으로 zone을 이름 조회한 결과:

- `monkos.ai` zone 확인 (본진 `monk.kr` zone과 혼동 없음 — 지시서 §4 오조작 경고 해소)
- 권한 `#dns_records:read` / `#dns_records:edit` 모두 보유

→ **`CF_ZONE_ID` 추가 등록 없이 zone name 조회만으로 Phase 1 실행 가능.** 시크릿 추가 요청 불요.
(토큰 값·zone id 전문은 컨텍스트·본 문서에 미노출)

## 4. 보류 항목 — Phase 0 완료 후 즉시 착수

| 항목 | 보류 사유 |
|------|-----------|
| Phase 1 SPF 병합 · DKIM · DMARC(`p=none`) | Resend 제시 값 미수령. **헌법 4조 1항 — 값 생성·추측 금지** |
| Phase 2 실발송 스모크 (`spf=pass`/`dkim=pass` 헤더 + 받은편지함 도착) | 도메인 미인증 상태에서 발송 불가 |
| Phase 3 `deploy.sh --set-secrets` | ⚠️ **SM에 없는 시크릿을 참조하면 포털 배포 전체가 실패한다.** 등록 확인 후 반영해야 안전 |
| Phase 3 `SECRET_INVENTORY.md` 1행 | 미존재 시크릿 등재 시 `secret_patrol.sh` 오탐 유발 |
| Phase 3 dev → prod 배포 | 위 항목 선행 필요 |

## 5. 작가님 요청 사항 (Phase 0)

1. Resend 가입 → 도메인 `monkos.ai` 추가 → 대시보드가 제시하는 **DNS 레코드 값**(SPF include · DKIM 이름/값) 전달
2. API 키 발급 후 시크릿 등록:

```
시크릿 등록이 필요합니다. 터미널에서 secret 실행해주세요.
이름: RESEND_API_KEY
발급처: Resend 대시보드 → API Keys
용도: monkos.ai 메일 발신 (탈퇴 완료 통지·영수증·CS 회신)
```

값 전달 후 Phase 1 → 2 스모크 → 3 배포를 이어서 수행한다.

## 6. 변경 파일

| 파일 | 상태 |
|------|------|
| `monkos_AI/portal/lib/mailer.js` | 신설 |
| `monkos_AI/portal/lib/shared/config.js` | 발신 상수 6종 추가 |
| `.claude/rules/references.md` | 도구 맵 1행 |
| `monkos-ops/ops/sessions/2026-08/2026-08-13_iMac_막내2.md` | 신설 |

**DNS 변경 0건. 배포 0건. 시크릿 값 접촉 0건.**

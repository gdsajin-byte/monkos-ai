---
type: completion
date: 2026-08-13
device: iMac
agent: 막내2
status: 마감
portfolio: PF_INFRA
subject: "메일 발신 인프라 구축 — DNS 검증 + 발송 모듈 + 실발송 스모크 성공. prod 배포만 범위 고지 대기"
---

# COMPLETION — 메일 발신 인프라 (Resend)

**[2026-08-13 16:35 KST]** iMac/막내2 → 작가님

> 지시서: [ORDER_20260813_iMac쌍아_막내2_INFRA_메일발신인프라.md](../../orders/2026-08/ORDER_20260813_iMac쌍아_막내2_INFRA_메일발신인프라.md) (§4-1·§4-2b 16:09 정정본 반영)
> 중간 보고: [REPORT_20260813_..._Phase0대기.md](REPORT_20260813_iMac막내2_INFRA_메일발신인프라_Phase0대기.md)

**결론: `info@monkos.ai`가 보낼 수 있는 주소가 되었다.** 실발송 1통이 받은편지함에 3초 만에 도착했다.

## 1. Phase 1 — DNS 검증 (작가님 등록분, 막내 무변경)

TCP 조회, 권위 NS 2종(bob·edna) + 공용 리졸버(8.8.8.8·1.1.1.1) **전건 일치**.

### 1-1. 불변 확인 — 수신 구성 무손상 (§4-1 정정본 · §4-4)

| 항목 | 실측 | 판정 |
|------|------|------|
| 루트 MX | `route1/route2/route3.mx.cloudflare.net` (3행) | ✅ 무손상 — CF Email Routing 수신 보존 |
| 루트 SPF | `v=spf1 include:_spf.mx.cloudflare.net ~all` | ✅ **무수정**, TXT `v=spf1` **1개 단독** |

정정본대로 루트는 손대지 않았다. SPF 단일 레코드 원칙 위반 0.

### 1-2. 신규 4건 (§4-2b)

| # | Type | Name | 실측값 | 판정 |
|---|------|------|--------|------|
| 1 | TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNA…` (221b) | ✅ |
| 2 | MX | `send` | `10 feedback-smtp.ap-northeast-1.amazonses.com` | ✅ |
| 3 | TXT | `send` | `v=spf1 include:amazonses.com ~all` | ✅ |
| 4 | TXT | `_dmarc` | `v=DMARC1; p=none;` | ✅ p=none 준수 |

DMARC 정렬은 DKIM이 루트(`d=monkos.ai`) 서명이므로 From(`info@monkos.ai`)과 성립한다 — 정정본 §4-1 설명대로다.

### 1-3. 🔴 자체 판독 오류 1건 — 정정 기록

1차 검증에서 `send` MX와 `_dmarc`가 간헐 공란으로 나와 **"4건 중 2건 미등록 + NS 간 전파 지연"으로 오판**했다.

원인은 DNS가 아니라 **내 측정 방식**이었다. 검증 루프가 UDP로 8쿼리를 연타해 CF 레이트리밋에 걸렸고, 응답이 NS별·회차별로 엇갈리며 "flapping"처럼 보였다. `dig +tcp` 단발 조회 시 4건 전부 양쪽 NS에 안정 존재.

> **교훈: 측정기가 측정 대상을 교란했다.** 07-26 막내1의 "11분 고정 대기가 유휴 반납 타이머를 매번 리셋" 건과 동형이다. 간헐적 결과가 나올 때 대상을 의심하기 전에 측정 경로부터 바꿔볼 것.

## 2. Phase 2 — 발송 모듈 + 실발송 스모크

### 2-1. 구현 (중간 보고 이후 변경 없음)

`monkos_AI/portal/lib/mailer.js` — Resend API(전역 `fetch`, SMTP 아님), **신규 npm 의존성 0**.
발신 주소·표시명은 `config.js` 상수 정본 경유(ch2 7조), 표시명 `MONKOS`(ch8).

### 2-2. 🟢 실발송 스모크 — 합격

| 항목 | 결과 |
|------|------|
| 발송 | ✅ 성공 — `MESSAGE_ID=92140503-3ff2-4647-9af6-4d99fdb28a0d` |
| 도메인 인증 | ✅ **발송 성공이 곧 실증** — 미인증 도메인은 Resend가 거부한다 |
| 수신 | ✅ Gmail 실측 `labelIds=["UNREAD","INBOX"]` |
| **스팸함 여부** | ✅ **SPAM 라벨 없음 = 받은편지함 직행** (§5-3 합격선) |
| 지연 | 발송 `07:29:45Z` → 수신 `07:29:48Z` = **3초** |
| `spf=pass`/`dkim=pass` 헤더 | ⏳ **미확인** — 아래 §2-3 |

### 2-3. ⏳ 잔여 1건 — 인증 헤더 원문

지시서 §5-3-2가 요구한 `Authentication-Results` 헤더 발췌를 **첨부하지 못했다.**

- Gmail MCP `get_message`는 Subject/From/To/Date/본문만 반환하고 임의 헤더를 노출하지 않는다.
- Resend API로 우회하려 했으나 키가 **발송 전용 제한 키**라 `/emails/{id}`·`/domains` 모두 401 `restricted_api_key`.

**작가님 확인 요청**: 해당 메일 → 우측 ⋮ → **「원본 보기」** → `Authentication-Results` 줄의 `spf=` / `dkim=` / `dmarc=` 값. 3개 모두 `pass`면 본 건 완결이다.

> 받은편지함 직행 + DKIM/SPF 레코드 전 리졸버 정상 + Resend 도메인 인증 통과 정황상 pass가 유력하나, **정황과 실측은 다르므로** 미확인으로 남긴다.

### 2-4. 💡 제한 키 발급 확인

`RESEND_API_KEY`가 **Sending access 전용**으로 발급되어 있다. 키가 유출돼도 도메인 설정 변경·발송 이력 열람이 불가하다. 최소권한 원칙에 부합하므로 이대로 유지 권장.

## 3. Phase 3 — 등재 + 배포

| 항목 | 상태 |
|------|------|
| `deploy.sh --set-secrets`에 `RESEND_API_KEY` | ✅ 추가, `bash -n` 통과 |
| `SECRET_INVENTORY.md` 43번 | ✅ 메타 1행 (이름·용도·서비스·날짜만. **값 미기재**) |
| `references.md` 도구 맵 | ✅ (중간 보고 시 등재) |
| **dev 배포** | ✅ `monkos-portal-dev-00179-wxw` |
| **prod 배포** | ⏸️ **범위 고지 대기 — §4** |

### dev 검증 실측

- `/health` **HTTP 200** (0.32s)
- 시크릿 주입: `RESEND_API_KEY → secretKeyRef(name=RESEND_API_KEY, key=latest)`, **평문 `value` 부재 확인**
- 중간 보고에서 경고했던 "SM에 없는 시크릿 참조 시 배포 전체 실패" 리스크는 키 등록 완료로 해소

## 4. ⏸️ prod 배포 — 작가님 판단 요청

현 prod는 **`monkos-portal-00543-trd`(08-02 배포)**. 그 이후 portal에 영향을 주는 커밋이 **내 것 외 2건** 쌓여 있다.

| 커밋 | 내용 | 변경 파일 |
|------|------|-----------|
| `a54ae2b1` (막내1) | credits.sh delete 서브커맨드 Phase A 동반분 | `lib/gcs-save.js`, `lib/shared/config.js` |
| `0a9a7921` | FACEREAD 삼정 절대임계 폐기 → 상대 판정 전환 | `lib/cms/gwansang-data.json`, `public/admin/js/gwansang/engine.js` |

main 단일 브랜치 구조상 **prod 배포 시 이 2건이 함께 라이브된다.** 내 지시서 범위는 메일 발신 기반까지이고, 위 2건은 내가 검증한 바 없다.

**07-25 막내3 선례**(범위 고지 → 작가님 「전부 배포」 승인)에 따라 고지 후 대기한다. 선택지:

1. **전부 배포** — 3건 동시 라이브. 승인 시 즉시 실행
2. **메일만** — 내 커밋만 담은 브랜치 빌드 필요 (추가 작업)
3. **보류** — 메일 발신은 dev에서 이미 동작. prod 반영은 다음 배포 사이클에 편승

> 참고: 메일 발신 기능은 **아직 어떤 코드도 호출하지 않는다**(배선은 별건 지시서). prod 미반영이 당장 기능 손실을 만들지 않는다.

## 5. 범위 밖 (미착수 — 지시서 §7 준수)

탈퇴 완료 통지 배선 · 영수증/가입 환영 템플릿 · Gmail send-as 연결 · DMARC 정책 상향. 전부 별건.

⚠️ Resend 대시보드 **"Enable Receiving" 토글은 계속 OFF 유지**해야 한다(켜면 루트 MX를 요구해 `info@monkos.ai` 수신이 전면 중단된다). **"Auto configure"도 금지** — monk.kr 본진이 같은 CF 계정에 있다.

## 6. 변경 파일

| 파일 | 변경 |
|------|------|
| `monkos_AI/portal/lib/mailer.js` | 신설 (중간 보고분) |
| `monkos_AI/portal/lib/shared/config.js` | 발신 상수 6종 (중간 보고분) |
| `monkos_AI/portal/deploy.sh` | `--set-secrets`에 `RESEND_API_KEY` |
| `monkos-ops/ops/SECRET_INVENTORY.md` | 43번 메타 1행 |
| `.claude/rules/references.md` | 도구 맵 (중간 보고분) |
| 세션 로그 · PF_INFRA · 본 보고서 | 기록 |

**DNS 변경 0 · 시크릿 값 노출 0 · prod 배포 0 · 루트 MX/SPF 무손상.**

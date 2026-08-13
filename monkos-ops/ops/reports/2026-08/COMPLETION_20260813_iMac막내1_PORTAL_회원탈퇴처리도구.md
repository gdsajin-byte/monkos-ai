---
type: completion
date: 2026-08-13
device: iMac
agent: 막내1
status: 마감
portfolio: PF_PORTAL
order: ORDER_20260813_iMac쌍아_막내1_PORTAL_회원탈퇴처리도구.md
---

# COMPLETION — 회원 탈퇴 처리 도구 (credits.sh delete) Phase A

**[2026-08-13 15:56 KST]** iMac/막내1 → 작가님

## 1. 결과 요약

Phase A(구현 + dry-run) 완료. **실제 삭제는 발생하지 않았습니다.** Phase B(`--confirm`)는 작가님 승인 대기.

| 항목 | 결과 |
|------|------|
| `delete` 서브커맨드 구현 | ✅ dry-run 기본 + `--confirm` 게이트 |
| dry-run 실행 (lingohosi@gmail.com) | ✅ 쓰기 0건, 출력 아래 첨부 |
| 감사 로그 변동 | ✅ 없음 (`CREDIT_AUDIT_LOG.md` 무변경 실측) |
| 지시서 대비 실측 불일치 | ⚠️ 2건 (§4) — 판단 요망 |

## 2. 변경 파일

| 파일 | 변경 |
|------|------|
| `scripts/credits.sh` | `delete` 서브커맨드 신설 (`cmd_delete`, `_delete_run_node`, `_delete_print_summary`, `mask_email`) + `append_audit` 확장(`-` 표기) + usage 2곳 갱신 |
| `.claude/rules/data-access.md` | 사용법 1행 + delete 주의 문단 추가 |
| `monkos_AI/portal/lib/shared/config.js` | `CUSTOMER_GCS_BUCKET` export 신설 (ch2 7조 — §5 참조) |
| `monkos_AI/portal/lib/gcs-save.js` | 로컬 상수 → config.js import 전환 (동작 동일) |

## 3. dry-run 출력 전문

```
$ ./scripts/credits.sh delete lingohosi@gmail.com "회원 탈퇴 요청 (2026-08-13 이메일 수신)"

🔍 [DRY-RUN] 실제 삭제는 발생하지 않았습니다. 아래는 삭제 예정 대상입니다.
   사유: 회원 탈퇴 요청 (2026-08-13 이메일 수신)
────────────────────────────────────────────────────────────
대상 uid   : 107139042955968281506
이메일     : l***i@gmail.com (마스킹)
이름       : 링고
잔여 크레딧: 10c
────────────────────────────────────────────────────────────
■ 삭제 대상
  - users (PII 정본)                     1건
  - generations                        0건
  - telegram_links                     0건
  - cs_tickets                         0건
  - cs_conversations                   0건
  - GCS 객체 [monk-customer-photos]      0건
  (스캔한 서비스 프리픽스: headshot/, idphoto/, service/)
■ 보존 대상 (방침 고지 예외 — 삭제 안 함)
  - payments                           0건
  - transactions                       0건
  - audit                              append-only
■ 지시서 미지정 — 판단 대기 (삭제 안 함)
  - telegramGateCodes                  0건
■ 제외
  - free_quota: doc id = {date}_sha256(ip|sid)[0:24] — uid 무관 익명 해시. 대조 불가, PII 미포함
────────────────────────────────────────────────────────────
   실제 삭제: 위 내용을 확인한 뒤 동일 명령에 --confirm 을 붙여 실행하십시오.
   ⚠️ 고객 데이터 삭제는 비가역이며 ch4 10조 4항상 작가님 승인이 필요합니다.
exit=0
```

**해석**: 대상은 `users` 문서 1건뿐. 생성 이력·GCS 이미지·텔레그램 연동·CS 티켓 전부 0건이며 결제/거래 기록도 없다. 즉 가입 후 생성물을 남기지 않은 계정이다. 삭제 시 보존 예외에 걸리는 항목이 없어 방침상 "즉시 파기"를 온전히 이행할 수 있다.

## 4. ⚠️ 지시서 대비 실측 불일치 2건 — 판단 요망

### 4-1. `free_quota` — 삭제 불가 (uid 무관)

지시서 3-2는 `free_quota` doc id를 `{date}_{uid}`로 기재했으나, 실측(`server.js:173-183`)은 다르다.

```js
function freeQuotaKey(req) {
  const xff = req.headers['x-forwarded-for'];
  const ip = (xff ? xff.split(',').pop().trim() : '') || req.socket.remoteAddress || '';
  const sid = parseCookies(req.headers.cookie).monkos_sid || '';
  return crypto.createHash('sha256').update(`${ip}|${sid}`).digest('hex').slice(0, 24);
}
// doc id = `${date}_${key}`
```

키는 **IP+세션쿠키의 SHA-256 앞 24자**로, 로그인 uid와 아무 관계가 없다. 무료 사용자(비로그인)를 겨냥한 익명 해시이며 원본 IP도 복원 불가다. 따라서 uid 대조로 찾을 방법이 없어 **삭제 범위에서 제외**했고, dry-run 출력에 제외 사유를 명시하도록 했다. PII 미포함 + 일 단위 키라 파기 의무 대상으로도 보기 어렵다.

### 4-2. `cs_conversations` — `userId` 필드 없음 → 역참조로 우회

지시서는 `userId` 필드 기준을 지시했으나 실측(`lib/chat-engine.js:11-40`)상 doc id는 `tg_{chatId}`이고 문서 필드는 `chatId / username / channel / messages`뿐이다. `userId`가 없다.

→ `telegram_links`(doc id = chatId, 필드 `userId`)를 경유해 uid → chatId 역참조 후 `tg_{chatId}` 문서를 조회하도록 구현했다. 텔레그램 연동을 한 적 없는 계정이면 자연히 0건이다.

### 4-3. `telegramGateCodes` — 지시서 미지정 (삭제 안 함)

`lib/events.js:33`이 생성하는 이 컬렉션에도 `userId` 필드가 있어 사용자-텔레그램 연결 기록이 남는다. 지시서 삭제 목록·보존 목록 어디에도 없어 **삭제하지 않고 건수만 표시**하도록 했다. 범위 판정은 쌍아·작가님 몫이다(이번 대상은 0건이라 실무 영향 없음).

## 5. ch2 7조 이행 — 버킷 상수 정본화

준수 조항은 "버킷은 `lib/shared/config.js` 정본 경유"를 요구하나, 실측상 `CUSTOMER_GCS_BUCKET`은 config.js에 없고 `gcs-save.js:4`에 로컬 상수로 있었다(`GCS_BUCKET`은 CMS 에셋용 별개 버킷). 조항을 이행하려면 정본을 만드는 수밖에 없어, config.js에 export를 신설하고 gcs-save.js가 이를 import하도록 2줄 전환했다.

- 값 해석은 동일(`process.env.CUSTOMER_GCS_BUCKET || 'monk-customer-photos'`) → **동작 변화 없음, 배포 불요**. 다음 정기 배포 시 자연 반영.
- 산출물 표 밖 변경이라 명시 보고한다. 되돌리려면 credits.sh 쪽에서 env를 직접 읽는 형태로 바꿔야 하는데, 그건 ch2 7조 위반이라 택하지 않았다.

## 6. 안전장치 실측

| 요구 | 구현 | 검증 |
|------|------|------|
| dry-run 기본 | `--confirm` 없으면 scan 모드만 실행 | ✅ 감사 로그·Firestore 무변동 |
| 사유 필수 | 미기입 시 exit 1 | ✅ `❌ 사용법: ...` 출력 확인 |
| 미존재 대상 | `{"error":"사용자 없음"}` + exit 0 | ✅ 스모크 확인 |
| 삭제 직전 요약 출력 | `--confirm` 시에도 scan → 요약 출력 → 삭제 | 구현 완료 (Phase B에서 실증) |
| 부분 실패 비중단 | 항목별 try/catch, 실패 수집 후 종료 시 전문 출력 + exit 2 | 구현 완료 |
| 이메일 마스킹 | `l***i@gmail.com` — 로컬 로그·Firestore audit 양쪽 | ✅ dry-run 출력에서 확인 |
| ch4 10조 1항 | 전량 `run_node` 래퍼 경유. 일회성 `node -e` 미사용 | ✅ |
| `set -euo pipefail` | 유지 | ✅ |
| 알 수 없는 옵션 | 오타 방어 (`--confrim` 등) → exit 1 | ✅ |

## 7. 다음 단계 (Phase B — 승인 대기)

```bash
./scripts/credits.sh delete lingohosi@gmail.com "회원 탈퇴 요청 (2026-08-13 이메일 수신)" --confirm
```

**작가님 승인 전까지 실행하지 않습니다.** 승인 시 삭제 결과 + 감사 로그 2중 기록(로컬 MD + Firestore `audit`)을 후속 보고하겠습니다.

## 8. 범위 밖 (참고)

근본 원인인 앱 내 탈퇴 기능 부재(PROPOSAL_20260624 T3 / DESIGN_20260715 T5)는 별도 지시서 대상이다. §4-3 `telegramGateCodes` 범위 판정도 쌍아 회신 대기.

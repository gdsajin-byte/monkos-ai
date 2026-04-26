---
type: draft
date: 2026-04-21
from: iMac/민아
to: 작가님
subject: Lemon Squeezy support 긴급 티켓 — 2FA + Store activation + Tax form (hello@ 최종본)
priority: 최우선
---

# Lemon Squeezy 지원 티켓 — 최종 발송본

**[2026-04-21 16:10 KST] iMac/민아 → 작가님**

> v1 이력: `help@lemonsqueezy.com`로 발송 → bounce (address not found, 추측 실패)
> v2 이력: Gmail에서 4/15 수신 메일 확인 → 공식 지원 주소 `hello@lemonsqueezy.com` 검증
> 추가 발견: Store 비활성화 근인 = Tax form 미서명 (MONKOS AI JP payouts 차단)

---

## 상황 요약

| 이슈 | 증상 | 원인·근거 |
|---|---|---|
| Issue 1 — 2FA 리셋 필요 | iPhone 교체 후 Google Authenticator 미마이그레이션 → TOTP 생성 불가. Recovery code 없음 | 신규 기기에 재설치, 마이그레이션 미수행 |
| Issue 2 — Store 비활성화 | "This store has not been activated" / Request ID `d86392d3-5548-42b5-9cb9-7c2fa9e608f9` | Issue 3의 파생으로 추정 |
| Issue 3 — Tax form 미서명 | 4/15 Lemon Squeezy 메일: "Action required: complete your tax form to receive payouts" (MONKOS AI JP). "Complete tax form" 링크도 로그인 요구 → 2FA 벽 | 본인 2FA 못 뚫어서 폼 접근 불가 |

---

## 발송 정보

- **To**: `hello@lemonsqueezy.com` ✅ (4/15 메일 본문 내 명시, `mailto:` 링크 존재로 검증됨)
- **Subject**: `Urgent — 2FA reset + Store activation (tax form) recovery (Request ID: d86392d3-5548-42b5-9cb9-7c2fa9e608f9)`
- **From**: `gdsajin@gmail.com` (작가님 Gmail)

---

## 본문 (최종)

```
Hello Lemon Squeezy Support Team,

I am writing to request urgent assistance with two related issues affecting my store account. I would appreciate if both could be handled together, as they share the same identity verification requirements.

── Account Information ──
• Registered email: gdsajin@gmail.com
• Store name / slug: monkos.ai_jp
• Storefront domain: monkos.ai
• Country of business: South Korea (sole proprietor / 개인사업자)

── Issue 1: Lost access to 2FA device ──
I recently replaced my iPhone and did not migrate my Google Authenticator entries
before the transition. The Google Authenticator instance on the new device does
not contain the TOTP seed for Lemon Squeezy, so I am unable to complete 2FA sign-in.
I do not have recovery codes available (none were delivered by email, and I could
not locate a local backup).

Could you please reset 2FA on my account so I can re-enroll a new authenticator
on the replacement device?

── Issue 2: "This store has not been activated" (likely linked to Issue 3) ──
When I attempt to access the store dashboard, I receive the following error:

    "This store has not been activated.
     Sorry, you are forbidden from accessing this page.
     Request ID: d86392d3-5548-42b5-9cb9-7c2fa9e608f9"

── Issue 3: Tax form not signed (strongly suspected root cause of Issue 2) ──
On April 15, 2026, I received an email from Lemon Squeezy with the subject
"Action required: complete your tax form to receive payouts", stating that payouts
for MONKOS AI JP are paused until the tax form is completed and signed. I attempted
to use the "Complete tax form" button in that email, but the link requires a
signed-in session, so I am blocked by the same 2FA issue described in Issue 1.

Please help me resolve this by either:
  (a) resetting 2FA so I can sign in and complete the tax form, which should also
      lift the store activation block, or
  (b) providing an alternative, login-free flow to submit the required tax form
      (e.g. a tokenized link, PDF upload, or HelloSign-style signing).

── Identity verification ──
I can provide the following immediately upon your request:
  • Passport (scan)
  • Korean business registration certificate (사업자등록증)
  • Bank statement or payment-method receipt matching the registered account
  • Recent login IP / device information
  • Answers to any account security questions

── Business context ──
My business (MONKOS — monkos.ai, monk.kr) provides AI-based ID photo services
targeting Korea and Japan. Lemon Squeezy is our sole global payment method,
so this access issue is directly blocking all international revenue. A prompt
resolution would be greatly appreciated.

Thank you very much for your help. Please let me know the next steps, and I
will respond with the required documents as soon as you confirm the format.

Best regards,
JeongKyu Shon
monk studio
gdsajin@gmail.com
```

---

## 이번 세션의 실수와 교훈

| 시점 | 실수 | 근인 | 재발 방지 |
|---|---|---|---|
| 15:55 | `help@lemonsqueezy.com` 추측 발송 → bounce | 공식 주소 검증 없이 일반 패턴으로 추측 | 외부 서비스 연락처는 반드시 (1) 공식 사이트 전수 (2) 수신 메일 헤더 (3) `mailto:` 링크 중 하나로 검증 후 기재 |
| 16:00 | Help center 페이지 텍스트만 보고 "공개 이메일 없음" 결론 | 작가님 Gmail의 과거 수신 메일 전수 먼저 뒤지지 않음 | 외부 서비스 지원 채널 파악 시 "과거 수신 메일"을 1차 소스로 삼기 |

→ 피드백 메모리 갱신 후보: `feedback_external_email_verify_first.md` — 외부 서비스 연락처는 검증 전 기재 금지. 수신 메일이 1차 증거.

---

## 예상 처리 시간 & 다음 액션

| 시점 | 예상 이벤트 | 민아 후속 |
|---|---|---|
| 발송 즉시 | 자동 티켓 ID 회신 | 티켓 ID 기록 |
| 영업일 1~2일 | support 1차 응답 (서류/추가 정보 요청) | 작가님께 양식 준비 안내 |
| 영업일 3~5일 | 2FA 리셋 완료 + tax form 토큰/리셋 세션 제공 | 로그인 즉시 (1) 새 Authenticator 등록 (2) 복구 코드 저장 (3) tax form 서명 (4) store activation 확인 |

**병행 백업 채널** (48h 내 1차 회신 없을 시)
- Twitter/X `@lmsqueezy` 공개 멘션 + DM
- Lemon Squeezy가 2024년 Stripe 인수 → 장기 락아웃 시 Stripe support 경유 가능성

---

## 발송 후 할 일 (Do not forget)

- [ ] 회신 오면 PF_REVENUE (신설 예정) 또는 PF_PHOTOPRO 히스토리에 티켓 ID 기록
- [ ] 2FA 복구 후 **recovery code 10개 별도 저장** (1Password or iCloud 메모, 이번 사고 반복 방지)
- [ ] Tax form 완료 후 store activation 상태 재확인 → 매출 재개 가능 여부 판정
- [ ] 결제 MoR 단일 의존 리스크 대응 — 장기적으로 KOMOJU 재검토 or 법인 전환 → Stripe Japan 경로 PF_REVENUE §리스크 반영

**보고 끝.**

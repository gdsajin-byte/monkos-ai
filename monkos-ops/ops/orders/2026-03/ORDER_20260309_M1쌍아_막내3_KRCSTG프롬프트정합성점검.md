---
type: order
date: 2026-03-09
from: M1/쌍아
to: 막내3
priority: P1
category: research
---

# 지시서: KR 인앱 + Telegram CS 프롬프트 정합성 점검

**[2026-03-09 22:22 KST] M1/쌍아 → 막내3**

## 배경

KR v3 가격 전환 + JP 론칭이 완료된 상태. KR 전용 인앱 챗봇과 Telegram CS 봇의
시스템 프롬프트가 현행 체계를 정확히 반영하는지 점검 필요.

## 대상 채널

| 채널 | 프롬프트 | 용도 |
|------|---------|------|
| `idphoto-kr` | `SYSTEM_PROMPT_KR` | KR 인앱 챗봇 (한국어 전용) |
| `telegram` | `CS_SYSTEM_PROMPT` | Telegram CS봇 (다국어) |

## 임무 A: SYSTEM_PROMPT_KR 정합성 점검

### 대상 파일
- `monkos_AI/portal/lib/prompts.js` — `SYSTEM_PROMPT_KR` (line 67~121)
- 비교 대상: `monkos_AI/idphoto-kr/public/config.js` (KR 현행 가격/설정)

### 점검 항목

**1. KR 가격표**
- [ ] 프롬프트 기재 가격 vs config.js `CHARGE_OPTIONS` 대조
- [ ] 1장 팩 ₩9,900 (70c+10c) — 일치?
- [ ] 10c ₩1,450 — 일치?
- [ ] 130c ₩12,900 (100c+30c) — 일치?
- [ ] 420c ₩34,900 (300c+120c) — 일치?
- [ ] 750c ₩49,900 (500c+250c) — 일치?

**2. 크레딧 비용**
- [ ] 리터칭 10c, 다운로드 70c — config.js `CREDIT_COST`와 일치?
- [ ] "1장 완성 = 80c" 안내 — 정확?

**3. 보너스 시스템**
- [ ] 가입 보너스 10c — 실제 코드 확인
- [ ] SNS(인스타) 보너스 100c — 실제 코드 확인
- [ ] 텔레그램 보너스 40c — 실제 코드 확인
- [ ] 카카오 채널 보너스 40c — 실제 코드 확인
- [ ] "텔레그램과 택1" 정책이 실제 코드에 반영되어 있는지

**4. URL**
- [ ] `https://idphoto-kr.monkos.ai` — 서버 라우트 확인
- [ ] 법적 페이지: terms.html, privacy.html, refund.html — 서버에서 서빙 확인

**5. 결제 수단**
- [ ] "토스페이먼츠" 기재 — 현행과 일치?

**6. 서비스 설명**
- [ ] "실시간 카메라 촬영만 가능 (갤러리 업로드 차단)" — 실제 코드 확인
- [ ] "정체성 일치율 90% 이상 보장" — QC 코드에서 확인
- [ ] 내부 기술명 노출 없는지

## 임무 B: CS_SYSTEM_PROMPT 정합성 점검

### 대상 파일
- `monkos_AI/portal/lib/prompts.js` — `CS_SYSTEM_PROMPT` (line 123~186)
- 비교 대상: KR/JP 양쪽 config.js

### 점검 항목

**1. 가격표**
- [ ] KR 가격: 프롬프트 vs config.js
- [ ] 글로벌(JP) 가격: `10c/$10 | 30c/$25 | 50c/$40` 기재 — JP 현행 ¥ 패키지와 불일치 여부
- [ ] 두 가격 체계가 정확한지

**2. 크레딧 시스템**
- [ ] 기본 비용 (리터칭 10c, 다운로드 70c) — 일치?
- [ ] 보너스 시스템 (가입 10c, SNS 100c, TG 40c) — 일치?

**3. 환불 정책**
- [ ] "7일 이내 + 완전 미사용 → 전액 환불" — Portal 실제 환불 로직과 일치?
- [ ] "시스템 장애 → 자동 복구(크레딧 복구)" — 실제 `refundCredits` 로직 확인

**4. 로그인 수단**
- [ ] "カカオ(韓国)、LINE(日本)、Googleアカウント" — 현행 OAuth 설정과 일치?
- [ ] 실제 OAuth 프로바이더 목록 확인 (server.js 또는 Portal auth)

**5. 에스컬레이션 안내**
- [ ] info@monkos.ai — 현행 문의 이메일과 일치?
- [ ] @monkos_support_bot — 텔레그램 봇 존재 확인

**6. 문화적 배려 지시**
- [ ] 일본어/한국어/영어/중국어 톤 지시 — 적절한지 (내용 검토)

## ⚠️ 준수 조항

- **헌법 제6조 (인프라 보호)**: API 키, 프로젝트 ID 생성/추측 금지
- **헌법 제8조 (파괴적 명령 금지)**: 코드 수정 없음 — 리서치만

## 산출물

- **파일**: `monkos-ops/ops/reports/2026-03/REPORT_20260309_막내3_KRCSTG정합성.md`
- 항목별 ✅/❌ 판정 + 불일치 시 현행값 vs 프롬프트값 대조표
- 수정 제안 목록 (우선순위 포함)
- 완료 후 커밋하지 말고 보고서만 제출

## 보고 형식

```
✅ idphoto-kr/telegram 프롬프트 정합성 점검 완료
💡 불일치 항목: N건 / 정상: N건
📁 보고서: monkos-ops/ops/reports/2026-03/REPORT_20260309_막내3_KRCSTG정합성.md
```

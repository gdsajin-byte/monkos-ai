---
type: ORDER
date: 2026-03-09
from: iMac/쌍아
to: 막내1
subject: JP 현지화 — server.js + config.js + shared.js
status: pending
---

# JP 현지화 — 백엔드 + 설정 파일

> **[2026-03-09 12:27 KST] iMac/쌍아 → 막내1**

## 배경

KR 코드가 `idphoto-jp/`에 복사 완료. 기능적 코드 변경 없이, 설정값과 텍스트를 일본 시장에 맞게 **현지화**한다. 단순 번역이 아닌 일본 UX 관습·톤에 맞는 재작성.

참조: `monkos-ops/tech/designs/DESIGN_JP_CLONE_FRAMEWORK.md` (공유/분기 정리표)

## 작업 범위

### 1. `server.js` — 코칭 프롬프트 현지화

현재 KR 코칭 프롬프트(COACHING_INSTRUCTIONS)를 일본 시장에 맞게 재작성.

- **톤 변경**: KR strict → JP positive (「〜すれば完璧です」스타일)
- 丁寧語(정중어) 사용, 1문장 15자 이내 규칙 유지
- 자동촬영 트리거: 「いいですね！今撮影してください」
- passport / id 두 스타일 모두 현지화
- **기능 로직(buildPromptV5, API 엔드포인트, WebSocket 등)은 절대 수정 금지**

### 2. `config.js` — 설정값 현지화

| 항목 | KR 현재값 | JP 변경값 |
|------|----------|----------|
| TX 객체 (25키) | 한국어 | 일본어 현지화 (자연스러운 일본식 UX 문구) |
| CREDIT_COST | `{ generate: 10, download: 70 }` | `{ generate: 1, download: 10 }` |
| CHARGE_OPTIONS | KRW 가격 | JPY 가격 (현행 JP 가격 체계 참조: apps/idphoto-jp-v079/) |
| KRW_PER_CREDIT | 145 | 삭제 또는 JPY_PER_CREDIT으로 변환 |
| KAKAO_JS_KEY, KAKAO_CHANNEL_ID | 값 있음 | **삭제** (JP에서 카카오 미사용) |
| TOSS_CLIENT_KEY | test_ck_... | 그대로 유지 (Lemon Squeezy 전환은 Round 2) |

### 3. `shared.js` — 결제 함수명 + 메시지 현지화

- `buyCreditsKR()` → `buyCreditsJP()` 로 함수명 변경 (로직은 Round 2에서 Lemon Squeezy로 교체)
- alert(), Monk.log() 등 사용자 노출 메시지 전량 일본어 현지화
- 카카오 관련 코드 제거 또는 비활성화
- **store 구조, pipe 설정, downloadGate() 등 기능 로직은 수정 금지**

## 준수 조항

- **헌법 6조**: API 키 생성/추측 금지. 기존 키 값 유지
- **헌법 9조**: I2I 정체성 보존 원칙 — 프롬프트 수정 시 90%+ 보존 로직 유지
- **기능 코드 무변경 원칙**: 이 작업은 텍스트/설정값만 변경. API 로직, 인증 흐름, 크레딧 시스템 변경 금지

## 산출물

- `monkos_AI/idphoto-jp/server.js` (코칭 프롬프트 부분만 변경)
- `monkos_AI/idphoto-jp/public/config.js`
- `monkos_AI/idphoto-jp/public/shared.js`
- 완료 보고서

## 참고 자료

- KR 원본: `monkos_AI/idphoto-kr/` (변경 전 비교용)
- JP v0.79 아카이브: `apps/idphoto-jp-v079/` (기존 JP 톤·가격 참조)
- 프레임워크: `monkos-ops/tech/designs/DESIGN_JP_CLONE_FRAMEWORK.md`

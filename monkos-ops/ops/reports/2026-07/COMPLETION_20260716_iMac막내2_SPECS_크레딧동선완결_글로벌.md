---
type: completion
date: 2026-07-16
device: iMac
agent: 막내2
status: 완료
portfolio: PF_SPECS
---

# COMPLETION: 크레딧 동선 완결 + 글로벌(en·레몬)

**[2026-07-16 15:22 KST]** iMac/막내2 → 작가님

## 결과

✅ **A. 복귀 동선 완결**
- 상시 복귀 링크 (`returnBar`): `from` 존재+화이트리스트 통과 시 페이지 상단 항상 노출 — 로그인 전에도
- 10c CTA (`returnCta`): 로그인 후 잔액 10c↑이면 잔액 카드 내 강조 CTA "돌아가서 만들기 — 10c로 바로 생성"
- 토스 충전 완료: 기존 `returnToService()` 3초 자동 복귀 바 회귀 없음

✅ **B. 글로벌 모드**
- lang 판별: `?lang=` → from 경로 `/{lang}/` → 기본 ko. non-ko=en 통일
- en 사전: title/sub/login/balance/packages/CTA/toast/info 전체 번역
- 결제수단 분기: non-ko→토스 패키지·위젯 숨김, 레몬 글로벌 5종 카드(서버 `/api/credits/topup-products` fetch)
- userId custom 전달: `/api/checkout`에 userId 포함(웹훅 적립 매칭)
- ko 회귀 0: KO_PACKAGES·토스 위젯·handleTossResult 그대로

✅ **C. 레몬 적립 폴링**
- 체크아웃 URL 새 탭 오픈 → 5초 간격 잔액 폴링(최대 3분)
- 잔액 증가 감지 → "+Nc 충전 완료!" 토스트 + returnToService() 발화
- 타임아웃 → "적립이 지연되고 있어요" 안내(ko/en)

✅ **dev 배포** — rev `monkos-portal-dev-00140-jv6`, 100% 트래픽

## 변경 파일

| 파일 | 변경 |
|------|------|
| `public/credits.html` | 복귀 동선(returnBar·returnCta) + 글로벌 모드(lang·en사전·레몬 상점) + 적립 폴링 |
| `lib/shared/config.js` | `GLOBAL_TOPUP` 배열 추가 (5종 레몬 글로벌 상품 정본) |
| `server.js` | `GET /api/credits/topup-products` 엔드포인트 + GLOBAL_TOPUP import |

## 검증

- dev 원격: credits.html 로드 OK, topup-products 5종 정합($3.90~$39.90), health 200
- specs-funnel.js resume 수정 0 (수정 금지 준수)
- isSafeReturnUrl 화이트리스트 유지 (오픈 리다이렉트 방어)

## ⏳ 민아 검증 필요

- [ ] 브라우저 E2E: 비로그인→크레딧→로그인→10c CTA→specs 복귀→자동 생성
- [ ] en 트랙: `/en/specs/…`→credits 영문 UI + 레몬 상점 5종 + 체크아웃 진입
- [ ] ko 회귀: 토스 흐름 diff 0
- [ ] prod 배포

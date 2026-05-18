---
type: spec
date: 2026-04-24
subject: LS API 우회 생존 경로 — JWT 만료 2026-09-12
service: idphoto-kr
origin: memory/project_ls_api_survival.md
---

# LS API 우회 생존 경로

LS 어드민 UI가 2FA/deactivated로 잠겨도 서비스는 살아있다. API Bearer token이 2FA를 완전 우회한다.

## 핵심

- JWT exp=1789084800 = **2026-09-12 만료**
- store ID: 290457
- 상품 5개 전부 published, checkout URL 작동
- monkos.ai portal 웹훅 연결 유지

## API로 가능한 것

- `/v1/users/me`, `/v1/stores/290457`, `/v1/products`, `/v1/orders`, `/v1/webhooks` — 전부 200 OK
- 주문·상품·웹훅·고객 관리

## API로 불가한 것

- 2FA disable / tax form / payout 관리 — 전부 404 (웹 UI 전용)
- JWT 재발급도 웹 UI 접근 필요 → **대시보드 복구가 여전히 중요**

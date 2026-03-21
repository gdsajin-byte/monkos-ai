---
type: order
from: iMac/쌍아
to: iMac/막내4
date: 2026-03-19
priority: P1
project: FAQ
---

# ORDER_20260319 — FAQ 다국어 앞단 라우팅 수정

**[2026-03-19 16:45 KST] iMac/쌍아 → iMac/막내4**

## 증상

- `https://monkos.ai/faq` → ✅ 200 정상
- `https://monkos.ai/en/faq` → ❌ 404
- `https://monkos.ai/ja/faq` → ❌ 404
- Cloud Run 직접 접속 `/en/faq`, `/ja/faq` → ✅ 200 정상

## 진단

Cloud Run 서버는 정상. **앞단(CF Pages Functions 또는 프록시)**에서 `/en/*`, `/ja/*` 패턴이 Cloud Run으로 라우팅되지 않음.

## 조사 범위

1. `functions/` — CF Pages Functions 확인. `/en/`, `/ja/` 경로 핸들링 유무
2. `MONK_kr/` — CF Pages 설정 (wrangler.toml, _redirects, _headers 등)
3. monkos.ai 도메인의 DNS/프록시 구조 — CF Pages vs Cloud Run 분기 로직
4. 기존 다국어 블로그 라우팅 (`/en/blog`, `/ja/blog`)이 동작하는지도 확인

## Task

1. `/en/faq`, `/ja/faq`가 Cloud Run(monkos-portal)에 도달하도록 앞단 라우팅 수정
2. 기존 `/en/blog`, `/ja/blog` 라우팅도 함께 점검 (같은 문제 가능)
3. 수정 후 배포 + 4개 URL 200 확인

## 완료 조건

- [ ] `https://monkos.ai/en/faq` → 200
- [ ] `https://monkos.ai/ja/faq` → 200
- [ ] `https://monkos.ai/en/blog` → 200 (기존 동작 확인)
- [ ] `https://monkos.ai/ja/blog` → 200 (기존 동작 확인)
- [ ] 기존 `/faq` KO 정상 유지

## ⚠️ 준수 조항

- 기존 라우팅 훼손 금지 — 변경 전 현행 동작 전수 확인
- CF Functions 수정 시 기존 API(generate, translate 등) 영향 없음 확인

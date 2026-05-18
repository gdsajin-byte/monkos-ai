---
type: ORDER
date: 2026-04-07
from: iMac/쌍아 → to: iMac/막내1
status: 대기
priority: P0
pf: PF_CITADEL
---

# 지시서: CITADEL prod 배포 + PF 갱신

> **SEO 3건(JA/EN 메타, Crop hreflang, Blog JSON-LD) 코드는 4/5에 완료.
> prod 배포만 안 된 상태. 배포 후 PF 상태도 갱신.**

---

## 1. prod 배포

```bash
cd monkos_AI/portal
gcloud run deploy monkos-portal \
  --project=monkos \
  --region=asia-northeast1 \
  --source=. \
  --allow-unauthenticated
```

## 2. 배포 검증

CDP 또는 curl로 확인:
- `/ja/` → title이 일본어인지 (`AI証明写真`)
- `/en/` → title이 영어인지 (`AI ID Photos`)
- `/crop` → hreflang 존재 + H1 태그 확인
- `/blog` → JSON-LD `"@type": "Blog"` 존재 확인

## 3. PF 갱신

`monkos-ops/ops/portfolios/PF_CITADEL.md` 히스토리에 어펜드:

```
| 04/07 | iMac/막내1 | SEO 3건 prod 배포 완료 — JA/EN 메타 현지화 + Crop hreflang/H1 + Blog JSON-LD. monkos-portal 재배포 | — | ✅ |
```

Phase 1.5 상태를 `🔄 진행 중` → `✅ 완료`로 갱신.

## 4. GSC 색인 요청

배포 확인 후:
- Google Search Console에서 `/ja/`, `/en/`, `/crop`, `/blog` URL 검사 → 라이브 테스트 → 색인 요청
- CDP로 GSC 접속하여 실행 가능

## ⚠️ 준수 조항

- 헌법 4조 1항: 배포 시 환경변수/키 하드코딩 금지
- 법률 ch5: 배포 규칙 준수

## 완료 기준

1. monkos-portal prod 배포 성공
2. 4개 URL 검증 통과
3. PF_CITADEL.md 갱신
4. 완료 보고 (✅❌💡⏳📁🔀 형식)

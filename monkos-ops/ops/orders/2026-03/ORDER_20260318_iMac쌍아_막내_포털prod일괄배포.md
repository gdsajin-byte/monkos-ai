---
type: order
from: iMac/쌍아
to: iMac/막내
date: 2026-03-18
status: 대기
---

# [지시서] 포털 prod 일괄 배포

> **[2026-03-18 16:52 KST] iMac/쌍아 → iMac/막내**
> 금일 포털 변경사항 3건 일괄 prod 배포.

---

## 배포 범위

| 커밋 | 내용 |
|------|------|
| `6d6eb86` | 404 해소 — /pricing + /guide SSR + /crop SEO |
| `fa3b159` | 홈 폰트 크기 보정 (portal.css) |
| `0e25b78` | i18n 통합 — 홈 SSR lang + 크롭앱 다국어 |

## 실행

```bash
cd monkos_AI/portal
./deploy.sh prod
```

## 배포 후 검증

- [ ] monkos.ai/ — 홈 정상 (KO 기본)
- [ ] monkos.ai/?lang=ja — 일본어 블로그 카드 표시
- [ ] monkos.ai/pricing — 200 OK
- [ ] monkos.ai/guide — 200 OK
- [ ] monkos.ai/crop — 200 OK + JA 전환 확인
- [ ] monkos.ai/blog — 기존 정상
- [ ] 폰트 크기 — 데스크탑/모바일 가독성

## 완료 보고

리비전 번호 + 형식: `✅❌💡⏳📁🔀`

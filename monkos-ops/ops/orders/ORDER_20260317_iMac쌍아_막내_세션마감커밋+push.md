---
type: ORDER
from: iMac/쌍아
to: iMac/막내1
date: 2026-03-17
priority: P1
scope: 커밋 + push
---

# 지시서: iMac 세션 마감 커밋 + push

## Task 1: git pull + 충돌 확인

```bash
git pull origin main
```

## Task 2: 변경 파일 스테이징 + 커밋

```bash
git add monkos-ops/ops/sessions/2026-03-17_iMac_쌍아.md \
       monkos-ops/ops/orders/ORDER_20260317_* \
       memory/project_pending_agenda.md \
       monkos_AI/portal/public/js/main.js
git commit -m "[log] 2026-03-17 iMac/쌍아 세션마감 — 크롭앱등록+화이트모드+에디터5차+챗봇모달+어젠다14건"
git push origin main
```

## Task 3: git status 확인

- 미커밋 파일 없는지 최종 확인

## 완료 보고

`✅❌💡⏳📁🔀` 형식.

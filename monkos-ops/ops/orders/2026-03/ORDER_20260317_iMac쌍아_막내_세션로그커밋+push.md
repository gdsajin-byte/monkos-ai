---
type: ORDER
from: iMac/쌍아
to: iMac/막내1
date: 2026-03-17
priority: P1
scope: 커밋 + push
---

# 지시서: iMac 세션 중간 커밋 + push

## 배경

금일 iMac 세션에서 생성/변경된 지시서·보고서·세션로그·어젠다를 중간 커밋한다.

## Task 1: git pull + 충돌 확인

```bash
git pull origin main
```
- 막내1~3 커밋과 충돌 여부 확인. 충돌 시 해결 후 진행.

## Task 2: 변경 파일 스테이징 + 커밋

```bash
git add monkos-ops/ops/sessions/2026-03-17_iMac_쌍아.md \
       monkos-ops/ops/orders/ORDER_20260317_* \
       monkos-ops/ops/reports/REPORT_20260317_* \
       memory/project_pending_agenda.md
git commit -m "[log] 2026-03-17 iMac/쌍아 세션 — 어젠다정비+에디터5차+챗봇모달+크롭앱등록+UX보정"
git push origin main
```

## 완료 보고

`✅❌💡⏳📁🔀` 형식.

## ⚠️ 준수 조항

- 헌법 제1조 1항: 타임스탬프
- `.env`, secrets 등 민감 파일 포함 여부 확인

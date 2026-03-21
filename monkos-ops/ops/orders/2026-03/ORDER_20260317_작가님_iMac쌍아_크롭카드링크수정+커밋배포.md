---
type: ORDER
from: 작가님
to: iMac/막내1
date: 2026-03-17
priority: P0
scope: 커밋 + 배포
status: 대기
---

# 지시서: 크롭 서비스카드 링크 핫픽스 + 커밋 배포

## 배경

쌍아가 직접수정한 `main.js` — `.svc.free` 클릭 이벤트에서 `window.open('https://crop.monkos.ai', '_blank')` 를 제거. `<a href="/crop">` 이 직접 동작하도록 변경.

## Task 1: 커밋 + push + 배포

```bash
git add monkos_AI/portal/public/js/main.js
git commit -m "[portal] 크롭 서비스카드 링크 핫픽스 — main.js 서브도메인 가로채기 제거"
git push origin main
cd monkos_AI/portal && bash deploy.sh prod
```

## Task 2: 검증

- monkos.ai 홈 → "무료 크롭앱" 서비스 카드 클릭 → `/crop` 페이지로 이동 확인 (서브도메인 아님)
- 크롭앱 UX 보정 반영 확인 (업로드 문구, 버튼 크기, 오버레이 삭제)

## 완료 보고

`✅❌💡⏳📁🔀` 형식. 배포 리비전 포함.

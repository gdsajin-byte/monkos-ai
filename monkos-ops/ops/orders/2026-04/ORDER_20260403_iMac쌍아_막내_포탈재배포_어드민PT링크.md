---
type: order
from: iMac/쌍아
to: iMac/막내
date: 2026-04-03 19:10 KST
priority: P1
subject: 포탈 재배포 — 어드민에 PT 링크 추가 반영
tags: [portal, deploy, admin, pt]
status: open
---

# 지시서: 포탈 재배포

**[2026-04-03 19:10 KST] iMac/쌍아 → iMac/막내**

---

## 변경 내용

`monkos_AI/portal/public/admin/index.html`에 PT 링크 1건 추가됨 (이미 수정 완료).

```html
<a href="https://pt.monkos.ai" target="_blank" rel="noopener" class="menu-card">
  <div class="count">🎬</div>
  <h3>PT <span class="badge-internal">INTERNAL</span></h3>
  <div class="label">몽코스 3D 프레젠테이션 엔진</div>
</a>
```

---

## 작업

포탈 Cloud Run 재배포:

```bash
cd monkos_AI/portal
gcloud run deploy portal \
  --project=monkos \
  --region=asia-northeast1 \
  --source=. \
  --allow-unauthenticated
```

---

## 검증

- `https://monkos.ai/admin/` 접속 → 내부 도구 섹션에 PT 카드 노출 확인
- PT 링크 클릭 → `https://pt.monkos.ai` 이동 확인

---

## ⚠️ 준수 조항

- 포탈 기존 기능 영향 없음 (HTML 1줄 추가)
- 완료 보고 `✅❌💡⏳📁🔀` 형식

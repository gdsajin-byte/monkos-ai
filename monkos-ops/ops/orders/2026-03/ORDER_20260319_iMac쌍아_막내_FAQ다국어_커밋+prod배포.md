---
type: order
from: iMac/쌍아
to: iMac/막내
date: 2026-03-19
priority: normal
---

# ORDER_20260319 — FAQ 다국어 커밋 + prod 배포

**[2026-03-19 13:59 KST] iMac/쌍아 → iMac/막내**

## 배경

FAQ EN/JA 시딩 + 다국어 라우팅 작업 완료, dev 배포 확인됨. 커밋 + prod 배포 실행.

## Task 1: 커밋 + push

```bash
cd /Users/jeong-kyushin/developer/monk_project
git add monkos_AI/portal/seed_faq.js monkos_AI/portal/lib/cms/render.js monkos_AI/portal/server.js
git commit -m "[portal] FAQ EN/JA 시딩 + 다국어 라우팅 — /en/faq, /ja/faq 추가"
git push origin main
```

## Task 2: prod 배포

⚠️ 직접 gcloud 명령이 아닌 deploy.sh 경유 (ch5 2조)

```bash
cd /Users/jeong-kyushin/developer/monk_project/monkos_AI/portal
./deploy.sh prod
```

> 서비스명: monkos-portal (deploy.sh L63에 정의)
> 리전: us-central1 (deploy.sh L52에 정의)

## Task 3: 배포 후 확인

- `https://monkos.ai/faq` — KO 정상
- `https://monkos.ai/en/faq` — EN 정상
- `https://monkos.ai/ja/faq` — JA 정상

## 완료 조건

- [ ] 커밋 + push 완료
- [ ] prod 배포 완료
- [ ] 3개 URL 200 응답 확인

## ⚠️ 준수 조항

- FAQ 원문 수정 금지
- 배포 외 코드 변경 금지

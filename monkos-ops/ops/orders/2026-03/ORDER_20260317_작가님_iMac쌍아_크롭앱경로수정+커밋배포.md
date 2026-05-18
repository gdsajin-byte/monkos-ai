---
type: ORDER
from: 작가님
to: iMac/막내3
date: 2026-03-17
priority: P0
scope: 커밋 + 배포
status: 대기
---

# 지시서: 크롭앱 CSS/JS 경로 핫픽스 + 커밋 배포

## 배경

쌍아가 직접수정한 `crop/index.html` 내 CSS/JS 상대 경로를 절대 경로로 변경 완료. 커밋+push+배포 필요.

- 수정 내용: `href="crop.css"` → `href="/crop/crop.css"`, `src="crop.js"` → `src="/crop/crop.js"`
- 수정 파일: `monkos_AI/portal/public/crop/index.html`

## Task 1: 커밋 + push

```bash
git add monkos_AI/portal/public/crop/index.html
git commit -m "[portal] 크롭앱 CSS/JS 경로 핫픽스 — 상대→절대"
git push origin main
```

## Task 2: 포털 배포

```bash
cd monkos_AI/portal && bash deploy.sh prod
```

## Task 3: 검증

- `https://monkos.ai/crop` 접속 → CSS/JS 정상 로드 확인
- 크롭앱 UI 정상 렌더링 확인

## 완료 보고

`✅❌💡⏳📁🔀` 형식. 배포 리비전 포함.

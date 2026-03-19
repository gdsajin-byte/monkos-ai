---
type: order
from: iMac/쌍아
to: iMac/막내
date: 2026-03-19
priority: P1
project: SPREAD
---

# ORDER_20260319 — 에디터 워크스테이션 Phase 1~3 일괄 커밋 + prod 배포

**[2026-03-19 17:18 KST] iMac/쌍아 → iMac/막내**

## 배경

Phase 1(공유버튼) + Phase 2(시드카탈로그) + Phase 3(리서치탭) + FAQ 다국어 수정이 모두 완료 상태.
일괄 커밋 + Cloud Run 환경변수 추가 + prod 배포.

## Task 1: 커밋 + push

```bash
cd /Users/jeong-kyushin/developer/monk_project
git add monkos_AI/portal/lib/cms/render.js \
  monkos_AI/portal/lib/cms/search.js \
  monkos_AI/portal/lib/shared/config.js \
  monkos_AI/portal/server.js \
  monkos_AI/portal/public/admin/blog-edit.html \
  monkos_AI/portal/public/admin/data/episode_catalog.json

git commit -m "[portal] 에디터 워크스테이션 Phase 1~3 — 공유버튼+시드카탈로그+리서치탭"
git push origin main
```

## Task 2: Cloud Run 환경변수 추가

```bash
# 네이버 검색 API 키 추가
gcloud run services update monkos-portal \
  --project monkos \
  --region asia-northeast1 \
  --update-env-vars NAVER_CLIENT_ID=JaqN_J5ashaxBC7t6aya,NAVER_CLIENT_SECRET=RThJGuoEET
```

## Task 3: prod 배포

```bash
cd /Users/jeong-kyushin/developer/monk_project/monkos_AI/portal
gcloud run deploy monkos-portal --source . --project monkos --region asia-northeast1
```

## Task 4: 배포 후 확인

| URL | 확인 항목 |
|-----|---------|
| `https://monkos.ai/blog/{아무글}` | 하단 공유 버튼 4개 표시 |
| `https://monkos.ai/admin/blog-edit.html` | 우측 탭 3개 (이미지/시드/리서치) |
| `https://monkos.ai/admin/blog-edit.html` | 시드 탭 — 42건 에피소드 로드 |
| `https://monkos.ai/admin/blog-edit.html` | 리서치 탭 — 검색 동작 |
| `https://monkos.ai/faq` | KO 정상 유지 |
| `https://monkos.ai/en/faq` | EN 정상 유지 |
| `https://monkos.ai/ja/faq` | JA 정상 유지 |

## 완료 조건

- [ ] 커밋 + push 완료
- [ ] Cloud Run 환경변수 NAVER 키 추가
- [ ] prod 배포 완료
- [ ] 7개 URL 전부 정상

## ⚠️ 준수 조항

- 기존 환경변수 삭제/변경 금지 — `--update-env-vars`로 추가만
- FAQ 다국어 라우팅 정상 유지 확인

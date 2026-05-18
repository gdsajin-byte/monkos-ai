# ARCHIVE MANIFEST

> Phase 2 — CF Functions + Auth Pages 레거시 백업
> Date: 2026-02-28 15:59 KST
> Operator: iMac/막내3
> Parent Order: ORDER_20260228_막내3_Phase2실행_functions제거

## functions_cf/ (원경로: functions/)

| 파일 | 원경로 | 사유 | 대응 서비스 |
|------|--------|------|------------|
| README.md | functions/README.md | Phase 2 정리 | - |
| api/README.md | functions/api/README.md | Phase 2 정리 | - |
| api/ads.js | functions/api/ads.js | Cloud Run 이관 | image.monkos.ai |
| api/analyze.js | functions/api/analyze.js | Cloud Run 이관 | image.monkos.ai |
| api/auth.js | functions/api/auth.js | Portal OAuth 통합 | monkos.ai/portal |
| api/generate.js | functions/api/generate.js | Cloud Run 이관 | image.monkos.ai |
| api/idgen.js | functions/api/idgen.js | Cloud Run 이관 | idphoto-kr.monkos.ai |
| api/idphoto-coaching.js | functions/api/idphoto-coaching.js | Cloud Run 이관 | idphoto-kr.monkos.ai |
| api/idphoto-credit-use.js | functions/api/idphoto-credit-use.js | Cloud Run 이관 | idphoto-kr.monkos.ai |
| api/payment.js | functions/api/payment.js | Cloud Run 이관 | monkos.ai |
| api/photo.js | functions/api/photo.js | Cloud Run 이관 | idphoto-kr.monkos.ai |
| api/precheck.js | functions/api/precheck.js | Cloud Run 이관 | idphoto-kr.monkos.ai |
| api/qc.js | functions/api/qc.js | Cloud Run 이관 | idphoto-kr.monkos.ai |
| api/refine.js | functions/api/refine.js | Cloud Run 이관 | idphoto-kr.monkos.ai |
| api/simple-signup.js | functions/api/simple-signup.js | Portal OAuth 통합 | monkos.ai/portal |
| api/telegram-webhook.js | functions/api/telegram-webhook.js | Cloud Run 이관 | monkos.ai |
| api/telegram.js | functions/api/telegram.js | Cloud Run 이관 | monkos.ai |
| api/translate.js | functions/api/translate.js | Cloud Run 이관 | image.monkos.ai |
| api/tx.js | functions/api/tx.js | Cloud Run 이관 | monkos.ai |
| api/visitor.js | functions/api/visitor.js | D1 export 후 제거 | Firestore (향후) |

## auth_pages/ (원경로: MONK_kr/ai_lab/)

| 파일 | 원경로 | 사유 | 대응 서비스 |
|------|--------|------|------------|
| auth-success.html | MONK_kr/ai_lab/auth-success.html | Portal OAuth 통합 | monkos.ai/portal |
| login.html | MONK_kr/ai_lab/login.html | Portal OAuth 통합 | monkos.ai/portal |
| simple-signup.html | MONK_kr/ai_lab/simple-signup.html | Portal OAuth 통합 | monkos.ai/portal |
| auth-error.html | MONK_kr/ai_lab/auth-error.html | Portal OAuth 통합 | monkos.ai/portal |

## 비고
- git history에도 전체 이력 보존됨 (commit hash로 복원 가능)
- 기술회고 시 본 아카이브 + git log 활용
- D1 shared_visitors export: d1_shared_visitors_export.json (Step 3 참고)

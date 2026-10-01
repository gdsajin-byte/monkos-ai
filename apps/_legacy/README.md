# apps/_legacy — 프로덕션 이중 소스 해소분 (삭제 금지)

> 2026-10-01 도구 전수조사 T1. 같은 Cloud Run 서비스를 배포하던 디렉터리 2개 중 비정본을 이동. 이력은 `git log --follow`.

| 디렉터리 | 서비스 | 정본(현행) | 근거 |
|------|------|------|------|
| idphoto-jp-v079/ | monkos-idphoto-jp | `monkos_AI/idphoto-jp/` | 09-29 촬영게이트 prod 배포(00130-njn)가 monkos_AI 측에서 나감. apps 측은 09-01 이후 정지, 46파일 차이 |
| monk_imagen4-backend/ (구 `apps/monk_imagen4/backend`) | monk-image-engine | `monkos_AI/image-pro/backend/` | references.md §서비스 매핑 정본(08-13 실측). monkos_AI 측에 index-v7.js 신규 자산, apps 측은 .bak 잔재. server.js는 08-27 동일 커밋. `.env`(미추적)도 함께 이동됨 — 필요 시 정본 측 `.env` 확인 |

> `apps/monk_imagen4/`(프론트 소스·Pages 설정)는 이동하지 않았다 — 배포 중복 대상이 아님.

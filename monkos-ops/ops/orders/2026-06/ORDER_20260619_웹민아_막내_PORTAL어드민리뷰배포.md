---
type: order
date: 2026-06-19
device: 웹
agent: 민아
status: 진행
---

# ORDER — 포털 어드민 idphoto 리뷰 페이지 배포

> **[2026-06-19 02:16 KST] 웹/민아 → 막내(맥)**
> **분류**: ORDER (배포 실행 — 작가님 직접 승인 경로② / 익일 쌍아 추인 예정)
> **근거**: 작가님 명시 승인 (2026-06-19 새벽). 웹 컨테이너 배포 불가(gcloud·SA 부재)로 맥 막내에 위임.

---

## 배경
PR #86 — 어드민에서 증명사진 원본↔결과물을 비교하는 리뷰 페이지 신설. 프리뷰→결제 이탈 원인(품질 vs 가격) 진단의 선결 도구. 코드 작성·검증·PR까지 웹/민아 완료, 배포만 남음.

## 대상 변경 (PR #86 / branch `claude/6-19-session-start-ndj3mv`)
- `monkos_AI/portal/lib/cms/idphoto-review.js` (신규)
- `monkos_AI/portal/server.js` (라우트 1줄)
- `monkos_AI/portal/public/admin/idphoto-review.html` (신규)
- `monkos_AI/portal/public/admin/index.html` (메뉴 카드)

## 실행 절차

1. 브랜치 체크아웃 + 최신화
   ```
   git fetch origin claude/6-19-session-start-ndj3mv
   git checkout claude/6-19-session-start-ndj3mv
   ```
2. **dev 선배포 + 검증**
   ```
   cd monkos_AI/portal
   ./deploy.sh dev
   ```
   - dev URL에서 `/admin/` 로그인 → "ID Photo Review" 카드 → KR/JP 탭 전환 → 원본↔결과물 비교 정상 렌더 확인
   - Signed URL 이미지 로드 확인 (403/만료 없는지)
3. **prod 배포** (dev 정상 시에만)
   ```
   ./deploy.sh prod
   ```
   - https://monkos.ai/admin/idphoto-review.html 동일 검증

## ⚠️ 준수 조항
- **배포는 `./deploy.sh {env}` 경유만** (헌법 4조 2항·ch5 2조). `gcloud run deploy`/`builds submit` 직접 실행 금지.
- 리전 하드코딩 금지 — deploy.sh 내 REGION이 정본.
- `.env`/시크릿 수정 금지. Signed URL 서명은 런타임 SA(monk-image-engine, serviceAccountTokenCreator)가 처리 — 추가 설정 불요.
- 개인정보(고객 얼굴 원본) 취급 페이지 — 어드민 인증 뒤에만 노출됨을 prod에서 재확인.

## 완료 후
- COMPLETION 보고서 작성 → `monkos-ops/ops/reports/2026-06/` (배포 env·URL·검증 결과·revision)
- 세션 로그 어펜드 + 커밋·푸시
- **익일 쌍아 추인**: 경로② 사후 추인 대상임을 보고서에 명기

## 후속 (별건, 본 배포 범위 밖)
- `thankyou.js:182` `purchase` 이벤트 `value:0` 하드코딩 버그 → 첫 결제 시 GA4 매출 누락. 별도 지시서 필요.

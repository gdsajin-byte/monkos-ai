---
type: session-log
date: 2026-04-10
device: iMac
agent: 쌍아
session: 오전
---

# 세션 로그: 2026-04-10 iMac/쌍아

---

## **[11:14]** 세션 시작

- `git fetch --all` → origin/main 5건 신규 커밋 수신 (M1 오전 세션)
- 머지 완료 (ec7fcf0). works submodule 신규 수신물 없음

### M1 수신 요약
| 커밋 | 내용 |
|------|------|
| `70189c0` | sitemap noindex 페이지 제거 (JP 6건, KR 5건) |
| `a247c3c` | 포탈 HEAD 404 수정 + 구 슬러그 301 리다이렉트 10건 |
| `cdcb3f7` | CITADEL Phase 1.7 — hreflang/canonical/specs i18n 보정 |
| `2ec5db6` | M1/민아 세션 마감 — 세션 로그 + 지시서 2건 |
| `ec7fcf0` | M1/쌍아 세션 마감 — PF 6개 갱신 + PF_BRIEF + SEO 지시서 3건 |

## **[11:14]** 민아 사후 보정 착수 (작가님 지시)

- M1/민아 오전 세션 산출물 전체 리뷰
- 대상: 세션 로그 1건, 지시서 2건, 코딩 커밋 3건, PF_CITADEL

### 코드 리뷰 결과
- 3건 커밋 모두 **로직 오류 없음**, 코드 품질 양호
- HEAD→GET 변환(L223) 스코프: SSR 이하 라우트에만 영향, 적절
- `blogRedirects` 매 요청 재생성: 마이너 (V8 최적화로 실질 영향 미미)
- crop HEAD 요청: L213보다 아래에 변환 위치 → crop HEAD는 폴스루 (기존 이슈, 민아 과실 아님)

### 보정 실행
- 지시서 3건 status → `done` 갱신
- PF_CITADEL Phase 1.7 테이블 보정 — 각 항목별 완료 상태·커밋 해시·비고 명기
- PF_CITADEL 히스토리 — GSC 색인 재요청 19건 추가
- PF_CITADEL Phase 1 GSC 항목 — 4/10 재요청 반영

## **[12:43]** 민아 직접 코딩 사후 승인 보고서 작성

- 작가님 지시: "민아 직접 코딩은 특별 승인 사안 — 보고서로 올리겠습니다"
- `REPORT_20260410_iMac쌍아_민아직접코딩_사후승인보고.md` 작성
- 헌법 1조 2항 대조 + 코드 리뷰 결과 + 쌍아 의견 + 향후 기준 제안
- 작가님 인지 하 보고서 기록으로 결재 완결

## **[14:30~16:15]** 이미지 뱅크 사고 대응 — 진단·복구

### 시작
- 한송이 보고: monkos.ai/admin/blog-edit.html 이미지 뱅크에 "이미지를 업로드해보세요" 표시
- 민아 1차 진단 (지시서 v1): blog-image.js의 401 위장 패턴 단독 문제로 판단
- 작가님 직접 확인: "나도 안 보임" → admin 화이트리스트 가설 기각

### 가설 진화 (3단계)
1. **HMAC 키 변경 (AUTH_SECRET 누락)** → 작가님 검증 → AUTH_SECRET 살아있음, 기각
2. **ADMIN_UIDS 화이트리스트 누락** → 작가님 본인도 안 보임, 한송이만 문제일 수 없음, 기각
3. **GCS_BUCKET 폴백 오기** → `gsutil ls gs://monkos-shared/blog/` → 404 BucketNotFound, 확정

### 근본 원인
- 4/8 `4f71cbc` portal/deploy.sh L142에 `GCS_BUCKET=${GCS_BUCKET:-monkos-shared}` 폴백 추가 — 잘못된 버킷명
- 작가님 로컬 .env에 GCS_BUCKET 비어있음 → 4/10 새벽 SEO 풀배포가 prod에 `monkos-shared` 강제 주입
- 진짜 버킷명: `monk-ai-images` (코드 폴백 + 모든 git 히스토리 일치)
- 4/10 새벽 ~16:15 (~10시간) 동안 admin 이미지 기능 전부 무력화

### 즉시 복구
- `gcloud run services update monkos-portal --update-env-vars="GCS_BUCKET=monk-ai-images"` → rev 00223-llj
- 작가님 검증: 이미지 뱅크 정상 표시 확인

### 잠재 폭탄 발견 (2차)
- 전수조사 중 ADMIN_UIDS도 같은 4/8 커밋에서 잘못 처리 발견
- prod 확인: `ADMIN_UIDS` env 존재하나 value 없음 (빈 문자열)
- [admin-auth.js:14](monkos_AI/portal/lib/cms/admin-auth.js#L14) fallthrough: `ADMIN_UIDS.length === 0`이면 모든 로그인 사용자 admin 통과
- = **구글 로그인만 한 모든 사용자가 admin 권한 보유 상태** (블로그 발행/수정/삭제 가능)
- GCS_BUCKET 환원으로 admin 기능 부활 → 결함 즉시 노출

### 즉시 봉인
- `monkos_AI/portal/scripts/find_admin_uids.js` 작성 — Firestore users 컬렉션에서 이메일로 Google sub UID 조회
- 작가님 UID `108827115052045057530` (gdsajin@gmail.com / 신정규)
- 한송이 UID `115646365617285208759` (oneflower0411@gmail.com / songyi han)
- `gcloud run services update --update-env-vars="^@@^ADMIN_UIDS=...,..."` → rev 00224-5m5
- 봉인 완료: 두 명만 admin

### 산출물
- [find_admin_uids.js](monkos_AI/portal/scripts/find_admin_uids.js) — 향후 admin 추가용 도구로 보존, 헤더 주석 추가

## **[16:25]** 사고 보고서 작성

- 작가님 지시: "원인과 앞으로의 문제 가능성 파악, 재발 방지 + 또다른 버그 사전차단"
- [REPORT_20260410_iMac쌍아_INCIDENT_GCS_BUCKET+ADMIN_UIDS_사고.md](../reports/2026-04/REPORT_20260410_iMac쌍아_INCIDENT_GCS_BUCKET+ADMIN_UIDS_사고.md) 작성
- 10개 섹션: 한 줄 요약 / 시간선 / 4가지 실수 / 잠재 영향 / 가설 진화 / 즉시 조치 / 항구 대책 / 절차적 교훈 / 잘한것·못한것 / 후속 액션

## **[16:30]** 통합 지시서 발행 (Path 1 진행)

- 작가님 선택: Path 1 (한 번에 끝내기)
- [ORDER_20260410_iMac쌍아_막내_4f71cbc잠복폭탄제거+admin401위장머지.md](../orders/2026-04/ORDER_20260410_iMac쌍아_막내_4f71cbc잠복폭탄제거+admin401위장머지.md) 발행
- 작업 4건 통합:
  1. portal/deploy.sh 가드 추가 + monkos-shared 폴백 제거
  2. idphoto-jp/kr/studio deploy.sh 폴백 정리 (3파일, 잠복 폭탄 아니나 혼란 제거)
  3. admin/js 4파일 401 위장 머지 (막내1 코딩 완료분)
  4. find_admin_uids.js 보존
- 작가님 .env 갱신은 작가님 직접 (막내 미터치)
- 단일 커밋 + deploy.sh prod 정규 경로 복귀

### 발견 — idphoto/studio는 잠복 폭탄 아님
- 3파일 모두 L44/35에 `GCS_BUCKET="monk-ai-images"` 하드코딩 존재
- L108/93의 `${GCS_BUCKET:-monkos-shared}` 폴백은 사실상 발동 불가
- 단지 잘못된 폴백값이 코드에 남아 혼란 유발 → 정리 대상이지 P0 아님

### 미결 (별도 어젠다)
- 시크릿 매니저 마운트 (AUTH_SECRET, KAKAO, TOSS 등 20여개) — MEMORY 보안 관리 체계화 어젠다와 통합 필요

## **[16:54]** 막내1 v1 작업 보고 수신

- 막내1: 500c2e1 커밋 — deploy.sh 가드 + .env 의존 패턴
- 작가님 피드백: "근데 이걸 왜 굳이 수동으로 해야하는거니"
- 쌍아 자성: 헌법 4조 1항 ".env 수정 승인" 조항을 "비시크릿값까지 작가님 수동"으로 과확장 해석한 결과
- v2 후속 지시서 발행: deploy.sh L57~58에 비시크릿값 직접 하드코딩, 가드 블록 제거

## **[17:26]** 막내1 후속 작업 완료

- d86217a 커밋 — portal/deploy.sh L60~61 GCS_BUCKET/ADMIN_UIDS 직접 하드코딩, 가드 14줄 제거
- bash -n 통과
- main push 완료

## **[17:30~]** 작가님 ./deploy.sh prod 실행

## **[18:49]** 막내1 배포·검증 완료 보고

| 항목 | 결과 |
|------|------|
| 배포 | rev monkos-portal-00225-22z (100% 트래픽) |
| 빌드 | 45초, SUCCESS |
| GCS_BUCKET env | monk-ai-images ✅ |
| ADMIN_UIDS env | 108827115052045057530,115646365617285208759 ✅ |
| /health | HTTP/2 200 |
| admin 이미지 뱅크 | 272건 정상 (사고 전 수준) |
| Layer 2 (401 위장 차단) | authFetch 전환 동작 |
| 미검증 | 미로그인 /admin/ 리다이렉트 (작가님 세션 활성) — 우선순위 낮음 |

**사고 봉인 + 정상화 + 항구 대책 완료.**

## **[18:50~19:16]** 작가님 인사이트 → PF_DEPLOY 어젠다 등록

- 작가님: "거의 모든 에러가 배포 관련. 복잡한 코드는 잘 치고 고치면서 매번 배포에서 사고"
- 작가님: dev 부활 부정 — 멀티 에이전트 시절 유령 코드 사고 빈발 경험
- 결론: dev 부활 ❌, **preview 리비전 워크플로우 부활 ✅** (deploy.sh L90~108 코드 존재, 죽어있음)
- 어젠다 등록: `project_pending_agenda.md` #24 PF_DEPLOY
  - Phase 0: deploy.sh 단일 진실 (portal 거의 완료)
  - Phase 1: preview 리비전 부활 + 자동 검증
  - Phase 2: 멀티 에이전트 배포 락
  - Phase 3: 시크릿 매니저 + 4개 서비스 동일 패턴 확장
- 메모리 박음:
  - `feedback_diagnose_with_resource_first.md` — 진단 1순위 = 실제 리소스 직접 조회
  - `feedback_constitution_overextension.md` — 헌법 조항 과확장 금지
  - MEMORY.md 인덱스 갱신

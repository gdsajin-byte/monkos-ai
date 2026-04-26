---
type: incident-report
date: 2026-04-10
from: iMac/쌍아
to: 작가님
subject: GCS_BUCKET 오기 + ADMIN_UIDS 무방비 — 4/8 deploy.sh 단순화 커밋의 잠복 폭탄
severity: P0 (잠재 — 운영 방해 + 보안 노출)
duration: 4/10 새벽 ~ 16:00 KST (~10시간)
detected: 한송이 → 작가님 → iMac/쌍아
resolved: 2026-04-10 16:15 KST
related-commit: 4f71cbc (2026-04-08)
related-pf: PF_PORTAL
tags: [incident, deploy, security, gcs, admin, postmortem]
---

# 사고 보고서 — GCS_BUCKET 오기 + ADMIN_UIDS 무방비

**[2026-04-10 16:25 KST] iMac/쌍아 → 작가님**

---

## 1. 한 줄 요약

> 4/8 `4f71cbc` 커밋의 "deploy.sh 단순화"가 4가지 실수를 한 번에 묻어 들였고, 4/10 새벽 SEO 풀배포가 트리거가 되어 (1) 이미지 뱅크 ~10시간 무력화 + (2) 모든 로그인 사용자에게 admin 권한 노출. 한송이가 (1)을 발견해 보고 → 진단 중 (2) 발견 → 둘 다 즉시 봉인.

---

## 2. 사고 시간선

| 시각 | 사건 |
|------|------|
| 2026-04-08 17:25 | `4f71cbc` 커밋 — portal/deploy.sh `--update-env-vars`에서 24개 변수→4개로 축소. `GCS_BUCKET=${GCS_BUCKET:-monkos-shared}` 폴백 신설 (오기). `ADMIN_UIDS=${ADMIN_UIDS}` 빈값 검증 없이 그대로 통과 |
| 2026-04-08 ~ | 챗봇 prod rev 00221 배포. `--update-env-vars`는 추가/교체만 하므로 기존 prod 환경변수(시크릿+ADMIN_UIDS+GCS_BUCKET)는 우연히 보존됨 |
| 2026-04-09 | 한송이 정상 사용 (이전 환경변수 살아있음) |
| 2026-04-10 새벽 | `a247c3c` SEO 수정 풀배포. **신 deploy.sh가 처음으로 풀 적용** → 작가님 로컬 .env에 GCS_BUCKET, ADMIN_UIDS 비어있음 → prod에 빈값/`monkos-shared` 강제 주입 |
| 2026-04-10 ~14:30 | 한송이 보고 — 이미지 뱅크에 "이미지를 업로드해보세요" 표시 |
| 2026-04-10 14:45 | iMac/민아 v1 지시서 발급 — 401 위장 가설로 진단 (절반만 정확) |
| 2026-04-10 14:50 | 쌍아 피드백 — 전수 스캔 + 3층 구조 + AUTH_SECRET 가설 추가, 민아 v2 지시서 |
| 2026-04-10 15:16 | 막내1 Layer 2 코드 작업 완료 (10건 authFetch 전환), Layer 3 승인 대기 |
| 2026-04-10 ~15:30 | 작가님 "나도 안 보임" → ADMIN_UIDS/세션 가설 기각, 가설 C(GCS) 부상 |
| 2026-04-10 15:45 | `gsutil ls gs://monkos-shared/blog/` → 404 BucketNotFound. **가설 C 확정** |
| 2026-04-10 15:55 | 진짜 버킷 `monk-ai-images` 식별 (코드 폴백 + git 히스토리 + idphoto 일치) |
| 2026-04-10 16:00 | `gcloud run services update --update-env-vars="GCS_BUCKET=monk-ai-images"` → **rev 00223-llj 복구** |
| 2026-04-10 16:05 | 쌍아 전수조사 중 ADMIN_UIDS 빈값 발견 → **잠재 폭탄 2차** 보고 |
| 2026-04-10 16:10 | `find_admin_uids.js` 작성·실행 → 작가님 + 한송이 UID 확보 |
| 2026-04-10 16:15 | `gcloud run services update --update-env-vars="^@@^ADMIN_UIDS=...,..."` → **rev 00224-5m5 봉인** |

**총 사고 시간**: ~10시간 (이미지 뱅크) / ~16시간+ (admin 무방비, GCS 사고로 가려져 있다 환원 직후 노출)

---

## 3. 근본 원인 — 4f71cbc 커밋의 4가지 실수

### 원래 deploy.sh (변경 전)

```bash
--update-env-vars "...PROJECT_ID...LOCATION...
KAKAO_REST_API_KEY=${KAKAO_REST_API_KEY}::
KAKAO_REDIRECT_URI=${KAKAO_REDIRECT_URI}::
KAKAO_CLIENT_SECRET=${KAKAO_CLIENT_SECRET}::
TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}::
... (20여개 시크릿) ...
AUTH_SECRET=${AUTH_SECRET}::
GCS_BUCKET=${GCS_BUCKET}::
ADMIN_UIDS=${ADMIN_UIDS}"
```

24개 환경변수가 매 배포마다 작가님 로컬 `.env` 값으로 prod에 박혔음.

### 변경 후

```bash
--update-env-vars "^::^PROJECT_ID=${PROJECT_ID}::LOCATION=${REGION}::GCS_BUCKET=${GCS_BUCKET:-monkos-shared}::ADMIN_UIDS=${ADMIN_UIDS}"
```

4개만 남기고 20개 시크릿 삭제. **의도는 옳음** ("시크릿은 GCP에 한 번 박아두고 deploy.sh가 매번 덮어쓰지 말자"). 시크릿 회전·운영 안전성 증가.

### 그러나 4가지 실수가 동시에 묻어 들어감

#### 실수 1 — `monkos-shared` 오기

- 진짜 버킷명은 `monk-ai-images` (config.js:66 폴백 + idphoto deploy.sh `GCS_BUCKET="monk-ai-images"` 하드코딩)
- portal deploy.sh에만 `monkos-shared` 신규 폴백 추가
- 추정 원인: 시크릿 매니저 통합 작업 중 다른 서비스의 변수와 혼동
- **존재하지 않는 버킷** — 즉시 사고 발생 코드

#### 실수 2 — ADMIN_UIDS 빈값 검증 누락

- ADMIN_UIDS는 화이트리스트 (시크릿 아님) → deploy.sh에 남겨놓는 것 자체는 옳음
- 하지만 작가님 로컬 .env에 ADMIN_UIDS가 비어있는지 확인 안 함
- [admin-auth.js:14](monkos_AI/portal/lib/cms/admin-auth.js#L14)의 fallthrough가 결정타:
  ```js
  if (payload && (ADMIN_UIDS.length === 0 || ADMIN_UIDS.includes(payload.userId))) {
    return payload;  // ← 빈 배열이면 무조건 통과
  }
  ```
- 이 fallthrough는 "개발모드에서 화이트리스트 안 정해도 통과" 의도였음 (server.js:352 부팅 로그 참고)
- 프로덕션에서 발동되면 **모든 로그인 사용자가 admin**

#### 실수 3 — 시크릿 매니저 마운트 미실행

- 의도: 시크릿을 GCP Secret Manager에 등록하고 `--update-secrets`로 마운트
- 실제: **deploy.sh에서 시크릿 제거만 하고 매니저 등록·마운트는 안 함**
- 사고가 안 터진 이유 = `gcloud run deploy --update-env-vars`가 **추가/교체만 하지 삭제 안 함**. 4/8 이전 배포에서 박힌 env가 우연히 살아있었음
- 즉 **운에 의존한 안전망**. 누군가 `--clear-env-vars` 한 번이면 AUTH_SECRET, KAKAO, TOSS, LINE, LEMONSQUEEZY 등 20여개 동시 사망

#### 실수 4 — 영향 평가·dev 검증 부재

- 커밋 메시지: "deploy.sh 4개 시크릿 근본 수정"
- dev 환경 검증 없음, 영향 평가 없음
- 4/10 새벽 SEO 풀배포가 첫 풀 적용 — 무방비

---

## 4. 잠재 영향 (만약 더 늦게 발견했다면)

### 이미지 뱅크 (실제 발생)
- 4/10 새벽 ~ 16:00 admin 이미지 업로드/조회/삭제 전면 실패
- 블로그 본문 기존 이미지는 GCS 직접 URL이라 영향 0 (브라우저가 storage.googleapis.com 직접 호출)
- 한송이 1명만 인지 (블로그 발행 잠시 막힘)

### admin 권한 노출 (잠재)
- 4/10 새벽 ~ 16:15 모든 로그인 사용자가 admin
- 대상 페이지: `/admin/blog-edit.html`, `/admin/board`, `/admin/faq`, `/admin/gallery`
- 가능 행위: 블로그 발행/수정/삭제, FAQ 변조, 갤러리 변조, 게시판 관리
- **운 좋게 외부인 발견 0건** (admin URL 노출 없음)
- 발견됐다면: 블로그 콘텐츠 무단 변조, SEO 자산 손실, 브랜드 손상

### 시크릿 폭탄 (미발현)
- 현재 prod에 AUTH_SECRET, KAKAO, TOSS, LINE 등 20여개 시크릿이 4/8 이전 값으로 우연히 살아있음
- 다음 누군가 `--clear-env-vars` 또는 `--set-env-vars` 풀세트 update 한 번이면 동시 사망
- 결과: 결제 불능, 카카오 로그인 불능, 라인 로그인 불능, 텔레그램 알림 불능, 챗봇 인증 불능

---

## 5. 가설 진화 (진단 과정 복기)

5번의 가설을 거쳤음. 진단 비용 = 작가님 시간 ~30분.

| # | 가설 | 근거 | 검증 결과 |
|---|------|------|----------|
| 1 | 401 위장 (민아 v1) | blog-image.js 코드 패턴 | ✅ 표층 버그는 맞으나 근본 아님 |
| 2 | HMAC 키 변경 (AUTH_SECRET 누락) | deploy.sh 변경 + 폴백 체인 | ❌ AUTH_SECRET 살아있음 |
| 3 | ADMIN_UIDS 화이트리스트 누락 | deploy.sh `${ADMIN_UIDS}` 빈 가능성 | ❌ 작가님 본인도 안 보임 (한송이 단독 문제 아님) |
| 4 | GCS 권한 또는 SA 문제 | 4/8 deploy.sh가 GCS_BUCKET 폴백 추가 | ⚠️ 후속 가설로 |
| 5 | **GCS_BUCKET 오기** | `gsutil ls gs://monkos-shared/blog/` → 404 | ✅ **확정** |

### 진단 교훈
- **"한 사용자만 문제" 가정의 함정**: 한송이 보고만 받았을 때 ADMIN_UIDS 가설을 먼저 떠올렸으나, 작가님 본인이 안 보인다는 사실이 들어오고서야 가설 기각. 1명 보고 ≠ 1명 영향
- **표층 버그가 근본 원인을 가린다**: blog-image.js 401 위장이 진단을 잘못된 방향으로 유도. 민아의 1차 진단도 여기서 멈춤
- **gsutil 1줄이 가설 5개를 정리**: 코드/로그/환경변수 추정보다 **실제 리소스 직접 조회**가 가장 빠름

---

## 6. 즉시 조치 (완료)

| 시각 | 조치 | 결과 |
|------|------|------|
| 16:00 | `gcloud run services update monkos-portal --update-env-vars="GCS_BUCKET=monk-ai-images"` | rev 00223-llj — 이미지 뱅크 복구 |
| 16:15 | `gcloud run services update monkos-portal --update-env-vars="^@@^ADMIN_UIDS=108827115052045057530,115646365617285208759"` | rev 00224-5m5 — admin 봉인 (작가님+한송이만) |

법률 5장 2조(deploy.sh 경유) 한시 예외 — 사고 복구 긴급성 + deploy.sh 자체가 버그의 원인이라 deploy.sh 재배포 시 같은 오류 반복 위험. 사후 deploy.sh 정상화 후 정규 경로 복귀.

---

## 7. 항구 대책 (착수 예정)

### P0 — 4/8 커밋의 잠복 폭탄 제거 (지시서 발행 예정)

| 항목 | 변경 | 이유 |
|------|------|------|
| portal/deploy.sh L142 GCS_BUCKET 폴백 제거 | `${GCS_BUCKET:-monkos-shared}` → 빈값이면 fail-fast | 잘못된 폴백값이 트로이목마. 폴백 자체 금지 |
| ADMIN_UIDS 빈값 검증 가드 | deploy 직전 `[ -z "$ADMIN_UIDS" ]` 체크 → 중단 | admin 권한 무방비 재발 차단 |
| idphoto-jp/kr/studio deploy.sh도 동일 폴백 제거 | 3파일 동시 수정 | 같은 폭탄 동시 잠복 |
| Layer 2 — admin/js 401 위장 패턴 머지 | 막내1 작업 완료, 커밋·배포 대기 | 다음 401 사고 위장 차단 |

### P1 — 시크릿 매니저 마운트 (별도 어젠다)

- AUTH_SECRET, KAKAO, TOSS, LINE, LEMONSQUEEZY, TELEGRAM 등 20여개를 Secret Manager에 등록
- deploy.sh에 `--update-secrets="KEY=KEY:latest"` 플래그 추가
- 작가님 SA 권한 + IAM 바인딩 작업 필요
- MEMORY의 "보안 관리 체계화" 어젠다와 통합

### P2 — find_admin_uids.js 보존

- [scripts/find_admin_uids.js](monkos_AI/portal/scripts/find_admin_uids.js) 헤더 주석 추가 후 보존
- 향후 admin 추가 시 재사용

---

## 8. 재발 방지 — 절차적 교훈

### deploy.sh 수정 시 필수 절차 (제안)

1. **dev 환경 풀배포 검증** (`./deploy.sh dev`) — 변경 후 dev에서 한 사이클 돌려 환경변수 누락 여부 즉시 확인
2. **prod 환경변수 diff** — 배포 전 `gcloud run services describe`로 현재 prod env 출력해 비교
3. **영향 평가서 첨부** — 24개→4개 같은 대규모 변경은 영향 평가 1페이지 의무
4. **단일 커밋 원칙** — 4f71cbc는 챗봇·법률·deploy·USB 등 4건이 한 커밋에 묶여있어 영향 추적 어려움. **deploy.sh 변경은 단독 커밋**
5. **폴백값 금지** — `${VAR:-default}` 패턴 자체 금지. 미설정 시 fail-fast가 안전

### 헌법/법률 측면

- **헌법 4조 1항 (deploy.sh 수정 전 승인)**: 4/8 커밋은 작가님 승인 하 진행됐으나 영향 검토 부재
- **법률 5장 2조 (deploy.sh 경유)**: 본 사고 대응은 한시 예외. 정상화 후 즉시 복귀
- **헌법 5조 4항 (대응 프로토콜)**: 본 보고서가 사후 보정 기록

---

## 9. 잘한 것·못한 것

### 잘한 것
- 한송이의 1건 보고가 트리거 — **현장 피드백이 잠복 폭탄 발견의 결정적 단서**
- 작가님 "나도 안 보임" 한마디로 ADMIN_UIDS 가설 즉시 기각 — 진단 시간 단축
- gsutil 1줄로 가설 5개 정리 — **실제 리소스 직접 조회의 위력**
- 1차 복구 후 즉시 전수조사 → ADMIN_UIDS 폭탄 발견 — **재발 방지 의식**

### 못한 것
- 4/8 커밋 머지 시점에 영향 평가 부재
- 민아 v1 진단이 401 위장 단독으로 멈춤 (전수 스캔 부재)
- 가설 진화에 작가님 시간 ~30분 소모. 첫 가설부터 `gsutil ls`를 시도했다면 5분 단축
- ADMIN_UIDS fallthrough 코드(`length === 0` 통과)가 프로덕션에서 발동 가능한 구조 — **개발 편의성과 프로덕션 안전성의 미분리**

---

## 10. 후속 액션

| # | 항목 | 담당 | 상태 |
|---|------|------|------|
| 1 | 본 보고서 작성 | 쌍아 | ✅ |
| 2 | 통합 지시서 발행 (deploy.sh 4파일 수정 + Layer 2 머지 + ADMIN_UIDS 가드) | 쌍아 | ⏳ |
| 3 | 막내1 작업·검증·배포 | 막내1 | ⏳ |
| 4 | PF_PORTAL 히스토리 갱신 | 쌍아 | ⏳ |
| 5 | 시크릿 매니저 마운트 어젠다 등록 | 쌍아 | ⏳ |
| 6 | 세션 마감 보고 | 쌍아 | ⏳ |

---

*본 보고서는 헌법 제5조 4항(에이전트 대응 프로토콜) 및 제3조 2항(완료 보고 의무)에 따른 사고 기록입니다.*

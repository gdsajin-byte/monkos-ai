---
type: order
from: iMac/쌍아
to: 막내1
date: 2026-03-22
status: 대기
priority: 긴급
---

# 지시서: 이미지 겹침 수정 — 배포만 왜 안 됐는가

> **[2026-03-22 12:05 KST] iMac/쌍아 → 막내1**

## 배경

- 이 프로젝트에서 `./deploy.sh prod`로 수십 회 배포했고, **다른 건 전부 정상 반영됐다**
- 그런데 03-22 새벽 M1에서 이미지 겹침 CSS 수정을 6회 배포했는데 **전부 반영 안 됨**
- "리전이 다르다", "도메인 매핑이 꼬였다" 같은 인프라 원인은 **아닐 가능성이 높다** (다른 배포는 잘 됐으므로)

## 질문 — 정확히 이것만 답하라

**"03-22 새벽 M1에서 이미지 겹침 CSS를 6회 배포했는데 왜 반영이 안 됐는가?"**

## 조사 항목

### 1. 배포 대상 확인

M1 세션 로그 (`monkos-ops/ops/sessions/2026-03/2026-03-22_M1_쌍아.md`)에서:

- 6회 배포가 `dev`로 갔는지 `prod`로 갔는지
- `deploy.sh` 를 실행한 건지, 아니면 `gcloud run deploy`를 직접 실행한 건지
- 배포 후 확인한 URL이 prod(`monkos.ai`)인지 dev 서비스 URL인지

### 2. 배포 소스 디렉토리 확인

`deploy.sh`의 `gcloud builds submit`은 **현재 디렉토리**를 tar로 압축해서 올림:

- M1에서 실행 시 작업 디렉토리가 `monkos_AI/portal/`이었는지
- `.gcloudignore`가 정상 적용되어 CSS/JS가 제외되지 않았는지
- 혹시 `monkos_AI/portal/` 바깥에서 실행해서 Dockerfile을 못 찾은 건 아닌지

### 3. 실제로 배포된 코드 확인 방법

- `blog-editor.css`에 캐시 버스팅 `?v=20260322d`가 추가된 시점
- 배포 후 `curl -I https://monkos.ai/admin/css/blog-editor.css` 로 Cache-Control 헤더 확인했는지
- 배포 후 `curl https://monkos.ai/admin/css/blog-editor.css` 로 실제 CSS 내용이 바뀌었는지 확인했는지

### 4. 마지막 정상 배포와의 차이

- 직전 정상 배포: `b94a0be` (03-21 16:22) — 이건 어떻게 배포했는지 세션 로그 추적
- 03-22 새벽 배포와 뭐가 달랐는지 (디바이스? 브랜치? 명령어? 환경변수?)

### 5. 커밋-배포 타이밍 확인

- CSS 수정 커밋 시점과 배포 실행 시점 대조
- 혹시 커밋 전에 배포한 건 아닌지 (uncommitted changes가 gcloud builds submit에 포함되는지 확인)
- `gcloud builds submit`은 **git 상태와 무관하게 현재 파일시스템**을 올림 — 이 점이 혼란의 원인일 수 있음

### 6. Google Frontend 캐시 vs 코드 미반영 구분

- GFE 캐시 문제라면: 배포는 성공했으나 브라우저/CDN에서 구버전을 보여줌
- 코드 미반영이라면: 배포 자체가 잘못된 코드를 올렸거나, 배포가 실패했거나
- 이 둘을 구분하는 방법: Cloud Run 서비스 URL(`*.run.app`) 직접 접속 vs `monkos.ai` 접속 비교

## 읽어야 할 파일

1. `monkos-ops/ops/sessions/2026-03/2026-03-22_M1_쌍아.md` — 6회 배포 상세
2. `monkos-ops/ops/sessions/2026-03-22_M1_막내1.md` — 막내1 실행 기록
3. `monkos_AI/portal/deploy.sh` — 배포 스크립트
4. `monkos_AI/portal/Dockerfile` — 빌드 과정
5. `monkos_AI/portal/.gcloudignore` — 제외 파일
6. 직전 정상 배포 세션 로그 (03-21 or 03-20 세션에서 prod 배포 기록 찾기)

## 산출물

`monkos-ops/ops/reports/` 에:

```
REPORT_20260322_막내_이미지겹침_배포실패원인.md
```

### 반드시 포함할 내용

1. **6회 배포의 각 실행 내역** — 언제, 어떤 명령으로, 어떤 디렉토리에서, dev/prod 어디로
2. **직전 정상 배포와의 차이점** — 뭐가 달라서 이번엔 안 됐는지
3. **원인 확정 또는 가설 순위** — 근거와 함께
4. **재현/검증 방법** — 이 원인이 맞는지 확인하는 명령어

## ⚠️ 주의

- "리전이 다르다", "인프라가 꼬였다" 같은 추측 금지 — **다른 배포는 잘 됐다**는 사실이 전제
- 코드 수정 금지 — 분석만
- 헌법 제1조 1항: 매 턴 타임스탬프

---
type: REPORT
date: 2026-04-22
author: iMac/막내2
status: 완료
related_order: ORDER_20260422_인프라감사_Cloudflare_Git.md
---

# Cloudflare + Git 인프라 감사 보고서

> **[2026-04-22 11:30 KST] iMac/막내2 → iMac/쌍아**
> 범위: CF 계정 b5eeab70e40208bd88a5c463741b5a38 전체 + GitHub gdsajin-byte 조직
> 방법: wrangler OAuth + CF API v4 + gh CLI. 읽기 전용 감사 (헌법 4조 준수)

---

## 0. TL;DR — 즉시 주목할 5가지

| # | 발견 | 심각도 |
|---|------|--------|
| 1 | **Cloudflare Workers 6개 전부 3개월+ 방치** (2026-01 마지막 수정, 라우트·커스텀 도메인 0) | 🟡 유휴 |
| 2 | **D1 2개 24h read 0회** (monk-services-db 18테이블, monk-db 9테이블) — 실사용 없음 | 🟡 유휴 |
| 3 | **R2 2/3 버킷 빈 상태** (monk-apps, monk-models 모두 0바이트. monk-chat-logs만 48개/31KB) | 🟡 유휴 |
| 4 | **monk-kr CF Pages의 `production_deployments_enabled=false`** (프로덕션 자동배포 OFF 상태. 현재 수동 deploy는 통과 중) | 🟠 구조 |
| 5 | **origin/claude/* 유휴 브랜치 7개** (6개가 4주 전 이후 멈춤 — 워크트리 잔재로 추정) | 🟢 위생 |

**한 줄 결론**: 본진(monk.kr CF Pages)과 위성(Cloud Run on monkos.ai)은 정상. 단, 2026-01 실험기에 깐 Workers/D1/R2 자산이 대부분 방치되어 정리 대상. 시크릿 유출 없음.

---

## 1. 도메인 → 서비스 매핑 전체도

| 도메인 | 타입 | 실제 타겟 | 비고 |
|--------|------|-----------|------|
| `monk.kr` | A (CF proxy) | Cloudflare (172.67.167.101, 104.21.59.10) | CF Pages `monk-kr` 프로젝트 |
| `www.monk.kr` | — | 미설정 | DNS 미배치 |
| `blog.monk.kr` | — | 미설정 | DNS 미배치 |
| `monkos.ai` | A | 216.239.32-38.21 (Google Domains Redirect) | 모바일 AI 분기 허브 |
| `www.monkos.ai` | — | 미설정 | |
| `idphoto-kr.monkos.ai` | CNAME | ghs.googlehosted.com | Cloud Run (monkos-idphoto-kr) |
| `idphoto-jp.monkos.ai` | CNAME | ghs.googlehosted.com | Cloud Run (monkos-idphoto-jp) |
| `studio.monkos.ai` | CNAME | ghs.googlehosted.com | Cloud Run (monkos-studio) |
| `pt.monkos.ai` | CNAME | ghs.googlehosted.com | Cloud Run (헌법 5장 한시예외) |
| `portal.monkos.ai` | — | 미설정 | deploy.sh 존재하나 도메인 미연결 |
| `api.monkos.ai` | — | 미설정 | |
| `admin.monkos.ai` | — | 미설정 | |

⚠️ **발견 1**: `portal.monkos.ai`는 `monkos_AI/portal/deploy.sh`로 배포 가능하나 DNS 미연결 — 서비스 죽어있거나 Cloud Run 직URL로만 접근 중.
⚠️ **발견 2**: `monkos-ai.pages.dev`는 존재하나 커스텀 도메인 미연결 (monkos.ai 루트는 Google 리디렉션에 점유).

---

## 2. Cloudflare 존(Zone)

| 이름 | Zone ID | 플랜 | 상태 |
|------|---------|------|------|
| monk.kr | `85f12f5941f9fa0f12ebbd29133a5ee8` | Free | active |
| monkos.ai | `ebc0ca742a98e6193bf795ee846c9fa5` | Free | active |

- Workers Routes: **양쪽 모두 0개** (CF Workers가 존에 바인딩되어 있지 않음)

---

## 3. Cloudflare Pages

| 프로젝트 | 도메인 | Prod Branch | Last Deploy | Prod Auto-Deploy | Source |
|----------|--------|-------------|-------------|------------------|--------|
| **monk-kr** | monk-kr.pages.dev, **monk.kr** | main | 2026-04-22 02:01 (20분 전) | ❌ **OFF** | github:gdsajin-byte/monk_project |
| **monkos-ai** | monkos-ai.pages.dev | main | 2026-03-18 06:57 (1개월 전) | ✅ ON | github:gdsajin-byte/monkos-ai |

⚠️ **발견 3**: **monk-kr에서 `production_deployments_enabled=false`**.
- 최근 배포가 정상 찍혀 있는 걸 보면 수동/CLI 트리거는 작동. 자동 CI는 꺼짐.
- 의도된 상태인지 확인 필요 (의도: Pages Functions 미검증 코드 배포 방지일 수도).
- Preview도 `preview_deployment_setting=none`으로 완전 차단.

⚠️ **발견 4**: **monkos-ai Pages는 1개월간 배포 없음**. Public 레포 `gdsajin-byte/monkos-ai`와 연결되어 있으나 활동 정지. 현 모바일 AI 서비스는 Cloud Run으로 이관되어 CF Pages 버전은 유휴로 추정.

---

## 4. Cloudflare Workers

| 스크립트 | 생성 | 마지막 수정 | 바인딩 | Cron | workers.dev | 라우트 | 상태 판정 |
|---------|------|-------------|--------|------|-------------|--------|-----------|
| monk-ai-studio-pro-backend | 2026-01-11 | 2026-01-11 | ENVIRONMENT, PROJECT_ID, GEMINI_API_KEY(🔑) | — | ✅ | 0 | 🟡 유휴 |
| monk-gemini-proxy | 2026-01-04 | 2026-01-10 | AI, D1(DB), R2_BUCKET | — | ✅ | 0 | 🟡 유휴 |
| monk-imagen-proxy | 2026-01-05 | 2026-01-25 | GCP_LOCATION(🔑)·GCP_PROJECT_ID(🔑)·GCP_SERVICE_ACCOUNT_KEY(🔑)·GEMINI_API_KEY(🔑) | — | ✅ | 0 | 🟡 유휴 |
| monk-model-test | 2026-01-07 | 2026-01-07 | AI, D1(DB) | — | ✅ | 0 | 🔴 테스트 잔재 |
| monk-vertex-proxy | 2026-01-08 | 2026-01-08 | ENGINE_ID, LOCATION, PROJECT_ID, GOOGLE_ACCESS_TOKEN(🔑) | — | ✅ | 0 | 🟡 유휴 |
| ssang-a | 2026-01-06 | 2026-01-06 | AI | — | ✅ | 0 | 🔴 테스트 잔재 |

- 🔑 = secret_text 바인딩 (값 미조회, 이름만)
- compat_date가 monk-* 5개는 `2024-01-01` (2년 전)

⚠️ **발견 5**: **6개 워커 모두 커스텀 도메인/라우트 0**. 실 트래픽은 `*.workers.dev` 서브도메인으로만 도달 가능.
⚠️ **발견 6**: **`monk-imagen-proxy`에 `GCP_SERVICE_ACCOUNT_KEY` secret 보관**. GCP 보안 집중관리 방침(`memory/project_security_consolidation.md`)과 교차검토 필요. 현재 사용 안 되는 워커에 SA 키가 잔존.
⚠️ **발견 7**: `monk-model-test`, `ssang-a`는 네이밍상 명백한 실험물 → 삭제 최우선 후보.
⚠️ **발견 8**: 전 워커 `workers.dev` 서브도메인 활성화 — 외부에서 URL만 알면 호출 가능. 보안상 비활성 권장.

---

## 5. D1 / KV / R2 스토리지

### 5-1. D1

| DB | UUID | 테이블 수 | 크기 | 24h reads | 상태 |
|----|------|-----------|------|-----------|------|
| monk-services-db | `1c88fa57-743a-470d-905e-d9054988fcdd` | 18 | 274 KB | **0** | 🟡 스키마 있음, 트래픽 0 |
| monk-db | `6fe2a64b-9144-436c-94f7-1e9375249a1e` | 9 | 131 KB | **0** | 🟡 스키마 있음, 트래픽 0 |

- monk-services-db 주요 테이블: `visitor_activities`, `visitor_feedback`, `shared_visitors`, `transactions`, `credit_usage`, `shared_credit_transactions` ...
- monk-db 주요 테이블: `Essence_Notes`, `images`, `usage_logs`, `shared_staff`, `shared_enterprise`, `shared_credit_transactions`

⚠️ **발견 9**: 두 DB 모두 **24시간 read 0회**. monk-gemini-proxy/monk-model-test의 D1 바인딩이 있지만 워커 자체가 유휴 → 실제 트래픽 없음.

### 5-2. KV

- **네임스페이스 0개**. 미사용.

### 5-3. R2

| 버킷 | 생성 | 객체 수 | 크기 | 상태 |
|------|------|---------|------|------|
| monk-apps | 2026-01-06 | **0** | 0 B | 🔴 빈 버킷 |
| monk-chat-logs | 2026-01-07 | 48 | 31,369 B (+7.4KB 메타) | 🟢 사용 중 (소량) |
| monk-models | 2026-01-06 | **0** | 0 B | 🔴 빈 버킷 |

⚠️ **발견 10**: monk-apps, monk-models는 개설 후 한 번도 업로드 없음 → 삭제 후보.

---

## 6. Cron Triggers / Queues / Workflows / DO / Dispatch / Hyperdrive

| 카테고리 | 결과 |
|----------|------|
| Cron (워커 6개 전수) | 등록 0 |
| Queues | 0 |
| Workflows | 0 |
| Durable Objects Namespaces | null (미사용) |
| Dispatch Namespaces | 권한 없음 (미구매) |
| Hyperdrive | 0 |

→ **모두 미사용**. 현 인프라는 "Pages + Cloud Run + 유휴 Workers/D1/R2"로 요약.

---

## 7. GitHub 레포 현황

| 레포 | 가시성 | 설명 | 마지막 push | 아카이브 | CF 연동 |
|------|--------|------|-------------|----------|---------|
| **monk_project** | private | (본진) | 2026-04-22 02:01 | ❌ | ✅ CF Pages `monk-kr` |
| **monkos-works** | private | — | 2026-04-22 02:01 | ❌ | submodule |
| **monk-han** | private | M4, SNS·마케팅 | 2026-04-15 | ❌ | — |
| **monkos-ai** | **public** | Passport/Profile/Beauty 플랫폼 설명문 | 2026-03-18 | ❌ | ✅ CF Pages `monkos-ai` |
| **monk-kku** | private | M2, 사진관 운영 | 2026-02-26 | ❌ | — |

### 본진 리모트 구성
- `origin` = `git@github.com:gdsajin-byte/monk_project.git`
- `monkos-ai` = `git@github.com:gdsajin-byte/monkos-AI.git` ← **duplicate remote 연결**
- 서브모듈: `monkos-ops/works` → `monkos-works` (main 추적)

### 원격 브랜치 (origin)
| 브랜치 | 나이 | 판정 |
|--------|------|------|
| main | — | 정상 |
| claude/agitated-edison-87c652 | 4일 전 | 🟡 최근 |
| claude/elegant-rhodes | 4주 전 | 🔴 유휴 |
| claude/goofy-dubinsky | 4주 전 | 🔴 유휴 |
| claude/nervous-jennings | 4주 전 | 🔴 유휴 |
| claude/serene-knuth | 4주 전 | 🔴 유휴 |
| claude/wizardly-swartz | 4주 전 | 🔴 유휴 |
| claude/zealous-ride | 4주 전 | 🔴 유휴 |

⚠️ **발견 11**: `claude/*` 브랜치 7개 잔존. `.claude/worktrees/` 흔적과 일치 — Claude Code 워크트리 습성의 원격 잔재 (메모리 "워크트리 금지" 원칙과 충돌). 정리 대상.

⚠️ **발견 12**: `monkos-ai` public 레포에 **실제 서비스 설명문**(Passport/Profile/Beauty) 존재. 외부 노출 중이므로 브랜드 공개 범위 점검 필요 (헌법 4조 3항 "내부 기밀 보호"는 공식 표기가 'MONKOS' → 이 레포는 그 기준 만족).

---

## 8. Git 인증·배포 키

### SSH 키 (사용자 계정 gdsajin-byte)

| 제목 | 추가일 | 타입 |
|------|--------|------|
| Mac Mini | 2026-01-10 | ed25519 |
| IMac | 2026-01-11 | ed25519 |
| Han's M4 | 2026-02-26 | ed25519 |
| monk-kku-coworker | 2026-02-26 | ed25519 |

- **발견 13**: "Mac Mini"는 M1/M2 구분 모호. 메모리 디바이스 맵(M1=집, M2=몽크사진관)과 매핑 불명확 — 제목 `Mac Mini M1` / `Mac Mini M2`로 구분 권장.
- SSH signing key 권한(`admin:ssh_signing_key`) 부족으로 서명 키 확인 불가.

### Deploy Keys (레포별)

| 레포 | 등록된 키 수 |
|------|-------------|
| monk_project | 0 |
| monkos-works | 0 |
| monk-han | 0 |
| monkos-ai | 0 |
| monk-kku | 0 |

- **발견 14**: 전 레포 deploy key 미등록. 모든 클론·푸시는 사용자 SSH로 이루어짐. 현재 체계(gdsajin-byte 단일 계정 운용)와는 부합. 위험 없음.

---

## 9. 위험·개선 발견사항 종합 (⚠️)

| # | 발견 | 심각도 | 권장 조치 |
|---|------|--------|-----------|
| 1 | CF Workers 6개 전부 유휴 | 🟡 | 삭제 vs 보존 판정. 삭제 전 secret 소거 |
| 3 | monk-kr Pages: 프로덕션 자동배포 OFF | 🟠 | 의도 확인. 의도라면 문서화, 아니면 ON |
| 4 | monkos-ai Pages: 1개월 방치 | 🟡 | 운영 이관 공식화 + Pages 프로젝트 폐기/보존 결정 |
| 6 | monk-imagen-proxy에 GCP_SERVICE_ACCOUNT_KEY 잔존 | 🟠 | 보안 집중관리 방침에 맞게 키 제거 or 워커 폐기 |
| 7 | monk-model-test / ssang-a | 🔴 | 즉시 삭제 후보 (네이밍상 명백) |
| 8 | 전 워커 workers.dev 활성 | 🟠 | 비활성 처리 |
| 9 | D1 2개 24h read 0회 | 🟡 | 스키마 아카이브 후 삭제 vs 보존 판정 |
| 10 | R2 monk-apps/monk-models 빈 버킷 | 🟡 | 삭제 후보 |
| 11 | origin/claude/* 7개 | 🟢 | 메인 머지 확인 후 원격 삭제 |
| 13 | SSH key 제목 "Mac Mini" 모호 | 🟢 | 제목 갱신 (M1/M2 구분) |

---

## 10. 유휴 리소스 정리 후보 목록

**즉시 삭제 검토:**
- Worker: `monk-model-test`, `ssang-a`
- R2: `monk-apps`, `monk-models`
- origin 브랜치: `claude/elegant-rhodes`, `claude/goofy-dubinsky`, `claude/nervous-jennings`, `claude/serene-knuth`, `claude/wizardly-swartz`, `claude/zealous-ride` (머지 이력 확인 후)

**보존 필요 판정:**
- Worker `monk-gemini-proxy` / `monk-imagen-proxy` / `monk-vertex-proxy` / `monk-ai-studio-pro-backend` — 재활용 여지
- D1 `monk-services-db` / `monk-db` — 테이블 스키마 검토 후 결정

**도메인 미연결:**
- `www.monk.kr`, `blog.monk.kr`, `www.monkos.ai`, `portal.monkos.ai`, `api.monkos.ai`, `admin.monkos.ai` — 계획상 필요한지 로드맵 대조

---

## 11. 감사 방법 (참고)

- **인증**: wrangler OAuth 토큰 (~/Library/Preferences/.wrangler/config/default.toml)
  - Account: b5eeab70e40208bd88a5c463741b5a38
  - Scope: account:read, zone:read, workers(write), d1(write), pages(write), queues(write) 등
  - 단, DNS read 스코프 부재 → `dig`로 대체
- **CF API**: `api.cloudflare.com/client/v4` 직접 호출
- **wrangler CLI**: pages list, d1 list/info/execute, r2 bucket list, queues list
- **GitHub**: `gh` CLI (repo list, ssh-key list, api repos/*/keys)
- 읽기 전용 — 수정/삭제 API 미호출 (헌법 4조 2항)
- 시크릿 값 미추출 — 이름·타입만 (헌법 4조 1항)

---

**끝.**

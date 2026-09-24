---
type: completion
date: 2026-09-24
device: iMac
agent: 민아
status: 마감
portfolio: PF_KKU
subject: monk.kr 버튼 배포(GitHub Actions workflow_dispatch) 첫 실측 — 4차 만에 성공, 시크릿 2종 등록
---

# COMPLETION — monk.kr 버튼 배포 첫 실측

**[2026-09-24 13:12 KST]** iMac/민아 → 작가님

## 시크릿
- 작가님 발급: Cloudflare 계정 API 토큰 `github-actions-monk-kr-pages` (Account · Cloudflare Pages · Edit 1권한, 만료 2027-09-24). 값 비접촉.
- GCP SM: `CF_PAGES_DEPLOY_TOKEN` v1(13:02) · `CF_ACCOUNT_ID` v1(13:04) — `secret add`, 용도 기록, 인벤토리 자동 맵.
- GitHub Secrets: 작가님 최초 `gh secret set` 2건이 **빈값**으로 들어감(입력 비표시 상태에서 Enter — 2차 실행 로그의 `CLOUDFLARE_API_TOKEN: ` 공란으로 판정). 민아가 SM 정본 → `gh secret set` 파이프로 재등록(값은 파이프 안에서만, 컨텍스트 미노출 — feedback_secret_key_ops "기존 키 인프라 등록=일임").

## 워크플로 실행 이력 (4회)
| # | run | 결과 | 원인 → 조치 |
|---|---|---|---|
| 1 | 35954170110 | ❌ | wrangler-action@v3가 러너 npm 11에서 `npx` 자동 설치 거부 → setup-node 22 + `wrangler@4.66.0`(로컬 정본 버전) 직접 실행 |
| 2 | 35954269239 | ❌ | GitHub Secrets 빈값 → SM에서 재등록 |
| 3 | 35954389096 | ❌ | 배포 성공했으나 스모크 `monk.kr/` **403** — CF가 GitHub 러너 IP 차단(iMac은 UA 무관 200) → 스모크를 배포 고유 pages.dev URL 2회 히트로 변경, monk.kr은 참고 출력 |
| 4 | 35954533890 | ✅ | 배포 완료 · pages.dev 2경로 200 · 배포 커밋 afeb748 |

## 라이브 판정
- iMac 2회 히트 `/monk_studio/monk_studio` 200, `v=20260924` 6건 — 12:42 배포본과 동일(변경 0이므로 "Uploaded 0 files" 정상).
- 판정 방법: 워크플로 = pages.dev 2회 히트 / 공개 도메인 = 승인자 기기 2회 히트(러너 403 함정 명시).

## 남은 것
- ch5 1조 개정 청구 쌍아 심사(PETITION_20260924). 심사 전까지 워크플로는 존재하되 **작가님 승인 하에서만 실행**.
- `deploy-cf.md`·`deployment.md` 동기(쌍아). 토큰 만료 2027-09-24 — secret_patrol 감시 대상.

✅ 버튼 배포 체계 가동 — 어느 기기에서든 `gh workflow run deploy-monk-kr.yml -f reason="…"` 또는 GitHub Actions Run 버튼
✅ 시크릿 2종 GCP 정본 + GitHub 등재, 인벤토리 자동 반영
💡 GitHub Secrets 빈값 사고 — `gh secret set`은 입력이 안 보여 Enter만 쳐도 성공 표시. 다음부터 SM 정본 → 파이프 등록을 표준으로
💡 CF가 러너 IP를 403 처리 — CI에서 공개 도메인 스모크는 무효, 배포 고유 URL로
⏳ 쌍아 심사·규정 동기
📁 본 문서 · 워크플로(4수정) · 세션 로그 · PF_KKU

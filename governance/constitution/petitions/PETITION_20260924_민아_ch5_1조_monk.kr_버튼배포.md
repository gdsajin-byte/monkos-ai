---
type: petition
date: 2026-09-24
petitioner: "iMac/민아"
origin: 작가님 질의·승인 (2026-09-24 12:38 "제안대로 모두 처리해 승인한다")
subject: 법률 ch5 1조 개정 — monk.kr 배포를 "wrangler 수동 실행만"에서 "승인자 트리거의 GitHub Actions 버튼 배포"로
status: "심사 중"
procedure: "삼권심사 (법률 개정 사안 — 작가님 지시 09-26로 상향 적용)"
---

# 청구안: ch5 1조 monk.kr 버튼 배포

**[2026-09-24 12:43 KST]** iMac/민아 → 쌍아 (참조: 작가님)

## 1. 경위

- ch5 1조: "자동빌드 OFF. 배포 = `wrangler pages deploy` 수동 실행만." 근거 = 02-20 작가님 원문 "깃을 훅킹하는 자동 프로덕션이 푸시할 때마다 혼돈" (당시 develop→main 56커밋 격차).
- 09-24 실측: M2/쌍아가 09-19·09-23 푸시한 monk.kr 변경 7파일이 **닷새간 미배포**. M2에 wrangler 미설치·미인증. iMac 민아가 작가님 승인 후 수동 배포([예외]).
- 같은 날 적발: 카드 이미지 17장이 gitignore로 미추적 → 배포자 기기 디스크가 라이브를 결정(배포자 종속). 09-24 리사이즈·편입으로 해소(7c1a0bde).

## 2. 청구 취지

"수동 실행만"을 "**승인자가 트리거하는 배포**"로 바꾼다. 푸시 자동 배포는 계속 금지한다.

- 허용 경로 2: ① 기존 `wrangler pages deploy` 수동 실행 ② GitHub Actions `deploy-monk-kr.yml`의 `workflow_dispatch`(Run 버튼 / `gh workflow run`) — 사유 입력 필수
- 트리거 권한 = 작가님, 또는 작가님 승인을 세션 로그에 기록한 에이전트
- 02-20 우려(푸시=배포)는 그대로 차단됨: 워크플로에 `push` 트리거 없음

## 3. 개정 조문안 (ch5 1조)

```
- 자동빌드 OFF. Git push = 코드 저장만. 배포 ≠ push. (유지)
- 배포 = 승인자 트리거만: ① wrangler pages deploy 수동 실행 ② .github/workflows/deploy-monk-kr.yml workflow_dispatch(사유 입력). push 트리거 금지.
- 표준 명령·CWD·functions 정본 조항 (유지)
- 배포 산출물은 git 추적 파일만이다. 배포 대상 디렉터리의 미추적 자산 금지 (09-24 이미지 종속 사고 근거).
```

## 4. 영향

- `.claude/commands/deploy-cf.md` — 경로 ② 추가 (쌍아 소관)
- `.claude/rules/deployment.md` — 1행 동기화 (쌍아 소관)
- 시크릿 2종 신설: `CF_PAGES_DEPLOY_TOKEN`(Cloudflare Pages: Edit 스코프 전용 토큰 — 기존 CF_API_TOKEN은 DNS용, 재사용 금지) · `CF_ACCOUNT_ID`. GitHub Secrets 등록 = `secret` 프로토콜, 인벤토리 메타 2행.
- 워크플로 파일은 본 청구와 함께 커밋되나 **시크릿 미등록 상태에서는 실행 불가** — 개정 승인 + 시크릿 등록 후 첫 실행을 COMPLETION으로 기록.

## 5. 막내 영향평가 요청 (2명↑)

- 워크플로 스모크(2회 히트)가 live-verify 규칙에 부합하는가 / 동시 실행 잠금(concurrency) 적정성 / 미추적 자산 금지 조항의 다른 서비스 파급

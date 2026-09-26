---
name: CF배포
description: monk.kr CF Pages 배포 절차를 수행한다
---

> 원천: ch5 1조 (monk.kr 배포)
> source: governance/laws/ch5_deployment.md@2026-09-26

## 0단계 — 승인 확인 (필수)

1. monk.kr 배포 트리거 권한은 **작가님**이다. 에이전트는 **새 사용자 턴으로 도착한 작가님 승인**을 받은 뒤에만 진행한다 (ch1 7조 2항). 같은 응답 안에서 스스로 만든 승인은 승인이 아니다.
2. 1회 승인 = 1회 트리거(당일 한정). 데몬·크론 등 무인 맥락에서는 실행 금지.
3. 승인 수신 시각을 기록해 둔다 (4단계 사유 서식에 쓴다).

## 1단계 — 경로 선택

- **기본 = 버튼 배포** (2단계). 기기·로컬 자격증명과 무관하게 git 추적 파일만 배포된다.
- **예비 = wrangler 수동** (3단계). 버튼이 불능일 때만. 사용 시 세션 로그에 `[1조 예비경로: 사유]`.

## 2단계 — 버튼 배포 (기본)

작가님 직접: GitHub → Actions → **Deploy monk.kr (CF Pages)** → Run workflow.

에이전트(승인 수신 후):
```bash
gh workflow run deploy-monk-kr.yml -f reason="{주체} | {승인 수신 시각} | {사유}"
# 예: -f reason="iMac/막내1 | 2026-09-26 16:10 | 길찾기 버튼 반영"
# 작가님 직접 실행 시 승인 시각 자리에 "직접"
```
- 특정 커밋 배포·롤백: `-f sha={커밋}` (워크플로 구현 완료 후 사용 가능 — ch5 1조 부칙)
- 트리거 후 세션 로그에 **run ID · 배포 커밋 SHA · 승인 수신 시각** 기재. 미기재 = 무승인 배포 간주.

## 3단계 — wrangler 수동 배포 (예비)

1. CWD = **프로젝트 루트** (wrangler가 CWD의 `functions/`를 참조).
2. 정본 확인: 루트 `functions/`가 실제 디렉토리(symlink 아님), `MONK_kr/functions/` 없음.
3. **클린 확인 — 비어 있어야 진행**:
   ```bash
   git status --porcelain MONK_kr/ functions/
   ```
   출력이 있으면 중단. wrangler는 dirty여도 경고만 내고 배포한다. 장애 대응으로 불가피하면 세션 로그에 사유 기재 후 진행.
4. 표준 명령 (wrangler 버전 정본 = `package.json`):
   ```bash
   npx wrangler pages deploy MONK_kr/ --project-name monk-kr --branch main --commit-dirty=true
   ```

## 4단계 — 결과 판정

1. **run 실패 표기 ≠ 미배포.** 스모크는 배포 뒤에 돈다. 실패 시 스텝 단위로 "CF Pages 배포" 스텝 성공 여부부터 확인한다.
2. **200은 존재 증거가 아니다.** CF Pages는 없는 경로에도 200을 준다. 변경한 페이지의 **실제 문자열**로 판정한다.
3. monk.kr 최종 판정 = **승인자 기기에서 2회 히트** (러너는 monk.kr에서 403):
   ```bash
   curl -s -o /dev/null "https://monk.kr/{경로}"        # 1차 — 버림
   curl -s "https://monk.kr/{경로}" | grep -c "{변경 문자열}"   # 2차 — 판정
   ```

## 5단계 — 롤백 (필요 시)

- 버튼에 직전 정상 커밋 `sha`를 지정해 재배포. 불능 시 CF 대시보드 → monk-kr → 직전 배포로 되돌림. 롤백 단위 = 커밋.

## 6단계 — 완료 보고

- 경로(버튼/예비), run ID 또는 배포 URL, 배포 커밋 SHA, 판정 방법(2회 히트·대조 문자열)을 명시한다.

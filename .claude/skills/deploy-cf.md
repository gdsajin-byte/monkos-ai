---
name: CF배포
description: monk.kr CF Pages 배포 절차를 수행한다
---

> 원천: ch5 1조 (monk.kr 배포)

## CF Pages 배포 절차

### 1단계 — CWD 확인

1. 현재 작업 디렉토리가 **프로젝트 루트**인지 확인한다.
2. wrangler는 CWD의 `functions/`를 참조하므로 루트에서 실행해야 한다.

### 2단계 — 정본 확인

1. 루트 `functions/` 디렉토리가 실제 디렉토리(symlink 아님)인지 확인한다.
2. `MONK_kr/functions/`는 없음 (2/20 제거 완료).
3. 정본은 **루트 `functions/`만** 유효하다.

### 3단계 — 배포 실행

1. 아래 표준 명령을 실행한다:
   ```bash
   npx wrangler pages deploy MONK_kr/ --project-name monk-kr --branch main --commit-dirty=true
   ```
2. **자동빌드 OFF** — Git push = 코드 저장만. 배포 ≠ push.
3. Production = `--branch main`, Preview = 미지정.

### 4단계 — 배포 결과 확인

1. wrangler 출력에서 배포 URL과 성공 여부를 확인한다.
2. 에러 발생 시 에스컬레이션 (ch7 4조).

### 5단계 — 완료 보고

1. 배포 결과를 완료 보고에 포함한다.
2. 배포 URL, 성공/실패 여부를 명시한다.

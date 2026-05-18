---
description: git 명령 실행 시 적용
globs:
  - "**"
---

# Git 안전 규칙 (ch6 · 헌법 4조 발췌)

## 파괴적 명령 금지 (헌법 4조 2항)
- `rm -rf`, `git push --force`, `git reset --hard`, `git clean -f` 실행 금지.
- 작가님 명시 요청 시에만 예외.

## 커밋 규칙 (ch6)
- 브랜치: **main** 단일. develop 폐기.
- 커밋 메시지: `[카테고리] 요약` 형식.
- 카테고리: `feat`, `fix`, `refactor`, `docs`, `ops`, `cleanup`, `deploy`, `sync`, `research`, `정리`, `정산`, `헌법`

## 배포 (ch5)
- Cloud Run 배포는 **deploy.sh 경유 필수**. `gcloud run deploy` 직접 실행 금지.

## 비밀정보 (헌법 4조 1항)
- API 키, 토큰, 비밀번호 생성/추측 금지. placeholder도 금지.
- `.env`, `secrets/`, `deploy.sh` 수정 전 작가님 승인.

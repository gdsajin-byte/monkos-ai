---
type: order
date: 2026-07-24
device: iMac
agent: 쌍아
receiver: 막내
status: 완료
portfolio: PF_SECURITY
---

# 지시서 — gitleaks pre-commit 훅 설치

**[2026-07-24 12:00 KST]** iMac/쌍아 → 막내

> 근거: 민아 권고 — 보안 스프린트 봉합, 사후 탐지(웹민아 48h 순찰) → 사전 차단 이중화
> 참조: [REPORT_20260724_iMac민아_시크릿SA_종합감사](../reports/2026-07/REPORT_20260724_iMac민아_시크릿SA_종합감사.md) T3 항목

## ⚠️ 준수 조항
- 헌법 4조 1항 (비밀정보 보호)
- 기존 git hooks가 있으면 덮어쓰기 금지 — 체이닝 또는 병합

## 작업 목록

### 1. gitleaks 설치 (iMac 디바이스)

```bash
brew install gitleaks
gitleaks version
```

### 2. pre-commit 훅 스크립트 작성

- 위치: `scripts/tools/gitleaks-precommit.sh`
- 내용:
  - `gitleaks detect --staged --no-banner` 실행
  - 탐지 시 커밋 차단 + 파일명·라인 출력
  - exit 1 (차단) / exit 0 (통과)

### 3. .gitleaksignore 베이스라인 정책

- 위치: 프로젝트 루트 `.gitleaksignore`
- 기존 히스토리의 오탐 제외 (웹민아 순찰 문구 등)
- 실측 방법: `gitleaks detect --no-banner` (전체 스캔) → 오탐 커밋 해시 수집 → .gitleaksignore에 등재
- ⚠️ 실키가 히스토리에 발견되면 즉시 보고 (실행 금지)

### 4. 훅 연결

- `.git/hooks/pre-commit`에 `scripts/tools/gitleaks-precommit.sh` 호출 추가
- 기존 pre-commit 훅이 있으면 체이닝 (기존 훅 실행 → gitleaks 실행)
- 없으면 신규 생성

### 5. 스모크 테스트

- 테스트 파일에 더미 API 키 패턴 삽입 → `git add` → `git commit` → 차단 확인
- 더미 제거 → 정상 커밋 통과 확인
- ⚠️ 테스트 후 더미 파일 반드시 삭제

### 6. 도구 등재 (3요건)

- `references.md` 도구 맵에 gitleaks 등재
- 스모크 결과를 완료 보고에 포함
- 실패 시 명시 에러 출력 확인

## 타 디바이스 (이관 정보)

- M1, M2, 4060: 각 디바이스에서 별도 설치 필요 (brew 또는 바이너리)
- 본 지시서는 iMac만 대상. 타 디바이스는 후속 지시서로 분리

## 완료 보고
- 수발신 헤더 + ✅❌💡⏳📁🔀 형식
- COMPLETION 보고서 파일 필수
- 스모크 테스트 결과 포함

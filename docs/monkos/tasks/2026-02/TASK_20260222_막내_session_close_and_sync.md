# 지시서: 세션 마감 — 커밋/push/머지 동기화

> [2026-02-22 19:03 KST] iMac/쌍아 → 막내 (집 세션)

## 역할 선언
> **너는 "막내"다.** 집 디바이스에서 실행.
> - 완료 보고: `{디바이스}/막내 → iMac/쌍아` 형식

## ⚠️ 준수 조항
- 법률 제6장 (브랜치/커밋): develop 브랜치 기본
- 법률 제5장 3조: main 머지는 본 지시서의 특별법 위임

## 배경
iMac PM2 세션 마감. develop이 main보다 4커밋 앞섬.
미커밋 파일(세션 로그 + 지시서)이 남아있음.

## 작업

### 1. git pull + 현황 확인

```bash
cd ~/developer/monk_project  # 또는 해당 경로
git checkout develop
git pull origin develop
git status -s
git log --oneline develop -5
git log --oneline main -5
```

### 2. 미커밋 파일 커밋

```bash
# 세션 로그 + 지시서
git add monkos-ops/06_로그/sessions/2026-02-22_iMac_쌍아_PM2.md
git add docs/monkos/TASK_20260222_막내2_phase1_prod_deploy.md
git add docs/monkos/TASK_20260222_막내3_phase1_cf_deploy.md
git add docs/monkos/TASK_20260222_막내_session_close_and_sync.md
git commit -m "[docs] PM2 세션 로그 + Phase 1 지시서 3건 커밋"
git push origin develop
```

⚠️ `git status`에서 다른 미커밋 파일이 있으면 판단하여 포함. package-lock.json은 제외.

### 3. develop → main 동기화

```bash
git checkout main
git pull origin main
git merge develop --no-edit
git push origin main
git checkout develop
```

⚠️ 충돌 시 중단 + 보고. 강제 해결 금지.

### 4. MEMORY.md 갱신

아래 항목 반영:
- `teams/` 참조 → `monkos-ops/05_공유/` 경로 변경
- `constitution/amendment.md` 추가 (헌법 전조문)
- Phase 1 prod 배포 완료 기록 (idphoto-kr 00096, portal 00078, CF 26af498e)

### 5. 검증

```bash
git log --oneline main -3
git log --oneline develop -3
# main과 develop HEAD가 동일해야 함
```

## 엔드라인
| 항목 | 내용 |
|------|------|
| 마무리 | `커밋+push+main머지+MEMORY갱신` |
| 산출물 | 브랜치 동기화 완료 |
| 문서 유형 | 해당 없음 |
| 세션 로그 | PM2 세션 로그에 포함 완료 |

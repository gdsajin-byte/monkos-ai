# 지시서: Phase 1 Prod 배포 — Cloud Run (idphoto-kr + portal)

> [2026-02-22 18:20 KST] iMac/쌍아 → 막내2
> [특별법] 작가님-쌍아 합의에 의한 prod 배포 위임

## 역할 선언
> **너는 "막내2호"다. 쌍아가 아니다.**
> - 완료 보고: `{디바이스}/막내2 → iMac/쌍아` 형식

## ⚠️ 준수 조항
- 헌법 제6조 (인프라 보호): .env, secrets 절대 수정 금지
- 법률 제5장 2조 (Cloud Run): 반드시 `deploy.sh` 경유
- 법률 제5장 3조 (prod 권한): `[특별법]` 위임에 의한 실행
- 법률 제6장 (브랜치/커밋): develop→main 머지 후 prod 배포

## 배경
idphoto-kr dev `00010-s22`와 portal dev `00009-ccp`가 검증 완료.
v2 가격 통일 + dead code 정리 + 텔레그램 보너스 + RAG v2 등 20+ 커밋이 develop에 쌓여있고, prod에는 미반영.
작가님-쌍아 합의로 ch5 4조 idphoto-kr 동결 해제, ch5 3조 예외 조항으로 prod 배포 위임됨.

## 작업

### 1. 미커밋 파일 커밋 (develop)

```bash
# 1-1. ch5 법률 개정 커밋
git add docs/infrastructure/laws/ch5_deployment.md
git commit -m "[법률] ch5 3조 예외 신설 + 4조 동결 해제 — 특별법 prod 배포 위임"

# 1-2. 지시서 6건 + 한송이 보정지시 일괄 커밋
git add docs/monkos/TASK_20260222_*.md
git add teams/han/inbox/20260222_X운영_보정지시.md
git commit -m "[docs] 지시서 6건 + 한송이 X운영 보정지시 일괄 커밋"

# 1-3. monkos-ops 철학 콘텐츠 (untracked 확인 후)
git add monkos-ops/01_전략/philosophy/
git commit -m "[docs] monkos-ops 철학 파생 콘텐츠 추가"

# 1-4. push
git push origin develop
```

⚠️ `package-lock.json` 파일들은 커밋하지 마라 (apps/, monkos_AI/, 루트).

### 2. develop → main 머지

```bash
git checkout main
git pull origin main
git merge develop --no-edit
git push origin main
```

⚠️ 머지 충돌 시 **중단하고 보고**. 강제 해결 금지.

### 3. idphoto-kr prod 배포

```bash
cd monkos_AI/idphoto-kr
echo y | ./deploy.sh prod
```

- 타임아웃 10분 (gcloud builds submit + deploy)
- 완료 후 health check: `curl -s https://monkos-idphoto-kr-4jeplpqpua-uc.a.run.app/health`

### 4. portal prod 배포

```bash
cd monkos_AI/portal
echo y | ./deploy.sh prod
```

- 타임아웃 10분
- 완료 후 health check: `curl -s https://monkos-portal-4jeplpqpua-uc.a.run.app/health`

### 5. 마무리

```bash
git checkout develop
```

## 검증 항목
- [ ] idphoto-kr prod health 200 OK
- [ ] portal prod health 200 OK
- [ ] idphoto-kr prod LP(/) 접속 확인
- [ ] portal prod LP(/) 접속 확인
- [ ] main 브랜치 push 확인 (`git log --oneline origin/main -1`)

## 엔드라인
| 항목 | 내용 |
|------|------|
| 마무리 | `커밋+push+prod배포×2+health check` |
| 산출물 | Cloud Run 서비스 2개 (monkos-idphoto-kr, monkos-portal) |
| 문서 유형 | 해당 없음 |
| 세션 로그 | 해당 없음 (쌍아가 PM2 세션 로그에 통합) |

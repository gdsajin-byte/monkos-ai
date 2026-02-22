# 지시서: Phase 1 — monk.kr CF Pages prod 배포 + 전체 스모크 테스트

> [2026-02-22 18:20 KST] iMac/쌍아 → 막내3
> [특별법] 작가님-쌍아 합의에 의한 prod 배포 위임

## 역할 선언
> **너는 "막내3호"다. 쌍아가 아니다.**
> - 완료 보고: `{디바이스}/막내3 → iMac/쌍아` 형식

## ⚠️ 준수 조항
- 헌법 제6조 (인프라 보호): API 키/시크릿 수정 금지
- 법률 제5장 1조 (CF Pages): `wrangler pages deploy` 수동 실행만 허용, `--branch main` 필수
- 법률 제5장 3조 (prod 권한): `[특별법]` 위임에 의한 실행

## ⚠️ 선행 조건
> **막내2가 develop→main 머지+push를 완료한 후 실행.**
> 시작 전 반드시 확인:
> ```bash
> git fetch origin
> git log --oneline origin/main -3
> ```
> 최신 커밋이 `[법률] ch5 3조 예외 신설` 이후 커밋이어야 함.
> 확인되지 않으면 **대기 후 재확인** (최대 3회, 간격 60초).

## 배경
막내2가 Cloud Run 2개 서비스(idphoto-kr, portal) prod 배포를 수행 중.
monk.kr CF Pages는 별도 배포 라인(wrangler CLI). main 브랜치 기준 배포.
develop에서 추가된 `functions/api/*.js` 변경사항이 prod에 미반영 상태.

## 작업

### 1. main 브랜치 체크아웃

```bash
git checkout main
git pull origin main
```

### 2. monk.kr CF Pages prod 배포

```bash
npx wrangler pages deploy MONK_kr/ --project-name monk-kr --branch main --commit-dirty=true
```

- CWD = **프로젝트 루트** (wrangler가 루트 `functions/`를 참조)
- `--branch main` = Production 환경
- 배포 후 Functions 목록 확인 (터미널 출력에 표시됨)

### 3. develop 복귀

```bash
git checkout develop
```

### 4. 전체 서비스 스모크 테스트

3개 프로덕션 서비스 전체 헬스 체크:

```bash
# idphoto-kr prod
curl -s -o /dev/null -w "%{http_code}" https://monkos-idphoto-kr-4jeplpqpua-uc.a.run.app/health

# portal prod
curl -s -o /dev/null -w "%{http_code}" https://monkos-portal-4jeplpqpua-uc.a.run.app/health

# monk.kr CF Pages (메인 페이지)
curl -s -o /dev/null -w "%{http_code}" https://monk.kr/

# monk.kr CF Functions (API 엔드포인트)
curl -s -o /dev/null -w "%{http_code}" https://monk.kr/api/ads
```

### 5. 결과 보고 형식

```
✅ 배포 결과
- monk.kr CF Pages: 배포 ID [xxx], Functions [N]개 감지
- idphoto-kr prod: HTTP [코드]
- portal prod: HTTP [코드]
- monk.kr: HTTP [코드]
- monk.kr /api/ads: HTTP [코드]
```

## 엔드라인
| 항목 | 내용 |
|------|------|
| 마무리 | `CF배포+스모크테스트` |
| 산출물 | monk.kr 프로덕션 배포 + 전체 헬스 리포트 |
| 문서 유형 | 해당 없음 |
| 세션 로그 | 해당 없음 (쌍아가 PM2 세션 로그에 통합) |

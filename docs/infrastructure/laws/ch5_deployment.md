# 법률 제5장: 배포 규칙

> 상위 헌법: 제6조(인프라 보호), 제10조(프로덕션 동결)
> 변경 권한: 작가님 승인 시 개정 가능

---

### 1조: monk.kr 배포 (CF Pages)

- **자동빌드 OFF.** Git push = 코드 저장만. **배포 ≠ push.**
- 배포 = `wrangler pages deploy` **수동 실행만** 허용.
- Production = `--branch main`, Preview = 미지정.
- **표준 명령**: `npx wrangler pages deploy MONK_kr/ --project-name monk-kr --branch main --commit-dirty=true`
- CWD = 프로젝트 루트에서 실행 (wrangler가 CWD의 `functions/`를 참조).
- 정본: **루트 `functions/`** (실제 디렉토리). `MONK_kr/functions/`는 없음 (2/20 제거).

> 근거: 2026-02-20 자동빌드 OFF 결정. develop→main 56커밋 격차.
> 작가님 원문: "깃을 훅킹하는 자동프로덕션이 푸시할때마다 혼돈을 초래하고 있다" (02-20)
> 위반 시: 멀티 에이전트 push가 자동 프로덕션 배포 유발 → 미검증 코드 배포.
> 상위 헌법: 제6조(인프라 보호)

---

### 2조: monkos.ai 배포 (Cloud Run)

- 반드시 `deploy.sh` 경유. `gcloud run deploy` 직접 실행 **금지**. `gcloud builds submit` 단독 **금지**.
- 배포 타겟: 전 서비스 `us-central1` (MEMORY.md 참조).
- `./deploy.sh dev` — 막내 허용 (develop 브랜치에서만).
- dev 배포 후 **반드시 동작 확인** → 완료 보고에 결과 명시.
- prod 배포가 필요한 경우 `⏳ 대기: prod 배포 필요` 명시.

> 근거: CLAUDE.md L290-301, 2026-02-16 유령 서비스 발견 교훈
> 위반 시: 배포 추적 불가, 유령 서비스 발생.
> 상위 헌법: 제6조(인프라 보호)

---

### 3조: prod 배포 권한

- `./deploy.sh prod`는 **작가님/쌍아만 실행** 가능.
- 막내는 실행 **금지**.

> 근거: CLAUDE.md L295
> 상위 헌법: 제6조

---

### 4조: 프로덕션 동결

현재 동결 대상:
- **`monkos_AI/idphoto-kr/`** (00079-tpk) — 수정/배포 금지.
- 작업장은 `MONK_kr/ai_lab/photolab/`.
- 동결 해제: 작가님 명시적 지시 시에만.

> 근거: 2026-02-17 Plan B 결정 (00079 동결 + 리팩토링 전환)
> 작가님 원문: "플랜 b 로 가되 기술명세를 정밀하게 작성하라. 거의 이틀을 여기에 도전했는데 해결이 안됨. 리팩토링 타이밍임이 분명함." (02-17)
> 위반 시: 13회 전패 재발 (2/16~2/19 카메라 사망)
> 상위 헌법: 제10조(프로덕션 동결)
> 예외: 작가님 직접 지시로 긴급 수술 가능 (02-19 QC 제거 선례)

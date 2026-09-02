---
name: CR배포
description: monkos.ai Cloud Run 배포 절차를 수행한다
allowed-tools:
  - Bash(*/deploy.sh *)
---

> 원천: ch5 2조 (monkos.ai 배포) + ch5 3조 (prod 배포 권한)

## deploy.sh 위치

!`find monkos_AI/*/deploy.sh apps/*/backend/deploy.sh -type f 2>/dev/null`

## 인자

`$ARGUMENTS`에서 서비스명과 환경(dev/prod)을 파싱한다.
- 예: `/CR배포 portal prod` → 서비스=portal, 환경=prod
- 인자 없으면 서비스와 환경을 질문한다.

## 절차

1. **deploy.sh 경유 필수** — `gcloud run deploy` 직접 실행 금지.
2. 인자에서 서비스 매핑:

| 서비스명 | deploy.sh 경로 |
|---------|---------------|
| portal | `monkos_AI/portal/deploy.sh` |
| idphoto-kr | `monkos_AI/idphoto-kr/deploy.sh` |
| idphoto-jp | `monkos_AI/idphoto-jp/deploy.sh` |
| studio | `monkos_AI/studio/deploy.sh` |
| image-engine | `apps/monk_imagen4/backend/deploy.sh` |

3. dev 배포: 막내 허용. 배포 후 동작 확인 필수.
4. prod 배포: **작가님/쌍아만 실행**. 막내는 지시서에 `[특별법]` 명기 시에만.
5. 완료 보고: 배포 결과 + 리비전 번호 + 동작 확인 결과.

---

## ⚠️ 배포 게이트 표준 (ch5 6조, 2026-09-02 신설)

`deploy.sh`는 다음을 갖춘다 — 엄격모드 `set -euo pipefail`(미정의 변수는 `${VAR:-}`) / 미커밋 게이트(**서비스 디렉터리** 기준 차단, `--yes` 시 경고 후 진행) / 드리프트 감지(정적 산출물 별도 빌드 서비스 한정, **gitignore 산출물 제외**) / 사후 스모크(공개 도메인 한정, **드리프트 원장 기록 이후 종료**) / 이중 소스 경고.

- **무음 강등 금지** — 조건 미충족으로 건너뛸 때도 그 사실을 출력한다. 3·4 비적용 시 주석 1행으로 사유.
- 게이트 미비 배포 시 **지시서 또는 세션 로그**에 `[5장 6조 예외: 사유]` 명기.
- 유예: 게이트 1·2·5 = **14일** / 3·4 = **60일** (발효 2026-09-02).
- 배포 후 반영 판정은 **ch5 7조 라이브 검증** 준수 — 캐시 경유 GET은 2회 히트, 비멱등 엔드포인트는 로그·DB 조회, min-instances 0 오리진의 1차 지연은 실패로 계상하지 않는다.
